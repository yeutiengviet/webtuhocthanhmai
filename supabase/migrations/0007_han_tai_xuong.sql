-- Quyền TẢI PDF theo từng tài khoản (chủ dự án chốt 17/11/2026):
--   * Mỗi tài khoản có "hạn tải" (profiles.tai_den). Đăng ký xong: hạn = ngày đăng ký + 30 ngày (dùng thử).
--   * Được tải tài liệu có thời gian nằm trong khoảng [ngày đăng ký, hạn tải], và chỉ khi chưa quá hạn.
--   * Quản trị gia hạn +1 / +3 / +6 tháng: cộng dồn vào hạn hiện tại; nếu đã hết hạn thì cộng từ hôm nay.
--   * Thu hồi: hạn = ngay bây giờ (tắt tải ngay).
--   * Đề thi có thêm "thời gian áp dụng" (ap_dung_tu – ap_dung_den) để so với khoảng tải; trống = chỉ tài khoản đã được gia hạn.
-- Xem PDF trên web và làm phiếu tương tác KHÔNG bị ảnh hưởng. Chạy trong SQL Editor của Supabase.
-- Gỡ bỏ: drop function public.quan_tri_gia_han_tai(uuid, int); drop function public.quan_tri_thu_hoi_tai(uuid);
--        alter table public.profiles drop column tai_den;
--        alter table public.exams drop column ap_dung_tu, drop column ap_dung_den;
--        rồi chạy lại hàm quan_tri_ds_phu_huynh trong 0005.

-- ===== 1) Hạn tải của tài khoản =====
alter table public.profiles add column tai_den timestamptz;
update public.profiles set tai_den = created_at + interval '30 days' where tai_den is null;
alter table public.profiles alter column tai_den set default (now() + interval '30 days');
alter table public.profiles alter column tai_den set not null;
-- Phụ huynh chỉ ĐỌC được hồ sơ của mình (chính sách "doc_ho_so_cua_minh"); không có chính sách sửa → không tự gia hạn được.

-- ===== 2) Thời gian áp dụng của đề thi =====
alter table public.exams add column ap_dung_tu date, add column ap_dung_den date;
alter table public.exams add constraint exams_ap_dung_hop_le
  check ((ap_dung_tu is null) = (ap_dung_den is null) and (ap_dung_tu is null or ap_dung_tu <= ap_dung_den));
-- Gán sẵn theo loại đề (năm học 2026–2027); cô sửa từng đề trong trang quản trị.
update public.exams set ap_dung_tu = d.tu, ap_dung_den = d.den
from (values
  ('on-tap-giua-ki-1', date '2026-10-19', date '2026-11-08'),
  ('giua-ki-1',        date '2026-10-19', date '2026-11-08'),
  ('on-tap-cuoi-ki-1', date '2026-12-07', date '2027-01-10'),
  ('cuoi-ki-1',        date '2026-12-07', date '2027-01-10'),
  ('on-tap-giua-ki-2', date '2027-03-01', date '2027-03-21'),
  ('giua-ki-2',        date '2027-03-01', date '2027-03-21'),
  ('on-tap-cuoi-nam',  date '2027-04-26', date '2027-05-21'),
  ('cuoi-nam',         date '2027-04-26', date '2027-05-21')
) as d(cat, tu, den)
where exams.category = d.cat and exams.ap_dung_tu is null;

-- ===== 3) Quản trị gia hạn / thu hồi =====
create function public.quan_tri_gia_han_tai(p_user uuid, p_thang int)
returns timestamptz
language plpgsql volatile security definer set search_path = '' as $$
declare v_moi timestamptz;
begin
  if not private.is_admin() then
    raise exception 'Không có quyền' using errcode = '42501';
  end if;
  if p_thang not in (1, 3, 6) then
    raise exception 'Chỉ gia hạn 1, 3 hoặc 6 tháng' using errcode = '22023';
  end if;
  update public.profiles
     set tai_den = greatest(tai_den, now()) + make_interval(months => p_thang)
   where id = p_user
  returning tai_den into v_moi;
  if v_moi is null then
    raise exception 'Không tìm thấy tài khoản' using errcode = 'P0002';
  end if;
  insert into public.audit_log (actor, action, entity, entity_id, details)
  values (auth.uid(), 'gia_han_tai', 'profiles', p_user::text, jsonb_build_object('thang', p_thang, 'tai_den', v_moi));
  return v_moi;
end $$;
revoke execute on function public.quan_tri_gia_han_tai(uuid, int) from public, anon;
grant execute on function public.quan_tri_gia_han_tai(uuid, int) to authenticated;

create function public.quan_tri_thu_hoi_tai(p_user uuid)
returns timestamptz
language plpgsql volatile security definer set search_path = '' as $$
declare v_moi timestamptz;
begin
  if not private.is_admin() then
    raise exception 'Không có quyền' using errcode = '42501';
  end if;
  update public.profiles set tai_den = now() where id = p_user returning tai_den into v_moi;
  if v_moi is null then
    raise exception 'Không tìm thấy tài khoản' using errcode = 'P0002';
  end if;
  insert into public.audit_log (actor, action, entity, entity_id, details)
  values (auth.uid(), 'thu_hoi_tai', 'profiles', p_user::text, jsonb_build_object('tai_den', v_moi));
  return v_moi;
end $$;
revoke execute on function public.quan_tri_thu_hoi_tai(uuid) from public, anon;
grant execute on function public.quan_tri_thu_hoi_tai(uuid) to authenticated;

-- ===== 4) Danh sách phụ huynh: thêm ngày đăng ký hồ sơ và hạn tải =====
drop function public.quan_tri_ds_phu_huynh();
create function public.quan_tri_ds_phu_huynh()
returns table (
  id uuid,
  email text,
  full_name text,
  phone text,
  grade text,
  role text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  tai_den timestamptz
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
           u.created_at, u.last_sign_in_at,
           coalesce(p.tai_den, u.created_at + interval '30 days')
    from auth.users u
    left join public.profiles p on p.id = u.id
    order by u.created_at desc;
end $$;
revoke execute on function public.quan_tri_ds_phu_huynh() from public, anon;
grant execute on function public.quan_tri_ds_phu_huynh() to authenticated;
