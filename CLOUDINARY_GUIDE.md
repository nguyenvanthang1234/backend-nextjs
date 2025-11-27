# 🌟 Hướng dẫn sử dụng Cloudinary

## 📋 Tổng quan

Cloudinary là dịch vụ quản lý media trên cloud với các tính năng:

- ✅ **Free tier hào phóng**: 25GB storage, 25GB bandwidth/tháng
- ✅ **Auto optimization**: Tự động tối ưu ảnh
- ✅ **Image transformation**: Resize, crop, watermark, effects
- ✅ **CDN built-in**: Phân phối nhanh toàn cầu
- ✅ **Easy to use**: Setup đơn giản hơn AWS S3

---

## 🚀 Quick Start (5 phút)

### 1. Đăng ký Cloudinary (Free)

1. Truy cập [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Đăng ký tài khoản miễn phí
3. Sau khi đăng nhập, vào **Dashboard** để lấy credentials

### 2. Lấy API Credentials

Trong **Dashboard**, bạn sẽ thấy:

```
Cloud name: your_cloud_name
API Key: 123456789012345
API Secret: abcdefghijklmnopqrstuvwxyz
```

### 3. Cài đặt Dependencies

```bash
yarn add cloudinary multer streamifier
```

### 4. Cấu hình Environment

Thêm vào file `.env`:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz
```

### 5. Thêm Route vào App

File `src/index.js`:

```javascript
const uploadRouter = require("./routes/UploadRouter");

app.use("/api/upload", uploadRouter);
```

### 6. Test với Postman

```
POST http://localhost:3001/api/upload/single?folder=products
Headers:
  Authorization: Bearer <your_token>
Body: form-data
  file: [select image]
```

**Response:**

```json
{
  "status": "Success",
  "message": "File uploaded successfully",
  "data": {
    "publicId": "products/abc123xyz",
    "url": "http://res.cloudinary.com/your_cloud/image/upload/v1234567890/products/abc123xyz.jpg",
    "secureUrl": "https://res.cloudinary.com/your_cloud/image/upload/v1234567890/products/abc123xyz.jpg",
    "format": "jpg",
    "width": 1920,
    "height": 1080
  }
}
```

---

## 📁 Cấu trúc Files

```
src/
├── configs/
│   └── cloudinary.js              # Cloudinary config
├── services/
│   └── CloudinaryService.js       # Service upload/delete/transform
├── middleware/
│   └── upload.js                  # Multer middleware
├── controllers/
│   └── UploadController.js        # Upload endpoints
├── routes/
│   └── UploadRouter.js            # Routes
└── migrations/
    └── migrateImagesToCloudinary.js  # Migration script
```

---

## 🛠️ API Endpoints

### 1. Upload Single File

**Endpoint:** `POST /api/upload/single?folder=products`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body (form-data):**

- `file`: File ảnh

**Response:**

```json
{
  "status": "Success",
  "data": {
    "publicId": "products/abc123",
    "url": "http://...",
    "secureUrl": "https://...",
    "format": "jpg",
    "width": 1920,
    "height": 1080
  }
}
```

### 2. Upload Multiple Files

**Endpoint:** `POST /api/upload/multiple?folder=products`

**Body (form-data):**

- `files`: Multiple files (max 10)

### 3. Upload Base64 (Backward Compatible)

**Endpoint:** `POST /api/upload/base64`

**Body:**

```json
{
  "base64": "data:image/jpeg;base64,/9j/4AAQ...",
  "folder": "products"
}
```

### 4. Delete File

**Endpoint:** `DELETE /api/upload/:publicId`

**Example:**

```
DELETE /api/upload/products%2Fabc123
```

### 5. Get Optimized URL

**Endpoint:** `GET /api/upload/optimize/:publicId?width=800&height=600`

**Example:**

```
GET /api/upload/optimize/products%2Fabc123?width=800
```

**Response:**

```json
{
  "status": "Success",
  "data": {
    "url": "https://res.cloudinary.com/.../w_800,q_auto,f_auto/products/abc123.jpg"
  }
}
```

---

## 💻 Sử dụng trong Code

### Option 1: Frontend upload trước (Recommended) ⭐

**Frontend:**

```javascript
// 1. Upload ảnh
const formData = new FormData();
formData.append("file", imageFile);

const uploadRes = await fetch("/api/upload/single?folder=products", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
});

