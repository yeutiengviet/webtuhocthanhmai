import { describe, expect, it } from "vitest";
import { addDays, buildWeekCalendar, formatRange, parseDate, pickCurrentWeek, todayInVietnam, weekday } from "@/lib/dates";

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

  it("chọn tuần hiện tại: trong tuần, sát nửa đêm, tuần nghỉ, trước/sau năm học, danh sách rỗng", () => {
    const cal = buildWeekCalendar("2027-01-25", 3, ["2027-02-08"]).map((w, i) => ({ ...w, number: i + 1 }));
    // tuần 1: 25/01–31/01, tuần 2: 01/02–07/02, (nghỉ 08/02–14/02), tuần 3: 15/02–21/02
    expect(pickCurrentWeek(cal, "2027-01-27")?.number).toBe(1);
    expect(pickCurrentWeek(cal, "2027-01-31")?.number).toBe(1); // Chủ nhật cuối tuần
    expect(pickCurrentWeek(cal, "2027-02-01")?.number).toBe(2); // thứ Hai sau nửa đêm
    expect(pickCurrentWeek(cal, "2027-02-10")?.number).toBe(3); // tuần nghỉ Tết → tuần học kế tiếp
    expect(pickCurrentWeek(cal, "2026-12-01")?.number).toBe(1); // trước năm học
    expect(pickCurrentWeek(cal, "2027-06-01")?.number).toBe(3); // sau năm học
    expect(pickCurrentWeek([], "2027-01-27")).toBeNull();
    // Kết hợp giờ VN: 23:59 Chủ nhật 31/01 (16:59 UTC) vẫn là tuần 1; 00:00 thứ Hai là tuần 2
    expect(pickCurrentWeek(cal, todayInVietnam(new Date("2027-01-31T16:59:00Z")))?.number).toBe(1);
    expect(pickCurrentWeek(cal, todayInVietnam(new Date("2027-01-31T17:00:00Z")))?.number).toBe(2);
  });
});
