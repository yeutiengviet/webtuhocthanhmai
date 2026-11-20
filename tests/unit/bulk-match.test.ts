import { describe, expect, it } from "vitest";
import {
  courseMismatch,
  examGroupKey,
  groupByExam,
  groupByItem,
  guessExamFromFileName,
  guessFromFileName,
  guessGradeSubject,
  guessLesson,
  guessSummerLevel, guessSummerTestNumber,
  matchSlot,
  matchSummerSlot,
  routeBatch,
  routeFile,
  guessWeeks,
  validateMatches,
  validateTargets,
  type LessonInfo,
  type SlotInfo,
} from "@/lib/bulk-match";
import lop2 from "@/data/mathx/toan-lop-2.json";
import lop3 from "@/data/mathx/toan-lop-3.json";

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
    ["Tuan 4 kiem tra cuoi thang.pdf", 4, "kiem-tra-cuoi-thang"],
    ["Tuần 8 - Kiểm tra cuối tháng 2.html", 8, "kiem-tra-cuoi-thang"],
    ["tuan-12-kt.html", 12, "kiem-tra-cuoi-thang"],
    ["Tuần 3 tài liệu.pdf", 3, "tai-lieu-tuan"],
    ["Đề cương tuần 18.pdf", 18, "de-cuong"],
    ["phieu nang cao 14.html", 14, "luyen-tap-nang-cao"],
    ["co ban.html", null, "luyen-tap-co-ban"],
    ["tuan 40 co ban.html", null, "luyen-tap-co-ban"],
    ["anh chup.html", null, null],
    ["Lớp 4 Tuần 29 - Cơ bản.pdf", 29, "luyen-tap-co-ban"],
    ["Lớp 4 Tuần 32 - Nâng cao.html", 32, "luyen-tap-nang-cao"],
    ["Tuần 6 tổng hợp.html", 6, "luyen-tap-tong-hop"],
    ["Phiếu tuần 5.html", 5, "phieu-tuan"],
    ["Tiếng Việt 3 - Tuần 5 - Từ và câu.pdf", 5, "phieu-tu-va-cau"],
    ["Tuan 7 tu cau.html", 7, "phieu-tu-va-cau"],
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
  const slots = [1, 2].flatMap((week) => Array.from({ length: 20 }, (_, i) => ({ id: `t3-he-${week === 2 ? "nc-" : ""}de-${i + 1}`, week, slug: `de-${i + 1}`, title: `Đề ${i + 1}`, html: true, pdf: true })));
  it("đọc số đề từ tên file", () => {
    expect(guessSummerTestNumber("Đề 3.html")).toBe(3);
    expect(guessSummerTestNumber("de-12.pdf")).toBe(12);
    expect(guessSummerTestNumber("On he lop 3 - De 07.html")).toBe(7);
    expect(guessSummerTestNumber("ĐỀ 20 ôn hè.pdf")).toBe(20);
    expect(guessSummerTestNumber("on he lop 4.pdf")).toBeNull();
  });
  it("đọc phần cơ bản / nâng cao", () => {
    expect(guessSummerLevel("Đề 3 cơ bản.html")).toBe("co-ban");
    expect(guessSummerLevel("De 3 - CB.pdf")).toBe("co-ban");
    expect(guessSummerLevel("Đề 3 nâng cao.pdf")).toBe("nang-cao");
    expect(guessSummerLevel("On he lop 4 NC de 7.html")).toBe("nang-cao");
    expect(guessSummerLevel("Đề 3.pdf")).toBeNull();
  });
  it("xếp vào đúng đề và đúng phần; thiếu phần hoặc không có đề thì để trống", () => {
    expect(matchSummerSlot("Đề 5 cơ bản.pdf", slots)?.id).toBe("t3-he-de-5");
    expect(matchSummerSlot("Đề 5 nâng cao.pdf", slots)?.id).toBe("t3-he-nc-de-5");
    expect(matchSummerSlot("Lop 3 - NC - De 20.html", slots)?.id).toBe("t3-he-nc-de-20");
    expect(matchSummerSlot("Đề 5.pdf", slots)).toBeNull();
    expect(matchSummerSlot("Đề 25 cơ bản.pdf", slots)).toBeNull();
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
    ["Đề cuối HK1.pdf", "cuoi-ki-1", true],
    ["De thi giua HKII lop 3.pdf", "giua-ki-2", true],
    ["GHK1 Toán 3.html", "giua-ki-1", true],
    ["CHKI.pdf", "cuoi-ki-1", true],
    ["Đề thi học kì 1.pdf", "cuoi-ki-1", true],
    ["Kiểm tra học kì 2.pdf", "cuoi-nam", true],
    ["Đề ôn thi cuối kì 1.pdf", "on-tap-cuoi-ki-1", true],
    ["Ôn tập HK1.pdf", "on-tap-cuoi-ki-1", true],
    ["Đề HK2.pdf", "cuoi-nam", true],
    ["de hk1.html", "cuoi-ki-1", true],
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
    expect(routeFile("Lớp 3 đề ôn tập cuối học kỳ 1.pdf", wk)).toBe("exam:on-tap-cuoi-ki-1");
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

describe("tên file có 'tuần N' luôn vào tuần; một tuần nhận nhiều file", () => {
  const mk = (w: number, slug: string, html = true): SlotInfo => ({ id: `t3-w${w}-${slug}`, week: w, slug, title: slug, html, pdf: true });
  const sl: SlotInfo[] = [
    mk(17, "luyen-tap-co-ban"), mk(17, "luyen-tap-nang-cao"), mk(17, "tai-lieu-tuan", false),
    mk(18, "luyen-tap-co-ban"), mk(18, "luyen-tap-nang-cao"), mk(18, "luyen-tap-tong-hop"), mk(18, "tai-lieu-tuan", false),
  ];
  it("đọc nhiều tuần trong một tên", () => {
    expect(guessWeeks("Tuần 17, 18 tổng hợp.pdf")).toEqual({ weeks: [17, 18], keyword: true });
    expect(guessWeeks("Lớp 3 tuần 17-18.pdf").weeks).toEqual([17, 18]);
    expect(guessWeeks("Tuan 17 va 18.pdf").weeks).toEqual([17, 18]);
    expect(guessWeeks("T4 15 phut.pdf").weeks).toEqual([4]);
    expect(guessWeeks("Tuần 9 đề 2.html").weeks).toEqual([9]);
    expect(guessWeeks("Đề cuối kì 1.pdf")).toEqual({ weeks: [1], keyword: false }); // số 1 là số kì — routeBatch bỏ qua vì là đề thi
  });
  it("tuần có chữ cuối kì vẫn vào tuần, không vào Đề thi", () => {
    const r = routeBatch([{ name: "Lớp 3 tuần 18 đề cuối kì 1.pdf" }, { name: "Đề cuối kì 1.pdf" }], sl);
    expect(r).toEqual(["t3-w18-luyen-tap-co-ban", "exam:cuoi-ki-1"]);
  });
  it("2 file cùng tuần không ghi loại → hai mục khác nhau", () => {
    const r = routeBatch([{ name: "Lớp 3 tuần 17 đề A.pdf" }, { name: "Lớp 3 tuần 17 đề B.pdf" }], sl);
    expect(r).toEqual(["t3-w17-luyen-tap-co-ban", "t3-w17-luyen-tap-nang-cao"]);
  });
  it(".html và .pdf cùng tên vào cùng một mục", () => {
    const r = routeBatch([{ name: "Tuần 17 đề A.html" }, { name: "Tuần 17 đề A.pdf" }, { name: "Tuần 17 đề B.pdf" }], sl);
    expect(r).toEqual(["t3-w17-luyen-tap-co-ban", "t3-w17-luyen-tap-co-ban", "t3-w17-luyen-tap-nang-cao"]);
  });
  it("'Tuần 17, 18' không ghi loại → mục tổng hợp của tuần 18; file đã có trong danh sách thì tránh", () => {
    expect(routeBatch([{ name: "Tuần 17, 18.pdf" }], sl)).toEqual(["t3-w18-luyen-tap-tong-hop"]);
    expect(routeBatch([{ name: "Tuần 17, 18.pdf" }], sl, ["t3-w18-luyen-tap-tong-hop|pdf"])).toEqual(["t3-w18-luyen-tap-co-ban"]);
  });
  it("hết mục trống thì để cô chọn; tên có loại phiếu rõ vẫn vào đúng mục", () => {
    const r = routeBatch([{ name: "Tuần 17 a.html" }, { name: "Tuần 17 b.html" }, { name: "Tuần 17 c.html" }, { name: "Tuần 17 nâng cao.pdf" }], sl);
    expect(r[0]).toBe("t3-w17-luyen-tap-co-ban");
    expect(r[1]).toBe("t3-w17-luyen-tap-nang-cao");
    expect(r[2]).toBeNull();
    expect(r[3]).toBe("t3-w17-luyen-tap-nang-cao");
  });
});

describe("nhận ra tên bài trong tên file → tuần của bài đó", () => {
  const fromJson = (d: { tuan: { tuan?: number; baiHoc?: string[] }[] }): LessonInfo[] =>
    d.tuan.flatMap((b) => (b.tuan ? (b.baiHoc ?? []).map((title) => ({ week: b.tuan!, title })) : []));
  const l3 = fromJson(lop3);
  const l2 = fromJson(lop2);
  const week = (name: string, l = l3) => guessLesson(name, l)?.week ?? null;

  it("khớp tên bài không dấu, khác hoa/thường, khác dấu câu", () => {
    expect(week("Bảng nhân 3, bảng chia 3 - cơ bản.html")).toBe(3);
    expect(week("bang nhan 4 bang chia 4 NC.pdf")).toBe(3);
    expect(week("BẢNG NHÂN 7_BẢNG CHIA 7.pdf")).toBe(5);
    expect(week("Phiếu - Một phần mấy.html")).toBe(7);
    expect(week("Lớp 3 - Hình tròn. Tâm, bán kính, đường kính của hình tròn.pdf")).toBe(8);
    expect(week("Tim thanh phan trong phep nhan phep chia.html")).toBe(6);
  });
  it("số trong tên bài phải đúng: 'bảng nhân 6' không nhầm với tuần 6", () => {
    expect(week("Bảng nhân 6, bảng chia 6 cơ bản.html")).toBe(4);
    expect(week("Bảng nhân 5, bảng chia 5.html")).toBeNull();
  });
  it("bài gần giống nhau: chọn bài khớp sát hơn; bài một chữ cũng nhận", () => {
    expect(week("Phép cộng (không nhớ) trong phạm vi 1000 - cơ bản.pdf", l2)).toBe(28);
    expect(week("Phép trừ (không nhớ) trong phạm vi 1000 - cơ bản.pdf", l2)).toBe(29);
    expect(week("Lít - nâng cao.html", l2)).toBe(9);
    expect(week("Gam.pdf")).toBe(13);
  });
  it("tên bài có ở nhiều tuần (vd 'Luyện tập') hoặc không có tên bài thì không đoán", () => {
    expect(week("Luyện tập - cơ bản.pdf", l2)).toBeNull();
    expect(week("Ôn tập hình học và đo lường.pdf")).toBeNull();
    expect(week("phiếu bài tập.pdf")).toBeNull();
  });
  it("routeBatch: tên bài → đúng mục của tuần; có 'tuần N' thì vẫn theo tuần N", () => {
    const mk = (w: number, slug: string): SlotInfo => ({ id: `t3-w${w}-${slug}`, week: w, slug, title: slug, html: true, pdf: true });
    const sl = [3, 4, 6].flatMap((w) => [mk(w, "luyen-tap-co-ban"), mk(w, "luyen-tap-nang-cao")]);
    const r = routeBatch(
      [
        { name: "Bảng nhân 6, bảng chia 6 - nâng cao.html" },
        { name: "Bảng nhân 3, bảng chia 3.html" },
        { name: "Bảng nhân 3, bảng chia 3.pdf" },
        { name: "Tuần 6 - Bảng nhân 3, bảng chia 3 - cơ bản.pdf" },
      ],
      sl,
      [],
      l3,
    );
    expect(r).toEqual(["t3-w4-luyen-tap-nang-cao", "t3-w3-luyen-tap-co-ban", "t3-w3-luyen-tap-co-ban", "t3-w6-luyen-tap-co-ban"]);
    expect(routeFile("Bảng nhân 6, bảng chia 6 - nâng cao.html", sl)).toBeNull(); // không truyền tên bài: như cũ, chưa nhận ra
  });
});
