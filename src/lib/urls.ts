// Kiểm tra đường dẫn do người quản trị nhập (video, phiếu, tài liệu, số điện thoại).
// File thuần, không chứa dữ liệu khóa học — dùng được ở cả máy chủ và trình duyệt.

/**
 * Các tên miền được phép nhúng phiếu bài tập HTML.
 * QUY TẮC AN TOÀN: phiếu chạy trong iframe có allow-scripts + allow-same-origin,
 * nên phiếu TUYỆT ĐỐI không được nằm cùng tên miền với website (nếu cùng, phiếu thoát được sandbox).
 * Khi thêm kho phiếu riêng (Giai đoạn 2), thêm tên miền tách riêng của kho đó vào đây và vào CSP (next.config.ts).
 */
export const WORKSHEET_HOSTS = ["toantieuhoccothanhmai.github.io"] as const;

/** Tên miền của chính website — không bao giờ được dùng làm nguồn phiếu. */
export const SITE_HOSTS = ["hocgioithanhmai.com", "localhost"];

function isSiteHost(host: string): boolean {
  return SITE_HOSTS.some((h) => host === h || host.endsWith("." + h)) || host.endsWith(".vercel.app");
}

/** Trích mã video YouTube từ link hoặc mã trần; trả null nếu không hợp lệ. */
export function youtubeId(ref: string | null): string | null {
  if (!ref) return null;
  const trimmed = ref.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const u = new URL(trimmed);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = u.pathname.slice(1);
    else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      id = u.searchParams.get("v") ?? u.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1] ?? null;
    }
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

/** Phiếu: chỉ https, chỉ tên miền trong danh sách cho phép, không bao giờ cùng tên miền website. */
export function safeWorksheetUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" || u.username || u.password) return null;
    const host = u.hostname.toLowerCase();
    if (isSiteHost(host)) return null;
    if (!(WORKSHEET_HOSTS as readonly string[]).includes(host)) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/** Tài liệu tải về (PDF/Word): chỉ https. */
export function safeDocumentUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/** Số điện thoại cho link tel: — chỉ giữ chữ số và dấu + ở đầu. */
export function telHref(phone: string): string | null {
  const digits = phone.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
  return /^\+?\d{8,15}$/.test(digits) ? `tel:${digits}` : null;
}
