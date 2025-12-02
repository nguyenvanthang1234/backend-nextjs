const mongoose = require("mongoose");

const userActivitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Có thể null cho anonymous users
    },
    activityType: {
      type: String,
      enum: [
        "login",
        "logout",
        "register",
        "visit",
        "product_view",
        "add_to_cart",
        "checkout",
        "order_placed",
        "review_posted",
        "search",
      ],
      required: true,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    deviceType: {
      type: String,
      enum: ["mobile", "tablet", "desktop", "unknown"],
      default: "unknown",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed, // Flexible field cho thêm data
      // Ví dụ: { productId, searchQuery, orderId, etc. }
    },
    sessionId: {
      type: String,
    },
    duration: {
      type: Number, // Milliseconds
    },
  },
  {
    timestamps: true, // Tự động tạo createdAt, updatedAt
  }
);

// Indexes để query nhanh
userActivitySchema.index({ user: 1, createdAt: -1 });
userActivitySchema.index({ activityType: 1, createdAt: -1 });
userActivitySchema.index({ sessionId: 1 });
userActivitySchema.index({ createdAt: -1 });

module.exports = mongoose.model("UserActivity", userActivitySchema);
