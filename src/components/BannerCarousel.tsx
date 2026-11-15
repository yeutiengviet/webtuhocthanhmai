"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface Banner {
  title: string;
  text: string;
  href: string;
}

// Màu nền đủ đậm để chữ trắng đạt tương phản WCAG AA (≥ 4.5:1) trên toàn dải màu.
const BG = ["from-brand-600 to-brand-700", "from-accent-600 to-accent-700", "from-brand-700 to-accent-600"];
const ART = ["📘", "🎁", "✏️"];

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
      <div ref={ref} onScroll={onScroll} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-[2rem] shadow-lg shadow-brand-900/10">
        {banners.map((b, i) => (
          <Link
            key={b.href + i}
            href={b.href}
            className={`relative flex min-h-44 w-full shrink-0 snap-center flex-col justify-center overflow-hidden bg-gradient-to-br p-6 pr-24 text-white sm:min-h-56 sm:p-10 sm:pr-48 ${BG[i % BG.length]}`}
            aria-label={`${b.title}. ${b.text}`}
          >
            <span aria-hidden className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" />
            <span aria-hidden className="absolute -bottom-10 right-16 h-24 w-24 rounded-full bg-white/10" />
            <span aria-hidden className="absolute right-5 top-1/2 -translate-y-1/2 text-6xl drop-shadow sm:right-14 sm:text-8xl">{ART[i % ART.length]}</span>
            <span className="relative font-display text-2xl font-extrabold sm:text-4xl">{b.title}</span>
            <span className="relative mt-1 text-base font-semibold sm:text-xl">{b.text}</span>
            <span className="relative mt-4 inline-block w-fit rounded-full bg-white px-4 py-2 text-sm font-extrabold text-brand-700 shadow">Xem ngay →</span>
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
            <span className={`block h-3 rounded-full border-2 border-brand-600 transition-all ${i === index ? "w-8 bg-brand-600" : "w-3 bg-white"}`} />
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className="ml-1 min-h-11 rounded-full px-3 text-sm font-bold text-brand-700 underline"
          aria-pressed={paused}
        >
          {paused ? "Chạy tiếp" : "Tạm dừng"}
        </button>
      </div>
    </section>
  );
}
