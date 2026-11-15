import { describe, expect, it } from "vitest";
import { groupByItem, guessFromFileName, matchSlot, validateMatches, type SlotInfo } from "@/lib/bulk-match";

describe("đoán tuần và mục từ tên file", () => {
  const cases: [string, number | null, string | null][] = [
    ["Tuan 5 - Co ban.html", 5, "luyen-tap-co-ban"],
    ["tuần 12 nâng cao.pdf", 12, "luyen-tap-nang-cao"],
    ["Tuần 12 Nâng Cao.PDF", 12, "luyen-tap-nang-cao"],
    ["L3_T07_NC.html", 7, "luyen-tap-nang-cao"],
    ["Lop3_Tuan12_CB.html", 12, "luyen-tap-co-ban"],
    ["Tuan5CoBan.html", 5, "luyen-tap-co-ban"],
    ["W05-coban.html", 5, "luyen-tap-co-ban"],
    ["Toán 3 - Tuần 1 - Cơ bản.html", 1, "luyen-tap-co-ban"],
    ["Lớp 3 tuần 9 đề 2.html", 9, "de-on-tap-2"],
    ["Tuan 4 kiem tra 15 phut.pdf", 4, "kiem-tra-15-phut"],
    ["tuan-4-kt15p.html", 4, "kiem-tra-15-phut"],
    ["Tuần 3 tài liệu.pdf", 3, "tai-lieu-tuan"],
    ["Đề cương tuần 18.pdf", 18, "de-cuong"],
    ["phieu nang cao 14.html", 14, "luyen-tap-nang-cao"],
    ["co ban.html", null, "luyen-tap-co-ban"],
    ["tuan 40 co ban.html", null, "luyen-tap-co-ban"],
    ["anh chup.html", null, null],
  ];
  for (const [name, week, slug] of cases) {
    it(name, () => expect(guessFromFileName(name)).toEqual({ week, slug }));
  }
});

const slots: SlotInfo[] = [
  { id: "t3-w5-luyen-tap-co-ban", week: 5, slug: "luyen-tap-co-ban", title: "cb", html: true, pdf: true },
  { id: "t3-w5-luyen-tap-nang-cao", week: 5, slug: "luyen-tap-nang-cao", title: "nc", html: true, pdf: true },
  { id: "t3-w5-tai-lieu-tuan", week: 5, slug: "tai-lieu-tuan", title: "tl", html: false, pdf: true },
  { id: "t3-w9-de-on-tap-1", week: 9, slug: "de-on-tap-1", title: "đề 1", html: true, pdf: true },
];

describe("xếp file vào mục", () => {
  it("tìm đúng mục; tuần ôn tập không có 'cơ bản' thì không tự xếp", () => {
    expect(matchSlot({ week: 5, slug: "luyen-tap-co-ban" }, slots)?.id).toBe("t3-w5-luyen-tap-co-ban");
    expect(matchSlot({ week: 9, slug: "luyen-tap-co-ban" }, slots)).toBeNull();
    expect(matchSlot({ week: null, slug: "luyen-tap-co-ban" }, slots)).toBeNull();
  });
  it("báo lỗi: chưa xếp, sai loại file (html vào mục chỉ nhận PDF), 2 file cùng loại vào 1 mục", () => {
    const r = validateMatches(
      [
        { name: "a.html", itemId: "t3-w5-luyen-tap-co-ban" },
        { name: "a.pdf", itemId: "t3-w5-luyen-tap-co-ban" },
        { name: "b.html", itemId: "t3-w5-tai-lieu-tuan" },
        { name: "c.html", itemId: null },
        { name: "d.html", itemId: "t3-w5-luyen-tap-nang-cao" },
        { name: "e.html", itemId: "t3-w5-luyen-tap-nang-cao" },
        { name: "f.html", itemId: "khong-co" },
      ],
      slots,
    );
    expect(r.map((m) => m.problem)).toEqual([null, null, "sai-loai-file", "khong-nhan-dien", "trung", "trung", "khong-nhan-dien"]);
    const g = groupByItem(r);
    expect([...g.keys()]).toEqual(["t3-w5-luyen-tap-co-ban"]);
    expect(g.get("t3-w5-luyen-tap-co-ban")?.html?.fileName).toBe("a.html");
    expect(g.get("t3-w5-luyen-tap-co-ban")?.pdf?.fileName).toBe("a.pdf");
  });
});
