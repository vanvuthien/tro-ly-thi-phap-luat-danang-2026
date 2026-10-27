# HƯỚNG DẪN CÀI ĐẶT & SỬ DỤNG EXTENSION AI TRỢ LÝ PHÁP LUẬT ĐÀ NẴNG 2026

Extension có ngân hàng gợi ý cho hai cuộc thi: *Tìm hiểu pháp luật về lao động, việc làm và an sinh xã hội* (221 câu) và *Tìm hiểu quy định pháp luật về bảo vệ dữ liệu cá nhân* (200 câu). Phần thống kê TL1 hỗ trợ cả hai cuộc thi. Tiện ích không tự chọn đáp án, chuyển câu, nhập TL1 hoặc nộp bài.

🌐 **Trang web:** `https://timhieuphapluatdanang2026.com/cuoc-thi/tim-hieu-phap-luat-ve-lao-dong-viec-lam-va-an-sinh-xa-hoi-1` hoặc `https://timhieuphapluatdanang2026.com/cuoc-thi/tim-hieu-quy-dinh-phap-luat-ve-bao-ve-du-lieu-ca-nhan-2` (nền tảng MyAloha)

---

## 🌟 CÁC TÍNH NĂNG NỔI BẬT

1. **Tra cứu cục bộ trước, AI khi cần**:
   - Tích hợp **421 câu hỏi và đáp án** trong bộ dữ liệu đi kèm, chia theo đúng cuộc thi. Tiện ích đối chiếu cả nội dung câu hỏi và phương án đang hiển thị; thứ tự A–D có thể thay đổi.
   - Nếu không khớp ngân hàng, tiện ích có thể gọi API do bạn cấu hình. API Key không cần thiết cho câu đã khớp.
   - Thư mục dự án có các văn bản tham khảo:
     + *Luật Việc làm số 74/2025/QH15* & chính sách bảo hiểm thất nghiệp.
     + *Bộ luật Lao động năm 2019 (Luật số 45/2019/QH14)* & Nghị định 145/2020/NĐ-CP, Nghị định 337/2025/NĐ-CP.
     + *Luật Bảo hiểm xã hội năm 2024 (Luật số 41/2024/QH15)* & Nghị định 158/2025/NĐ-CP, Nghị định 176/2025/NĐ-CP.
     + *Luật Người lao động Việt Nam đi làm việc ở nước ngoài theo hợp đồng năm 2020*.
     + *Nghị định 12/2022/NĐ-CP* về xử phạt vi phạm hành chính.
     + *Luật Công đoàn năm 2024*, Luật Thực hiện dân chủ ở cơ sở.
     + *Luật Bảo vệ dữ liệu cá nhân năm 2025*, *Nghị định 13/2023/NĐ-CP*, *Nghị định 356/2025/NĐ-CP* và *Nghị định 330/2026/NĐ-CP*.
   - Có thể thêm tài liệu văn bản `.txt`, `.md`, `.json` hoặc dán ghi chú để gửi làm ngữ cảnh khi cần gọi AI.

2. **Khung Trợ Lý Nổi Trực Quan (Floating Glassmorphic HUD)**:
   - Hiển thị ngay trên trang làm bài thi trắc nghiệm.
   - Kéo thả di chuyển tự do khắp màn hình, có nút thu nhỏ thành biểu tượng gọn gàng.
   - Hiển thị gợi ý, nguồn và căn cứ trong khung riêng. Hãy tự kiểm tra trước khi chọn và nộp.

3. **Chế độ gợi ý**:
   - Khi câu mới xuất hiện, tiện ích tự hiển thị gợi ý và làm sáng phương án tương ứng nếu câu hỏi và các phương án khớp ngân hàng. Bạn tự chọn đáp án và tự chuyển câu.
   - Nếu chưa khớp ngân hàng, bấm **Giải câu này** để tra cứu thêm bằng tài liệu và API đã cấu hình.
   - Ở **Câu tự luận 1**, tiện ích hiển thị số người đăng ký và lượt thi hoàn thành tại thời điểm tra cứu. Bạn tự nhập số dự đoán. Đây không phải tổng số chắc chắn khi cuộc thi kết thúc.
   - Tiện ích không tự điền đáp án hoặc nộp bài.

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT EXTENSION VÀO TRÌNH DUYỆT (CHROME / EDGE / CỐC CỐC)

### Bước 1: Mở trang quản lý tiện ích mở rộng
- Trên thanh địa chỉ trình duyệt Google Chrome hoặc Cốc Cốc, nhập: `chrome://extensions` và nhấn **Enter**.
- (Trên Microsoft Edge, nhập: `edge://extensions`).

### Bước 2: Bật chế độ dành cho nhà phát triển (Developer mode)
- Gạt công tắc **"Developer mode"** (Chế độ dành cho nhà phát triển) ở góc trên bên phải màn hình sang trạng thái **BẬT (ON)**.

