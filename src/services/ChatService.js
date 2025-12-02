const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const { CONFIG_MESSAGE_ERRORS } = require("../configs");
const Product = require("../models/ProductModel");
const ProductType = require("../models/ProductType");
const City = require("../models/CityModel");
const Review = require("../models/ReviewModel");

// Import kiến thức chatbot
const {
  WEBSITE_INFO,
  WEBSITE_ROUTES,
  PURCHASE_GUIDE,
  PAYMENT_METHODS,
  SHIPPING_POLICY,
  RETURN_POLICY,
  FAQ,
  detectIntent,
  getContextByIntent,
} = require("../configs/chatbotKnowledge");

/**
 * Phát hiện ý định của câu hỏi (bán chạy, yêu thích, giá, v.v.)
 * @param {string} query - Câu hỏi của user
 * @returns {object} - Object chứa intent và metadata
 */
const detectQueryIntent = (query) => {
  const lowerQuery = query.toLowerCase();
  
  // Detect "sản phẩm bán chạy nhất"
  const bestSellingPatterns = [
    /bán chạy/i,
    /bán nhiều/i,
    /bán tốt/i,
    /best.?sell/i,
    /top.?sell/i,
    /phổ biến/i,
    /được mua nhiều/i,
  ];
  
  // Detect "sản phẩm yêu thích nhất"
  const mostLikedPatterns = [
    /yêu thích/i,
    /ưa chuộng/i,
    /được like/i,
    /nhiều like/i,
    /hot/i,
    /trending/i,
  ];
  
  // Detect "sản phẩm có đánh giá cao"
  const highRatingPatterns = [
    /đánh giá cao/i,
    /rating cao/i,
    /chất lượng/i,
    /tốt nhất/i,
  ];
  
  const intent = {
    type: 'general', // general, best_selling, most_liked, high_rating
    confidence: 0,
  };
  
  // Check best selling
  if (bestSellingPatterns.some(pattern => pattern.test(lowerQuery))) {
    intent.type = 'best_selling';
    intent.confidence = 0.9;
  }
  // Check most liked
  else if (mostLikedPatterns.some(pattern => pattern.test(lowerQuery))) {
    intent.type = 'most_liked';
    intent.confidence = 0.9;
  }
  // Check high rating
  else if (highRatingPatterns.some(pattern => pattern.test(lowerQuery))) {
    intent.type = 'high_rating';
    intent.confidence = 0.8;
  }
  
  return intent;
};

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
 * Lấy sản phẩm bán chạy nhất
 * @param {number} limit - Số lượng sản phẩm
 * @returns {Array} - Danh sách sản phẩm bán chạy
 */
const getBestSellingProducts = async (limit = 10) => {
  try {
    const products = await Product.find({ sold: { $gt: 0 } })
      .populate("type", "name")
      .populate("location", "name")
      .select("name slug image price countInStock description discount type location sold totalLikes")
      .sort({ sold: -1 })
      .limit(limit);
    
    console.log("[RAG] Best selling products found:", products.length);
    return products;
  } catch (error) {
    console.error("[RAG] Error getting best selling products:", error);
    return [];
  }
};

/**
 * Lấy sản phẩm được yêu thích nhất
 * @param {number} limit - Số lượng sản phẩm
 * @returns {Array} - Danh sách sản phẩm được yêu thích
 */
const getMostLikedProducts = async (limit = 10) => {
  try {
    const products = await Product.find({ totalLikes: { $gt: 0 } })
      .populate("type", "name")
      .populate("location", "name")
      .select("name slug image price countInStock description discount type location sold totalLikes")
      .sort({ totalLikes: -1 })
      .limit(limit);
    
    console.log("[RAG] Most liked products found:", products.length);
    return products;
  } catch (error) {
    console.error("[RAG] Error getting most liked products:", error);
    return [];
  }
};

/**
 * Lấy sản phẩm có đánh giá cao nhất
 * @param {number} limit - Số lượng sản phẩm
 * @returns {Array} - Danh sách sản phẩm có rating cao
 */
