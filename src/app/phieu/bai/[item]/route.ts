import { isItemId } from "@/lib/exam-meta";
import { notFoundResponse, serveStoredFile } from "@/lib/serve-file";
import { createSupabaseServer } from "@/lib/supabase/server";

// Phiếu tương tác (.html) của một mục trong bài học theo tuần.
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ item: string }> }) {
  const { item } = await ctx.params;
  if (!isItemId(item)) return notFoundResponse();
  const supabase = await createSupabaseServer();
  const { data } = await supabase.from("lesson_files").select("html_path").eq("item_id", item).maybeSingle();
  return serveStoredFile(supabase, data?.html_path);
}
