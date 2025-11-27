const schedule = require("node-schedule");
const Order = require("../models/OrderProduct");
const Notification = require("../models/Notification");
const Product = require("../models/ProductModel");
const moment = require("moment");
const { notificationQueue } = require("../queues");
const { CONTEXT_NOTIFICATION, ACTION_NOTIFICATION_ORDER } = require("../configs");
const { getUserAndAdminTokens } = require("../services/NotificationService");

// 1. Auto cancel unpaid orders after 24 hours
const autoCancelUnpaidOrders = schedule.scheduleJob("0 */1 * * *", async () => {
  // Chạy mỗi giờ
  console.log("⏰ Running scheduled job: Auto cancel unpaid orders");

  try {
    const twentyFourHoursAgo = moment().subtract(24, "hours").toDate();

    // Tìm đơn hàng chưa thanh toán và đã quá 24h
    const unpaidOrders = await Order.find({
      isPaid: 0,
      status: { $in: [0, 1] }, // Chờ thanh toán hoặc chờ giao hàng
      createdAt: { $lt: twentyFourHoursAgo },
    });

    console.log(`Found ${unpaidOrders.length} unpaid orders to cancel`);

    for (const order of unpaidOrders) {
      order.status = 3; // Cancelled
      await order.save();

      // Khôi phục stock
      for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: {
            countInStock: item.amount,
            sold: -item.amount,
          },
        });
      }

      // Gửi notification
      const { recipientIds, deviceTokens } = await getUserAndAdminTokens(
        order.user.toString()
      );

      await notificationQueue.add({
        context: CONTEXT_NOTIFICATION.ORDER,
        title: ACTION_NOTIFICATION_ORDER.CANCEL_ORDER,
        body: `Đơn hàng với id ${order._id.toString()} đã bị hủy tự động do quá 24h chưa thanh toán`,
        referenceId: order._id.toString(),
        recipientIds,
        deviceTokens,
      });

      console.log(`✅ Auto cancelled order: ${order._id}`);
    }
  } catch (error) {
    console.error("❌ Error in auto cancel unpaid orders:", error.message);
  }
});

// 2. Clean old notifications (older than 30 days)
const cleanOldNotifications = schedule.scheduleJob("0 0 * * *", async () => {
  // Chạy hàng ngày lúc 00:00
  console.log("⏰ Running scheduled job: Clean old notifications");

  try {
    const thirtyDaysAgo = moment().subtract(30, "days").toDate();

    const result = await Notification.deleteMany({
      createdAt: { $lt: thirtyDaysAgo },
    });

    console.log(`✅ Deleted ${result.deletedCount} old notifications`);
  } catch (error) {
    console.error("❌ Error in clean old notifications:", error.message);
  }
});

// 3. Update product discount status based on dates
const updateProductDiscounts = schedule.scheduleJob("0 */6 * * *", async () => {
  // Chạy mỗi 6 giờ
  console.log("⏰ Running scheduled job: Update product discounts");

  try {
    const now = new Date();

    // Tắt discount đã hết hạn
    const expiredDiscounts = await Product.updateMany(
      {
        discount: { $gt: 0 },
        discountEndDate: { $lt: now },
        status: 1, // Active
      },
      {
        $set: {
          discount: 0,
          discountStartDate: null,
          discountEndDate: null,
        },
      }
    );

    console.log(
      `✅ Disabled ${expiredDiscounts.modifiedCount} expired product discounts`
    );

    // Kích hoạt discount sắp bắt đầu (trong vòng 1 giờ tới)
    const oneHourLater = moment().add(1, "hour").toDate();

    const upcomingDiscounts = await Product.find({
      discount: { $gt: 0 },
      discountStartDate: { $gte: now, $lte: oneHourLater },
      status: 1,
    });

    console.log(
      `✅ Found ${upcomingDiscounts.length} products with upcoming discounts`
    );
  } catch (error) {
    console.error("❌ Error in update product discounts:", error.message);
  }
});

// 4. Send reminder for orders waiting for delivery (3 days)
const remindPendingDeliveries = schedule.scheduleJob("0 9 * * *", async () => {
  // Chạy hàng ngày lúc 9:00 AM
  console.log("⏰ Running scheduled job: Remind pending deliveries");

  try {
    const threeDaysAgo = moment().subtract(3, "days").toDate();

    const pendingOrders = await Order.find({
      status: 1, // Chờ giao hàng
      isPaid: 1, // Đã thanh toán
      updatedAt: { $lt: threeDaysAgo },
    });

    console.log(`Found ${pendingOrders.length} orders pending delivery > 3 days`);

    for (const order of pendingOrders) {
      const { recipientIds, deviceTokens } = await getUserAndAdminTokens(
        order.user.toString()
      );

      await notificationQueue.add({
        context: CONTEXT_NOTIFICATION.ORDER,
        title: ACTION_NOTIFICATION_ORDER.WAIT_DELIVERY,
        body: `Đơn hàng ${order._id.toString()} đang chờ giao hàng. Vui lòng kiểm tra tình trạng đơn hàng.`,
        referenceId: order._id.toString(),
        recipientIds,
        deviceTokens,
      });

      console.log(`✅ Sent delivery reminder for order: ${order._id}`);
    }
  } catch (error) {
    console.error("❌ Error in remind pending deliveries:", error.message);
  }
});

console.log("📅 Scheduled jobs initialized:");
console.log("  - Auto cancel unpaid orders: Every hour");
console.log("  - Clean old notifications: Daily at 00:00");
console.log("  - Update product discounts: Every 6 hours");
console.log("  - Remind pending deliveries: Daily at 09:00");

module.exports = {
  autoCancelUnpaidOrders,
  cleanOldNotifications,
  updateProductDiscounts,
  remindPendingDeliveries,
};
