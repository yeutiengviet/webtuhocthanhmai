import Link from "next/link";
import { site } from "@/data/site";

export function SiteFooter() {
  return (
    <footer className="no-print mt-16">
      {/* Đường lượn sóng chuyển sang chân trang */}
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="block h-8 w-full sm:h-12" aria-hidden>
        <path d="M0 30 C240 60 480 0 720 30 C960 60 1200 0 1440 30 V60 H0 Z" fill="#1e3a8a" />
      </svg>
      <div className="bg-[#1e3a8a] text-blue-50">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
          <div>
            <p className="font-display text-2xl text-white">{site.name}</p>
            <p className="mt-2 text-sm">Học online Toán và Tiếng Việt tiểu học, bám sát sách Kết nối tri thức với cuộc sống.</p>
          </div>
          <div>
            <p className="font-display text-lg text-brand-300">Liên hệ</p>
            <ul className="mt-2 space-y-1 text-sm">
              <li>📞 Hotline/Zalo: {site.hotline ?? "đang cập nhật"}</li>
              {site.zalo && (
                <li>
                  <a className="inline-block py-2 font-bold hover:underline" href={`https://zalo.me/${site.zalo.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">💬 Nhắn Zalo cho cô</a>
                </li>
              )}
              {site.domain && <li>🌐 {site.domain}</li>}
            </ul>
          </div>
          <div>
            <p className="font-display text-lg text-brand-300">Chính sách</p>
            <ul className="mt-1 text-sm [&_a]:block [&_a]:py-2">
              <li><Link className="hover:underline" href="/huong-dan">Hướng dẫn học</Link></li>
              <li><Link className="hover:underline" href="/dang-nhap?tab=dang-ky">Tạo tài khoản miễn phí</Link></li>
              <li><Link className="hover:underline" href="/chinh-sach-rieng-tu">Chính sách quyền riêng tư</Link></li>
              <li><Link className="hover:underline" href="/dieu-khoan">Điều khoản sử dụng</Link></li>
            </ul>
          </div>
        </div>
        <p className="border-t border-blue-800 py-4 text-center text-xs text-blue-200">© {site.name}.</p>
      </div>
    </footer>
  );
}
