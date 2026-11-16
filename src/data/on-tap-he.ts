// ĐỀ ÔN TẬP HÈ — Toán và Tiếng Việt lớp 2–5.
// Mỗi khóa có một mục "Đề ôn tập hè" gồm SO_DE_ON_HE đề. Cô tải lên cho từng đề:
//   • phiếu tương tác (.html) — con làm và chấm điểm ngay trên web;
//   • phiếu PDF — phụ huynh tải về in cho con làm.
// Tải ở Trang quản trị → Phiếu bài học → "… – Ôn tập hè" (tải từng đề hoặc tải hàng loạt, tên file có "Đề 3", "de 12"…).
// Muốn thêm đề: tăng SO_DE_ON_HE (mã đề cũ giữ nguyên nên phiếu đã tải không bị mất).

import "server-only";
import type { Course, Item, SubjectSlug } from "@/lib/types";

export const SO_DE_ON_HE = 20;

const CODE: Record<SubjectSlug, string> = { toan: "t", "tieng-viet": "tv" };

export function buildOnTapHe(subject: SubjectSlug, grade: 2 | 3 | 4 | 5): Course {
  const subjectName = subject === "toan" ? "Toán" : "Tiếng Việt";
  const next = grade === 5 ? "lớp 6" : `lớp ${grade + 1}`;
  const items: Item[] = Array.from({ length: SO_DE_ON_HE }, (_, i) => {
    const k = i + 1;
    return {
      id: `${CODE[subject]}${grade}-he-de-${k}`,
      slug: `de-${k}`,
      type: "test",
      title: `Đề ôn tập hè ${subjectName} lớp ${grade} – Đề ${k}`,
      level: null,
      order: k,
      isFree: true,
      videoProvider: null,
      videoRef: null,
      url: null,
    };
  });
  return {
    id: `${subject}-${grade}-on-tap-he`,
    subject,
    grade,
    track: "on-tap-he",
    textbook: "ket-noi-tri-thuc",
    title: `${subjectName} lớp ${grade} – Đề ôn tập hè`,
    weeks: [
      {
        id: `${CODE[subject]}${grade}-he`,
        number: 1,
        slug: "de-on-tap-he",
        label: "Ôn tập hè",
        startDate: "2027-06-07",
        endDate: "2027-08-29",
        title: `Đề ôn tập hè ${subjectName} lớp ${grade} – chuẩn bị lên ${next}`,
        kind: "hoc",
        published: true,
        items,
      },
    ],
  };
}

export const ON_TAP_HE: Course[] = (["toan", "tieng-viet"] as const).flatMap((s) => ([2, 3, 4, 5] as const).map((g) => buildOnTapHe(s, g)));
