import { describe, expect, it } from "vitest";
import { allExams, examHref, findExam, getExams, lessonMedia } from "@/lib/content";
import type { Exam } from "@/lib/types";
import { safeWorksheetUrl } from "@/lib/urls";

describe("khu Đề thi", () => {
  it("chỉ có đề thật do cô cung cấp; mã, đường dẫn không trùng", () => {
    const exams = allExams();
    expect(exams.map((e) => e.title)).toEqual([
      "Toán lớp 4 – Đánh giá năng lực tháng 10",
      "Đề 1: Bài ca về Trái Đất – Giữa học kì 1 Tiếng Việt 5",
    ]);
    expect(new Set(exams.map((e) => e.id)).size).toBe(exams.length);
    expect(new Set(exams.map(examHref)).size).toBe(exams.length);
    for (const e of exams) {
      expect(e.type).toBe("test");
      expect(e.durationMinutes, `${e.id}: thời gian chưa được cô xác nhận thì không ghi`).toBeUndefined();
      if (e.url) expect(safeWorksheetUrl(e.url), e.id).toBe(e.url); // link đề phải đi qua kiểm tra tên miền phiếu
    }
  });

  it("lọc theo môn, lớp; tìm đúng đề", () => {
    expect(getExams("toan").map((e) => e.grade)).toEqual([4]);
    expect(getExams("tieng-viet", 5)).toHaveLength(1);
    expect(getExams("toan", 2)).toHaveLength(0);
    expect(findExam("toan", 4, "danh-gia-nang-luc-thang-10")?.id).toBe("de-t4-danh-gia-thang-10");
    expect(findExam("toan", 5, "danh-gia-nang-luc-thang-10")).toBeUndefined();
    expect(examHref(allExams()[0])).toBe("/de-thi/toan/lop-4/danh-gia-nang-luc-thang-10");
  });

  it("đề trả phí đi qua cổng quyền chung: không lộ link phiếu", () => {
    const paid: Exam = { ...allExams()[0], isFree: false, url: "https://toantieuhoccothanhmai.github.io/SECRET.html" };
    expect(lessonMedia(paid)).toEqual({ kind: "locked" });
    expect(lessonMedia({ ...paid, isFree: true })).toEqual({ kind: "worksheet", url: paid.url });
  });
});
