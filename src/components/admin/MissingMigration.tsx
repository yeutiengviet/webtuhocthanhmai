/** Báo cô cần chạy migration 0005 (thống kê) trong Supabase trước khi xem số liệu. */
export function MissingMigration() {
  return (
    <p role="alert" className="rounded-2xl bg-amber-50 p-4 font-semibold text-amber-900 ring-1 ring-amber-200">
      Chưa bật thống kê trong cơ sở dữ liệu. Cần chạy file <code>supabase/migrations/0005_thong_ke_phu_huynh_va_luot_lam.sql</code> trong
      Supabase → SQL Editor (hoặc nhắn Claude chạy giúp). Chạy xong tải lại trang này.
    </p>
  );
}
