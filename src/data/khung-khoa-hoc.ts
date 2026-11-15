// KHUNG KHÓA HỌC TRỐNG — Toán và Tiếng Việt các lớp chưa có mục lục chi tiết.
// Mỗi khóa có đủ 35 tuần và các ô nội dung (video, phiếu, đề, tài liệu) để chủ dự án điền dần.
// CỐ Ý không điền tên bài theo trí nhớ (dễ sai): tên bài sẽ được cập nhật từ mục lục của chủ dự án
// (nhập file CSV / trang quản trị ở Giai đoạn 2).

import "server-only";
import { HOLIDAY_MONDAYS, SCHOOL_YEAR_START } from "@/data/toan-lop4";
import { buildWeekCalendar } from "@/lib/dates";
import { distributeLessons, LESSON_TITLES, NANG_CAO_TOPICS } from "@/data/toan-muc-luc";
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
  const titles = subject === "toan" && (grade === 2 || grade === 3 || grade === 5) ? LESSON_TITLES[grade] : null;
  const perWeek = titles ? distributeLessons(titles, TOTAL_WEEKS, new Set(Object.keys(REVIEW_WEEKS).map(Number))) : null;
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
      title: review ? `Ôn tập và kiểm tra ${review.label}` : perWeek ? perWeek[i].join("; ") : `Bài học tuần ${n} (tên bài đang cập nhật)`,
      kind: review?.kind ?? "hoc",
      published: true,
      items: buildItems(subject, grade, n).map((it, k) => {
        // Video bài giảng mang tên bài của tuần (giữ nguyên mã/đường dẫn để không mất file đã tải lên)
        const lesson = perWeek?.[i][k];
        return !review && lesson && it.type === "video" ? { ...it, title: `Video: ${lesson}` } : it;
      }),
    };
  });
  return {
    id: `${subject}-${grade}-theo-tuan`,
    subject,
    grade,
    track: "theo-tuan",
    textbook: "ket-noi-tri-thuc",
    title: `${subjectName} lớp ${grade} – Học theo tuần`,
    isSkeleton: !titles,
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

/** Toán nâng cao theo chuyên đề: mỗi "tuần" là một chuyên đề (không gắn lịch tuần). */
export function buildNangCaoCourse(grade: 2 | 3 | 4 | 5): Course {
  const topics = NANG_CAO_TOPICS[grade];
  const calendar = buildWeekCalendar(SCHOOL_YEAR_START, topics.length, []);
  const weeks: Week[] = topics.map((topic, i) => {
    const n = i + 1;
    const free = n <= 2;
    const id = (slug: string) => `t${grade}-nc${n}-${slug}`;
    const base = { videoProvider: null, videoRef: null, url: null } as const;
    const items: Item[] = [
      { ...base, id: id("video-chuyen-de"), slug: "video-chuyen-de", type: "video", title: `Video chuyên đề: ${topic}`, level: "nang-cao", order: 1, isFree: free, videoProvider: "youtube" },
      { ...base, id: id("bai-tap-nang-cao"), slug: "bai-tap-nang-cao", type: "worksheet", title: "Bài tập chuyên đề", level: "nang-cao", order: 2, isFree: free },
      { ...base, id: id("kiem-tra-chuyen-de"), slug: "kiem-tra-chuyen-de", type: "test", title: "Đề kiểm tra chuyên đề", level: "nang-cao", order: 3, isFree: free, durationMinutes: 20 },
      { ...base, id: id("tai-lieu"), slug: "tai-lieu-chuyen-de", type: "document", title: "Tài liệu chuyên đề (PDF)", level: null, order: 4, isFree: free },
    ];
    return { id: `t${grade}-nc${n}`, number: n, startDate: calendar[i].startDate, endDate: calendar[i].endDate, title: topic, kind: "hoc", published: true, items };
  });
  return {
    id: `toan-${grade}-nang-cao`,
    subject: "toan",
    grade,
    track: "nang-cao",
    textbook: "ket-noi-tri-thuc",
    title: `Toán lớp ${grade} – Nâng cao theo chuyên đề`,
    weeks,
  };
}

export const NANG_CAO_COURSES: Course[] = ([2, 3, 4, 5] as const).map(buildNangCaoCourse);
