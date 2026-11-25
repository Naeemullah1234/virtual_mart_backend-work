
const EmailJob = require("../models/emailJob.model");
const emailQueue = require("../queues/email.queue");

const BATCH_SIZE = 50;
const DISPATCH_INTERVAL = 5000;
const FAILED_RETENTION_DAYS = 7;

let dispatcherRunning = false;

const getDeleteDate = () =>
  new Date(
    Date.now() +
      FAILED_RETENTION_DAYS * 24 * 60 * 60 * 1000
  );

const dispatchEmailJobs = async () => {
  if (dispatcherRunning) return;

  dispatcherRunning = true;

  try {
    const now = new Date();

    // 1. Expire jobs whose validity period has ended
    await EmailJob.updateMany(
      {
        status: { $in: ["pending", "queued"] },
        jobExpiresAt: { $ne: null, $lte: now },
      },
      {
        $set: {
          status: "expired",
          expiredAt: now,
          deleteAt: getDeleteDate(),
        },
      }
    );

    // 2. Recover jobs whose worker lock has expired
    const expiredLocks = await EmailJob.find({
      status: "processing",
      lockedUntil: { $lte: now },
    })
      .select("_id attempts maxAttempts jobExpiresAt")
      .limit(BATCH_SIZE);

    for (const job of expiredLocks) {
      const isExpired =
        job.jobExpiresAt && job.jobExpiresAt <= now;

      const hasReachedMaxAttempts =
        job.attempts >= job.maxAttempts;

      if (isExpired) {
        await EmailJob.updateOne(
          {
            _id: job._id,
            status: "processing",
            lockedUntil: { $lte: now },
          },
          {
            $set: {
              status: "expired",
              expiredAt: now,
              deleteAt: getDeleteDate(),
              lockedAt: null,
              lockedUntil: null,
              lockToken: null,
            },
          }
        );

      } else if (hasReachedMaxAttempts) {
        await EmailJob.updateOne(
          {
            _id: job._id,
            status: "processing",
            lockedUntil: { $lte: now },
          },
          {
            $set: {
              status: "failed",
              failedAt: now,
              deleteAt: getDeleteDate(),
              lockedAt: null,
              lockedUntil: null,
              lockToken: null,
              lastError: "Maximum attempts reached after worker interruption.",
            },
          }
        );

      } else {
        await EmailJob.updateOne(
          {
            _id: job._id,
            status: "processing",
            lockedUntil: { $lte: now },
          },
          {
            $set: {
              status: "pending",
              nextAttemptAt: now,
              lockedAt: null,
              lockedUntil: null,
              lockToken: null,
            },
          }
        );
      }
    }

    // 3. Find jobs ready for dispatch
    const jobs = await EmailJob.find({
      status: { $in: ["pending", "queued"] },
      nextAttemptAt: { $lte: now },
      $or: [
        { jobExpiresAt: null },
        { jobExpiresAt: { $gt: now } },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(BATCH_SIZE)
      .select("jobId type status");

    // 4. Add jobs to BullMQ
    for (const job of jobs) {
      try {
        if (job.status === "pending") {
          const claimedJob = await EmailJob.findOneAndUpdate(
            {
              _id: job._id,
              status: "pending",
            },
            {
              $set: {
                status: "queued",
              },
            },
            { new: true }
          );

          if (!claimedJob) continue;
        }

        await emailQueue.add(
          job.type,
          {
            jobId: job.jobId,
          },
          {
            jobId: `email-${job.jobId}`,
          }
        );

      } catch (error) {
        console.error(
          `Email dispatch failed (${job.jobId}):`,
          error.message
        );
      }
    }

  } catch (error) {
    console.error("EMAIL DISPATCHER ERROR:", error);

  } finally {
    dispatcherRunning = false;
  }
};

let dispatcherInterval = null;

const startEmailDispatcher = () => {
  if (dispatcherInterval) return;

  console.log("Email dispatcher starting...");

  dispatchEmailJobs();

  dispatcherInterval = setInterval(() => {
    dispatchEmailJobs();
  }, DISPATCH_INTERVAL);

  console.log("Email dispatcher scheduled every 5 seconds.");
};

module.exports = {
  startEmailDispatcher,
  dispatchEmailJobs,
};
