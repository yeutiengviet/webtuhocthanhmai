-- Mỗi đề / mỗi bài trong tuần có HAI file: phiếu tương tác (.html, làm và chấm ngay trên web) và phiếu PDF (tải về in).
-- Hiện tại mọi thứ miễn phí (chủ dự án quyết định 15/11/2026): mặc định is_free = true.

-- 1) Đề thi: thêm ô file PDF riêng. file_path giữ phiếu tương tác (đề cũ có thể đang là PDF).
alter table public.exams add column pdf_path text check (pdf_path ~ '^exams/[0-9a-f-]{36}\.pdf$');
alter table public.exams alter column is_free set default true;
update public.exams set is_free = true where is_free = false;

-- 2) File của các mục trong bài học theo tuần (khóa học vẫn nằm trong mã; item_id là mã mục, vd "t4-w5-luyen-tap-co-ban").
create table public.lesson_files (
  item_id text primary key check (item_id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(item_id) <= 80),
  html_path text check (html_path ~ '^lessons/[0-9a-f-]{36}\.html$'),
  pdf_path text check (pdf_path ~ '^lessons/[0-9a-f-]{36}\.pdf$'),
  is_free boolean not null default true,
  published boolean not null default true,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.lesson_files enable row level security;
create policy "xem_phieu_bai_hoc_cong_khai" on public.lesson_files for select to anon, authenticated using (published = true);
create policy "quan_tri_xem_phieu_bai_hoc" on public.lesson_files for select to authenticated using ((select private.is_admin()));
create policy "quan_tri_them_phieu_bai_hoc" on public.lesson_files for insert to authenticated with check ((select private.is_admin()));
create policy "quan_tri_sua_phieu_bai_hoc" on public.lesson_files for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "quan_tri_xoa_phieu_bai_hoc" on public.lesson_files for delete to authenticated using ((select private.is_admin()));
create trigger lesson_files_updated_at before update on public.lesson_files for each row execute function private.cap_nhat_updated_at();

create function private.ghi_nhat_ky_phieu_bai_hoc() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_log (actor, action, entity, entity_id, details)
  values (auth.uid(), lower(tg_op), 'lesson_files', coalesce(new.item_id, old.item_id),
    case when tg_op = 'DELETE' then to_jsonb(old) else jsonb_build_object('moi', to_jsonb(new), 'cu', case when tg_op = 'UPDATE' then to_jsonb(old) end) end);
  return coalesce(new, old);
end $$;
revoke execute on function private.ghi_nhat_ky_phieu_bai_hoc() from public, anon, authenticated;
create trigger lesson_files_nhat_ky after insert or update or delete on public.lesson_files for each row execute function private.ghi_nhat_ky_phieu_bai_hoc();

-- 3) Kho file: người lạ chỉ tải được file (html hoặc pdf) của đề / bài đã công khai VÀ miễn phí.
drop policy "tai_file_de_mien_phi" on storage.objects;
create policy "tai_file_mien_phi" on storage.objects for select to anon, authenticated
  using (bucket_id = 'phieu' and (
    exists (select 1 from public.exams e
            where (e.file_path = storage.objects.name or e.pdf_path = storage.objects.name) and e.published and e.is_free)
    or exists (select 1 from public.lesson_files l
               where (l.html_path = storage.objects.name or l.pdf_path = storage.objects.name) and l.published and l.is_free)
  ));
