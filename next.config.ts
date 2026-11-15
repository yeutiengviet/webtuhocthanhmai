import type { NextConfig } from "next";
import { WORKSHEET_HOSTS } from "./src/lib/urls";

const isDev = process.env.NODE_ENV !== "production";

// Chính sách bảo mật nội dung (CSP):
// - Website không cho trang khác nhúng mình (frame-ancestors 'none') — chống lừa bấm (clickjacking).
// - Chỉ cho nhúng video YouTube (nocookie) và phiếu từ các tên miền phiếu được phép (WORKSHEET_HOSTS),
//   KHÔNG cho nhúng chính website (lớp bảo vệ thứ hai, cùng với safeWorksheetUrl).
// - 'unsafe-inline' cho script là đánh đổi để trang dựng tĩnh; Giai đoạn 3 (có đăng nhập, trang động) sẽ chuyển sang nonce.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self'" + (isDev ? " ws:" : ""),
  `frame-src https://www.youtube-nocookie.com ${WORKSHEET_HOSTS.map((h) => `https://${h}`).join(" ")}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
