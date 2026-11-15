import { describe, expect, it } from "vitest";
import { checkFileContent, examFileHref, examHref, examMedia, isUuid, kindFromFileName, MAX_FILE_BYTES, slugify, storagePath, validateExamInput } from "@/lib/exam-meta";

const enc = (s: string) => new TextEncoder().encode(s);
const ID = "5644eb66-6ca4-466e-92dc-c1b58e7ee6de";

describe("tên đường dẫn (slug) từ tên đề tiếng Việt", () => {
  it("bỏ dấu, đ→d, chỉ còn chữ thường, số, gạch nối", () => {
    expect(slugify("Đề 1: Bài ca về Trái Đất – Giữa học kì 1 Tiếng Việt 5")).toBe("de-1-bai-ca-ve-trai-dat-giua-hoc-ki-1-tieng-viet-5");
    expect(slugify("  Toán   lớp 4!!! ")).toBe("toan-lop-4");
    expect(slugify("<script>alert(1)</script>")).toBe("script-alert-1-script");
    expect(slugify("!!!")).toBe("de-thi");
    expect(slugify("a".repeat(300)).length).toBeLessThanOrEqual(100);
    expect(slugify("Đề " + "x".repeat(200))).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });
});

describe("kiểm tra file đề theo NỘI DUNG (không tin đuôi file)", () => {
  it("nhận HTML và PDF thật", () => {
    expect(checkFileContent(enc("<!DOCTYPE html><html><body>Đề</body></html>"), "html")).toBeNull();
    expect(checkFileContent(enc("%PDF-1.7\n..."), "pdf")).toBeNull();
  });
  it("từ chối file giả mạo", () => {
    expect(checkFileContent(enc("%PDF-1.7"), "html")).toMatch(/PDF/);
    expect(checkFileContent(enc("<html>"), "pdf")).toMatch(/không phải PDF/);
    expect(checkFileContent(new Uint8Array([0x4d, 0x5a, 0x00, 0x01, 0x3c, 0x68]), "html")).toMatch(/nhị phân/);
    expect(checkFileContent(enc("chỉ là chữ thường"), "html")).toMatch(/không giống/);
    expect(checkFileContent(new Uint8Array(0), "html")).toMatch(/rỗng/);
    expect(checkFileContent(new Uint8Array(MAX_FILE_BYTES + 1), "pdf")).toMatch(/quá lớn/);
  });
  it("đoán loại theo tên chỉ để gợi ý", () => {
    expect(kindFromFileName("De-1.HTML")).toBe("html");
    expect(kindFromFileName("a.htm")).toBe("html");
    expect(kindFromFileName("b.pdf")).toBe("pdf");
    expect(kindFromFileName("c.exe")).toBeNull();
    expect(kindFromFileName("d.html.exe")).toBeNull();
  });
  it("đường dẫn trong kho luôn do hệ thống đặt", () => {
    expect(storagePath(ID, "html")).toBe(`exams/${ID}.html`);
    expect(() => storagePath("../../x", "html")).toThrow();
    expect(isUuid(ID)).toBe(true);
    expect(isUuid("abc")).toBe(false);
  });
});

describe("kiểm tra form đề thi", () => {
  const ok = { subject: "toan", grade: "4", category: "giua-ki-1", title: "  Đề 2   Giữa kì ", durationMinutes: "", isFree: "on", published: "on" };
  it("hợp lệ: chuẩn hóa tên, thời gian trống = không giới hạn", () => {
    const r = validateExamInput(ok);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.title).toBe("Đề 2 Giữa kì");
      expect(r.data.durationMinutes).toBeNull();
      expect(r.data.isFree).toBe(true);
      expect(r.data.grade).toBe(4);
    }
  });
  it("báo lỗi từng ô", () => {
    const r = validateExamInput({ subject: "van", grade: "6", category: "x", title: "a", durationMinutes: "999" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["category", "durationMinutes", "grade", "subject", "title"]);
    const r2 = validateExamInput({ ...ok, durationMinutes: "12.5" });
    expect(r2.ok).toBe(false);
  });
  it("không chọn Free / Hiện thì mặc định là KHÔNG (an toàn)", () => {
    const r = validateExamInput({ ...ok, isFree: undefined, published: undefined });
    expect(r.ok && r.data.isFree === false && r.data.published === false).toBe(true);
  });
});

describe("trang làm đề được đưa gì ra trình duyệt", () => {
  const base = { id: ID, isFree: true, externalUrl: null, hasFile: true, fileKind: "html" as const };
  it("đề trả phí: chỉ báo khóa, không có đường dẫn file", () => {
    const m = examMedia({ ...base, isFree: false });
    expect(m).toEqual({ kind: "locked" });
    expect(JSON.stringify(m)).not.toContain("/phieu/");
  });
  it("đề Free: file html/pdf qua /phieu/[id], link ngoài giữ nguyên, chưa có file thì 'none'", () => {
    expect(examMedia(base)).toEqual({ kind: "file-html", src: examFileHref(ID) });
    expect(examMedia({ ...base, fileKind: "pdf" })).toEqual({ kind: "file-pdf", src: `/phieu/${ID}` });
    expect(examMedia({ ...base, hasFile: false, fileKind: null, externalUrl: "https://toantieuhoccothanhmai.github.io/a.html" }).kind).toBe("external");
    expect(examMedia({ ...base, hasFile: false, fileKind: null })).toEqual({ kind: "none" });
  });
  it("đường dẫn đề", () => {
    expect(examHref({ subject: "tieng-viet", grade: 5, slug: "de-1" })).toBe("/de-thi/tieng-viet/lop-5/de-1");
  });
});
