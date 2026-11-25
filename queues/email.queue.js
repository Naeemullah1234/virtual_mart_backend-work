
require("dotenv").config();

const { Queue } = require("bullmq");
const IORedis = require("ioredis");

const redisConnection = new IORedis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,

  maxRetriesPerRequest: null,

  retryStrategy: (times) => {
    return Math.min(times * 1000, 10000);
  },
});

redisConnection.on("connect", () => {
  console.log("BullMQ Redis connecting...");
});

redisConnection.on("ready", () => {
  console.log("BullMQ Redis connected successfully!");
});

redisConnection.on("error", (error) => {
  console.error("BullMQ Redis Error:", error.message);
});

const emailQueue = new Queue("emailQueue", {
  connection: redisConnection,

  defaultJobOptions: {
    // MongoDB will manage email retries.
    // BullMQ is only responsible for queue processing.
    removeOnComplete: true,
    removeOnFail: true,
  },
});

module.exports = emailQueue;
