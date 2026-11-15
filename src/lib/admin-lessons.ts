import "server-only";
import type { Course } from "@/lib/types";
import { LESSON_FILE_COLUMNS, type LessonFileRow } from "@/lib/lesson-files";
import type { getAdmin } from "@/lib/supabase/server";

/** Toàn bộ dòng lesson_files (kể cả đang ẩn) — chỉ dùng ở trang quản trị, kết nối mang phiên quản trị. */
export async function adminLessonFiles(supabase: Awaited<ReturnType<typeof getAdmin>>["supabase"], course?: Course): Promise<{ rows: Map<string, LessonFileRow>; error: boolean }> {
  let q = supabase.from("lesson_files").select(LESSON_FILE_COLUMNS).limit(5000);
  const prefix = course?.weeks[0]?.items[0]?.id.match(/^[a-z0-9]+-w/)?.[0];
  if (prefix) q = q.like("item_id", `${prefix}%`);
  const { data, error } = await q;
  const rows = new Map<string, LessonFileRow>();
  for (const r of (data ?? []) as LessonFileRow[]) rows.set(r.item_id, r);
  return { rows, error: Boolean(error) };
}
