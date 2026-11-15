// Biểu tượng và hình minh họa vẽ bằng SVG (tự vẽ, nhẹ, sắc nét trên mọi màn hình).

type IconName = "play" | "pencil" | "doc" | "timer" | "lock" | "star" | "book" | "check" | "arrow" | "spark" | "users" | "chart" | "gift" | "menu" | "close";

const PATHS: Record<IconName, React.ReactNode> = {
  play: <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" fill="currentColor" stroke="none" />,
  pencil: <><path d="M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" /><path d="M13.5 7.5l3 3" /></>,
  doc: <><path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></>,
  timer: <><circle cx="12" cy="13" r="7.5" /><path d="M12 9.5V13l2.5 2M10 2.5h4" /></>,
  lock: <><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /></>,
  star: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z" fill="currentColor" stroke="none" />,
  book: <><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5v-15Z" /><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5v-15Z" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  arrow: <path d="M5 12h13M13 6l6 6-6 6" />,
  spark: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5" /></>,
  chart: <path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6" />,
  gift: <><rect x="3.5" y="9" width="17" height="11" rx="1.5" /><path d="M2.5 9h19v-.5a1.5 1.5 0 0 0-1.5-1.5H4a1.5 1.5 0 0 0-1.5 1.5V9ZM12 7v13M12 7S10.5 3 8 3.5 7 7 12 7Zm0 0s1.5-4 4-3.5S17 7 12 7Z" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
};

export function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {PATHS[name]}
    </svg>
  );
}

/** Minh họa trang chủ: chồng sách, bút chì, con số, ngôi sao. */
export function HeroArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 260" className={className} aria-hidden>
      <ellipse cx="160" cy="236" rx="120" ry="14" fill="#fed7aa" opacity="0.7" />
      {/* Sách dưới */}
      <rect x="62" y="176" width="196" height="46" rx="10" fill="#1d4ed8" />
      <rect x="62" y="176" width="196" height="12" rx="6" fill="#3b82f6" />
      <rect x="74" y="196" width="172" height="18" rx="4" fill="#eff6ff" />
      {/* Sách giữa */}
      <rect x="82" y="134" width="170" height="44" rx="10" fill="#f97316" />
      <rect x="82" y="134" width="170" height="12" rx="6" fill="#fb923c" />
      <rect x="94" y="152" width="146" height="18" rx="4" fill="#fff7ed" />
      {/* Sách trên mở */}
      <path d="M160 128 C130 108 96 108 70 116 L70 62 C96 54 130 54 160 74 Z" fill="#fff" stroke="#9a3412" strokeWidth="4" strokeLinejoin="round" />
      <path d="M160 128 C190 108 224 108 250 116 L250 62 C224 54 190 54 160 74 Z" fill="#fff" stroke="#9a3412" strokeWidth="4" strokeLinejoin="round" />
      <path d="M160 74 V128" stroke="#9a3412" strokeWidth="4" />
      <text x="114" y="104" textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontWeight="800" fontSize="30" fill="#c2410c">1+2</text>
      <text x="206" y="104" textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontWeight="800" fontSize="30" fill="#1d4ed8">Aa</text>
      {/* Bút chì */}
      <g transform="rotate(-28 268 150)">
        <rect x="252" y="96" width="22" height="96" rx="3" fill="#facc15" />
        <rect x="252" y="96" width="22" height="14" rx="3" fill="#fb7185" />
        <rect x="252" y="108" width="22" height="6" fill="#d1d5db" />
        <path d="M252 192 L263 214 L274 192 Z" fill="#fde68a" />
        <path d="M259 206 L263 214 L267 206 Z" fill="#374151" />
      </g>
      {/* Ngôi sao, chấm vui */}
      <path className="animate-float" d="M48 40l6 12 13 2-9.5 9 2.3 13L48 70l-11.8 6 2.3-13L29 54l13-2Z" fill="#facc15" />
      <path className="animate-float" style={{ animationDelay: "1.2s" }} d="M282 28l4 8 9 1.3-6.5 6.3 1.5 8.9-8-4.2-8 4.2 1.5-8.9-6.5-6.3 9-1.3Z" fill="#fb923c" />
      <circle cx="30" cy="150" r="7" fill="#60a5fa" />
      <circle cx="300" cy="96" r="6" fill="#34d399" />
      <circle cx="40" cy="206" r="5" fill="#f97316" />
    </svg>
  );
}

/** Hình nhỏ cho ô môn Toán. */
export function MathArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      <circle cx="60" cy="60" r="54" fill="#fff" opacity="0.25" />
      <rect x="22" y="26" width="34" height="34" rx="10" fill="#fff" />
      <text x="39" y="53" textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontWeight="800" fontSize="28" fill="#c2410c">+</text>
      <rect x="64" y="26" width="34" height="34" rx="10" fill="#fde68a" />
      <text x="81" y="53" textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontWeight="800" fontSize="28" fill="#9a3412">×</text>
      <rect x="22" y="66" width="34" height="34" rx="10" fill="#fde68a" />
      <text x="39" y="93" textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontWeight="800" fontSize="28" fill="#9a3412">−</text>
      <rect x="64" y="66" width="34" height="34" rx="10" fill="#fff" />
      <text x="81" y="93" textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontWeight="800" fontSize="28" fill="#c2410c">÷</text>
    </svg>
  );
}

/** Hình nhỏ cho ô môn Tiếng Việt. */
export function VietArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      <circle cx="60" cy="60" r="54" fill="#fff" opacity="0.25" />
      <path d="M60 92 C46 82 30 82 18 86 V36 C30 32 46 32 60 42 Z" fill="#fff" />
      <path d="M60 92 C74 82 90 82 102 86 V36 C90 32 74 32 60 42 Z" fill="#dbeafe" />
      <text x="40" y="70" textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontWeight="800" fontSize="24" fill="#1e40af">Ă</text>
      <text x="81" y="70" textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontWeight="800" fontSize="24" fill="#1e40af">ơ</text>
      <path d="M92 18l3 6 6.5 1-4.7 4.5 1.1 6.5-5.9-3.1-5.9 3.1 1.1-6.5L82.5 25l6.5-1Z" fill="#facc15" />
    </svg>
  );
}
