import { features } from "@/data/site";
import { isUuid } from "@/lib/exam-meta";
import { notFoundResponse, serveStoredFile, viewerIsAdmin } from "@/lib/serve-file";
import { createSupabaseServer } from "@/lib/supabase/server";

// Phiếu PDF (tải về in) của một đề. Đang tắt tải PDF thì chỉ quản trị mở được (để kiểm tra file).
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return notFoundResponse();
  let supabase: Awaited<ReturnType<typeof createSupabaseServer>>;
  try {
    supabase = await createSupabaseServer();
  } catch {
    return notFoundResponse();
  }
  if (!features.allowPdfDownload && !(await viewerIsAdmin(supabase))) return notFoundResponse();
  const { data: exam } = await supabase.from("exams").select("pdf_path, slug").eq("id", id).maybeSingle();
  return serveStoredFile(supabase, exam?.pdf_path, `${exam?.slug ?? "de-thi"}.pdf`);
}
