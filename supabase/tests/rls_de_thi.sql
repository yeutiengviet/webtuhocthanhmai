-- KIỂM THỬ PHÂN QUYỀN (Row Level Security).
-- Cả file chạy như MỘT giao dịch; câu cuối cố ý báo lỗi để HỦY toàn bộ dữ liệu thử.
-- Kết quả mong đợi: lỗi "TẤT CẢ KIỂM THỬ PHÂN QUYỀN ĐỀU ĐẠT". Nếu thấy "HỎNG: ..." là có lỗi phân quyền.
-- Mỗi khối DO đóng vai một loại người dùng; nếu sai sẽ báo lỗi "HỎNG: ...".
-- Dữ liệu thử
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'quantri-thu@example.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000b2', 'phuhuynh-thu@example.invalid', 'authenticated', 'authenticated');
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000a1';
insert into public.exams (id, subject, grade, category, slug, title, is_free, published, file_path, file_kind) values
  ('11111111-1111-1111-1111-111111111111', 'toan', 3, 'giua-ki-1', 'de-an-thu', 'Đề ẩn (thử)', true, false, 'exams/11111111-1111-1111-1111-111111111111.html', 'html'),
  ('22222222-2222-2222-2222-222222222222', 'toan', 3, 'giua-ki-1', 'de-tra-phi-thu', 'Đề trả phí (thử)', false, true, 'exams/22222222-2222-2222-2222-222222222222.html', 'html'),
  ('33333333-3333-3333-3333-333333333333', 'toan', 3, 'giua-ki-1', 'de-free-thu', 'Đề free (thử)', true, true, 'exams/33333333-3333-3333-3333-333333333333.html', 'html');
insert into storage.objects (bucket_id, name) values
  ('phieu', 'exams/11111111-1111-1111-1111-111111111111.html'),
  ('phieu', 'exams/22222222-2222-2222-2222-222222222222.html'),
  ('phieu', 'exams/33333333-3333-3333-3333-333333333333.html');

-- 1) NGƯỜI LẠ (anon)
do $$
declare n int;
begin
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  select count(*) into n from public.exams where id = '11111111-1111-1111-1111-111111111111';
  if n <> 0 then raise exception 'HỎNG: người lạ thấy đề chưa công khai'; end if;
  select count(*) into n from public.exams where id in ('22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333');
  if n <> 2 then raise exception 'HỎNG: người lạ không thấy danh sách đề đã công khai (%)', n; end if;
  select count(*) into n from storage.objects where name = 'exams/22222222-2222-2222-2222-222222222222.html';
  if n <> 0 then raise exception 'HỎNG: người lạ tải được file đề TRẢ PHÍ'; end if;
  select count(*) into n from storage.objects where name = 'exams/11111111-1111-1111-1111-111111111111.html';
  if n <> 0 then raise exception 'HỎNG: người lạ tải được file đề CHƯA CÔNG KHAI'; end if;
  select count(*) into n from storage.objects where name = 'exams/33333333-3333-3333-3333-333333333333.html';
  if n <> 1 then raise exception 'HỎNG: người lạ không tải được file đề FREE'; end if;
  select count(*) into n from public.audit_log;
  if n <> 0 then raise exception 'HỎNG: người lạ đọc được nhật ký'; end if;
  select count(*) into n from public.profiles;
  if n <> 0 then raise exception 'HỎNG: người lạ đọc được hồ sơ tài khoản'; end if;
  begin
    insert into public.exams (subject, grade, category, slug, title) values ('toan', 2, 'giua-ki-1', 'hack', 'Đề giả mạo');
    raise exception 'HỎNG: người lạ THÊM được đề';
  exception when insufficient_privilege then null;
  end;
  update public.exams set is_free = true where id = '22222222-2222-2222-2222-222222222222';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'HỎNG: người lạ SỬA được đề'; end if;
  perform set_config('role', 'postgres', true);
  raise notice 'ĐẠT: người lạ';
end $$;

