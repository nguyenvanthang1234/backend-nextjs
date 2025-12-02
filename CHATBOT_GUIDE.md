# 🤖 AI Chatbot - Hướng dẫn sử dụng

## Tổng quan

AI Chatbot đã được nâng cấp để **hướng dẫn người dùng mua hàng** trên website, không chỉ tư vấn sản phẩm.

### Các tính năng mới ✨

1. **Nhận diện ý định người dùng** (Intent Detection)
2. **Hướng dẫn mua hàng từng bước**
3. **Giải đáp về thanh toán, giao hàng, đổi trả**
4. **Cung cấp link đến các trang website**
5. **Gợi ý câu hỏi phân loại**

---

## 🎯 Các loại Intent

Chatbot có thể nhận diện 9 loại ý định:

| Intent               | Mô tả             | Ví dụ câu hỏi                       |
| -------------------- | ----------------- | ----------------------------------- |
| **greeting**         | Chào hỏi          | "Xin chào", "Hello"                 |
| **askProduct**       | Tìm sản phẩm      | "Có sản phẩm nào dưới 5 triệu?"     |
| **askPurchaseGuide** | Hỏi cách mua hàng | "Làm sao để mua hàng trên website?" |
| **askPayment**       | Hỏi về thanh toán | "Các phương thức thanh toán là gì?" |
| **askShipping**      | Hỏi về giao hàng  | "Giao hàng mất bao lâu?"            |
| **askReturn**        | Hỏi về đổi trả    | "Chính sách đổi trả như thế nào?"   |
| **askAccount**       | Hỏi về tài khoản  | "Làm sao đăng ký tài khoản?"        |
| **askOrder**         | Hỏi về đơn hàng   | "Làm sao theo dõi đơn hàng?"        |
| **askCart**          | Hỏi về giỏ hàng   | "Làm sao thêm vào giỏ hàng?"        |

---

## 📡 API Endpoints

### 1. POST `/api/chat` - Chat với AI

**Request Body:**

```json
{
  "message": "Làm sao để mua hàng trên website?",
  "history": []
}
```

**Response:**

```json
{
  "status": "Success",
  "message": "Chat thành công",
  "data": {
    "response": "## HƯỚNG DẪN MUA HÀNG...",
    "intent": "askPurchaseGuide",
    "queryType": "general",
    "relatedProducts": [],
    "filters": {}
  }
}
```

### 2. GET `/api/chat/suggestions` - Lấy gợi ý

**Response:**

```json
{
  "status": "Success",
  "data": {
    "productQuestions": [
      "Tìm sản phẩm dưới 500 nghìn",
      "Sản phẩm bán chạy nhất là gì?"
    ],
    "purchaseGuideQuestions": [
      "Làm sao để mua hàng trên website?",
      "Các phương thức thanh toán?"
    ],
    "questions": [
      "Tìm sản phẩm dưới 500 nghìn",
      "Làm sao để mua hàng trên website?",
      ...
    ]
  }
}
```

---

## 💡 Ví dụ sử dụng

### Ví dụ 1: Hỏi về cách mua hàng

```bash
curl -X POST http://localhost:3002/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Làm sao để mua hàng trên website?"
  }'
```

**Kết quả:**

- Intent: `askPurchaseGuide`
- AI sẽ trả lời hướng dẫn từng bước:
  1. Tìm sản phẩm tại `/products`
  2. Xem chi tiết tại `/product/[slug]`
  3. Thêm vào giỏ hàng tại `/cart`
  4. Thanh toán tại `/checkout`
  5. Theo dõi đơn hàng tại `/my-orders`

### Ví dụ 2: Hỏi về thanh toán

```bash
curl -X POST http://localhost:3002/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Có hỗ trợ thanh toán COD không?"
  }'
```

**Kết quả:**

- Intent: `askPayment`
- AI giải thích 3 phương thức:
  - COD (miễn phí)
  - Chuyển khoản ngân hàng
  - Ví điện tử (MoMo, ZaloPay, VNPay)

### Ví dụ 3: Tìm sản phẩm (như cũ)

```bash
curl -X POST http://localhost:3002/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Có sản phẩm nào dưới 5 triệu không?"
  }'
```

**Kết quả:**

