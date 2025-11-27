const cloudinary = require("../configs/cloudinary");
const streamifier = require("streamifier");

class CloudinaryService {
  /**
   * Upload file buffer lên Cloudinary
   * @param {Buffer} fileBuffer - Buffer của file
   * @param {string} folder - Thư mục lưu trữ (products, avatars, etc.)
   * @param {object} options - Cloudinary upload options
   * @returns {Promise<{publicId: string, url: string, secureUrl: string}>}
   */
  static uploadFile(fileBuffer, folder = "images", options = {}) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: "auto",
          ...options,
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(new Error("Failed to upload file to Cloudinary"));
          } else {
            resolve({
              publicId: result.public_id,
              url: result.url,
              secureUrl: result.secure_url,
              format: result.format,
              width: result.width,
              height: result.height,
            });
          }
        }
      );

      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
  }

  /**
   * Upload base64 image lên Cloudinary
   * @param {string} base64String - Base64 string của ảnh
   * @param {string} folder - Thư mục lưu trữ
   * @param {object} options - Cloudinary upload options
   * @returns {Promise<{publicId: string, url: string, secureUrl: string}>}
   */
  static async uploadBase64(base64String, folder = "images", options = {}) {
    try {
      const result = await cloudinary.uploader.upload(base64String, {
        folder: folder,
        resource_type: "auto",
        ...options,
      });

      return {
        publicId: result.public_id,
        url: result.url,
        secureUrl: result.secure_url,
        format: result.format,
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      console.error("Cloudinary upload base64 error:", error);
      throw new Error("Failed to upload base64 to Cloudinary");
    }
  }

  /**
   * Xóa file từ Cloudinary
   * @param {string} publicId - Public ID của file trên Cloudinary
   * @returns {Promise<boolean>}
   */
  static async deleteFile(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === "ok";
    } catch (error) {
      console.error("Cloudinary delete error:", error);
      return false;
    }
  }

  /**
   * Xóa nhiều files từ Cloudinary
   * @param {string[]} publicIds - Array của public IDs
   * @returns {Promise<{deleted: number, failed: number}>}
   */
  static async deleteMultipleFiles(publicIds) {
    try {
      const result = await cloudinary.api.delete_resources(publicIds);
      return {
        deleted: Object.keys(result.deleted || {}).length,
        failed: Object.keys(result.deleted_counts || {}).length,
      };
    } catch (error) {
      console.error("Cloudinary delete multiple error:", error);
      return { deleted: 0, failed: publicIds.length };
    }
  }

  /**
   * Lấy URL với transformation (resize, crop, optimize, etc.)
   * @param {string} publicId - Public ID của file
   * @param {object} transformOptions - Transformation options
   * @returns {string}
   */
  static getTransformUrl(publicId, transformOptions = {}) {
    return cloudinary.url(publicId, {
      secure: true,
      ...transformOptions,
    });
  }

  /**
   * Get optimized & responsive image URL
   * @param {string} publicId - Public ID
   * @param {number} width - Width
   * @param {number} height - Height (optional)
   * @returns {string}
   */
  static getOptimizedUrl(publicId, width = 800, height = null) {
    const options = {
      secure: true,
      fetch_format: "auto",
      quality: "auto",
      width: width,
      crop: "limit",
    };

    if (height) {
      options.height = height;
    }

    return cloudinary.url(publicId, options);
  }

  /**
   * Get thumbnail URL
   * @param {string} publicId - Public ID
   * @param {number} size - Kích thước thumbnail (default 200)
   * @returns {string}
   */
  static getThumbnailUrl(publicId, size = 200) {
    return cloudinary.url(publicId, {
      secure: true,
      width: size,
      height: size,
      crop: "fill",
      gravity: "auto",
      fetch_format: "auto",
      quality: "auto:good",
    });
  }

  /**
   * Upload multiple files
   * @param {Array<Buffer>} fileBuffers - Array of file buffers
   * @param {string} folder - Folder name
   * @returns {Promise<Array>}
   */
  static async uploadMultipleFiles(fileBuffers, folder = "images") {
    try {
      const uploadPromises = fileBuffers.map((buffer) =>
        this.uploadFile(buffer, folder)
      );
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error("Cloudinary upload multiple error:", error);
      throw new Error("Failed to upload multiple files");
    }
  }

  /**
   * Get file info from Cloudinary
   * @param {string} publicId - Public ID
   * @returns {Promise<object>}
   */
  static async getFileInfo(publicId) {
    try {
      const result = await cloudinary.api.resource(publicId);
      return result;
    } catch (error) {
      console.error("Cloudinary get file info error:", error);
      throw new Error("Failed to get file info");
    }
  }
}

module.exports = CloudinaryService;
