import { features } from "@/data/site";
import { isItemId } from "@/lib/exam-meta";
import { notFoundResponse, serveStoredFile, viewerIsAdmin } from "@/lib/serve-file";
import { createSupabaseServer } from "@/lib/supabase/server";

// Phiếu PDF (tải về in) của một mục trong bài học. Đang tắt tải PDF thì chỉ quản trị mở được (để kiểm tra file).
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ item: string }> }) {
  const { item } = await ctx.params;
  if (!isItemId(item)) return notFoundResponse();
  let supabase: Awaited<ReturnType<typeof createSupabaseServer>>;
  try {
    supabase = await createSupabaseServer();
  } catch {
    return notFoundResponse();
  }
  if (!features.allowPdfDownload && !(await viewerIsAdmin(supabase))) return notFoundResponse();
  const { data } = await supabase.from("lesson_files").select("pdf_path").eq("item_id", item).maybeSingle();
  return serveStoredFile(supabase, data?.pdf_path, `${item}.pdf`);
}
