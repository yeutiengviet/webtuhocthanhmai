-- Mục ảnh trong bài học theo tuần (Tiếng Việt: "Sơ đồ tư duy nội dung tuần học"): mỗi mục nhận NHIỀU ảnh.
-- Ảnh lưu trong kho "phieu" (thư mục lessons/, tên do hệ thống đặt), danh sách đường dẫn theo thứ tự ở cột lesson_files.image_paths.
-- Quyền xem ảnh giống phiếu: mục đã công khai + Free thì ai cũng xem; nếu đã chạy 0003 thì phụ huynh đăng nhập xem mọi mục đã công khai.
-- Chỉ THÊM cột/quyền; không đổi dữ liệu cũ. Chạy trong SQL Editor của Supabase.
-- Gỡ bỏ: xem cuối file.

-- 1) Cột danh sách ảnh (tối đa 30 ảnh, mỗi đường dẫn đúng dạng lessons/<uuid>.jpg|png|webp).
create function private.anh_hop_le(p text[]) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(array_length(p, 1), 0) <= 30
     and coalesce(bool_and(x ~ '^lessons/[0-9a-f-]{36}\.(jpg|png|webp)$'), true)
  from unnest(p) as x
$$;
alter table public.lesson_files
  add column image_paths text[] not null default '{}'
  check (private.anh_hop_le(image_paths));

-- 2) Kho file nhận thêm ảnh (giới hạn 10 MB mỗi file giữ nguyên).
update storage.buckets
set allowed_mime_types = array['text/html', 'application/pdf', 'image/jpeg', 'image/png', 'image/webp']
where id = 'phieu';

-- 3) Quyền tải ảnh: thay 2 chính sách đọc file bài học để tính cả ảnh.
drop policy "tai_file_mien_phi" on storage.objects;
create policy "tai_file_mien_phi" on storage.objects for select to anon, authenticated
  using (bucket_id = 'phieu' and (
    exists (select 1 from public.exams e
            where (e.file_path = storage.objects.name or e.pdf_path = storage.objects.name) and e.published and e.is_free)
    or exists (select 1 from public.lesson_files l
               where (l.html_path = storage.objects.name or l.pdf_path = storage.objects.name or storage.objects.name = any (l.image_paths))
                 and l.published and l.is_free)
  ));

-- Chính sách của phụ huynh đăng nhập (0003): chỉ mở rộng thêm ảnh NẾU đã được chạy; chưa có thì không tự bật.
do $$
begin
  if exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'phu_huynh_tai_phieu_bai_hoc') then
    drop policy "phu_huynh_tai_phieu_bai_hoc" on storage.objects;
    create policy "phu_huynh_tai_phieu_bai_hoc" on storage.objects for select to authenticated
      using (bucket_id = 'phieu' and exists (
        select 1 from public.lesson_files l
        where (l.html_path = storage.objects.name or l.pdf_path = storage.objects.name or storage.objects.name = any (l.image_paths))
          and l.published
      ));
  end if;
end $$;

-- Gỡ bỏ (chạy ngược):
--   drop policy "phu_huynh_tai_phieu_bai_hoc" on storage.objects;
--   create policy "phu_huynh_tai_phieu_bai_hoc" ... (bản trong 0003);
--   drop policy "tai_file_mien_phi" on storage.objects;
--   create policy "tai_file_mien_phi" ... (bản trong 0002);
--   update storage.buckets set allowed_mime_types = array['text/html', 'application/pdf'] where id = 'phieu';
--   alter table public.lesson_files drop column image_paths;
--   drop function private.anh_hop_le(text[]);
