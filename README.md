# Học giỏi cùng cô Thanh Mai — website học online Toán & Tiếng Việt lớp 2–5

Website độc lập (không dùng chung mã/cơ sở dữ liệu với phần mềm quản lý trung tâm).
Nội dung theo sách **Kết nối tri thức với cuộc sống**.

## Trang quản trị — tải đề lên (Giai đoạn 2, đã chạy)

Địa chỉ: **https://hocgioithanhmai.vercel.app/quan-tri**

### Lần đầu (chỉ làm một lần)
1. Mở `/quan-tri/dang-nhap` → bấm **Tạo tài khoản** → nhập email + mật khẩu (ít nhất 8 ký tự).
2. Mở hộp thư, bấm link xác nhận của Supabase. Nếu sau khi bấm thấy trang lỗi "localhost" thì **không sao** — tài khoản đã được xác nhận; quay lại `/quan-tri/dang-nhap` đăng nhập.
3. Nhắn Claude "đã tạo tài khoản quản trị" để được cấp quyền (hoặc tự chạy lệnh SQL trong `supabase/README.md`).
4. (Nên làm) Supabase → Authentication → URL Configuration → **Site URL** = `https://hocgioithanhmai.vercel.app` để link xác nhận email về đúng website.

### Tải một đề
`/quan-tri` → **Tải đề mới** → chọn môn, lớp, tên đề, loại đề, thời gian (có thể để trống) → chọn file `.html` (phiếu tương tác) hoặc `.pdf` → chọn Free/hiện ngay → **Tải đề lên**. Đề hiện ở `/de-thi` trong vòng vài giây.

### Sửa, ẩn, đổi Free, xóa
Trong danh sách ở `/quan-tri`, mỗi đề có nút **Sửa** (đổi thông tin hoặc thay file), **Ẩn/Hiện**, **Đặt Free/Bỏ Free**, **Xóa** (xóa cả file). Mọi thao tác được ghi vào nhật ký (`audit_log`).

### An toàn
- File đề nằm trong **kho riêng tư**; chỉ đề *đã công khai + Free* mới tải được. Đề trả phí: khách không tải được file (đã kiểm thử).
- Phiếu `.html` là nội dung không đáng tin → chạy trong khung cách ly, không đọc được tài khoản/cookie (đã kiểm thử bằng phiếu "xấu").
- Website **không dùng khóa bí mật** của Supabase; mọi quyền do Row Level Security trong cơ sở dữ liệu quyết định (kiểm thử: `supabase/tests/rls_de_thi.sql`).
- Ai cũng tạo được tài khoản (cần cho phụ huynh ở Giai đoạn 3), nhưng tài khoản mới **không có quyền gì** cho tới khi được cấp.

### Chạy kiểm thử trên máy làm việc có cổng mạng (proxy)
```bash
NODE_USE_ENV_PROXY=1 npm run check
```
Kiểm thử trọn luồng quản trị (`tests/e2e/admin.spec.ts`) cần tài khoản quản trị thử qua `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`; không có thì được **bỏ qua** (báo "skipped").

## Tình trạng Giai đoạn 1 — bản dùng thử (miễn phí, chưa thu tiền)

| Phần | Trạng thái |
|---|---|
| Trang chủ, menu, chân trang | Đã có |
| Tên bài Toán lớp 2, 3, 5 theo tuần + mục **Toán nâng cao theo chuyên đề** (lớp 2–5) | Đã có — **bản nháp**, sửa tại `src/data/toan-muc-luc.ts` |
| Trang môn, trang lớp, Học theo tuần (Toán lớp 4 – 35 tuần) | Đã có — **dữ liệu mẫu** |
| Trang bài giảng (video + phiếu + cột "Cùng bài học / Cùng lớp học") | Đã có |
| Nhúng phiếu bài tập HTML (khung cách ly `sandbox`) | Đã có — mới có 1 phiếu thật (Đánh giá tháng 10) |
| Video YouTube | Khung đã có — **chưa gắn video thật** |
| Trang quản trị: tải đề thi (html/pdf), sửa, ẩn, xóa | **Đã có** (Supabase) |
| Quản trị bài học theo tuần, nhập CSV | Giai đoạn 2 — tiếp theo |
| Đăng ký/đăng nhập, gói học, chuyển khoản, xác nhận | Giai đoạn 3 |
| Lưu điểm, tiến độ, báo cáo | Giai đoạn 4 |
| Tự động đối soát (SePay), Kỳ thi, Thi thử, Thảo luận | Giai đoạn 5 |

Trong bản dùng thử, **chỉ các bài có nhãn Free** xem được (tuần 1–2 và Phiếu đánh giá tháng 10).
Các bài khác hiện thông báo khóa "Bài này dành cho học sinh đã đăng ký gói học".

## Bản dùng thử trên mạng

- Địa chỉ: **https://hocgioithanhmai.vercel.app**
- Nơi đặt: Vercel, nhóm "Trung tâm Thanh Mai", **dự án riêng `hocgioithanhmai`** — tách biệt hoàn toàn với phần mềm quản lý trung tâm (khác dự án, khác mã nguồn, không dùng chung dữ liệu).
- Gói: Hobby (miễn phí). **Gói Hobby chỉ cho dùng phi thương mại** — trước khi bắt đầu thu tiền phải chuyển sang Vercel Pro (~20 USD/tháng) hoặc Cloudflare (sẽ đề xuất lại kèm chi phí).
- Tự động cập nhật: mỗi lần mã mới được đẩy lên nhánh chính trên GitHub, Vercel tự build và đưa bản mới lên.
- Bảo vệ: bản chính thức ai có link cũng xem được; các bản nháp xem trước cần đăng nhập Vercel.
- Tên miền `hocgioithanhmai.com`: đã chọn, **chưa mua**. Sẽ gắn khi chuẩn bị mở bán.

### Quay về bản trước khi có sự cố
Vào vercel.com → nhóm Trung tâm Thanh Mai → dự án hocgioithanhmai → Deployments → chọn bản cũ đang chạy tốt → nút "…" → **Promote to Production** (hoặc "Instant Rollback").

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

### Phiếu hiện có (đã đọc 2 file mẫu)
- Phiếu tự chấm trong trình duyệt, rồi gửi `bai, hoten, lop, diem, causai` về Google Sheet qua Google Apps Script (`fetch` POST). Dùng font Google và hộp `confirm()`.
- **Rủi ro riêng tư:** phiếu tải danh sách tên học sinh của lớp qua `GAS_URL?action=roster&lop=…`; ai có link phiếu đều xem được mã phiếu và gọi được đường dẫn này. Giai đoạn 4 thay bằng lưu điểm theo học sinh đăng nhập (không cần danh sách tên).
- Đáp án nằm trong mã phiếu (chấm ở trình duyệt) — học sinh rành máy tính có thể xem. Chấm ở máy chủ là phương án sau nếu cần.

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
