// Quyền TẢI PDF theo tài khoản (migration 0007). File thuần, không truy cập mạng — có kiểm thử đơn vị.
//
// - Khách chưa đăng nhập: không tải (nút xám, nhắc đăng nhập).
// - Quản trị: luôn tải.
// - Phụ huynh: có "khoảng tải" từ ngày đăng ký đến hạn tải (dùng thử 30 ngày; cô gia hạn +1/+3/+6 tháng).
//   Chỉ tải được khi CHƯA quá hạn và tài liệu có thời gian chạm vào khoảng tải.
//   Tài liệu không có thời gian (vd. Luyện thi chưa gán ngày): chỉ tài khoản đã được cô gia hạn.
// Xem PDF trên web và làm phiếu tương tác không phụ thuộc vào đây.

import type { ExamCategory } from "@/lib/types";

export const TRIAL_DAYS = 30;
export const EXTEND_MONTHS = [1, 3, 6] as const;

/** Khoảng ngày của tài liệu, dạng YYYY-MM-DD (ngày lịch Việt Nam). */
export interface DateRange {
  from: string;
  to: string;
}

export type DownloadAccess =
  | { kind: "guest" }
  | { kind: "admin" }
  | {
      kind: "parent";
      /** Ngày đăng ký (YYYY-MM-DD, giờ Việt Nam). */
      start: string;
      /** Hạn tải (thời điểm ISO đầy đủ). */
      until: string;
      /** Đã được cô gia hạn thêm (hạn tải dài hơn thời gian dùng thử). */
      extended: boolean;
    };

export type DownloadDecision =
  | { ok: true }
  | { ok: false; reason: "guest" | "expired" | "out-of-range" | "no-date" };

/** Thời gian mặc định theo loại đề (năm học 2026–2027) — khớp migration 0007. Loại không có ở đây: để trống. */
export const DEFAULT_EXAM_RANGES: Partial<Record<ExamCategory, DateRange>> = {
  "on-tap-giua-ki-1": { from: "2026-10-19", to: "2026-11-08" },
  "giua-ki-1": { from: "2026-10-19", to: "2026-11-08" },
  "on-tap-cuoi-ki-1": { from: "2026-12-07", to: "2027-01-10" },
  "cuoi-ki-1": { from: "2026-12-07", to: "2027-01-10" },
  "on-tap-giua-ki-2": { from: "2027-03-01", to: "2027-03-21" },
  "giua-ki-2": { from: "2027-03-01", to: "2027-03-21" },
  "on-tap-cuoi-nam": { from: "2027-04-26", to: "2027-05-21" },
  "cuoi-nam": { from: "2027-04-26", to: "2027-05-21" },
};

/** Ngày (YYYY-MM-DD) theo giờ Việt Nam của một thời điểm. */
export function vnDate(at: Date | string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(at));
}

/** Dựng quyền của phụ huynh từ hồ sơ (created_at, tai_den). Thiếu tai_den (chưa chạy migration) → dùng thử 30 ngày. */
export function parentAccess(createdAt: string, taiDen: string | null | undefined): DownloadAccess {
  const trialEnd = new Date(new Date(createdAt).getTime() + TRIAL_DAYS * 864e5);
  const until = taiDen ? new Date(taiDen) : trialEnd;
  return {
    kind: "parent",
    start: vnDate(createdAt),
    until: until.toISOString(),
    // Thu hồi đặt hạn = lúc bấm, nên chỉ coi là "đã gia hạn" khi hạn vượt hẳn thời gian dùng thử.
    extended: until.getTime() > trialEnd.getTime() + 60_000,
  };
}

export function decideDownload(access: DownloadAccess, range: DateRange | null, now: Date = new Date()): DownloadDecision {
  if (access.kind === "admin") return { ok: true };
  if (access.kind === "guest") return { ok: false, reason: "guest" };
  if (now.getTime() > new Date(access.until).getTime()) return { ok: false, reason: "expired" };
  if (!range) return access.extended ? { ok: true } : { ok: false, reason: "no-date" };
  const end = vnDate(access.until);
  // Chạm vào khoảng tải: tài liệu kết thúc sau ngày đăng ký và bắt đầu trước hạn tải.
  return range.to >= access.start && range.from <= end ? { ok: true } : { ok: false, reason: "out-of-range" };
}

/** Lời nhắn khi bấm nút tải đang xám. */
export function blockedMessage(reason: Exclude<DownloadDecision, { ok: true }>["reason"]): string {
  switch (reason) {
    case "guest":
      return "Phụ huynh đăng nhập (tài khoản miễn phí) để tải phiếu PDF.";
    case "expired":
      return "Tài khoản đã hết thời gian tải PDF. Phụ huynh liên hệ cô Thanh Mai để được gia hạn.";
    case "out-of-range":
    case "no-date":
      return "Tài liệu này chưa mở tải cho tài khoản của bạn. Phụ huynh liên hệ cô Thanh Mai để được gia hạn.";
  }
}

/** Đọc ô ngày từ form (YYYY-MM-DD). Trả null nếu trống, "invalid" nếu sai. */
export function parseDateField(v: unknown): string | null | "invalid" {
  if (v === undefined || v === null || String(v).trim() === "") return null;
  const s = String(v).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return "invalid";
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s ? "invalid" : s;
}

/** Trạng thái tải hiển thị trong trang quản trị "Phụ huynh". */
export function downloadStatus(createdAt: string, taiDen: string, now: Date = new Date()): { label: string; tone: "trial" | "extended" | "expired"; active: boolean } {
  const a = parentAccess(createdAt, taiDen);
  if (a.kind !== "parent") throw new Error("unreachable");
  const until = new Date(a.until);
  const day = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric" }).format(until);
  if (now.getTime() > until.getTime()) return { label: "Đã hết hạn tải", tone: "expired", active: false };
  if (!a.extended) {
    const left = Math.max(1, Math.ceil((until.getTime() - now.getTime()) / 864e5));
    return { label: `Dùng thử, còn ${left} ngày (đến ${day})`, tone: "trial", active: true };
  }
  return { label: `Được tải đến ${day}`, tone: "extended", active: true };
}
