const AnalyticsService = require("../services/AnalyticsService");

/**
 * Lấy tổng quan dashboard
 */
const getDashboardOverview = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await AnalyticsService.getDashboardOverview(startDate, endDate);
    return res.status(200).json(result);
  } catch (error) {
    console.error("[AnalyticsController] Error in getDashboardOverview:", error);
    return res.status(500).json({
      status: "Error",
      message: error.message,
      typeError: "SERVER_ERROR",
    });
  }
};

/**
 * Lấy biểu đồ doanh thu
 */
const getRevenueChart = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const result = await AnalyticsService.getRevenueChart(parseInt(days));
    return res.status(200).json(result);
  } catch (error) {
    console.error("[AnalyticsController] Error in getRevenueChart:", error);
    return res.status(500).json({
      status: "Error",
      message: error.message,
      typeError: "SERVER_ERROR",
    });
  }
};

/**
 * Lấy top sản phẩm
 */
const getTopProducts = async (req, res) => {
  try {
    const { limit = 10, type = "sales" } = req.query;
    const result = await AnalyticsService.getTopProducts(parseInt(limit), type);
    return res.status(200).json(result);
  } catch (error) {
    console.error("[AnalyticsController] Error in getTopProducts:", error);
    return res.status(500).json({
      status: "Error",
      message: error.message,
      typeError: "SERVER_ERROR",
    });
  }
};

/**
 * Lấy hoạt động gần đây
 */
const getRecentActivities = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const result = await AnalyticsService.getRecentActivities(parseInt(limit));
    return res.status(200).json(result);
  } catch (error) {
    console.error("[AnalyticsController] Error in getRecentActivities:", error);
    return res.status(500).json({
      status: "Error",
      message: error.message,
      typeError: "SERVER_ERROR",
    });
  }
};

/**
 * Lấy thống kê login/visit
 */
const getLoginStats = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const result = await AnalyticsService.getLoginStats(parseInt(days));
    return res.status(200).json(result);
  } catch (error) {
    console.error("[AnalyticsController] Error in getLoginStats:", error);
    return res.status(500).json({
      status: "Error",
      message: error.message,
      typeError: "SERVER_ERROR",
    });
  }
};

/**
 * Lấy thống kê theo device
 */
const getDeviceStats = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const result = await AnalyticsService.getDeviceStats(parseInt(days));
    return res.status(200).json(result);
  } catch (error) {
    console.error("[AnalyticsController] Error in getDeviceStats:", error);
    return res.status(500).json({
      status: "Error",
      message: error.message,
      typeError: "SERVER_ERROR",
    });
  }
};

module.exports = {
  getDashboardOverview,
  getRevenueChart,
  getTopProducts,
  getRecentActivities,
  getLoginStats,
  getDeviceStats,
};
