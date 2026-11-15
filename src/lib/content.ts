// Lớp truy vấn nội dung. Giai đoạn 1 đọc từ dữ liệu mẫu trong mã;
// Giai đoạn 2 chỉ cần thay phần thân các hàm này bằng truy vấn Supabase.
//
// "server-only": nếu file này (chứa toàn bộ dữ liệu khóa học, kể cả link video/phiếu trả phí)
// lỡ bị import vào một component chạy trên trình duyệt ("use client"), build sẽ BÁO LỖI ngay.
import "server-only";
import { SKELETON_COURSES } from "@/data/khung-khoa-hoc";
import { toanLop4TheoTuan } from "@/data/toan-lop4";
import type { Course, Item, ItemType, Subject, SubjectSlug, Track, Week } from "@/lib/types";

export const SUBJECTS: Subject[] = [
  { slug: "toan", name: "Toán", shortDescription: "Số học, hình học, đo lường, giải toán có lời văn" },
  { slug: "tieng-viet", name: "Tiếng Việt", shortDescription: "Đọc, viết, luyện từ và câu, tập làm văn" },
];

export const GRADES = [2, 3, 4, 5] as const;

export const TRACK_LABELS: Record<Track, { name: string; description: string }> = {
  "theo-tuan": { name: "Học theo tuần", description: "Bám sát sách Kết nối tri thức, khoảng 35 tuần" },
  "on-tap-he": { name: "Ôn tập hè", description: "Củng cố kiến thức, chuẩn bị lên lớp" },
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

// Thứ tự: môn, rồi lớp.
const COURSES: Course[] = [toanLop4TheoTuan, ...SKELETON_COURSES].sort(
  (a, b) => a.subject.localeCompare(b.subject) || a.grade - b.grade,
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

export function publishedWeeks(course: Course): Week[] {
  return course.weeks.filter((w) => w.published);
}

export function weekSlug(w: Week): string {
  return `tuan-${w.number}`;
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
 * GIAI ĐOẠN 1: chưa có đăng nhập, nên chỉ mục `isFree` xem được.
 * Giai đoạn 3 sẽ kiểm tra gói còn hạn ở phía máy chủ/cơ sở dữ liệu.
 */
export function canViewItem(item: Item): boolean {
  return item.isFree;
}

/**
 * Quyết định trang bài học được phép đưa gì xuống trình duyệt.
 * Mục KHÔNG có quyền xem: chỉ trả { kind: "locked" } — tuyệt đối không kèm mã video hay link phiếu.
 * Mọi trang hiển thị nội dung bài học phải đi qua hàm này.
 */
export type LessonMedia =
  | { kind: "locked" }
  | { kind: "video"; videoRef: string | null }
  | { kind: "worksheet"; url: string | null }
  | { kind: "document"; url: string | null };

export function lessonMedia(item: Item, canView: (it: Item) => boolean = canViewItem): LessonMedia {
  if (!canView(item)) return { kind: "locked" };
  switch (item.type) {
    case "video":
      return { kind: "video", videoRef: item.videoRef };
    case "document":
      return { kind: "document", url: item.url };
    default:
      return { kind: "worksheet", url: item.url };
  }
}

export function itemHref(course: Course, week: Week, item: Item): string {
  return `/${course.subject}/${gradeSlug(course.grade)}/${course.track}/${weekSlug(week)}/${item.slug}`;
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
    weeks: weeks.length,
    videos: items.filter((i) => i.type === "video").length,
    worksheets: items.filter((i) => i.type === "worksheet").length,
    tests: items.filter((i) => i.type === "test").length,
    readyItems: items.filter(isReady).length,
    totalItems: items.length,
  };
}
