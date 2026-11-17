"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/art";
import { Logo } from "@/components/Logo";
import { features, site } from "@/data/site";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { supabaseEnv } from "@/lib/supabase/env";
import { telHref } from "@/lib/urls";

export const MAIN_MENU = [
  { href: "/gioi-thieu", label: "Giới thiệu", emoji: "👩‍🏫" },
  { href: "/toan", label: "Toán", emoji: "🔢" },
  { href: "/tieng-viet", label: "Tiếng Việt", emoji: "📖" },
  { href: "/de-thi", label: "Đề thi", emoji: "📝" },
  ...(features.allowPdfDownload ? [{ href: "/tai-lieu", label: "Tài liệu", emoji: "📚" }] : []),
];

/** Đã đăng nhập chưa (chỉ để đổi nút "Đăng nhập" ↔ "Tài khoản"; quyền xem bài vẫn do máy chủ kiểm tra). */
function useLoggedIn(): boolean {
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => {
    if (!supabaseEnv() || !document.cookie.includes("sb-")) return;
    const supabase = createSupabaseBrowser();
    supabase.auth.getSession().then(({ data }) => setLoggedIn(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setLoggedIn(Boolean(session)));
    return () => data.subscription.unsubscribe();
  }, []);
  return loggedIn;
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const loggedIn = useLoggedIn();
  const account = loggedIn ? { href: "/tai-khoan", label: "Tài khoản" } : { href: "/dang-nhap", label: "Đăng nhập" };
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const tel = site.hotline ? telHref(site.hotline) : null;

  return (
    <header className="no-print sticky top-0 z-40 border-b-2 border-brand-100 bg-white/95 backdrop-blur">
      {/* Thanh trên cùng */}
      <div className="bg-accent-600 text-sm font-semibold text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-1">
          <nav className="flex shrink-0 gap-4 whitespace-nowrap" aria-label="Liên kết nhanh">
            <Link href="/huong-dan" className="py-1 hover:underline">Hướng dẫn</Link>
            {!loggedIn && <Link href="/dang-nhap?tab=dang-ky" className="py-1 hover:underline">Tạo tài khoản</Link>}
          </nav>
          <div className="truncate">
            {site.hotline && tel ? (
              <a href={tel} className="hover:underline">📞 {site.hotline}</a>
            ) : (
              <span>📞 Zalo: đang cập nhật</span>
            )}
          </div>
        </div>
      </div>

      {/* Menu chính */}
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Menu chính">
          {MAIN_MENU.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className={`rounded-full px-3 py-2 font-bold transition ${isActive(m.href) ? "bg-brand-100 text-brand-700" : "text-gray-700 hover:bg-brand-50 hover:text-brand-700"}`}
            >
              {m.label}
            </Link>
          ))}
          <Link href={account.href} className="btn-toy ml-2 rounded-full bg-brand-600 px-5 py-2 font-extrabold text-white">
            {account.label}
          </Link>
        </nav>
        <button
          type="button"
          className="flex min-h-11 items-center gap-1.5 rounded-full bg-brand-50 px-4 font-extrabold text-brand-700 ring-2 ring-brand-200 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <Icon name={open ? "close" : "menu"} className="h-5 w-5" />
          {open ? "Đóng" : "Menu"}
        </button>
      </div>

      {open && (
        <nav id="mobile-menu" className="border-t-2 border-brand-100 bg-white lg:hidden" aria-label="Menu chính (điện thoại)">
          <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-2 px-4 py-3">
            {MAIN_MENU.map((m) => (
              <li key={m.href}>
                <Link
                  href={m.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 rounded-2xl px-4 py-3 font-bold ring-2 ${isActive(m.href) ? "bg-brand-50 text-brand-700 ring-brand-300" : "ring-gray-100"}`}
                >
                  <span aria-hidden className="text-xl">{m.emoji}</span>
                  {m.label}
                </Link>
              </li>
            ))}
            <li className="col-span-2">
              <Link href={account.href} onClick={() => setOpen(false)} className="btn-toy block rounded-2xl bg-brand-600 px-4 py-3 text-center font-extrabold text-white">
                {account.label}
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
