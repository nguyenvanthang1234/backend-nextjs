const express = require("express");
const router = express.Router();
const ChatController = require("../controllers/ChatController");

/**
 * @swagger
 * /api/chat:
 *   post:
 *     summary: Chat với AI chatbot (RAG)
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: Tin nhắn của người dùng
 *                 example: "Tìm cho mình giày chạy bộ dưới 2 triệu"
 *               conversationHistory:
 *                 type: array
 *                 description: Lịch sử hội thoại (optional)
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, assistant]
 *                     content:
 *                       type: string
 *     responses:
 *       200:
 *         description: Chat thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     response:
 *                       type: string
 *                       description: Câu trả lời từ AI
 *                     relatedProducts:
 *                       type: array
 *                       description: Danh sách sản phẩm liên quan
 */
router.post("/", ChatController.chat);

/**
 * @swagger
 * /api/chat/suggestions:
 *   get:
 *     summary: Lấy danh sách câu hỏi gợi ý
 *     tags: [Chat]
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     questions:
 *                       type: array
 *                       items:
 *                         type: string
 */
router.get("/suggestions", ChatController.getSuggestedQuestions);

/**
 * @swagger
 * /api/chat/search:
 *   post:
 *     summary: Tìm kiếm sản phẩm bằng ngôn ngữ tự nhiên
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: Câu truy vấn tìm kiếm
 *                 example: "giày dưới 1 triệu"
 *     responses:
 *       200:
 *         description: Tìm kiếm thành công
 */
router.post("/search", ChatController.searchProducts);

module.exports = router;
