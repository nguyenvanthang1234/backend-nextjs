# 🚀 Queue Worker System - Hướng Dẫn Sử Dụng

## 📖 Tổng Quan

Hệ thống Queue Worker đã được tích hợp vào backend API_SHOP để xử lý các tác vụ nặng một cách bất đồng bộ, cải thiện performance và trải nghiệm người dùng.

## 🎯 Tính Năng Đã Tích Hợp

### 1. **Email Queue**
- ✅ Gửi email xác nhận đơn hàng
- ✅ Gửi email reset password
- ✅ Retry tự động khi thất bại (3 lần)

### 2. **Notification Queue**
- ✅ Lưu notification vào database
- ✅ Push notification qua Firebase
- ✅ Xử lý async cho tốc độ response nhanh

### 3. **Payment Queue**
- ✅ Xử lý callback từ VNPay
- ✅ Cập nhật trạng thái đơn hàng
- ✅ Gửi thông báo thanh toán
- ✅ Retry cao (5 lần) vì critical

### 4. **Inventory Queue**
- ✅ Cập nhật stock sản phẩm
- ✅ Khôi phục stock khi hủy đơn
- ✅ Batch update cho nhiều sản phẩm

### 5. **Scheduled Jobs**
- ✅ Tự động hủy đơn chưa thanh toán sau 24h
- ✅ Xóa notification cũ hơn 30 ngày
- ✅ Tự động tắt discount hết hạn
- ✅ Nhắc nhở đơn hàng chờ giao > 3 ngày

## 📦 Cài Đặt Redis

### Windows:
```powershell
# Download Redis từ: https://github.com/microsoftarchive/redis/releases
# Hoặc dùng Docker:
docker run --name redis -p 6379:6379 -d redis
```

### Linux/Mac:
```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# Mac
brew install redis

# Start Redis
redis-server
```

### Kiểm tra Redis:
```bash
redis-cli ping
# Response: PONG
```

## ⚙️ Cấu Hình

### 1. Cập nhật file `.env`:
```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### 2. Khởi động server:
```bash
npm start
```

Server sẽ tự động:
- ✅ Kết nối Redis
- ✅ Khởi tạo 4 queues (email, notification, payment, inventory)
- ✅ Start 4 workers
- ✅ Kích hoạt scheduled jobs

## 📊 Queue Dashboard

Truy cập dashboard để monitor queues:

```
http://localhost:3001/api/admin/queues
```

Dashboard hiển thị:
- 📈 Số lượng jobs: active, completed, failed, delayed
- 🔄 Retry status
- ⏱️ Processing time
- 📋 Job details và logs

## 🔧 Sử Dụng Trong Code

### Gửi Email Job:
```javascript
const { emailQueue } = require("./queues");

await emailQueue.add({
  type: "CREATE_ORDER",
  data: {
    email: "user@example.com",
    orderItems: [...]
  }
});
```

### Gửi Notification Job:
```javascript
const { notificationQueue } = require("./queues");

await notificationQueue.add({
  context: "ORDER",
  title: "CREATE_ORDER",
  body: "Đơn hàng đã được tạo",
  referenceId: orderId,
  recipientIds: ["userId1", "userId2"],
  deviceTokens: ["token1", "token2"]
});
```

### Xử Lý Payment:
```javascript
const { paymentQueue } = require("./queues");

await paymentQueue.add({
  orderId: "123456",
  paymentStatus: "SUCCESS",
  paymentMethod: "VNPAY"
});
```

### Cập Nhật Inventory:
```javascript
const { inventoryQueue } = require("./queues");

// Single update
await inventoryQueue.add({
  type: "UPDATE_STOCK",
  data: { productId: "123", amount: 5 }
});

// Batch update
await inventoryQueue.add({
  type: "BATCH_UPDATE",
  data: { orderItems: [...] }
});
```

## 📅 Scheduled Jobs - Lịch Chạy

| Job | Tần Suất | Mô Tả |
|-----|----------|-------|
| Auto Cancel Unpaid Orders | Mỗi giờ | Hủy đơn chưa thanh toán sau 24h |
| Clean Old Notifications | Hàng ngày 00:00 | Xóa thông báo > 30 ngày |
| Update Product Discounts | Mỗi 6 giờ | Tắt discount hết hạn |
| Remind Pending Deliveries | Hàng ngày 09:00 | Nhắc đơn chờ giao > 3 ngày |

## 🐛 Troubleshooting

### Redis connection error:
```
❌ Redis connection error: connect ECONNREFUSED 127.0.0.1:6379
```
**Giải pháp:** Đảm bảo Redis đang chạy: `redis-server`

### Worker không xử lý jobs:
```bash
# Restart server
npm start
```

### Xem logs:
```bash
# Redis logs
redis-cli monitor

# Application logs
# Check console output
```

## 🎨 Tối Ưu Hóa

### Concurrency (số worker xử lý đồng thời):
```javascript
// trong workers/*.js
emailQueue.process(5, async (job) => {
  // 5 jobs cùng lúc
});
```

### Job Priority:
```javascript
await emailQueue.add(data, {
  priority: 1 // Càng thấp = priority càng cao
});
```

### Delay Job:
```javascript
await notificationQueue.add(data, {
  delay: 5000 // Delay 5 giây
});
```

### Repeat Job:
```javascript
await emailQueue.add(data, {
  repeat: {
    cron: "0 9 * * *" // Hàng ngày 9h sáng
  }
});
```

## 📈 Performance Metrics

**Trước khi dùng Queue:**
- ⏱️ Response time tạo đơn: ~3-5s (chờ email + notification)
- 🔥 Block API khi SMTP chậm
- ❌ Không retry khi thất bại

**Sau khi dùng Queue:**
- ⚡ Response time tạo đơn: ~200-300ms
- ✅ Async processing
- 🔄 Auto retry khi thất bại
- 📊 Monitor qua Dashboard

## 🔐 Bảo Mật

### Protected Routes cho Dashboard:
```javascript
// Thêm middleware auth vào QueueRouter.js
const { authMiddleware, isAdmin } = require("../middleware/authMiddleware");

router.use("/admin/queues", authMiddleware, isAdmin, bullBoardRouter);
```

## 📞 Support

Nếu có vấn đề, check:
1. Redis có chạy không: `redis-cli ping`
2. Logs trong console
3. Queue dashboard: http://localhost:3001/api/admin/queues

## 🎉 Hoàn Thành!

Queue Worker đã được tích hợp hoàn chỉnh vào dự án. Enjoy! 🚀
