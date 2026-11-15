import { describe, expect, it } from "vitest";
import { allCourses, courseHref, freeItems, getCourse, itemHref, publishedWeeks } from "@/lib/content";
import { weekday } from "@/lib/dates";

describe("đủ 8 khóa: Toán và Tiếng Việt lớp 2–5", () => {
  it("mỗi môn có đủ lớp 2, 3, 4, 5 (học theo tuần)", () => {
    for (const subject of ["toan", "tieng-viet"]) {
      for (const grade of [2, 3, 4, 5]) {
        expect(getCourse(subject, grade, "theo-tuan"), `${subject} ${grade}`).toBeDefined();
      }
    }
    expect(allCourses()).toHaveLength(8);
  });

  it("mỗi khóa 35 tuần, bắt đầu thứ Hai, mỗi tuần có ít nhất 1 mục", () => {
    for (const c of allCourses()) {
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
    expect(new Set(allCourses().map(courseHref)).size).toBe(8);
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
    // Chỉ Toán 4 có mục lục thật
    expect(allCourses().filter((c) => !c.isSkeleton).map((c) => c.id)).toEqual(["toan-4-theo-tuan"]);
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
