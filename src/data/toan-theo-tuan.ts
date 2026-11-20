// Toán lớp 2–5 theo tuần (sách Kết nối tri thức với cuộc sống) và Toán nâng cao theo chuyên đề.
// Tên bài từng tuần và danh sách chuyên đề lấy từ mathx.vn (ngày 16/11/2026), nằm trong các file JSON
// ở src/data/mathx/ — muốn sửa tên bài chỉ cần sửa các file đó. Chỉ lấy TÊN bài, không có nội dung/đề/video.
// Lịch ngày là DỰ KIẾN theo năm học 2026–2027, cô cần đối chiếu lại.

import "server-only";
import { buildWeekCalendar } from "@/lib/dates";
import type { Course, Item, Week, WeekKind } from "@/lib/types";
import lop2 from "@/data/mathx/toan-lop-2.json";
import lop3 from "@/data/mathx/toan-lop-3.json";
import lop4 from "@/data/mathx/toan-lop-4.json";
import lop5 from "@/data/mathx/toan-lop-5.json";
import nc2 from "@/data/mathx/toan-nang-cao-lop-2.json";
import nc3 from "@/data/mathx/toan-nang-cao-lop-3.json";
import nc4 from "@/data/mathx/toan-nang-cao-lop-4.json";
import nc5 from "@/data/mathx/toan-nang-cao-lop-5.json";

/** Năm học 2026–2027: khai giảng tuần bắt đầu thứ Hai 07/09/2026; nghỉ Tết tuần 08/02/2027 (dự kiến). */
export const SCHOOL_YEAR_START = "2026-09-07";
export const HOLIDAY_MONDAYS = ["2027-02-08"];

type Grade = 2 | 3 | 4 | 5;

interface TeachingBlock { tuan: number; baiHoc: string[]; tongHop?: string; thuVi?: string[] }
interface ReviewBlock { onTap: string; kind: "giua-ky" | "cuoi-ky"; muc: string[] }
type Block = TeachingBlock | ReviewBlock;
const isTeaching = (b: Block): b is TeachingBlock => "tuan" in b;

const DATA: Record<Grade, Block[]> = {
  2: lop2.tuan as Block[],
  3: lop3.tuan as Block[],
  4: lop4.tuan as Block[],
  5: lop5.tuan as Block[],
};

/** Tuần 1–2 được học thử miễn phí toàn bộ. */
const FREE_WEEKS = new Set([1, 2]);

/**
 * Kiểm tra cuối tháng theo THÁNG DƯƠNG LỊCH của lịch học: tuần thuộc tháng của ngày thứ Hai đầu tuần;
 * tuần học cuối cùng của mỗi tháng có đề kiểm tra cuối tháng đó (vd tuần 4 = cuối tháng 9, tuần 8 = cuối tháng 10).
 * Trả về Map: số tuần → tháng (1–12).
 */
export function monthEndWeeks(calendar: { startDate: string }[]): Map<number, number> {
  const month = (d: string) => Number(d.slice(5, 7));
  const out = new Map<number, number>();
  calendar.forEach((c, i) => {
    const next = calendar[i + 1];
    if (!next || month(next.startDate) !== month(c.startDate)) out.set(i + 1, month(c.startDate));
  });
  return out;
}

/** Số đề kiểm tra cuối tháng mỗi tháng (Đề 1 … Đề 5). Đề 2 trở đi chỉ hiện cho phụ huynh khi cô đã tải file. */
export const SO_DE_CUOI_THANG = 5;

export function monthlyTestItems(month: number) {
  return Array.from({ length: SO_DE_CUOI_THANG }, (_, i) => ({
    slug: `kiem-tra-cuoi-thang-${i + 1}`,
    type: "test" as const,
    title: `Đề kiểm tra cuối tháng ${month} – Đề ${i + 1}`,
    level: "co-ban" as const,
    durationMinutes: 40,
  }));
}

/** Số phiếu tối đa trong mục "Phiếu bài tập hàng ngày" của mỗi tuần. */
export const SO_BAI_TAP_HANG_NGAY = 20;
/** Mã mục "Phiếu bài tập hàng ngày"; các phiếu bên trong là "bai-tap-hang-ngay-1" … "-20". */
export const DAILY = "bai-tap-hang-ngay";

