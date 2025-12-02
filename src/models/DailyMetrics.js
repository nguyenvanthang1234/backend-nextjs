const mongoose = require("mongoose");

// Model lưu metrics tổng hợp theo ngày (để query nhanh)
const dailyMetricsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true,
  },
  revenue: {
    total: { type: Number, default: 0 },
    orderCount: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
  },
  users: {
    totalLogins: { type: Number, default: 0 },
    uniqueUsers: { type: Number, default: 0 },
    newRegistrations: { type: Number, default: 0 },
  },
  traffic: {
    totalVisits: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    pageViews: { type: Number, default: 0 },
  },
  products: {
    totalViews: { type: Number, default: 0 },
    totalSold: { type: Number, default: 0 },
  },
  topProducts: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      views: { type: Number, default: 0 },
      sales: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
    },
  ],
}, {
  timestamps: true,
});

// Index để query theo ngày
dailyMetricsSchema.index({ date: -1 });

module.exports = mongoose.model("DailyMetrics", dailyMetricsSchema);
