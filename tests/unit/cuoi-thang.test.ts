import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { monthEndWeeks, SO_DE_CUOI_THANG } from "@/data/toan-theo-tuan";
import { guessFromFileName, guessMonth, routeBatch, routeMonthly, type SlotInfo } from "@/lib/bulk-match";
import { allCourses, visibleItems } from "@/lib/content";

describe("đề kiểm tra cuối tháng theo tháng dương lịch", () => {
  it("tuần học cuối cùng của mỗi tháng (theo thứ Hai đầu tuần)", () => {
    const cal = ["2026-09-07", "2026-09-14", "2026-09-21", "2026-09-28", "2026-10-05", "2026-10-26", "2026-11-02"].map((startDate) => ({ startDate }));
    expect([...monthEndWeeks(cal)]).toEqual([[4, 9], [6, 10], [7, 11]]);
  });

  it("Toán và Tiếng Việt: tuần 4 = cuối tháng 9, tuần 8 = cuối tháng 10, mỗi tháng 5 đề", () => {
    expect(SO_DE_CUOI_THANG).toBe(5);
    for (const c of allCourses().filter((x) => x.track === "theo-tuan")) {
      const byWeek = (n: number) => c.weeks.filter((w) => w.number === n).flatMap((w) => w.items).filter((i) => i.slug.startsWith("kiem-tra-cuoi-thang-")).map((i) => i.title);
      expect(byWeek(4)).toEqual([1, 2, 3, 4, 5].map((k) => `Đề kiểm tra cuối tháng 9 – Đề ${k}`));
      expect(byWeek(8)[0]).toBe("Đề kiểm tra cuối tháng 10 – Đề 1");
      const all = c.weeks.flatMap((w) => w.items).filter((i) => i.slug.startsWith("kiem-tra-cuoi-thang-")).map((i) => i.title);
      expect(new Set(all).size).toBe(all.length);
    }
  });

  it("phụ huynh chỉ thấy Đề 2–5 khi đã có file (Đề 1 luôn hiện)", () => {
    const items = allCourses().find((c) => c.id === "toan-3-theo-tuan")!.weeks.find((w) => w.number === 4)!.items;
    const ids = (f: Map<string, { hasHtml: boolean; hasPdf: boolean }>) => visibleItems(items, f).filter((i) => i.slug.startsWith("kiem-tra-cuoi-thang")).map((i) => i.slug);
    expect(ids(new Map())).toEqual(["kiem-tra-cuoi-thang-1"]);
    expect(ids(new Map([["t3-w4-kiem-tra-cuoi-thang-3", { hasHtml: true, hasPdf: false }]]))).toEqual(["kiem-tra-cuoi-thang-1", "kiem-tra-cuoi-thang-3"]);
  });
});

describe("tải nhiều file đề cuối tháng", () => {
  const slot = (week: number, slug: string, title: string): SlotInfo => ({ id: `t3-w${week}-${slug}`, week, slug, title, html: true, pdf: true });
  const monthly = (week: number, month: number) => [1, 2, 3, 4, 5].map((k) => slot(week, `kiem-tra-cuoi-thang-${k}`, `Đề kiểm tra cuối tháng ${month} – Đề ${k}`));
  const slots = [slot(4, "luyen-tap-co-ban", "Cơ bản"), slot(4, "luyen-tap-nang-cao", "Nâng cao"), ...monthly(4, 9), ...monthly(8, 10)];

  it("đọc tên file", () => {
    expect(guessFromFileName("Tuần 4 kiểm tra cuối tháng đề 3.html")).toEqual({ week: 4, slug: "kiem-tra-cuoi-thang-3" });
    expect(guessFromFileName("Tuần 4 kiểm tra cuối tháng.pdf")).toEqual({ week: 4, slug: "kiem-tra-cuoi-thang" });
    expect(guessMonth("Đề kiểm tra cuối tháng 10 - đề 2.pdf")).toBe(10);
  });

  it("trang của một tháng: 'đề N' vào Đề N, còn lại vào đề trống, .html + .pdf cùng tên là một đề", () => {
    const files = ["A.html", "A.pdf", "de 4.pdf", "B.html"].map((name) => ({ name }));
    expect(routeMonthly(files, monthly(4, 9), [], ["t3-w4-kiem-tra-cuoi-thang-1"])).toEqual([
      "t3-w4-kiem-tra-cuoi-thang-2", "t3-w4-kiem-tra-cuoi-thang-2", "t3-w4-kiem-tra-cuoi-thang-4", "t3-w4-kiem-tra-cuoi-thang-3",
    ]);
  });

  it("tải hàng loạt cả khóa: tên chỉ ghi 'cuối tháng 10' cũng vào đúng tuần; không ghi số đề thì không lấn sang phiếu luyện tập", () => {
    const out = routeBatch(["Kiểm tra cuối tháng 10 đề 2.html", "Tuần 4 kiểm tra cuối tháng.html", "Tuần 4 KT.html"].map((name) => ({ name })), slots);
    expect(out).toEqual(["t3-w8-kiem-tra-cuoi-thang-2", "t3-w4-kiem-tra-cuoi-thang-1", "t3-w4-kiem-tra-cuoi-thang-2"]);
  });
});
