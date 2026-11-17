// Thông tin chung và kiểm tra dữ liệu cho khu "Đề thi". File thuần (không truy cập mạng) — dùng được ở
// cả trình duyệt (form tải đề) và máy chủ (kiểm tra lại trước khi ghi). Có kiểm thử đơn vị.

import type { ExamCategory, SubjectSlug } from "@/lib/types";

export const EXAM_CATEGORY_LABELS: Record<ExamCategory, string> = {
  "danh-gia-thang": "Đánh giá tháng",
  "on-tap-giua-ki-1": "Ôn tập giữa học kì I",
  "giua-ki-1": "Đề giữa học kì I",
  "on-tap-cuoi-ki-1": "Ôn tập cuối học kì I",
  "cuoi-ki-1": "Đề cuối học kì I",
  "on-tap-giua-ki-2": "Ôn tập giữa học kì II",
  "giua-ki-2": "Đề giữa học kì II",
  "on-tap-cuoi-nam": "Ôn tập cuối năm",
  "cuoi-nam": "Đề cuối năm",
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

/** Ảnh tải lên cho mục ảnh (vd. sơ đồ tư duy): lưu theo đuôi chuẩn. */
export type ImageExt = "jpg" | "png" | "webp";
export const IMAGE_EXTS: readonly ImageExt[] = ["jpg", "png", "webp"];
export const IMAGE_MIME: Record<ImageExt, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };
/** Tối đa số ảnh trong một mục. */
export const MAX_IMAGES = 30;
export type StoredKind = FileKind | ImageExt;

export function isImageExt(v: unknown): v is ImageExt {
  return typeof v === "string" && (IMAGE_EXTS as readonly string[]).includes(v);
}

/** Loại ảnh theo NỘI DUNG file (byte đầu), không tin đuôi tên file. Không phải JPG/PNG/WEBP → null. */
export function imageExtFromBytes(bytes: Uint8Array): ImageExt | null {
  const b = (i: number) => bytes[i];
  if (bytes.length >= 3 && b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff) return "jpg";
  if (bytes.length >= 8 && b(0) === 0x89 && b(1) === 0x50 && b(2) === 0x4e && b(3) === 0x47 && b(4) === 0x0d && b(5) === 0x0a && b(6) === 0x1a && b(7) === 0x0a) return "png";
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "webp";
  return null;
}

/** Đường dẫn ảnh thứ i (đếm từ 0) của một mục — route /phieu/bai/<mục>/anh/<số> kiểm tra quyền trước khi trả ảnh. */
export function lessonImageHref(itemId: string, index: number): string {
  return `/phieu/bai/${itemId}/anh/${index + 1}`;
}

/** Đường dẫn ảnh trong kho có hợp lệ không (lessons/<uuid>.jpg|png|webp). */
export function isLessonImagePath(v: unknown): v is string {
  return typeof v === "string" && /^lessons\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(v);
}

/** Đường dẫn file trong kho — luôn do hệ thống đặt (mã ngẫu nhiên), không dùng tên file của người tải lên. */
export function storagePath(fileId: string, kind: StoredKind, folder: StorageFolder = "exams"): string {
  if (!isUuid(fileId)) throw new Error("Mã file không hợp lệ");
  if (folder !== "exams" && folder !== "lessons") throw new Error("Thư mục không hợp lệ");
  if (kind !== "html" && kind !== "pdf" && !isImageExt(kind)) throw new Error("Loại file không hợp lệ");
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

/** Header khung xem PDF gửi kèm. Đang tắt tải PDF: máy chủ chỉ trả file PDF cho yêu cầu có header này (bấm/mở thẳng đường dẫn thì không). */
export const PDF_VIEW_HEADER = "x-xem-pdf";

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
export function examMedia(
  e: { id: string; isFree: boolean; externalUrl: string | null; hasFile: boolean; fileKind: FileKind | null; hasPdf: boolean },
): ExamMedia {
  if (!e.isFree) return { kind: "locked" };
  // Đang tắt tải PDF (features.allowPdfDownload = false): PDF vẫn đưa ra để XEM; nút tải hiện xám, máy chủ chỉ trả file cho khung xem.
  // PDF tải về: ô PDF riêng; đề cũ chỉ có 1 file PDF thì dùng luôn file đó.
  const pdf = e.hasPdf ? examFileHref(e.id, "pdf") : e.hasFile && e.fileKind === "pdf" ? examFileHref(e.id) : null;
  let main: MainMedia = null;
  if (e.hasFile && e.fileKind === "html") main = { type: "html", src: examFileHref(e.id) };
  else if (e.externalUrl) main = { type: "external", url: e.externalUrl };
  else if (pdf) main = { type: "pdf", src: pdf };
  return { kind: "open", main, pdf };
}
