const multer = require("multer");

// Cấu hình multer để lưu file vào memory
const storage = multer.memoryStorage();

// Kiểm tra file type
const fileFilter = (req, file, cb) => {
  // Chấp nhận các định dạng ảnh
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, GIF, WEBP, and SVG are allowed."
      ),
      false
    );
  }
};

// Cấu hình upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // Giới hạn 10MB
  },
});

module.exports = upload;
