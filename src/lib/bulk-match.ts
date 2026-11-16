// Tải phiếu hàng loạt: đoán tuần + mục từ TÊN FILE. File thuần (không mạng) — dùng ở trình duyệt, có kiểm thử đơn vị.
//
// Ví dụ tên file nhận được:
//   "Tuan 5 - Co ban.html", "tuần 12 nâng cao.pdf", "L3_T07_NC.html", "Lop 3 tuan 9 de 2.html",
//   "T4 kiem tra 15 phut.pdf", "Tuần 3 tài liệu.pdf", "W05-coban.html"

import type { FileKind } from "@/lib/exam-meta";
import { EXAM_CATEGORIES, kindFromFileName } from "@/lib/exam-meta";
import type { ExamCategory, SubjectSlug } from "@/lib/types";

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
  /** Chỉ có khi file được xếp vào khu Đề thi: nhóm đề và khóa để ghép file .html với file .pdf cùng đề */
  category?: ExamCategory | null;
  examKey?: string | null;
}

// ───── Khu Đề thi: file có "giữa kì / cuối kì / ôn tập học kì…" trong tên thì vào mục Đề thi, không vào tuần ─────

const EXAM_PREFIX = "exam:";
/** Giá trị ô chọn "xếp vào" cho khu Đề thi, vd "exam:cuoi-ki-1". */
export function examTarget(category: ExamCategory): string {
  return `${EXAM_PREFIX}${category}`;
}
export function parseExamTarget(target: string | null): ExamCategory | null {
  if (!target?.startsWith(EXAM_PREFIX)) return null;
  const c = target.slice(EXAM_PREFIX.length) as ExamCategory;
  return EXAM_CATEGORIES.includes(c) ? c : null;
}

export interface ExamGuess {
  /** tên file cho thấy đây là đề thi (không phải phiếu của một tuần) */
  isExam: boolean;
  /** nhóm đề; null = là đề thi nhưng chưa rõ loại/kì nào (vd "đề cuối học kỳ" không ghi kì) */
  category: ExamCategory | null;
}

/** Đoán file có phải đề thi và thuộc nhóm nào. "Đề cương …" luôn thuộc tuần ôn tập, không vào Đề thi. */
export function guessExamFromFileName(fileName: string): ExamGuess {
  const s = ` ${normalize(fileName)} `;
  if (/ de cuong(?= )/.test(s)) return { isExam: false, category: null };
  const onTap = / on tap(?= )/.test(s);
  const pick = (half: "giua" | "cuoi", term: 1 | 2): ExamCategory =>
    half === "giua" ? (term === 1 ? (onTap ? "on-tap-giua-ki-1" : "giua-ki-1") : onTap ? "on-tap-giua-ki-2" : "giua-ki-2") : term === 1 ? (onTap ? "on-tap-cuoi-ki-1" : "cuoi-ki-1") : onTap ? "on-tap-cuoi-nam" : "cuoi-nam";
  const termNo = (t: string): 1 | 2 => (t === "2" || t === "ii" ? 2 : 1);

  // "giữa/cuối (học) kì|kỳ 1|2|I|II"   (kì 2 cuối cùng = cuối năm)
  let m = / (giua|cuoi) ?(?:hoc ?)?(?:ki|ky) ?(1|2|ii|i)(?= )/.exec(s);
  if (m) return { isExam: true, category: pick(m[1] as "giua" | "cuoi", termNo(m[2])) };
  // viết tắt "GK1", "CK2", "CKI"
  m = / (gk|ck) ?(1|2|ii|i)(?= )/.exec(s);
  if (m) return { isExam: true, category: pick(m[1] === "gk" ? "giua" : "cuoi", termNo(m[2])) };
  if (/ cuoi nam(?= )/.test(s)) return { isExam: true, category: pick("cuoi", 2) };
  if (/ danh gia thang(?= )/.test(s)) return { isExam: true, category: "danh-gia-thang" };
  if (/ (luyen thi|thi thu)(?= )/.test(s)) return { isExam: true, category: "luyen-thi" };
  // có chữ giữa/cuối kì nhưng thiếu kì 1 hay 2, hoặc "ôn tập học kì": là đề thi, để cô chọn loại
  if (/ (giua|cuoi) ?(?:hoc ?)?(?:ki|ky)(?= )/.test(s) || / on tap hoc (?:ki|ky)(?= )/.test(s)) return { isExam: true, category: null };
  return { isExam: false, category: null };
}

