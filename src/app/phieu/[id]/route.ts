import { isUuid } from "@/lib/exam-meta";
import { STORAGE_BUCKET } from "@/lib/supabase/env";
import { createSupabaseServer } from "@/lib/supabase/server";

// Phục vụ file đề tải lên (kho riêng tư). Quyền được kiểm tra 2 lớp trong cơ sở dữ liệu (Row Level Security):
//  1) đọc dòng đề: người xem chỉ thấy đề đã công khai (quản trị thấy tất cả);
//  2) tải file: người xem chỉ tải được file của đề công khai + miễn phí (Giai đoạn 3 thêm: gói học còn hạn).
// Trả 404 cho mọi trường hợp không có quyền để không lộ đề nào tồn tại.

export const dynamic = "force-dynamic";

const NOT_FOUND = () => new Response("Không tìm thấy", { status: 404, headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" } });

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return NOT_FOUND();
  const supabase = await createSupabaseServer();
  const { data: exam } = await supabase.from("exams").select("file_path, file_kind").eq("id", id).maybeSingle();
  if (!exam?.file_path || !exam.file_kind) return NOT_FOUND();
  const { data: blob, error } = await supabase.storage.from(STORAGE_BUCKET).download(exam.file_path);
  if (error || !blob) return NOT_FOUND();

  const common = {
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Cross-Origin-Resource-Policy": "same-origin",
  };
  if (exam.file_kind === "html") {
    return new Response(blob, {
      headers: {
        ...common,
        "Content-Type": "text/html; charset=utf-8",
        // Cách ly phiếu kể cả khi mở trực tiếp: không có allow-same-origin → nguồn gốc rỗng, không đọc được cookie.
        "Content-Security-Policy": "sandbox allow-scripts allow-forms allow-modals allow-popups; frame-ancestors 'self'",
      },
    });
  }
  return new Response(blob, {
    headers: {
      ...common,
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="de-thi.pdf"',
      "Content-Security-Policy": "frame-ancestors 'self'",
    },
  });
}
