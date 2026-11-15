// DỮ LIỆU MẪU — Toán lớp 4, sách Kết nối tri thức với cuộc sống, 35 tuần.
// Tên bài lấy theo mục lục sách; cách chia bài vào từng tuần và lịch ngày là DỰ KIẾN,
// chủ dự án cần đối chiếu lại với kế hoạch dạy học thực tế.
// Ở Giai đoạn 2, dữ liệu này sẽ chuyển vào cơ sở dữ liệu và sửa bằng trang quản trị / file CSV.

import { buildWeekCalendar } from "@/lib/dates";
import type { Course, Item, Week, WeekKind } from "@/lib/types";

/** Năm học 2026–2027: khai giảng tuần bắt đầu thứ Hai 07/09/2026; nghỉ Tết tuần 08/02/2027 (dự kiến). */
export const SCHOOL_YEAR_START = "2026-09-07";
export const HOLIDAY_MONDAYS = ["2027-02-08"];

/** Mục lục bài học Toán 4 (Kết nối tri thức). */
export const LESSONS: Record<number, string> = {
  1: "Ôn tập các số đến 100 000",
  2: "Ôn tập các phép tính trong phạm vi 100 000",
  3: "Số chẵn, số lẻ",
  4: "Biểu thức chứa chữ",
  5: "Giải bài toán có ba bước tính",
  6: "Luyện tập chung",
  7: "Đo góc, đơn vị đo góc",
  8: "Góc nhọn, góc tù, góc bẹt",
  9: "Luyện tập chung",
  10: "Số có sáu chữ số. Số 1 000 000",
  11: "Hàng và lớp",
  12: "Các số trong phạm vi lớp triệu",
  13: "Làm tròn số đến hàng trăm nghìn",
  14: "So sánh các số có nhiều chữ số",
  15: "Làm quen với dãy số tự nhiên",
  16: "Luyện tập chung",
  17: "Yến, tạ, tấn",
  18: "Đề-xi-mét vuông, mét vuông, mi-li-mét vuông",
  19: "Giây, thế kỉ",
  20: "Thực hành và trải nghiệm sử dụng một số đơn vị đo đại lượng",
  21: "Luyện tập chung",
  22: "Phép cộng các số có nhiều chữ số",
  23: "Phép trừ các số có nhiều chữ số",
  24: "Tính chất giao hoán và kết hợp của phép cộng",
  25: "Tìm hai số biết tổng và hiệu của hai số đó",
  26: "Luyện tập chung",
  27: "Hai đường thẳng vuông góc",
  28: "Thực hành và trải nghiệm vẽ hai đường thẳng vuông góc",
  29: "Hai đường thẳng song song",
  30: "Thực hành và trải nghiệm vẽ hai đường thẳng song song",
  31: "Hình bình hành, hình thoi",
  32: "Luyện tập chung",
  33: "Ôn tập các số đến lớp triệu",
  34: "Ôn tập phép cộng, phép trừ",
  35: "Ôn tập hình học",
  36: "Ôn tập đo lường",
  37: "Ôn tập chung",
  38: "Nhân với số có một chữ số",
  39: "Chia cho số có một chữ số",
  40: "Tính chất giao hoán và kết hợp của phép nhân",
  41: "Nhân, chia với 10, 100, 1 000, …",
  42: "Tính chất phân phối của phép nhân đối với phép cộng",
  43: "Nhân với số có hai chữ số",
  44: "Chia cho số có hai chữ số",
  45: "Thực hành và trải nghiệm ước lượng trong tính toán",
  46: "Tìm số trung bình cộng",
  47: "Bài toán liên quan đến rút về đơn vị",
  48: "Luyện tập chung",
  49: "Dãy số liệu thống kê",
  50: "Biểu đồ cột",
  51: "Số lần xuất hiện của một sự kiện",
  52: "Luyện tập chung",
  53: "Khái niệm phân số",
  54: "Phân số và phép chia số tự nhiên",
  55: "Tính chất cơ bản của phân số",
  56: "Rút gọn phân số",
  57: "Quy đồng mẫu số các phân số",
  58: "So sánh phân số",
  59: "Luyện tập chung",
  60: "Phép cộng phân số",
  61: "Phép trừ phân số",
  62: "Luyện tập chung",
  63: "Phép nhân phân số",
  64: "Phép chia phân số",
  65: "Tìm phân số của một số",
  66: "Luyện tập chung",
  67: "Ôn tập số tự nhiên",
  68: "Ôn tập phép tính với số tự nhiên",
  69: "Ôn tập phân số",
  70: "Ôn tập phép tính với phân số",
  71: "Ôn tập hình học và đo lường",
  72: "Ôn tập một số yếu tố thống kê và xác suất",
  73: "Ôn tập chung",
};

