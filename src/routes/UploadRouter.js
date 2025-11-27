const express = require("express");
const router = express.Router();
const UploadController = require("../controllers/UploadController");
const upload = require("../middleware/upload");
const { AuthPermission } = require("../middleware/AuthPermission");

// Upload single file
router.post(
  "/single",
  AuthPermission("", true), // Chỉ cần login
  upload.single("file"),
  UploadController.uploadSingle
);

// Upload multiple files
router.post(
  "/multiple",
  AuthPermission("", true), // Chỉ cần login
  upload.array("files", 10), // Max 10 files
  UploadController.uploadMultiple
);

// Upload base64 (compatibility)
router.post("/base64", AuthPermission("", true), UploadController.uploadBase64);

// Get optimized URL
router.get("/optimize/:publicId", UploadController.getOptimizedUrl);

// Delete file
router.delete("/:publicId", AuthPermission("", true), UploadController.deleteFile);

module.exports = router;
