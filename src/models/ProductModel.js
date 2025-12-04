const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    image: { type: String },
    price: { type: Number, required: true },
    countInStock: { type: Number, required: true },
    description: { type: String },
    discount: { type: Number },
    discountStartDate: { type: Date },
    discountEndDate: { type: Date },
    sold: { type: Number },
    type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductType",
      required: true,
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
    },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    totalLikes: { type: Number, default: 0 },
    status: {
      type: Number,
      default: 0,
      enum: [0, 1],
    },
    views: { type: Number, default: 0 },
    uniqueViews: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  {
    timestamps: true,
  }
);

// Add indexes for better query performance
productSchema.index({ name: "text" }); // Text index for search
productSchema.index({ price: 1 }); // Index for sorting/filtering by price
productSchema.index({ type: 1 }); // Index for filtering by product type
productSchema.index({ location: 1 }); // Index for filtering by location
productSchema.index({ status: 1 }); // Index for filtering by status

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
