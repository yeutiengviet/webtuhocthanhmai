// Lớp truy vấn nội dung. Giai đoạn 1 đọc từ dữ liệu mẫu trong mã;
// Giai đoạn 2 chỉ cần thay phần thân các hàm này bằng truy vấn Supabase.
//
// "server-only": nếu file này (chứa toàn bộ dữ liệu khóa học, kể cả link video/phiếu trả phí)
// lỡ bị import vào một component chạy trên trình duyệt ("use client"), build sẽ BÁO LỖI ngay.
import "server-only";
import { SKELETON_COURSES } from "@/data/khung-khoa-hoc";
import { ON_TAP_HE } from "@/data/on-tap-he";
import { features } from "@/data/site";
import { TOAN_NANG_CAO, TOAN_THEO_TUAN } from "@/data/toan-theo-tuan";
import { lessonFileHref } from "@/lib/exam-meta";
import type { Course, Item, ItemType, Subject, SubjectSlug, Track, Week } from "@/lib/types";

export const SUBJECTS: Subject[] = [
  { slug: "toan", name: "Toán", shortDescription: "Số học, hình học, đo lường, giải toán có lời văn" },
  { slug: "tieng-viet", name: "Tiếng Việt", shortDescription: "Đọc, viết, luyện từ và câu, tập làm văn" },
];

export const GRADES = [2, 3, 4, 5] as const;

export const TRACK_LABELS: Record<Track, { name: string; description: string }> = {
  "theo-tuan": { name: "Học theo tuần", description: "Bám sát sách Kết nối tri thức, khoảng 35 tuần" },
  "on-tap-he": {
    name: "Đề ôn tập hè",
    description: features.allowPdfDownload ? "Đề làm trên web và phiếu PDF tải về in — củng cố kiến thức, chuẩn bị lên lớp" : "Đề làm trực tiếp trên web, chấm điểm ngay — củng cố kiến thức, chuẩn bị lên lớp",
  },
  "nang-cao": { name: "Nâng cao theo chuyên đề", description: "Chuyên đề nâng cao, toán tư duy" },
  "ky-thi": { name: "Kỳ thi", description: "Bài giảng chữa đề và đề thi thử" },
  "tai-lieu": { name: "Tài liệu", description: "Phiếu, đề, tài liệu tải về" },
};

export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  video: "Video",
  worksheet: "Phiếu luyện tập",
  document: "Tài liệu",
  test: "Đề kiểm tra",
};

/** Thứ tự hướng học trong một lớp. */
const TRACK_ORDER: Track[] = ["theo-tuan", "on-tap-he", "nang-cao", "ky-thi", "tai-lieu"];

// Thứ tự: môn, rồi lớp, rồi hướng học.
const COURSES: Course[] = [...TOAN_THEO_TUAN, ...SKELETON_COURSES, ...TOAN_NANG_CAO, ...ON_TAP_HE].sort(
  (a, b) => a.subject.localeCompare(b.subject) || a.grade - b.grade || TRACK_ORDER.indexOf(a.track) - TRACK_ORDER.indexOf(b.track),
);

export function getSubject(slug: string): Subject | undefined {
  return SUBJECTS.find((s) => s.slug === slug);
}

export function gradeSlug(grade: number): string {
  return `lop-${grade}`;
}

export function parseGradeSlug(slug: string): number | null {
  const m = /^lop-([2-5])$/.exec(slug);
  return m ? Number(m[1]) : null;
}

/** Các khóa học đã có tuần được công khai (chỉ những khóa này mới hiện ra). */
export function getCourses(subject: SubjectSlug, grade?: number): Course[] {
  return COURSES.filter(
    (c) => c.subject === subject && (grade === undefined || c.grade === grade) && publishedWeeks(c).length > 0,
  );
}

/** Khóa học theo môn + lớp + hướng học; khóa chưa có tuần công khai coi như không tồn tại. */
export function getCourse(subject: string, grade: number, track: Track): Course | undefined {
  return COURSES.find(
    (c) => c.subject === subject && c.grade === grade && c.track === track && publishedWeeks(c).length > 0,
  );
}

export function isTrack(value: string): value is Track {
  return Object.hasOwn(TRACK_LABELS, value);
}

/**
 * Các tuần đã công khai, như trang công khai nhìn thấy.
 * Đang tắt tải PDF (features.allowPdfDownload = false): bỏ các mục "Tài liệu" (chỉ là file PDF tải về) khỏi tuần.
 * Trang quản trị đọc course.weeks trực tiếp nên vẫn thấy và tải phiếu cho các mục này như cũ.
 */
export function publishedWeeks(course: Course, allowPdf: boolean = features.allowPdfDownload): Week[] {
  const weeks = course.weeks.filter((w) => w.published);
  return allowPdf ? weeks : weeks.map((w) => (w.items.some((i) => i.type === "document") ? { ...w, items: w.items.filter((i) => i.type !== "document") } : w));
}

/** Tên đơn vị của một khóa: "Tuần", "Chuyên đề" (mục nâng cao) hoặc "Đề" (ôn tập hè). */
export function unitName(course: Course): string {
  return course.track === "nang-cao" ? "Chuyên đề" : course.track === "on-tap-he" ? "Đề" : "Tuần";
}

export function weekSlug(w: Week): string {
  return w.slug ?? `tuan-${w.number}`;
}

/** Nhãn hiển thị của một tuần/chuyên đề: "Tuần 5", "Chuyên đề 3" hoặc "Ôn tập". */
export function weekLabel(course: Course, w: Week): string {
  return w.label ?? `${unitName(course)} ${w.number}`;
}