-- 2) PHỤ HUYNH đã đăng nhập (không phải quản trị)
do $$
declare n int;
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}', true);
  select count(*) into n from public.exams where id = '11111111-1111-1111-1111-111111111111';
  if n <> 0 then raise exception 'HỎNG: phụ huynh thấy đề chưa công khai'; end if;
  select count(*) into n from storage.objects where name = 'exams/22222222-2222-2222-2222-222222222222.html';
  if n <> 0 then raise exception 'HỎNG: phụ huynh (chưa có gói) tải được file đề trả phí'; end if;
  select count(*) into n from public.profiles;
  if n <> 1 then raise exception 'HỎNG: phụ huynh thấy hồ sơ người khác (%)', n; end if;
  update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000b2';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'HỎNG: phụ huynh TỰ NÂNG mình thành quản trị'; end if;
  begin
    insert into public.exams (subject, grade, category, slug, title) values ('toan', 2, 'giua-ki-1', 'hack2', 'Đề giả mạo');
    raise exception 'HỎNG: phụ huynh THÊM được đề';
  exception when insufficient_privilege then null;
  end;
  delete from public.exams where id = '33333333-3333-3333-3333-333333333333';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'HỎNG: phụ huynh XÓA được đề'; end if;
  begin
    insert into storage.objects (bucket_id, name) values ('phieu', 'exams/44444444-4444-4444-4444-444444444444.html');
    raise exception 'HỎNG: phụ huynh TẢI FILE LÊN được kho';
  exception when insufficient_privilege then null;
  end;
  select count(*) into n from public.audit_log;
  if n <> 0 then raise exception 'HỎNG: phụ huynh đọc được nhật ký'; end if;
  perform set_config('role', 'postgres', true);
  raise notice 'ĐẠT: phụ huynh';
end $$;

-- 3) QUẢN TRỊ
do $$
declare n int;
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
  select count(*) into n from public.exams where id = '11111111-1111-1111-1111-111111111111';
  if n <> 1 then raise exception 'HỎNG: quản trị không thấy đề chưa công khai'; end if;
  insert into public.exams (subject, grade, category, slug, title) values ('toan', 2, 'cuoi-nam', 'de-quan-tri-them', 'Đề quản trị thêm (thử)');
  update public.exams set is_free = false where id = '33333333-3333-3333-3333-333333333333';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'HỎNG: quản trị không sửa được đề'; end if;
  select count(*) into n from storage.objects where name = 'exams/22222222-2222-2222-2222-222222222222.html';
  if n <> 1 then raise exception 'HỎNG: quản trị không thấy file đề trả phí'; end if;
  select count(*) into n from public.audit_log where actor = '00000000-0000-0000-0000-0000000000a1' and action in ('insert', 'update');
  if n < 2 then raise exception 'HỎNG: nhật ký không ghi thao tác của quản trị (%)', n; end if;
  begin
    delete from public.audit_log;
    get diagnostics n = row_count;
    if n <> 0 then raise exception 'HỎNG: quản trị XÓA được nhật ký'; end if;
  exception when insufficient_privilege then null;
  end;
  perform set_config('role', 'postgres', true);
  raise notice 'ĐẠT: quản trị';
end $$;

-- 4) Ràng buộc dữ liệu: không cho đường dẫn file lạ, link http, đề vừa có file vừa có link
do $$
begin
  begin
    insert into public.exams (subject, grade, category, slug, title, file_path, file_kind) values ('toan', 2, 'cuoi-nam', 'x1', 'Đề lỗi', '../../etc/passwd', 'html');
    raise exception 'HỎNG: chấp nhận đường dẫn file lạ';
  exception when check_violation then null; end;
  begin
    insert into public.exams (subject, grade, category, slug, title, external_url) values ('toan', 2, 'cuoi-nam', 'x2', 'Đề lỗi', 'javascript:alert(1)');
    raise exception 'HỎNG: chấp nhận link không phải https';
  exception when check_violation then null; end;
  begin
    insert into public.exams (subject, grade, category, slug, title) values ('toan', 9, 'cuoi-nam', 'x3', 'Đề lỗi');
    raise exception 'HỎNG: chấp nhận lớp 9';
  exception when check_violation then null; end;
  raise notice 'ĐẠT: ràng buộc dữ liệu';
end $$;

do $$ begin raise exception 'TẤT CẢ KIỂM THỬ PHÂN QUYỀN ĐỀU ĐẠT (dữ liệu thử đã được hủy)'; end $$;
