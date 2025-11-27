const Queue = require("bull");
const { redisOptions } = require("../configs/redis");

// Create Email Queue
const emailQueue = new Queue("email", {
  redis: redisOptions,
  defaultJobOptions: {
    attempts: 3, // Retry 3 lần nếu thất bại
    backoff: {
      type: "exponential",
      delay: 5000, // Delay 5s, 10s, 20s...
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

// Queue events
emailQueue.on("error", (error) => {
  console.error("❌ Email Queue Error:", error);
});

emailQueue.on("completed", (job) => {
  console.log(`✅ Email Job ${job.id} completed`);
});

emailQueue.on("failed", (job, err) => {
  console.error(`❌ Email Job ${job.id} failed:`, err.message);
});

module.exports = emailQueue;
