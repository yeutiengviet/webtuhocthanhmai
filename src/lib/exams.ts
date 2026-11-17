import "server-only";
import { createSupabasePublic } from "@/lib/supabase/public";
import type { Exam, ExamCategory, Grade, SubjectSlug } from "@/lib/types";
import { EXAM_CATEGORIES } from "@/lib/exam-meta";

// Đọc đề thi từ Supabase cho trang công khai: kết nối KHÔNG kèm phiên đăng nhập và LUÔN lọc published = true,
// nên đề nháp không bao giờ lộ ra trang công khai.

export const EXAM_COLUMNS = "id, slug, subject, grade, category, title, duration_minutes, is_free, published, file_kind, file_path, pdf_path, external_url, sort_order";

export interface ExamRow {
  id: string;
  slug: string;
  subject: SubjectSlug;
  grade: Grade;
  category: ExamCategory;
  title: string;
  duration_minutes: number | null;
  is_free: boolean;
  published: boolean;
  file_kind: "html" | "pdf" | null;
  file_path: string | null;
  pdf_path: string | null;
  external_url: string | null;
  sort_order: number;
}

export function toExam(r: ExamRow): Exam {
  return {
    id: r.id,
    slug: r.slug,
    subject: r.subject,
    grade: r.grade,
    category: r.category,
    title: r.title,
    durationMinutes: r.duration_minutes,
    isFree: r.is_free,
    published: r.published,
    fileKind: r.file_kind,
    hasFile: Boolean(r.file_path),
    hasPdf: Boolean(r.pdf_path),
    externalUrl: r.external_url,
    sortOrder: r.sort_order,
  };
}

export function sortExams(list: Exam[]): Exam[] {
  return [...list].sort(
    (a, b) => a.grade - b.grade || EXAM_CATEGORIES.indexOf(a.category) - EXAM_CATEGORIES.indexOf(b.category) || a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "vi"),
  );
}

/** Danh sách đề công khai theo môn (và lớp). Trả { error } thay vì làm sập trang khi mạng/kho trục trặc. */
export async function listPublishedExams(subject: SubjectSlug, grade?: number): Promise<{ exams: Exam[]; error: boolean }> {
  try {
    const supabase = createSupabasePublic();
    let q = supabase.from("exams").select(EXAM_COLUMNS).eq("published", true).eq("subject", subject);
    if (grade !== undefined) q = q.eq("grade", grade);
    const { data, error } = await q;
    if (error) return { exams: [], error: true };
    return { exams: sortExams((data as ExamRow[]).map(toExam)), error: false };
  } catch {
    return { exams: [], error: true };
  }
}

export async function countPublishedExams(): Promise<Record<SubjectSlug, number> | null> {
  try {
    const supabase = createSupabasePublic();
    const { data, error } = await supabase.from("exams").select("subject").eq("published", true);
    if (error) return null;
    const out: Record<SubjectSlug, number> = { toan: 0, "tieng-viet": 0 };
    for (const r of data as { subject: SubjectSlug }[]) out[r.subject]++;
    return out;
  } catch {
    return null;
  }
}

export async function findPublishedExam(subject: string, grade: number, slug: string): Promise<Exam | null> {
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return null;
  try {
    const supabase = createSupabasePublic();
    const { data } = await supabase
      .from("exams")
      .select(EXAM_COLUMNS)
      .eq("published", true)
      .eq("subject", subject)
      .eq("grade", grade)
      .eq("slug", slug)
      .maybeSingle();
    return data ? toExam(data as ExamRow) : null;
  } catch {
    return null;
  }
}
