# Analytics Dashboard - Hướng Dẫn Sử Dụng

## Tổng Quan

Hệ thống Analytics Dashboard cung cấp khả năng theo dõi và phân tích hoạt động của ứng dụng E-commerce theo thời gian thực, bao gồm:

- 📊 Thống kê doanh thu, đơn hàng
- 👥 Tracking user activities (login, visits, product views)
- 📈 Biểu đồ real-time
- 🔥 Top sản phẩm bán chạy/được xem nhiều
- 📱 Phân tích theo device type (mobile, desktop, tablet)

## Kiến Trúc

### Models

1. **UserActivity** - Lưu trữ mọi hoạt động của user

   - Login/Logout/Register
   - Page visits
   - Product views
   - Add to cart, Checkout, Order placed
   - Search queries

2. **DailyMetrics** - Tổng hợp metrics theo ngày (để query nhanh)
   - Revenue, orders
   - User logins, registrations
   - Traffic statistics
   - Top products

### Tracking System

#### Automatic Tracking

Các hoạt động được tự động tracking:

- ✅ **Login** - Khi user đăng nhập
- ✅ **Register** - Khi user đăng ký
- ✅ **Visits** - Mọi request GET (có thể bật middleware)

#### Manual Tracking

Sử dụng `AnalyticsService.logActivity()` để track custom events:

```javascript
const AnalyticsService = require("../services/AnalyticsService");

// Ví dụ: Track product view
await AnalyticsService.logActivity({
  user: req.user?._id || null, // null nếu anonymous
  activityType: "product_view",
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"],
  deviceType: "mobile", // mobile/tablet/desktop/unknown
  metadata: {
    productId: product._id,
    productName: product.name,
  },
  sessionId: req.sessionID,
});
```

## API Endpoints (Admin Only)

### 1. Lấy Tổng Quan Dashboard

```
GET /api/analytics/overview
```

**Query Parameters:**

- `startDate` (optional) - Ngày bắt đầu (ISO string)
- `endDate` (optional) - Ngày kết thúc (ISO string)

**Response:**

```json
{
  "status": "Success",
  "message": "Lấy thống kê thành công",
  "data": {
    "revenue": {
      "total": 15000000,
      "orderCount": 45,
      "averageOrderValue": 333333,
      "growth": 0
    },
    "users": {
      "totalLogins": 120,
      "uniqueUsers": 35,
      "newRegistrations": 8
    },
    "traffic": {
      "totalVisits": 450,
      "productViews": 230,
      "conversionRate": "10.00"
    },
    "products": {
      "total": 150,
      "lowStock": 12
    },
    "period": {
      "startDate": "2024-10-28T00:00:00.000Z",
      "endDate": "2024-11-28T23:59:59.999Z"
    }
  }
}
```

### 2. Lấy Biểu Đồ Doanh Thu

```
GET /api/analytics/revenue-chart?days=30
```

**Query Parameters:**

- `days` (optional, default: 30) - Số ngày cần lấy

**Response:**

```json
{
  "status": "Success",
  "data": [
    {
      "date": "2024-11-01",
      "revenue": 500000,
      "orderCount": 5
    },
    {
      "date": "2024-11-02",
      "revenue": 750000,
      "orderCount": 8
    }
    // ... 28 ngày nữa
  ]
}
```

### 3. Lấy Top Sản Phẩm

```
GET /api/analytics/top-products?limit=10&type=sales
```

**Query Parameters:**

- `limit` (optional, default: 10) - Số lượng sản phẩm
- `type` (optional, default: "sales") - Loại: `sales`, `views`, `revenue`

**Response:**

```json
{
  "status": "Success",
  "data": [
    {
      "_id": "...",
      "name": "Giày Nike Air Zoom",
      "slug": "giay-nike-air-zoom",
      "image": "...",
      "price": 1500000,
      "sold": 45,
      "discount": 10,
      "views": 230
    }
    // ... more products
  ]
}
```

### 4. Lấy Hoạt Động Gần Đây

```
GET /api/analytics/recent-activities?limit=20
```

**Query Parameters:**

- `limit` (optional, default: 20) - Số lượng activities

**Response:**

```json
{
  "status": "Success",
  "data": [
    {
      "_id": "...",
      "user": {
        "_id": "...",
        "name": "Nguyễn Văn A",
        "email": "test@example.com"
      },
      "activityType": "product_view",
      "ipAddress": "192.168.1.1",
      "deviceType": "mobile",
      "metadata": {
        "productId": "...",
        "productName": "Giày Nike"
      },
      "createdAt": "2024-11-28T10:30:00.000Z"
    }
    // ... more activities
  ]
}
```

### 5. Lấy Thống Kê Login/Visit

```
GET /api/analytics/login-stats?days=7
```

**Query Parameters:**

- `days` (optional, default: 7) - Số ngày cần lấy

**Response:**

```json
{
  "status": "Success",
  "data": [
    {
      "date": "2024-11-22",
      "logins": 15,
      "uniqueLogins": 12,
      "visits": 45
    }
    // ... more days
  ]
}
```