const { data } = await uploadRes.json();
const publicId = data.publicId; // "products/abc123"
const imageUrl = data.secureUrl; // URL đầy đủ

// 2. Create product với publicId
await fetch("/api/product", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    name: "Product Name",
    image: publicId, // Lưu publicId
    price: 100000,
  }),
});
```

**Backend: Không cần thay đổi gì!**

---

### Option 2: Backend auto-convert base64 → Cloudinary

**ProductService.js - createProduct:**

```javascript
const CloudinaryService = require("./CloudinaryService");

const createProduct = (newProduct) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { image, ...rest } = newProduct;

      let imagePublicId = image;

      // Auto upload base64 lên Cloudinary
      if (image && image.startsWith("data:image/")) {
        const result = await CloudinaryService.uploadBase64(image, "products");
        imagePublicId = result.publicId;
      }

      const product = await Product.create({
        ...rest,
        image: imagePublicId,
      });

      resolve({
        status: 200,
        data: product,
        message: "Success",
      });
    } catch (e) {
      reject(e);
    }
  });
};
```

**ProductService.js - updateProduct:**

```javascript
const updateProduct = (id, data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const product = await Product.findById(id);
      if (!product) {
        return resolve({
          status: 404,
          message: "Product not found",
        });
      }

      let imagePublicId = data.image;

      // Upload ảnh mới nếu là base64
      if (data.image && data.image.startsWith("data:image/")) {
        const result = await CloudinaryService.uploadBase64(
          data.image,
          "products"
        );
        imagePublicId = result.publicId;

        // Xóa ảnh cũ từ Cloudinary
        if (product.image && !product.image.startsWith("data:image/")) {
          await CloudinaryService.deleteFile(product.image);
        }
      }

      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        { ...data, image: imagePublicId },
        { new: true }
      );

      resolve({
        status: 200,
        data: updatedProduct,
      });
    } catch (e) {
      reject(e);
    }
  });
};
```

**ProductService.js - deleteProduct:**

```javascript
const deleteProduct = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const product = await Product.findById(id);
      if (!product) {
        return resolve({ status: 404, message: "Product not found" });
      }

      // Xóa ảnh từ Cloudinary
      if (product.image && !product.image.startsWith("data:image/")) {
        await CloudinaryService.deleteFile(product.image);
      }

      await Product.findByIdAndDelete(id);

      resolve({
        status: 200,
        message: "Deleted successfully",
      });
    } catch (e) {
      reject(e);
    }
  });
};
```

**ProductService.js - getDetailsProduct (với URL):**

```javascript
const getDetailsProduct = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const product = await Product.findById(id)
        .populate("type")
        .populate("location");

      if (!product) {
        return resolve({ status: 404, message: "Not found" });
      }

      const productData = product.toObject();

      // Convert publicId sang URL
      if (productData.image && !productData.image.startsWith("http")) {
        // Lấy optimized URL
        productData.imageUrl = CloudinaryService.getOptimizedUrl(
          productData.image,
          800 // width
        );

        // Hoặc thumbnail
        productData.thumbnailUrl = CloudinaryService.getThumbnailUrl(
          productData.image,
          200 // size
        );
      }

      resolve({
        status: 200,
        data: productData,
      });
    } catch (e) {
      reject(e);
    }
  });
};
```

---

## 🔄 Migration Data Cũ

### Bước 1: Backup Database

```bash
mongodump --uri="your_mongo_uri" --out=./backup
```

### Bước 2: Chạy Migration

```bash
yarn migrate:cloudinary
```

Script sẽ:

- Tìm tất cả products và users có base64 images
- Upload lên Cloudinary
- Cập nhật DB với publicId
- Hiển thị progress

### Bước 3: Verify

- Check Cloudinary Media Library có ảnh chưa
- Check database: `image` field giờ là publicId
- Test API xem ảnh hiển thị OK không

---

## 🎨 Image Transformations

### Resize & Optimize

```javascript
const url = CloudinaryService.getOptimizedUrl("products/abc123", 800);
// https://res.cloudinary.com/.../w_800,q_auto,f_auto/products/abc123.jpg
```

### Thumbnail

```javascript
const thumb = CloudinaryService.getThumbnailUrl("products/abc123", 200);
// https://res.cloudinary.com/.../w_200,h_200,c_fill,g_auto/products/abc123.jpg
```

### Custom Transformation

```javascript
const url = CloudinaryService.getTransformUrl("products/abc123", {
  width: 500,
  height: 300,
  crop: "fill",
  gravity: "face",
  radius: 20,
  effect: "brightness:20",
});
```

### Advanced Transformations

```javascript
// Watermark
cloudinary.url("products/abc123", {
  overlay: "watermark_logo",
  gravity: "south_east",
  opacity: 50,
  width: 100,
});

