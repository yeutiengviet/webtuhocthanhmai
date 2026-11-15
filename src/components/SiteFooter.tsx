import Link from "next/link";
import { site } from "@/data/site";

export function SiteFooter() {
  return (
    <footer className="no-print mt-12 bg-gray-900 text-gray-200">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="text-lg font-bold text-white">{site.name}</p>
          <p className="mt-2 text-sm">Học online Toán và Tiếng Việt tiểu học, bám sát sách Kết nối tri thức với cuộc sống.</p>
        </div>
        <div>
          <p className="font-semibold text-white">Liên hệ</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li>Hotline/Zalo: {site.hotline ?? "đang cập nhật"}</li>
            <li>Website: {site.domain}</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white">Chính sách</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li><Link className="hover:underline" href="/huong-dan">Hướng dẫn học</Link></li>
            <li><Link className="hover:underline" href="/thanh-toan">Hướng dẫn nộp phí</Link></li>
            <li><Link className="hover:underline" href="/chinh-sach-rieng-tu">Chính sách quyền riêng tư</Link></li>
            <li><Link className="hover:underline" href="/dieu-khoan">Điều khoản sử dụng</Link></li>
          </ul>
        </div>
      </div>
      <p className="border-t border-gray-800 py-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} {site.name}. Bản dùng thử.
      </p>
    </footer>
  );
}
