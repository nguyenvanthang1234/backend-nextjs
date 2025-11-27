const notificationQueue = require("../queues/notificationQueue");
const Notification = require("../models/Notification");
const { getMessaging } = require("firebase-admin/messaging");
const { ACTION_NOTIFICATION_ORDER } = require("../configs");

// Process notification jobs
notificationQueue.process(async (job) => {
  const { context, title, body, referenceId, recipientIds, deviceTokens } = job.data;

  console.log(`🔔 Processing notification job ${job.id} - Title: ${title}`);

  try {
    // Check if Firebase Messaging is available
    let messaging;
    try {
      messaging = getMessaging();
    } catch (firebaseError) {
      console.warn(`⚠️ Firebase Messaging not initialized: ${firebaseError.message}`);
    }

    // 1. Lưu notification vào database
    const notificationCreate = {
      context,
      title,
      body,
      referenceId,
      recipientIds: recipientIds.map((userId) => ({ userId, isRead: false })),
      isRead: false,
    };

    const createdNotification = await Notification.create(notificationCreate);
    console.log(`✅ Notification saved to DB: ${createdNotification._id}`);

    // 2. Gửi push notification qua Firebase (nếu có device tokens)
    if (messaging && deviceTokens && deviceTokens.length > 0) {
      const mapTitle = {
        [ACTION_NOTIFICATION_ORDER.CANCEL_ORDER]: "Hủy đơn hàng",
        [ACTION_NOTIFICATION_ORDER.CREATE_ORDER]: "Đặt đơn hàng",
        [ACTION_NOTIFICATION_ORDER.WAIT_PAYMENT]: "Đơn hàng chờ thanh toán",
        [ACTION_NOTIFICATION_ORDER.WAIT_DELIVERY]: "Đơn hàng chờ giao hàng",
        [ACTION_NOTIFICATION_ORDER.DONE_ORDER]: "Hoàn thành đơn hàng",
        [ACTION_NOTIFICATION_ORDER.IS_DELIVERED]: "Đơn hàng đã được giao",
        [ACTION_NOTIFICATION_ORDER.IS_PAID]: "Đơn hàng đã được thanh toán",
        [ACTION_NOTIFICATION_ORDER.PAYMENT_VN_PAY_ERROR]: "Thanh toán vnpay thất bại",
        [ACTION_NOTIFICATION_ORDER.PAYMENT_VN_PAY_SUCCESS]: "Thanh toán vnpay thành công",
      };

      const message = {
        notification: {
          title: mapTitle[title] || title,
          body,
        },
        tokens: deviceTokens,
      };

      try {
        const response = await messaging.sendEachForMulticast(message);
        console.log(`✅ Push notification sent: ${response.successCount}/${deviceTokens.length} succeeded`);
        
        if (response.failureCount > 0) {
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              console.warn(`⚠️ Token ${idx} failed: ${resp.error?.message}`);
            }
          });
        }
      } catch (fcmError) {
        // Log but don't fail the job - notification is saved to DB
        console.error(`⚠️ FCM push failed: ${fcmError.message}`);
        console.error(`💡 Tip: Ensure Firebase Cloud Messaging API is enabled in Google Cloud Console`);
      }
    }

    return {
      success: true,
      notificationId: createdNotification._id,
      devicesSent: deviceTokens?.length || 0,
    };
  } catch (error) {
    console.error(`❌ Notification job ${job.id} error:`, error.message);
    throw error; // Throw để Bull retry
  }
});

console.log("🚀 Notification Worker started");

module.exports = notificationQueue;
