const inventoryQueue = require("../queues/inventoryQueue");
const Product = require("../models/ProductModel");
const { CONFIG_MESSAGE_ERRORS } = require("../configs");

// Process inventory jobs
inventoryQueue.process(async (job) => {
  const { type, data } = job.data;

  console.log(`📦 Processing inventory job ${job.id} - Type: ${type}`);

  try {
    if (type === "UPDATE_STOCK") {
      const { productId, amount } = data;

      const productData = await Product.findOneAndUpdate(
        { _id: productId, countInStock: { $gte: amount } },
        { $inc: { countInStock: -amount, sold: +amount } },
        { new: true }
      );

      if (!productData) {
        throw new Error(`Product ${productId} out of stock or not found`);
      }

      console.log(
        `✅ Stock updated for product ${productId}: -${amount} (remaining: ${productData.countInStock})`
      );

      return {
        success: true,
        productId,
        newStock: productData.countInStock,
        sold: productData.sold,
      };
    } else if (type === "RESTORE_STOCK") {
      const { productId, amount } = data;

      const productData = await Product.findByIdAndUpdate(
        productId,
        { $inc: { countInStock: +amount, sold: -amount } },
        { new: true }
      );

      if (!productData) {
        throw new Error(`Product ${productId} not found`);
      }

      console.log(
        `✅ Stock restored for product ${productId}: +${amount} (current: ${productData.countInStock})`
      );

      return {
        success: true,
        productId,
        newStock: productData.countInStock,
      };
    } else if (type === "BATCH_UPDATE") {
      const { orderItems } = data;

      const results = await Promise.all(
        orderItems.map(async (item) => {
          const productData = await Product.findOneAndUpdate(
            { _id: item.product, countInStock: { $gte: item.amount } },
            { $inc: { countInStock: -item.amount, sold: +item.amount } },
            { new: true }
          );

          return {
            productId: item.product,
            success: !!productData,
            newStock: productData?.countInStock,
          };
        })
      );

      const failedProducts = results.filter((r) => !r.success);

      if (failedProducts.length > 0) {
        throw new Error(
          `Failed to update stock for products: ${failedProducts
            .map((p) => p.productId)
            .join(", ")}`
        );
      }

      console.log(`✅ Batch stock update completed for ${results.length} products`);

      return {
        success: true,
        updatedCount: results.length,
        results,
      };
    }

    throw new Error(`Unknown inventory job type: ${type}`);
  } catch (error) {
    console.error(`❌ Inventory job ${job.id} error:`, error.message);
    throw error; // Throw để Bull retry
  }
});

console.log("🚀 Inventory Worker started");

module.exports = inventoryQueue;