/** Một mục "Phiếu bài tập hàng ngày" (hiện cho phụ huynh) + các phiếu bên trong (mục con, cô tải file vào đây). */
export function dailyItems() {
  const title = "Phiếu bài tập hàng ngày";
  return [
    { slug: DAILY, type: "worksheet" as const, title, level: null, multi: true },
    ...Array.from({ length: SO_BAI_TAP_HANG_NGAY }, (_, i) => ({
      slug: `${DAILY}-${i + 1}`,
      type: "worksheet" as const,
      title: `${title} – Phiếu ${i + 1}`,
      level: null,
      partOf: DAILY,
    })),
  ];
}

/** Phiếu tương tác có thật do chủ dự án cung cấp (Toán 4, tuần 8). */
const REAL_WORKSHEETS: Partial<Record<Grade, Record<number, { slug: string; title: string; url: string; isFree: boolean }[]>>> = {
  4: {
    8: [
      {
        slug: "danh-gia-thang-10",
        title: "Phiếu đánh giá tháng 10",
        url: "https://toantieuhoccothanhmai.github.io/lop4/toan-lop4-danh-gia-thang-10.html",
        isFree: true,
      },
    ],
  },
};

function teachingItems(grade: Grade, b: TeachingBlock, monthEnd: number | undefined): Item[] {
  const n = b.tuan;
  const free = FREE_WEEKS.has(n);
  const id = (slug: string) => `t${grade}-w${n}-${slug}`;
  const items: Item[] = [];
  const push = (it: Omit<Item, "order" | "videoProvider" | "videoRef" | "url" | "id"> & Partial<Item>) =>
    items.push({ videoProvider: null, videoRef: null, url: null, id: id(it.slug), ...it, order: items.length + 1 });

  // Video bài giảng: tối đa 2 video/tuần; nếu tuần có hơn 2 bài, bài còn lại gộp vào video thứ 2.
  const l = b.baiHoc;
  const groups = l.length <= 2 ? l.map((x) => [x]) : [[l[0]], l.slice(1)];
  groups.forEach((g, i) =>
    push({ slug: `video-bai-giang-${i + 1}`, type: "video", title: `Video: ${g.join("; ")}`, level: "co-ban", isFree: free, videoProvider: "youtube" }),
  );

  // Tuần học nào cũng có đủ ô "cơ bản" và "nâng cao" để cô tải phiếu lên (kể cả Toán 4 từ tuần 29)
  push({ slug: "luyen-tap-co-ban", type: "worksheet", title: `Bài tập luyện tập Tuần ${n} – cơ bản`, level: "co-ban", isFree: free });
  push({ slug: "luyen-tap-nang-cao", type: "worksheet", title: `Bài tập luyện tập Tuần ${n} – nâng cao`, level: "nang-cao", isFree: free });
  for (const t of dailyItems()) push({ ...t, isFree: free });
  if (b.tongHop) push({ slug: "luyen-tap-tong-hop", type: "worksheet", title: b.tongHop, level: "nang-cao", isFree: free });
  for (const w of REAL_WORKSHEETS[grade]?.[n] ?? []) {
    push({ slug: w.slug, type: "worksheet", title: w.title, level: "co-ban", isFree: w.isFree, url: w.url });
  }
  if (monthEnd) for (const t of monthlyTestItems(monthEnd)) push({ ...t, isFree: free });
  (b.thuVi ?? []).forEach((t, i) =>
    push({ slug: `thu-vi-${i + 1}`, type: "video", title: `[Toán học thú vị] ${t}`, level: "nang-cao", isFree: free, isExtension: true, videoProvider: "youtube" }),
  );
  push({ slug: "tai-lieu-tuan", type: "document", title: "Tài liệu in (PDF) của tuần", level: null, isFree: free });
  return items;
}

