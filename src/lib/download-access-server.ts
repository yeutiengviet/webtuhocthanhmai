import "server-only";
import { cache } from "react";
import { findItemById } from "@/lib/content";
import { decideDownload, parentAccess, type DateRange, type DownloadAccess, type DownloadDecision } from "@/lib/download-access";
import { createSupabaseServer } from "@/lib/supabase/server";

type Server = Awaited<ReturnType<typeof createSupabaseServer>>;

/** Quyền tải của người đang xem (đọc hồ sơ của chính mình qua Row Level Security). Lỗi → coi như khách. */
export async function readDownloadAccess(supabase: Server): Promise<DownloadAccess> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return { kind: "guest" };
    let { data, error } = await supabase.from("profiles").select("role, created_at, tai_den").eq("id", auth.user.id).maybeSingle();
    if (error) {
      // Chưa chạy migration 0007 (chưa có cột tai_den): tính như dùng thử 30 ngày.
      ({ data, error } = await supabase.from("profiles").select("role, created_at").eq("id", auth.user.id).maybeSingle());
    }
    if (error || !data) return parentAccess(auth.user.created_at, null);
    const row = data as { role: string; created_at: string; tai_den?: string | null };
    if (row.role === "admin") return { kind: "admin" };
    return parentAccess(row.created_at ?? auth.user.created_at, row.tai_den);
  } catch {
    return { kind: "guest" };
  }
}

/** Dùng trong trang (Server Component): gọi nhiều lần trong một lượt xem chỉ đọc cơ sở dữ liệu một lần. */
export const getDownloadAccess = cache(async (): Promise<DownloadAccess> => {
  try {
    return await readDownloadAccess(await createSupabaseServer());
  } catch {
    return { kind: "guest" };
  }
});

/** Thời gian của một mục bài học = ngày của tuần chứa mục đó. */
export function lessonItemRange(itemId: string): DateRange | null {
  const found = findItemById(itemId);
  return found ? { from: found.week.startDate, to: found.week.endDate } : null;
}

/** Thời gian áp dụng của đề (ap_dung_tu – ap_dung_den). Chưa gán ngày hoặc chưa chạy migration → null. */
export async function examRange(supabase: Server, id: string): Promise<DateRange | null> {
  try {
    const { data, error } = await supabase.from("exams").select("ap_dung_tu, ap_dung_den").eq("id", id).maybeSingle();
    if (error || !data?.ap_dung_tu || !data?.ap_dung_den) return null;
    return { from: data.ap_dung_tu as string, to: data.ap_dung_den as string };
  } catch {
    return null;
  }
}

export async function lessonDecision(itemId: string): Promise<DownloadDecision> {
  return decideDownload(await getDownloadAccess(), lessonItemRange(itemId));
}

export async function examDecision(id: string): Promise<DownloadDecision> {
  const access = await getDownloadAccess();
  if (access.kind !== "parent") return decideDownload(access, null);
  return decideDownload(access, await examRange(await createSupabaseServer(), id));
}
