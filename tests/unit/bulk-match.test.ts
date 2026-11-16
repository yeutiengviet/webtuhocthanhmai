import { describe, expect, it } from "vitest";
import {
  courseMismatch,
  examGroupKey,
  groupByExam,
  groupByItem,
  guessExamFromFileName,
  guessFromFileName,
  guessGradeSubject,
  guessSummerTestNumber,
  matchSlot,
  matchSummerSlot,
  routeFile,
  validateMatches,
  validateTargets,
  type SlotInfo,
} from "@/lib/bulk-match";

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
    ["Lớp 4 Tuần 29 - Cơ bản.pdf", 29, "luyen-tap-co-ban"],
    ["Lớp 4 Tuần 32 - Nâng cao.html", 32, "luyen-tap-nang-cao"],
    ["Tuần 6 tổng hợp.html", 6, "luyen-tap-tong-hop"],
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

describe("khóa Toán: đề ôn tập tên \"de-N\"", () => {
  it("'Tuần 9 đề 2' xếp vào đề 2 của tuần ôn tập", () => {
    const toan: SlotInfo[] = [{ id: "t4-on1-de-2", week: 9, slug: "de-2", title: "Đề 2", html: true, pdf: true }];
    expect(matchSlot(guessFromFileName("Lớp 4 tuần 9 đề 2.pdf"), toan)?.id).toBe("t4-on1-de-2");
  });
});

describe("đề ôn tập hè: xếp file theo số đề", () => {
  const slots = Array.from({ length: 20 }, (_, i) => ({ id: `t3-he-de-${i + 1}`, week: 1, slug: `de-${i + 1}`, title: `Đề ${i + 1}`, html: true, pdf: true }));
  it("đọc số đề từ tên file", () => {
    expect(guessSummerTestNumber("Đề 3.html")).toBe(3);
    expect(guessSummerTestNumber("de-12.pdf")).toBe(12);
    expect(guessSummerTestNumber("On he lop 3 - De 07.html")).toBe(7);
    expect(guessSummerTestNumber("ĐỀ 20 ôn hè.pdf")).toBe(20);
    expect(guessSummerTestNumber("on he lop 4.pdf")).toBeNull();
  });
  it("xếp vào đúng đề, không có đề thì để trống", () => {
    expect(matchSummerSlot("Đề 5.pdf", slots)?.id).toBe("t3-he-de-5");
    expect(matchSummerSlot("Đề 25.pdf", slots)).toBeNull();
  });
});

describe("đề thi: nhận từ tên file", () => {
  const cases: [string, string | null, boolean][] = [
    ["Đề giữa kì 1.html", "giua-ki-1", true],
    ["De giua ky 1 lop 3.pdf", "giua-ki-1", true],
    ["Đề cuối học kỳ 1 - Toán 3.pdf", "cuoi-ki-1", true],
    ["Lop3_CuoiKi1.html", "cuoi-ki-1", true],
    ["Đề cuối kì I.pdf", "cuoi-ki-1", true],
    ["Đề giữa học kì II.pdf", "giua-ki-2", true],
    ["Đề cuối kì 2.pdf", "cuoi-nam", true],
    ["Đề cuối năm.pdf", "cuoi-nam", true],
    ["Ôn tập cuối học kỳ 1.pdf", "on-tap-cuoi-ki-1", true],
    ["Đề ôn tập giữa kì 1 - đề 2.html", "on-tap-giua-ki-1", true],
    ["On tap giua ki 2.pdf", "on-tap-giua-ki-2", true],
    ["Ôn tập cuối năm.pdf", "on-tap-cuoi-nam", true],
    ["GK1 lop 4.pdf", "giua-ki-1", true],
    ["CK2.html", "cuoi-nam", true],
    ["Đánh giá tháng 10.pdf", "danh-gia-thang", true],
    ["Đề cuối học kỳ.pdf", null, true],
    ["Ôn tập học kì.pdf", null, true],
    ["Lớp 3 tuần 18 cơ bản.html", null, false],
    ["Đề cương tuần 18.pdf", null, false],
    ["Đề cương ôn tập cuối kì 1.pdf", null, false],
  ];
  for (const [name, category, isExam] of cases) {
    it(name, () => expect(guessExamFromFileName(name)).toEqual({ isExam, category }));
  }
});

