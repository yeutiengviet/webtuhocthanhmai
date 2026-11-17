import { describe, expect, it } from "vitest";
import { HOLIDAY_MONDAYS } from "@/data/toan-theo-tuan";
import lop4Data from "@/data/mathx/toan-lop-4.json";
import { canViewItem, courseStats, freeItems, getCourse, getCourses, isCourseLocked, isTrack, lessonMedia, publishedWeeks } from "@/lib/content";
import { safeDocumentUrl, safeWorksheetUrl, telHref, youtubeId } from "@/lib/urls";
import type { Item } from "@/lib/types";
import { weekday } from "@/lib/dates";

const toanLop4TheoTuan = getCourse("toan", 4, "theo-tuan")!;
const weeks = toanLop4TheoTuan.weeks;
const teaching = weeks.filter((w) => w.kind === "hoc");

describe("Toán lớp 4 – 35 tuần", () => {
  it("có 35 tuần học đánh số 1..35, xen 4 khối ôn tập", () => {
    expect(teaching.map((w) => w.number)).toEqual(Array.from({ length: 35 }, (_, i) => i + 1));
    expect(weeks).toHaveLength(39);
    expect(weeks.filter((w) => w.kind !== "hoc").map((w) => w.slug)).toEqual(["on-tap-1", "on-tap-2", "on-tap-3", "on-tap-4"]);
  });

  it("các tuần học liên tiếp, bắt đầu thứ Hai, không trùng tuần nghỉ Tết", () => {
    for (let i = 0; i < teaching.length; i++) {
      expect(weekday(teaching[i].startDate)).toBe(1);
      expect(HOLIDAY_MONDAYS).not.toContain(teaching[i].startDate);
      if (i > 0) expect(teaching[i].startDate > teaching[i - 1].endDate).toBe(true);
    }
    expect(teaching[0].startDate).toBe("2026-09-07");
  });

  it("tên mỗi tuần chính là tên các bài của tuần theo mathx", () => {
    for (const b of lop4Data.tuan) {
      if (!("tuan" in b) || b.tuan === undefined || b.baiHoc === undefined) continue;
      const w = teaching[b.tuan - 1];
      expect(w.title).toBe(b.baiHoc.join(" · "));
    }
    expect(teaching[0].title).toBe("Ôn tập các số đến 100 000 · Ôn tập các phép tính trong phạm vi 100 000");
    expect(teaching[34].title).toBe("Ôn tập hình học và đo lường · Ôn tập một số yếu tố thống kê và xác suất");
  });

  it("mã mục duy nhất toàn khóa; slug duy nhất trong tuần", () => {
    const ids = weeks.flatMap((w) => w.items.map((i) => i.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const w of weeks) {
      const slugs = w.items.map((i) => i.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
      expect(slugs.every((s) => /^[a-z0-9-]+$/.test(s))).toBe(true);
    }
  });

  it("mỗi tuần có 1–2 video bài giảng (không tính video mở rộng)", () => {
    for (const w of teaching) {
      const n = w.items.filter((i) => i.type === "video" && !i.isExtension && i.slug.startsWith("video-bai")).length;
      expect(n === 1 || n === 2).toBe(true);
    }
  });

  it("khối ôn tập có đề cương và đề kiểm tra", () => {
    for (const w of weeks.filter((w) => w.kind !== "hoc")) {
      expect(w.items.some((i) => i.type === "test")).toBe(true);
      expect(w.items.every((i) => !i.isFree)).toBe(true);
    }
  });

  it("chỉ tuần 1–2 và phiếu đánh giá tháng 10 là miễn phí", () => {
    const free = freeItems().map((f) => `${f.week.number}/${f.item.slug}`);
    for (const f of freeItems()) {
      expect(f.week.number <= 2 || f.item.slug === "danh-gia-thang-10").toBe(true);
    }
    expect(free).toContain("8/danh-gia-thang-10");
  });

  it("mục bị khóa: lessonMedia KHÔNG trả về mã video / link phiếu (kể cả khi mục có link thật)", () => {
    const paidVideo: Item = { ...weeks[10].items[0], isFree: false, type: "video", videoRef: "SECRETPAID1", url: null };
    const paidSheet: Item = { ...weeks[10].items[0], isFree: false, type: "worksheet", videoRef: null, url: "https://toantieuhoccothanhmai.github.io/SECRET.html" };
    for (const it of [paidVideo, paidSheet]) {
      const m = lessonMedia(it);
      expect(m).toEqual({ kind: "locked" });
      expect(JSON.stringify(m)).not.toContain("SECRET");
    }
    // Khi có quyền thì mới trả nội dung
    expect(lessonMedia(paidVideo, () => true)).toEqual({ kind: "video", videoRef: "SECRETPAID1" });
    expect(lessonMedia({ ...paidSheet, isFree: true })).toEqual({ kind: "worksheet", url: paidSheet.url });
  });

  it("đường dẫn hướng học lạ (kể cả tên thuộc tính hệ thống) không được coi là hợp lệ", () => {
    expect(isTrack("theo-tuan")).toBe(true);
    for (const t of ["constructor", "__proto__", "toString", "hasOwnProperty", "abc"]) expect(isTrack(t)).toBe(false);
    expect(getCourse("toan", 4, "ky-thi")).toBeUndefined();
  });

  it("khách chưa đăng nhập chỉ xem mục Free; phụ huynh đã đăng nhập xem được tất cả", () => {
    const locked = weeks[10].items[0];
    expect(locked.isFree).toBe(false);
    expect(canViewItem(locked)).toBe(false);
    expect(canViewItem(locked, true)).toBe(true);
    expect(canViewItem(weeks[0].items[0])).toBe(true);
  });

  it("thống kê khóa học đếm đúng", () => {
    const s = courseStats(toanLop4TheoTuan);
    expect(s.weeks).toBe(35);
    // Mục "Tài liệu" (PDF) vẫn hiện ở trang công khai (đang tắt tải thì chỉ xem trên web)
    expect(s.totalItems).toBe(weeks.reduce((a, w) => a + w.items.length, 0));
    expect(publishedWeeks(toanLop4TheoTuan).reduce((a, w) => a + w.items.length, 0)).toBe(weeks.reduce((a, w) => a + w.items.length, 0));
    expect(getCourses("toan", 4).map((c) => c.track)).toEqual(["theo-tuan", "on-tap-he", "nang-cao"]);
    expect(getCourses("tieng-viet")).toHaveLength(8);
    expect(getCourses("toan")).toHaveLength(12);
  });
});

describe("Toán nâng cao đang tạm khóa", () => {
  it("chỉ khóa hướng nâng cao; bật công tắc thì mở", () => {
    const nc = getCourse("toan", 4, "nang-cao")!;
    expect(isCourseLocked(nc)).toBe(true);
    expect(isCourseLocked(nc, true)).toBe(false);
    expect(isCourseLocked(getCourse("toan", 4, "theo-tuan")!)).toBe(false);
    expect(isCourseLocked(getCourse("toan", 4, "on-tap-he")!)).toBe(false);
  });
});

describe("kiểm tra đường dẫn an toàn", () => {
  it("youtubeId nhận các dạng link phổ biến và từ chối link lạ", () => {
    expect(youtubeId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://youtu.be/dQw4w9WgXcQ?t=3")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://evil.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(youtubeId("javascript:alert(1)")).toBeNull();
    expect(youtubeId("\"><script>")).toBeNull();
    expect(youtubeId(null)).toBeNull();
  });

  it("phiếu chỉ nhận https và chỉ từ tên miền phiếu được phép", () => {
    const ok = "https://toantieuhoccothanhmai.github.io/lop4/x.html";
    expect(safeWorksheetUrl(ok)).toBe(ok);
    expect(safeWorksheetUrl("http://toantieuhoccothanhmai.github.io/lop4/x.html")).toBeNull();
    expect(safeWorksheetUrl("https://other.github.io/x.html")).toBeNull();
    expect(safeWorksheetUrl("https://user:pw@toantieuhoccothanhmai.github.io/x.html")).toBeNull();
    expect(safeWorksheetUrl("https://toantieuhoccothanhmai.github.io.evil.com/x.html")).toBeNull();
    expect(safeWorksheetUrl("javascript:alert(1)")).toBeNull();
    expect(safeWorksheetUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(safeWorksheetUrl("not a url")).toBeNull();
  });

  it("phiếu KHÔNG BAO GIỜ được nằm cùng tên miền website (chống thoát sandbox)", () => {
    for (const u of [
      "https://hocgioithanhmai.com/uploads/phieu.html",
      "https://www.hocgioithanhmai.com/phieu.html",
      "https://localhost/phieu.html",
      "https://abc.vercel.app/phieu.html",
    ]) {
      expect(safeWorksheetUrl(u), u).toBeNull();
    }
  });

  it("tài liệu chỉ nhận https", () => {
    expect(safeDocumentUrl("https://drive.google.com/x")).toBe("https://drive.google.com/x");
    expect(safeDocumentUrl("javascript:alert(1)")).toBeNull();
  });

  it("số điện thoại cho link tel: được lọc", () => {
    expect(telHref("0912 345 678")).toBe("tel:0912345678");
    expect(telHref("+84 912-345-678")).toBe("tel:+84912345678");
    expect(telHref("javascript:alert(1)")).toBeNull();
    expect(telHref("12")).toBeNull();
  });
});

describe("phiếu cô tải lên cho bài học theo tuần", () => {
  it("mã mục là duy nhất trên toàn bộ các khóa (dùng làm khóa của bảng lesson_files)", async () => {
    const { allCourses } = await import("@/lib/content");
    const ids = allCourses().flatMap((c) => c.weeks.flatMap((w) => w.items.map((i) => i.id)));
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });
  it("mục trả phí có phiếu đặt Free thì mở; không có file hoặc file trả phí thì vẫn khóa", () => {
    const sheet: Item = { ...weeks[10].items[0], id: "t4-w11-luyen-tap-co-ban", isFree: false, type: "worksheet", videoRef: null, url: null };
    expect(lessonMedia(sheet, canViewItem, null)).toEqual({ kind: "locked" });
    expect(lessonMedia(sheet, canViewItem, { hasHtml: true, hasPdf: true, isFree: false })).toEqual({ kind: "locked" });
    expect(lessonMedia(sheet, canViewItem, { hasHtml: false, hasPdf: false, isFree: true })).toEqual({ kind: "locked" });
    // PDF vẫn đưa ra để xem (đang tắt tải thì nút tải xám, máy chủ chỉ trả file cho khung xem)
    expect(lessonMedia(sheet, canViewItem, { hasHtml: true, hasPdf: true, isFree: true })).toEqual({
      kind: "worksheet",
      url: null,
      htmlSrc: "/phieu/bai/t4-w11-luyen-tap-co-ban",
      pdf: "/phieu/bai/t4-w11-luyen-tap-co-ban/pdf",
    });
  });
  it("tài liệu chỉ nhận PDF; video không nhận file", () => {
    const doc: Item = { ...weeks[0].items[0], id: "t4-w1-tai-lieu", type: "document", isFree: true, url: null };
    expect(lessonMedia(doc, canViewItem, { hasHtml: true, hasPdf: true, isFree: true })).toEqual({ kind: "document", url: null, pdf: "/phieu/bai/t4-w1-tai-lieu/pdf" });
    const vid: Item = { ...weeks[0].items[0], type: "video", isFree: true, videoRef: null };
    expect(lessonMedia(vid, canViewItem, { hasHtml: true, hasPdf: true, isFree: true })).toEqual({ kind: "video", videoRef: null });
  });
});
