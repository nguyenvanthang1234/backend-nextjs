const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const { CONFIG_MESSAGE_ERRORS } = require("../configs");
const Product = require("../models/ProductModel");
const ProductType = require("../models/ProductType");
const City = require("../models/CityModel"); // Import model City để tránh lỗi populate

/**
 * Trích xuất từ khóa từ câu hỏi của user để filter sản phẩm
 * @param {string} query - Câu hỏi của user
 * @returns {object} - Object chứa các filter
 */
const extractKeywordsFromQuery = (query) => {
  const lowerQuery = query.toLowerCase();
  const filters = {};

  // Trích xuất khoảng giá
  const pricePatterns = [
    /dưới\s*(\d+(?:\.\d+)?)\s*(triệu|tr|k|nghìn|ngàn)?/gi,
    /(\d+(?:\.\d+)?)\s*(triệu|tr|k|nghìn|ngàn)?\s*trở xuống/gi,
    /từ\s*(\d+(?:\.\d+)?)\s*(triệu|tr|k|nghìn|ngàn)?\s*đến\s*(\d+(?:\.\d+)?)\s*(triệu|tr|k|nghìn|ngàn)?/gi,
    /(\d+(?:\.\d+)?)\s*(triệu|tr|k|nghìn|ngàn)?\s*-\s*(\d+(?:\.\d+)?)\s*(triệu|tr|k|nghìn|ngàn)?/gi,
    /trên\s*(\d+(?:\.\d+)?)\s*(triệu|tr|k|nghìn|ngàn)?/gi,
  ];

  // Chuyển đổi đơn vị tiền
  const convertToNumber = (value, unit) => {
    const num = parseFloat(value);
    if (!unit) return num;
    const lowerUnit = unit.toLowerCase();
    if (lowerUnit === "triệu" || lowerUnit === "tr") return num * 1000000;
    if (lowerUnit === "k" || lowerUnit === "nghìn" || lowerUnit === "ngàn")
      return num * 1000;
    return num;
  };

  // Parse giá "dưới X triệu"
  const underPriceMatch = lowerQuery.match(
    /dưới\s*(\d+(?:[.,]\d+)?)\s*(triệu|tr|k|nghìn|ngàn)?/i
  );
  if (underPriceMatch) {
    filters.maxPrice = convertToNumber(
      underPriceMatch[1].replace(",", "."),
      underPriceMatch[2]
    );
  }

  // Parse giá "trên X triệu"
  const overPriceMatch = lowerQuery.match(
    /trên\s*(\d+(?:[.,]\d+)?)\s*(triệu|tr|k|nghìn|ngàn)?/i
  );
  if (overPriceMatch) {
    filters.minPrice = convertToNumber(
      overPriceMatch[1].replace(",", "."),
      overPriceMatch[2]
    );
  }

  // Parse khoảng giá "từ X đến Y"
  const rangePriceMatch = lowerQuery.match(
    /từ\s*(\d+(?:[.,]\d+)?)\s*(triệu|tr|k|nghìn|ngàn)?\s*đến\s*(\d+(?:[.,]\d+)?)\s*(triệu|tr|k|nghìn|ngàn)?/i
  );
  if (rangePriceMatch) {
    filters.minPrice = convertToNumber(
      rangePriceMatch[1].replace(",", "."),
      rangePriceMatch[2]
    );
    filters.maxPrice = convertToNumber(
      rangePriceMatch[3].replace(",", "."),
      rangePriceMatch[4]
    );
  }

  // Trích xuất từ khóa tìm kiếm (loại bỏ các từ không cần thiết)
  const stopWords = [
    "cho",
    "mình",
    "tôi",
    "tìm",
    "kiếm",
    "muốn",
    "mua",
    "cần",
    "có",
    "không",
    "được",
    "giúp",
    "với",
    "và",
    "hoặc",
    "hay",
    "là",
    "các",
    "những",
    "một",
    "vài",
    "nhiều",
    "ít",
    "dưới",
    "trên",
    "từ",
    "đến",
    "triệu",
    "tr",
    "k",
    "nghìn",
    "ngàn",
    "vnđ",
    "vnd",
    "đồng",
    "giá",
    "khoảng",
    "tầm",
    "gợi",
    "ý",
    "đề",
    "xuất",
    "nào",
    "gì",
    "sao",
    "như",
    "thế",
    "nên",
    "bạn",
    "shop",
    "cửa",
    "hàng",
  ];

  const words = lowerQuery.split(/\s+/).filter((word) => {
    return (
      word.length > 1 && !stopWords.includes(word) && !/^\d+$/.test(word)
    );
  });

  if (words.length > 0) {
    filters.keywords = words;
  }

  return filters;
};

