"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { site } from "@/data/site";
import { telHref } from "@/lib/urls";

export const MAIN_MENU = [
  { href: "/gioi-thieu", label: "Giới thiệu" },
  { href: "/hoc-thu", label: "Học thử" },
  { href: "/toan", label: "Toán" },
  { href: "/tieng-viet", label: "Tiếng Việt" },
  { href: "/ky-thi", label: "Kỳ thi" },
  { href: "/tai-lieu", label: "Tài liệu" },
  { href: "/hoc-sinh", label: "Học sinh" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="no-print sticky top-0 z-40 bg-white shadow-sm">
      {/* Thanh trên cùng */}
      <div className="bg-brand-700 text-sm text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-1.5">
          <nav className="flex gap-4" aria-label="Liên kết nhanh">
            <Link href="/huong-dan" className="py-1 hover:underline">Hướng dẫn</Link>
            <Link href="/thanh-toan" className="py-1 hover:underline">Thanh toán</Link>
          </nav>
          <div className="truncate">
            {site.hotline && telHref(site.hotline) ? (
              <a href={telHref(site.hotline)!} className="font-semibold hover:underline">
                Hotline/Zalo: {site.hotline}
              </a>
            ) : (
              <span className="opacity-90">Hotline/Zalo: đang cập nhật</span>
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
              className={`rounded-lg px-3 py-2 font-medium hover:bg-brand-50 ${isActive(m.href) ? "text-brand-700" : "text-gray-800"}`}
            >
              {m.label}
            </Link>
          ))}
          <Link href="/dang-nhap" className="ml-2 rounded-full bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700">
            Đăng nhập
          </Link>
        </nav>
        <button
          type="button"
          className="rounded-lg border border-brand-200 px-3 py-2 font-semibold text-brand-700 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Đóng" : "Menu"}
        </button>
      </div>

      {open && (
        <nav id="mobile-menu" className="border-t border-brand-100 bg-white lg:hidden" aria-label="Menu chính (điện thoại)">
          <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-2 px-4 py-3">
            {MAIN_MENU.map((m) => (
              <li key={m.href}>
                <Link
                  href={m.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-xl border px-4 py-3 font-medium ${isActive(m.href) ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-200"}`}
                >
                  {m.label}
                </Link>
              </li>
            ))}
            <li className="col-span-2">
              <Link href="/dang-nhap" onClick={() => setOpen(false)} className="block rounded-xl bg-brand-600 px-4 py-3 text-center font-semibold text-white">
                Đăng nhập
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