/** Kế hoạch tuần (dự kiến): số bài học trong từng tuần. Tuần ôn tập không có bài mới. */
interface WeekPlan {
  lessons: number[];
  kind?: WeekKind;
  /** Có đề kiểm tra 15 phút không */
  test15?: boolean;
  /** Có bài tư duy / mở rộng không */
  extension?: boolean;
}

export const PLAN: WeekPlan[] = [
  { lessons: [1, 2] },
  { lessons: [3, 4], test15: true },
  { lessons: [5, 6], extension: true },
  { lessons: [7, 8, 9], test15: true },
  { lessons: [10, 11] },
  { lessons: [12, 13], extension: true },
  { lessons: [14, 15, 16], test15: true },
  { lessons: [17, 18] },
  { lessons: [19, 20, 21], kind: "on-tap-giua-ky" },
  { lessons: [22, 23] },
  { lessons: [24, 25], test15: true, extension: true },
  { lessons: [26, 27, 28] },
  { lessons: [29, 30], test15: true },
  { lessons: [31, 32], extension: true },
  { lessons: [33, 34] },
  { lessons: [35, 36], test15: true },
  { lessons: [37] },
  { lessons: [], kind: "on-tap-cuoi-ky" },
  { lessons: [38, 39] },
  { lessons: [40, 41], test15: true },
  { lessons: [42, 43], extension: true },
  { lessons: [44, 45] },
  { lessons: [46, 47], test15: true },
  { lessons: [48, 49] },
  { lessons: [50, 51, 52], test15: true },
  { lessons: [53, 54], extension: true },
  { lessons: [55, 56], kind: "on-tap-giua-ky" },
  { lessons: [57, 58] },
  { lessons: [59, 60], test15: true },
  { lessons: [61, 62] },
  { lessons: [63, 64], test15: true, extension: true },
  { lessons: [65, 66] },
  { lessons: [67, 68, 69] },
  { lessons: [70, 71, 72], test15: true },
  { lessons: [73], kind: "on-tap-cuoi-ky" },
];

/** Tuần 1–2 được học thử miễn phí toàn bộ. */
const FREE_WEEKS = new Set([1, 2]);

/** Phiếu tương tác có thật do chủ dự án cung cấp. */
const REAL_WORKSHEETS: Record<number, { slug: string; title: string; url: string; isFree: boolean }[]> = {
  8: [
    {
      slug: "danh-gia-thang-10",
      title: "Phiếu đánh giá tháng 10",
      url: "https://toantieuhoccothanhmai.github.io/lop4/toan-lop4-danh-gia-thang-10.html",
      isFree: true,
    },
  ],
};

function weekTitle(n: number, plan: WeekPlan): string {
  if (plan.kind === "on-tap-cuoi-ky") {
    const hk = n <= 18 ? "học kì I" : "cuối năm";
    return plan.lessons.length
      ? `Bài ${plan.lessons.join(", ")} và ôn tập, kiểm tra ${hk}`
      : `Ôn tập và kiểm tra ${hk}`;
  }
  const prefix = `Bài ${plan.lessons.join(", ")}`;
  return `${prefix}: ${plan.lessons.map((b) => LESSONS[b]).join("; ")}`;
}