/**
 * Tìm kiếm sản phẩm dựa trên filters từ câu hỏi
 * @param {object} filters - Các filter được trích xuất
 * @param {number} limit - Số lượng sản phẩm tối đa
 * @returns {Array} - Danh sách sản phẩm
 */
const searchProducts = async (filters, limit = 10) => {
  try {
    let query = {};

    // Filter theo giá
    if (filters.minPrice || filters.maxPrice) {
      query.price = {};
      if (filters.minPrice) query.price.$gte = filters.minPrice;
      if (filters.maxPrice) query.price.$lte = filters.maxPrice;
    }

    // Filter theo từ khóa trong tên hoặc mô tả
    if (filters.keywords && filters.keywords.length > 0) {
      const keywordRegex = filters.keywords.map((kw) => new RegExp(kw, "i"));
      query.$or = [
        { name: { $in: keywordRegex } },
        { description: { $in: keywordRegex } },
      ];
    }

    console.log("[RAG] Search query:", JSON.stringify(query));
    console.log("[RAG] Filters:", JSON.stringify(filters));

    let products = await Product.find(query)
      .populate("type", "name")
      .populate("location", "name")
      .select("name slug image price countInStock description discount type location sold")
      .limit(limit)
      .sort({ sold: -1, totalLikes: -1 });

    console.log("[RAG] Found products:", products.length);

    // Nếu không tìm thấy sản phẩm với filter, lấy sản phẩm mặc định
    if (products.length === 0) {
      console.log("[RAG] No products found with filters, fetching default products...");
      // Chỉ giữ filter giá nếu có
      const fallbackQuery = {};
      if (filters.minPrice || filters.maxPrice) {
        fallbackQuery.price = query.price;
      }
      
      products = await Product.find(fallbackQuery)
        .populate("type", "name")
        .populate("location", "name")
        .select("name slug image price countInStock description discount type location sold")
        .limit(limit)
        .sort({ sold: -1, totalLikes: -1 });
      
      console.log("[RAG] Fallback products:", products.length);
    }

    return products;
  } catch (error) {
    console.error("[RAG] Error searching products:", error);
    return [];
  }
};

/**
 * Format thông tin sản phẩm thành text cho context
 * @param {Array} products - Danh sách sản phẩm
 * @returns {string} - Text mô tả sản phẩm
 */
const formatProductsForContext = (products) => {
  if (!products || products.length === 0) {
    return "Hiện tại không có sản phẩm nào phù hợp với yêu cầu.";
  }

  return products
    .map((product, index) => {
      const actualPrice = product.discount
        ? product.price * (1 - product.discount / 100)
        : product.price;

      let productInfo = `${index + 1}. **${product.name}**\n`;
      productInfo += `   - Giá: ${actualPrice.toLocaleString("vi-VN")} VNĐ`;
      if (product.discount) {
        productInfo += ` (Giảm ${product.discount}% từ ${product.price.toLocaleString("vi-VN")} VNĐ)`;
      }
      productInfo += `\n`;
      productInfo += `   - Tồn kho: ${product.countInStock} sản phẩm\n`;
      if (product.type?.name) {
        productInfo += `   - Danh mục: ${product.type.name}\n`;
      }
      if (product.location?.name) {
        productInfo += `   - Khu vực: ${product.location.name}\n`;
      }
      if (product.description) {
        productInfo += `   - Mô tả: ${product.description.substring(0, 150)}${product.description.length > 150 ? "..." : ""}\n`;
      }
      productInfo += `   - Link: /product/${product.slug}\n`;

      return productInfo;
    })
    .join("\n");
};

