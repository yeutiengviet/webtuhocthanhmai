import { features } from "@/data/site";
import { isUuid } from "@/lib/exam-meta";
import { notFoundResponse, recordAttempt, serveStoredFile, viewerIsAdmin } from "@/lib/serve-file";
import { createSupabaseServer } from "@/lib/supabase/server";

// File chính của đề: phiếu tương tác (.html) — hoặc PDF với đề cũ chỉ có một file.
// Quyền 2 lớp trong cơ sở dữ liệu: đọc dòng đề (chỉ đề công khai) + tải file (chỉ đề công khai và miễn phí).
// Đang tắt tải PDF (features.allowPdfDownload = false): file PDF chỉ quản trị mở được.
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return notFoundResponse();
  const supabase = await createSupabaseServer();
  const { data: exam } = await supabase.from("exams").select("file_path, slug").eq("id", id).maybeSingle();
  const isHtml = Boolean(exam?.file_path?.endsWith(".html"));
  if (exam?.file_path && !isHtml && !features.allowPdfDownload && !(await viewerIsAdmin(supabase))) return notFoundResponse();
  const res = await serveStoredFile(supabase, exam?.file_path, `${exam?.slug ?? "de-thi"}.pdf`);
  if (res.ok && isHtml) await recordAttempt(supabase, "de", id);
  return res;
}
