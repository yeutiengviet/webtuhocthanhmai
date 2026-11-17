import { isUuid } from "@/lib/exam-meta";
import { examRange } from "@/lib/download-access-server";
import { notFoundResponse, serveStoredFile, pdfRequestAllowed } from "@/lib/serve-file";
import { createSupabaseServer } from "@/lib/supabase/server";

// Phiếu PDF (tải về in) của một đề. Ai cũng xem được trong khung "chỉ xem"; tải về chỉ khi tài khoản có quyền tải đề này.
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
  if (!(await pdfRequestAllowed(req, supabase, () => examRange(supabase, id)))) return notFoundResponse();
  const { data: exam } = await supabase.from("exams").select("pdf_path, slug").eq("id", id).maybeSingle();
  return serveStoredFile(supabase, exam?.pdf_path, `${exam?.slug ?? "de-thi"}.pdf`);
}
