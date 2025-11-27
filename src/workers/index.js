// Import all workers to start them
require("./emailWorker");
require("./notificationWorker");
require("./paymentWorker");
require("./inventoryWorker");

console.log("✨ All workers initialized successfully");

module.exports = {
  emailWorker: require("./emailWorker"),
  notificationWorker: require("./notificationWorker"),
  paymentWorker: require("./paymentWorker"),
  inventoryWorker: require("./inventoryWorker"),
};
