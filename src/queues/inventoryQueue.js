const Queue = require("bull");
const { redisOptions } = require("../configs/redis");

// Create Inventory Queue
const inventoryQueue = new Queue("inventory", {
  redis: redisOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "fixed",
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

// Queue events
inventoryQueue.on("error", (error) => {
  console.error("❌ Inventory Queue Error:", error);
});

inventoryQueue.on("completed", (job) => {
  console.log(`✅ Inventory Job ${job.id} completed`);
});

inventoryQueue.on("failed", (job, err) => {
  console.error(`❌ Inventory Job ${job.id} failed:`, err.message);
});

module.exports = inventoryQueue;
