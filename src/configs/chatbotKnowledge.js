/**
 * Kiến thức của Chatbot về website và quy trình mua hàng
 */

const WEBSITE_INFO = {
  name: "Shop Công Nghệ",
  description: "Cửa hàng bán điện thoại, tablet, đồng hồ thông minh chính hãng",
  supportEmail: "support@shop.com",
  hotline: "1900-xxxx",
};

// Các trang chính trên website
const WEBSITE_ROUTES = {
  home: { path: "/", description: "Trang chủ - Xem sản phẩm nổi bật" },
  products: { path: "/products", description: "Danh sách tất cả sản phẩm" },
  productDetail: { path: "/product/[slug]", description: "Chi tiết sản phẩm" },
  cart: { path: "/cart", description: "Giỏ hàng của bạn" },
  checkout: { path: "/checkout", description: "Thanh toán đơn hàng" },
  login: { path: "/login", description: "Đăng nhập tài khoản" },
  register: { path: "/register", description: "Đăng ký tài khoản mới" },
  profile: { path: "/profile", description: "Thông tin cá nhân" },
  orders: { path: "/my-orders", description: "Lịch sử đơn hàng" },
  wishlist: { path: "/wishlist", description: "Sản phẩm yêu thích" },
};

// Quy trình mua hàng step-by-step
const PURCHASE_GUIDE = `
## HƯỚNG DẪN MUA HÀNG TRÊN WEBSITE

### Bước 1: Tìm sản phẩm
- Truy cập trang **/products** để xem tất cả sản phẩm
- Sử dụng bộ lọc theo: Giá, Danh mục, Thương hiệu
- Hoặc tìm kiếm bằng thanh search trên header

### Bước 2: Xem chi tiết sản phẩm
- Click vào sản phẩm để xem chi tiết tại **/product/[tên-sản-phẩm]**
- Xem hình ảnh, mô tả, giá, số lượng còn trong kho
- Đọc đánh giá từ khách hàng khác

### Bước 3: Thêm vào giỏ hàng
- Chọn số lượng muốn mua
- Nhấn nút **"Thêm vào giỏ hàng"**
- Sản phẩm sẽ được thêm vào giỏ hàng của bạn

### Bước 4: Xem giỏ hàng
- Click icon giỏ hàng hoặc truy cập **/cart**
- Kiểm tra sản phẩm, số lượng, giá tiền
- Có thể thay đổi số lượng hoặc xóa sản phẩm

### Bước 5: Tiến hành thanh toán
- Nhấn **"Thanh toán"** để đến trang **/checkout**
- Điền thông tin giao hàng: Họ tên, SĐT, Địa chỉ
- Chọn phương thức thanh toán

### Bước 6: Xác nhận đơn hàng
- Kiểm tra lại thông tin đơn hàng
- Nhấn **"Đặt hàng"** để hoàn tất
- Bạn sẽ nhận email xác nhận đơn hàng

### Bước 7: Theo dõi đơn hàng
- Đăng nhập và vào **/my-orders** để xem trạng thái đơn hàng
- Trạng thái: Chờ xác nhận → Đang xử lý → Đang giao → Đã giao
`;

// Các phương thức thanh toán
const PAYMENT_METHODS = `
## PHƯƠNG THỨC THANH TOÁN

1. **Thanh toán khi nhận hàng (COD)**
   - Trả tiền mặt khi shipper giao hàng
   - Kiểm tra hàng trước khi thanh toán
   - Phí COD: Miễn phí

2. **Chuyển khoản ngân hàng**
   - Chuyển khoản trước, nhận hàng sau
   - Thông tin tài khoản sẽ hiển thị sau khi đặt hàng
   - Xác nhận đơn hàng sau khi nhận được tiền

3. **Ví điện tử (MoMo, ZaloPay, VNPay)**
   - Quét mã QR để thanh toán
   - Xác nhận tự động, nhanh chóng
`;

// Chính sách giao hàng
const SHIPPING_POLICY = `
## CHÍNH SÁCH GIAO HÀNG

- **Nội thành HCM/Hà Nội**: 1-2 ngày làm việc
- **Các tỉnh khác**: 3-5 ngày làm việc
- **Phí ship**: 
  - Miễn phí cho đơn hàng từ 500,000đ
  - Đơn dưới 500,000đ: 30,000đ

- **Đơn vị vận chuyển**: GHN, GHTK, J&T Express
`;

