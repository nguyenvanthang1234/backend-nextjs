# Analytics Integration Examples

Hướng dẫn tích hợp tracking vào các routes hiện có.

## 1. Track Product Views

### Cập nhật ProductController.js

```javascript
// Trong getDetailsProduct function
const getDetailsProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId)
      .populate("type", "name")
      .populate("location", "name");

    if (!product) {
      return res.status(404).json({
        status: "Error",
        message: "Product not found",
      });
    }

    // ✅ THÊM: Track product view
    const AnalyticsService = require("../services/AnalyticsService");
    AnalyticsService.logActivity({
      user: req.user?._id || null,
      activityType: "product_view",
      metadata: {
        productId: product._id.toString(),
        productName: product.name,
        productPrice: product.price,
        productType: product.type?.name,
      },
    }).catch((err) =>
      console.error("[Analytics] Error logging product view:", err)
    );

    return res.status(200).json({
      status: "Success",
      data: product,
    });
  } catch (error) {
    return res.status(500).json({
      status: "Error",
      message: error.message,
    });
  }
};
```

## 2. Track Add to Cart & Checkout

### Cập nhật OrderController.js

```javascript
// Trong createOrder function
const createOrder = async (req, res) => {
  try {
    // ... existing code ...

    const newOrder = await Order.create({
      orderItems: req.body.orderItems,
      // ... other fields
    });

    // ✅ THÊM: Track checkout/order placed
    const AnalyticsService = require("../services/AnalyticsService");
    AnalyticsService.logActivity({
      user: req.user._id,
      activityType: "order_placed",
      metadata: {
        orderId: newOrder._id.toString(),
        totalPrice: newOrder.totalPrice,
        itemCount: newOrder.orderItems.length,
      },
    }).catch((err) => console.error("[Analytics] Error logging order:", err));

    return res.status(200).json({
      status: "Success",
      data: newOrder,
    });
  } catch (error) {
    return res.status(500).json({
      status: "Error",
      message: error.message,
    });
  }
};
```

## 3. Track Search Queries

### Tạo hoặc cập nhật trong ProductController.js

```javascript
const searchProducts = async (req, res) => {
  try {
    const { q, filter } = req.query;

    // ... search logic ...

    // ✅ THÊM: Track search
    const AnalyticsService = require("../services/AnalyticsService");
    AnalyticsService.logActivity({
      user: req.user?._id || null,
      activityType: "search",
      metadata: {
        query: q,
        filters: filter,
        resultCount: products.length,
      },
    }).catch((err) => console.error("[Analytics] Error logging search:", err));

    return res.status(200).json({
      status: "Success",
      data: products,
    });
  } catch (error) {
    return res.status(500).json({
      status: "Error",
      message: error.message,
    });
  }
};
```

## 4. Track Review Posts

### Cập nhật ReviewController.js

```javascript
const createReview = async (req, res) => {
  try {
    // ... existing code ...

    const newReview = await Review.create({
      user: req.user._id,
      product: req.body.product,
      rating: req.body.rating,
      comment: req.body.comment,
    });

    // ✅ THÊM: Track review posted
    const AnalyticsService = require("../services/AnalyticsService");
    AnalyticsService.logActivity({
      user: req.user._id,
      activityType: "review_posted",
      metadata: {
        reviewId: newReview._id.toString(),
        productId: req.body.product,
        rating: req.body.rating,
      },
    }).catch((err) => console.error("[Analytics] Error logging review:", err));

    return res.status(201).json({
      status: "Success",
      data: newReview,
    });
  } catch (error) {
    return res.status(500).json({
      status: "Error",
      message: error.message,
    });
  }
};
```

## 5. Enable Global Visit Tracking

### Cập nhật src/index.js

```javascript
const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const routes = require("./routes");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { trackVisit } = require("./middleware/trackActivity"); // ✅ THÊM

dotenv.config();

const app = express();
const server = http.createServer(app);

// ... existing middleware ...

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// ✅ THÊM: Track visits (phải đặt TRƯỚC routes)
app.use(trackVisit);

routes(app);

// ... rest of code ...
```

⚠️ **Lưu ý:** Visit tracking sẽ log mọi GET request. Nếu traffic cao, hãy cân nhắc:

- Chỉ track specific routes
- Sampling (chỉ track 10% requests)
- Async processing với queue

## 6. Track Specific Routes Only (Alternative)

Nếu không muốn track tất cả visits, chỉ track specific routes:

### ProductRouter.js

```javascript
const express = require("express");
const router = express.Router();
const ProductController = require("../controllers/ProductController");
const { trackAction } = require("../middleware/trackActivity"); // ✅ THÊM

// Track product list view
router.get(
  "/",
  trackAction("product_list_view"), // ✅ THÊM
  ProductController.getAllProducts
);

// Track individual product view
router.get(
  "/:id",
  trackAction("product_detail_view"), // ✅ THÊM
  ProductController.getDetailsProduct
);

module.exports = router;
```

