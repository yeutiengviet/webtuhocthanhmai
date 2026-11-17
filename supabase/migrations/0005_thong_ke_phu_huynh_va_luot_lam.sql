-- Thống kê cho trang quản trị:
--   1) Danh sách phụ huynh đã đăng ký (họ tên, số điện thoại, lớp của con, ngày đăng ký) — CHỈ quản trị đọc được.
--   2) Lượt làm của từng đề / phiếu: mỗi lần phiếu tương tác (.html) được mở để làm bài thì ghi một lượt.
-- Chỉ THÊM bảng và hàm mới; không đổi bảng/quyền đã có. Chạy trong SQL Editor của Supabase.
-- Gỡ bỏ: drop function public.quan_tri_ds_phu_huynh(); drop function public.quan_tri_luot_lam();
--        drop function public.ghi_luot_lam(text, text); drop table public.luot_lam;

-- ===== 1) Danh sách phụ huynh =====
-- Họ tên / SĐT / lớp nằm trong auth.users.raw_user_meta_data (lưu khi phụ huynh tạo tài khoản).
-- Hàm chạy với quyền chủ (security definer) nhưng TỰ KIỂM TRA người gọi là quản trị; không phải → báo lỗi.
create function public.quan_tri_ds_phu_huynh()
returns table (
  id uuid,
  email text,
  full_name text,
  phone text,
  grade text,
  role text,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then
    raise exception 'Không có quyền' using errcode = '42501';
  end if;
  return query
    select u.id, u.email::text,
           nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
           nullif(btrim(u.raw_user_meta_data ->> 'phone'), ''),
           nullif(btrim(u.raw_user_meta_data ->> 'grade'), ''),
           coalesce(p.role, 'parent'),
           u.created_at, u.last_sign_in_at
    from auth.users u
    left join public.profiles p on p.id = u.id
    order by u.created_at desc;
end $$;
revoke execute on function public.quan_tri_ds_phu_huynh() from public, anon;
grant execute on function public.quan_tri_ds_phu_huynh() to authenticated;

-- ===== 2) Lượt làm =====
-- loai = 'de' (đề trong khu Đề thi, ma = id đề) hoặc 'bai' (phiếu trong bài học/ôn tập hè, ma = mã mục).
create table public.luot_lam (
  id bigint generated always as identity primary key,
  loai text not null check (loai in ('de', 'bai')),
  ma text not null check (char_length(ma) between 1 and 80),
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.luot_lam enable row level security;
-- Không ai đọc/ghi trực tiếp: ghi qua hàm ghi_luot_lam, đọc tổng hợp qua quan_tri_luot_lam.
create policy "quan_tri_doc_luot_lam" on public.luot_lam for select to authenticated using ((select private.is_admin()));
create index luot_lam_loai_ma_idx on public.luot_lam (loai, ma);

-- Ghi một lượt (học sinh/khách mở phiếu tương tác): chỉ nhận đề/phiếu đang công khai và có phiếu tương tác (không cho ghi bừa mã lạ).
create function public.ghi_luot_lam(p_loai text, p_ma text)
returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  -- Cô mở phiếu để kiểm tra thì không tính lượt.
  if private.is_admin() then return; end if;
  if p_loai = 'de' then
    if p_ma !~ '^[0-9a-f-]{36}$' or not exists (
      select 1 from public.exams e where e.id = p_ma::uuid and e.published and e.file_kind = 'html'
    ) then return; end if;
  elsif p_loai = 'bai' then
    if not exists (
      select 1 from public.lesson_files l where l.item_id = p_ma and l.published and l.html_path is not null
    ) then return; end if;
  else
    return;
  end if;
  insert into public.luot_lam (loai, ma, user_id) values (p_loai, p_ma, auth.uid());
end $$;
revoke execute on function public.ghi_luot_lam(text, text) from public;
grant execute on function public.ghi_luot_lam(text, text) to anon, authenticated;

-- Tổng hợp cho quản trị: tổng lượt, số tài khoản khác nhau đã làm, lượt gần nhất.
create function public.quan_tri_luot_lam()
returns table (loai text, ma text, tong_luot bigint, so_tai_khoan bigint, lan_cuoi timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then
    raise exception 'Không có quyền' using errcode = '42501';
  end if;
  return query
    select l.loai, l.ma, count(*), count(distinct l.user_id), max(l.created_at)
    from public.luot_lam l
    group by l.loai, l.ma;
end $$;
revoke execute on function public.quan_tri_luot_lam() from public, anon;
grant execute on function public.quan_tri_luot_lam() to authenticated;
