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
    // 8 khóa học theo tuần + 4 khóa Toán nâng cao theo chuyên đề + 8 khóa Đề ôn tập hè
    expect(allCourses()).toHaveLength(20);
    for (const grade of [2, 3, 4, 5]) expect(getCourse("toan", grade, "nang-cao"), `nâng cao ${grade}`).toBeDefined();
  });

  it("mỗi khóa theo tuần có 35 tuần, bắt đầu thứ Hai, mỗi tuần có ít nhất 1 mục", () => {
    for (const c of allCourses().filter((c) => c.track === "theo-tuan")) {
      const weeks = publishedWeeks(c).filter((w) => w.kind === "hoc" || c.isSkeleton);
      // Toán lớp 5 trên mathx có 34 tuần học; các khóa khác 35 tuần
      expect(weeks, c.id).toHaveLength(c.id === "toan-5-theo-tuan" ? 34 : 35);
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
    expect(new Set(allCourses().map(courseHref)).size).toBe(20);
  });

  it("Toán 2–5 theo tuần: tên tuần là tên bài, không còn 'đang cập nhật'", () => {
    for (const grade of [2, 3, 4, 5]) {
      const c = getCourse("toan", grade, "theo-tuan")!;
      for (const w of c.weeks) {
        expect(w.title.length, `${c.id} ${w.id}`).toBeGreaterThan(2);
        expect(w.title).not.toMatch(/đang cập nhật/);
      }
    }
  });

  it("Toán nâng cao: đủ 4 lớp, số chuyên đề và số bài khớp mathx", () => {
    // đã bỏ chuyên đề "Bài giảng học thử" và "Học toán tư duy (livestream)"
    const expected: Record<number, [number, number]> = { 2: [10, 51], 3: [11, 91], 4: [14, 100], 5: [21, 156] };
    for (const grade of [2, 3, 4, 5]) {
      const c = getCourse("toan", grade, "nang-cao")!;
      expect([c.weeks.length, c.weeks.reduce((a, w) => a + w.items.length, 0)]).toEqual(expected[grade]);
      expect(c.weeks.map((w) => w.number)).toEqual(c.weeks.map((_, i) => i + 1));
      expect(c.weeks.some((w) => /học thử|livestream/i.test(w.title))).toBe(false);
      // không còn phần học thử
      expect(c.weeks.every((w) => w.items.every((i) => !i.isFree))).toBe(true);
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
      expect(course.track === "nang-cao" || course.track === "on-tap-he" || (week.kind === "hoc" && week.number <= 2) || item.slug === "danh-gia-thang-10", `${course.id} ${week.number} ${item.slug}`).toBe(true);
    }
    for (const c of allCourses().filter((c) => c.track === "theo-tuan")) {
      expect(c.weeks[0].items.every((i) => i.isFree)).toBe(true);
      expect(c.weeks[12].items.some((i) => i.isFree)).toBe(false);
    }
  });

  it("Đề ôn tập hè: Toán và Tiếng Việt lớp 2–5, mỗi khóa 40 đề (20 cơ bản + 20 nâng cao) nhận cả phiếu tương tác và PDF, ai cũng xem được", () => {
    for (const subject of ["toan", "tieng-viet"]) {
      for (const grade of [2, 3, 4, 5]) {
        const c = getCourse(subject, grade, "on-tap-he");
        expect(c, `${subject} ${grade}`).toBeDefined();
        expect(c!.weeks.map((w) => w.slug)).toEqual(["de-co-ban", "de-nang-cao"]);
        const items = c!.weeks.flatMap((w) => w.items);
        expect(items).toHaveLength(40);
        expect(new Set(items.map((i) => i.id)).size).toBe(40);
        for (const [w, level] of [[c!.weeks[0], "co-ban"], [c!.weeks[1], "nang-cao"]] as const) {
          expect(w.items.map((i) => i.slug)).toEqual(Array.from({ length: 20 }, (_, i) => `de-${i + 1}`));
          expect(w.items.every((i) => i.level === level)).toBe(true);
        }
        // mã đề cơ bản giữ như cũ để phiếu đã tải không bị mất
        expect(c!.weeks[0].items[4].id).toMatch(/-he-de-5$/);
        for (const it of items) {
          expect(it.type).toBe("test");
          expect(it.isFree).toBe(true);
          expect(it.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
        }
        expect(courseHref(c!)).toBe(`/${subject}/lop-${grade}/on-tap-he`);
      }
    }
  });
});

describe("tuần học nào cũng có ô phiếu cơ bản và nâng cao (để tải hàng loạt)", () => {
  it("Toán lớp 2–5: mọi tuần học có luyen-tap-co-ban và luyen-tap-nang-cao", async () => {
    const { TOAN_THEO_TUAN } = await import("@/data/toan-theo-tuan");
    for (const c of TOAN_THEO_TUAN)
      for (const w of c.weeks.filter((x) => x.kind === "hoc")) {
        const slugs = w.items.map((i) => i.slug);
        expect(slugs, `${c.id} tuần ${w.number}`).toContain("luyen-tap-co-ban");
        expect(slugs, `${c.id} tuần ${w.number}`).toContain("luyen-tap-nang-cao");
      }
  });
});
