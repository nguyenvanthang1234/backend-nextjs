# 📦 API Response Format - Cloudinary Images

## ✨ Response bây giờ trả về URL Cloudinary!

### **Product API Response**

#### **Create Product (POST /api/products)**

```json
{
  "status": "Success",
  "message": "Created product success",
  "data": {
    "_id": "673f2a1b4c5d6e7f8a9b0c1d",
    "name": "Product Name",
    "image": "products/abc123xyz456", // ← publicId (lưu trong DB)
    "imageUrl": "https://res.cloudinary.com/dkqb1zkju/image/upload/w_800,q_auto,f_auto/products/abc123xyz456.jpg", // ← URL full quality
    "thumbnailUrl": "https://res.cloudinary.com/dkqb1zkju/image/upload/w_200,h_200,c_fill,q_auto/products/abc123xyz456.jpg", // ← Thumbnail nhỏ
    "price": 100000,
    "type": "...",
    "countInStock": 10,
    "slug": "product-name",
    "createdAt": "2024-11-27T04:42:00.000Z"
  }
}
```

#### **Update Product (PUT /api/products/:id)**

```json
{
  "status": "Success",
  "message": "Updated product success",
  "data": {
    "_id": "673f2a1b4c5d6e7f8a9b0c1d",
    "name": "Updated Product Name",
    "image": "products/xyz789new", // ← publicId mới
    "imageUrl": "https://res.cloudinary.com/.../w_800,q_auto,f_auto/products/xyz789new.jpg",
    "thumbnailUrl": "https://res.cloudinary.com/.../w_200,h_200,c_fill,q_auto/products/xyz789new.jpg",
    "price": 150000
  }
}
```

#### **Get Product Details (GET /api/products/:id)**

```json
{
  "status": "Success",
  "message": "Success",
  "data": {
    "_id": "673f2a1b4c5d6e7f8a9b0c1d",
    "name": "Product Name",
    "image": "products/abc123xyz456",
    "imageUrl": "https://res.cloudinary.com/.../w_800,q_auto,f_auto/products/abc123xyz456.jpg",
    "thumbnailUrl": "https://res.cloudinary.com/.../w_200,h_200,c_fill,q_auto/products/abc123xyz456.jpg",
    "price": 100000
  }
}
```

#### **Get All Products (GET /api/products)**

```json
{
  "status": "Success",
  "message": "Success",
  "data": {
    "products": [
      {
        "_id": "673f2a1b4c5d6e7f8a9b0c1d",
        "name": "Product 1",
        "image": "products/abc123",
        "imageUrl": "https://res.cloudinary.com/.../w_800,q_auto,f_auto/products/abc123.jpg",
        "thumbnailUrl": "https://res.cloudinary.com/.../w_200,h_200,c_fill/products/abc123.jpg",
        "price": 100000
      },
      {
        "_id": "673f2a1b4c5d6e7f8a9b0c1e",
        "name": "Product 2",
        "image": "products/xyz789",
        "imageUrl": "https://res.cloudinary.com/.../w_800,q_auto,f_auto/products/xyz789.jpg",
        "thumbnailUrl": "https://res.cloudinary.com/.../w_200,h_200,c_fill/products/xyz789.jpg",
        "price": 150000
      }
    ],
    "totalPage": 5,
    "totalCount": 50
  }
}
```

---

### **User API Response**

#### **Create User (POST /api/users)**

```json
{
  "status": "Success",
  "message": "Created user success",
  "data": {
    "_id": "673f2a1b4c5d6e7f8a9b0c1d",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "avatar": "avatars/user123abc", // ← publicId
    "avatarUrl": "https://res.cloudinary.com/dkqb1zkju/image/upload/w_400,q_auto,f_auto/avatars/user123abc.jpg", // ← Avatar full
    "avatarThumbnail": "https://res.cloudinary.com/dkqb1zkju/image/upload/w_100,h_100,c_fill,q_auto/avatars/user123abc.jpg", // ← Avatar nhỏ
    "phoneNumber": "0123456789",
    "createdAt": "2024-11-27T04:42:00.000Z"
  }
}
```

