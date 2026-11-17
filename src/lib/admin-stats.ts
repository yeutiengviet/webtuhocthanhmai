import "server-only";
import { phoneFromAccountEmail } from "@/lib/account-id";
import type { getAdmin } from "@/lib/supabase/server";

// Thống kê cho trang quản trị (migration 0005). Hàm trong cơ sở dữ liệu tự kiểm tra người gọi là quản trị.
// Chưa chạy migration → trả { missing: true } để trang hiện hướng dẫn thay vì báo lỗi khó hiểu.

type Supa = Awaited<ReturnType<typeof getAdmin>>["supabase"];

export interface ParentRow {
  id: string;
  email: string | null;
  fullName: string | null;
  phone: string | null;
  grade: number | null;
  role: string;
  createdAt: string;
  lastSignInAt: string | null;
}

const isMissingFn = (e: { code?: string; message?: string } | null) => Boolean(e && (e.code === "PGRST202" || e.code === "42883" || /could not find the function/i.test(e.message ?? "")));

/** Danh sách tài khoản phụ huynh (không gồm tài khoản quản trị), mới nhất trước. */
export async function listParents(supabase: Supa): Promise<{ parents: ParentRow[]; error: boolean; missing: boolean }> {
  const { data, error } = await supabase.rpc("quan_tri_ds_phu_huynh");
  if (error) return { parents: [], error: true, missing: isMissingFn(error) };
  type Raw = { id: string; email: string | null; full_name: string | null; phone: string | null; grade: string | null; role: string; created_at: string; last_sign_in_at: string | null };
  const parents = ((data ?? []) as Raw[])
    .filter((r) => r.role !== "admin")
    .map((r) => {
      const g = Number(r.grade);
      return {
        id: r.id,
        email: phoneFromAccountEmail(r.email) ? null : r.email,
        fullName: r.full_name,
        phone: r.phone || phoneFromAccountEmail(r.email),
        grade: [2, 3, 4, 5].includes(g) ? g : null,
        role: r.role,
        createdAt: r.created_at,
        lastSignInAt: r.last_sign_in_at,
      };
    });
  return { parents, error: false, missing: false };
}

export interface AttemptStat {
  total: number;
  accounts: number;
  last: string | null;
}

/** Lượt làm theo đề/phiếu. Khóa: "de:<id đề>" hoặc "bai:<mã mục>". */
export async function attemptStats(supabase: Supa): Promise<{ stats: Map<string, AttemptStat>; error: boolean; missing: boolean }> {
  const stats = new Map<string, AttemptStat>();
  const { data, error } = await supabase.rpc("quan_tri_luot_lam");
  if (error) return { stats, error: true, missing: isMissingFn(error) };
  for (const r of (data ?? []) as { loai: string; ma: string; tong_luot: number | string; so_tai_khoan: number | string; lan_cuoi: string | null }[]) {
    stats.set(`${r.loai}:${r.ma}`, { total: Number(r.tong_luot), accounts: Number(r.so_tai_khoan), last: r.lan_cuoi });
  }
  return { stats, error: false, missing: false };
}

/** "17/11/2026 08:05" theo giờ Việt Nam. */
export function formatVnDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
}

/** Số tài khoản đăng ký trong `days` ngày gần đây. */
export function countRecent(parents: ParentRow[], days: number, now: number = Date.now()): number {
  return parents.filter((p) => now - new Date(p.createdAt).getTime() <= days * 864e5).length;
}