/**
 * Tạo system prompt cho chatbot
 * @returns {string} - System prompt
 */
const getSystemPrompt = () => {
  return `Bạn là nhân viên tư vấn bán hàng nhiệt tình và chuyên nghiệp của một cửa hàng thương mại điện tử.

NGUYÊN TẮC BẮT BUỘC:
1. BẠN ĐANG CÓ QUYỀN TRUY CẬP DỮ LIỆU SẢN PHẨM THỰC TẾ - Hãy sử dụng nó!
2. KHÔNG BAO GIỜ nói "không thể hiển thị", "chưa có dữ liệu", "vui lòng ghé website"
3. Luôn trả lời dựa trên DANH SÁCH SẢN PHẨM được cung cấp bên dưới
4. Nếu có sản phẩm trong danh sách, PHẢI liệt kê cụ thể với tên, giá, mô tả
5. Luôn trả lời bằng tiếng Việt, thân thiện và lịch sự

NGUYÊN TẮC TƯ VẤN:
1. Dựa vào danh sách sản phẩm được cung cấp để tư vấn chi tiết
2. Luôn đưa ra thông tin về giá, tồn kho và link sản phẩm (/product/[slug])
3. Nếu không có sản phẩm phù hợp với yêu cầu cụ thể, hãy gợi ý các sản phẩm có sẵn
4. Giữ câu trả lời ngắn gọn, súc tích nhưng đầy đủ thông tin
5. Có thể sử dụng emoji phù hợp để tạo không khí thân thiện

ĐỊNH DẠNG TRẢ LỜI:
- Liệt kê sản phẩm rõ ràng với giá và thông tin quan trọng
- Kết thúc bằng câu hỏi mở hoặc gợi ý để tiếp tục cuộc hội thoại`;
};

/**
 * Xử lý chat với RAG
 * @param {string} message - Tin nhắn từ user
 * @param {Array} conversationHistory - Lịch sử hội thoại (optional)
 * @returns {object} - Response object
 */