function reviewItems(grade: Grade, r: number, b: ReviewBlock): Item[] {
  const items: Item[] = [];
  let k = 0;
  for (const m of b.muc) {
    const doc = /đề cương/i.test(m);
    const slug = doc ? "de-cuong" : `de-${++k}`;
    items.push({
      id: `t${grade}-on${r}-${slug}`,
      slug,
      type: doc ? "document" : "test",
      title: m,
      level: doc ? null : "co-ban",
      order: items.length + 1,
      isFree: false,
      videoProvider: null,
      videoRef: null,
      url: null,
      ...(doc ? {} : { durationMinutes: 40 }),
    });
  }
  return items;
}

function buildTheoTuan(grade: Grade): Course {
  const blocks = DATA[grade];
  const teaching = blocks.filter(isTeaching);
  const calendar = buildWeekCalendar(SCHOOL_YEAR_START, teaching.length, HOLIDAY_MONDAYS);
  const monthEnds = monthEndWeeks(calendar);
  const weeks: Week[] = [];
  let r = 0;
  let last = { number: 0, startDate: calendar[0].startDate, endDate: calendar[0].endDate };
  for (const b of blocks) {
    if (isTeaching(b)) {
      const c = calendar[b.tuan - 1];
      last = { number: b.tuan, startDate: c.startDate, endDate: c.endDate };
      weeks.push({ id: `t${grade}-w${b.tuan}`, number: b.tuan, startDate: c.startDate, endDate: c.endDate, title: b.baiHoc.join(" · "), kind: "hoc", published: true, items: teachingItems(grade, b, monthEnds.get(b.tuan)) });
    } else {
      r++;
      const kind: WeekKind = b.kind === "giua-ky" ? "on-tap-giua-ky" : "on-tap-cuoi-ky";
      weeks.push({
        id: `t${grade}-on${r}`,
        slug: `on-tap-${r}`,
        label: "Ôn tập",
        number: last.number,
        startDate: last.startDate,
        endDate: last.endDate,
        title: b.onTap,
        kind,
        published: true,
        items: reviewItems(grade, r, b),
      });
    }
  }
  return {
    id: `toan-${grade}-theo-tuan`,
    subject: "toan",
    grade,
    track: "theo-tuan",
    textbook: "ket-noi-tri-thuc",
    title: `Toán lớp ${grade} – Học theo tuần`,
    weeks,
  };
}

interface NangCaoData { lop: number; chuyenDe: { ten: string; bai: string[] }[] }
const NC: Record<Grade, NangCaoData> = { 2: nc2, 3: nc3, 4: nc4, 5: nc5 };

/** Chuyên đề không đưa lên web: bài giảng học thử và học qua livestream. */
const HIDDEN_CHUYEN_DE = /học thử|livestream/i;

/** Toán nâng cao theo chuyên đề: mỗi "tuần" của khóa là một chuyên đề, mỗi bài giảng là một video.
 *  Mã (id) giữ theo vị trí gốc trong file JSON để phiếu/file đã tải lên không bị lệch. */
function buildNangCao(grade: Grade): Course {
  const list = NC[grade].chuyenDe.map((cd, i) => ({ cd, c: i + 1 })).filter(({ cd }) => !HIDDEN_CHUYEN_DE.test(cd.ten));
  const calendar = buildWeekCalendar(SCHOOL_YEAR_START, list.length, []);
  const weeks: Week[] = list.map(({ cd, c }, i) => {
    const items: Item[] = cd.bai.map((title, k) => ({
      id: `t${grade}-nc${c}-b${k + 1}`,
      slug: `bai-${k + 1}`,
      type: "video",
      title,
      level: "nang-cao",
      order: k + 1,
      isFree: false,
      videoProvider: "youtube",
      videoRef: null,
      url: null,
    }));
    return { id: `t${grade}-nc${c}`, number: i + 1, startDate: calendar[i].startDate, endDate: calendar[i].endDate, title: cd.ten, kind: "hoc", published: true, items };
  });
  return {
    id: `toan-${grade}-nang-cao`,
    subject: "toan",
    grade,
    track: "nang-cao",
    textbook: "ket-noi-tri-thuc",
    title: `Toán nâng cao – Toán tư duy lớp ${grade}`,
    weeks,
  };
}

export const TOAN_THEO_TUAN: Course[] = ([2, 3, 4, 5] as const).map(buildTheoTuan);
export const TOAN_NANG_CAO: Course[] = ([2, 3, 4, 5] as const).map(buildNangCao);
