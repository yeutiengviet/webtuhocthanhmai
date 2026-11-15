import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: { default: site.name, template: `%s | ${site.name}` },
  description: "Học online Toán và Tiếng Việt lớp 2–5 theo sách Kết nối tri thức với cuộc sống.",
  // Bản dùng thử: không cho công cụ tìm kiếm lập chỉ mục
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#b91c1c",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className="flex min-h-screen flex-col antialiased">
        <a href="#noi-dung" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-3">
          Bỏ qua menu
        </a>
        <SiteHeader />
        <main id="noi-dung" className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
