import { findItemById, isCourseLocked } from "@/lib/content";
import { isItemId } from "@/lib/exam-meta";
import { imagePathsOf, LESSON_FILE_COLUMNS, type LessonFileRow } from "@/lib/lesson-files";
import { notFoundResponse, serveStoredFile, viewerIsAdmin } from "@/lib/serve-file";
import { createSupabaseServer } from "@/lib/supabase/server";

// Ảnh thứ <so> (đếm từ 1) của một mục ảnh (vd. sơ đồ tư duy nội dung tuần học).
// Quyền do Row Level Security quyết định như phiếu: khách chỉ xem ảnh của mục Free, phụ huynh đăng nhập xem mọi mục đã công khai.
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ item: string; so: string }> }) {
  const { item, so } = await ctx.params;
  if (!isItemId(item) || !/^[1-9]\d{0,2}$/.test(so)) return notFoundResponse();
  let supabase: Awaited<ReturnType<typeof createSupabaseServer>>;
  try {
    supabase = await createSupabaseServer();
  } catch {
    return notFoundResponse();
  }
  const found = findItemById(item);
  if (!found || found.item.type !== "images") return notFoundResponse();
  if (isCourseLocked(found.course) && !(await viewerIsAdmin(supabase))) return notFoundResponse();
  const { data } = await supabase.from("lesson_files").select(LESSON_FILE_COLUMNS).eq("item_id", item).maybeSingle();
  const path = imagePathsOf(data as LessonFileRow | null)[Number(so) - 1];
  return serveStoredFile(supabase, path);
}
