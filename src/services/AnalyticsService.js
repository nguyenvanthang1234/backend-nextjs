const UserActivity = require("../models/UserActivity");
const DailyMetrics = require("../models/DailyMetrics");
const Order = require("../models/OrderProduct");
const Product = require("../models/ProductModel");
const User = require("../models/UserModel");
const moment = require("moment");
const socketModule = require("../socket");

/**
 * Log user activity
 */
const logActivity = async (activityData) => {
  try {
    const activity = new UserActivity(activityData);
    await activity.save();
    
    // Emit real-time event
    const io = socketModule.getIo();
    if (io) {
      io.emit("new_activity", {
        type: activityData.activityType,
        timestamp: new Date(),
        user: activityData.user,
      });
    }
    
    return activity;
  } catch (error) {
    console.error("[Analytics] Error logging activity:", error);
    return null;
  }
};

/**
 * Lấy thống kê tổng quan dashboard
 */
const getDashboardOverview = async (startDate, endDate) => {
  try {
    const start = startDate ? new Date(startDate) : moment().subtract(30, "days").toDate();
    const end = endDate ? new Date(endDate) : new Date();

    // 1. Revenue metrics
    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end },
      isPaid: true,
    });

    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const orderCount = orders.length;
    const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

    // 2. User metrics
    const totalLogins = await UserActivity.countDocuments({
      activityType: "login",
      createdAt: { $gte: start, $lte: end },
    });

    const uniqueLogins = await UserActivity.distinct("user", {
      activityType: "login",
      createdAt: { $gte: start, $lte: end },
      user: { $ne: null },
    });

    const newUsers = await User.countDocuments({
      createdAt: { $gte: start, $lte: end },
    });

    // 3. Traffic metrics
    const totalVisits = await UserActivity.countDocuments({
      activityType: "visit",
      createdAt: { $gte: start, $lte: end },
    });

    const productViews = await UserActivity.countDocuments({
      activityType: "product_view",
      createdAt: { $gte: start, $lte: end },
    });

    // 4. Product metrics
    const totalProducts = await Product.countDocuments();
    const lowStockProducts = await Product.countDocuments({
      countInStock: { $lt: 10 },
    });

    return {
      status: "Success",
      message: "Lấy thống kê thành công",
      data: {
        revenue: {
          total: totalRevenue,
          orderCount,
          averageOrderValue: Math.round(averageOrderValue),
          growth: 0, // TODO: Calculate growth vs previous period
        },
        users: {
          totalLogins,
          uniqueUsers: uniqueLogins.length,
          newRegistrations: newUsers,
        },
        traffic: {
          totalVisits,
          productViews,
          conversionRate: totalVisits > 0 ? ((orderCount / totalVisits) * 100).toFixed(2) : 0,
        },
        products: {
          total: totalProducts,
          lowStock: lowStockProducts,
        },
        period: {
          startDate: start,
          endDate: end,
        },
      },
    };
  } catch (error) {
    console.error("[Analytics] Error getting dashboard overview:", error);
    return {
      status: "Error",
      message: error.message,
      typeError: "ANALYTICS_ERROR",
    };
  }
};

/**
 * Lấy biểu đồ doanh thu theo ngày
 */
const getRevenueChart = async (days = 30) => {
  try {
    const startDate = moment().subtract(days, "days").startOf("day").toDate();
    
    const orders = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          isPaid: true,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          revenue: { $sum: "$totalPrice" },
          orderCount: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Fill missing dates with 0
    const chartData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = moment().subtract(i, "days").format("YYYY-MM-DD");
      const dayData = orders.find((o) => o._id === date);
      
      chartData.push({
        date,
        revenue: dayData ? dayData.revenue : 0,
        orderCount: dayData ? dayData.orderCount : 0,
      });
    }

    return {
      status: "Success",
      data: chartData,
    };
  } catch (error) {
    console.error("[Analytics] Error getting revenue chart:", error);
    return {
      status: "Error",
      message: error.message,
    };
  }
};

/**
 * Lấy top sản phẩm bán chạy
 */
