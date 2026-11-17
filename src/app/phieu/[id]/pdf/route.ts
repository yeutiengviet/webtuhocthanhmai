import { isUuid } from "@/lib/exam-meta";
import { notFoundResponse, serveStoredFile, pdfRequestAllowed } from "@/lib/serve-file";
import { createSupabaseServer } from "@/lib/supabase/server";

// Phiếu PDF (tải về in) của một đề. Đang tắt tải PDF thì chỉ khung "chỉ xem" trên trang (và quản trị) lấy được file.
export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return notFoundResponse();
  let supabase: Awaited<ReturnType<typeof createSupabaseServer>>;
  try {
    supabase = await createSupabaseServer();
  } catch {
    return notFoundResponse();
  }
  if (!(await pdfRequestAllowed(req, supabase))) return notFoundResponse();
  const { data: exam } = await supabase.from("exams").select("pdf_path, slug").eq("id", id).maybeSingle();
  return serveStoredFile(supabase, exam?.pdf_path, `${exam?.slug ?? "de-thi"}.pdf`);
}
