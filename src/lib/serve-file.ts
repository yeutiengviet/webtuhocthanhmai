import "server-only";
import { decideDownload, type DateRange } from "@/lib/download-access";
import { readDownloadAccess } from "@/lib/download-access-server";
import { IMAGE_MIME, isImageExt, PDF_VIEW_HEADER } from "@/lib/exam-meta";
import { STORAGE_BUCKET } from "@/lib/supabase/env";
import type { createSupabaseServer } from "@/lib/supabase/server";

// Phục vụ file phiếu/đề từ kho riêng tư. Quyền do Row Level Security quyết định (đọc dòng + tải file);
// mọi trường hợp không có quyền đều trả 404 để không lộ file nào tồn tại.

export const notFoundResponse = () =>
  new Response("Không tìm thấy", { status: 404, headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" } });

const COMMON = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Cross-Origin-Resource-Policy": "same-origin",
};

/**
 * Phiếu chạy ở "nguồn gốc rỗng" nên trình duyệt chặn localStorage/sessionStorage — phiếu nào dùng mà không bắt lỗi sẽ dừng hẳn.
 * Đoạn này thay bằng bộ nhớ tạm trong trang (mất khi đóng phiếu), KHÔNG chạm vào dữ liệu thật của website.
 */
const STORAGE_SHIM =
  "<script>(function(){function M(){var d={};return{getItem:function(k){k=String(k);return Object.prototype.hasOwnProperty.call(d,k)?d[k]:null},setItem:function(k,v){d[String(k)]=String(v)},removeItem:function(k){delete d[String(k)]},clear:function(){d={}},key:function(i){return Object.keys(d)[i]||null},get length(){return Object.keys(d).length}}}" +
  '["localStorage","sessionStorage"].forEach(function(n){try{void window[n].length}catch(e){try{Object.defineProperty(window,n,{value:M(),configurable:true})}catch(_){}}})})();</script>';

export function injectStorageShim(html: string): string {
  for (const re of [/<head\b[^>]*>/i, /<html\b[^>]*>/i, /<!doctype[^>]*>/i]) {
    const m = re.exec(html);
    if (m) return html.slice(0, m.index + m[0].length) + STORAGE_SHIM + html.slice(m.index + m[0].length);
  }
  return STORAGE_SHIM + html;
}

export async function serveStoredFile(
  supabase: Awaited<ReturnType<typeof createSupabaseServer>>,
  path: string | null | undefined,
  pdfName = "phieu.pdf",
): Promise<Response> {
  if (!path) return notFoundResponse();
  const ext = path.split(".").pop() ?? "";
  const kind = ext === "html" || ext === "pdf" ? ext : isImageExt(ext) ? "image" : null;
  if (!kind) return notFoundResponse();
  const { data: blob, error } = await supabase.storage.from(STORAGE_BUCKET).download(path);
  if (error || !blob) return notFoundResponse();
  if (kind === "image" && isImageExt(ext)) {
    return new Response(blob, {
      headers: { ...COMMON, "Content-Type": IMAGE_MIME[ext], "Content-Security-Policy": "default-src 'none'; frame-ancestors 'self'" },
    });
  }
  if (kind === "html") {
    return new Response(injectStorageShim(await blob.text()), {
      headers: {
        ...COMMON,
        "Content-Type": "text/html; charset=utf-8",
        // Cách ly phiếu kể cả khi mở trực tiếp: không có allow-same-origin → nguồn gốc rỗng, không đọc được cookie.
        "Content-Security-Policy": "sandbox allow-scripts allow-forms allow-modals allow-popups; frame-ancestors 'self'",
      },
    });
  }
  return new Response(blob, {
    headers: {
      ...COMMON,
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${pdfName.replace(/[^a-z0-9.-]/gi, "-")}"`,
      "Content-Security-Policy": "frame-ancestors 'self'",
    },
  });
}

type Server = Awaited<ReturnType<typeof createSupabaseServer>>;

/** Người đang xem có phải quản trị không (đọc hồ sơ của chính mình qua Row Level Security). */
export async function viewerIsAdmin(supabase: Server): Promise<boolean> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return false;
  const { data: p } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  return p?.role === "admin";
}

/**
 * Được trả file PDF không.
 * - Khung "chỉ xem" trên trang (gửi header riêng, không phải mở trang/tải file): luôn được — ai cũng XEM được PDF.
 * - Bấm tải / dán thẳng đường dẫn: chỉ khi tài khoản đang có quyền tải tài liệu này (xem lib/download-access.ts);
 *   quản trị luôn được. Quyền xem file vẫn do Row Level Security quyết định.
 */
export async function pdfRequestAllowed(req: Request, supabase: Server, range: () => Promise<DateRange | null> | DateRange | null): Promise<boolean> {
  const dest = req.headers.get("sec-fetch-dest");
  if (req.headers.get(PDF_VIEW_HEADER) === "1" && (!dest || dest === "empty")) return true;
  const access = await readDownloadAccess(supabase);
  if (access.kind !== "parent") return decideDownload(access, null).ok;
  return decideDownload(access, await range()).ok;
}

/**
 * Ghi một lượt làm khi phiếu tương tác được mở thành công (bảng luot_lam, migration 0005).
 * Cơ sở dữ liệu tự bỏ qua lượt mở của quản trị và mã đề/phiếu không hợp lệ. Lỗi ghi không làm hỏng việc mở phiếu.
 */
export async function recordAttempt(supabase: Server, loai: "de" | "bai", ma: string): Promise<void> {
  try {
    await supabase.rpc("ghi_luot_lam", { p_loai: loai, p_ma: ma });
  } catch {
    // bỏ qua
  }
}
