import { describe, expect, it } from "vitest";
import { decideDownload, downloadStatus, parentAccess, parseDateField } from "@/lib/download-access";
import { validateExamInput } from "@/lib/exam-meta";

// Đăng ký 02/12/2026 09:00 giờ Việt Nam.
const REG = "2026-12-02T02:00:00Z";
const trial = parentAccess(REG, null);
const at = (iso: string) => new Date(iso);

describe("quyền tải PDF theo tài khoản", () => {
  it("khách không tải, quản trị luôn tải", () => {
    expect(decideDownload({ kind: "guest" }, { from: "2026-12-07", to: "2026-12-13" })).toEqual({ ok: false, reason: "guest" });
    expect(decideDownload({ kind: "admin" }, null).ok).toBe(true);
  });

  it("dùng thử 30 ngày: chỉ tài liệu trong khoảng 02/12/2026 – 01/01/2027", () => {
    const now = at("2026-12-10T00:00:00Z");
    expect(decideDownload(trial, { from: "2026-12-07", to: "2026-12-13" }, now).ok).toBe(true);
    // tuần chạm ngày đăng ký / ngày hết hạn vẫn tính
    expect(decideDownload(trial, { from: "2026-11-30", to: "2026-12-06" }, now).ok).toBe(true);
    expect(decideDownload(trial, { from: "2026-12-28", to: "2027-01-03" }, now).ok).toBe(true);
    // trước ngày đăng ký, học kỳ 2, cuối năm, ôn hè → xám
    expect(decideDownload(trial, { from: "2026-11-23", to: "2026-11-29" }, now)).toEqual({ ok: false, reason: "out-of-range" });
    expect(decideDownload(trial, { from: "2027-03-01", to: "2027-03-21" }, now).ok).toBe(false);
    expect(decideDownload(trial, { from: "2027-04-26", to: "2027-05-21" }, now).ok).toBe(false);
    // chưa gán ngày (luyện thi) → chỉ tài khoản đã được gia hạn
    expect(decideDownload(trial, null, now)).toEqual({ ok: false, reason: "no-date" });
  });

  it("quá hạn: mọi nút xám, kể cả tài liệu trong khoảng cũ", () => {
    expect(decideDownload(trial, { from: "2026-12-07", to: "2026-12-13" }, at("2027-01-02T00:00:00Z"))).toEqual({ ok: false, reason: "expired" });
  });

  it("gia hạn: khoảng tải kéo dài từ ngày đăng ký đến hạn mới, tài liệu không ngày cũng tải được", () => {
    const ext = parentAccess(REG, "2027-05-01T02:00:00Z");
    expect(ext.kind === "parent" && ext.extended).toBe(true);
    const now = at("2027-02-01T00:00:00Z");
    expect(decideDownload(ext, { from: "2026-12-07", to: "2026-12-13" }, now).ok).toBe(true);
    expect(decideDownload(ext, { from: "2027-03-01", to: "2027-03-21" }, now).ok).toBe(true);
    expect(decideDownload(ext, { from: "2027-04-26", to: "2027-05-21" }, now).ok).toBe(true);
    expect(decideDownload(ext, { from: "2027-06-07", to: "2027-06-13" }, now).ok).toBe(false);
    expect(decideDownload(ext, null, now).ok).toBe(true);
  });

  it("thu hồi trong thời gian dùng thử: hết hạn ngay, không coi là đã gia hạn", () => {
    const revoked = parentAccess(REG, "2026-12-05T00:00:00Z");
    expect(revoked.kind === "parent" && revoked.extended).toBe(false);
    expect(decideDownload(revoked, { from: "2026-12-07", to: "2026-12-13" }, at("2026-12-06T00:00:00Z")).ok).toBe(false);
  });

  it("trạng thái trong trang quản trị", () => {
    expect(downloadStatus(REG, "2027-01-01T02:00:00Z", at("2026-12-22T02:00:00Z"))).toMatchObject({ tone: "trial", active: true, label: "Dùng thử, còn 10 ngày (đến 01/01/2027)" });
    expect(downloadStatus(REG, "2027-05-01T02:00:00Z", at("2027-01-05T00:00:00Z"))).toMatchObject({ tone: "extended", label: "Được tải đến 01/05/2027" });
    expect(downloadStatus(REG, "2027-01-01T02:00:00Z", at("2027-01-05T00:00:00Z"))).toMatchObject({ tone: "expired", active: false });
  });
});

describe("thời gian áp dụng của đề", () => {
  const ok = { subject: "toan", grade: "4", category: "cuoi-ki-1", title: "Đề cuối kì 1", isFree: "on", published: "on" };
  it("đọc ô ngày", () => {
    expect(parseDateField("")).toBeNull();
    expect(parseDateField("2026-12-07")).toBe("2026-12-07");
    expect(parseDateField("2026-02-30")).toBe("invalid");
    expect(parseDateField("07/12/2026")).toBe("invalid");
  });
  it("để trống cả hai = chưa gán; điền đủ = khoảng; thiếu một ô hoặc ngược ngày = lỗi", () => {
    const empty = validateExamInput(ok);
    expect(empty.ok && empty.data.range).toBeNull();
    const full = validateExamInput({ ...ok, apDungTu: "2026-12-07", apDungDen: "2027-01-10" });
    expect(full.ok && full.data.range).toEqual({ from: "2026-12-07", to: "2027-01-10" });
    const half = validateExamInput({ ...ok, apDungTu: "2026-12-07" });
    expect(!half.ok && half.errors.apDungDen).toBeTruthy();
    const rev = validateExamInput({ ...ok, apDungTu: "2027-01-10", apDungDen: "2026-12-07" });
    expect(!rev.ok && rev.errors.apDungDen).toBeTruthy();
  });
});
