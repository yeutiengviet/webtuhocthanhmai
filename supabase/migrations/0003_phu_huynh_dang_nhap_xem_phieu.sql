-- Phụ huynh có tài khoản (miễn phí) xem được mọi phiếu bài học đã công khai, kể cả phiếu cô bỏ nhãn Free.
-- Khách chưa đăng nhập vẫn chỉ tải được phiếu đã công khai + Free (chính sách "tai_file_mien_phi" giữ nguyên).
-- Chỉ THÊM quyền đọc; không đổi quyền ghi. Gỡ bỏ: drop policy "phu_huynh_tai_phieu_bai_hoc" on storage.objects;
create policy "phu_huynh_tai_phieu_bai_hoc" on storage.objects for select to authenticated
  using (bucket_id = 'phieu' and exists (
    select 1 from public.lesson_files l
    where (l.html_path = storage.objects.name or l.pdf_path = storage.objects.name) and l.published
  ));