describe("lớp và môn trong tên file", () => {
  it("đọc lớp/môn, không ghi thì null", () => {
    expect(guessGradeSubject("Lớp 3 Toán tuần 18.html")).toEqual({ grade: 3, subject: "toan" });
    expect(guessGradeSubject("L4_TV_T05.pdf")).toEqual({ grade: 4, subject: "tieng-viet" });
    expect(guessGradeSubject("Tiếng Việt lớp 2.pdf")).toEqual({ grade: 2, subject: "tieng-viet" });
    expect(guessGradeSubject("tuan 18.pdf")).toEqual({ grade: null, subject: null });
  });
  it("báo khi tên file ghi khác khóa đang tải", () => {
    const c = { grade: 3, subject: "toan" as const };
    expect(courseMismatch("Lớp 3 tuần 18.html", c)).toBeNull();
    expect(courseMismatch("tuần 18.html", c)).toBeNull();
    expect(courseMismatch("Lớp 4 tuần 18.html", c)).toContain("lớp 4");
    expect(courseMismatch("Tiếng Việt lớp 3 tuần 18.html", c)).toContain("Tiếng Việt");
  });
});

describe("chia file: tuần hay Đề thi", () => {
  const wk: SlotInfo[] = [{ id: "t3-w18-luyen-tap-co-ban", week: 18, slug: "luyen-tap-co-ban", title: "cb", html: true, pdf: true }];
  it("có 'tuần 18' → xếp vào tuần 18", () => expect(routeFile("Lớp 3 - Tuần 18 - Cơ bản.html", wk)).toBe("t3-w18-luyen-tap-co-ban"));
  it("đề giữa/cuối kì, ôn tập học kì → Đề thi", () => {
    expect(routeFile("Lớp 3 đề cuối kì 1.pdf", wk)).toBe("exam:cuoi-ki-1");
    expect(routeFile("Lớp 3 tuần 18 ôn tập cuối học kỳ 1.pdf", wk)).toBe("exam:on-tap-cuoi-ki-1");
    expect(routeFile("Đề giữa kì 1.html", wk)).toBe("exam:giua-ki-1");
  });
  it("đề thi chưa rõ kì thì chưa xếp (để cô chọn)", () => expect(routeFile("Đề cuối học kỳ.pdf", wk)).toBeNull());

  it("ghép .html + .pdf cùng tên thành một đề; trùng cùng loại thì báo", () => {
    const m = validateTargets(
      [
        { name: "Đề cuối kì 1.html", target: "exam:cuoi-ki-1" },
        { name: "Đề cuối kì 1.pdf", target: "exam:cuoi-ki-1" },
        { name: "Đề giữa kì 1.pdf", target: "exam:giua-ki-1" },
        { name: "Đề giữa kì 1 (2).pdf", target: "exam:giua-ki-1" },
        { name: "Lớp 3 tuần 18 cơ bản.html", target: "t3-w18-luyen-tap-co-ban" },
        { name: "x.html", target: null },
      ],
      wk,
    );
    expect(m.map((x) => x.problem)).toEqual([null, null, null, null, null, "khong-nhan-dien"]);
    const g = groupByExam(m);
    expect(g.size).toBe(3);
    expect(g.get(examGroupKey("Đề cuối kì 1.html") ? `cuoi-ki-1|${examGroupKey("Đề cuối kì 1.html")}` : "")?.pdf?.fileName).toBe("Đề cuối kì 1.pdf");
    expect([...groupByItem(m).keys()]).toEqual(["t3-w18-luyen-tap-co-ban"]);
    const dup = validateTargets([{ name: "a.pdf", target: "exam:cuoi-ki-1" }, { name: "A.pdf", target: "exam:cuoi-ki-1" }], wk);
    expect(dup.map((x) => x.problem)).toEqual(["trung", "trung"]);
  });
});