### 6. Lấy Thống Kê Theo Device

```
GET /api/analytics/device-stats?days=30
```

**Response:**

```json
{
  "status": "Success",
  "data": [
    {
      "_id": "mobile",
      "count": 450
    },
    {
      "_id": "desktop",
      "count": 320
    },
    {
      "_id": "tablet",
      "count": 80
    }
  ]
}
```

## Real-time Updates (Socket.io)

### Kết Nối

```javascript
import io from "socket.io-client";

const socket = io(process.env.REACT_APP_API_URL);

socket.on("connect", () => {
  console.log("Connected to analytics socket");
});
```

### Events

#### 1. Metrics Update (mỗi 30 giây)

```javascript
socket.on("metrics_update", (data) => {
  console.log("Dashboard metrics updated:", data);
  // data có cấu trúc giống /api/analytics/overview
  // Update UI với data mới
});
```

#### 2. New Activity

```javascript
socket.on("new_activity", (data) => {
  console.log("New user activity:", data);
  // {
  //   type: 'login',
  //   timestamp: '2024-11-28T10:30:00.000Z',
  //   user: '...'
  // }
});
```

## Cách Sử Dụng Trong Project

### 1. Track Product View (Example)

Thêm vào `ProductController.js`:

```javascript
const AnalyticsService = require("../services/AnalyticsService");

const getProductDetails = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    // Track product view
    await AnalyticsService.logActivity({
      user: req.user?._id || null,
      activityType: "product_view",
      metadata: {
        productId: product._id.toString(),
        productName: product.name,
      },
    });

    return res.status(200).json({ data: product });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
```

### 2. Track Add to Cart

```javascript
// Trong OrderController hoặc CartController
await AnalyticsService.logActivity({
  user: req.user._id,
  activityType: "add_to_cart",
  metadata: {
    productId: req.body.productId,
    quantity: req.body.quantity,
  },
});
```

### 3. Track Search

```javascript
// Trong SearchController
await AnalyticsService.logActivity({
  user: req.user?._id || null,
  activityType: "search",
  metadata: {
    query: req.query.q,
    filters: req.query.filters,
  },
});
```

### 4. Enable Visit Tracking

Thêm middleware vào `index.js`:

```javascript
const { trackVisit } = require("./middleware/trackActivity");

// Thêm TRƯỚC routes
app.use(trackVisit);

routes(app);
```

⚠️ **Lưu ý:** Visit tracking có thể tạo nhiều records, chỉ nên enable cho production hoặc khi cần analytics chi tiết.

## Authentication

Tất cả Analytics endpoints yêu cầu:

1. **Authentication** - Phải đăng nhập (JWT token)
2. **Admin Role** - Chỉ Admin mới truy cập được

**Headers:**

```
Authorization: Bearer <access_token>
```

## Performance Tips

### 1. Indexes

Models đã được tạo indexes tối ưu:

```javascript
// UserActivity indexes
userActivitySchema.index({ user: 1, createdAt: -1 });
userActivitySchema.index({ activityType: 1, createdAt: -1 });
userActivitySchema.index({ createdAt: -1 });
```

### 2. Aggregation

Sử dụng MongoDB aggregation pipeline để tính toán nhanh.

### 3. Caching (TODO)

Có thể thêm Redis cache cho các metrics không cần real-time 100%:

```javascript
// Cache overview metrics for 30 seconds
const cacheKey = `analytics:overview:${startDate}:${endDate}`;
```

### 4. Async Logging

Tất cả activity logging đều async, không block requests:

```javascript
AnalyticsService.logActivity(data).catch((err) =>
  console.error("Error logging:", err)
);
```

## Monitoring

### Scheduled Jobs

- **Realtime Metrics Update**: Mỗi 30 giây emit qua Socket.io
- Có thể điều chỉnh tần suất trong `src/jobs/scheduledJobs.js`

### Database Size

- UserActivity có thể grow nhanh
- Nên setup retention policy (xóa data cũ > 90 ngày)
- Hoặc archive sang cold storage

## Next Steps (Mở Rộng)

1. **Export Reports** - PDF/Excel exports
2. **Email Alerts** - Gửi email báo cáo hàng tuần
3. **Advanced Filters** - Filter theo user segment, location
4. **Funnel Analysis** - Phân tích conversion funnel
5. **Cohort Analysis** - Phân tích retention theo cohort
6. **A/B Testing Integration** - Tích hợp với A/B testing
7. **Predictive Analytics** - Dự đoán trends, demand

---

## Troubleshooting

### Socket.io không connect

- Check CORS settings trong `src/socket.js`
- Verify URL_FE_APP trong `.env`

### Metrics không update

- Check scheduled job đang chạy
- Verify Socket.io connection
- Check console logs

### Performance issues

- Add indexes nếu query chậm
- Implement caching layer
- Consider archiving old data

---

**Author:** Analytics Team  
**Last Updated:** 2024-11-28  
**Version:** 1.0.0