## 7. Custom Activity Types

Bạn có thể thêm custom activity types vào model:

### UserActivity.js

```javascript
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
    "wishlist_add",        // ✅ MỚI
    "share_product",       // ✅ MỚI
    "newsletter_subscribe", // ✅ MỚI
    "coupon_used",         // ✅ MỚI
  ],
  required: true,
},
```

## 8. Emit Custom Socket Events

Nếu muốn emit custom events khi có activity mới:

### AnalyticsService.js

```javascript
const logActivity = async (activityData) => {
  try {
    const activity = new UserActivity(activityData);
    await activity.save();

    const io = socketModule.getIO();
    if (io) {
      // Emit general activity
      io.emit("new_activity", {
        type: activityData.activityType,
        timestamp: new Date(),
        user: activityData.user,
      });

      // ✅ THÊM: Emit specific events
      if (activityData.activityType === "order_placed") {
        io.emit("new_order", {
          orderId: activityData.metadata.orderId,
          totalPrice: activityData.metadata.totalPrice,
        });
      }

      if (activityData.activityType === "product_view") {
        io.emit("product_trending", {
          productId: activityData.metadata.productId,
          productName: activityData.metadata.productName,
        });
      }
    }

    return activity;
  } catch (error) {
    console.error("[Analytics] Error logging activity:", error);
    return null;
  }
};
```

## 9. Dashboard Frontend Integration (React Example)

### useAnalytics Hook

```javascript
import { useState, useEffect } from "react";
import io from "socket.io-client";
import axios from "axios";

const useAnalytics = () => {
  const [metrics, setMetrics] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Fetch initial data
    const fetchData = async () => {
      try {
        const [overviewRes, activitiesRes] = await Promise.all([
          axios.get("/api/analytics/overview"),
          axios.get("/api/analytics/recent-activities"),
        ]);

        setMetrics(overviewRes.data.data);
        setRecentActivities(activitiesRes.data.data);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      }
    };

    fetchData();

    // Setup Socket.io
    const newSocket = io(process.env.REACT_APP_API_URL);

    newSocket.on("connect", () => {
      console.log("✅ Connected to analytics socket");
    });

    newSocket.on("metrics_update", (data) => {
      console.log("📊 Metrics updated:", data);
      setMetrics(data);
    });

    newSocket.on("new_activity", (activity) => {
      console.log("🔔 New activity:", activity);
      setRecentActivities((prev) => [activity, ...prev].slice(0, 20));
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return { metrics, recentActivities };
};

export default useAnalytics;
```

### Dashboard Component

```javascript
import React from "react";
import useAnalytics from "./hooks/useAnalytics";

const AnalyticsDashboard = () => {
  const { metrics, recentActivities } = useAnalytics();

  if (!metrics) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <h1>Analytics Dashboard</h1>

      {/* Overview Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Total Revenue</h3>
          <p className="big-number">
            {metrics.revenue.total.toLocaleString("vi-VN")} VNĐ
          </p>
          <small>{metrics.revenue.orderCount} orders</small>
        </div>

        <div className="metric-card">
          <h3>Total Logins</h3>
          <p className="big-number">{metrics.users.totalLogins}</p>
          <small>{metrics.users.uniqueUsers} unique users</small>
        </div>

        <div className="metric-card">
          <h3>Total Visits</h3>
          <p className="big-number">{metrics.traffic.totalVisits}</p>
          <small>{metrics.traffic.productViews} product views</small>
        </div>

        <div className="metric-card">
          <h3>Conversion Rate</h3>
          <p className="big-number">{metrics.traffic.conversionRate}%</p>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="activities-section">
        <h2>Recent Activities</h2>
        <ul>
          {recentActivities.map((activity) => (
            <li key={activity._id}>
              <strong>{activity.activityType}</strong> -{" "}
              {activity.user?.email || "Anonymous"}
              <small>{new Date(activity.createdAt).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
```

## 10. Best Practices

### ✅ DO:

- Track asynchronously (don't block requests)
- Handle errors gracefully (catch and log)
- Use meaningful metadata
- Index frequently queried fields
- Aggregate data for faster queries
- Clean old data periodically

### ❌ DON'T:

- Block user requests while logging
- Log sensitive information (passwords, tokens)
- Track too granularly (every mouse click)
- Store large objects in metadata
- Forget to handle anonymous users
- Leave tracking enabled in tests

---

**Ready to use!** Chọn phương pháp phù hợp với nhu cầu của bạn và bắt đầu tracking! 🚀
