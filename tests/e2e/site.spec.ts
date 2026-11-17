import { expect, test, type Page } from "@playwright/test";

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
  await expect(page.getByText("Về cô Thanh Mai")).toBeVisible();
  await expect(page.getByRole("region", { name: "Banner" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tạm dừng" })).toBeVisible();
  await expect(page.getByText("tuần học theo sách")).toBeVisible();
  await expect(page.getByRole("heading", { name: "4 cam kết với phụ huynh" })).toBeVisible();
  await expect(page.locator("main a[href='/toan']").filter({ hasText: "Vào xem" })).toBeVisible();
  await expect(page.locator("main a[href='/tieng-viet']").filter({ hasText: "Vào xem" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Con đang học lớp mấy?" })).toBeVisible();
  for (const g of ["2", "3", "4", "5"]) await expect(page.locator("main a").filter({ hasText: new RegExp(`Lớp\\s*${g}`) }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tạo tài khoản miễn phí" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Đề ôn tập hè – chuẩn bị lên lớp" })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/dùng thử/i);
  await expect(page.locator("footer")).toContainText("Chính sách quyền riêng tư");
  expect(errors).toEqual([]);
});

test("menu điện thoại mở được và đủ mục theo 5.1", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Menu" }).click();
  const menu = page.locator("#mobile-menu");
  for (const label of ["Giới thiệu", "Toán", "Tiếng Việt", "Đề thi", "Đăng nhập"]) {
    await expect(menu.getByRole("link", { name: label, exact: true })).toBeVisible();
  }
  // Đang tắt tải tài liệu: không có mục "Tài liệu"
  await expect(menu.getByRole("link", { name: "Tài liệu", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Hướng dẫn", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Tạo tài khoản", exact: true })).toBeVisible();
});

test("đi từ trang chủ → Toán → Lớp 4 → Học theo tuần → 35 tuần", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/");
  await page.locator("a[href='/toan']").filter({ hasText: "Vào xem" }).click();
  await expect(page).toHaveURL(/\/toan$/);
  await page.getByRole("link", { name: /Lớp 4/ }).click();
  await expect(page).toHaveURL(/\/toan\/lop-4$/);
  // Chỉ hiện hướng học có nội dung, không có bước chọn bộ sách
  await expect(page.getByText("Học theo tuần")).toBeVisible();
  await expect(page.getByRole("link", { name: /Đề ôn tập hè/ })).toBeVisible();
  await expect(page.getByText(/Cánh diều|Chân trời sáng tạo/)).toHaveCount(0);
  // Toán nâng cao: vẫn hiện ô nhưng không phải liên kết (tạm khóa)
  const nc = page.locator("[aria-disabled=true]", { hasText: "Nâng cao theo chuyên đề" });
  await expect(nc).toBeVisible();
  await expect(nc).toContainText("Tạm khóa");
  await expect(page.locator("a[href='/toan/lop-4/nang-cao']")).toHaveCount(0);
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
  await expect(row).toContainText("Điểm cao nhất · Số lần làm: hiện khi con đăng nhập");
  await expect(page.getByText("0 lần")).toHaveCount(0);
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
  expect(sandbox).not.toContain("allow-popups-to-escape-sandbox");
  // Phiếu phải ở tên miền KHÁC website
  const src = new URL((await frame.getAttribute("src")) ?? "");
  expect(src.origin).not.toBe(new URL(page.url()).origin);
  // Chỉ làm bài trên web: không có nút tải PDF / in bài
  await expect(page.getByRole("button", { name: "In bài" })).toHaveCount(0);
  await expect(page.getByText("Tải phiếu PDF")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Luyện tập", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cùng bài học" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cùng lớp học" })).toBeVisible();
});

test("bài Free dạng video: có khung video và phiếu luyện tập bên dưới", async ({ page }) => {
  await page.goto("/toan/lop-4/theo-tuan/tuan-1/video-bai-giang-1");
  await expect(page.getByText("Video bài giảng đang được cập nhật")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Luyện tập sau bài giảng" })).toBeVisible();
});

test("khách chưa đăng nhập: bài hiện khóa, KHÔNG có video/phiếu trong mã HTML trả về", async ({ page, request }) => {
  const path = "/toan/lop-4/theo-tuan/tuan-5/video-bai-giang-1";
  await page.goto(path);
  await expect(page.getByText("Đăng nhập để học bài này")).toBeVisible();
  await expect(page.locator("#bai-lam").getByRole("link", { name: "Tạo tài khoản miễn phí" })).toBeVisible();
  await expect(page.locator("iframe")).toHaveCount(0);
  // Kiểm tra cả mã HTML thô (không chỉ giao diện)
  const html = await (await request.get(path)).text();
  expect(html).not.toMatch(/<iframe/i);
  expect(html).not.toContain("youtube-nocookie.com/embed");
  // Cả dữ liệu điều hướng nội bộ (RSC) cũng không chứa link phiếu/video
  const rsc = await (await request.get(path, { headers: { RSC: "1" } })).text();
  expect(rsc).not.toContain("youtube-nocookie.com/embed");
  expect(rsc).not.toContain("toantieuhoccothanhmai.github.io");
});

test("link có #tuan-N mở đúng tuần; banner phiếu dẫn thẳng tới phiếu", async ({ page }) => {
  await page.goto("/toan/lop-4/theo-tuan#tuan-12");
  await expect(page.locator("#tuan-12")).toHaveAttribute("open", "");
  // Bấm đường dẫn "Tuần 5" từ trang bài học
  await page.goto("/toan/lop-4/theo-tuan/tuan-5/video-bai-giang-1");
  await page.getByRole("navigation", { name: "Đường dẫn" }).getByRole("link", { name: "Tuần 5" }).click();
  await expect(page.locator("#tuan-5")).toHaveAttribute("open", "");
  // Banner thứ 3
  await page.goto("/");
  await expect(page.locator("a[href='/toan/lop-4/theo-tuan/tuan-8/danh-gia-thang-10']").first()).toHaveCount(1);
});

test("nút Đến tuần hiện tại mở đúng tuần theo giờ Việt Nam", async ({ page }) => {
  // Giả lập đồng hồ trình duyệt: 23:30 giờ VN Chủ nhật 15/11/2026 → tuần 10 (09/11–15/11)
  await page.clock.setFixedTime(new Date("2026-11-15T16:30:00Z"));
  await page.goto("/toan/lop-4/theo-tuan");
  await page.getByRole("button", { name: "Đến tuần hiện tại" }).click();
  await expect(page.locator("#tuan-10")).toHaveAttribute("open", "");
  // 00:30 giờ VN thứ Hai 16/11 → tuần 11
  await page.clock.setFixedTime(new Date("2026-11-15T17:30:00Z"));
  await page.reload();
  await page.getByRole("button", { name: "Đến tuần hiện tại" }).click();
  await expect(page.locator("#tuan-11")).toHaveAttribute("open", "");
});

test("không có chữ trắng trên nền cam nhạt (tương phản thấp)", async ({ page }) => {
  for (const p of ["/", "/toan/lop-4/theo-tuan", "/gioi-thieu"]) {
    await page.goto(p);
    const bad = await page.locator(".text-white").evaluateAll((els) =>
      // Bảng màu cam–xanh: nền sáng không được có chữ trắng = brand-300/400/500 và accent-400/500
      els.filter((e) => /\b(bg|from|to)-(brand-(300|400|500)|accent-(400|500))\b/.test(e.className + " " + (e.parentElement?.className ?? ""))).length,
    );
    expect(bad, p).toBe(0);
  }
});

test("đường dẫn đoán bừa trả về 404, tiêu đề tab không gây hiểu nhầm", async ({ request, page }) => {
  await page.goto("/van/lop-4");
  await expect(page).toHaveTitle(/Không tìm thấy trang/);
  await page.goto("/toan/lop-6");
  await expect(page).toHaveTitle(/Không tìm thấy trang/);
  for (const p of ["/toan/lop-4/constructor", "/toan/lop-4/__proto__", "/toan/lop-6", "/tieng-viet/lop-1", "/toan/lop-4/theo-tuan/tuan-36/video-bai-giang-1", "/toan/lop-4/theo-tuan/tuan-1/khong-co", "/van/lop-4", "/toan/lop-4/ky-thi", "/toan/lop-4/on-tap-he/de-nang-cao/de-21"]) {
    expect((await request.get(p)).status(), p).toBe(404);
  }
});

test("tất cả trang bài học của cả 8 khóa theo tuần (Toán, Tiếng Việt lớp 2–5) đều mở được", async ({ page, request }) => {
  test.setTimeout(600_000);
  let total = 0;
  for (const mon of ["toan", "tieng-viet"]) {
    for (const lop of [2, 3, 4, 5]) {
      const course = `/${mon}/lop-${lop}/theo-tuan`;
      await page.goto(course);
      // Toán lớp 2–5 theo mathx: 35 tuần (lớp 5: 34 tuần) + 4 khối ôn tập; Tiếng Việt: 35 tuần
      const weeksExpected = mon === "toan" && lop === 5 ? 34 : 35;
      await expect(page.locator("details[id^=tuan-]"), course).toHaveCount(weeksExpected);
      const hrefs = await page.locator("details[id^=tuan-] a, details[id^=on-tap-] a").evaluateAll((as) => as.map((a) => a.getAttribute("href") ?? ""));
      expect(new Set(hrefs.map((h) => h.match(/tuan-(\d+)/)?.[1]).filter(Boolean)).size, course).toBe(weeksExpected);
      // Trang bài học dựng ở lần mở đầu (có đọc phiếu từ kho) → hỏi song song từng nhóm 12 trang
      for (let i = 0; i < hrefs.length; i += 12) {
        const batch = hrefs.slice(i, i + 12);
        const codes = await Promise.all(batch.map(async (h) => [h, (await request.get(h)).status()] as const));
        for (const [h, code] of codes) expect(code, h).toBe(200);
      }
      total += hrefs.length;
    }
  }
  // (đang tắt tải PDF nên không còn mục "Tài liệu in (PDF) của tuần")
  expect(total).toBeGreaterThan(1300);
  // Toán nâng cao theo chuyên đề: đang tạm khóa — trang khóa học và trang bài chỉ báo khóa, không có danh sách bài
  for (const lop of [2, 3, 4, 5]) {
    const course = `/toan/lop-${lop}/nang-cao`;
    await page.goto(course);
    await expect(page.getByText("Mục nâng cao đang tạm khóa")).toBeVisible();
    await expect(page.locator("details[id^=tuan-] a")).toHaveCount(0);
  }
});

test("chỉ làm bài trên web: không có nút/đường dẫn tải PDF, file PDF bị chặn", async ({ page, request }) => {
  await page.goto("/toan/lop-4/on-tap-he");
  await expect(page.getByText("Tải PDF")).toHaveCount(0);
  await expect(page.locator("a[href*='/pdf']")).toHaveCount(0);
  for (const p of ["/phieu/bai/t4-w1-luyen-tap-co-ban/pdf", "/phieu/00000000-0000-0000-0000-000000000000/pdf"]) {
    expect((await request.get(p)).status(), p).toBe(404);
  }
  // Mục "Tài liệu in (PDF) của tuần" không còn ở trang công khai
  await page.goto("/toan/lop-4/theo-tuan");
  await expect(page.getByText("Tài liệu in (PDF) của tuần")).toHaveCount(0);
});

test("các trang phụ mở được, không lỗi console", async ({ page }) => {
  const errors = trackErrors(page);
  for (const p of ["/gioi-thieu", "/tieng-viet", "/tai-lieu", "/huong-dan", "/thanh-toan", "/chinh-sach-rieng-tu", "/dieu-khoan"]) {
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
  expect(h["strict-transport-security"]).toContain("max-age=");
  // Chỉ cho nhúng: chính website ('self' — để nhúng phiếu cô tải lên qua /phieu, vốn bị cách ly bằng sandbox
  // không có allow-same-origin + header CSP sandbox), YouTube và tên miền phiếu — không có "https:" chung chung.
  expect(h["content-security-policy"]).toMatch(/frame-src 'self' https:\/\/www\.youtube-nocookie\.com https:\/\/toantieuhoccothanhmai\.github\.io;/);
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

test("đo tương phản màu thật bằng axe (chuẩn WCAG AA) trên các trang chính", async ({ page }) => {
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  for (const p of ["/", "/toan", "/toan/lop-4", "/toan/lop-4/theo-tuan", "/toan/lop-4/theo-tuan/tuan-5/video-bai-giang-1", "/gioi-thieu", "/de-thi", "/de-thi/toan", "/de-thi/toan/lop-4/danh-gia-nang-luc-thang-10", "/quan-tri/dang-nhap"]) {
    await page.goto(p);
    await page.getByRole("button", { name: "Tạm dừng" }).click({ timeout: 1000 }).catch(() => {});
    // Tắt nền chấm bi (rất mờ) và đầu trang dính, vì chúng khiến axe không xác định được màu nền
    // và bỏ qua phép đo (đã thử: khi không tắt, axe KHÔNG phát hiện chữ khó đọc cố ý chèn vào).
    await page.addStyleTag({ content: "body{background-image:none!important} header{position:static!important}" });
    // Chỉ đo giao diện website; nội dung BÊN TRONG khung phiếu (file của cô) không thuộc phạm vi này.
    const r = await new AxeBuilder({ page }).withRules(["color-contrast"]).exclude("iframe").analyze();
    const issues = r.violations.flatMap((v) => v.nodes.map((n) => `${p}: ${n.target.join(" ")} — ${n.failureSummary?.split("\n")[1] ?? ""}`));
    expect(issues, issues.join("\n")).toEqual([]);
  }
});

test("khu Đề thi: theo môn → lớp → làm đề Free trong khung cách ly", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/de-thi");
  await page.getByRole("link", { name: /Đề thi Toán/ }).click();
  await expect(page).toHaveURL(/\/de-thi\/toan$/);
  for (const g of [2, 3, 4, 5]) await expect(page.getByRole("heading", { name: `Lớp ${g}` })).toBeVisible();
  // Lớp chưa có đề hiện thông báo, không bịa đề
  await expect(page.getByText("Cô Thanh Mai đang cập nhật đề cho lớp này.").first()).toBeVisible();
  await page.getByRole("link", { name: "Toán lớp 4 – Đánh giá năng lực tháng 10" }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Toán lớp 4 – Đánh giá năng lực tháng 10");
  const frame = page.locator("iframe[title='Toán lớp 4 – Đánh giá năng lực tháng 10']");
  await expect(frame).toHaveAttribute("sandbox", /allow-scripts/);
  expect((await frame.getAttribute("sandbox")) ?? "").not.toContain("allow-top-navigation");
  // Đề chưa có link: hiện "đang soạn", không có iframe
  await page.goto("/de-thi/tieng-viet/lop-5/giua-ki-1-de-1-bai-ca-ve-trai-dat");
  await expect(page.getByText("Phiếu bài tập đang được cô soạn")).toBeVisible();
  await expect(page.locator("iframe")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("khu Đề thi: đường dẫn sai trả 404; trang quản trị bắt đăng nhập", async ({ page, request }) => {
  for (const p of ["/de-thi/van", "/de-thi/toan/lop-6", "/de-thi/toan/lop-4/khong-co", "/de-thi/toan/lop-5/danh-gia-nang-luc-thang-10"]) {
    expect((await request.get(p)).status(), p).toBe(404);
  }
  for (const p of ["/quan-tri", "/quan-tri/tai-de", "/quan-tri/de/5644eb66-6ca4-466e-92dc-c1b58e7ee6de", "/quan-tri/bai-hoc", "/quan-tri/bai-hoc/toan-4-theo-tuan/t4-w5-luyen-tap-co-ban"]) {
    await page.goto(p);
    await expect(page, p).toHaveURL(/\/quan-tri\/dang-nhap$/);
  }
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Đăng nhập quản trị");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("file đề /phieu: mã sai hoặc đề không có file → 404, không lộ thông tin", async ({ request }) => {
  for (const p of ["/phieu/abc", "/phieu/00000000-0000-0000-0000-000000000000", "/phieu/5644eb66-6ca4-466e-92dc-c1b58e7ee6de", "/phieu/bf08aa1f-dd74-497e-8d5f-1c38a30345bf",
    "/phieu/5644eb66-6ca4-466e-92dc-c1b58e7ee6de/pdf", "/phieu/bai/t4-w5-luyen-tap-co-ban", "/phieu/bai/t4-w5-luyen-tap-co-ban/pdf", "/phieu/bai/..%2Fx", "/phieu/bai/T4"]) {
    const r = await request.get(p);
    expect(r.status(), p).toBe(404);
    expect(r.headers()["cache-control"]).toContain("no-store");
  }
});

test("nút Đăng nhập trên menu mở khung đăng nhập có nút Tạo tài khoản", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Menu" }).click();
  await page.locator("#mobile-menu").getByRole("link", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/dang-nhap$/);
  await expect(page.getByRole("tab", { name: "Tạo tài khoản" })).toBeVisible();
  await page.getByRole("tab", { name: "Tạo tài khoản" }).click();
  await expect(page.getByRole("button", { name: "Tạo tài khoản miễn phí" })).toBeVisible();
  await expect(page.getByLabel("Họ tên phụ huynh")).toBeVisible();
  await expect(page.getByLabel("Số điện thoại hoặc email")).toBeVisible();
});

test("Đề ôn tập hè: có ở cả Toán và Tiếng Việt mọi lớp, mỗi khóa 20 đề cơ bản + 20 đề nâng cao", async ({ page }) => {
  for (const mon of ["toan", "tieng-viet"]) {
    for (const g of [2, 5]) {
      await page.goto(`/${mon}/lop-${g}`);
      await page.getByRole("link", { name: /Đề ôn tập hè/ }).click();
      await expect(page).toHaveURL(new RegExp(`/${mon}/lop-${g}/on-tap-he$`));
      await expect(page.getByRole("heading", { level: 1 })).toContainText(`lớp ${g}`);
      await expect(page.getByText(/^Đề \d+$/)).toHaveCount(40);
      await expect(page.getByRole("heading", { name: "Đề cơ bản" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Đề nâng cao" })).toBeVisible();
    }
  }
});

test("trang tài khoản: chưa đăng nhập thì chuyển về đăng nhập", async ({ page }) => {
  await page.goto("/tai-khoan");
  await expect(page).toHaveURL(/\/dang-nhap\?next=%2Ftai-khoan$|\/dang-nhap\?next=\/tai-khoan$/);
});
