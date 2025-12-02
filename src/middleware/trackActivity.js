const AnalyticsService = require("../services/AnalyticsService");

/**
 * Detect device type from user agent
 */
const detectDeviceType = (userAgent) => {
  if (!userAgent) return "unknown";
  
  const ua = userAgent.toLowerCase();
  
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "tablet";
  }
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return "mobile";
  }
  return "desktop";
};

/**
 * Get client IP address
 */
const getClientIP = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.headers["x-real-ip"] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    "unknown"
  );
};

/**
 * Middleware to track page visits
 */
const trackVisit = async (req, res, next) => {
  try {
    // Only track GET requests to avoid duplicates
    if (req.method !== "GET") {
      return next();
    }

    // Skip tracking for health checks, swagger, static files
    const excludePaths = ["/health", "/swagger", "/api-docs", "/favicon.ico"];
    if (excludePaths.some((path) => req.path.includes(path))) {
      return next();
    }

    const activityData = {
      user: req.user?._id || null, // From auth middleware if logged in
      activityType: "visit",
      ipAddress: getClientIP(req),
      userAgent: req.headers["user-agent"],
      deviceType: detectDeviceType(req.headers["user-agent"]),
      metadata: {
        path: req.path,
        method: req.method,
        query: req.query,
      },
      sessionId: req.sessionID || req.headers["x-session-id"],
    };

    // Log asynchronously without blocking request
    AnalyticsService.logActivity(activityData).catch((err) => {
      console.error("[TrackActivity] Error logging visit:", err);
    });
  } catch (error) {
    console.error("[TrackActivity] Error in trackVisit middleware:", error);
  }
  
  next();
};

/**
 * Middleware to track specific actions
 */
const trackAction = (activityType) => {
  return async (req, res, next) => {
    try {
      const activityData = {
        user: req.user?._id || null,
        activityType,
        ipAddress: getClientIP(req),
        userAgent: req.headers["user-agent"],
        deviceType: detectDeviceType(req.headers["user-agent"]),
        metadata: {
          ...req.body,
          ...req.params,
          path: req.path,
        },
        sessionId: req.sessionID || req.headers["x-session-id"],
      };

      // Log asynchronously
      AnalyticsService.logActivity(activityData).catch((err) => {
        console.error(`[TrackActivity] Error logging ${activityType}:`, err);
      });
    } catch (error) {
      console.error(`[TrackActivity] Error in track ${activityType}:`, error);
    }
    
    next();
  };
};

module.exports = {
  trackVisit,
  trackAction,
  detectDeviceType,
  getClientIP,
};
