import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { SO_BAI_TAP_HANG_NGAY } from "@/data/toan-theo-tuan";
import { guessFromFileName, guessWeeks, routeBatch, routeSeries, type SlotInfo } from "@/lib/bulk-match";
import { allCourses, courseStats, itemAcceptsFiles, itemTakesUploads, parentItem, subItems, visibleItems } from "@/lib/content";

describe("Phiếu bài tập hàng ngày: một mục mỗi tuần, nhận nhiều phiếu", () => {
  it("mọi tuần học của khóa theo tuần có đúng 1 mục, bên trong 20 phiếu con", () => {
    expect(SO_BAI_TAP_HANG_NGAY).toBe(20);
    for (const c of allCourses().filter((x) => x.track === "theo-tuan")) {
      for (const w of c.weeks.filter((x) => x.kind === "hoc")) {
        const parents = w.items.filter((i) => i.multi);
        expect(parents.map((i) => i.title), `${c.id} tuần ${w.number}`).toEqual(["Phiếu bài tập hàng ngày"]);
        const kids = subItems(w.items, parents[0]);
        expect(kids).toHaveLength(20);
        expect(kids.every((k) => k.id === `${w.id}-${k.slug}` && parentItem(w.items, k) === parents[0])).toBe(true);
      }
    }
  });
  it("mục cha không nhận file trực tiếp (vẫn có trang quản trị); phiếu con nhận .html + .pdf", () => {
    const w = allCourses().find((x) => x.id === "toan-3-theo-tuan")!.weeks.find((x) => x.number === 5)!;
    const parent = w.items.find((i) => i.multi)!;
    expect(itemAcceptsFiles(parent)).toEqual({ html: false, pdf: false, images: false });
    expect(itemTakesUploads(parent)).toBe(true);
    expect(itemAcceptsFiles(subItems(w.items, parent)[0])).toEqual({ html: true, pdf: true, images: false });
  });
  it("phụ huynh chỉ thấy một mục trong danh sách tuần, kể cả khi đã có nhiều phiếu", () => {
    const c = allCourses().find((x) => x.id === "toan-3-theo-tuan")!;
    const items = c.weeks.find((w) => w.number === 5)!.items;
    const files = new Map([["t3-w5-bai-tap-hang-ngay-1", { hasHtml: true, hasPdf: false }], ["t3-w5-bai-tap-hang-ngay-2", { hasHtml: false, hasPdf: true }]]);
    expect(visibleItems(items, files).filter((i) => i.slug.startsWith("bai-tap-hang-ngay")).map((i) => i.slug)).toEqual(["bai-tap-hang-ngay"]);
    const weeks = c.weeks.filter((w) => w.kind === "hoc").length;
    expect(courseStats(c).worksheets).toBeLessThan(weeks * 5);
  });
});

describe("Phiếu bài tập hàng ngày: nhận từ tên file", () => {
  it("đọc tuần và số phiếu", () => {
    expect(guessFromFileName("Tuần 5 bài tập hàng ngày phiếu 3.pdf")).toEqual({ week: 5, slug: "bai-tap-hang-ngay-3" });
    expect(guessFromFileName("Tuan 5 - Phieu bai tap hang ngay 2.html")).toEqual({ week: 5, slug: "bai-tap-hang-ngay-2" });
    expect(guessFromFileName("T12 BTHN.pdf")).toEqual({ week: 12, slug: "bai-tap-hang-ngay" });
    expect(guessFromFileName("Bài tập hằng ngày phiếu 3 tuần 7.pdf")).toEqual({ week: 7, slug: "bai-tap-hang-ngay-3" });
    // số phiếu không bị hiểu là số tuần
    expect(guessWeeks("Bài tập hàng ngày phiếu 3.pdf").weeks).toEqual([]);
  });

  const mk = (w: number, slug: string): SlotInfo => ({ id: `t3-w${w}-${slug}`, week: w, slug, title: slug, html: true, pdf: true });
  const sl = [mk(5, "luyen-tap-co-ban"), mk(5, "luyen-tap-nang-cao"), ...[1, 2, 3].map((k) => mk(5, `bai-tap-hang-ngay-${k}`))];

  it("routeBatch: có số phiếu thì vào phiếu đó; không có thì vào phiếu trống; .html + .pdf cùng tên là một phiếu", () => {
    const r = routeBatch(
      [
        { name: "Tuần 5 bài tập hàng ngày phiếu 2.pdf" },
        { name: "Tuần 5 bài tập hàng ngày A.html" },
        { name: "Tuần 5 bài tập hàng ngày A.pdf" },
        { name: "Tuần 5 bài tập hàng ngày B.pdf" },
        { name: "Tuần 5 bài tập hàng ngày C.pdf" },
      ],
      sl,
    );
    expect(r).toEqual(["t3-w5-bai-tap-hang-ngay-2", "t3-w5-bai-tap-hang-ngay-1", "t3-w5-bai-tap-hang-ngay-1", "t3-w5-bai-tap-hang-ngay-3", null]);
  });
  it("file không ghi loại phiếu không tự vào phiếu bài tập hàng ngày", () => {
    expect(routeBatch([{ name: "Tuần 5 a.pdf" }, { name: "Tuần 5 b.pdf" }, { name: "Tuần 5 c.pdf" }], sl)).toEqual(["t3-w5-luyen-tap-co-ban", "t3-w5-luyen-tap-nang-cao", null]);
  });
  it("trang tải nhiều phiếu của một tuần: tên bất kỳ, xếp lần lượt vào phiếu trống (bỏ qua phiếu đã có file)", () => {
    const d = sl.filter((s) => s.slug.startsWith("bai-tap-hang-ngay-"));
    expect(routeSeries([{ name: "Bài A.pdf" }, { name: "Phiếu 3.html" }, { name: "Bài A.html" }, { name: "Bài B.pdf" }], d, [], ["t3-w5-bai-tap-hang-ngay-1"])).toEqual([
      "t3-w5-bai-tap-hang-ngay-2", "t3-w5-bai-tap-hang-ngay-3", "t3-w5-bai-tap-hang-ngay-2", null,
    ]);
  });
});
