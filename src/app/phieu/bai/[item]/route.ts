import { findItemById, isCourseLocked } from "@/lib/content";
import { isItemId } from "@/lib/exam-meta";
import { notFoundResponse, recordAttempt, serveStoredFile, viewerIsAdmin } from "@/lib/serve-file";
import { createSupabaseServer } from "@/lib/supabase/server";

// Phiếu tương tác (.html) của một mục trong bài học theo tuần / ôn tập hè / nâng cao.
// Mục thuộc khóa đang khóa (Toán nâng cao) thì chỉ quản trị mở được.
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ item: string }> }) {
  const { item } = await ctx.params;
  if (!isItemId(item)) return notFoundResponse();
  const supabase = await createSupabaseServer();
  const found = findItemById(item);
  if (found && isCourseLocked(found.course) && !(await viewerIsAdmin(supabase))) return notFoundResponse();
  const { data } = await supabase.from("lesson_files").select("html_path").eq("item_id", item).maybeSingle();
  const res = await serveStoredFile(supabase, data?.html_path);
  if (res.ok) await recordAttempt(supabase, "bai", item);
  return res;
}
