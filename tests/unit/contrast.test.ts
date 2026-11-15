import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Tính tỷ lệ tương phản WCAG cho các cặp màu chữ/nền mà giao diện dùng — kể cả nền chuyển màu (gradient),
// nơi công cụ axe không tự đo được. Màu đọc trực tiếp từ globals.css để không bị lệch.
const css = readFileSync(new URL("../../src/app/globals.css", import.meta.url), "utf8");
function token(name: string): string {
  const m = new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css);
  if (!m) throw new Error(`Không thấy màu ${name}`);
  return m[1];
}
function lum(hex: string) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function ratio(a: string, b: string) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
const WHITE = "#ffffff";
// Tailwind mặc định
const TW: Record<string, string> = { "emerald-700": "#047857", "sky-700": "#0369a1", "violet-700": "#6d28d9", "gray-600": "#4b5563", "amber-900": "#78350f", "amber-50": "#fffbeb", "blue-50": "#eff6ff", "blue-900": "#1e3a8a" };

describe("tương phản màu (WCAG AA ≥ 4.5:1 cho chữ thường)", () => {
  it("chữ trắng trên mọi nền đậm đang dùng (nút, banner, ô môn, huy hiệu, nhãn lớp)", () => {
    const bgs = ["brand-600", "brand-700", "brand-800", "accent-600", "accent-700"].map(token).concat([TW["emerald-700"], TW["sky-700"], TW["violet-700"], TW["gray-600"], TW["blue-900"]]);
    for (const bg of bgs) expect(ratio(WHITE, bg), bg).toBeGreaterThanOrEqual(4.5);
  });
  it("chữ màu trên nền nhạt", () => {
    const pairs: [string, string][] = [
      [token("brand-700"), token("brand-50")],
      [token("brand-700"), token("brand-100")],
      [token("brand-600"), token("cream")],
      [token("brand-800"), token("brand-100")],
      [token("accent-700"), token("accent-100")],
      [token("accent-600"), token("cream")],
      [TW["amber-900"], TW["amber-50"]],
      [TW["blue-50"], TW["blue-900"]],
    ];
    for (const [fg, bg] of pairs) expect(ratio(fg, bg), `${fg} / ${bg}`).toBeGreaterThanOrEqual(4.5);
  });
  it("phép tính đúng (đối chứng): cam sáng brand-500 trên trắng KHÔNG đạt", () => {
    expect(ratio(WHITE, token("brand-500"))).toBeLessThan(4.5);
    expect(ratio("#000000", WHITE)).toBeCloseTo(21, 0);
  });
});
