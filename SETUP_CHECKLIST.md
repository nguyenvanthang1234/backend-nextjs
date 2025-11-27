# ✅ Cloudinary Setup Checklist

## 🎯 Bạn cần làm 3 bước sau:

---

### **Bước 1: Cài đặt dependencies** (30 giây)

```bash
yarn add cloudinary multer streamifier
```

**Hoặc nếu dùng npm:**

```bash
npm install cloudinary multer streamifier
```

---

### **Bước 2: Copy credentials vào file .env** (30 giây)

Mở file `.env` của bạn và thêm/update:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=dkqb1zkju
CLOUDINARY_API_KEY=924821448238285
CLOUDINARY_API_SECRET=FDXnWExyET_lxhfo7KQGQEyvWzg
```

**Lưu ý:** Credentials này đã có trong `.env-example`, bạn chỉ cần copy sang `.env`

---

### **Bước 3: Restart server** (10 giây)

```bash
# Stop server hiện tại (Ctrl+C)
# Sau đó start lại:
yarn start
```

**Hoặc:**

```bash
npm start
```

---

## 🎉 Xong rồi!

Giờ test thử:

### **Test 1: Create Product với base64 image**

**Request:**

```bash
POST http://localhost:3001/api/products
Content-Type: application/json
Authorization: Bearer <your_token>

{
  "name": "Test Product Cloudinary",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "price": 100000,
  "type": "your_product_type_id",
  "countInStock": 10,
  "slug": "test-product-cloudinary"
}
```

**Kết quả mong đợi:**

- ✅ Console log: `✓ Uploaded product image to Cloudinary: products/abc123...`
- ✅ Database lưu: `image: "products/abc123..."`
- ✅ Response có `imageUrl` và `thumbnailUrl`

### **Test 2: Get Product Details**

```bash
GET http://localhost:3001/api/products/:id
```

**Response:**

```json
{
  "status": "Success",
  "data": {
    "_id": "...",
    "name": "Test Product Cloudinary",
    "image": "products/abc123xyz",
    "imageUrl": "https://res.cloudinary.com/.../w_800,q_auto,f_auto/products/abc123xyz.jpg",
    "thumbnailUrl": "https://res.cloudinary.com/.../w_200,h_200,c_fill/products/abc123xyz.jpg",
    "price": 100000
  }
}
```

### **Test 3: Upload trực tiếp (Optional)**

```bash
POST http://localhost:3001/api/upload/single?folder=products
Content-Type: multipart/form-data
Authorization: Bearer <your_token>

Body:
  file: [Select image file]
```

---

## 📊 Verify Success

### **1. Check Console Logs**

Khi create/update product/user, bạn sẽ thấy:

```
✓ Uploaded product image to Cloudinary: products/abc123
✓ Uploaded user avatar to Cloudinary: avatars/xyz789
```

### **2. Check Database**

```javascript
// MongoDB
db.products.findOne({ name: "Test Product Cloudinary" })

// Result:
{
  "name": "Test Product Cloudinary",
  "image": "products/abc123xyz", // ✅ publicId, không phải base64
  "price": 100000
}
```

### **3. Check Cloudinary Dashboard**

1. Login vào [Cloudinary Console](https://cloudinary.com/console)
2. Vào **Media Library**
3. Thấy folders:
   - `products/` với ảnh vừa upload
   - `avatars/` (nếu có upload user)

---

## 🔄 Migration Data Cũ (Optional)

Nếu database đã có data với base64 images:

```bash
yarn migrate:cloudinary
```

Script sẽ:

- ✅ Scan tất cả products và users
- ✅ Tìm base64 images
- ✅ Upload lên Cloudinary
- ✅ Update database với publicId
- ✅ Show progress bar

---

## 📝 Đã implement sẵn

✅ **ProductService:**

- `createProduct` - Auto upload base64 → Cloudinary
- `updateProduct` - Upload new, delete old
- `deleteProduct` - Delete from Cloudinary
- `getDetailsProduct` - Convert publicId → URL

✅ **UserService:**

- `createUser` - Auto upload avatar base64
- `updateUser` - Upload new, delete old
- `deleteUser` - Delete avatar from Cloudinary
- `getDetailsUser` - Convert publicId → URL

✅ **Routes:**

- `/api/upload/single` - Upload file
- `/api/upload/multiple` - Upload multiple files
- `/api/upload/base64` - Upload base64
- `/api/upload/:publicId` - Delete file

---

## 🐛 Troubleshooting

### **Lỗi: "Cannot find module 'cloudinary'"**

➡️ Chạy: `yarn add cloudinary multer streamifier`

### **Lỗi: "Invalid cloud_name"**

➡️ Check file `.env` có đúng credentials không
➡️ Restart server sau khi update `.env`

### **Ảnh không upload lên Cloudinary**

➡️ Check console logs xem có error gì không
➡️ Check image có bắt đầu bằng `data:image/` không
➡️ Check API key và secret đúng chưa

### **Database vẫn lưu base64**

➡️ Có thể code cũ override, check lại ProductService/UserService
➡️ Check console có log upload không

---

## 📚 Documentation

Đọc thêm:

- **`CLOUDINARY_IMPLEMENTATION_SUMMARY.md`** - Chi tiết implementation
- **`CLOUDINARY_QUICK_START.md`** - Quick start guide
- **`CLOUDINARY_GUIDE.md`** - Full documentation

---

## 🎉 Done!

**Frontend không cần thay đổi gì!**

- ✅ Vẫn gửi base64 như cũ
- ✅ Backend tự động upload lên Cloudinary
- ✅ Database lưu publicId thay vì base64
- ✅ Response có thêm imageUrl/avatarUrl

**Chỉ cần 3 bước:**

1. `yarn add cloudinary multer streamifier`
2. Copy credentials vào `.env`
3. `yarn start`

**Test ngay!** 🚀
