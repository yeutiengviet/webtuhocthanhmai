import Link from "next/link";
import { ExamRowActions } from "@/components/admin/ExamRowActions";
import { NotAdmin } from "@/components/admin/NotAdmin";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { Container, FreeBadge, LockBadge, PageHero } from "@/components/ui";
import { requireAdminPage } from "@/lib/admin";
import { EXAM_CATEGORY_LABELS, examHref } from "@/lib/exam-meta";
import { EXAM_COLUMNS, sortExams, toExam, type ExamRow } from "@/lib/exams";

export const metadata = { title: "Quản trị" };

export default async function AdminHome() {
  const { supabase, user, isAdmin } = await requireAdminPage();
  if (!isAdmin) return <NotAdmin email={user?.email} />;
  const { data, error } = await supabase.from("exams").select(EXAM_COLUMNS);
  const exams = sortExams(((data ?? []) as ExamRow[]).map(toExam));

  return (
    <>
      <PageHero badge="Trang quản trị" title="Quản lý đề thi" subtitle={`Đang đăng nhập: ${user?.email ?? ""}`} />
      <Container className="max-w-3xl space-y-5 py-8">
        <div className="flex flex-wrap gap-3">
          <Link href="/quan-tri/tai-de" className="btn-toy inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-lg font-extrabold text-white">
            <span aria-hidden>📤</span> Tải đề mới
          </Link>
          <SignOutButton />
        </div>
        {error && <p role="alert" className="rounded-2xl bg-red-50 p-3 font-bold text-red-800">Chưa tải được danh sách đề. Cô tải lại trang sau ít phút.</p>}
        <h2 className="text-2xl text-gray-900">Tất cả đề ({exams.length})</h2>
        <ul className="space-y-3">
          {exams.map((e) => (
            <li key={e.id} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-brand-100">
              <p className="text-sm font-bold text-violet-800">
                {e.subject === "toan" ? "Toán" : "Tiếng Việt"} lớp {e.grade} · {EXAM_CATEGORY_LABELS[e.category]}
                {e.durationMinutes ? ` · ${e.durationMinutes} phút` : ""}
              </p>
              <p className="mt-1 font-display text-xl font-extrabold text-gray-900">{e.title}</p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm font-semibold">
                {e.isFree ? <FreeBadge /> : <LockBadge />}
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${e.published ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200" : "bg-gray-100 text-gray-700"}`}>
                  {e.published ? "Đang hiện" : "Đang ẩn (nháp)"}
                </span>
                <span className="text-gray-600">{e.hasFile ? `File ${e.fileKind?.toUpperCase()}` : e.externalUrl ? "Link ngoài" : "Chưa có file"}</span>
                {e.published && <Link href={examHref(e)} className="font-bold text-brand-700 underline">Xem trên website</Link>}
              </p>
              <ExamRowActions id={e.id} title={e.title} published={e.published} isFree={e.isFree} />
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
