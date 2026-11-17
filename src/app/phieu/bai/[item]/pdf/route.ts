import { isItemId } from "@/lib/exam-meta";
import { lessonItemRange } from "@/lib/download-access-server";
import { notFoundResponse, serveStoredFile, pdfRequestAllowed } from "@/lib/serve-file";
import { createSupabaseServer } from "@/lib/supabase/server";

// Phiếu PDF (tải về in) của một mục trong bài học. Ai cũng xem được trong khung "chỉ xem"; tải về chỉ khi tài khoản có quyền tải tuần đó.
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
  if (!(await pdfRequestAllowed(req, supabase, () => lessonItemRange(item)))) return notFoundResponse();
  const { data } = await supabase.from("lesson_files").select("pdf_path").eq("item_id", item).maybeSingle();
  return serveStoredFile(supabase, data?.pdf_path, `${item}.pdf`);
}