// Blur background
cloudinary.url("products/abc123", {
  effect: "blur_region:2000",
  gravity: "faces",
});

// Multiple transformations
cloudinary.url("products/abc123", {
  transformation: [
    { width: 800, height: 600, crop: "fill" },
    { effect: "sharpen:100" },
    { quality: "auto:good" },
  ],
});
```

---

## 💡 Best Practices

### 1. Lưu Public ID thay vì URL

```javascript
// ✅ Good - Lưu publicId
product.image = "products/abc123";

// ❌ Bad - Lưu full URL
product.image = "https://res.cloudinary.com/.../products/abc123.jpg";
```

**Lý do:**

- Public ID linh hoạt, có thể transform bất cứ lúc nào
- URL có thể thay đổi khi Cloudinary update
- Tiết kiệm storage

### 2. Sử dụng Folders

```javascript
// Organize by type
CloudinaryService.uploadFile(buffer, "products");
CloudinaryService.uploadFile(buffer, "avatars");
CloudinaryService.uploadFile(buffer, "banners");
```

### 3. Auto Optimization

```javascript
// Luôn dùng auto optimization
const url = CloudinaryService.getOptimizedUrl(publicId, width);
// Tự động chọn format tốt nhất (WebP cho Chrome, JPEG cho Safari)
// Tự động optimize quality
```

### 4. Lazy Loading

```javascript
// Frontend - React/Next.js
<img
  src={CloudinaryService.getOptimizedUrl(publicId, 50)} // Low quality placeholder
  data-src={CloudinaryService.getOptimizedUrl(publicId, 800)} // Full quality
  loading="lazy"
/>
```

### 5. Responsive Images

```javascript
// Generate srcset
const sizes = [400, 800, 1200, 1600];
const srcset = sizes
  .map(
    (size) => `${CloudinaryService.getOptimizedUrl(publicId, size)} ${size}w`
  )
  .join(", ");

