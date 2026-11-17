// Thông tin chung và kiểm tra dữ liệu cho mục "Tài liệu" (bảng documents, migration 0008).
// File thuần (không truy cập mạng) — dùng được ở cả trình duyệt (form tải tài liệu) và máy chủ. Có kiểm thử đơn vị.

import { isGrade } from "@/lib/exam-meta";
import type { Grade, SubjectSlug } from "@/lib/types";

/** Nhóm tài liệu: Toán một danh sách chung; Tiếng Việt chia 4 nhóm. */
export type DocCategory = "chung" | "doc-hieu" | "luyen-tu-va-cau" | "chinh-ta" | "tap-lam-van";

export const DOC_CATEGORIES: Record<SubjectSlug, { slug: DocCategory; label: string; emoji: string }[]> = {
  toan: [{ slug: "chung", label: "Tài liệu Toán", emoji: "🔢" }],
  "tieng-viet": [
    { slug: "doc-hieu", label: "Đọc hiểu", emoji: "📖" },
    { slug: "luyen-tu-va-cau", label: "Luyện từ và câu", emoji: "🧩" },
    { slug: "chinh-ta", label: "Chính tả", emoji: "✍️" },
    { slug: "tap-lam-van", label: "Tập làm văn / Viết", emoji: "📝" },
  ],
};

export function docCategoryLabel(subject: SubjectSlug, category: DocCategory): string {
  return DOC_CATEGORIES[subject].find((c) => c.slug === category)?.label ?? category;
}

export function isDocCategory(subject: SubjectSlug, v: unknown): v is DocCategory {
  return DOC_CATEGORIES[subject].some((c) => c.slug === v);
}

/** Một tài liệu (bảng documents). */
export interface DocumentInfo {
  id: string;
  subject: SubjectSlug;
  grade: Grade;
  category: DocCategory;
  title: string;
  isFree: boolean;
  published: boolean;
  sortOrder: number;
  downloads: number;
  createdAt: string;
}

export interface DocumentInput {
  subject: SubjectSlug;
  grade: Grade;
  category: DocCategory;
  title: string;
  isFree: boolean;
  published: boolean;
}

/** "Phiếu đọc hiểu tuần 3.pdf" → "Phiếu đọc hiểu tuần 3" (gợi ý tên tài liệu từ tên file). */
export function titleFromFileName(name: string): string {
  return name.replace(/\.[a-z0-9]{1,5}$/i, "").replace(/[_]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);
}

/** Kiểm tra dữ liệu form tài liệu. Trả về lỗi tiếng Việt theo từng ô. */
export function validateDocumentInput(raw: Record<string, unknown>): { ok: true; data: DocumentInput } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const subject = raw.subject;
  const okSubject = subject === "toan" || subject === "tieng-viet";
  if (!okSubject) errors.subject = "Chọn môn.";
  const grade = Number(raw.grade);
  if (!isGrade(grade)) errors.grade = "Chọn lớp 1–5.";
  // Toán không chia nhóm: luôn là "chung".
  const category = subject === "toan" ? "chung" : raw.category;
  if (okSubject && !isDocCategory(subject, category)) errors.category = "Chọn nhóm tài liệu.";
  const title = typeof raw.title === "string" ? raw.title.replace(/\s+/g, " ").trim() : "";
  if (title.length < 3) errors.title = "Tên tài liệu cần ít nhất 3 ký tự.";
  else if (title.length > 200) errors.title = "Tên tài liệu tối đa 200 ký tự.";
  const isFree = raw.isFree === true || raw.isFree === "on" || raw.isFree === "true";
  const published = raw.published === true || raw.published === "on" || raw.published === "true";
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data: { subject: subject as SubjectSlug, grade: grade as Grade, category: category as DocCategory, title, isFree, published } };
}

/** Trang tài liệu của một lớp. */
export function documentsGradeHref(grade: number): string {
  return `/tai-lieu/lop-${grade}`;
}

/** Trang xem / tải một tài liệu. */
export function documentHref(d: { grade: number; id: string }): string {
  return `/tai-lieu/lop-${d.grade}/${d.id}`;
}

/** File PDF của tài liệu (route kiểm tra quyền ở máy chủ trước khi trả file). */
export function documentFileHref(id: string): string {
  return `/phieu/tai-lieu/${id}`;
}

/** Sắp xếp: lớp, môn (Toán trước), nhóm, thứ tự cô đặt, rồi tên. */
export function sortDocuments<T extends Pick<DocumentInfo, "grade" | "subject" | "category" | "sortOrder" | "title">>(list: T[]): T[] {
  const catIndex = (d: T) => DOC_CATEGORIES[d.subject].findIndex((c) => c.slug === d.category);
  return [...list].sort(
    (a, b) =>
      a.grade - b.grade ||
      (a.subject === b.subject ? 0 : a.subject === "toan" ? -1 : 1) ||
      catIndex(a) - catIndex(b) ||
      a.sortOrder - b.sortOrder ||
      a.title.localeCompare(b.title, "vi", { numeric: true }),
  );
}