/** Lớp và môn ghi trong tên file ("Lớp 3", "L3", "Toán", "Tiếng Việt", "TV"); không ghi thì null. */
export function guessGradeSubject(fileName: string): { grade: number | null; subject: SubjectSlug | null } {
  const s = ` ${normalize(fileName)} `;
  const g = [...s.matchAll(/ (?:lop|l) ?([2-5])(?= )/g)].map((m) => Number(m[1]));
  const grade = new Set(g).size === 1 ? g[0] : null;
  const toan = / toan(?= )/.test(s);
  const tv = / (tieng viet|tv)(?= )/.test(s);
  return { grade, subject: toan === tv ? null : toan ? "toan" : "tieng-viet" };
}

/** Khóa ghép file: "De cuoi ki 1.html" và "De cuoi ki 1.pdf" cùng khóa → cùng một đề (có cả bản tương tác và PDF). */
export function examGroupKey(fileName: string): string {
  return normalize(fileName);
}

/** Tên đề đề xuất = tên file bỏ đuôi, đổi _ thành dấu cách. Cô sửa lại được trước khi lưu. */
export function examTitleFromFileName(fileName: string): string {
  const t = fileName
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/_+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return t.length >= 3 ? t.charAt(0).toUpperCase() + t.slice(1) : "Đề thi";
}

/** Tên file nói rõ lớp/môn khác với khóa đang tải → báo lỗi để không xếp nhầm khóa. */
export function courseMismatch(fileName: string, course: { grade: number; subject: SubjectSlug }): string | null {
  const g = guessGradeSubject(fileName);
  if (g.grade !== null && g.grade !== course.grade) return `Tên file ghi lớp ${g.grade} nhưng cô đang tải cho lớp ${course.grade} — cô bỏ file hoặc sang đúng khóa`;
  if (g.subject !== null && g.subject !== course.subject) return `Tên file ghi môn ${g.subject === "toan" ? "Toán" : "Tiếng Việt"} nhưng cô đang tải cho môn ${course.subject === "toan" ? "Toán" : "Tiếng Việt"} — cô bỏ file hoặc sang đúng khóa`;
  return null;
}

/** Nơi xếp file: Đề thi (nếu tên file là đề thi và rõ nhóm), nếu không thì mục của tuần theo tên file. */
export function routeFile(fileName: string, slots: SlotInfo[]): string | null {
  const exam = guessExamFromFileName(fileName);
  if (exam.isExam) return exam.category ? examTarget(exam.category) : null;
  return matchSlot(guessFromFileName(fileName), slots)?.id ?? null;
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

/**
 * Như validateMatches nhưng "xếp vào" có thể là khu Đề thi ("exam:<nhóm>"). File vào Đề thi chỉ cần đúng loại .html/.pdf
 * và không có 2 file cùng loại cho cùng một đề (cùng tên, cùng nhóm).
 */
export function validateTargets(files: { name: string; target: string | null }[], slots: SlotInfo[]): FileMatch[] {
  const out = validateMatches(files.map((f) => ({ name: f.name, itemId: parseExamTarget(f.target) ? null : f.target })), slots);
  files.forEach((f, i) => {
    const category = parseExamTarget(f.target);
    if (!category) return;
    out[i] = { ...out[i], itemId: null, category, examKey: `${category}|${examGroupKey(f.name)}`, problem: out[i].kind ? null : "sai-loai-file" };
  });
  const seen = new Map<string, number[]>();
  for (const m of out) {
    if (!m.examKey || m.problem || !m.kind) continue;
    const key = `${m.examKey}|${m.kind}`;
    seen.set(key, [...(seen.get(key) ?? []), m.index]);
  }
  for (const idx of seen.values()) if (idx.length > 1) for (const i of idx) out[i].problem = "trung";
  return out;
}

/** Gom file Đề thi theo đề: một đề nhận 1 file tương tác + 1 file PDF. */
export function groupByExam<T extends { examKey?: string | null; category?: ExamCategory | null; kind: FileKind | null; problem: MatchProblem | null }>(matches: T[]): Map<string, { category: ExamCategory; html?: T; pdf?: T }> {
  const g = new Map<string, { category: ExamCategory; html?: T; pdf?: T }>();
  for (const m of matches) {
    if (m.problem || !m.examKey || !m.category || !m.kind) continue;
    const cur = g.get(m.examKey) ?? { category: m.category };
    cur[m.kind] = m;
    g.set(m.examKey, cur);
  }
  return g;
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