// Chính sách đổi trả
const RETURN_POLICY = `
## CHÍNH SÁCH ĐỔI TRẢ

- **Thời gian đổi trả**: Trong vòng 7 ngày kể từ ngày nhận hàng
- **Điều kiện đổi trả**:
  - Sản phẩm còn nguyên tem, hộp, phụ kiện
  - Chưa qua sử dụng hoặc lỗi do nhà sản xuất
  - Có hóa đơn mua hàng

- **Quy trình đổi trả**:
  1. Liên hệ hotline hoặc chat để yêu cầu đổi trả
  2. Gửi hình ảnh sản phẩm lỗi (nếu có)
  3. Nhân viên sẽ hướng dẫn gửi hàng về
  4. Kiểm tra và hoàn tiền/đổi sản phẩm trong 3-5 ngày
`;

// Câu hỏi thường gặp
const FAQ = `
## CÂU HỎI THƯỜNG GẶP

**Q: Làm sao để đăng ký tài khoản?**
A: Truy cập /register, điền email và mật khẩu, nhấn "Đăng ký". Hoặc đăng nhập nhanh bằng Google/Facebook.

**Q: Quên mật khẩu phải làm sao?**
A: Vào trang /login, nhấn "Quên mật khẩu", nhập email để nhận link đặt lại mật khẩu.

**Q: Sản phẩm có bảo hành không?**
A: Tất cả sản phẩm đều có bảo hành chính hãng từ 6-24 tháng tùy loại.

**Q: Có thể hủy đơn hàng không?**
A: Có thể hủy khi đơn hàng chưa được giao cho đơn vị vận chuyển. Vào /my-orders để hủy.

**Q: Có xuất hóa đơn VAT không?**
A: Có, vui lòng yêu cầu xuất VAT khi đặt hàng và cung cấp thông tin công ty.
`;

// Intent patterns - để nhận diện ý định người dùng
const INTENT_PATTERNS = {
  greeting: ["xin chào", "hello", "hi", "chào", "hey"],
  askProduct: ["tìm", "có sản phẩm", "giá", "bao nhiêu", "mua", "đề xuất", "gợi ý"],
  askPurchaseGuide: ["mua hàng", "đặt hàng", "cách mua", "hướng dẫn mua", "làm sao để mua", "mua như thế nào"],
  askPayment: ["thanh toán", "trả tiền", "payment", "cod", "chuyển khoản", "momo", "vnpay"],
  askShipping: ["giao hàng", "ship", "vận chuyển", "bao lâu", "phí ship", "freeship"],
  askReturn: ["đổi trả", "hoàn tiền", "trả hàng", "bảo hành", "lỗi", "hỏng"],
  askAccount: ["đăng ký", "đăng nhập", "tài khoản", "mật khẩu", "quên mật khẩu"],
  askOrder: ["đơn hàng", "theo dõi", "trạng thái", "hủy đơn", "kiểm tra đơn"],
  askCart: ["giỏ hàng", "cart", "thêm vào giỏ"],
};

// Hàm nhận diện intent
const detectIntent = (message) => {
  const lowerMessage = message.toLowerCase();
  
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (lowerMessage.includes(pattern)) {
        return intent;
      }
    }
  }
  return "askProduct"; // Default là hỏi về sản phẩm
};

// Lấy context phù hợp theo intent
const getContextByIntent = (intent) => {
  switch (intent) {
    case "greeting":
      return "Bạn là nhân viên tư vấn thân thiện. Hãy chào đón khách và hỏi họ cần hỗ trợ gì.";
    case "askPurchaseGuide":
      return PURCHASE_GUIDE;
    case "askPayment":
      return PAYMENT_METHODS;
    case "askShipping":
      return SHIPPING_POLICY;
    case "askReturn":
      return RETURN_POLICY;
    case "askAccount":
    case "askOrder":
    case "askCart":
      return FAQ;
    default:
      return ""; // Sẽ dùng product context
  }
};

module.exports = {
  WEBSITE_INFO,
  WEBSITE_ROUTES,
  PURCHASE_GUIDE,
  PAYMENT_METHODS,
  SHIPPING_POLICY,
  RETURN_POLICY,
  FAQ,
  INTENT_PATTERNS,
  detectIntent,
  getContextByIntent,
};
