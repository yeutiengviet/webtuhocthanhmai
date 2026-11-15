# Cơ sở dữ liệu (Supabase)

- Dự án: `hocgioithanhmai` (Singapore, gói Free), mã `uczbrnnehshbdgoakhov`.
- `migrations/`: các lệnh đã chạy để tạo bảng, phân quyền, kho file — chạy lại theo thứ tự nếu cần dựng dự án mới.
- `tests/rls_de_thi.sql`: kiểm thử phân quyền. Chạy trong SQL Editor của Supabase: kết quả đúng là
  lỗi `TẤT CẢ KIỂM THỬ PHÂN QUYỀN ĐỀU ĐẠT` (câu cuối cố ý báo lỗi để hủy dữ liệu thử).
  Nếu thấy `HỎNG: ...` là có lỗi phân quyền — dừng lại và sửa.

## Cấp quyền quản trị cho một tài khoản (chỉ chủ dự án làm, trong SQL Editor)
```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'EMAIL_CUA_CO');
```
