const { CONFIG_MESSAGE_ERRORS } = require("../configs");
const CloudinaryService = require("../services/CloudinaryService");

/**
 * Upload single file to Cloudinary
 * POST /api/upload/single
 * Body: multipart/form-data với field "file"
 * Query: ?folder=products|avatars|images (optional)
 */
const uploadSingle = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(CONFIG_MESSAGE_ERRORS.INVALID.status).json({
        status: "Error",
        typeError: CONFIG_MESSAGE_ERRORS.INVALID.type,
        message: "No file uploaded",
        data: null,
      });
    }

    const folder = req.query.folder || "images";
    const result = await CloudinaryService.uploadFile(
      req.file.buffer,
      folder
    );

    return res.status(CONFIG_MESSAGE_ERRORS.ACTION_SUCCESS.status).json({
      status: "Success",
      typeError: "",
      message: "File uploaded successfully",
      data: result,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(CONFIG_MESSAGE_ERRORS.INTERNAL_ERROR.status).json({
      status: "Error",
      typeError: CONFIG_MESSAGE_ERRORS.INTERNAL_ERROR.type,
      message: error.message || "Failed to upload file",
      data: null,
    });
  }
};

/**
 * Upload multiple files to Cloudinary
 * POST /api/upload/multiple
 * Body: multipart/form-data với field "files"
 * Query: ?folder=products|avatars|images (optional)
 */
const uploadMultiple = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(CONFIG_MESSAGE_ERRORS.INVALID.status).json({
        status: "Error",
        typeError: CONFIG_MESSAGE_ERRORS.INVALID.type,
        message: "No files uploaded",
        data: null,
      });
    }

    const folder = req.query.folder || "images";
    const fileBuffers = req.files.map((file) => file.buffer);
    const results = await CloudinaryService.uploadMultipleFiles(
      fileBuffers,
      folder
    );

    return res.status(CONFIG_MESSAGE_ERRORS.ACTION_SUCCESS.status).json({
      status: "Success",
      typeError: "",
      message: "Files uploaded successfully",
      data: results,
    });
  } catch (error) {
    console.error("Upload multiple error:", error);
    return res.status(CONFIG_MESSAGE_ERRORS.INTERNAL_ERROR.status).json({
      status: "Error",
      typeError: CONFIG_MESSAGE_ERRORS.INTERNAL_ERROR.type,
      message: error.message || "Failed to upload files",
      data: null,
    });
  }
};

/**
 * Delete file from Cloudinary
 * DELETE /api/upload/:publicId
 * Params: publicId - Cloudinary public ID (URL encoded)
 */
const deleteFile = async (req, res) => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      return res.status(CONFIG_MESSAGE_ERRORS.INVALID.status).json({
        status: "Error",
        typeError: CONFIG_MESSAGE_ERRORS.INVALID.type,
        message: "Public ID is required",
        data: null,
      });
    }

    // Decode URL
    const decodedPublicId = decodeURIComponent(publicId);
    const success = await CloudinaryService.deleteFile(decodedPublicId);

    if (success) {
      return res.status(CONFIG_MESSAGE_ERRORS.ACTION_SUCCESS.status).json({
        status: "Success",
        typeError: "",
        message: "File deleted successfully",
        data: null,
      });
    } else {
      return res.status(CONFIG_MESSAGE_ERRORS.INTERNAL_ERROR.status).json({
        status: "Error",
        typeError: CONFIG_MESSAGE_ERRORS.INTERNAL_ERROR.type,
        message: "Failed to delete file",
        data: null,
      });
    }
  } catch (error) {
    console.error("Delete file error:", error);
    return res.status(CONFIG_MESSAGE_ERRORS.INTERNAL_ERROR.status).json({
      status: "Error",
      typeError: CONFIG_MESSAGE_ERRORS.INTERNAL_ERROR.type,
      message: error.message || "Failed to delete file",
      data: null,
    });
  }
};

/**
 * Upload base64 image to Cloudinary (compatibility với code cũ)
 * POST /api/upload/base64
 * Body: { base64: string, folder?: string }
 */
const uploadBase64 = async (req, res) => {
  try {
    const { base64, folder = "images" } = req.body;

    if (!base64) {
      return res.status(CONFIG_MESSAGE_ERRORS.INVALID.status).json({
        status: "Error",
        typeError: CONFIG_MESSAGE_ERRORS.INVALID.type,
        message: "Base64 string is required",
        data: null,
      });
    }

    const result = await CloudinaryService.uploadBase64(base64, folder);

    return res.status(CONFIG_MESSAGE_ERRORS.ACTION_SUCCESS.status).json({
      status: "Success",
      typeError: "",
      message: "Base64 image uploaded successfully",
      data: result,
    });
  } catch (error) {
    console.error("Upload base64 error:", error);
    return res.status(CONFIG_MESSAGE_ERRORS.INTERNAL_ERROR.status).json({
      status: "Error",
      typeError: CONFIG_MESSAGE_ERRORS.INTERNAL_ERROR.type,
      message: error.message || "Failed to upload base64 image",
      data: null,
    });
  }
};

/**
 * Get optimized image URL
 * GET /api/upload/optimize/:publicId?width=800&height=600
 */
const getOptimizedUrl = async (req, res) => {
  try {
    const { publicId } = req.params;
    const { width = 800, height } = req.query;

    if (!publicId) {
      return res.status(CONFIG_MESSAGE_ERRORS.INVALID.status).json({
        status: "Error",
        typeError: CONFIG_MESSAGE_ERRORS.INVALID.type,
        message: "Public ID is required",
        data: null,
      });
    }

    const decodedPublicId = decodeURIComponent(publicId);
    const url = CloudinaryService.getOptimizedUrl(
      decodedPublicId,
      parseInt(width),
      height ? parseInt(height) : null
    );

    return res.status(CONFIG_MESSAGE_ERRORS.GET_SUCCESS.status).json({
      status: "Success",
      typeError: "",
      message: "URL generated successfully",
      data: { url },
    });
  } catch (error) {
    console.error("Get optimized URL error:", error);
    return res.status(CONFIG_MESSAGE_ERRORS.INTERNAL_ERROR.status).json({
      status: "Error",
      typeError: CONFIG_MESSAGE_ERRORS.INTERNAL_ERROR.type,
      message: error.message || "Failed to generate URL",
      data: null,
    });
  }
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  deleteFile,
  uploadBase64,
  getOptimizedUrl,
};
