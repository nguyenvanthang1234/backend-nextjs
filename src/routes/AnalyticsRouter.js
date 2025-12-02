const express = require("express");
const router = express.Router();
const AnalyticsController = require("../controllers/AnalyticsController");
const { CONFIG_PERMISSIONS } = require("../configs");
const { AuthPermission } = require("../middleware/AuthPermission");

/**
 * @route GET /api/analytics/overview
 * @desc Lấy tổng quan dashboard (Admin only)
 * @access Private/Admin
 */
router.get(
  "/overview",
  AuthPermission(CONFIG_PERMISSIONS.DASHBOARD),
  AnalyticsController.getDashboardOverview
);

/**
 * @route GET /api/analytics/revenue-chart
 * @desc Lấy biểu đồ doanh thu theo ngày (Admin only)
 * @access Private/Admin
 */
router.get(
  "/revenue-chart",
  AuthPermission(CONFIG_PERMISSIONS.DASHBOARD),
  AnalyticsController.getRevenueChart
);

/**
 * @route GET /api/analytics/top-products
 * @desc Lấy top sản phẩm (sales/views/revenue)
 * @access Private/Admin
 */
router.get(
  "/top-products",
  AuthPermission(CONFIG_PERMISSIONS.DASHBOARD),
  AnalyticsController.getTopProducts
);

/**
 * @route GET /api/analytics/recent-activities
 * @desc Lấy hoạt động người dùng gần đây
 * @access Private/Admin
 */
router.get(
  "/recent-activities",
  AuthPermission(CONFIG_PERMISSIONS.DASHBOARD),
  AnalyticsController.getRecentActivities
);

/**
 * @route GET /api/analytics/login-stats
 * @desc Lấy thống kê login/visit theo thời gian
 * @access Private/Admin
 */
router.get(
  "/login-stats",
  AuthPermission(CONFIG_PERMISSIONS.DASHBOARD),
  AnalyticsController.getLoginStats
);

/**
 * @route GET /api/analytics/device-stats
 * @desc Lấy thống kê theo loại thiết bị
 * @access Private/Admin
 */
router.get(
  "/device-stats",
  AuthPermission(CONFIG_PERMISSIONS.DASHBOARD),
  AnalyticsController.getDeviceStats
);

module.exports = router;