### Bước 3: Tải tiện ích mở rộng
- Bấm nút **"Load unpacked"** (Tải tiện ích đã giải nén) ở góc trên bên trái.
- Chọn thư mục dự án vừa clone / tải về (thư mục chứa file `manifest.json`).
- Bấm **Select Folder** (Chọn thư mục).
- Tiện ích **"Trợ Lý Thi Trắc Nghiệm Pháp Luật Đà Nẵng 2026"** sẽ xuất hiện trên danh sách tiện ích của bạn!

### Bước 4: Ghim tiện ích lên thanh công cụ
- Bấm vào biểu tượng mảnh ghép (Extensions) ở góc trên bên phải trình duyệt, bấm nút **Ghim (Pin)** cạnh tiện ích "AI Trợ Lý Pháp Luật 2026" để biểu tượng ⚖️ luôn hiển thị trên thanh công cụ.

---

## 🔑 CẤU HÌNH API CHO CÂU NGOÀI NGÂN HÀNG

1. Bấm vào biểu tượng ⚖️ trên thanh công cụ trình duyệt để mở bảng điều khiển.
2. Tại tab **"⚙️ OpenAI"**:
   - Nhập khóa API của bạn vào ô **OpenAI API Key** (dạng `sk-...`).
   - Chọn đúng tên mô hình mà tài khoản hoặc gateway của bạn hỗ trợ.
   - Nếu bạn dùng API qua proxy/OpenRouter/Azure, bạn có thể chỉnh sửa ô **API Endpoint** (nếu dùng OpenAI chuẩn thì giữ nguyên mặc định).
3. Bấm **"⚡ Kiểm Tra Kết Nối"** để đảm bảo khóa API hoạt động tốt.
4. Bấm **"💾 Lưu Cài Đặt"**.

---

## 📚 QUẢN LÝ NGUỒN TRI THỨC (NOTEBOOKLM STYLE)

1. Mở tiện ích và chuyển sang tab **"📚 Tri Thức"**:
   - Bạn sẽ thấy thông tin về ngân hàng **421 câu hỏi trắc nghiệm**.
2. **Muốn bổ sung thêm tài liệu của riêng bạn**:
   - Kéo thả tệp văn bản (`.txt`, `.md`, `.json`) vào khung tải lên.
   - Hoặc nhập tiêu đề và dán trực tiếp nội dung điều luật/ghi chú vào ô **"Dán nội dung..."** rồi bấm **"+ Thêm Vào Tri Thức"**.
   - Nội dung phù hợp sẽ được đưa vào ngữ cảnh khi cần gọi AI.

---

## 🎯 HƯỚNG DẪN LÀM BÀI THI TRỰC TUYẾN

1. Truy cập vào trang cuộc thi:
   `https://timhieuphapluatdanang2026.com/cuoc-thi/tim-hieu-phap-luat-ve-lao-dong-viec-lam-va-an-sinh-xa-hoi-1` hoặc `https://timhieuphapluatdanang2026.com/cuoc-thi/tim-hieu-quy-dinh-phap-luat-ve-bao-ve-du-lieu-ca-nhan-2`
2. Bấm **"Vào thi"** và điền thông tin đăng ký theo quy định của ban tổ chức.
3. Khi vào giao diện bài thi:
   - Bạn sẽ thấy khung điều khiển **"⚖️ AI Trợ Lý Pháp Luật"** xuất hiện ở góc phải màn hình.
   - Bạn có thể nhấp chuột vào thanh tiêu đề để kéo rê khung đến vị trí thuận tiện nhất, hoặc bấm dấu `─` để thu nhỏ khi cần.
4. **Xem gợi ý cho câu đang mở**:
   - Chuyển đến câu hỏi cần làm; gợi ý khớp ngân hàng sẽ tự xuất hiện trong khung trợ lý.
   - Tiện ích sẽ tra cứu ngân hàng trước và hiển thị kết quả:
     + Phương án đúng (A, B, C, D)
     + Trích dẫn điều luật căn cứ
     + Lời giải thích ngắn gọn
     + Viền xanh và nhãn “Gợi ý” trên phương án khớp ngân hàng; gợi ý AI có màu vàng để bạn kiểm tra kỹ hơn. Tiện ích không chọn phương án.
5. Ở một trong hai cuộc thi, chuyển tới **Câu tự luận 1** để xem số người đăng ký và lượt thi đã hoàn thành hiện tại. Bấm **"🎯 GIẢI CÂU NÀY"** để làm mới số liệu. Tiện ích giữ nguyên nội dung ô dự đoán; bạn tự quyết định số cần nhập.
6. Sau khi hoàn thành xong 20 câu trắc nghiệm và câu dự đoán số lượng người tham gia, hãy rà soát lại và bấm **"Nộp bài"**!
