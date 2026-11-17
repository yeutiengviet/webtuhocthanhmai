import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { monthEndWeeks } from "@/data/toan-theo-tuan";
import { allCourses } from "@/lib/content";

describe("đề kiểm tra cuối tháng theo tháng dương lịch", () => {
  it("tuần học cuối cùng của mỗi tháng (theo thứ Hai đầu tuần)", () => {
    const cal = ["2026-09-07", "2026-09-14", "2026-09-21", "2026-09-28", "2026-10-05", "2026-10-26", "2026-11-02"].map((startDate) => ({ startDate }));
    expect([...monthEndWeeks(cal)]).toEqual([[4, 9], [6, 10], [7, 11]]);
  });

  it("Toán và Tiếng Việt: tuần 4 = cuối tháng 9, tuần 8 = cuối tháng 10, mỗi tháng đúng một đề", () => {
    for (const c of allCourses().filter((x) => x.track === "theo-tuan")) {
      const tests = c.weeks.flatMap((w) => w.items.filter((i) => i.slug === "kiem-tra-cuoi-thang").map((i) => ({ week: w.number, title: i.title })));
      expect(tests.find((t) => t.week === 4)?.title).toBe("Đề kiểm tra cuối tháng 9");
      expect(tests.find((t) => t.week === 8)?.title).toBe("Đề kiểm tra cuối tháng 10");
      const titles = tests.map((t) => t.title);
      expect(new Set(titles).size).toBe(titles.length);
    }
  });
});
