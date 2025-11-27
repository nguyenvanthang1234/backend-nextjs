const paymentQueue = require("../queues/paymentQueue");
const Order = require("../models/OrderProduct");
const moment = require("moment");
const notificationQueue = require("../queues/notificationQueue");
const { CONTEXT_NOTIFICATION, ACTION_NOTIFICATION_ORDER } = require("../configs");
const { getUserAndAdminTokens } = require("../services/NotificationService");

// Process payment jobs
paymentQueue.process(async (job) => {
  const { orderId, paymentStatus, paymentMethod } = job.data;

  console.log(`💳 Processing payment job ${job.id} - Order: ${orderId}`);

  try {
    // 1. Cập nhật trạng thái order
    const existingOrder = await Order.findById(orderId);

    if (!existingOrder) {
      throw new Error(`Order ${orderId} not found`);
    }

    const currentTime = moment();
    const formattedCurrentTime = currentTime.format("YYYY-MM-DDTHH:mm:ss.SSSZ");

    if (paymentStatus === "SUCCESS") {
      existingOrder.isPaid = 1;
      existingOrder.paidAt = formattedCurrentTime;
      existingOrder.status = 1; // Chờ giao hàng
      await existingOrder.save();

      console.log(`✅ Order ${orderId} marked as paid`);

      // 2. Gửi notification (async qua queue)
      const { recipientIds, deviceTokens } = await getUserAndAdminTokens(
        existingOrder.user.toString()
      );

      await notificationQueue.add({
        context: CONTEXT_NOTIFICATION.PAYMENT_VN_PAY,
        title: ACTION_NOTIFICATION_ORDER.PAYMENT_VN_PAY_SUCCESS,
        body: `Đơn hàng với id ${existingOrder._id.toString()} đã được thanh toán thành công`,
        referenceId: existingOrder._id.toString(),
        recipientIds,
        deviceTokens,
      });

      console.log(`✅ Notification queued for order ${orderId}`);
    } else if (paymentStatus === "FAILED") {
      const { recipientIds, deviceTokens } = await getUserAndAdminTokens(
        existingOrder.user.toString()
      );

      await notificationQueue.add({
        context: CONTEXT_NOTIFICATION.PAYMENT_VN_PAY,
        title: ACTION_NOTIFICATION_ORDER.PAYMENT_VN_PAY_ERROR,
        body: `Đơn hàng với id ${existingOrder._id.toString()} thanh toán thất bại`,
        referenceId: existingOrder._id.toString(),
        recipientIds,
        deviceTokens,
      });

      console.log(`⚠️ Payment failed notification queued for order ${orderId}`);
    }

    return {
      success: true,
      orderId,
      paymentStatus,
      totalPrice: existingOrder.totalPrice,
    };
  } catch (error) {
    console.error(`❌ Payment job ${job.id} error:`, error.message);
    throw error; // Throw để Bull retry
  }
});

console.log("🚀 Payment Worker started");

module.exports = paymentQueue;
