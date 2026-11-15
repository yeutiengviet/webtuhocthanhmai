// Xử lý ngày dạng "YYYY-MM-DD" (ngày lịch Việt Nam, không kèm giờ).
// Tính toán bằng UTC để kết quả không phụ thuộc múi giờ của máy chủ.

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseDate(iso: string): Date {
  const m = ISO.exec(iso);
  if (!m) throw new Error(`Ngày không hợp lệ: ${iso}`);
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  if (d.getUTCFullYear() !== +m[1] || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) {
    throw new Error(`Ngày không tồn tại: ${iso}`);
  }
  return d;
}

export function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const d = parseDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toIso(d);
}

/** 0 = Chủ nhật, 1 = Thứ hai … */
export function weekday(iso: string): number {
  return parseDate(iso).getUTCDay();
}

/**
 * Tạo lịch các tuần học: bắt đầu từ thứ Hai `firstMonday`,
 * bỏ qua các tuần nghỉ (ghi bằng ngày thứ Hai của tuần nghỉ).
 */
export function buildWeekCalendar(
  firstMonday: string,
  count: number,
  holidayMondays: string[] = [],
): { startDate: string; endDate: string }[] {
  if (weekday(firstMonday) !== 1) throw new Error("Ngày bắt đầu phải là thứ Hai");
  for (const h of holidayMondays) {
    if (weekday(h) !== 1) throw new Error(`Tuần nghỉ phải ghi bằng thứ Hai: ${h}`);
  }
  const skip = new Set(holidayMondays);
  const out: { startDate: string; endDate: string }[] = [];
  let monday = firstMonday;
  while (out.length < count) {
    if (!skip.has(monday)) out.push({ startDate: monday, endDate: addDays(monday, 6) });
    monday = addDays(monday, 7);
  }
  return out;
}

/** "07/09 – 13/09/2026" hoặc "28/12/2026 – 03/01/2027" khi sang năm. */
export function formatRange(start: string, end: string): string {
  const [ys, ms, ds] = start.split("-");
  const [ye, me, de] = end.split("-");
  const left = ys === ye ? `${ds}/${ms}` : `${ds}/${ms}/${ys}`;
  return `${left} – ${de}/${me}/${ye}`;
}

/** Ngày hôm nay theo giờ Việt Nam (Asia/Ho_Chi_Minh), dạng YYYY-MM-DD. */
export function todayInVietnam(now: Date = new Date()): string {
  // en-CA cho định dạng YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * Chọn tuần "hiện tại" để mở: tuần chứa hôm nay; nếu hôm nay rơi vào tuần nghỉ thì chọn tuần học kế tiếp;
 * trước năm học → tuần đầu; sau năm học → tuần cuối. Danh sách rỗng → null.
 */
export function pickCurrentWeek<T extends { startDate: string; endDate: string }>(weeks: T[], today: string): T | null {
  if (weeks.length === 0) return null;
  const inside = weeks.find((w) => w.startDate <= today && today <= w.endDate);
  if (inside) return inside;
  return weeks.find((w) => w.startDate > today) ?? weeks[weeks.length - 1];
}
