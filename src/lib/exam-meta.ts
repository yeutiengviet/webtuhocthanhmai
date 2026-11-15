// Thông tin chung và kiểm tra dữ liệu cho khu "Đề thi". File thuần (không truy cập mạng) — dùng được ở
// cả trình duyệt (form tải đề) và máy chủ (kiểm tra lại trước khi ghi). Có kiểm thử đơn vị.

import type { ExamCategory, SubjectSlug } from "@/lib/types";

export const EXAM_CATEGORY_LABELS: Record<ExamCategory, string> = {
  "danh-gia-thang": "Đánh giá tháng",
  "giua-ki-1": "Giữa học kì I",
  "cuoi-ki-1": "Cuối học kì I",
  "giua-ki-2": "Giữa học kì II",
  "cuoi-nam": "Cuối năm",
  "luyen-thi": "Luyện thi",
};
export const EXAM_CATEGORIES = Object.keys(EXAM_CATEGORY_LABELS) as ExamCategory[];

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // khớp giới hạn của kho "phieu" trong Supabase
export type FileKind = "html" | "pdf";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID.test(v);
}

export type StorageFolder = "exams" | "lessons";

/** Đường dẫn file trong kho — luôn do hệ thống đặt (mã ngẫu nhiên), không dùng tên file của người tải lên. */
export function storagePath(fileId: string, kind: FileKind, folder: StorageFolder = "exams"): string {
  if (!isUuid(fileId)) throw new Error("Mã file không hợp lệ");
  if (folder !== "exams" && folder !== "lessons") throw new Error("Thư mục không hợp lệ");
  return `${folder}/${fileId}.${kind}`;
}

/** Mã mục bài học theo tuần, vd "t4-w5-luyen-tap-co-ban". */
export function isItemId(v: unknown): v is string {
  return typeof v === "string" && v.length <= 80 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v);
}

/** "Đề 1: Bài ca về Trái Đất – Giữa kì 1" → "de-1-bai-ca-ve-trai-dat-giua-ki-1" */
export function slugify(title: string): string {
  const s = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100)
    .replace(/-+$/g, "");
  return s || "de-thi";
}

/** Loại file theo tên (chỉ để gợi ý ở trình duyệt; máy chủ kiểm tra lại bằng nội dung file). */
export function kindFromFileName(name: string): FileKind | null {
  const ext = name.toLowerCase().split(".").pop();
  if (ext === "html" || ext === "htm") return "html";
  if (ext === "pdf") return "pdf";
  return null;
}

/**
 * Kiểm tra NỘI DUNG file đúng loại (không tin phần đuôi tên file):
 * - PDF phải bắt đầu bằng "%PDF-".
 * - HTML phải là văn bản (không có byte 0), có thẻ HTML, và không phải PDF đổi đuôi.
 */
export function checkFileContent(bytes: Uint8Array, kind: FileKind): string | null {
  if (bytes.length === 0) return "File rỗng.";
  if (bytes.length > MAX_FILE_BYTES) return "File quá lớn (tối đa 10 MB).";
  const head = new TextDecoder("utf-8", { fatal: false }).decode(bytes.slice(0, 4096));
  if (kind === "pdf") {
    return head.startsWith("%PDF-") ? null : "File không phải PDF thật.";
  }
  if (head.startsWith("%PDF-")) return "File là PDF nhưng đặt đuôi .html.";
  if (bytes.slice(0, 4096).includes(0)) return "File HTML có dữ liệu nhị phân — không hợp lệ.";
  if (!/<(!doctype html|html|head|body|div|script|p|h1|form)\b/i.test(head)) return "File không giống trang HTML.";
  return null;
}

export interface ExamInput {
  subject: SubjectSlug;
  grade: 2 | 3 | 4 | 5;
  category: ExamCategory;
  title: string;
  durationMinutes: number | null;
  isFree: boolean;
  published: boolean;
}

