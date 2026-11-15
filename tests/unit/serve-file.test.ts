import { describe, expect, it } from "vitest";
import { injectStorageShim } from "@/lib/serve-file";

describe("chèn bộ nhớ tạm cho phiếu (thay localStorage bị chặn trong khung cách ly)", () => {
  it("chèn ngay sau <head>, giữ <!DOCTYPE> ở đầu (không rơi vào chế độ quirks)", () => {
    const out = injectStorageShim('<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"></head><body>x</body></html>');
    expect(out.startsWith("<!DOCTYPE html><html lang=\"vi\"><head><script>")).toBe(true);
    expect(out).toContain("</script><meta charset");
  });
  it("không có <head>: chèn sau <html> hoặc sau doctype, hoặc lên đầu", () => {
    expect(injectStorageShim("<html><body>x</body></html>").startsWith("<html><script>")).toBe(true);
    expect(injectStorageShim("<!doctype html><div>x</div>").startsWith("<!doctype html><script>")).toBe(true);
    expect(injectStorageShim("<div>x</div>").startsWith("<script>")).toBe(true);
  });
});