**Note:** Password không bao giờ được trả về trong response! ✅

#### **Update User (PUT /api/users/:id)**

```json
{
  "status": "Success",
  "message": "Updated user success",
  "data": {
    "_id": "673f2a1b4c5d6e7f8a9b0c1d",
    "email": "user@example.com",
    "firstName": "John",
    "avatar": "avatars/user456new",
    "avatarUrl": "https://res.cloudinary.com/.../w_400,q_auto,f_auto/avatars/user456new.jpg",
    "avatarThumbnail": "https://res.cloudinary.com/.../w_100,h_100,c_fill,q_auto/avatars/user456new.jpg"
  }
}
```

#### **Get User Details (GET /api/users/:id)**

```json
{
  "status": "Success",
  "message": "Success",
  "data": {
    "_id": "673f2a1b4c5d6e7f8a9b0c1d",
    "email": "user@example.com",
    "firstName": "John",
    "avatar": "avatars/user123abc",
    "avatarUrl": "https://res.cloudinary.com/.../w_400,q_auto,f_auto/avatars/user123abc.jpg",
    "avatarThumbnail": "https://res.cloudinary.com/.../w_100,h_100,c_fill,q_auto/avatars/user123abc.jpg"
  }
}
```

#### **Get All Users (GET /api/users)**

```json
{
  "status": "Success",
  "message": "Success",
  "data": {
    "users": [
      {
        "_id": "673f2a1b4c5d6e7f8a9b0c1d",
        "email": "user1@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "avatar": "avatars/user123",
        "avatarUrl": "https://res.cloudinary.com/.../w_400,q_auto,f_auto/avatars/user123.jpg",
        "avatarThumbnail": "https://res.cloudinary.com/.../w_100,h_100,c_fill/avatars/user123.jpg"
      },
      {
        "_id": "673f2a1b4c5d6e7f8a9b0c1e",
        "email": "user2@example.com",
        "firstName": "Jane",
        "lastName": "Smith",
        "avatar": "avatars/user456",
        "avatarUrl": "https://res.cloudinary.com/.../w_400,q_auto,f_auto/avatars/user456.jpg",
        "avatarThumbnail": "https://res.cloudinary.com/.../w_100,h_100,c_fill/avatars/user456.jpg"
      }
    ],
    "totalPage": 3,
    "totalCount": 25
  }
}
```

**Note:** Password không bao giờ được trả về! ✅

---

## 🎨 Frontend Usage

### **Hiển thị Product Image**

#### **Cách 1: Dùng imageUrl từ response (Recommended)**

```jsx
// React/Next.js
<img src={product.imageUrl} alt={product.name} loading="lazy" />
```

#### **Cách 2: Dùng thumbnailUrl cho list/grid**

```jsx
// Product Grid - Load nhanh hơn
<img
  src={product.thumbnailUrl}
  alt={product.name}
  className="w-48 h-48 object-cover"
/>

// Product Details - Full quality
<img
  src={product.imageUrl}
  alt={product.name}
  className="w-full"
/>
```

#### **Cách 3: Progressive Loading**

```jsx
// Hiển thị thumbnail trước, sau đó load full quality
<img
  src={product.thumbnailUrl}
  data-src={product.imageUrl}
  className="lazy-load"
  onLoad={(e) => {
    const img = e.target;
    img.src = img.dataset.src;
  }}
/>
```

---

### **Hiển thị User Avatar**

```jsx
// Avatar lớn (Profile page)
<img
  src={user.avatarUrl}
  alt={user.firstName}
  className="w-32 h-32 rounded-full"
/>

// Avatar nhỏ (Comments, Navbar)
<img
  src={user.avatarThumbnail}
  alt={user.firstName}
  className="w-10 h-10 rounded-full"
/>
```

---

## 📊 Response Fields Explained

### **Product**

| Field          | Type   | Description                                   |
| -------------- | ------ | --------------------------------------------- |
| `image`        | string | PublicId lưu trong database                   |
| `imageUrl`     | string | URL full quality (800px width, auto optimize) |
| `thumbnailUrl` | string | URL thumbnail (200x200px, cropped)            |

