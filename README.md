# Học giỏi cùng cô Thanh Mai — website học online Toán & Tiếng Việt lớp 2–5

Website độc lập (không dùng chung mã/cơ sở dữ liệu với phần mềm quản lý trung tâm).
Nội dung theo sách **Kết nối tri thức với cuộc sống**.

## Tình trạng hiện tại: Giai đoạn 1 — bản dùng thử (miễn phí, chưa thu tiền)

| Phần | Trạng thái |
|---|---|
| Trang chủ, menu, chân trang | Đã có |
| Trang môn, trang lớp, Học theo tuần (Toán lớp 4 – 35 tuần) | Đã có — **dữ liệu mẫu** |
| Trang bài giảng (video + phiếu + cột "Cùng bài học / Cùng lớp học") | Đã có |
| Nhúng phiếu bài tập HTML (khung cách ly `sandbox`) | Đã có — mới có 1 phiếu thật (Đánh giá tháng 10) |
| Video YouTube | Khung đã có — **chưa gắn video thật** |
| Trang quản trị, nhập CSV | Giai đoạn 2 |
| Đăng ký/đăng nhập, gói học, chuyển khoản, xác nhận | Giai đoạn 3 |
| Lưu điểm, tiến độ, báo cáo | Giai đoạn 4 |
| Tự động đối soát (SePay), Kỳ thi, Thi thử, Thảo luận | Giai đoạn 5 |

Trong bản dùng thử, **chỉ các bài có nhãn Free** xem được (tuần 1–2 và Phiếu đánh giá tháng 10).
Các bài khác hiện thông báo khóa "Bài này dành cho học sinh đã đăng ký gói học".

## Chạy trên máy (dành cho người kỹ thuật)

Cần Node.js 22.

```bash
npm ci            # cài đặt
npm run dev       # chạy thử: mở http://localhost:3000
npm run check     # chạy TẤT CẢ kiểm tra: kiểu, lint, test, build, test trình duyệt
```

Giai đoạn 1 không cần biến môi trường. Từ Giai đoạn 2, sao chép `.env.example` thành `.env.local` và điền khóa (không bao giờ đưa `.env.local` lên GitHub).

## Sửa nội dung trong bản dùng thử

Ở Giai đoạn 2 sẽ có trang quản trị. Hiện tại nội dung nằm trong 2 file:

- `src/data/site.ts` — tên website, câu nói truyền cảm hứng, hotline/Zalo, mã video giới thiệu, 5 cam kết (**bản nháp, cô cần sửa**), phản hồi phụ huynh (để trống thì tự ẩn), banner, chính sách hoàn tiền.
  **Quy tắc: không bịa số liệu, không bịa phản hồi.** Ô để `null` hoặc rỗng sẽ tự ẩn.
- `src/data/toan-lop4.ts` — mục lục 73 bài, cách chia bài vào 35 tuần (`PLAN`), ngày khai giảng, tuần nghỉ Tết, tuần nào miễn phí, các phiếu thật (`REAL_WORKSHEETS`).
  **Cách chia tuần và ngày là dự kiến** — cô đối chiếu với kế hoạch dạy học của trường.

### Gắn video YouTube cho một bài (tạm thời, trước khi có trang quản trị)
Trong `buildItems` của `src/data/toan-lop4.ts`, mục video có trường `videoRef`. Dán link YouTube (chế độ **Không công khai**) hoặc mã 11 ký tự vào đó.

> Lưu ý: link YouTube "không công khai" vẫn có thể bị người khác chia sẻ lại. Nếu sau này cần chống chia sẻ, chuyển sang dịch vụ video riêng — hệ thống đã thiết kế sẵn trường `videoProvider` + `videoRef` để đổi.

## Phiếu bài tập tương tác — vì sao nhúng bằng `iframe sandbox`

Phiếu HTML được coi là nội dung **không đáng tin** (có thể chứa mã bất kỳ). Phiếu được nhúng trong khung cách ly:
- Phiếu chạy được và nộp điểm (`allow-scripts`, `allow-forms`).
- Phiếu nằm ở **tên miền khác** website nên không đọc được phiên đăng nhập/cookie của website.
- Phiếu không thể chuyển hướng cả trang sang chỗ khác (không có `allow-top-navigation`).

Ở Giai đoạn 2, phiếu trả phí sẽ được cất trong kho riêng tư (Supabase Storage) và chỉ trả về khi học sinh có quyền.
**Giới hạn cần biết:** khi một học sinh đã có quyền mở phiếu, trình duyệt của em đó tải được nội dung phiếu — không có cách nào giữ bí mật tuyệt đối với người đã có quyền xem.

## Bảo mật đã có ở Giai đoạn 1
- Header bảo mật: chống trang khác nhúng website (clickjacking), CSP giới hạn nguồn nhúng, `nosniff`.
- Bài trả phí: máy chủ không đưa video/phiếu vào trang (đã kiểm thử cả mã HTML thô).
- Đường dẫn đoán bừa trả về 404.
- Bản dùng thử chặn công cụ tìm kiếm lập chỉ mục (`noindex`).

## Kiểm thử
- `tests/unit` — ngày tháng (múi giờ Việt Nam, sát nửa đêm, qua năm, năm nhuận), dữ liệu 35 tuần, kiểm tra đường dẫn an toàn.
- `tests/e2e` — trình duyệt tự động khung điện thoại (Pixel 5): đủ phần trang chủ, menu, luồng chọn môn → lớp → tuần → bài, bài Free/bài khóa, 404, header bảo mật, mạng 3G giả lập, mở được toàn bộ trang bài học.

## Sao lưu
Giai đoạn 1 chưa có cơ sở dữ liệu — toàn bộ nằm trong kho GitHub. Hướng dẫn sao lưu/khôi phục cơ sở dữ liệu sẽ bổ sung ở Giai đoạn 2–3.
