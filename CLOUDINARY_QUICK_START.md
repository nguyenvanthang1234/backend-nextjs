# 🚀 Cloudinary Quick Start (5 phút)

## ✅ Checklist

### 1. Đăng ký Cloudinary (2 phút)

1. Vào [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Đăng ký free account
3. Vào Dashboard → Copy credentials:
   - Cloud name
   - API Key
   - API Secret

### 2. Cài đặt (1 phút)

```bash
yarn add cloudinary multer streamifier
```

### 3. Config .env (30 giây)

Thêm vào `.env`:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Thêm route (30 giây)

File `src/index.js`:

```javascript
const uploadRouter = require("./routes/UploadRouter");
app.use("/api/upload", uploadRouter);
```

### 5. Test (1 phút)

**Postman:**

```
POST http://localhost:3001/api/upload/single?folder=products
Header: Authorization: Bearer <token>
Body: form-data → file: [chọn ảnh]
```

**Response:**

```json
{
  "status": "Success",
  "data": {
    "publicId": "products/abc123",
    "secureUrl": "https://res.cloudinary.com/.../products/abc123.jpg"
  }
}
```

---

## 🎯 3 Cách Sử Dụng

### Option 1: Frontend upload trước ⭐ (Recommended)

**Frontend:**

```javascript
// 1. Upload ảnh
const formData = new FormData();
formData.append("file", imageFile);
const res = await fetch("/api/upload/single?folder=products", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
});
const { data } = await res.json();

// 2. Create product với publicId
await createProduct({
  name: "Product",
  image: data.publicId, // "products/abc123"
  price: 100000,
});
```

**Backend: Không cần sửa gì!**

---

### Option 2: Backend auto-convert base64 (Dễ nhất)

**ProductService.js:**

```javascript
const CloudinaryService = require("./CloudinaryService");

const createProduct = async (newProduct) => {
  const { image, ...rest } = newProduct;

  let imagePublicId = image;

  // Auto upload base64 → Cloudinary
  if (image && image.startsWith("data:image/")) {
    const result = await CloudinaryService.uploadBase64(image, "products");
    imagePublicId = result.publicId;
  }

  const product = await Product.create({
    ...rest,
    image: imagePublicId,
  });

  return product;
};
```

**Frontend: Không cần thay đổi!** Vẫn gửi base64 như cũ.

---

### Option 3: Multipart upload

**Route:**

```javascript
const upload = require("../middleware/upload");
router.post("/product", authMiddleware, upload.single("image"), createProduct);
```

**Controller:**

```javascript
const createProduct = async (req, res) => {
  let imagePublicId = null;

  if (req.file) {
    const result = await CloudinaryService.uploadFile(
      req.file.buffer,
      "products"
    );
    imagePublicId = result.publicId;
  }

  const product = await ProductService.createProduct({
    ...req.body,
    image: imagePublicId,
  });

  res.json({ data: product });
};
```

---

## 🔄 Migration Data Cũ

```bash
# 1. Backup database
mongodump --uri="your_uri" --out=./backup

# 2. Chạy migration
yarn migrate:cloudinary

# 3. Verify
# - Check Cloudinary Media Library
# - Check database: image = "products/abc123"
# - Test API
```

---

## 📝 Update ProductService (Option 2 - Recommended)

**createProduct:**

```javascript
let imagePublicId = image;
if (image && image.startsWith("data:image/")) {
  const result = await CloudinaryService.uploadBase64(image, "products");
  imagePublicId = result.publicId;
}
product.image = imagePublicId;
```

**updateProduct:**

```javascript
if (data.image && data.image.startsWith("data:image/")) {
  const result = await CloudinaryService.uploadBase64(data.image, "products");

  // Xóa ảnh cũ
  if (oldProduct.image && !oldProduct.image.startsWith("data:")) {
    await CloudinaryService.deleteFile(oldProduct.image);
  }

  data.image = result.publicId;
}
```

**deleteProduct:**

```javascript
// Xóa ảnh từ Cloudinary
if (product.image && !product.image.startsWith("data:")) {
  await CloudinaryService.deleteFile(product.image);
}
```

**getDetailsProduct:**

```javascript
// Convert publicId → URL
if (product.image && !product.image.startsWith("http")) {
  product.imageUrl = CloudinaryService.getOptimizedUrl(product.image, 800);
  product.thumbnailUrl = CloudinaryService.getThumbnailUrl(product.image, 200);
}
```

---

## 🎨 Image Transformations

```javascript
// Optimized URL (auto format, quality)
const url = CloudinaryService.getOptimizedUrl("products/abc123", 800);

// Thumbnail
const thumb = CloudinaryService.getThumbnailUrl("products/abc123", 200);

// Custom
const custom = CloudinaryService.getTransformUrl("products/abc123", {
  width: 500,
  height: 300,
  crop: "fill",
  gravity: "face",
});
```

---

## 💡 Tips

### Lưu Public ID, không lưu URL

```javascript
// ✅ Good
product.image = "products/abc123";

// ❌ Bad
product.image = "https://res.cloudinary.com/.../abc123.jpg";
```

### Organize bằng folders

```javascript
CloudinaryService.uploadFile(buffer, "products");
CloudinaryService.uploadFile(buffer, "avatars");
CloudinaryService.uploadFile(buffer, "banners");
```

### Auto optimization

```javascript
// Tự động chọn format tốt nhất (WebP/JPEG)
// Tự động optimize quality
const url = CloudinaryService.getOptimizedUrl(publicId, width);
```

---

## 📊 Cloudinary vs S3

| Feature         | Cloudinary            | AWS S3             |
| --------------- | --------------------- | ------------------ |
| Free tier       | 25GB + 25GB bandwidth | 5GB only           |
| Setup time      | 5 phút                | 30 phút            |
| Image transform | ✅ Built-in           | ❌ Need Lambda     |
| CDN             | ✅ Built-in           | ❌ Need CloudFront |
| Auto optimize   | ✅ Yes                | ❌ No              |
| Best for        | Images/Videos         | Any files          |

**→ Cloudinary tốt hơn cho image-heavy apps!**

---

## 🐛 Troubleshooting

| Error              | Solution                                 |
| ------------------ | ---------------------------------------- |
| Invalid cloud_name | Check `.env` và restart server           |
| Upload failed      | Check API key/secret, file size < 10MB   |
| Ảnh không hiển thị | Check publicId format: `folder/filename` |

---

## 🎉 Done!

Files đã tạo:

- ✅ `src/configs/cloudinary.js`
- ✅ `src/services/CloudinaryService.js`
- ✅ `src/middleware/upload.js`
- ✅ `src/controllers/UploadController.js`
- ✅ `src/routes/UploadRouter.js`
- ✅ `src/migrations/migrateImagesToCloudinary.js`
- ✅ `.env-example` (updated)
- ✅ `package.json` (updated)

**Next steps:**

1. `yarn add cloudinary multer streamifier`
2. Config `.env` với Cloudinary credentials
3. Thêm route vào `src/index.js`
4. Test với Postman
5. Update ProductService (Option 2)
6. Deploy! 🚀

**Need help?** Đọc `CLOUDINARY_GUIDE.md` để biết chi tiết.
