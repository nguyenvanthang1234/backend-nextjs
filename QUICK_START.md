# ⚡ QUICK START - Queue Worker System

## 🚀 Khởi Động Nhanh (3 Phút)

### Option A: Tự động (Khuyến nghị)

1. **Tải Redis:**
   - Truy cập: https://github.com/tporadowski/redis/releases/latest
   - Tải file: `Redis-x64-*.zip`
   - Giải nén vào: `C:\Redis`

2. **Chạy tất cả cùng lúc:**
   ```cmd
   start-redis-and-app.bat
   ```

**XONG!** ✅

---

### Option B: Thủ công

**Terminal 1 - Redis:**
```powershell
C:\Redis\redis-server.exe
```

**Terminal 2 - App:**
```powershell
npm start
```

---

## 📊 Kiểm Tra

### Logs khi thành công:
```
✅ Redis connected successfully
🚀 Email Worker started
🚀 Notification Worker started  
🚀 Payment Worker started
🚀 Inventory Worker started
📅 Scheduled jobs initialized
```

### Queue Dashboard:
```
http://localhost:3001/api/admin/queues
```

---

## ❌ Nếu Gặp Lỗi

### "Redis connection error"
→ Redis chưa chạy. Mở terminal mới: `C:\Redis\redis-server.exe`

### "Cannot find module"
→ Cài lại packages: `npm install`

---

## 📖 Tài Liệu Chi Tiết

- **Setup Redis:** Xem file `REDIS_SETUP.md`
- **Queue Worker Guide:** Xem file `QUEUE_WORKER_GUIDE.md`

---

## 🎯 Tính Năng Queue

✅ Email gửi bất đồng bộ  
✅ Push notification không block API  
✅ Payment processing với retry  
✅ Auto cancel đơn hàng sau 24h  
✅ Clean notifications tự động  
✅ Update discount theo lịch  

---

## 💡 Lưu Ý

- Redis phải chạy **TRƯỚC** khi start app
- Giữ Redis chạy liên tục khi dev
- Monitor queues qua dashboard

---

## ✨ Enjoy!

Queue Worker đã sẵn sàng! API response nhanh hơn ~10x! 🚀
