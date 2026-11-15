import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

// KIỂM THỬ TRỌN LUỒNG TẢI ĐỀ — chạy với kho Supabase thật, cần tài khoản quản trị (tạm thời) qua biến môi trường:
//   E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD
// Không có các biến này thì bộ kiểm thử được BỎ QUA (và báo là bỏ qua — không tính là đạt).

const EMAIL = process.env.E2E_ADMIN_EMAIL;
const PASSWORD = process.env.E2E_ADMIN_PASSWORD;
const FIX = (f: string) => path.join(__dirname, "fixtures", f);
const TITLE = `Đề kiểm thử tự động ${Date.now()}`;

test.describe.configure({ mode: "serial" });
test.skip(!EMAIL || !PASSWORD, "Thiếu tài khoản quản trị kiểm thử (E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD)");

async function login(page: Page) {
  await page.goto("/quan-tri/dang-nhap");
  await page.getByLabel("Email").fill(EMAIL!);
  await page.getByLabel("Mật khẩu").fill(PASSWORD!);
  await page.getByRole("button", { name: "Đăng nhập" }).last().click();
  await expect(page).toHaveURL(/\/quan-tri$/, { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "Quản lý đề thi" })).toBeVisible();
}

let examPath = "";
let fileHref = "";
let pdfHref = "";

test("đăng nhập sai bị từ chối", async ({ page }) => {
  await page.goto("/quan-tri/dang-nhap");
  await page.getByLabel("Email").fill(EMAIL!);
  await page.getByLabel("Mật khẩu").fill("sai-mat-khau-123");
  await page.getByRole("button", { name: "Đăng nhập" }).last().click();
  await expect(page.locator("main").getByRole("alert")).toContainText("Sai email hoặc mật khẩu", { timeout: 20_000 });
});

test("file giả mạo (PDF đặt đuôi .html) bị chặn ngay khi chọn", async ({ page }) => {
  await login(page);
  await page.goto("/quan-tri/tai-de");
  await page.getByLabel("Chọn phiếu tương tác").setInputFiles(FIX("gia-mao.html"));
  await expect(page.locator("main").getByRole("alert")).toContainText("PDF");
});

test("tải phiếu HTML lên → hiện ở trang công khai → phiếu bị cách ly", async ({ page, request }) => {
  await login(page);
  await page.goto("/quan-tri/tai-de");
  await page.getByLabel("Môn").selectOption("toan");
  await page.getByLabel("Lớp").selectOption("3");
  await page.getByLabel("Tên đề").fill(TITLE);
  await page.getByLabel("Loại đề").selectOption("luyen-thi");
  await page.getByLabel("Thời gian làm bài (phút)").fill("25");
  await page.getByLabel("Chọn phiếu tương tác").setInputFiles(FIX("phieu-thu.html"));
  await page.getByLabel("Chọn file PDF").setInputFiles(FIX("de-thu.pdf"));
  await expect(page.getByLabel("Miễn phí cho mọi người (nhãn Free)")).toBeChecked(); // mặc định: miễn phí
  await page.getByRole("button", { name: "Tải đề lên" }).click();
  const status = page.locator("main").getByRole("status");
  await expect(status).toContainText("Đã tải đề", { timeout: 30_000 });
  examPath = (await status.getByRole("link").getAttribute("href")) ?? "";
  expect(examPath).toMatch(/^\/de-thi\/toan\/lop-3\/de-kiem-thu-tu-dong-\d+$/);

  // Trang công khai (khách chưa đăng nhập)
  const guest = await page.context().browser()!.newContext();
  const g = await guest.newPage();
  await g.goto(examPath);
  await expect(g.getByRole("heading", { level: 1 })).toHaveText(TITLE);
  await expect(g.getByText("⏱ Thời gian: 25 phút")).toBeVisible();
  const frame = g.locator(`iframe[title="${TITLE}"]`);
  fileHref = (await frame.getAttribute("src")) ?? "";
  expect(fileHref).toMatch(/^\/phieu\/[0-9a-f-]{36}$/);
  const sandbox = (await frame.getAttribute("sandbox")) ?? "";
  expect(sandbox).toContain("allow-scripts");
  expect(sandbox).not.toContain("allow-same-origin");
  // Phiếu "xấu" bên trong tự báo: không đọc được trang chính, cookie, bộ nhớ; nguồn gốc rỗng
  const result = g.frameLocator(`iframe[title="${TITLE}"]`).locator("#ket-qua");
  await expect(result).toContainText("parent:blocked");
  await expect(result).toContainText("cookie:blocked");
  await expect(result).toContainText("origin:null");
  // localStorage thật bị chặn; phiếu dùng bộ nhớ tạm nên không bị dừng
  await expect(result).toContainText("storage:ok");
  // Nút tải phiếu PDF
  const dl = g.getByRole("link", { name: "Tải phiếu PDF" });
  pdfHref = (await dl.getAttribute("href")) ?? "";
  expect(pdfHref).toBe(`${fileHref}/pdf`);
  expect(await dl.getAttribute("download")).toMatch(/\.pdf$/);
  await guest.close();
  const pdfRes = await request.get(pdfHref);
  expect(pdfRes.status()).toBe(200);
  expect(pdfRes.headers()["content-type"]).toBe("application/pdf");

  // Header của file: cách ly kể cả khi mở trực tiếp
  const r = await request.get(fileHref);
  expect(r.status()).toBe(200);
  expect(r.headers()["content-security-policy"]).toContain("sandbox allow-scripts");
  expect(r.headers()["content-security-policy"]).not.toContain("allow-same-origin");
  expect(r.headers()["cache-control"]).toContain("no-store");
  expect(r.headers()["x-content-type-options"]).toBe("nosniff");
});

