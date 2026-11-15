"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface Banner {
  title: string;
  text: string;
  href: string;
}

// Màu nền đủ đậm để chữ trắng đạt tương phản WCAG AA (≥ 4.5:1) trên toàn dải màu.
const BG = ["from-brand-800 to-brand-600", "from-accent-700 to-brand-700", "from-brand-700 to-accent-700"];

// Banner chạy nhiều slide: vuốt được trên điện thoại, tự chuyển mỗi 6 giây.
// Tự dừng khi: người dùng bấm "Tạm dừng", đang chạm/rê chuột/focus vào banner, hoặc bật chế độ giảm chuyển động.
export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    if (paused || hovering || banners.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      const el = ref.current;
      if (!el) return;
      const next = (Math.round(el.scrollLeft / el.clientWidth) + 1) % banners.length;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    }, 6000);
    return () => clearInterval(t);
  }, [paused, hovering, banners.length]);

  const onScroll = () => {
    const el = ref.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  const goTo = (i: number) => {
    const el = ref.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  return (
    <section
      className="relative"
      role="region"
      aria-roledescription="carousel"
      aria-label="Banner"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={() => setHovering(false)}
      onTouchStart={() => setHovering(true)}
      onTouchEnd={() => setHovering(false)}
    >
      <div ref={ref} onScroll={onScroll} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-2xl">
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
      <div className="mt-1 flex items-center justify-center">
        {banners.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Chuyển đến banner ${i + 1}`}
            aria-current={i === index}
            className="grid h-11 w-11 place-items-center"
          >
            <span className={`block h-3 rounded-full border-2 border-brand-700 transition-all ${i === index ? "w-8 bg-brand-700" : "w-3 bg-white"}`} />
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className="ml-1 min-h-11 rounded-full px-3 text-sm font-semibold text-brand-700 underline"
          aria-pressed={paused}
        >
          {paused ? "Chạy tiếp" : "Tạm dừng"}
        </button>
      </div>
    </section>
  );
}
