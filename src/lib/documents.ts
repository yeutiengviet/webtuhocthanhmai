import "server-only";
import { sortDocuments, type DocCategory, type DocumentInfo } from "@/lib/document-meta";
import { createSupabasePublic } from "@/lib/supabase/public";
import type { Grade, SubjectSlug } from "@/lib/types";

// Đọc tài liệu từ Supabase cho trang công khai: kết nối KHÔNG kèm phiên đăng nhập và LUÔN lọc published = true.

export const DOCUMENT_COLUMNS = "id, subject, grade, category, title, is_free, published, sort_order, luot_tai, created_at, pdf_path";

export interface DocumentRow {
  id: string;
  subject: SubjectSlug;
  grade: Grade;
  category: DocCategory;
  title: string;
  is_free: boolean;
  published: boolean;
  sort_order: number;
  luot_tai: number;
  created_at: string;
  pdf_path?: string | null;
}

export function toDocument(r: DocumentRow): DocumentInfo {
  return {
    id: r.id,
    subject: r.subject,
    grade: r.grade,
    category: r.category,
    title: r.title,
    isFree: r.is_free,
    published: r.published,
    sortOrder: r.sort_order,
    downloads: r.luot_tai ?? 0,
    createdAt: r.created_at,
  };
}

/** Bảng chưa có (chưa chạy migration 0008). */
export function isMissingTable(e: { code?: string; message?: string } | null): boolean {
  return Boolean(e && (e.code === "42P01" || e.code === "PGRST205" || /documents/.test(e.message ?? "") && /does not exist|could not find/i.test(e.message ?? "")));
}

/** Tài liệu công khai (theo lớp nếu có). Lỗi mạng/kho → { error: true } thay vì làm sập trang. */
export async function listPublishedDocuments(grade?: number): Promise<{ documents: DocumentInfo[]; error: boolean }> {
  try {
    const supabase = createSupabasePublic();
    let q = supabase.from("documents").select(DOCUMENT_COLUMNS).eq("published", true);
    if (grade !== undefined) q = q.eq("grade", grade);
    const { data, error } = await q;
    if (error) return { documents: [], error: !isMissingTable(error) };
    return { documents: sortDocuments((data as DocumentRow[]).map(toDocument)), error: false };
  } catch {
    return { documents: [], error: true };
  }
}

export async function findPublishedDocument(grade: number, id: string): Promise<DocumentInfo | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  try {
    const supabase = createSupabasePublic();
    const { data } = await supabase.from("documents").select(DOCUMENT_COLUMNS).eq("published", true).eq("grade", grade).eq("id", id).maybeSingle();
    return data ? toDocument(data as DocumentRow) : null;
  } catch {
    return null;
  }
}
