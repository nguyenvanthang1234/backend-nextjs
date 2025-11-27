# Kiến Trúc RAG (Retrieval-Augmented Generation) Cho Hệ Thống Thương Mại Điện Tử

## Tổng Quan

RAG là kỹ thuật tối ưu hóa kết quả đầu ra của LLM (Large Language Model) bằng cách tham chiếu đến cơ sở tri thức bên ngoài (dữ liệu sản phẩm của shop) trước khi sinh câu trả lời. Điều này giúp AI trả lời chính xác về giá cả, tồn kho và thông số kỹ thuật của sản phẩm trong thời gian thực.

## Luồng Xử Lý Dữ Liệu (Backend RAG Flow)

### 1. Giai đoạn Ingestion (Chuẩn bị dữ liệu)

Hệ thống cần chuyển đổi dữ liệu sản phẩm thành dạng vector để máy tính có thể hiểu và tìm kiếm theo ngữ nghĩa.

- **Trigger:** Khi có sản phẩm mới được tạo hoặc cập nhật (Create/Update Product).
- **Process:**
  1.  Lấy thông tin quan trọng: `Tên sản phẩm`, `Mô tả`, `Giá`, `Danh mục`, `Thông số kỹ thuật`.
  2.  Ghép thành một đoạn văn bản (Chunking). Ví dụ: _"Giày Nike Air Zoom Pegasus 39, giày chạy bộ nam, đệm phản hồi tốt, giá 3.500.000 VNĐ..."_
  3.  Gửi đoạn văn bản này qua **Embedding Model** (ví dụ: `text-embedding-3-small` của OpenAI hoặc `models/embedding-001` của Gemini).
  4.  Nhận về một vector (mảng số thực).
  5.  Lưu vector này kèm `Product ID` vào **Vector Database** (Pinecone, Qdrant, Weaviate, hoặc PostgreSQL với pgvector).

### 2. Giai đoạn Retrieval (Truy vấn & Tìm kiếm)

Khi người dùng đặt câu hỏi.

- **User Query:** "Tìm cho mình giày chạy bộ dưới 2 triệu màu đỏ".
- **Process:**
  1.  Chuyển câu hỏi của user thành vector (dùng cùng Embedding Model ở trên).
  2.  Truy vấn Vector Database để tìm ra Top K (ví dụ: 5) sản phẩm có vector gần nhất với vector câu hỏi (Cosine Similarity).
  3.  Kết quả trả về: Danh sách 5 sản phẩm tiềm năng nhất.

### 3. Giai đoạn Generation (Sinh câu trả lời)

Tổng hợp thông tin để trả lời user.

- **Context Construction:** Tạo prompt chứa thông tin các sản phẩm vừa tìm được.

  ```text
  Bạn là nhân viên tư vấn bán hàng nhiệt tình. Dựa vào danh sách sản phẩm sau đây, hãy trả lời câu hỏi của khách hàng.

  Danh sách sản phẩm:
  1. Giày A - 1.500.000 VNĐ - Màu đỏ
  2. Giày B - 1.800.000 VNĐ - Màu đỏ đen
  ...

  Câu hỏi khách hàng: "Tìm cho mình giày chạy bộ dưới 2 triệu màu đỏ"
  ```

- **LLM Inference:** Gửi prompt này đến LLM (GPT-4o-mini, Gemini 1.5 Flash).
- **Response:** LLM trả về câu tư vấn tự nhiên, kèm link hoặc ảnh sản phẩm nếu có trong data.

## Đề xuất Công Nghệ (Tech Stack)

- **LLM & Embedding:** Google Gemini API (Free tier hào phóng, chất lượng tốt) hoặc OpenAI API.
- **Vector Database:**
  - _Production:_ Pinecone (Serverless), Supabase (pgvector).
  - _Simple/MVP:_ In-memory vector store (LangChain MemoryVectorStore) hoặc lưu thẳng embedding vào field trong MongoDB (nếu hỗ trợ vector search) hoặc tìm kiếm full-text search cơ bản nếu chưa muốn triển khai vector search phức tạp ngay.

## Triển khai trong dự án hiện tại (Simplified Version)

Trong scope hiện tại, chúng ta sẽ triển khai phiên bản **"On-the-fly RAG"** (RAG thời gian thực đơn giản):

1.  **Không dùng Vector DB phức tạp:** Do số lượng sản phẩm demo chưa quá lớn.
2.  **Flow:**
    - API `/api/chat` nhận câu hỏi.
    - Backend gọi API nội bộ lấy danh sách sản phẩm (có thể filter sơ bộ theo keyword nếu user nhắc đến keyword).
    - Gửi danh sách (dưới dạng JSON rút gọn) trực tiếp vào context của Gemini.
    - Trả về câu trả lời.

---

## API Documentation

### 1. Chat API

**Endpoint:** `POST /api/chat`

**Request Body:**

```json
{
  "message": "Tìm cho mình giày chạy bộ dưới 2 triệu",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Xin chào"
    },
    {
      "role": "assistant",
      "content": "Xin chào! Tôi có thể giúp gì cho bạn?"
    }
  ]
}
```

**Response:**

```json
{
  "status": "Success",
  "message": "Chat thành công",
  "typeError": "",
  "data": {
    "response": "Chào bạn! Dựa trên yêu cầu của bạn, mình có một số gợi ý...",
    "relatedProducts": [
      {
        "id": "...",
        "name": "Giày Nike Air",
        "slug": "giay-nike-air",
        "image": "...",
        "price": 1800000,
        "discount": 10,
        "actualPrice": 1620000
      }
    ],
    "filters": {
      "maxPrice": 2000000,
      "keywords": ["giày", "chạy", "bộ"]
    }
  }
}
```

### 2. Lấy Câu Hỏi Gợi Ý

**Endpoint:** `GET /api/chat/suggestions`

**Response:**

```json
{
  "status": "Success",
  "data": {
    "questions": [
      "Tìm sản phẩm dưới 500 nghìn",
      "Sản phẩm bán chạy nhất là gì?",
      "Có sản phẩm nào đang giảm giá không?"
    ]
  }
}
```

### 3. Tìm Kiếm Sản Phẩm (Natural Language)

**Endpoint:** `POST /api/chat/search`

**Request Body:**

```json
{
  "query": "giày dưới 1 triệu màu đỏ"
}
```

**Response:**

```json
{
  "status": "Success",
  "data": {
    "products": [...],
    "filters": {...},
    "total": 5
  }
}
```

## Cấu Hình

Thêm biến môi trường vào file `.env`:

```env
# Lấy API key tại: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here
```

---

_Tài liệu này dùng để tham khảo cho việc phát triển tính năng Chatbot AI._