<img srcSet={srcset} sizes="(max-width: 768px) 100vw, 50vw" />;
```

---

## 📊 So sánh Cloudinary vs S3

| Feature             | Cloudinary                    | AWS S3                         |
| ------------------- | ----------------------------- | ------------------------------ |
| **Free tier**       | 25GB storage + 25GB bandwidth | 5GB storage + limited requests |
| **Setup**           | 5 phút                        | 20-30 phút                     |
| **Image transform** | ✅ Built-in                   | ❌ Cần Lambda                  |
| **CDN**             | ✅ Built-in                   | ❌ Cần CloudFront              |
| **Auto optimize**   | ✅ Yes                        | ❌ No                          |
| **Cost (small)**    | Free                          | ~$5/month                      |
| **Cost (large)**    | Higher                        | Lower                          |
| **Best for**        | Images, videos                | Any files                      |

**Kết luận:** Cloudinary tốt hơn cho image-heavy apps. S3 tốt hơn cho general file storage.

---

## 💰 Pricing (Cloudinary)

### Free Plan

- ✅ 25 GB storage
- ✅ 25 GB bandwidth/month
- ✅ 25,000 transformations/month
- ✅ All transformation features
- **Perfect cho startup/small business!**

### Paid Plans

- **Plus**: $89/month - 80GB storage, 160GB bandwidth
- **Advanced**: $249/month - 200GB storage, 400GB bandwidth
- **Custom**: Enterprise pricing

**Ước tính chi phí:**

- 1000 products x 500KB = 500MB storage = **FREE**
- 10,000 views/month = **FREE**
- Chỉ trả tiền khi traffic lớn

---

## 🔐 Security

### 1. Protect API Credentials

```javascript
// ✅ Good - Use .env
CLOUDINARY_API_SECRET = abc123;

// ❌ Bad - Hardcode
const cloudinary = require("cloudinary").v2;
cloudinary.config({ api_secret: "abc123" });
```

### 2. Upload Validation

```javascript
// Middleware đã có sẵn validation:
// - File type: jpg, png, gif, webp, svg
// - File size: max 10MB
```

### 3. Signed Uploads (Advanced)

```javascript
// Generate signature cho frontend upload trực tiếp
const signature = cloudinary.utils.api_sign_request(
  { timestamp: timestamp },
  process.env.CLOUDINARY_API_SECRET
);
```

---

## 🐛 Troubleshooting

### Error: "Invalid cloud_name"

- ✅ Check `.env` có đúng `CLOUDINARY_CLOUD_NAME`
- ✅ Restart server sau khi thay đổi `.env`

### Error: "Upload failed"

- ✅ Check API key và secret
- ✅ Check file size < 10MB
- ✅ Check file type (jpg, png, gif, webp, svg only)

### Migration script không chạy

- ✅ Check MongoDB connection
- ✅ Check có base64 images trong DB không
- ✅ Check Cloudinary credentials

### Ảnh không hiển thị

- ✅ Check publicId đúng format: `folder/filename`
- ✅ Check URL generation: `CloudinaryService.getOptimizedUrl(publicId)`
- ✅ Check Cloudinary Media Library có ảnh không

---

## 📱 Frontend Examples

### React

```javascript
import { useState } from "react";

function ProductForm() {
  const [imageUrl, setImageUrl] = useState("");

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload/single?folder=products", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const { data } = await res.json();
    setImageUrl(data.secureUrl);
    // Save data.publicId to your product
  };

  return (
    <div>
      <input type="file" onChange={handleUpload} />
      {imageUrl && <img src={imageUrl} alt="Preview" />}
    </div>
  );
}
```

### Next.js with Image Component

```javascript
import Image from "next/image";

function ProductCard({ product }) {
  // product.image = "products/abc123"
  const imageUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_800,q_auto,f_auto/${product.image}`;

  return (
    <Image
      src={imageUrl}
      alt={product.name}
      width={800}
      height={600}
      loading="lazy"
    />
  );
}
```

---

## 🎉 Kết luận

**Cloudinary là lựa chọn tuyệt vời cho:**

- ✅ E-commerce apps (nhiều ảnh sản phẩm)
- ✅ Social media apps (ảnh user-generated)
- ✅ Blog/CMS (ảnh bài viết)
- ✅ Startup (free tier hào phóng)

**Bắt đầu ngay:**

1. Đăng ký Cloudinary free
2. Cài `yarn add cloudinary multer streamifier`
3. Config `.env`
4. Thêm route upload
5. Test và enjoy! 🚀

---

**Questions?** Check:

- [Cloudinary Docs](https://cloudinary.com/documentation)
- [Node.js SDK](https://cloudinary.com/documentation/node_integration)
- [Transformation Reference](https://cloudinary.com/documentation/image_transformations)
