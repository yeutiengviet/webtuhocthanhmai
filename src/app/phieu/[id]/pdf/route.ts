import { isUuid } from "@/lib/exam-meta";
import { notFoundResponse, serveStoredFile } from "@/lib/serve-file";
import { createSupabaseServer } from "@/lib/supabase/server";

// Phiếu PDF (tải về in) của một đề.
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return notFoundResponse();
  const supabase = await createSupabaseServer();
  const { data: exam } = await supabase.from("exams").select("pdf_path, slug").eq("id", id).maybeSingle();
  return serveStoredFile(supabase, exam?.pdf_path, `${exam?.slug ?? "de-thi"}.pdf`);
}