export function findWeek(course: Course, slug: string): Week | undefined {
  return publishedWeeks(course).find((w) => weekSlug(w) === slug);
}

export function findItem(week: Week, slug: string): Item | undefined {
  return week.items.find((i) => i.slug === slug);
}

/** Đã có nội dung thật (video đã gắn mã hoặc phiếu đã có link) hay chưa. */
export function isReady(item: Item): boolean {
  return item.type === "video" ? Boolean(item.videoRef) : Boolean(item.url);
}

/**
 * Quyền xem nội dung một mục.
 * - Khách chưa đăng nhập: chỉ mục `isFree`.
 * - Phụ huynh đã đăng nhập (tài khoản miễn phí): xem được tất cả.
 * Khi có gói học trả phí, thay điều kiện thứ hai bằng kiểm tra gói còn hạn ở phía máy chủ.
 */
export function canViewItem(item: Item, loggedIn = false): boolean {
  return loggedIn || item.isFree;
}

/** File cô tải lên cho một mục (bảng lesson_files) — chỉ cờ, không kèm đường dẫn kho. */
export interface LessonFileInfo {
  hasHtml: boolean;
  hasPdf: boolean;
  isFree: boolean;
}

/** Các loại mục được gắn file phiếu: phiếu luyện tập, đề kiểm tra (tương tác + PDF), tài liệu (chỉ PDF). */
export function itemAcceptsFiles(item: Item): { html: boolean; pdf: boolean } {
  if (item.type === "worksheet" || item.type === "test") return { html: true, pdf: true };
  if (item.type === "document") return { html: false, pdf: true };
  return { html: false, pdf: false };
}

/**
 * Quyết định trang bài học được phép đưa gì xuống trình duyệt.
 * Mục KHÔNG có quyền xem: chỉ trả { kind: "locked" } — tuyệt đối không kèm mã video hay link phiếu.
 * Mục có file cô tải lên và đặt Miễn phí thì mở được (kể cả ngoài tuần học thử).
 * Mọi trang hiển thị nội dung bài học phải đi qua hàm này.
 */
export type LessonMedia =
  | { kind: "locked" }
  | { kind: "video"; videoRef: string | null }
  | { kind: "worksheet"; url: string | null; htmlSrc?: string; pdf?: string }
  | { kind: "document"; url: string | null; pdf?: string };

export function lessonMedia(
  item: Item,
  canView: (it: Item) => boolean = canViewItem,
  file?: LessonFileInfo | null,
  allowPdf: boolean = features.allowPdfDownload,
): LessonMedia {
  const accepts = { ...itemAcceptsFiles(item) };
  if (!allowPdf) accepts.pdf = false;
  const uploaded = file && (file.hasHtml || file.hasPdf) ? file : null;
  if (!canView(item) && !uploaded?.isFree) return { kind: "locked" };
  const extra: { htmlSrc?: string; pdf?: string } = {};
  if (uploaded?.hasHtml && accepts.html) extra.htmlSrc = lessonFileHref(item.id, "html");
  if (uploaded?.hasPdf && accepts.pdf) extra.pdf = lessonFileHref(item.id, "pdf");
  switch (item.type) {
    case "video":
      return { kind: "video", videoRef: item.videoRef };
    case "document":
      return extra.pdf ? { kind: "document", url: item.url, pdf: extra.pdf } : { kind: "document", url: item.url };
    default:
      return { kind: "worksheet", url: item.url, ...extra };
  }
}

/** Tìm mục theo mã (dùng cho trang quản trị). */
export function findItemById(itemId: string): { course: Course; week: Week; item: Item } | null {
  for (const course of COURSES)
    for (const week of course.weeks)
      for (const item of week.items) if (item.id === itemId) return { course, week, item };
  return null;
}

export function getCourseById(id: string): Course | undefined {
  return COURSES.find((c) => c.id === id);
}

export function itemHref(course: Course, week: Week, item: Item): string {
  return `/${course.subject}/${gradeSlug(course.grade)}/${course.track}/${weekSlug(week)}/${item.slug}`;
}

/**
 * Khóa đang bị khóa với người xem (vẫn hiện ô ở trang lớp nhưng không bấm vào được).
 * Hiện tại: mục "Toán nâng cao theo chuyên đề" khi features.openToanNangCao = false.
 */
export function isCourseLocked(course: Pick<Course, "track">, open: boolean = features.openToanNangCao): boolean {
  return course.track === "nang-cao" && !open;
}

export function courseHref(course: Course): string {
  return `/${course.subject}/${gradeSlug(course.grade)}/${course.track}`;
}

export function allCourses(): Course[] {
  return COURSES;
}

export function freeItems(): { course: Course; week: Week; item: Item }[] {
  const out: { course: Course; week: Week; item: Item }[] = [];
  for (const course of COURSES)
    for (const week of publishedWeeks(course))
      for (const item of week.items) if (item.isFree) out.push({ course, week, item });
  return out;
}

export function courseStats(course: Course) {
  const weeks = publishedWeeks(course);
  const items = weeks.flatMap((w) => w.items);
  return {
    weeks: course.track === "on-tap-he" ? 0 : weeks.filter((w) => w.kind === "hoc").length,
    videos: items.filter((i) => i.type === "video").length,
    worksheets: items.filter((i) => i.type === "worksheet").length,
    tests: items.filter((i) => i.type === "test").length,
    readyItems: items.filter(isReady).length,
    totalItems: items.length,
  };
}

// ===== Khu "Đề thi": xem src/lib/exam-meta.ts (thông tin chung) và src/lib/exams.ts (đọc từ Supabase) =====
export { EXAM_CATEGORIES, EXAM_CATEGORY_LABELS } from "@/lib/exam-meta";
