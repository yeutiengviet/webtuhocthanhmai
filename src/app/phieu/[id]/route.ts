import { isUuid } from "@/lib/exam-meta";
import { notFoundResponse, serveStoredFile } from "@/lib/serve-file";
import { createSupabaseServer } from "@/lib/supabase/server";

// File chính của đề: phiếu tương tác (.html) — hoặc PDF với đề cũ chỉ có một file.
// Quyền 2 lớp trong cơ sở dữ liệu: đọc dòng đề (chỉ đề công khai) + tải file (chỉ đề công khai và miễn phí).
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return notFoundResponse();
  const supabase = await createSupabaseServer();
  const { data: exam } = await supabase.from("exams").select("file_path, slug").eq("id", id).maybeSingle();
  return serveStoredFile(supabase, exam?.file_path, `${exam?.slug ?? "de-thi"}.pdf`);
}
