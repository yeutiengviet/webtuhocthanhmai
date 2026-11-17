import Link from "next/link";
import { ExamRowActions } from "@/components/admin/ExamRowActions";
import { MissingMigration } from "@/components/admin/MissingMigration";
import { NotAdmin } from "@/components/admin/NotAdmin";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { Container, FreeBadge, LockBadge, PageHero } from "@/components/ui";
import { requireAdminPage } from "@/lib/admin";
import { attemptStats, listParents } from "@/lib/admin-stats";
import { EXAM_CATEGORY_LABELS, examHref } from "@/lib/exam-meta";
import { EXAM_COLUMNS, sortExams, toExam, type ExamRow } from "@/lib/exams";

export const metadata = { title: "Quản trị" };

export default async function AdminHome() {
  const { supabase, user, isAdmin } = await requireAdminPage();
  if (!isAdmin) return <NotAdmin email={user?.email} />;
  const [{ data, error }, parentsRes, attemptsRes] = await Promise.all([supabase.from("exams").select(EXAM_COLUMNS), listParents(supabase), attemptStats(supabase)]);
  const statsReady = !parentsRes.error && !attemptsRes.error;
  const totalAttempts = [...attemptsRes.stats.values()].reduce((a, s) => a + s.total, 0);
  const exams = sortExams(((data ?? []) as ExamRow[]).map(toExam));

  return (
    <>
      <PageHero badge="Trang quản trị" title="Quản lý đề thi" subtitle={`Đang đăng nhập: ${user?.email ?? ""}`} />
      <Container className="max-w-3xl space-y-5 py-8">
        <div className="flex flex-wrap gap-3">
          <Link href="/quan-tri/tai-de" className="btn-toy inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-lg font-extrabold text-white">
            <span aria-hidden>📤</span> Tải đề mới
          </Link>
          <Link href="/quan-tri/bai-hoc" className="btn-toy inline-flex items-center gap-2 rounded-full bg-accent-600 px-6 py-3 text-lg font-extrabold text-white">
            <span aria-hidden>📚</span> Phiếu bài học (theo tuần · ôn tập hè)
          </Link>
          <SignOutButton />
        </div>
        <section aria-labelledby="thong-ke" className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-brand-100">
          <h2 id="thong-ke" className="text-2xl text-gray-900"><span aria-hidden>📊</span> Thống kê</h2>
          {statsReady ? (
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              <li>
                <Link href="/quan-tri/phu-huynh" className="card-lift block rounded-2xl bg-brand-50 p-4 ring-1 ring-brand-200">
                  <span className="block text-sm font-bold text-brand-800">Phụ huynh đã đăng ký</span>
                  <span className="block font-display text-4xl font-extrabold text-gray-900">{parentsRes.parents.length}</span>
                  <span className="text-sm font-semibold text-gray-700">
                    {[2, 3, 4, 5].map((g) => `Lớp ${g}: ${parentsRes.parents.filter((p) => p.grade === g).length}`).join(" · ")} — xem tên, SĐT →
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/quan-tri/luot-lam" className="card-lift block rounded-2xl bg-accent-50 p-4 ring-1 ring-accent-200">
                  <span className="block text-sm font-bold text-accent-700">Tổng lượt làm bài</span>
                  <span className="block font-display text-4xl font-extrabold text-gray-900">{totalAttempts}</span>
                  <span className="text-sm font-semibold text-gray-700">Xem lượt làm của từng đề / phiếu →</span>
                </Link>
              </li>
            </ul>
          ) : parentsRes.missing || attemptsRes.missing ? (
            <div className="mt-3"><MissingMigration /></div>
          ) : (
            <p className="mt-2 text-sm font-semibold text-red-800">Chưa tải được thống kê. Cô tải lại trang sau ít phút.</p>
          )}
        </section>
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
                <span className="text-gray-600">{[e.hasFile && e.fileKind === "html" ? "✏️ Tương tác" : e.externalUrl ? "✏️ Link ngoài" : null, e.hasPdf || (e.hasFile && e.fileKind === "pdf") ? "⬇️ PDF" : null].filter(Boolean).join(" · ") || "Chưa có file"}</span>
                {e.hasFile && e.fileKind === "html" && !attemptsRes.error && (
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-extrabold text-amber-900 ring-1 ring-amber-200">
                    ✏️ {attemptsRes.stats.get(`de:${e.id}`)?.total ?? 0} lượt làm
                  </span>
                )}
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
