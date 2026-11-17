-- (1) Thêm LỚP 1 cho khu Đề thi. (2) Mục TÀI LIỆU theo lớp 1–5 (chủ dự án chốt 17/11/2026):
--   * Mỗi lớp có Tài liệu Toán (một danh sách chung) và Tài liệu Tiếng Việt chia 4 nhóm:
--     Đọc hiểu · Luyện từ và câu · Chính tả · Tập làm văn / Viết.
--   * Mỗi tài liệu là một file PDF trong kho riêng tư "phieu" (thư mục documents/), có đếm lượt tải.
--   * Ai cũng XEM được PDF trên web; TẢI về theo quyền tải của tài khoản (lib/download-access.ts).
-- Chạy trong SQL Editor của Supabase. Chỉ THÊM, không đổi dữ liệu cũ.
-- Gỡ bỏ: drop function public.tang_luot_tai_tai_lieu(uuid); drop policy "tai_file_tai_lieu" on storage.objects;
--        drop table public.documents; drop function private.ghi_nhat_ky_tai_lieu();
--        alter table public.exams drop constraint exams_grade_check;
--        alter table public.exams add constraint exams_grade_check check (grade between 2 and 5);

-- ===== 1) Đề thi nhận lớp 1 =====
alter table public.exams drop constraint if exists exams_grade_check;
alter table public.exams add constraint exams_grade_check check (grade between 1 and 5);

-- ===== 2) Bảng tài liệu =====
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  subject text not null check (subject in ('toan', 'tieng-viet')),
  grade smallint not null check (grade between 1 and 5),
  category text not null check (
    (subject = 'toan' and category = 'chung')
    or (subject = 'tieng-viet' and category in ('doc-hieu', 'luyen-tu-va-cau', 'chinh-ta', 'tap-lam-van'))
  ),
  title text not null check (char_length(btrim(title)) between 3 and 200),
  pdf_path text not null unique check (pdf_path ~ '^documents/[0-9a-f-]{36}\.pdf$'),
  is_free boolean not null default true,
  published boolean not null default true,
  sort_order integer not null default 0,
  luot_tai integer not null default 0 check (luot_tai >= 0),
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.documents enable row level security;
create policy "xem_tai_lieu_cong_khai" on public.documents for select to anon, authenticated using (published = true);
create policy "quan_tri_xem_tai_lieu" on public.documents for select to authenticated using ((select private.is_admin()));
create policy "quan_tri_them_tai_lieu" on public.documents for insert to authenticated with check ((select private.is_admin()));
create policy "quan_tri_sua_tai_lieu" on public.documents for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "quan_tri_xoa_tai_lieu" on public.documents for delete to authenticated using ((select private.is_admin()));
create index documents_grade_subject_idx on public.documents (grade, subject, category, sort_order);
create trigger documents_updated_at before update on public.documents for each row execute function private.cap_nhat_updated_at();

create function private.ghi_nhat_ky_tai_lieu() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- Không ghi nhật ký khi chỉ tăng lượt tải.
  if tg_op = 'UPDATE' and (to_jsonb(new) - 'luot_tai' - 'updated_at') = (to_jsonb(old) - 'luot_tai' - 'updated_at') then
    return new;
  end if;
  insert into public.audit_log (actor, action, entity, entity_id, details)
  values (auth.uid(), lower(tg_op), 'documents', coalesce(new.id, old.id)::text,
    case when tg_op = 'DELETE' then to_jsonb(old) else jsonb_build_object('moi', to_jsonb(new), 'cu', case when tg_op = 'UPDATE' then to_jsonb(old) end) end);
  return coalesce(new, old);
end $$;
revoke execute on function private.ghi_nhat_ky_tai_lieu() from public, anon, authenticated;
create trigger documents_nhat_ky after insert or update or delete on public.documents for each row execute function private.ghi_nhat_ky_tai_lieu();

-- ===== 3) Kho file: đọc file tài liệu đã công khai và miễn phí (thêm chính sách riêng, không sửa chính sách cũ) =====
create policy "tai_file_tai_lieu" on storage.objects for select to anon, authenticated
  using (bucket_id = 'phieu' and exists (
    select 1 from public.documents d where d.pdf_path = storage.objects.name and d.published and d.is_free
  ));

-- ===== 4) Đếm lượt tải (website gọi khi phụ huynh đã đăng nhập bấm tải; bỏ qua lượt tải của quản trị) =====
create function public.tang_luot_tai_tai_lieu(p_id uuid) returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  if auth.uid() is null or private.is_admin() then
    return;
  end if;
  update public.documents set luot_tai = luot_tai + 1 where id = p_id and published;
end $$;
revoke execute on function public.tang_luot_tai_tai_lieu(uuid) from public, anon;
grant execute on function public.tang_luot_tai_tai_lieu(uuid) to authenticated;
