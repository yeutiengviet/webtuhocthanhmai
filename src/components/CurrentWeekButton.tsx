"use client";

import { useEffect } from "react";
import { pickCurrentWeek, todayInVietnam } from "@/lib/dates";

function openAndScroll(id: string, smooth = true) {
  const el = document.getElementById(id);
  if (el instanceof HTMLDetailsElement) el.open = true;
  el?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
}

/** Nút "Đến tuần hiện tại": tính theo ngày giờ Việt Nam trên máy người xem. */
export function CurrentWeekButton({ weeks }: { weeks: { number: number; startDate: string; endDate: string }[] }) {
  if (weeks.length === 0) return null;
  const go = () => {
    const target = pickCurrentWeek(weeks, todayInVietnam());
    if (target) openAndScroll(`tuan-${target.number}`);
  };
  return (
    <button type="button" onClick={go} className="min-h-11 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow hover:bg-accent-50">
      Đến tuần hiện tại
    </button>
  );
}

/** Mở đúng tuần khi đường dẫn có dạng ...#tuan-8 (từ banner, đường dẫn "Tuần 8"…). */
export function OpenWeekFromHash() {
  useEffect(() => {
    const apply = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (/^tuan-\d+$/.test(id)) openAndScroll(id, false);
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);
  return null;
}
