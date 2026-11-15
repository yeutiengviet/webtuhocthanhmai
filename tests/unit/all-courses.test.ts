import { describe, expect, it } from "vitest";
import { allCourses, courseHref, freeItems, getCourse, itemHref, publishedWeeks } from "@/lib/content";
import { LESSON_TITLES } from "@/data/toan-muc-luc";
import { weekday } from "@/lib/dates";

describe("đủ 8 khóa: Toán và Tiếng Việt lớp 2–5", () => {
  it("mỗi môn có đủ lớp 2, 3, 4, 5 (học theo tuần)", () => {
    for (const subject of ["toan", "tieng-viet"]) {
      for (const grade of [2, 3, 4, 5]) {
        expect(getCourse(subject, grade, "theo-tuan"), `${subject} ${grade}`).toBeDefined();
      }
    }
    // 8 khóa học theo tuần + 4 khóa Toán nâng cao theo chuyên đề
    expect(allCourses()).toHaveLength(12);
    for (const grade of [2, 3, 4, 5]) expect(getCourse("toan", grade, "nang-cao"), `nâng cao ${grade}`).toBeDefined();
  });

  it("mỗi khóa theo tuần có 35 tuần, bắt đầu thứ Hai, mỗi tuần có ít nhất 1 mục", () => {
    for (const c of allCourses().filter((c) => c.track === "theo-tuan")) {
      const weeks = publishedWeeks(c);
      expect(weeks, c.id).toHaveLength(35);
      for (const w of weeks) {
        expect(weekday(w.startDate)).toBe(1);
        expect(w.items.length, `${c.id} tuần ${w.number}`).toBeGreaterThan(0);
      }
    }
  });

  it("mã mục và đường dẫn không trùng giữa tất cả các khóa", () => {
    const ids: string[] = [];
    const hrefs: string[] = [];
    for (const c of allCourses())
      for (const w of c.weeks)
        for (const it of w.items) {
          ids.push(it.id);
          hrefs.push(itemHref(c, w, it));
        }
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(new Set(allCourses().map(courseHref)).size).toBe(12);
  });

  it("Toán 2, 3, 5: mọi tuần học đều có tên bài, và đủ bài theo mục lục", () => {
    for (const grade of [2, 3, 5] as const) {
      const c = getCourse("toan", grade, "theo-tuan")!;
      for (const w of c.weeks) expect(w.title.length, `${c.id} tuần ${w.number}`).toBeGreaterThan(3);
      const names = c.weeks.filter((w) => w.kind === "hoc").flatMap((w) => w.title.split("; "));
      expect(names.length).toBe(LESSON_TITLES[grade].length);
    }
  });

  it("khung trống KHÔNG bịa tên bài: tên tuần là 'đang cập nhật' hoặc tuần ôn tập", () => {
    for (const c of allCourses().filter((c) => c.isSkeleton)) {
      for (const w of c.weeks) {
        expect(w.title).toMatch(/đang cập nhật|^Ôn tập và kiểm tra/);
        for (const it of w.items) {
          expect(it.videoRef).toBeNull();
          expect(it.url).toBeNull();
        }
      }
    }
    // Toán 2, 3, 4, 5 theo tuần có tên bài; Tiếng Việt vẫn là khung trống
    expect(allCourses().filter((c) => c.track === "theo-tuan" && !c.isSkeleton).map((c) => c.id).sort()).toEqual([
      "toan-2-theo-tuan", "toan-3-theo-tuan", "toan-4-theo-tuan", "toan-5-theo-tuan",
    ]);
    expect(allCourses().filter((c) => c.isSkeleton).every((c) => c.subject === "tieng-viet")).toBe(true);
  });

  it("tuần 1–2 của mọi khóa được học thử; tuần khác thì không (trừ phiếu tháng 10 Toán 4)", () => {
    for (const { course, week, item } of freeItems()) {
      expect(week.number <= 2 || item.slug === "danh-gia-thang-10", `${course.id} ${week.number} ${item.slug}`).toBe(true);
    }
    for (const c of allCourses()) {
      expect(c.weeks[0].items.every((i) => i.isFree)).toBe(true);
      expect(c.weeks[10].items.some((i) => i.isFree)).toBe(false);
    }
  });
});
