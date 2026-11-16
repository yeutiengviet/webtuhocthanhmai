// ĐỀ ÔN TẬP HÈ — Toán và Tiếng Việt lớp 2–5.
// Mỗi khóa có một mục "Đề ôn tập hè" gồm 2 phần, mỗi phần SO_DE_ON_HE đề:
//   • Đề cơ bản  (mã cũ "t3-he-de-5" — giữ nguyên để phiếu đã tải không bị mất), đường dẫn …/on-tap-he/de-co-ban/de-5
//   • Đề nâng cao (mã "t3-he-nc-de-5"), đường dẫn …/on-tap-he/de-nang-cao/de-5
// Cô tải lên cho từng đề:
//   • phiếu tương tác (.html) — con làm và chấm điểm ngay trên web;
//   • phiếu PDF — phụ huynh tải về in cho con làm.
// Tải ở Trang quản trị → Phiếu bài học → "… – Ôn tập hè" (tải từng đề hoặc tải hàng loạt, tên file có số đề và "cơ bản"/"nâng cao", vd "Đề 3 cơ bản", "de 12 NC").
// Muốn thêm đề: tăng SO_DE_ON_HE (mã đề cũ giữ nguyên nên phiếu đã tải không bị mất).

import "server-only";
import type { Course, Item, Level, SubjectSlug, Week } from "@/lib/types";

export const SO_DE_ON_HE = 20;

const CODE: Record<SubjectSlug, string> = { toan: "t", "tieng-viet": "tv" };

const PHAN: { level: Level; code: string; slug: string; label: string; name: string }[] = [
  { level: "co-ban", code: "", slug: "de-co-ban", label: "Đề cơ bản", name: "cơ bản" },
  { level: "nang-cao", code: "nc-", slug: "de-nang-cao", label: "Đề nâng cao", name: "nâng cao" },
];

export function buildOnTapHe(subject: SubjectSlug, grade: 2 | 3 | 4 | 5): Course {
  const subjectName = subject === "toan" ? "Toán" : "Tiếng Việt";
  const next = grade === 5 ? "lớp 6" : `lớp ${grade + 1}`;
  const weeks: Week[] = PHAN.map((p, idx) => {
    const items: Item[] = Array.from({ length: SO_DE_ON_HE }, (_, i) => {
      const k = i + 1;
      return {
        id: `${CODE[subject]}${grade}-he-${p.code}de-${k}`,
        slug: `de-${k}`,
        type: "test",
        title: `Đề ôn tập hè ${subjectName} lớp ${grade} – ${p.label} ${k}`,
        level: p.level,
        order: k,
        isFree: true,
        videoProvider: null,
        videoRef: null,
        url: null,
      };
    });
    return {
      id: `${CODE[subject]}${grade}-he-${p.level}`,
      number: idx + 1,
      slug: p.slug,
      label: p.label,
      startDate: "2027-06-07",
      endDate: "2027-08-29",
      title: `${SO_DE_ON_HE} đề ${p.name} – ôn hè ${subjectName} lớp ${grade}, chuẩn bị lên ${next}`,
      kind: "hoc",
      published: true,
      items,
    };
  });
  return {
    id: `${subject}-${grade}-on-tap-he`,
    subject,
    grade,
    track: "on-tap-he",
    textbook: "ket-noi-tri-thuc",
    title: `${subjectName} lớp ${grade} – Đề ôn tập hè`,
    weeks,
  };
}

export const ON_TAP_HE: Course[] = (["toan", "tieng-viet"] as const).flatMap((s) => ([2, 3, 4, 5] as const).map((g) => buildOnTapHe(s, g)));
