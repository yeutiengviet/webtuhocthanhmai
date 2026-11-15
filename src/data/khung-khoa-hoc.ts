// KHUNG KHÓA HỌC TRỐNG — Toán và Tiếng Việt các lớp chưa có mục lục chi tiết.
// Mỗi khóa có đủ 35 tuần và các ô nội dung (video, phiếu, đề, tài liệu) để chủ dự án điền dần.
// CỐ Ý không điền tên bài theo trí nhớ (dễ sai): tên bài sẽ được cập nhật từ mục lục của chủ dự án
// (nhập file CSV / trang quản trị ở Giai đoạn 2).

import "server-only";
import { HOLIDAY_MONDAYS, SCHOOL_YEAR_START } from "@/data/toan-lop4";
import { buildWeekCalendar } from "@/lib/dates";
import type { Course, Item, SubjectSlug, Week, WeekKind } from "@/lib/types";

const TOTAL_WEEKS = 35;
/** Tuần ôn tập (dự kiến): giữa kì I, cuối kì I, giữa kì II, cuối năm. */
const REVIEW_WEEKS: Record<number, { kind: WeekKind; label: string }> = {
  9: { kind: "on-tap-giua-ky", label: "giữa học kì I" },
  18: { kind: "on-tap-cuoi-ky", label: "cuối học kì I" },
  27: { kind: "on-tap-giua-ky", label: "giữa học kì II" },
  35: { kind: "on-tap-cuoi-ky", label: "cuối năm" },
};
const FREE_WEEKS = new Set([1, 2]);

const CODE: Record<SubjectSlug, string> = { toan: "t", "tieng-viet": "tv" };

/** Các ô video trong một tuần học, theo đặc thù môn. */
const VIDEO_SLOTS: Record<SubjectSlug, { slug: string; title: string }[]> = {
  toan: [
    { slug: "video-bai-giang-1", title: "Video bài giảng 1" },
    { slug: "video-bai-giang-2", title: "Video bài giảng 2" },
  ],
  "tieng-viet": [
    { slug: "video-doc", title: "Video: Đọc" },
    { slug: "video-luyen-tu-va-cau", title: "Video: Luyện từ và câu" },
    { slug: "video-viet", title: "Video: Viết" },
  ],
};

function buildItems(subject: SubjectSlug, grade: number, n: number): Item[] {
  const id = (slug: string) => `${CODE[subject]}${grade}-w${n}-${slug}`;
  const free = FREE_WEEKS.has(n);
  const items: Item[] = [];
  const push = (it: Omit<Item, "order" | "videoProvider" | "videoRef" | "url" | "id"> & Partial<Item>) =>
    items.push({ videoProvider: null, videoRef: null, url: null, id: id(it.slug), ...it, order: items.length + 1 });

  const review = REVIEW_WEEKS[n];
  if (review) {
    push({ slug: "de-cuong", type: "document", title: `Đề cương ôn tập ${review.label}`, level: null, isFree: free });
    push({ slug: "video-on-tap", type: "video", title: `Video ôn tập ${review.label}`, level: "co-ban", isFree: free, videoProvider: "youtube" });
    for (let k = 1; k <= 3; k++) {
      push({ slug: `de-on-tap-${k}`, type: "test", title: `Đề ôn tập ${review.label} – Đề ${k}`, level: k === 3 ? "nang-cao" : "co-ban", isFree: free, durationMinutes: 40 });
    }
    push({ slug: "video-chua-de", type: "video", title: `Video chữa đề ${review.label}`, level: "nang-cao", isFree: free, videoProvider: "youtube" });
    return items;
  }

  for (const v of VIDEO_SLOTS[subject]) {
    push({ slug: v.slug, type: "video", title: v.title, level: "co-ban", isFree: free, videoProvider: "youtube" });
  }
  push({ slug: "luyen-tap-co-ban", type: "worksheet", title: "Bài tập luyện tập cơ bản", level: "co-ban", isFree: free });
  push({ slug: "luyen-tap-nang-cao", type: "worksheet", title: "Bài tập luyện tập nâng cao", level: "nang-cao", isFree: free });
  if (n % 2 === 0) {
    push({ slug: "kiem-tra-15-phut", type: "test", title: "Đề kiểm tra 15 phút", level: "co-ban", isFree: free, durationMinutes: 15 });
  }
  push({ slug: "tai-lieu-tuan", type: "document", title: "Tài liệu in (PDF) của tuần", level: null, isFree: free });
  return items;
}

export function buildSkeletonCourse(subject: SubjectSlug, grade: 2 | 3 | 4 | 5): Course {
  const calendar = buildWeekCalendar(SCHOOL_YEAR_START, TOTAL_WEEKS, HOLIDAY_MONDAYS);
  const subjectName = subject === "toan" ? "Toán" : "Tiếng Việt";
  const weeks: Week[] = calendar.map((c, i) => {
    const n = i + 1;
    const review = REVIEW_WEEKS[n];
    return {
      id: `${CODE[subject]}${grade}-w${n}`,
      number: n,
      startDate: c.startDate,
      endDate: c.endDate,
      title: review ? `Ôn tập và kiểm tra ${review.label}` : `Bài học tuần ${n} (tên bài đang cập nhật)`,
      kind: review?.kind ?? "hoc",
      published: true,
      items: buildItems(subject, grade, n),
    };
  });
  return {
    id: `${subject}-${grade}-theo-tuan`,
    subject,
    grade,
    track: "theo-tuan",
    textbook: "ket-noi-tri-thuc",
    title: `${subjectName} lớp ${grade} – Học theo tuần`,
    isSkeleton: true,
    weeks,
  };
}

export const SKELETON_COURSES: Course[] = [
  buildSkeletonCourse("toan", 2),
  buildSkeletonCourse("toan", 3),
  buildSkeletonCourse("toan", 5),
  buildSkeletonCourse("tieng-viet", 2),
  buildSkeletonCourse("tieng-viet", 3),
  buildSkeletonCourse("tieng-viet", 4),
  buildSkeletonCourse("tieng-viet", 5),
];
