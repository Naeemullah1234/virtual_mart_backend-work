const EmailJob = require("../models/emailJob.model");
const {
  encryptPayload,
} = require("../utils/emailPayloadEncryption");

const createEmailJob = async ({
  jobId,
  type,
  recipient,
  payload,
  jobExpiresAt = null,
  maxAttempts = 5,
}) => {
  if (!jobId || !type || !recipient || !payload) {
    throw new Error("Required email job data is missing.");
  }

  const normalizedRecipient = recipient.trim().toLowerCase();

  const encryptedPayload = encryptPayload(payload);

  try {
    const emailJob = await EmailJob.create({
      jobId,
      type,
      recipient: normalizedRecipient,
      payloadEncrypted: encryptedPayload,
      jobExpiresAt,
      maxAttempts,
      status: "pending",
      nextAttemptAt: new Date(),
    });

    return {
      created: true,
      jobId: emailJob.jobId,
      status: emailJob.status,
    };
  } catch (error) {
    // Handle duplicate job creation safely
    if (error.code === 11000) {
      const existingJob = await EmailJob.findOne({ jobId })
        .select("jobId status");

      if (existingJob) {
        return {
          created: false,
          duplicate: true,
          jobId: existingJob.jobId,
          status: existingJob.status,
        };
      }
    }

    throw error;
  }
};

module.exports = {
  createEmailJob,
};
