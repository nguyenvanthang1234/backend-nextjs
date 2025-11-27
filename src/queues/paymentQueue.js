const Queue = require("bull");
const { redisOptions } = require("../configs/redis");

// Create Payment Queue
const paymentQueue = new Queue("payment", {
  redis: redisOptions,
  defaultJobOptions: {
    attempts: 5, // Payment critical nên retry nhiều hơn
    backoff: {
      type: "exponential",
      delay: 10000, // 10s delay
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

// Queue events
paymentQueue.on("error", (error) => {
  console.error("❌ Payment Queue Error:", error);
});

paymentQueue.on("completed", (job) => {
  console.log(`✅ Payment Job ${job.id} completed`);
});

paymentQueue.on("failed", (job, err) => {
  console.error(`❌ Payment Job ${job.id} failed:`, err.message);
});

module.exports = paymentQueue;
