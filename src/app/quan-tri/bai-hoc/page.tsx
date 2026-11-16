import Link from "next/link";
import { NotAdmin } from "@/components/admin/NotAdmin";
import { Container, PageHero } from "@/components/ui";
import { requireAdminPage } from "@/lib/admin";
import { adminLessonFiles } from "@/lib/admin-lessons";
import { allCourses, itemAcceptsFiles } from "@/lib/content";

export const metadata = { title: "Phiếu bài học theo tuần" };

export default async function AdminLessonsHome() {
  const { supabase, user, isAdmin } = await requireAdminPage();
  if (!isAdmin) return <NotAdmin email={user?.email} />;
  const { rows, error } = await adminLessonFiles(supabase);
  const courses = allCourses().filter((c) => c.track === "theo-tuan" || c.track === "on-tap-he");

  return (
    <>
      <PageHero badge="Trang quản trị" title="Phiếu bài học" subtitle="Chọn khóa học (theo tuần hoặc ôn tập hè), rồi chọn mục để tải phiếu tương tác và phiếu PDF." />
      <Container className="max-w-3xl space-y-5 py-8">
        <Link href="/quan-tri" className="inline-block py-2 font-extrabold text-brand-700 underline">← Trang quản trị</Link>
        {error && <p role="alert" className="rounded-2xl bg-red-50 p-3 font-bold text-red-800">Chưa tải được trạng thái phiếu. Cô tải lại trang sau ít phút.</p>}
        <ul className="grid gap-3 sm:grid-cols-2">
          {courses.map((c) => {
            const slots = c.weeks.flatMap((w) => w.items).filter((i) => itemAcceptsFiles(i).pdf);
            const done = slots.filter((i) => rows.has(i.id)).length;
            return (
              <li key={c.id}>
                <Link href={`/quan-tri/bai-hoc/${c.id}`} className="card-lift block rounded-3xl bg-white p-4 shadow-sm ring-1 ring-brand-100">
                  <span className="block font-display text-xl font-extrabold text-gray-900">{c.subject === "toan" ? "Toán" : "Tiếng Việt"} lớp {c.grade}{c.track === "on-tap-he" ? " – ☀️ Ôn tập hè" : ""}</span>
                  <span className="mt-1 block text-sm font-semibold text-gray-700">Đã có phiếu: {done} / {slots.length} mục</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </>
  );
}
