const mongoose = require("mongoose");
const dotenv = require("dotenv");
const ChatService = require("./src/services/ChatService");

dotenv.config();

const testCases = [
  {
    name: "Hỏi về cách mua hàng",
    question: "Làm sao để mua hàng trên website?",
    expectedIntent: "askPurchaseGuide"
  },
  {
    name: "Hỏi về thanh toán",
    question: "Các phương thức thanh toán là gì?",
    expectedIntent: "askPayment"
  },
  {
    name: "Hỏi về giao hàng",
    question: "Ship hàng mất bao lâu?",
    expectedIntent: "askShipping"
  },
  {
    name: "Hỏi về đổi trả",
    question: "Chính sách đổi trả như thế nào?",
    expectedIntent: "askReturn"
  },
  {
    name: "Tìm sản phẩm",
    question: "Có sản phẩm nào dưới 5 triệu không?",
    expectedIntent: "askProduct"
  },
  {
    name: "Chào hỏi",
    question: "Xin chào",
    expectedIntent: "greeting"
  }
];

const testChatGuide = async () => {
  try {
    console.log("⏳ Đang kết nối Database...");
    await mongoose.connect(process.env.MONGO_DB);
    console.log("✅ Database Connected!\n");

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`\n${"=".repeat(60)}`);
      console.log(`📝 Test Case ${i + 1}: ${testCase.name}`);
      console.log(`❓ Câu hỏi: "${testCase.question}"`);
      console.log(`🎯 Expected Intent: ${testCase.expectedIntent}`);
      console.log(`${"=".repeat(60)}`);
      
      const start = Date.now();
      const result = await ChatService.chat(testCase.question, []);
      const duration = Date.now() - start;
      
      console.log(`⏱️  Thời gian: ${duration}ms`);
      console.log(`🎯 Actual Intent: ${result.data?.intent || 'N/A'}`);
      console.log(`✅ Match: ${result.data?.intent === testCase.expectedIntent ? "✓" : "✗"}`);
      
      if (result.data?.relatedProducts && result.data.relatedProducts.length > 0) {
        console.log(`📦 Sản phẩm liên quan: ${result.data.relatedProducts.length}`);
      }
      
      console.log(`\n🤖 AI Response:`);
      console.log("-".repeat(60));
      console.log(result.data?.response || "Không có response");
      console.log("-".repeat(60));
      
      // Đợi 1 giây giữa các test để tránh rate limit
      if (i < testCases.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

  } catch (error) {
    console.error("\n❌ Lỗi Test:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Test hoàn tất!");
    process.exit();
  }
};

testChatGuide();
