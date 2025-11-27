const mongoose = require("mongoose");
const dotenv = require("dotenv");
const ChatService = require("./src/services/ChatService");

dotenv.config();

const testRAG = async () => {
  try {
    console.log("⏳ Đang kết nối Database...");
    await mongoose.connect(process.env.MONGO_DB);
    console.log("✅ Database Connected!");

    const question = "Liệt kê các sản phẩm có giá dưới 10 triệu";
    console.log(`\n❓ Test câu hỏi: "${question}"`);
    
    console.log("⏳ Đang gọi ChatService...");
    const start = Date.now();
    
    const result = await ChatService.chat(question, []);
    
    console.log(`\n⏱️ Thời gian xử lý: ${Date.now() - start}ms`);
    console.log("------------------------------------------------");
    
    if (result.data && result.data.relatedProducts) {
        console.log(`📦 Tìm thấy ${result.data.relatedProducts.length} sản phẩm liên quan từ DB.`);
        console.log("📋 Danh sách sản phẩm tìm được:");
        result.data.relatedProducts.forEach(p => {
            console.log(`   - [${p.price.toLocaleString()}đ] ${p.name}`);
        });
    } else {
        console.log("❌ Không tìm thấy sản phẩm nào (Lỗi bước Retrieval)");
    }

    console.log("\n🤖 Phản hồi của AI (Generation):");
    console.log(result.data.response);
    console.log("------------------------------------------------");

  } catch (error) {
    console.error("❌ Lỗi Test:", error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
};

testRAG();