const chat = async (message, conversationHistory = []) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Validate input
      if (!message || message.trim() === "") {
        return resolve({
          status: CONFIG_MESSAGE_ERRORS.INVALID.status,
          message: "Tin nhắn không được để trống",
          typeError: CONFIG_MESSAGE_ERRORS.INVALID.type,
          data: null,
          statusMessage: "Error",
        });
      }

      // Check API key
      if (!process.env.GEMINI_API_KEY) {
        return resolve({
          status: CONFIG_MESSAGE_ERRORS.INTERNAL_ERROR.status,
          message: "Chatbot chưa được cấu hình. Vui lòng thử lại sau.",
          typeError: CONFIG_MESSAGE_ERRORS.INTERNAL_ERROR.type,
          data: null,
          statusMessage: "Error",
        });
      }

      // 1. Trích xuất keywords và filters từ câu hỏi
      const filters = extractKeywordsFromQuery(message);

      // 2. Lấy tổng số sản phẩm trong cửa hàng
      const totalProducts = await Product.countDocuments({});
      
      // 3. Tìm kiếm sản phẩm phù hợp (RAG - Retrieval)
      const products = await searchProducts(filters, 10);

      console.log("[RAG] ========== RAG CHAT DEBUG ==========");
      console.log("[RAG] User message:", message);
      console.log("[RAG] Total products in DB:", totalProducts);
      console.log("[RAG] Products found for context:", products.length);
      if (products.length > 0) {
        console.log("[RAG] First 3 products:", products.slice(0, 3).map(p => ({ name: p.name, price: p.price })));
      }

      // 4. Format sản phẩm thành context
      const productContext = formatProductsForContext(products);

      // 5. Tóm tắt lịch sử hội thoại (chỉ lấy câu hỏi của user)
      let conversationSummary = "";
      if (conversationHistory && conversationHistory.length > 0) {
        const userQuestions = conversationHistory
          .filter((msg) => msg.role === "user")
          .map((msg) => {
            if (msg.parts && Array.isArray(msg.parts)) {
              return msg.parts.map((p) => p.text).join(" ");
            }
            return msg.content || "";
          })
          .filter((text) => text.trim() !== "");
        
        if (userQuestions.length > 0) {
          conversationSummary = `\nCÁC CÂU HỎI TRƯỚC ĐÓ CỦA KHÁCH:\n${userQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n`;
        }
      }

      // 6. Tạo prompt với context (KHÔNG dùng history của Gemini để tránh bị ảnh hưởng)
      const contextPrompt = `
${getSystemPrompt()}

THÔNG TIN CỬA HÀNG:
- Tổng số sản phẩm trong cửa hàng: ${totalProducts} sản phẩm
- Số sản phẩm phù hợp với yêu cầu: ${products.length} sản phẩm

DANH SÁCH SẢN PHẨM THỰC TẾ TỪ DATABASE:
${productContext}
${conversationSummary}
CÂU HỎI HIỆN TẠI CỦA KHÁCH HÀNG: "${message}"

BẮT BUỘC: Trả lời dựa trên DANH SÁCH SẢN PHẨM THỰC TẾ ở trên. Liệt kê tên, giá, mô tả sản phẩm cụ thể.`;

      // 7. Gọi Gemini API (RAG - Generation)
      // Sử dụng gemini-2.5-flash (model mới nhất của Google)
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(contextPrompt);
      const response = result.response.text();

      // 6. Trả về kết quả
      resolve({
        status: CONFIG_MESSAGE_ERRORS.GET_SUCCESS.status,
        message: "Chat thành công",
        typeError: "",
        data: {
          response: response,
          relatedProducts: products.map((p) => ({
            id: p._id,
            name: p.name,
            slug: p.slug,
            image: p.image,
            price: p.price,
            discount: p.discount,
            actualPrice: p.discount
              ? p.price * (1 - p.discount / 100)
              : p.price,
          })),
          filters: filters,
        },
        statusMessage: "Success",
      });
    } catch (error) {
      console.error("Chat error:", error);
      resolve({
        status: CONFIG_MESSAGE_ERRORS.INTERNAL_ERROR.status,
        message: "Có lỗi xảy ra khi xử lý tin nhắn. Vui lòng thử lại.",
        typeError: CONFIG_MESSAGE_ERRORS.INTERNAL_ERROR.type,
        data: null,
        statusMessage: "Error",
      });
    }
  });
};

/**
 * Lấy gợi ý câu hỏi mẫu
 * @returns {object} - Response object
 */
const getSuggestedQuestions = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      // Lấy các danh mục sản phẩm để tạo gợi ý
      const productTypes = await ProductType.find({})
        .select("name")
        .limit(5);

      const baseQuestions = [
        "Tìm sản phẩm dưới 500 nghìn",
        "Sản phẩm bán chạy nhất là gì?",
        "Có sản phẩm nào đang giảm giá không?",
        "Gợi ý sản phẩm cho tôi",
      ];

      // Thêm gợi ý dựa trên danh mục
      const categoryQuestions = productTypes.map(
        (type) => `Tìm ${type.name.toLowerCase()}`
      );

      resolve({
        status: CONFIG_MESSAGE_ERRORS.GET_SUCCESS.status,
        message: "Lấy gợi ý câu hỏi thành công",
        typeError: "",
        data: {
          questions: [...baseQuestions, ...categoryQuestions].slice(0, 6),
        },
        statusMessage: "Success",
      });
    } catch (error) {
      console.error("Get suggested questions error:", error);
      resolve({
        status: CONFIG_MESSAGE_ERRORS.INTERNAL_ERROR.status,
        message: "Có lỗi xảy ra. Vui lòng thử lại.",
        typeError: CONFIG_MESSAGE_ERRORS.INTERNAL_ERROR.type,
        data: null,
        statusMessage: "Error",
      });
    }
  });
};

module.exports = {
  chat,
  getSuggestedQuestions,
  extractKeywordsFromQuery,
  searchProducts,
};
