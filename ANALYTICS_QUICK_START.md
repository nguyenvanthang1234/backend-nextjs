# Analytics Dashboard - Quick Start Guide

## 🚀 Test Ngay Analytics APIs

### 1. Restart Server

```bash
npm start
```

Server sẽ tự động:

- ✅ Log login/register activities
- ✅ Emit real-time metrics mỗi 30 giây qua Socket.io
- ✅ Sẵn sàng nhận API calls

### 2. Test Login Activity Tracking

**Đăng nhập để tạo activity log:**

```bash
POST http://localhost:3001/api/auth/sign-in
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "your_password"
}
```

→ Activity `login` sẽ tự động được log vào database.

### 3. Lấy Dashboard Overview (Admin Only)

**Copy access_token từ response login, sau đó:**

```bash
GET http://localhost:3001/api/analytics/overview
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response mẫu:**

```json
{
  "status": "Success",
  "data": {
    "revenue": {
      "total": 0,
      "orderCount": 0,
      "averageOrderValue": 0
    },
    "users": {
      "totalLogins": 1,
      "uniqueUsers": 1,
      "newRegistrations": 0
    },
    "traffic": {
      "totalVisits": 0,
      "productViews": 0,
      "conversionRate": "0"
    }
  }
}
```

### 4. Test Các APIs Khác

#### a. Lấy Recent Activities

```bash
GET http://localhost:3001/api/analytics/recent-activities?limit=10
Authorization: Bearer YOUR_ACCESS_TOKEN
```

#### b. Lấy Revenue Chart (30 ngày)

```bash
GET http://localhost:3001/api/analytics/revenue-chart?days=30
Authorization: Bearer YOUR_ACCESS_TOKEN
```

#### c. Lấy Top Products (bán chạy)

```bash
GET http://localhost:3001/api/analytics/top-products?limit=10&type=sales
Authorization: Bearer YOUR_ACCESS_TOKEN
```

#### d. Lấy Login Stats (7 ngày)

```bash
GET http://localhost:3001/api/analytics/login-stats?days=7
Authorization: Bearer YOUR_ACCESS_TOKEN
```

#### e. Lấy Device Stats

```bash
GET http://localhost:3001/api/analytics/device-stats?days=30
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 5. Test Real-time Socket.io

**HTML Test Client:**

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Analytics Socket Test</title>
    <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
  </head>
  <body>
    <h1>Analytics Real-time Test</h1>
    <div id="status">Connecting...</div>
    <div id="metrics"></div>
    <div id="activities"></div>

    <script>
      const socket = io("http://localhost:3001");

      socket.on("connect", () => {
        document.getElementById("status").innerText = "✅ Connected!";
      });

      socket.on("metrics_update", (data) => {
        console.log("📊 Metrics updated:", data);
        document.getElementById(
          "metrics"
        ).innerHTML = `<h2>Metrics Update</h2><pre>${JSON.stringify(
          data,
          null,
          2
        )}</pre>`;
      });

      socket.on("new_activity", (activity) => {
        console.log("🔔 New activity:", activity);
        const div = document.getElementById("activities");
        div.innerHTML =
          `<p>New ${activity.type} at ${activity.timestamp}</p>` +
          div.innerHTML;
      });
    </script>
  </body>
</html>
```

Lưu file này và mở trong browser, sau đó login/logout để thấy real-time updates.

### 6. Tạo Test Data

**Script để tạo test activities:**

```javascript
// test-analytics.js
const mongoose = require("mongoose");
const UserActivity = require("./src/models/UserActivity");
require("dotenv").config();

async function seedTestData() {
  await mongoose.connect(process.env.MONGO_DB);

  const activities = [
    {
      activityType: "visit",
      ipAddress: "192.168.1.1",
      deviceType: "mobile",
      metadata: { path: "/products" },
    },
    {
      activityType: "product_view",
      deviceType: "desktop",
      metadata: { productId: "123", productName: "Test Product" },
    },
    {
      activityType: "search",
      deviceType: "mobile",
      metadata: { query: "nike shoes", resultCount: 10 },
    },
  ];

  for (let i = 0; i < 50; i++) {
    const activity = activities[i % activities.length];
    await UserActivity.create({
      ...activity,
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    });
  }

  console.log("✅ Created 50 test activities");
  process.exit(0);
}

seedTestData().catch(console.error);
```

**Chạy:**

```bash
node test-analytics.js
```

### 7. Verify trong MongoDB

**Kiểm tra data đã được tạo:**

```javascript
// MongoDB Shell hoặc Compass
db.useractivities.find().sort({ createdAt: -1 }).limit(10);
```

### 8. Enable Visit Tracking (Optional)

Để track tất cả visits, thêm vào `src/index.js`:

```javascript
const { trackVisit } = require("./middleware/trackActivity");

// Thêm TRƯỚC routes(app)
app.use(trackVisit);
routes(app);
```

⚠️ **Lưu ý:** Sẽ tạo nhiều records, chỉ nên enable khi cần.

---

## 📊 Dashboard Frontend (Optional)

Nếu muốn tạo dashboard UI, check file `ANALYTICS_INTEGRATION_EXAMPLES.md` để xem React example.

---

## ✅ Checklist

- [ ] Server đã restart
- [ ] Test login API → Check console log `[Analytics] ...`
- [ ] Call `/api/analytics/overview` → Nhận được data
- [ ] Test Socket.io connection → Nhận metrics mỗi 30s
- [ ] Create test data → Thấy chart có data
- [ ] Check MongoDB → Có collection `useractivities`

---

## 🎯 Next Steps

1. **Integrate vào routes hiện có** - Xem `ANALYTICS_INTEGRATION_EXAMPLES.md`
2. **Build Dashboard UI** - React/Vue/Angular
3. **Setup monitoring** - Grafana/Datadog
4. **Add more metrics** - Custom KPIs
5. **Export reports** - PDF/Excel

---

**Có vấn đề?** Check:

- Console logs cho errors
- MongoDB connection
- JWT token hợp lệ (Admin role)
- Socket.io CORS settings

**Thành công!** 🎉 Analytics Dashboard đã sẵn sàng!
