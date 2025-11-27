const express = require("express");
const { createBullBoard } = require("@bull-board/api");
const { BullAdapter } = require("@bull-board/api/bullAdapter");
const { ExpressAdapter } = require("@bull-board/express");
const {
  emailQueue,
  notificationQueue,
  paymentQueue,
  inventoryQueue,
} = require("../queues");

const router = express.Router();

// Setup Bull Board with Express adapter
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/api/admin/queues");

createBullBoard({
  queues: [
    new BullAdapter(emailQueue),
    new BullAdapter(notificationQueue),
    new BullAdapter(paymentQueue),
    new BullAdapter(inventoryQueue),
  ],
  serverAdapter: serverAdapter,
});

// Mount Bull Board on /admin/queues
router.use("/admin/queues", serverAdapter.getRouter());

module.exports = router;
