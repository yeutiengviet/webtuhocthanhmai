"use client";

import { todayInVietnam } from "@/lib/dates";

/** Nút "Đến tuần hiện tại": tính theo ngày giờ Việt Nam trên máy người xem. */
export function CurrentWeekButton({ weeks }: { weeks: { number: number; startDate: string; endDate: string }[] }) {
  const go = () => {
    const today = todayInVietnam();
    let target = weeks.find((w) => w.startDate <= today && today <= w.endDate);
    if (!target) target = today < weeks[0].startDate ? weeks[0] : weeks.filter((w) => w.startDate <= today).at(-1) ?? weeks[0];
    const el = document.getElementById(`tuan-${target.number}`);
    if (el instanceof HTMLDetailsElement) el.open = true;
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <button type="button" onClick={go} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow hover:bg-accent-50">
      Đến tuần hiện tại
    </button>
  );
}