const getHighRatingProducts = async (limit = 10) => {
  try {
    // Aggregate để tính rating trung bình
    const productsWithRating = await Review.aggregate([
      {
        $group: {
          _id: "$product",
          avgRating: { $avg: "$star" },
          reviewCount: { $sum: 1 },
        },
      },
      { $match: { avgRating: { $gte: 4 } } },
      { $sort: { avgRating: -1, reviewCount: -1 } },
      { $limit: limit },
    ]);

    if (productsWithRating.length === 0) {
      return [];
    }

    const productIds = productsWithRating.map(p => p._id);
    const products = await Product.find({ _id: { $in: productIds } })
      .populate("type", "name")
      .populate("location", "name")
      .select("name slug image price countInStock description discount type location sold totalLikes");

    // Thêm thông tin rating vào products
    const productsWithRatingInfo = products.map(product => {
      const ratingInfo = productsWithRating.find(
        p => p._id.toString() === product._id.toString()
      );
      return {
        ...product.toObject(),
        avgRating: ratingInfo?.avgRating || 0,
        reviewCount: ratingInfo?.reviewCount || 0,
      };
    });

    // Sort theo avgRating
    productsWithRatingInfo.sort((a, b) => b.avgRating - a.avgRating);

    console.log("[RAG] High rating products found:", productsWithRatingInfo.length);
    return productsWithRatingInfo;
  } catch (error) {
    console.error("[RAG] Error getting high rating products:", error);
    return [];
  }
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
      .select("name slug image price countInStock description discount type location sold totalLikes")
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
        .select("name slug image price countInStock description discount type location sold totalLikes")
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
const formatProductsForContext = (products, includeStats = false) => {
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
      
      // Thêm thông tin thống kê nếu có
      if (includeStats) {
        if (product.sold && product.sold > 0) {
          productInfo += `   - Đã bán: ${product.sold} sản phẩm\n`;
        }
        if (product.totalLikes && product.totalLikes > 0) {
          productInfo += `   - Lượt yêu thích: ${product.totalLikes}\n`;
        }
        if (product.avgRating) {
          productInfo += `   - Đánh giá: ${product.avgRating.toFixed(1)}/5 ⭐ (${product.reviewCount} đánh giá)\n`;
        }
      }
      
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
 * @param {string} userIntent - Ý định của người dùng
 * @returns {string} - System prompt
 */
const getSystemPrompt = (userIntent = "askProduct") => {
  // Tạo danh sách các trang website
  const routesList = Object.entries(WEBSITE_ROUTES)
    .map(([key, val]) => `- ${val.path}: ${val.description}`)
    .join("\n");

  return `Bạn là nhân viên tư vấn bán hàng nhiệt tình và chuyên nghiệp của ${WEBSITE_INFO.name}.
Mô tả cửa hàng: ${WEBSITE_INFO.description}
Hotline hỗ trợ: ${WEBSITE_INFO.hotline}

## VAI TRÒ CỦA BẠN:
1. Tư vấn sản phẩm dựa trên dữ liệu thực từ database
2. HƯỚNG DẪN NGƯỜI DÙNG MUA HÀNG trên website
3. Giải đáp thắc mắc về thanh toán, giao hàng, đổi trả
4. Cung cấp link đến các trang phù hợp trên website

## CÁC TRANG TRÊN WEBSITE:
${routesList}

## NGUYÊN TẮC BẮT BUỘC:
1. BẠN ĐANG CÓ QUYỀN TRUY CẬP DỮ LIỆU SẢN PHẨM THỰC TẾ - Hãy sử dụng nó!
2. KHÔNG BAO GIỜ nói "không thể hiển thị", "chưa có dữ liệu"
3. Luôn trả lời dựa trên thông tin được cung cấp bên dưới
4. Khi hướng dẫn, luôn cung cấp LINK cụ thể đến trang liên quan
5. Luôn trả lời bằng tiếng Việt, thân thiện và lịch sự

## HƯỚNG DẪN THEO Ý ĐỊNH NGƯỜI DÙNG:
${userIntent === "askPurchaseGuide" ? "Người dùng đang hỏi về cách mua hàng. Hãy hướng dẫn chi tiết từng bước." : ""}
${userIntent === "askPayment" ? "Người dùng đang hỏi về thanh toán. Giải thích các phương thức thanh toán." : ""}
${userIntent === "askShipping" ? "Người dùng đang hỏi về giao hàng. Cung cấp thông tin ship và thời gian." : ""}
${userIntent === "askReturn" ? "Người dùng đang hỏi về đổi trả. Giải thích chính sách đổi trả." : ""}
${userIntent === "askProduct" ? "Người dùng đang tìm sản phẩm. Tư vấn dựa trên danh sách sản phẩm." : ""}
${userIntent === "greeting" ? "Người dùng chào hỏi. Chào đón và hỏi họ cần hỗ trợ gì." : ""}

## ĐỊNH DẠNG TRẢ LỜI:
- Sử dụng bullet points và markdown để dễ đọc
- Luôn cung cấp link trang liên quan (ví dụ: /cart, /checkout, /product/...)
- Kết thúc bằng câu hỏi hoặc gợi ý để tiếp tục hỗ trợ
- Sử dụng emoji phù hợp để thân thiện 😊`;
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

      // 1. Phát hiện ý định của câu hỏi (product-related)
      const productIntent = detectQueryIntent(message);
      console.log("[RAG] Product intent:", productIntent);

      // 1.1 Phát hiện ý định mua hàng/hỗ trợ (từ chatbotKnowledge)
      const userIntent = detectIntent(message);
      console.log("[RAG] User intent:", userIntent);

      // 2. Trích xuất keywords và filters từ câu hỏi
      const filters = extractKeywordsFromQuery(message);

      // 3. Lấy tổng số sản phẩm trong cửa hàng
      const totalProducts = await Product.countDocuments({});
      
      // 4. Tìm kiếm sản phẩm dựa trên ý định (RAG - Retrieval)
      let products = [];
      let queryType = "general";
      
      if (productIntent.type === 'best_selling' && productIntent.confidence > 0.5) {
        products = await getBestSellingProducts(10);
        queryType = "best_selling";
      } else if (productIntent.type === 'most_liked' && productIntent.confidence > 0.5) {
        products = await getMostLikedProducts(10);
        queryType = "most_liked";
      } else if (productIntent.type === 'high_rating' && productIntent.confidence > 0.5) {
        products = await getHighRatingProducts(10);
        queryType = "high_rating";
      } else {
        products = await searchProducts(filters, 10);
        queryType = "general";
      }

      console.log("[RAG] ========== RAG CHAT DEBUG ==========");
      console.log("[RAG] User message:", message);
      console.log("[RAG] Query type:", queryType);
      console.log("[RAG] Total products in DB:", totalProducts);
      console.log("[RAG] Products found for context:", products.length);
      if (products.length > 0) {
        console.log("[RAG] First 3 products:", products.slice(0, 3).map(p => ({ 
          name: p.name, 
          price: p.price,
          sold: p.sold,
          totalLikes: p.totalLikes 
        })));
      }

      // 5. Format sản phẩm thành context (bao gồm stats nếu query về best selling/most liked)
      const includeStats = ['best_selling', 'most_liked', 'high_rating'].includes(queryType);
      const productContext = formatProductsForContext(products, includeStats);
      
      // Thêm thông tin về loại query
      let queryTypeInfo = "";
      if (queryType === "best_selling") {
        queryTypeInfo = "\n🔥 KHÁCH HÀNG HỎI VỀ SẢN PHẨM BÁN CHẠY NHẤT\nDanh sách dưới đây được sắp xếp theo số lượng đã bán (từ cao xuống thấp):\n";
      } else if (queryType === "most_liked") {
        queryTypeInfo = "\n❤️ KHÁCH HÀNG HỎI VỀ SẢN PHẨM YÊU THÍCH NHẤT\nDanh sách dưới đây được sắp xếp theo số lượt yêu thích (từ cao xuống thấp):\n";
      } else if (queryType === "high_rating") {
        queryTypeInfo = "\n⭐ KHÁCH HÀNG HỎI VỀ SẢN PHẨM CÓ ĐÁNH GIÁ CAO\nDanh sách dưới đây được sắp xếp theo đánh giá trung bình (từ cao xuống thấp):\n";
      }

      // 6. Tóm tắt lịch sử hội thoại (chỉ lấy câu hỏi của user)
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

      // 7. Lấy context phù hợp theo intent người dùng
      const intentContext = getContextByIntent(userIntent);
      
      // 8. Tạo prompt với context (KHÔNG dùng history của Gemini để tránh bị ảnh hưởng)
      let contextPrompt = `${getSystemPrompt(userIntent)}`;
      
      // Nếu là câu hỏi về mua hàng/hỗ trợ (không phải tìm sản phẩm)
      if (userIntent !== "askProduct" && intentContext) {
        contextPrompt += `

${intentContext}

CÂU HỎI CỦA KHÁCH HÀNG: "${message}"

Hãy trả lời dựa trên thông tin hướng dẫn ở trên. Cung cấp link cụ thể đến các trang liên quan.`;
      } else {
        // Câu hỏi về sản phẩm - dùng RAG với product context
        contextPrompt += `

THÔNG TIN CỬA HÀNG:
- Tổng số sản phẩm trong cửa hàng: ${totalProducts} sản phẩm
- Số sản phẩm phù hợp với yêu cầu: ${products.length} sản phẩm
${queryTypeInfo}
DANH SÁCH SẢN PHẨM THỰC TẾ TỪ DATABASE:
${productContext}
${conversationSummary}
CÂU HỎI HIỆN TẠI CỦA KHÁCH HÀNG: "${message}"

BẮT BUỘC: Trả lời dựa trên DANH SÁCH SẢN PHẨM THỰC TẾ ở trên. ${includeStats ? 'Hãy nhấn mạnh số liệu thống kê (đã bán, lượt yêu thích, đánh giá) để chứng minh sản phẩm thực sự bán chạy/được yêu thích.' : 'Liệt kê tên, giá, mô tả sản phẩm cụ thể.'}`;
      }

      // 8. Gọi Gemini API (RAG - Generation)
      // Sử dụng gemini-2.5-flash (model mới nhất của Google)
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(contextPrompt);
      const response = result.response.text();

      // 9. Trả về kết quả
      resolve({
        status: CONFIG_MESSAGE_ERRORS.GET_SUCCESS.status,
        message: "Chat thành công",
        typeError: "",
        data: {
          response: response,
          intent: userIntent, // Intent của người dùng (askProduct, askPurchaseGuide, etc.)
          relatedProducts: userIntent === "askProduct" ? products.map((p) => ({
            id: p._id,
            name: p.name,
            slug: p.slug,
            image: p.image,
            price: p.price,
            discount: p.discount,
            actualPrice: p.discount
              ? p.price * (1 - p.discount / 100)
              : p.price,
            sold: p.sold,
            totalLikes: p.totalLikes,
          })) : [],
          filters: filters,
          queryType: queryType, // best_selling, most_liked, high_rating, general
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

      const productQuestions = [
        "Tìm sản phẩm dưới 500 nghìn",
        "Sản phẩm bán chạy nhất là gì?",
        "Có sản phẩm nào đang giảm giá không?",
        "Gợi ý sản phẩm cho tôi",
      ];

      // Thêm gợi ý về mua hàng
      const purchaseGuideQuestions = [
        "Làm sao để mua hàng trên website?",
        "Hướng dẫn đặt hàng",
        "Các phương thức thanh toán?",
        "Giao hàng mất bao lâu?",
        "Chính sách đổi trả như thế nào?",
        "Có hỗ trợ thanh toán COD không?",
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
          productQuestions: [...productQuestions, ...categoryQuestions].slice(0, 5),
          purchaseGuideQuestions: purchaseGuideQuestions.slice(0, 4),
          questions: [...productQuestions, ...purchaseGuideQuestions, ...categoryQuestions].slice(0, 8),
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
  getBestSellingProducts,
  getMostLikedProducts,
  getHighRatingProducts,
  detectQueryIntent,
};
