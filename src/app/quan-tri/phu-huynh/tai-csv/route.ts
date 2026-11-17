import { listParents } from "@/lib/admin-stats";
import { getAdmin } from "@/lib/supabase/server";

// Tải danh sách phụ huynh dạng CSV (mở bằng Excel). Chỉ quản trị.
export const dynamic = "force-dynamic";

/** Ô CSV an toàn: bọc ngoặc kép, chặn công thức Excel (ô bắt đầu bằng = + - @). */
function cell(v: string | number | null): string {
  let s = v === null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET() {
  const { supabase, user, isAdmin } = await getAdmin();
  if (!user || !isAdmin) return new Response("Không có quyền", { status: 403, headers: { "Cache-Control": "no-store" } });
  const { parents, error } = await listParents(supabase);
  if (error) return new Response("Chưa tải được danh sách", { status: 500, headers: { "Cache-Control": "no-store" } });
  const vn = (iso: string | null) => (iso ? new Date(iso).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour12: false }) : "");
  const lines = [
    ["STT", "Họ tên phụ huynh", "Số điện thoại", "Lớp của con", "Email", "Ngày đăng ký", "Đăng nhập gần nhất", "Được tải PDF đến"].map(cell).join(","),
    ...parents.map((p, i) => [i + 1, p.fullName, p.phone, p.grade ? `Lớp ${p.grade}` : null, p.email, vn(p.createdAt), vn(p.lastSignInAt), vn(p.taiDen)].map(cell).join(",")),
  ];
  // Thêm BOM để Excel đọc đúng tiếng Việt.
  return new Response("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="phu-huynh-dang-ky.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