/** Kiểm tra dữ liệu form đề thi. Trả về lỗi tiếng Việt theo từng ô. */
export function validateExamInput(raw: Record<string, unknown>): { ok: true; data: ExamInput } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const subject = raw.subject;
  if (subject !== "toan" && subject !== "tieng-viet") errors.subject = "Chọn môn.";
  const grade = Number(raw.grade);
  if (![2, 3, 4, 5].includes(grade)) errors.grade = "Chọn lớp 2–5.";
  const category = raw.category as ExamCategory;
  if (!EXAM_CATEGORIES.includes(category)) errors.category = "Chọn loại đề.";
  const title = typeof raw.title === "string" ? raw.title.replace(/\s+/g, " ").trim() : "";
  if (title.length < 3) errors.title = "Tên đề cần ít nhất 3 ký tự.";
  else if (title.length > 200) errors.title = "Tên đề tối đa 200 ký tự.";
  let durationMinutes: number | null = null;
  if (raw.durationMinutes !== undefined && raw.durationMinutes !== null && String(raw.durationMinutes).trim() !== "") {
    const d = Number(raw.durationMinutes);
    if (!Number.isInteger(d) || d < 1 || d > 240) errors.durationMinutes = "Thời gian từ 1 đến 240 phút (hoặc để trống).";
    else durationMinutes = d;
  }
  const isFree = raw.isFree === true || raw.isFree === "on" || raw.isFree === "true";
  const published = raw.published === true || raw.published === "on" || raw.published === "true";
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data: { subject: subject as SubjectSlug, grade: grade as 2 | 3 | 4 | 5, category, title, durationMinutes, isFree, published } };
}

export function examHref(e: { subject: SubjectSlug; grade: number; slug: string }): string {
  return `/de-thi/${e.subject}/lop-${e.grade}/${e.slug}`;
}

/** Đường dẫn phục vụ file đề tải lên (route /phieu/... — kiểm tra quyền ở máy chủ trước khi trả file). */
export function examFileHref(id: string, which: "main" | "pdf" = "main"): string {
  return which === "pdf" ? `/phieu/${id}/pdf` : `/phieu/${id}`;
}

/** File phiếu của một mục trong bài học theo tuần. */
export function lessonFileHref(itemId: string, which: "html" | "pdf"): string {
  return which === "pdf" ? `/phieu/bai/${itemId}/pdf` : `/phieu/bai/${itemId}`;
}

/** Đường dẫn file mà khung phiếu / nút PDF được phép dùng (chỉ file của chính website). */
export function isOwnFileHref(src: string): boolean {
  return /^\/phieu\/(?:[0-9a-f-]{36}(?:\/pdf)?|bai\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\/pdf)?)$/.test(src);
}

/** Phần làm bài chính: phiếu tương tác (link ngoài hoặc file .html), hoặc chỉ có PDF thì xem PDF. */
export type MainMedia = { type: "external"; url: string } | { type: "html"; src: string } | { type: "pdf"; src: string } | null;

export type ExamMedia = { kind: "locked" } | { kind: "open"; main: MainMedia; pdf: string | null };

/**
 * Trang làm đề được đưa gì ra trình duyệt. Đề trả phí: chỉ { kind: "locked" } (Giai đoạn 3 sẽ thêm kiểm tra gói).
 * Kể cả khi trang lỡ đưa đường dẫn /phieu/..., máy chủ và kho file vẫn chặn đề trả phí (Row Level Security).
 */
export function examMedia(e: { id: string; isFree: boolean; externalUrl: string | null; hasFile: boolean; fileKind: FileKind | null; hasPdf: boolean }): ExamMedia {
  if (!e.isFree) return { kind: "locked" };
  // PDF tải về: ô PDF riêng; đề cũ chỉ có 1 file PDF thì dùng luôn file đó.
  const pdf = e.hasPdf ? examFileHref(e.id, "pdf") : e.hasFile && e.fileKind === "pdf" ? examFileHref(e.id) : null;
  let main: MainMedia = null;
  if (e.hasFile && e.fileKind === "html") main = { type: "html", src: examFileHref(e.id) };
  else if (e.externalUrl) main = { type: "external", url: e.externalUrl };
  else if (pdf) main = { type: "pdf", src: pdf };
  return { kind: "open", main, pdf };
}
