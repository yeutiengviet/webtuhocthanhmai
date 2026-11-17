import "server-only";
import type { LessonFileInfo } from "@/lib/content";
import { createSupabasePublic } from "@/lib/supabase/public";

// Đọc file phiếu cô tải lên cho bài học theo tuần (bảng lesson_files) — cho trang công khai.
// Kết nối không kèm phiên đăng nhập; Row Level Security chỉ cho thấy dòng đã công khai.

export interface LessonFileRow {
  item_id: string;
  html_path: string | null;
  pdf_path: string | null;
  /** Ảnh của mục ảnh (sơ đồ tư duy), theo thứ tự hiển thị. Cột thêm ở migration 0006 — chưa chạy thì không có. */
  image_paths?: string[] | null;
  is_free: boolean;
  published: boolean;
  updated_at: string;
}

// Lấy "*" (không liệt kê cột) để trang vẫn chạy khi cơ sở dữ liệu chưa có cột image_paths (migration 0006).
export const LESSON_FILE_COLUMNS = "*";

export function imagePathsOf(r: Pick<LessonFileRow, "image_paths"> | null | undefined): string[] {
  return Array.isArray(r?.image_paths) ? r.image_paths.filter((p): p is string => typeof p === "string") : [];
}

export function toLessonFileInfo(r: Pick<LessonFileRow, "html_path" | "pdf_path" | "is_free" | "image_paths">): LessonFileInfo {
  return { hasHtml: Boolean(r.html_path), hasPdf: Boolean(r.pdf_path), isFree: r.is_free, imageCount: imagePathsOf(r).length };
}

/** File đã công khai của các mục. Lỗi mạng → trả bản đồ rỗng (trang vẫn hiện, coi như chưa có file). */
export async function getPublishedLessonFiles(itemIds: string[]): Promise<Map<string, LessonFileInfo>> {
  const out = new Map<string, LessonFileInfo>();
  if (itemIds.length === 0) return out;
  try {
    let q = createSupabasePublic().from("lesson_files").select(LESSON_FILE_COLUMNS).eq("published", true);
    // Ít mục: hỏi đúng các mã. Nhiều mục (cả khóa): hỏi theo tiền tố khóa ("t4-w…") để đường dẫn truy vấn không quá dài.
    if (itemIds.length <= 40) q = q.in("item_id", itemIds);
    else {
      const prefixes = [...new Set(itemIds.map((id) => /^[a-z0-9]+-w/.exec(id)?.[0]).filter((p): p is string => Boolean(p)))];
      if (prefixes.length === 0 || prefixes.length > 10) return out;
      q = q.or(prefixes.map((p) => `item_id.like.${p}*`).join(","));
    }
    const { data, error } = await q;
    if (error || !data) return out;
    const wanted = new Set(itemIds);
    for (const r of data as LessonFileRow[]) if (wanted.has(r.item_id)) out.set(r.item_id, toLessonFileInfo(r));
  } catch {
    // bỏ qua
  }
  return out;
}
