"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface Banner {
  title: string;
  text: string;
  href: string;
}

const BG = ["from-brand-700 to-brand-500", "from-accent-600 to-accent-400", "from-brand-600 to-accent-500"];

// Banner chạy nhiều slide. Dùng cuộn ngang có "snap" của trình duyệt — vuốt được trên điện thoại,
// tự chuyển slide mỗi 5 giây (dừng khi người dùng bật chế độ giảm chuyển động).
export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      const el = ref.current;
      if (!el) return;
      const next = (Math.round(el.scrollLeft / el.clientWidth) + 1) % banners.length;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    }, 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  const onScroll = () => {
    const el = ref.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  const goTo = (i: number) => {
    const el = ref.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div
        ref={ref}
        onScroll={onScroll}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-2xl"
        aria-roledescription="carousel"
        aria-label="Banner"
      >
        {banners.map((b, i) => (
          <Link
            key={b.href + i}
            href={b.href}
            className={`flex min-h-40 w-full shrink-0 snap-center flex-col justify-center bg-gradient-to-r p-6 text-white sm:min-h-56 sm:p-10 ${BG[i % BG.length]}`}
            aria-label={`${b.title}. ${b.text}`}
          >
            <span className="text-2xl font-bold sm:text-4xl">{b.title}</span>
            <span className="mt-2 text-base sm:text-xl">{b.text}</span>
            <span className="mt-4 inline-block w-fit rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-700">Xem ngay →</span>
          </Link>
        ))}
      </div>
      <div className="mt-3 flex justify-center gap-2">
        {banners.map((b, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Chuyển đến banner ${i + 1}`}
            aria-current={i === index}
            className={`h-3 rounded-full transition-all ${i === index ? "w-8 bg-brand-600" : "w-3 bg-brand-200"}`}
          />
        ))}
      </div>
    </div>
  );
}
