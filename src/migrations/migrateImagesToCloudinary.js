/**
 * Script migration để chuyển ảnh base64 từ database lên Cloudinary
 * 
 * Chạy: node src/migrations/migrateImagesToCloudinary.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../models/ProductModel");
const User = require("../models/UserModel");
const CloudinaryService = require("../services/CloudinaryService");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_DB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✓ Connected to MongoDB");
  } catch (error) {
    console.error("✗ MongoDB connection error:", error);
    process.exit(1);
  }
};

/**
 * Kiểm tra xem string có phải là base64 image không
 */
const isBase64Image = (str) => {
  if (!str || typeof str !== "string") return false;
  return str.startsWith("data:image/");
};

/**
 * Migrate Product images
 */
const migrateProductImages = async () => {
  try {
    console.log("\n=== Migrating Product Images ===");
    
    const products = await Product.find({});
    console.log(`Found ${products.length} products`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const product of products) {
      try {
        // Kiểm tra xem image có phải base64 không
        if (isBase64Image(product.image)) {
          console.log(`Migrating product: ${product.name} (ID: ${product._id})`);
          
          // Upload lên Cloudinary
          const result = await CloudinaryService.uploadBase64(
            product.image,
            "products"
          );

          // Cập nhật database với Cloudinary public ID
          product.image = result.publicId; // Lưu public ID
          await product.save();

          migratedCount++;
          console.log(`  ✓ Uploaded to Cloudinary: ${result.publicId}`);
          console.log(`  URL: ${result.secureUrl}`);
        } else {
          skippedCount++;
          console.log(`  - Skipped product ${product._id} (already migrated or no image)`);
        }
      } catch (error) {
        errorCount++;
        console.error(`  ✗ Error migrating product ${product._id}:`, error.message);
      }
    }

    console.log("\nProduct Migration Summary:");
    console.log(`  ✓ Migrated: ${migratedCount}`);
    console.log(`  - Skipped: ${skippedCount}`);
    console.log(`  ✗ Errors: ${errorCount}`);
  } catch (error) {
    console.error("Error in migrateProductImages:", error);
  }
};

/**
 * Migrate User avatars
 */
const migrateUserAvatars = async () => {
  try {
    console.log("\n=== Migrating User Avatars ===");
    
    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        // Kiểm tra xem avatar có phải base64 không
        if (isBase64Image(user.avatar)) {
          console.log(`Migrating user: ${user.email} (ID: ${user._id})`);
          
          // Upload lên Cloudinary
          const result = await CloudinaryService.uploadBase64(
            user.avatar,
            "avatars"
          );

          // Cập nhật database với Cloudinary public ID
          user.avatar = result.publicId; // Lưu public ID
          await user.save();

          migratedCount++;
          console.log(`  ✓ Uploaded to Cloudinary: ${result.publicId}`);
          console.log(`  URL: ${result.secureUrl}`);
        } else {
          skippedCount++;
          console.log(`  - Skipped user ${user._id} (already migrated or no avatar)`);
        }
      } catch (error) {
        errorCount++;
        console.error(`  ✗ Error migrating user ${user._id}:`, error.message);
      }
    }

    console.log("\nUser Migration Summary:");
    console.log(`  ✓ Migrated: ${migratedCount}`);
    console.log(`  - Skipped: ${skippedCount}`);
    console.log(`  ✗ Errors: ${errorCount}`);
  } catch (error) {
    console.error("Error in migrateUserAvatars:", error);
  }
};

/**
 * Main migration function
 */
const runMigration = async () => {
  try {
    console.log("Starting migration to Cloudinary...\n");
    
    await connectDB();
    
    // Migrate products
    await migrateProductImages();
    
    // Migrate users
    await migrateUserAvatars();
    
    console.log("\n✓ Migration completed!");
    process.exit(0);
  } catch (error) {
    console.error("\n✗ Migration failed:", error);
    process.exit(1);
  }
};

// Run migration
runMigration();