const getTopProducts = async (limit = 10, type = "sales") => {
  try {
    let sortField = {};
    
    switch (type) {
      case "sales":
        sortField = { sold: -1 };
        break;
      case "revenue":
        sortField = { sold: -1 }; // TODO: Calculate actual revenue
        break;
      case "views":
        // Need to aggregate from UserActivity
        const productViews = await UserActivity.aggregate([
          {
            $match: {
              activityType: "product_view",
              "metadata.productId": { $exists: true },
            },
          },
          {
            $group: {
              _id: "$metadata.productId",
              views: { $sum: 1 },
            },
          },
          {
            $sort: { views: -1 },
          },
          {
            $limit: limit,
          },
        ]);

        const productIds = productViews.map((pv) => pv._id);
        const products = await Product.find({ _id: { $in: productIds } })
          .populate("type", "name")
          .select("name slug image price sold discount");

        const productsWithViews = products.map((product) => {
          const viewData = productViews.find((pv) => pv._id.toString() === product._id.toString());
          return {
            ...product.toObject(),
            views: viewData ? viewData.views : 0,
          };
        });

        return {
          status: "Success",
          data: productsWithViews.sort((a, b) => b.views - a.views),
        };
      default:
        sortField = { sold: -1 };
    }

    if (type !== "views") {
      const products = await Product.find()
        .populate("type", "name")
        .select("name slug image price sold discount countInStock")
        .sort(sortField)
        .limit(limit);

      return {
        status: "Success",
        data: products,
      };
    }
  } catch (error) {
    console.error("[Analytics] Error getting top products:", error);
    return {
      status: "Error",
      message: error.message,
    };
  }
};

/**
 * Lấy hoạt động người dùng real-time
 */
const getRecentActivities = async (limit = 20) => {
  try {
    const activities = await UserActivity.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return {
      status: "Success",
      data: activities,
    };
  } catch (error) {
    console.error("[Analytics] Error getting recent activities:", error);
    return {
      status: "Error",
      message: error.message,
    };
  }
};

/**
 * Lấy thống kê login/visit theo thời gian
 */
const getLoginStats = async (days = 7) => {
  try {
    const startDate = moment().subtract(days, "days").startOf("day").toDate();

    const stats = await UserActivity.aggregate([
      {
        $match: {
          activityType: { $in: ["login", "visit"] },
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            type: "$activityType",
          },
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: "$user" },
        },
      },
      {
        $group: {
          _id: "$_id.date",
          stats: {
            $push: {
              type: "$_id.type",
              count: "$count",
              uniqueUsers: { $size: "$uniqueUsers" },
            },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Format data
    const chartData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = moment().subtract(i, "days").format("YYYY-MM-DD");
      const dayStats = stats.find((s) => s._id === date);
      
      const loginData = dayStats?.stats.find((s) => s.type === "login") || {};
      const visitData = dayStats?.stats.find((s) => s.type === "visit") || {};
      
      chartData.push({
        date,
        logins: loginData.count || 0,
        uniqueLogins: loginData.uniqueUsers || 0,
        visits: visitData.count || 0,
      });
    }

    return {
      status: "Success",
      data: chartData,
    };
  } catch (error) {
    console.error("[Analytics] Error getting login stats:", error);
    return {
      status: "Error",
      message: error.message,
    };
  }
};

/**
 * Lấy thống kê theo device type
 */
const getDeviceStats = async (days = 30) => {
  try {
    const startDate = moment().subtract(days, "days").toDate();

    const stats = await UserActivity.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$deviceType",
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      status: "Success",
      data: stats,
    };
  } catch (error) {
    console.error("[Analytics] Error getting device stats:", error);
    return {
      status: "Error",
      message: error.message,
    };
  }
};

/**
 * Emit real-time metrics update
 */
const emitMetricsUpdate = async () => {
  try {
    const io = socketModule.getIo();
    if (!io) return;

    const overview = await getDashboardOverview();
    io.emit("metrics_update", overview.data);
  } catch (error) {
    console.error("[Analytics] Error emitting metrics update:", error);
  }
};

module.exports = {
  logActivity,
  getDashboardOverview,
  getRevenueChart,
  getTopProducts,
  getRecentActivities,
  getLoginStats,
  getDeviceStats,
  emitMetricsUpdate,
};
