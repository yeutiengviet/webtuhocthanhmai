import { isItemId } from "@/lib/exam-meta";
import { notFoundResponse, serveStoredFile, pdfRequestAllowed } from "@/lib/serve-file";
import { createSupabaseServer } from "@/lib/supabase/server";

// Phiếu PDF (tải về in) của một mục trong bài học. Đang tắt tải PDF thì chỉ khung "chỉ xem" trên trang (và quản trị) lấy được file.
export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ item: string }> }) {
  const { item } = await ctx.params;
  if (!isItemId(item)) return notFoundResponse();
  let supabase: Awaited<ReturnType<typeof createSupabaseServer>>;
  try {
    supabase = await createSupabaseServer();
  } catch {
    return notFoundResponse();
  }
  if (!(await pdfRequestAllowed(req, supabase))) return notFoundResponse();
  const { data } = await supabase.from("lesson_files").select("pdf_path").eq("item_id", item).maybeSingle();
  return serveStoredFile(supabase, data?.pdf_path, `${item}.pdf`);
}
