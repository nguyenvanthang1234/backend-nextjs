const Queue = require("bull");
const { redisOptions } = require("../configs/redis");

// Create Notification Queue
const notificationQueue = new Queue("notification", {
  redis: redisOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 3000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

// Queue events
notificationQueue.on("error", (error) => {
  console.error("❌ Notification Queue Error:", error);
});

notificationQueue.on("completed", (job) => {
  console.log(`✅ Notification Job ${job.id} completed`);
});

notificationQueue.on("failed", (job, err) => {
  console.error(`❌ Notification Job ${job.id} failed:`, err.message);
});

module.exports = notificationQueue;
