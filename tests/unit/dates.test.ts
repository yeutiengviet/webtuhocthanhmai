import { describe, expect, it } from "vitest";
import { addDays, buildWeekCalendar, formatRange, parseDate, todayInVietnam, weekday } from "@/lib/dates";

describe("dates", () => {
  it("cộng ngày qua cuối tháng, cuối năm, năm nhuận", () => {
    expect(addDays("2026-09-28", 6)).toBe("2026-10-04");
    expect(addDays("2026-12-28", 6)).toBe("2027-01-03");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2027-02-28", 1)).toBe("2027-03-01");
  });

  it("từ chối ngày không tồn tại / sai định dạng", () => {
    expect(() => parseDate("2027-02-29")).toThrow();
    expect(() => parseDate("2026-13-01")).toThrow();
    expect(() => parseDate("07/09/2026")).toThrow();
  });

  it("lịch tuần bắt đầu thứ Hai, kết thúc Chủ nhật, bỏ tuần nghỉ", () => {
    const cal = buildWeekCalendar("2026-09-07", 5, ["2026-09-21"]);
    expect(cal.map((w) => w.startDate)).toEqual(["2026-09-07", "2026-09-14", "2026-09-28", "2026-10-05", "2026-10-12"]);
    for (const w of cal) {
      expect(weekday(w.startDate)).toBe(1);
      expect(weekday(w.endDate)).toBe(0);
    }
  });

  it("báo lỗi nếu ngày bắt đầu không phải thứ Hai", () => {
    expect(() => buildWeekCalendar("2026-09-08", 3)).toThrow();
    expect(() => buildWeekCalendar("2026-09-07", 3, ["2026-09-15"])).toThrow();
  });

  it("định dạng khoảng ngày kiểu Việt Nam", () => {
    expect(formatRange("2026-09-07", "2026-09-13")).toBe("07/09 – 13/09/2026");
    expect(formatRange("2026-12-28", "2027-01-03")).toBe("28/12/2026 – 03/01/2027");
  });

  it("ngày hôm nay tính theo giờ Việt Nam (UTC+7), kể cả sát nửa đêm", () => {
    // 16:59 UTC = 23:59 giờ VN cùng ngày
    expect(todayInVietnam(new Date("2026-11-15T16:59:59Z"))).toBe("2026-11-15");
    // 17:00 UTC = 00:00 giờ VN ngày hôm sau
    expect(todayInVietnam(new Date("2026-11-15T17:00:00Z"))).toBe("2026-11-16");
  });
});
