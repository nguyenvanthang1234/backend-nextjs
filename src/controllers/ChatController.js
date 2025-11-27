const { CONFIG_MESSAGE_ERRORS } = require("../configs");
const ChatService = require("../services/ChatService");

/**
 * API Chat - RAG Chatbot
 * POST /api/chat
 * Body: { message: string, conversationHistory?: Array }
 */
const chat = async (req, res) => {
  try {
    const { message, conversationHistory, history } = req.body;
    // Hỗ trợ cả 2 format: conversationHistory hoặc history (từ Gemini frontend)
    const chatHistory = conversationHistory || history || [];

    if (!message || message.trim() === "") {
      return res.status(CONFIG_MESSAGE_ERRORS.INVALID.status).json({
        status: "Error",
        typeError: CONFIG_MESSAGE_ERRORS.INVALID.type,
        message: "Tin nhắn không được để trống",
        data: null,
      });
    }

    const response = await ChatService.chat(message, chatHistory);
    const { data, status, typeError, message: responseMessage, statusMessage } = response;

    return res.status(status).json({
      typeError,
      data,
      message: responseMessage,
      status: statusMessage,
    });
  } catch (e) {
    console.error("Chat controller error:", e);
    return res.status(CONFIG_MESSAGE_ERRORS.INTERNAL_ERROR.status).json({
      message: "Internal Server Error",
      data: null,
      status: "Error",
      typeError: CONFIG_MESSAGE_ERRORS.INTERNAL_ERROR.type,
    });
  }
};

/**
 * API Lấy gợi ý câu hỏi
 * GET /api/chat/suggestions
 */
const getSuggestedQuestions = async (req, res) => {
  try {
    const response = await ChatService.getSuggestedQuestions();
    const { data, status, typeError, message, statusMessage } = response;

    return res.status(status).json({
      typeError,
      data,
      message,
      status: statusMessage,
    });
  } catch (e) {
    console.error("Get suggestions error:", e);
    return res.status(CONFIG_MESSAGE_ERRORS.INTERNAL_ERROR.status).json({
      message: "Internal Server Error",
      data: null,
      status: "Error",
      typeError: CONFIG_MESSAGE_ERRORS.INTERNAL_ERROR.type,
    });
  }
};

/**
 * API Tìm kiếm sản phẩm (hỗ trợ frontend filter)
 * POST /api/chat/search
 * Body: { query: string }
 */
const searchProducts = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.trim() === "") {
      return res.status(CONFIG_MESSAGE_ERRORS.INVALID.status).json({
        status: "Error",
        typeError: CONFIG_MESSAGE_ERRORS.INVALID.type,
        message: "Query không được để trống",
        data: null,
      });
    }

    const filters = ChatService.extractKeywordsFromQuery(query);
    const products = await ChatService.searchProducts(filters, 20);

    return res.status(CONFIG_MESSAGE_ERRORS.GET_SUCCESS.status).json({
      status: "Success",
      typeError: "",
      message: "Tìm kiếm thành công",
      data: {
        products: products.map((p) => ({
          id: p._id,
          name: p.name,
          slug: p.slug,
          image: p.image,
          price: p.price,
          discount: p.discount,
          actualPrice: p.discount ? p.price * (1 - p.discount / 100) : p.price,
          type: p.type?.name,
          countInStock: p.countInStock,
        })),
        filters,
        total: products.length,
      },
    });
  } catch (e) {
    console.error("Search products error:", e);
    return res.status(CONFIG_MESSAGE_ERRORS.INTERNAL_ERROR.status).json({
      message: "Internal Server Error",
      data: null,
      status: "Error",
      typeError: CONFIG_MESSAGE_ERRORS.INTERNAL_ERROR.type,
    });
  }
};

module.exports = {
  chat,
  getSuggestedQuestions,
  searchProducts,
};
