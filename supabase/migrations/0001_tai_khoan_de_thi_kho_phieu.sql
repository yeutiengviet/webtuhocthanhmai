-- Trạng thái cuối sau 2 lần chạy trên dự án (khoi_tao_tai_khoan_de_thi_kho_phieu + chuyen_ham_noi_bo_vao_schema_rieng).
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'parent' check (role in ('parent', 'admin')),
  full_name text check (char_length(full_name) <= 120),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "doc_ho_so_cua_minh" on public.profiles for select to authenticated using (id = (select auth.uid()));

create function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;
revoke execute on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated;

create function private.tao_ho_so_moi() returns trigger
language plpgsql security definer set search_path = '' as $$
begin insert into public.profiles (id) values (new.id); return new; end $$;
revoke execute on function private.tao_ho_so_moi() from public, anon, authenticated;
create trigger khi_tao_tai_khoan after insert on auth.users for each row execute function private.tao_ho_so_moi();

create table public.exams (
  id uuid primary key default gen_random_uuid(),
  subject text not null check (subject in ('toan', 'tieng-viet')),
  grade smallint not null check (grade between 2 and 5),
  category text not null check (category in ('danh-gia-thang', 'giua-ki-1', 'cuoi-ki-1', 'giua-ki-2', 'cuoi-nam', 'luyen-thi')),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  title text not null check (char_length(btrim(title)) between 3 and 200),
  duration_minutes smallint check (duration_minutes between 1 and 240),
  is_free boolean not null default false,
  published boolean not null default false,
  file_path text check (file_path ~ '^exams/[0-9a-f-]{36}\.(html|pdf)$'),
  file_kind text check (file_kind in ('html', 'pdf')),
  external_url text check (external_url ~ '^https://'),
  sort_order integer not null default 0,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subject, grade, slug),
  check (file_path is null or external_url is null),
  check ((file_path is null) = (file_kind is null))
);
alter table public.exams enable row level security;
create policy "xem_de_da_cong_khai" on public.exams for select to anon, authenticated using (published = true);
create policy "quan_tri_xem_tat_ca" on public.exams for select to authenticated using ((select private.is_admin()));
create policy "quan_tri_them" on public.exams for insert to authenticated with check ((select private.is_admin()));
create policy "quan_tri_sua" on public.exams for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "quan_tri_xoa" on public.exams for delete to authenticated using ((select private.is_admin()));
create index exams_subject_grade_idx on public.exams (subject, grade, sort_order);

create function private.cap_nhat_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;
revoke execute on function private.cap_nhat_updated_at() from public, anon, authenticated;
create trigger exams_updated_at before update on public.exams for each row execute function private.cap_nhat_updated_at();

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor uuid, action text not null, entity text not null, entity_id text, details jsonb,
  created_at timestamptz not null default now()
);
alter table public.audit_log enable row level security;
create policy "quan_tri_doc_nhat_ky" on public.audit_log for select to authenticated using ((select private.is_admin()));

create function private.ghi_nhat_ky_de_thi() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_log (actor, action, entity, entity_id, details)
  values (auth.uid(), lower(tg_op), 'exams', coalesce(new.id, old.id)::text,
    case when tg_op = 'DELETE' then to_jsonb(old) else jsonb_build_object('moi', to_jsonb(new), 'cu', case when tg_op = 'UPDATE' then to_jsonb(old) end) end);
  return coalesce(new, old);
end $$;
revoke execute on function private.ghi_nhat_ky_de_thi() from public, anon, authenticated;
create trigger exams_nhat_ky after insert or update or delete on public.exams for each row execute function private.ghi_nhat_ky_de_thi();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('phieu', 'phieu', false, 10485760, array['text/html', 'application/pdf']);
create policy "quan_tri_quan_ly_kho_phieu" on storage.objects for all to authenticated
  using (bucket_id = 'phieu' and (select private.is_admin()))
  with check (bucket_id = 'phieu' and (select private.is_admin()));
create policy "tai_file_de_mien_phi" on storage.objects for select to anon, authenticated
  using (bucket_id = 'phieu' and exists (select 1 from public.exams e where e.file_path = storage.objects.name and e.published and e.is_free));
