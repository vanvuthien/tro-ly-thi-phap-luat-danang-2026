# ⚖️ Trợ Lý Thi Trắc Nghiệm Pháp Luật Đà Nẵng 2026

[![Chrome Extension](https://img.shields.io/badge/Chrome_Extension-Manifest_V3-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![JavaScript](https://img.shields.io/badge/Language-JavaScript_ES6+-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Tiện ích mở rộng trình duyệt (Chrome Extension Manifest V3) hỗ trợ tra cứu, gợi ý kiến thức và ôn luyện thi trắc nghiệm pháp luật trực tuyến (Hội thi Tìm hiểu pháp luật TP. Đà Nẵng năm 2026).**

---

## 🌟 Tính Năng Nổi Bật

- **⚡ Tra Cứu Cục Bộ Offline Siêu Tốc**:
  - Tích hợp sẵn cơ sở dữ liệu **421 câu hỏi và đáp án** trắc nghiệm pháp luật chuẩn kèm trích dẫn văn bản quy phạm pháp luật (Luật Việc làm 2025, Bộ luật Lao động 2019, Luật BHXH 2024, Luật Bảo vệ dữ liệu cá nhân 2025, v.v.).
  - Tự động nhận diện và đối chiếu chính xác ngay cả khi thứ tự phương án A - B - C - D bị xáo trộn ngẫu nhiên.
  - Hoạt động 100% offline, không cần internet hay API key đối với các câu hỏi trong ngân hàng dữ liệu.

- **🤖 Hỗ Trợ AI Linh Hoạt (OpenAI / OpenRouter / Custom Gateway)**:
  - Khi gặp câu hỏi nằm ngoài ngân hàng, tiện ích có thể kết nối với mô hình AI (GPT-4o, GPT-3.5, hoặc endpoint tuỳ chỉnh) để phân tích đề và đưa ra gợi ý kèm trích dẫn.
  - Tự cấu hình API Key và Endpoint ngay trong giao diện cài đặt (Popup).

- **🪟 Giao Diện Nổi Tiện Dụng (Floating Glassmorphic HUD)**:
  - Hiển thị trực quan ngay trên trang làm bài thi trực tuyến.
  - Tự do kéo thả di chuyển khắp màn hình, thu nhỏ thành biểu tượng gọn gàng khi cần quan sát toàn bộ đề thi.
  - Hiển thị rõ ràng phương án gợi ý, căn cứ điều luật và trích dẫn văn bản chi tiết.

- **📚 Quản Lý Nguồn Tri Thức Động**:
  - Cho phép người dùng bổ sung thêm tài liệu văn bản (`.txt`, `.md`, `.json`) hoặc dán trực tiếp điều luật vào bộ nhớ tiện ích để làm ngữ cảnh phong phú hơn cho AI.

- **📊 Hỗ Trợ Dự Đoán Lượt Thi (Câu Tự Luận 1)**:
  - Thống kê thời gian thực số lượng người đăng ký và lượt thi đã hoàn thành để thí sinh có số liệu tham khảo cho câu dự đoán.

---

## 🚀 Hướng Dẫn Cài Đặt (Chrome / Edge / Cốc Cốc / Brave)

### Bước 1: Tải mã nguồn về máy tính
Bạn có thể clone repository này bằng Git hoặc tải file ZIP về và giải nén:
```bash
git clone https://github.com/vanvuthien/tro-ly-thi-phap-luat-danang-2026.git
```
*(Hoặc bấm nút **Code > Download ZIP** trên GitHub rồi giải nén ra một thư mục).*

### Bước 2: Bật Chế độ dành cho nhà phát triển (Developer Mode)
1. Trên trình duyệt Chrome hoặc Cốc Cốc, truy cập: `chrome://extensions` *(Trên Microsoft Edge: `edge://extensions`)*.
2. Bật công tắc **Developer mode (Chế độ dành cho nhà phát triển)** ở góc trên bên phải màn hình.

### Bước 3: Nạp tiện ích vào trình duyệt
1. Nhấn nút **"Load unpacked"** (Tải tiện ích đã giải nén) ở góc trên bên trái.
2. Chọn thư mục dự án vừa tải về (thư mục có chứa tệp `manifest.json`).
3. Tiện ích **"Trợ Lý Thi Trắc Nghiệm Pháp Luật Đà Nẵng 2026"** sẽ được kích hoạt thành công!

### Bước 4: Ghim tiện ích
- Nhấn vào biểu tượng mảnh ghép (Extensions) ở thanh công cụ trình duyệt, chọn **Ghim (Pin)** tiện ích ⚖️ để tiện mở menu điều khiển.

---

## 📖 Hướng Dẫn Sử Dụng

1. **Cấu hình AI (Tuỳ chọn)**:
   - Mở Popup tiện ích -> Chọn tab **⚙️ OpenAI**.
   - Điền API Key và chọn Model mong muốn -> Bấm **⚡ Kiểm Tra Kết Nối** -> Bấm **💾 Lưu Cài Đặt**.
   *(Lưu ý: Nếu chỉ ôn luyện các câu trong ngân hàng có sẵn, bạn không cần thiết lập mục này).*

2. **Làm bài thi**:
   - Truy cập vào trang thi trắc nghiệm (hỗ trợ nền tảng MyAloha và trang thi chính thức của hội thi).
   - Khung trợ lý nổi **"⚖️ AI Trợ Lý Pháp Luật"** sẽ tự động hiển thị bên góc phải màn hình.
   - Khi chuyển đến câu hỏi, tiện ích sẽ tự động tra cứu, đánh dấu viền sáng màu xanh trên đáp án khớp ngân hàng kèm căn cứ giải thích.
   - Thí sinh tự kiểm tra và chọn đáp án theo ý chí của mình.

---

## 📂 Cấu Trúc Dự Án

```
├── manifest.json              # Khai báo tiện ích (Chrome Manifest V3)
├── background.js              # Service worker xử lý API calls & lưu trữ
├── content.js                 # Content script chèn HUD nổi và tương tác trang thi
├── content.css                # CSS cho khung HUD nổi & highlight đáp án
├── popup.html                 # Giao diện Popup cài đặt
├── popup.js                   # Logic xử lý Popup (API key, mô hình, tải tài liệu)
├── popup.css                  # Giao diện Glassmorphism của Popup
├── HUONG_DAN_SU_DUNG.md       # Tài liệu hướng dẫn sử dụng chi tiết
├── knowledge/                 # Cơ sở dữ liệu và công cụ tri thức pháp luật
│   ├── knowledge_db.json      # Ngân hàng 421 câu hỏi kèm căn cứ pháp lý
│   ├── knowledge_engine.js    # Thuật toán tìm kiếm & đối chiếu văn bản
│   ├── DANH_MUC_VAN_BAN.md    # Danh mục các văn bản luật tham chiếu
│   └── ...                    # Các thư mục văn bản luật tra cứu chi tiết
└── icons/                     # Biểu tượng của Extension (16, 48, 128)
```

---

## ⚠️ Tuyên Bố Miễn Trừ Trách Nhiệm (Disclaimer)

- Tiện ích này được phát triển phục vụ mục đích **học tập, nghiên cứu và hỗ trợ tra cứu kiến thức pháp luật**.
- Tiện ích **KHÔNG** tự động chọn đáp án, không tự động chuyển câu và không tự động nộp bài.
- Người dự thi tự chịu trách nhiệm về kết quả bài thi của mình. Vui lòng luôn rà soát kỹ các căn cứ pháp lý trước khi đưa ra quyết định cuối cùng.

---

## 📄 Bản Quyền (License)

Dự án được phân phối dưới giấy phép [MIT License](LICENSE).