- Intent: `askProduct`
- AI trả về danh sách sản phẩm từ database
- `relatedProducts` chứa danh sách chi tiết

---

## 🔧 Cấu hình

### File `src/configs/chatbotKnowledge.js`

Chứa toàn bộ kiến thức của chatbot:

- `WEBSITE_ROUTES`: Các trang trên website
- `PURCHASE_GUIDE`: Hướng dẫn mua hàng từng bước
- `PAYMENT_METHODS`: Phương thức thanh toán
- `SHIPPING_POLICY`: Chính sách giao hàng
- `RETURN_POLICY`: Chính sách đổi trả
- `FAQ`: Câu hỏi thường gặp

**Cách cập nhật:**

1. Mở file `src/configs/chatbotKnowledge.js`
2. Sửa nội dung của các constant
3. Restart server

---

## 🧪 Testing

### Chạy test tất cả intent:

```bash
node test-chat-guide.js
```

Test này sẽ kiểm tra:

- ✅ Intent detection chính xác
- ✅ AI trả lời đúng context
- ✅ Links được cung cấp

### Chạy test sản phẩm (như cũ):

```bash
node test-rag.js
```

---

## 🎨 Tích hợp Frontend

### 1. Hiển thị gợi ý phân loại

```javascript
const suggestions = await fetch("/api/chat/suggestions").then((r) => r.json());

// Hiển thị 2 nhóm gợi ý
console.log(suggestions.data.productQuestions); // Về sản phẩm
console.log(suggestions.data.purchaseGuideQuestions); // Về mua hàng
```

### 2. Xử lý response dựa trên intent

```javascript
const response = await fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: userMessage }),
}).then((r) => r.json());

const { intent, response: aiResponse, relatedProducts } = response.data;

// Hiển thị khác nhau tùy intent
if (intent === "askProduct" && relatedProducts.length > 0) {
  // Hiển thị danh sách sản phẩm
  showProductCarousel(relatedProducts);
} else if (intent === "askPurchaseGuide") {
  // Highlight các bước mua hàng
  highlightPurchaseSteps();
}

// Hiển thị response
showAIMessage(aiResponse);
```

### 3. Parse markdown và links

AI response có thể chứa:

- Markdown headings (`##`, `###`)
- Bullet points (`-`, `*`)
- **Bold text**
- Links đến trang web (`/products`, `/checkout`, `/product/[slug]`)

Sử dụng thư viện markdown parser như `marked` hoặc `react-markdown`.

---

## 🚀 Nâng cấp tiếp theo

### Có thể thêm:

1. **Tracking user journey**

   - Lưu lại các trang user đã xem
   - Gợi ý tiếp theo dựa trên hành vi

2. **Personalization**

   - Gợi ý sản phẩm dựa trên lịch sử mua hàng
   - Nhớ sở thích người dùng

3. **Multi-language**

   - Hỗ trợ tiếng Anh
   - Auto-detect ngôn ngữ

4. **Voice input**

   - Speech-to-text
   - Text-to-speech cho response

5. **Quick actions**
   - Button "Thêm vào giỏ hàng" ngay trong chat
   - Button "Xem chi tiết" link đến product page

---

## 📊 Monitoring

### Logs quan trọng:

```
[RAG] Product intent: { type: 'general', confidence: 0.8 }
[RAG] User intent: askPurchaseGuide
[RAG] Total products in DB: 24
[RAG] Products found for context: 8
```

### Metrics cần track:

- Intent distribution (intent nào được hỏi nhiều nhất?)
- Average response time
- User satisfaction (thumbs up/down)
- Conversion rate (từ chat → mua hàng)

---

## 📞 Hỗ trợ

Nếu có vấn đề:

1. Kiểm tra logs trong console
2. Chạy `node test-chat-guide.js` để debug
3. Xem file `RAG_UPGRADE_PLAN.md` để nâng cấp RAG

---

**Chatbot hiện tại:**

- ✅ Tư vấn sản phẩm (RAG)
- ✅ Hướng dẫn mua hàng
- ✅ Giải đáp chính sách
- ✅ Cung cấp links

**Đang phát triển:**

- 🔄 Personalization
- 🔄 Multi-language
- 🔄 Voice support
