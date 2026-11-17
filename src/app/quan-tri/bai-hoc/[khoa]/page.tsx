import Link from "next/link";
import { notFound } from "next/navigation";
import { NotAdmin } from "@/components/admin/NotAdmin";
import { Container, ItemIcon, PageHero } from "@/components/ui";
import { requireAdminPage } from "@/lib/admin";
import { adminLessonFiles } from "@/lib/admin-lessons";
import { attemptStats } from "@/lib/admin-stats";
import { getCourseById, itemTakesUploads } from "@/lib/content";
import { imagePathsOf } from "@/lib/lesson-files";
import { formatRange } from "@/lib/dates";

export const metadata = { title: "Phiếu theo tuần" };

export default async function AdminCourseLessons({ params }: { params: Promise<{ khoa: string }> }) {
  const { khoa } = await params;
  const { supabase, user, isAdmin } = await requireAdminPage();
  if (!isAdmin) return <NotAdmin email={user?.email} />;
  const course = /^[a-z0-9-]{1,60}$/.test(khoa) ? getCourseById(khoa) : undefined;
  if (!course) notFound();
  const [{ rows, error }, attempts] = await Promise.all([adminLessonFiles(supabase, course), attemptStats(supabase)]);
  const name = `${course.subject === "toan" ? "Toán" : "Tiếng Việt"} lớp ${course.grade}${course.track === "on-tap-he" ? " – Ôn tập hè" : ""}`;

  return (
    <>
      <PageHero badge="Trang quản trị" title={`Phiếu ${name}`} subtitle="Bấm vào một mục để tải phiếu tương tác (.html), phiếu PDF hoặc ảnh (sơ đồ tư duy)." />
      <Container className="max-w-3xl space-y-4 py-8">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/quan-tri/bai-hoc" className="inline-block py-2 font-extrabold text-brand-700 underline">← Chọn khóa khác</Link>
          <Link href={`/quan-tri/bai-hoc/${course.id}/tai-hang-loat`} className="btn-toy inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-3 font-extrabold text-white">
            <span aria-hidden>📂</span> Tải hàng loạt
          </Link>
        </div>
        {error && <p role="alert" className="rounded-2xl bg-red-50 p-3 font-bold text-red-800">Chưa tải được trạng thái phiếu. Cô tải lại trang sau ít phút.</p>}
        {course.weeks.map((w) => {
          const items = w.items.filter(itemTakesUploads);
          const done = items.filter((i) => rows.has(i.id)).length;
          return (
            <details key={w.id} className="rounded-3xl bg-white shadow-sm ring-1 ring-brand-100" open={w === course.weeks[0]}>
              <summary className="flex cursor-pointer items-center gap-3 p-4">
                <span className="min-w-0 flex-1">
                  <span className="block font-extrabold text-gray-900">{w.label ?? `${course.track === "nang-cao" ? "Chuyên đề" : "Tuần"} ${w.number}`}: {w.title}</span>
                  <span className="text-sm text-gray-600">{formatRange(w.startDate, w.endDate)} · đã có {done}/{items.length}</span>
                </span>
              </summary>
              <ul className="space-y-2 border-t-2 border-dashed border-brand-100 p-3">
                {items.map((it) => {
                  const r = rows.get(it.id);
                  return (
                    <li key={it.id}>
                      <Link href={`/quan-tri/bai-hoc/${course.id}/${it.id}`} className="flex min-h-11 items-center gap-3 rounded-2xl p-2 hover:bg-brand-50">
                        <ItemIcon type={it.type} />
                        <span className="min-w-0 flex-1">
                          <span className="block font-bold text-gray-900">{it.title}</span>
                          <span className="text-xs font-semibold text-gray-700">
                            {r ? [r.html_path ? "✏️ Tương tác" : null, r.pdf_path ? "⬇️ PDF" : null, imagePathsOf(r).length ? `🖼️ ${imagePathsOf(r).length} ảnh` : null, r.published ? null : "đang ẩn", r.html_path && !attempts.error ? `📊 ${attempts.stats.get(`bai:${it.id}`)?.total ?? 0} lượt làm` : null].filter(Boolean).join(" · ") : "Chưa có phiếu"}
                          </span>
                        </span>
                        <span className="rounded-full bg-brand-600 px-3 py-1 text-sm font-extrabold text-white">{r ? "Sửa" : "Tải lên"}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </details>
          );
        })}
      </Container>
    </>
  );
}
