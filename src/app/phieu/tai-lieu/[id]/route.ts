import { ALWAYS_RANGE } from "@/lib/download-access";
import { isUuid, PDF_VIEW_HEADER, slugify } from "@/lib/exam-meta";
import { notFoundResponse, pdfRequestAllowed, serveStoredFile } from "@/lib/serve-file";
import { createSupabaseServer } from "@/lib/supabase/server";

// File PDF của một tài liệu (mục "Tài liệu"). Ai cũng xem được trong khung "chỉ xem" trên trang;
// tải về chỉ khi tài khoản còn hạn tải. Mỗi lượt tải thành công của phụ huynh được đếm (bỏ qua quản trị).
// Quyền đọc dòng + file do Row Level Security quyết định (chỉ tài liệu công khai và miễn phí).
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
  if (!(await pdfRequestAllowed(req, supabase, () => ALWAYS_RANGE))) return notFoundResponse();
  const { data: doc } = await supabase.from("documents").select("pdf_path, title").eq("id", id).maybeSingle();
  const res = await serveStoredFile(supabase, doc?.pdf_path, `${doc?.title ? slugify(doc.title) : "tai-lieu"}.pdf`);
  if (res.ok && req.headers.get(PDF_VIEW_HEADER) !== "1") {
    try {
      await supabase.rpc("tang_luot_tai_tai_lieu", { p_id: id });
    } catch {
      // bỏ qua: lỗi đếm không làm hỏng việc tải
    }
  }
  return res;
}