test("đổi đề sang TRẢ PHÍ → khách không tải được file; ẩn đề → biến khỏi trang công khai", async ({ page, request }) => {
  await login(page);
  const card = page.locator("li", { hasText: TITLE });
  await card.getByRole("button", { name: "Bỏ Free" }).click();
  await expect(card.getByText("Gói học")).toBeVisible({ timeout: 20_000 });
  expect((await request.get(fileHref)).status()).toBe(404);
  expect((await request.get(pdfHref)).status()).toBe(404);
  const pub = await request.get(examPath);
  expect(await pub.text()).not.toContain(fileHref);

  await card.getByRole("button", { name: "Ẩn khỏi website" }).click();
  await expect(card.getByText("Đang ẩn (nháp)")).toBeVisible({ timeout: 20_000 });
  await expect.poll(async () => (await request.get(examPath)).status(), { timeout: 20_000 }).toBe(404);
});

test("sửa đề: thay PDF, gỡ phiếu tương tác; xóa đề → file biến mất", async ({ page, request }) => {
  await login(page);
  const card = page.locator("li", { hasText: TITLE });
  await card.getByRole("link", { name: "Sửa" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sửa đề");
  await expect(page.getByText("✓ Đã có file. Chọn file mới để thay.")).toHaveCount(2);
  await page.getByLabel("Chọn file PDF").setInputFiles(FIX("de-thu.pdf"));
  await page.getByLabel("Gỡ file này").check(); // gỡ phiếu tương tác
  await page.getByLabel("Miễn phí cho mọi người (nhãn Free)").check();
  await page.getByLabel("Hiện ngay trên website").check();
  await page.getByRole("button", { name: "Lưu thay đổi" }).click();
  await expect(page.locator("main").getByRole("status")).toContainText("Đã lưu thay đổi", { timeout: 30_000 });
  expect((await request.get(fileHref)).status()).toBe(404); // đã gỡ phiếu tương tác
  const pdf = await request.get(pdfHref);
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toBe("application/pdf");
  // Chỉ còn PDF: trang đề xem PDF ngay trong trang
  await expect.poll(async () => (await request.get(examPath)).text(), { timeout: 20_000 }).toContain(`src="${pdfHref}"`);

  await page.goto("/quan-tri");
  page.once("dialog", (d) => d.accept());
  await page.locator("li", { hasText: TITLE }).getByRole("button", { name: "Xóa" }).click();
  await expect(page.locator("li", { hasText: TITLE })).toHaveCount(0, { timeout: 20_000 });
  expect((await request.get(pdfHref)).status()).toBe(404);
});

test("phiếu bài học theo tuần: tải phiếu tương tác + PDF cho mục tuần 11 → mở được, gỡ → khóa lại", async ({ page, request }) => {
  const ITEM = "t3-w11-luyen-tap-co-ban";
  const PUBLIC = "/toan/lop-3/theo-tuan/tuan-11/luyen-tap-co-ban";
  await login(page);
  await page.getByRole("link", { name: "Phiếu bài học theo tuần" }).click();
  await page.getByRole("link", { name: /Toán lớp 3/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Phiếu Toán lớp 3");
  await page.goto(`/quan-tri/bai-hoc/toan-3-theo-tuan/${ITEM}`);
  await page.getByLabel("Chọn phiếu tương tác").setInputFiles(FIX("phieu-thu.html"));
  await page.getByLabel("Chọn file PDF").setInputFiles(FIX("de-thu.pdf"));
  await page.getByRole("button", { name: "Lưu phiếu" }).click();
  await expect(page.locator("main").getByRole("status")).toContainText("Đã lưu phiếu", { timeout: 30_000 });

  // Khách mở bài (tuần 11 vốn bị khóa, nay có phiếu Free)
  await expect.poll(async () => (await request.get(PUBLIC)).text(), { timeout: 20_000 }).toContain(`/phieu/bai/${ITEM}`);
  const guest = await page.context().browser()!.newContext();
  const g = await guest.newPage();
  await g.goto(PUBLIC);
  const frame = g.locator("iframe[src^='/phieu/bai/']");
  expect(await frame.getAttribute("src")).toBe(`/phieu/bai/${ITEM}`);
  expect(await frame.getAttribute("sandbox")).not.toContain("allow-same-origin");
  await expect(g.frameLocator("iframe[src^='/phieu/bai/']").locator("#ket-qua")).toContainText("origin:null");
  await expect(g.getByRole("link", { name: "Tải phiếu PDF" })).toHaveAttribute("href", `/phieu/bai/${ITEM}/pdf`);
  await guest.close();
  expect((await request.get(`/phieu/bai/${ITEM}/pdf`)).headers()["content-type"]).toBe("application/pdf");

  // Gỡ cả 2 file → mục khóa lại, file biến mất
  await page.reload();
  for (const box of await page.getByLabel("Gỡ file này").all()) await box.check();
  await page.getByRole("button", { name: "Lưu phiếu" }).click();
  await expect(page.locator("main").getByRole("status")).toContainText("Đã gỡ hết file", { timeout: 30_000 });
  expect((await request.get(`/phieu/bai/${ITEM}`)).status()).toBe(404);
  expect((await request.get(`/phieu/bai/${ITEM}/pdf`)).status()).toBe(404);
  await expect.poll(async () => (await request.get(PUBLIC)).text(), { timeout: 20_000 }).not.toContain(`/phieu/bai/${ITEM}`);
});
