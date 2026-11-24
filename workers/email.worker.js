
require("dotenv").config();

const { Worker } = require("bullmq");
const { sendOTPEmail } = require("../utils/sendEmail");

const emailWorker = new Worker(
  "emailQueue",
  async (job) => {
    if (job.name === "sendOTP") {
      const { email, otp } = job.data;

      await sendOTPEmail(email, otp);

      console.log(`OTP email sent successfully to ${email}`);
    } else {
      throw new Error(`Unknown email job: ${job.name}`);
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
    },
  }
);

emailWorker.on("completed", (job) => {
  console.log(`Email job ${job.id} completed`);
});

emailWorker.on("failed", (job, error) => {
  console.error(`Email job ${job?.id} failed:`, error.message);
});

emailWorker.on("error", (error) => {
  console.error("Email Worker Error:", error);
});

console.log("Email Worker is running...");

module.exports = emailWorker;
