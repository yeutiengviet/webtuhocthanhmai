// Tải phiếu hàng loạt: đoán tuần + mục từ TÊN FILE. File thuần (không mạng) — dùng ở trình duyệt, có kiểm thử đơn vị.
//
// Ví dụ tên file nhận được:
//   "Tuan 5 - Co ban.html", "tuần 12 nâng cao.pdf", "L3_T07_NC.html", "Lop 3 tuan 9 de 2.html",
//   "T4 kiem tra 15 phut.pdf", "Tuần 3 tài liệu.pdf", "W05-coban.html"

import type { FileKind } from "@/lib/exam-meta";
import { kindFromFileName } from "@/lib/exam-meta";

export interface SlotInfo {
  /** mã mục, vd "t3-w5-luyen-tap-co-ban" */
  id: string;
  week: number;
  slug: string;
  title: string;
  html: boolean;
  pdf: boolean;
}

export interface Guess {
  week: number | null;
  slug: string | null;
}

function normalize(name: string): string {
  return name
    .replace(/\.[a-z0-9]+$/i, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[_.\-–—()[\]]+/g, " ")
    .replace(/(\d)([a-z])/g, "$1 $2")
    .replace(/([a-z])(\d)/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

/** Đoán số tuần và loại mục từ tên file. */
export function guessFromFileName(fileName: string): Guess {
  let s = ` ${normalize(fileName)} `;
  // Bỏ phần "lớp 3", "L3" để số lớp không bị hiểu nhầm là số tuần
  s = s.replace(/ (lop|l) ?[1-5](?= )/g, " ");

  let week: number | null = null;
  const w = / (?:tuan|t|w|week) ?0*(\d{1,2})(?= )/.exec(s);
  if (w) week = Number(w[1]);
  else {
    const nums = [...s.matchAll(/ 0*(\d{1,2})(?= )/g)].map((m) => Number(m[1])).filter((n) => n >= 1 && n <= 35);
    if (nums.length === 1) week = nums[0];
  }
  if (week !== null && (week < 1 || week > 35)) week = null;

  let slug: string | null = null;
  if (/ (nang ?cao|nc)(?= )/.test(s)) slug = "luyen-tap-nang-cao";
  else if (/ (co ?ban|cb)(?= )/.test(s)) slug = "luyen-tap-co-ban";
  else if (/ (tong ?hop|th)(?= )/.test(s)) slug = "luyen-tap-tong-hop";
  else if (/ (kiem ?tra|kt|15 ?(phut|p))(?= )/.test(s)) slug = "kiem-tra-15-phut";
  else if (/ (de cuong)(?= )/.test(s)) slug = "de-cuong";
  else if (/ (tai lieu|tl)(?= )/.test(s)) slug = "tai-lieu-tuan";
  else {
    const de = / de ?([1-3])(?= )/.exec(s);
    if (de) slug = `de-on-tap-${de[1]}`;
  }
  return { week, slug };
}

/** Đề ôn tập hè: tên file có số đề, vd "Đề 3.html", "de-12.pdf", "On he lop 3 - De 07.html" → số đề (1–99). */
export function guessSummerTestNumber(fileName: string): number | null {
  let s = ` ${normalize(fileName)} `;
  s = s.replace(/ (lop|l) ?[1-6](?= )/g, " ");
  const de = / (?:de|d) ?0*(\d{1,2})(?= )/.exec(s);
  if (de) return Number(de[1]) || null;
  const nums = [...s.matchAll(/ 0*(\d{1,2})(?= )/g)].map((m) => Number(m[1])).filter((n) => n >= 1);
  return nums.length === 1 ? nums[0] : null;
}

/** Xếp file vào đề ôn tập hè theo số đề (mục có slug "de-<số>"). */
export function matchSummerSlot(fileName: string, slots: SlotInfo[]): SlotInfo | null {
  const n = guessSummerTestNumber(fileName);
  return n === null ? null : (slots.find((x) => x.slug === `de-${n}`) ?? null);
}

export type MatchProblem = "khong-nhan-dien" | "sai-loai-file" | "trung";

export interface FileMatch {
  index: number;
  fileName: string;
  kind: FileKind | null;
  /** mã mục được xếp vào (null = chưa xếp) */
  itemId: string | null;
  problem: MatchProblem | null;
}

/** Tìm mục theo đoán; nếu tuần ôn tập không có "cơ bản" thì không tự xếp (để cô chọn). */
export function matchSlot(guess: Guess, slots: SlotInfo[]): SlotInfo | null {
  if (guess.week === null || guess.slug === null) return null;
  const inWeek = slots.filter((x) => x.week === guess.week);
  const exact = inWeek.find((x) => x.slug === guess.slug);
  if (exact) return exact;
  // Khóa Toán đặt tên đề ôn tập là "de-1", "de-2"… (khung Tiếng Việt là "de-on-tap-1"…)
  const de = /^de-on-tap-(\d)$/.exec(guess.slug);
  return de ? (inWeek.find((x) => x.slug === `de-${de[1]}`) ?? null) : null;
}

/** Kiểm tra cả danh sách: đúng loại file, không có 2 file cùng loại vào cùng một mục. */
export function validateMatches(files: { name: string; itemId: string | null }[], slots: SlotInfo[]): FileMatch[] {
  const byId = new Map(slots.map((x) => [x.id, x]));
  const out: FileMatch[] = files.map((f, index) => {
    const kind = kindFromFileName(f.name);
    const slot = f.itemId ? byId.get(f.itemId) : undefined;
    let problem: MatchProblem | null = null;
    if (!slot) problem = "khong-nhan-dien";
    else if (!kind || !slot[kind]) problem = "sai-loai-file";
    return { index, fileName: f.name, kind, itemId: slot ? slot.id : null, problem };
  });
  const seen = new Map<string, number[]>();
  for (const m of out) {
    if (m.problem || !m.itemId || !m.kind) continue;
    const key = `${m.itemId}|${m.kind}`;
    seen.set(key, [...(seen.get(key) ?? []), m.index]);
  }
  for (const idx of seen.values()) if (idx.length > 1) for (const i of idx) out[i].problem = "trung";
  return out;
}

/** Gom file theo mục để tải lên từng mục một lần (phiếu tương tác + PDF cùng lúc). */
export function groupByItem<T extends { itemId: string | null; kind: FileKind | null; problem: MatchProblem | null }>(matches: T[]): Map<string, { html?: T; pdf?: T }> {
  const g = new Map<string, { html?: T; pdf?: T }>();
  for (const m of matches) {
    if (m.problem || !m.itemId || !m.kind) continue;
    const cur = g.get(m.itemId) ?? {};
    cur[m.kind] = m;
    g.set(m.itemId, cur);
  }
  return g;
}