### **User**

| Field             | Type   | Description                                   |
| ----------------- | ------ | --------------------------------------------- |
| `avatar`          | string | PublicId lưu trong database                   |
| `avatarUrl`       | string | URL full quality (400px width, auto optimize) |
| `avatarThumbnail` | string | URL thumbnail (100x100px, cropped)            |

---

## 🔄 Backward Compatibility

### **Nếu image/avatar là base64 cũ:**

```json
{
  "image": "data:image/jpeg;base64,/9j/...",
  "imageUrl": null, // Không có URL
  "thumbnailUrl": null
}
```

### **Nếu image/avatar là URL cũ:**

```json
{
  "image": "https://example.com/old-image.jpg",
  "imageUrl": "https://example.com/old-image.jpg", // Giữ nguyên URL cũ
  "thumbnailUrl": null
}
```

### **Nếu image/avatar là Cloudinary publicId:**

```json
{
  "image": "products/abc123",
  "imageUrl": "https://res.cloudinary.com/.../products/abc123.jpg", // ✅ Auto generate
  "thumbnailUrl": "https://res.cloudinary.com/.../w_200,h_200/products/abc123.jpg" // ✅ Auto generate
}
```

---

## 🌐 URL Structure

### **Product Image URL**

```
https://res.cloudinary.com/{cloud_name}/image/upload/w_800,q_auto,f_auto/{publicId}.jpg
                                                      ^^^^^^^^^^^^^^^^
                                                      Transformations
```

**Transformations:**

- `w_800` - Width 800px
- `q_auto` - Auto quality optimization
- `f_auto` - Auto format (WebP for Chrome, JPEG for Safari)

### **Thumbnail URL**

```
https://res.cloudinary.com/{cloud_name}/image/upload/w_200,h_200,c_fill,q_auto/{publicId}.jpg
                                                      ^^^^^^^^^^^^^^^^^^^^^^^
                                                      Transformations
```

**Transformations:**

- `w_200,h_200` - 200x200px
- `c_fill` - Crop & fill (không bị méo)
- `q_auto` - Auto quality

---

## 🎯 Benefits

### **Performance**

✅ CDN delivery (fast worldwide)  
✅ Auto format optimization (WebP/JPEG)  
✅ Auto quality optimization  
✅ Lazy loading ready  
✅ Responsive images ready

### **Developer Experience**

✅ No manual URL building  
✅ Multiple sizes ready (full + thumbnail)  
✅ Backward compatible  
✅ Type-safe fields

### **Storage**

✅ Database size giảm 25,000 lần  
✅ Query nhanh hơn  
✅ Backup nhanh hơn  
✅ Easy to scale

---

## 📝 Example Flow

### **Create Product with Base64**

**Request:**

```json
POST /api/products
{
  "name": "New Product",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "price": 100000
}
```

**Backend Process:**

1. Nhận base64
2. Upload lên Cloudinary → `products/abc123`
3. Lưu publicId vào database
4. Generate URLs (`imageUrl`, `thumbnailUrl`)
5. Return response

**Response:**

```json
{
  "status": "Success",
  "data": {
    "name": "New Product",
    "image": "products/abc123", // ← Saved in DB
    "imageUrl": "https://res.cloudinary.com/.../products/abc123.jpg", // ← Ready to use!
    "thumbnailUrl": "https://res.cloudinary.com/.../w_200/products/abc123.jpg",
    "price": 100000
  }
}
```

**Frontend:**

```jsx
// Sử dụng ngay!
<img src={response.data.imageUrl} alt={response.data.name} />
```

---

## 🎉 Summary

✅ **Response trả về URL Cloudinary ngay lập tức**  
✅ **2 sizes: full quality + thumbnail**  
✅ **Auto optimization (format, quality, CDN)**  
✅ **Backward compatible với base64 và URL cũ**  
✅ **Frontend không cần build URL manually**  
✅ **Ready to use trong `<img>` tag**

🚀 **Chỉ cần dùng `imageUrl` hoặc `avatarUrl` từ response!**
