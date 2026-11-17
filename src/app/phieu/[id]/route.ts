import { examRange } from "@/lib/download-access-server";
import { isUuid } from "@/lib/exam-meta";
import { notFoundResponse, recordAttempt, serveStoredFile, pdfRequestAllowed } from "@/lib/serve-file";
import { createSupabaseServer } from "@/lib/supabase/server";

// File chính của đề: phiếu tương tác (.html) — hoặc PDF với đề cũ chỉ có một file.
// Quyền 2 lớp trong cơ sở dữ liệu: đọc dòng đề (chỉ đề công khai) + tải file (chỉ đề công khai và miễn phí).
// File PDF: ai cũng xem được trong khung "chỉ xem" trên trang; tải về chỉ khi tài khoản có quyền tải đề này.
export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return notFoundResponse();
  const supabase = await createSupabaseServer();
  const { data: exam } = await supabase.from("exams").select("file_path, slug").eq("id", id).maybeSingle();
  const isHtml = Boolean(exam?.file_path?.endsWith(".html"));
  if (exam?.file_path && !isHtml && !(await pdfRequestAllowed(req, supabase, () => examRange(supabase, id)))) return notFoundResponse();
  const res = await serveStoredFile(supabase, exam?.file_path, `${exam?.slug ?? "de-thi"}.pdf`);
  if (res.ok && isHtml) await recordAttempt(supabase, "de", id);
  return res;
}
