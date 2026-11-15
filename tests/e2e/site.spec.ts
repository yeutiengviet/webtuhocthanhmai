import { expect, test, type Page } from "@playwright/test";
import { toanLop4TheoTuan } from "../../src/data/toan-lop4";

/** Gom lỗi console/lỗi JS của trang (bỏ qua lỗi tải khung phiếu từ tên miền ngoài bị chặn mạng). */
function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  return errors;
}

test("trang chủ đủ các phần theo mục 5.2, không lỗi console", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/");
  await expect(page.getByText("Xem video giới thiệu")).toBeVisible();
  await expect(page.getByRole("region", { name: "Banner" }).or(page.locator("[aria-roledescription=carousel]"))).toBeVisible();
  await expect(page.getByText("tuần học theo sách")).toBeVisible();
  await expect(page.getByRole("heading", { name: "5 cam kết với phụ huynh" })).toBeVisible();
  await expect(page.locator("main a[href='/toan']").filter({ hasText: "Vào học" })).toBeVisible();
  await expect(page.locator("main a[href='/tieng-viet']").filter({ hasText: "Sắp ra mắt" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Chọn lớp" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Hướng dẫn nộp phí" })).toBeVisible();
  await expect(page.locator("footer")).toContainText("Chính sách quyền riêng tư");
  expect(errors).toEqual([]);
});

test("menu điện thoại mở được và đủ mục theo 5.1", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Menu" }).click();
  const menu = page.locator("#mobile-menu");
  for (const label of ["Giới thiệu", "Học thử", "Toán", "Tiếng Việt", "Kỳ thi", "Tài liệu", "Học sinh", "Đăng nhập"]) {
    await expect(menu.getByRole("link", { name: label, exact: true })).toBeVisible();
  }
  await expect(page.getByRole("link", { name: "Hướng dẫn", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Thanh toán", exact: true })).toBeVisible();
});

test("đi từ trang chủ → Toán → Lớp 4 → Học theo tuần → 35 tuần", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/");
  await page.locator("a[href='/toan']").filter({ hasText: "Vào học" }).click();
  await expect(page).toHaveURL(/\/toan$/);
  await page.getByRole("link", { name: /Lớp 4/ }).click();
  await expect(page).toHaveURL(/\/toan\/lop-4$/);
  // Chỉ hiện hướng học có nội dung, không có bước chọn bộ sách
  await expect(page.getByText("Học theo tuần")).toBeVisible();
  await expect(page.getByText("Ôn tập hè")).toHaveCount(0);
  await expect(page.getByText(/Cánh diều|Chân trời sáng tạo/)).toHaveCount(0);
  await page.getByRole("link", { name: /Học theo tuần/ }).click();
  await expect(page).toHaveURL(/\/toan\/lop-4\/theo-tuan$/);
  await expect(page.locator("details[id^=tuan-]")).toHaveCount(35);
  await expect(page.locator("#tuan-1")).toHaveAttribute("open", "");
  await expect(page.locator("#tuan-1")).toContainText("07/09 – 13/09/2026");
  // Mở tuần 8: có phiếu đánh giá tháng 10 nhãn Free
  await page.locator("#tuan-8 summary").click();
  const row = page.locator("#tuan-8 a", { hasText: "Phiếu đánh giá tháng 10" });
  await expect(row).toBeVisible();
  await expect(row).toContainText("Free");
  await expect(row).toContainText("Điểm cao nhất");
  expect(errors).toEqual([]);
});

test("bài Free: phiếu tương tác nhúng trong iframe sandbox an toàn", async ({ page }) => {
  await page.goto("/toan/lop-4/theo-tuan/tuan-8/danh-gia-thang-10");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Phiếu đánh giá tháng 10");
  await expect(page.getByRole("navigation", { name: "Đường dẫn" })).toContainText("Toán");
  await expect(page.getByRole("navigation", { name: "Đường dẫn" })).toContainText("Tuần 8");
  const frame = page.locator("iframe[title='Phiếu đánh giá tháng 10']");
  await expect(frame).toHaveAttribute("src", /^https:\/\/toantieuhoccothanhmai\.github\.io\//);
  const sandbox = (await frame.getAttribute("sandbox")) ?? "";
  expect(sandbox.split(" ")).toEqual(expect.arrayContaining(["allow-scripts", "allow-forms"]));
  expect(sandbox).not.toContain("allow-top-navigation");
  await expect(page.getByRole("button", { name: "In bài" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Luyện tập", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cùng bài học" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cùng lớp học" })).toBeVisible();
});

test("bài Free dạng video: có khung video và phiếu luyện tập bên dưới", async ({ page }) => {
  await page.goto("/toan/lop-4/theo-tuan/tuan-1/video-bai-1");
  await expect(page.getByText("Video bài giảng đang được cập nhật")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Luyện tập sau bài giảng" })).toBeVisible();
});

test("bài trả phí: hiện khóa, KHÔNG có video/phiếu trong mã HTML trả về", async ({ page, request }) => {
  const path = "/toan/lop-4/theo-tuan/tuan-5/video-bai-10";
  await page.goto(path);
  await expect(page.getByText("Bài này dành cho học sinh đã đăng ký gói học")).toBeVisible();
  await expect(page.locator("iframe")).toHaveCount(0);
  // Kiểm tra cả mã HTML thô (không chỉ giao diện)
  const html = await (await request.get(path)).text();
  expect(html).not.toMatch(/<iframe/i);
  expect(html).not.toContain("youtube-nocookie.com/embed");
});

test("đường dẫn đoán bừa trả về 404", async ({ request }) => {
  for (const p of ["/toan/lop-3", "/toan/lop-4/theo-tuan/tuan-36/video-bai-1", "/toan/lop-4/theo-tuan/tuan-1/khong-co", "/van/lop-4", "/toan/lop-4/nang-cao"]) {
    expect((await request.get(p)).status(), p).toBe(404);
  }
});

test("tất cả trang bài học (đủ 35 tuần) đều mở được", async ({ request }) => {
  let count = 0;
  for (const w of toanLop4TheoTuan.weeks) {
    for (const it of w.items) {
      const res = await request.get(`/toan/lop-4/theo-tuan/tuan-${w.number}/${it.slug}`);
      expect(res.status(), `${w.number}/${it.slug}`).toBe(200);
      count++;
    }
  }
  expect(count).toBeGreaterThan(150);
});

test("các trang phụ mở được, không lỗi console", async ({ page }) => {
  const errors = trackErrors(page);
  for (const p of ["/gioi-thieu", "/hoc-thu", "/tieng-viet", "/ky-thi", "/tai-lieu", "/hoc-sinh", "/dang-nhap", "/huong-dan", "/thanh-toan", "/chinh-sach-rieng-tu", "/dieu-khoan"]) {
    const res = await page.goto(p);
    expect(res?.status(), p).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("có các header bảo mật", async ({ request }) => {
  const h = (await request.get("/")).headers();
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["x-powered-by"]).toBeUndefined();
});

test("mạng chậm (giả lập 3G): trang chủ và trang khóa học vẫn tải được", async ({ page }) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 400,
    downloadThroughput: (400 * 1024) / 8,
    uploadThroughput: (400 * 1024) / 8,
  });
  for (const p of ["/", "/toan/lop-4/theo-tuan"]) {
    const t0 = Date.now();
    await page.goto(p, { waitUntil: "load" });
    const ms = Date.now() - t0;
    console.log(`Thời gian tải ${p} ở mạng 3G giả lập: ${ms} ms`);
    expect(ms).toBeLessThan(20_000);
  }
});
