-- Thêm 4 nhóm "Ôn tập ..." vào khu Đề thi (ôn tập giữa kì I, cuối kì I, giữa kì II, cuối năm).
-- Chỉ nới danh sách loại đề được phép; các đề đã có giữ nguyên. Chạy trong SQL Editor của Supabase.
-- Hoàn tác (khi chưa có đề nào thuộc nhóm mới): đặt lại ràng buộc về danh sách 6 loại ban đầu.
alter table public.exams drop constraint if exists exams_category_check;
alter table public.exams add constraint exams_category_check check (category in (
  'danh-gia-thang',
  'on-tap-giua-ki-1', 'giua-ki-1',
  'on-tap-cuoi-ki-1', 'cuoi-ki-1',
  'on-tap-giua-ki-2', 'giua-ki-2',
  'on-tap-cuoi-nam', 'cuoi-nam',
  'luyen-thi'
));