function buildItems(n: number, plan: WeekPlan): Item[] {
  const free = FREE_WEEKS.has(n);
  const items: Item[] = [];
  const push = (it: Omit<Item, "order" | "videoProvider" | "videoRef" | "url"> & Partial<Item>) =>
    items.push({
      videoProvider: null,
      videoRef: null,
      url: null,
      ...it,
      order: items.length + 1,
    });

  // Video bài giảng: mỗi bài một video (tối đa 2 video/tuần như mô hình; bài còn lại gộp vào video thứ 2)
  const videoLessons = plan.lessons.slice(0, 2);
  videoLessons.forEach((b, i) => {
    const merged = i === 1 && plan.lessons.length > 2 ? plan.lessons.slice(1) : [b];
    push({
      id: `t4-w${n}-video-${b}`,
      slug: `video-bai-${b}`,
      type: "video",
      title:
        merged.length > 1
          ? `Video: Bài ${merged.join(", ")} – ${merged.map((x) => LESSONS[x]).join("; ")}`
          : `Video: Bài ${b} – ${LESSONS[b]}`,
      level: "co-ban",
      isFree: free,
      videoProvider: "youtube",
    });
  });

  if (plan.kind === "on-tap-giua-ky" || plan.kind === "on-tap-cuoi-ky") {
    const ky = plan.kind === "on-tap-giua-ky" ? "giữa kì" : n <= 18 ? "cuối học kì I" : "cuối năm";
    push({ id: `t4-w${n}-de-cuong`, slug: "de-cuong", type: "document", title: `Đề cương ôn tập ${ky}`, level: null, isFree: free });
    push({ id: `t4-w${n}-video-chua-de`, slug: "video-chua-de", type: "video", title: `Video chữa đề ôn tập ${ky}`, level: "nang-cao", isFree: free, videoProvider: "youtube" });
    for (let k = 1; k <= 3; k++) {
      push({ id: `t4-w${n}-de-${k}`, slug: `de-on-tap-${k}`, type: "test", title: `Đề ôn tập ${ky} – Đề ${k}`, level: k === 3 ? "nang-cao" : "co-ban", isFree: free, durationMinutes: 40 });
    }
  }

  if (plan.lessons.length) {
    push({ id: `t4-w${n}-luyen-tap-co-ban`, slug: "luyen-tap-co-ban", type: "worksheet", title: "Bài tập luyện tập cơ bản", level: "co-ban", isFree: free });
    push({ id: `t4-w${n}-luyen-tap-nang-cao`, slug: "luyen-tap-nang-cao", type: "worksheet", title: "Bài tập luyện tập nâng cao", level: "nang-cao", isFree: free });
  }

  for (const w of REAL_WORKSHEETS[n] ?? []) {
    push({ id: `t4-w${n}-${w.slug}`, slug: w.slug, type: "worksheet", title: w.title, level: "co-ban", isFree: w.isFree, url: w.url });
  }

  if (plan.test15) {
    push({ id: `t4-w${n}-kiem-tra-15`, slug: "kiem-tra-15-phut", type: "test", title: "Đề kiểm tra 15 phút", level: "co-ban", isFree: free, durationMinutes: 15 });
  }

  if (plan.extension) {
    push({ id: `t4-w${n}-tu-duy`, slug: "toan-tu-duy", type: "video", title: "Toán tư duy – mở rộng", level: "nang-cao", isFree: free, isExtension: true, videoProvider: "youtube" });
  }

  if (plan.lessons.length) {
    push({ id: `t4-w${n}-tai-lieu`, slug: "tai-lieu-tuan", type: "document", title: "Tài liệu in (PDF) của tuần", level: null, isFree: free });
  }

  return items;
}

function buildWeeks(): Week[] {
  const calendar = buildWeekCalendar(SCHOOL_YEAR_START, PLAN.length, HOLIDAY_MONDAYS);
  return PLAN.map((plan, i) => {
    const n = i + 1;
    return {
      id: `t4-w${n}`,
      number: n,
      startDate: calendar[i].startDate,
      endDate: calendar[i].endDate,
      title: weekTitle(n, plan),
      kind: plan.kind ?? "hoc",
      published: true,
      items: buildItems(n, plan),
    };
  });
}

export const toanLop4TheoTuan: Course = {
  id: "toan-4-theo-tuan",
  subject: "toan",
  grade: 4,
  track: "theo-tuan",
  textbook: "ket-noi-tri-thuc",
  title: "Toán lớp 4 – Học theo tuần",
  weeks: buildWeeks(),
};
