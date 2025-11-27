# 🔴 Hướng Dẫn Cài Đặt & Kết Nối Redis

## 📋 Bạn có 3 Lựa Chọn:

---

## ✅ CÁCH 1: Docker (Nhanh nhất - Khuyến nghị)

### Bước 1: Khởi động Docker Desktop
- Mở **Docker Desktop** trên Windows
- Đợi cho đến khi Docker chạy (biểu tượng Docker không còn loading)

### Bước 2: Chạy Redis container
```powershell
docker run --name api-shop-redis -p 6379:6379 -d redis:latest
```

### Bước 3: Kiểm tra
```powershell
docker ps
# Bạn sẽ thấy container api-shop-redis đang chạy
```

### Lệnh hữu ích:
```powershell
# Dừng Redis
docker stop api-shop-redis

# Khởi động lại Redis
docker start api-shop-redis

# Xem logs
docker logs api-shop-redis

# Kết nối Redis CLI
docker exec -it api-shop-redis redis-cli
```

---

## ✅ CÁCH 2: Cài Redis Trực Tiếp (Không cần Docker)

### Tự động (Script):
```powershell
# Chạy script cài đặt tự động
powershell -ExecutionPolicy Bypass -File install-redis-windows.ps1
```

### Thủ công:
1. **Download Redis:**
   - Link: https://github.com/tporadowski/redis/releases/latest
   - Tải file `Redis-x64-*.zip`

2. **Giải nén:**
   - Giải nén vào `C:\Redis`

3. **Chạy Redis:**
   ```powershell
   cd C:\Redis
   .\redis-server.exe
   ```

4. **Test kết nối:**
   ```powershell
   # Mở terminal mới
   cd C:\Redis
   .\redis-cli.exe ping
   # Response: PONG
   ```

---

## ✅ CÁCH 3: Redis Cloud (Online - Miễn phí)

### Nếu không muốn cài local:
1. Đăng ký tài khoản miễn phí tại: https://redis.com/try-free/
2. Tạo database mới (Free tier: 30MB)
3. Lấy thông tin kết nối:
   - Host: `redis-xxxxx.c1.us-east-1-2.ec2.cloud.redislabs.com`
   - Port: `12345`
   - Password: `your-password`

4. Cập nhật `.env`:
   ```env
   REDIS_HOST=redis-xxxxx.c1.us-east-1-2.ec2.cloud.redislabs.com
   REDIS_PORT=12345
   REDIS_PASSWORD=your-password
   ```

---

## 🧪 KIỂM TRA KÊT NỐI

### Test từ Node.js:
```javascript
// Tạo file test-redis.js
const Redis = require("ioredis");

const redis = new Redis({
  host: "localhost",
  port: 6379,
});

redis.on("connect", () => {
  console.log("✅ Redis connected!");
  redis.set("test", "Hello Redis!");
  redis.get("test", (err, result) => {
    console.log("📝 Test value:", result);
    redis.disconnect();
  });
});

redis.on("error", (err) => {
  console.error("❌ Redis error:", err);
});
```

Chạy test:
```powershell
node test-redis.js
```

---

## 🚀 KHỞI ĐỘNG DỰ ÁN

Sau khi Redis đã chạy:

```powershell
npm start
```

Bạn sẽ thấy log:
```
✅ Redis connected successfully
🚀 Email Worker started
🚀 Notification Worker started
🚀 Payment Worker started
🚀 Inventory Worker started
📅 Scheduled jobs initialized
```

---

## 🐛 TROUBLESHOOTING

### Lỗi: "Redis connection error: ECONNREFUSED"
**Nguyên nhân:** Redis chưa chạy

**Giải pháp:**
- **Docker:** `docker start api-shop-redis`
- **Local:** Mở terminal mới, chạy `C:\Redis\redis-server.exe`

### Lỗi: "Docker daemon is not running"
**Giải pháp:** Khởi động **Docker Desktop**

### Kiểm tra Redis có chạy không:
```powershell
# Docker
docker ps | findstr redis

# Local (Windows)
netstat -an | findstr 6379
```

---

## 📊 MONITOR QUEUES

Sau khi Redis & App chạy, truy cập:

```
http://localhost:3001/api/admin/queues
```

Dashboard hiển thị:
- ✅ Email Queue
- ✅ Notification Queue
- ✅ Payment Queue
- ✅ Inventory Queue

---

## 💡 KHUYẾN NGHỊ

### Development:
- **Docker** (nếu có Docker Desktop)
- Hoặc **Local Redis** (nếu không có Docker)

### Production:
- **Redis Cloud** (managed service)
- Hoặc **Self-hosted Redis** trên server

---

## ❓ CẦN TRỢ GIÚP?

1. Kiểm tra Redis chạy chưa:
   ```powershell
   # Docker
   docker ps
   
   # Local
   netstat -an | findstr 6379
   ```

2. Kiểm tra logs:
   ```powershell
   npm start
   # Xem console output
   ```

3. Test thủ công:
   ```powershell
   # Docker
   docker exec -it api-shop-redis redis-cli ping
   
   # Local
   C:\Redis\redis-cli.exe ping
   ```

Response mong đợi: `PONG`

---

## 🎉 XONG!

Bây giờ Queue Worker system đã sẵn sàng! 🚀
