// Lớp truy vấn nội dung. Giai đoạn 1 đọc từ dữ liệu mẫu trong mã;
// Giai đoạn 2 chỉ cần thay phần thân các hàm này bằng truy vấn Supabase.

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

const COURSES: Course[] = [toanLop4TheoTuan];

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

export function getCourse(subject: string, grade: number, track: Track): Course | undefined {
  return COURSES.find((c) => c.subject === subject && c.grade === grade && c.track === track);
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

/** Trích mã video YouTube từ link hoặc mã trần; trả null nếu không hợp lệ. */
export function youtubeId(ref: string | null): string | null {
  if (!ref) return null;
  const trimmed = ref.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const u = new URL(trimmed);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = u.pathname.slice(1);
    else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      id = u.searchParams.get("v") ?? u.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1] ?? null;
    }
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

/** Chỉ cho phép nhúng phiếu từ địa chỉ https (chống javascript:, data: …). */
export function safeWorksheetUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}
