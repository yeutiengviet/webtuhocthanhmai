import { describe, expect, it } from "vitest";
import { ALWAYS_RANGE, decideDownload, parentAccess } from "@/lib/download-access";
import { DOC_CATEGORIES, documentFileHref, documentHref, sortDocuments, titleFromFileName, validateDocumentInput } from "@/lib/document-meta";
import { GRADES, parseGradeSlug } from "@/lib/content";
import { isOwnFileHref, storagePath, validateExamInput } from "@/lib/exam-meta";

const ID = "5644eb66-6ca4-466e-92dc-c1b58e7ee6de";

describe("lớp 1 có trên toàn website", () => {
  it("lớp 1–5, đường dẫn lop-1 hợp lệ, lop-0 và lop-6 không", () => {
    expect([...GRADES]).toEqual([1, 2, 3, 4, 5]);
    expect(parseGradeSlug("lop-1")).toBe(1);
    expect(parseGradeSlug("lop-0")).toBeNull();
    expect(parseGradeSlug("lop-6")).toBeNull();
  });
  it("đề thi nhận lớp 1", () => {
    const v = validateExamInput({ subject: "toan", grade: "1", category: "giua-ki-1", title: "Đề giữa kì 1 Toán 1" });
    expect(v.ok).toBe(true);
    expect(validateExamInput({ subject: "toan", grade: "6", category: "giua-ki-1", title: "Đề lớp 6" }).ok).toBe(false);
  });
});

describe("mục Tài liệu: Toán một danh sách, Tiếng Việt 4 nhóm", () => {
  it("nhóm tài liệu đúng theo môn", () => {
    expect(DOC_CATEGORIES.toan.map((c) => c.slug)).toEqual(["chung"]);
    expect(DOC_CATEGORIES["tieng-viet"].map((c) => c.label)).toEqual(["Đọc hiểu", "Luyện từ và câu", "Chính tả", "Tập làm văn / Viết"]);
  });

  it("kiểm tra form: Toán luôn nhóm chung; Tiếng Việt phải chọn đúng nhóm", () => {
    const toan = validateDocumentInput({ subject: "toan", grade: 1, category: "doc-hieu", title: "Bảng cộng trong phạm vi 10", isFree: "on" });
    expect(toan.ok && toan.data.category).toBe("chung");
    const tv = validateDocumentInput({ subject: "tieng-viet", grade: "3", category: "chinh-ta", title: "Phiếu chính tả tuần 1" });
    expect(tv.ok && tv.data).toMatchObject({ grade: 3, category: "chinh-ta", isFree: false, published: false });
    const bad = validateDocumentInput({ subject: "tieng-viet", grade: 0, category: "chung", title: "ab" });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(Object.keys(bad.errors).sort()).toEqual(["category", "grade", "title"]);
  });

  it("gợi ý tên tài liệu từ tên file", () => {
    expect(titleFromFileName("Phieu_doc_hieu  tuan 3.PDF")).toBe("Phieu doc hieu tuan 3");
  });

  it("đường dẫn trang và file; khung xem PDF chỉ nhận file của website", () => {
    expect(documentHref({ grade: 2, id: ID })).toBe(`/tai-lieu/lop-2/${ID}`);
    expect(documentFileHref(ID)).toBe(`/phieu/tai-lieu/${ID}`);
    expect(isOwnFileHref(documentFileHref(ID))).toBe(true);
    expect(isOwnFileHref("/phieu/tai-lieu/../../etc")).toBe(false);
    expect(storagePath(ID, "pdf", "documents")).toBe(`documents/${ID}.pdf`);
  });

  it("sắp xếp: lớp, Toán trước, nhóm Tiếng Việt theo thứ tự, tên có số theo thứ tự tự nhiên", () => {
    const d = (grade: 1 | 2, subject: "toan" | "tieng-viet", category: "chung" | "doc-hieu" | "chinh-ta", title: string) => ({ grade, subject, category, title, sortOrder: 0 });
    const sorted = sortDocuments([
      d(2, "toan", "chung", "B"),
      d(1, "tieng-viet", "chinh-ta", "Chính tả 1"),
      d(1, "tieng-viet", "doc-hieu", "Đọc hiểu 10"),
      d(1, "tieng-viet", "doc-hieu", "Đọc hiểu 2"),
      d(1, "toan", "chung", "A"),
    ] as Parameters<typeof sortDocuments>[0]);
    expect(sorted.map((x) => x.title)).toEqual(["A", "Đọc hiểu 2", "Đọc hiểu 10", "Chính tả 1", "B"]);
  });

  it("tải tài liệu: phụ huynh còn hạn tải là tải được; hết hạn hoặc khách thì không", () => {
    const now = new Date("2026-11-17T03:00:00Z");
    expect(decideDownload(parentAccess("2026-11-10T00:00:00Z", null), ALWAYS_RANGE, now).ok).toBe(true);
    expect(decideDownload(parentAccess("2026-01-01T00:00:00Z", "2026-02-01T00:00:00Z"), ALWAYS_RANGE, now).ok).toBe(false);
    expect(decideDownload({ kind: "guest" }, ALWAYS_RANGE, now).ok).toBe(false);
  });
});
