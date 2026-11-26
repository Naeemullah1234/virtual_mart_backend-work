require("dotenv").config();

const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const crypto = require("crypto");
const connectDB = require("../config/db");
const EmailJob = require("../models/emailJob.model");
const PendingCustomerRegistration = require("../models/pendingCustomerRegistration.model");
const { sendOTPEmail } = require("../utils/sendEmail");
const { decryptPayload } = require("../utils/emailPayloadEncryption");
const { hashOTP } = require("../utils/otpHash");

const LOCK_MINUTES = 10;
const FAILED_RETENTION_DAYS = 7;

const redisConnection = new IORedis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,

  retryStrategy: (times) => Math.min(times * 1000, 10000),
});

redisConnection.on("error", (error) => {
  console.error("EMAIL WORKER REDIS ERROR:", error.message);
});

const getDeleteDate = () =>
  new Date(
    Date.now() +
      FAILED_RETENTION_DAYS * 24 * 60 * 60 * 1000
  );

const processOTPEmail = async (job) => {
  const { jobId } = job.data;

  if (!jobId) {
    throw new Error("Email job ID is missing.");
  }

  const now = new Date();
  const lockToken = crypto.randomUUID();

  // 1. Atomically claim MongoDB job
  const emailJob = await EmailJob.findOneAndUpdate(
    {
      jobId,
      type: "sendOTP",
      status: "queued",
     $expr: {
  $lt: ["$attempts", "$maxAttempts"],
},
      $or: [
        { jobExpiresAt: null },
        { jobExpiresAt: { $gt: now } },
      ],
    },
    {
      $set: {
        status: "processing",
        lockToken,
        lockedAt: now,
        lockedUntil: new Date(
          now.getTime() + LOCK_MINUTES * 60 * 1000
        ),
      },
      $inc: {
        attempts: 1,
      },
    },
    {
      new: true,
    }
  ).select("+payloadEncrypted");

  // Another worker may already have claimed or completed it
  if (!emailJob) {
    console.log(`Email job not claimable: ${jobId}`);
    return;
  }

    // Renew MongoDB lock every 2 minutes
const lockRenewal = setInterval(async () => {
  try {
    const renewed = await EmailJob.updateOne(
      {
        _id: emailJob._id,
        status: "processing",
        lockToken,
      },
      {
        $set: {
          lockedUntil: new Date(
            Date.now() + LOCK_MINUTES * 60 * 1000
          ),
        },
      }
    );

    if (renewed.modifiedCount !== 1) {
      console.error(
        `MongoDB lock renewal failed: ${jobId}`
      );
    }
  } catch (error) {
    console.error(
      `MongoDB lock renewal error (${jobId}):`,
      error.message
    );
  }
}, 2 * 60 * 1000);

lockRenewal.unref();

  try {
    // 2. Check pending registration and OTP expiry
    const registration =
      await PendingCustomerRegistration.findOne({
        email: emailJob.recipient,
        expiresAt: { $gt: new Date() },
        otpExpiresAt: { $gt: new Date() },
      });

    if (!registration) {
      throw new Error(
        "Registration or OTP has expired."
      );
    }

    // 3. Decrypt payload
    const payload = decryptPayload(
      emailJob.payloadEncrypted
    );

    const { email, otp } = payload;

    if (
      !email ||
      !otp ||
      email.trim().toLowerCase() !== emailJob.recipient
    ) {
      throw new Error("Invalid OTP email payload.");
    }

    // 4. Verify this is still the latest OTP
    if (hashOTP(otp) !== registration.otpHash) {
      throw new Error("OTP has been replaced by a newer OTP.");
    }

    // 5. Send email
    await sendOTPEmail(email, otp);

    // 6. Mark job completed only if we still own its lock
    const completed = await EmailJob.updateOne(
      {
        _id: emailJob._id,
        status: "processing",
        lockToken,
      },
      {
        $set: {
          status: "completed",
          completedAt: new Date(),
          deleteAt: new Date(),
          lockedAt: null,
          lockedUntil: null,
          lockToken: null,
          lastError: null,
        },
      }
    );

    if (completed.modifiedCount !== 1) {
      console.error(
        "Email sent, but MongoDB completion lock was lost:",
        jobId
      );
    }

  } catch (error) {
    const attempts = emailJob.attempts;
    const now = new Date();

    const isExpired =
      error.message.includes("expired") ||
      error.message.includes("replaced");

    const isFinalAttempt =
      attempts >= emailJob.maxAttempts;

    const delayMinutes = Math.min(
      2 ** attempts,
      60
    );

    const update = isExpired
      ? {
          $set: {
            status: "expired",
            expiredAt: now,
            deleteAt: getDeleteDate(),
            lastError: error.message,
            lockedAt: null,
            lockedUntil: null,
            lockToken: null,
          },
        }
      : isFinalAttempt
      ? {
          $set: {
            status: "failed",
            failedAt: now,
            deleteAt: getDeleteDate(),
            lastError: error.message,
            lockedAt: null,
            lockedUntil: null,
            lockToken: null,
          },
        }
      : {
          $set: {
            status: "pending",
            nextAttemptAt: new Date(
              now.getTime() + delayMinutes * 60 * 1000
            ),
            lastError: error.message,
            lockedAt: null,
            lockedUntil: null,
            lockToken: null,
          },
        };

    await EmailJob.updateOne(
      {
        _id: emailJob._id,
        status: "processing",
        lockToken,
      },
      update
    );

    console.error(
      `OTP email processing failed (${jobId}):`,
      error.message
    );

    // BullMQ job will be removed.
    // MongoDB dispatcher will manage the next retry.
  }
  finally {
  clearInterval(lockRenewal);
}
};

const startEmailWorker = async () => {
  try {
    // 1. Connect MongoDB first
    await connectDB();

    // 2. Start BullMQ worker
    const emailWorker = new Worker(
      "emailQueue",
      async (job) => {
        if (job.name === "sendOTP") {
          await processOTPEmail(job);
        } else {
          throw new Error(
            `Unsupported email job: ${job.name}`
          );
        }
      },
      {
        connection: redisConnection,
        concurrency: 5,
        lockDuration: LOCK_MINUTES * 60 * 1000,
      }
    );

    emailWorker.on("completed", (job) => {
      console.log(`BullMQ job completed: ${job.id}`);
    });

    emailWorker.on("failed", (job, error) => {
      console.error(
        `BullMQ job failed (${job?.id}):`,
        error.message
      );
    });

    emailWorker.on("error", (error) => {
      console.error("EMAIL WORKER ERROR:", error);
    });

    console.log("Email Worker started successfully.");

  } catch (error) {
    console.error(
      "EMAIL WORKER STARTUP FAILED:",
      error
    );

    process.exit(1);
  }

};

startEmailWorker();
