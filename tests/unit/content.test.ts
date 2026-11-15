import { describe, expect, it } from "vitest";
import { HOLIDAY_MONDAYS, LESSONS, PLAN, toanLop4TheoTuan } from "@/data/toan-lop4";
import { canViewItem, courseStats, freeItems, getCourses, safeWorksheetUrl, youtubeId } from "@/lib/content";
import { weekday } from "@/lib/dates";

const weeks = toanLop4TheoTuan.weeks;

describe("Toán lớp 4 – 35 tuần", () => {
  it("có đúng 35 tuần, đánh số 1..35", () => {
    expect(weeks).toHaveLength(35);
    expect(weeks.map((w) => w.number)).toEqual(Array.from({ length: 35 }, (_, i) => i + 1));
  });

  it("các tuần liên tiếp, bắt đầu thứ Hai, không trùng tuần nghỉ Tết", () => {
    for (let i = 0; i < weeks.length; i++) {
      expect(weekday(weeks[i].startDate)).toBe(1);
      expect(HOLIDAY_MONDAYS).not.toContain(weeks[i].startDate);
      if (i > 0) expect(weeks[i].startDate > weeks[i - 1].endDate).toBe(true);
    }
    expect(weeks[0].startDate).toBe("2026-09-07");
  });

  it("phủ đủ 73 bài, mỗi bài xuất hiện đúng một lần", () => {
    const allTitles = weeks.map((w) => w.title).join("\n");
    for (const n of Object.keys(LESSONS).map(Number)) {
      expect(allTitles).toContain(LESSONS[n]);
    }
    expect(Object.keys(LESSONS)).toHaveLength(73);
    const planned = PLAN.flatMap((p) => p.lessons);
    expect(planned).toEqual(Array.from({ length: 73 }, (_, i) => i + 1));
  });

  it("mã mục duy nhất toàn khóa; slug duy nhất trong tuần", () => {
    const ids = weeks.flatMap((w) => w.items.map((i) => i.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const w of weeks) {
      const slugs = w.items.map((i) => i.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
      expect(slugs.every((s) => /^[a-z0-9-]+$/.test(s))).toBe(true);
    }
  });

  it("mỗi tuần có 1–2 video bài giảng (không tính video mở rộng)", () => {
    for (const w of weeks) {
      const n = w.items.filter((i) => i.type === "video" && !i.isExtension && i.slug.startsWith("video-bai")).length;
      if (w.kind === "on-tap-cuoi-ky" && w.title.startsWith("Ôn tập")) expect(n).toBe(0);
      else expect(n === 1 || n === 2).toBe(true);
    }
  });

  it("tuần ôn tập có đề cương và bộ đề", () => {
    for (const w of weeks.filter((w) => w.kind !== "hoc")) {
      expect(w.items.some((i) => i.slug === "de-cuong")).toBe(true);
      expect(w.items.filter((i) => i.type === "test").length).toBeGreaterThanOrEqual(3);
    }
  });

  it("chỉ tuần 1–2 và phiếu đánh giá tháng 10 là miễn phí", () => {
    const free = freeItems().map((f) => `${f.week.number}/${f.item.slug}`);
    for (const f of freeItems()) {
      expect(f.week.number <= 2 || f.item.slug === "danh-gia-thang-10").toBe(true);
    }
    expect(free).toContain("8/danh-gia-thang-10");
  });

  it("bản dùng thử: mục trả phí không xem được, mục Free xem được", () => {
    const paid = weeks[10].items[0];
    expect(paid.isFree).toBe(false);
    expect(canViewItem(paid)).toBe(false);
    expect(canViewItem(weeks[0].items[0])).toBe(true);
  });

  it("thống kê khóa học đếm đúng", () => {
    const s = courseStats(toanLop4TheoTuan);
    expect(s.weeks).toBe(35);
    expect(s.totalItems).toBe(weeks.reduce((a, w) => a + w.items.length, 0));
    expect(getCourses("toan", 4)).toHaveLength(1);
    expect(getCourses("tieng-viet")).toHaveLength(0);
  });
});

describe("kiểm tra đường dẫn an toàn", () => {
  it("youtubeId nhận các dạng link phổ biến và từ chối link lạ", () => {
    expect(youtubeId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://youtu.be/dQw4w9WgXcQ?t=3")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://evil.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(youtubeId("javascript:alert(1)")).toBeNull();
    expect(youtubeId("\"><script>")).toBeNull();
    expect(youtubeId(null)).toBeNull();
  });

  it("phiếu chỉ nhận https", () => {
    expect(safeWorksheetUrl("https://a.github.io/x.html")).toBe("https://a.github.io/x.html");
    expect(safeWorksheetUrl("http://a.github.io/x.html")).toBeNull();
    expect(safeWorksheetUrl("javascript:alert(1)")).toBeNull();
    expect(safeWorksheetUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(safeWorksheetUrl("not a url")).toBeNull();
  });
});
