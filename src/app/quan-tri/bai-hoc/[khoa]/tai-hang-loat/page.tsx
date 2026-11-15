import Link from "next/link";
import { notFound } from "next/navigation";
import { BulkUploadForm } from "@/components/admin/BulkUploadForm";
import { NotAdmin } from "@/components/admin/NotAdmin";
import { Container, PageHero } from "@/components/ui";
import { requireAdminPage } from "@/lib/admin";
import { adminLessonFiles } from "@/lib/admin-lessons";
import type { SlotInfo } from "@/lib/bulk-match";
import { getCourseById, itemAcceptsFiles } from "@/lib/content";

export const metadata = { title: "Tải phiếu hàng loạt" };

export default async function BulkUploadPage({ params }: { params: Promise<{ khoa: string }> }) {
  const { khoa } = await params;
  const { supabase, user, isAdmin } = await requireAdminPage();
  if (!isAdmin) return <NotAdmin email={user?.email} />;
  const course = /^[a-z0-9-]{1,60}$/.test(khoa) ? getCourseById(khoa) : undefined;
  if (!course) notFound();
  const { rows } = await adminLessonFiles(supabase, course);
  const slots: SlotInfo[] = course.weeks.flatMap((w) =>
    w.items
      .map((it) => ({ it, a: itemAcceptsFiles(it) }))
      .filter(({ a }) => a.pdf)
      .map(({ it, a }) => ({ id: it.id, week: w.number, slug: it.slug, title: it.title, html: a.html, pdf: a.pdf })),
  );
  const existing = Object.fromEntries([...rows.values()].map((r) => [r.item_id, { html: Boolean(r.html_path), pdf: Boolean(r.pdf_path) }]));
  const name = `${course.subject === "toan" ? "Toán" : "Tiếng Việt"} lớp ${course.grade}`;

  return (
    <>
      <PageHero badge="Trang quản trị" title={`Tải hàng loạt – ${name}`} subtitle="Chọn nhiều file một lần; website tự xếp vào tuần theo tên file, cô xem lại rồi bấm Lưu." />
      <Container className="max-w-3xl space-y-4 py-8">
        <Link href={`/quan-tri/bai-hoc/${course.id}`} className="inline-block py-2 font-extrabold text-brand-700 underline">← Các tuần {name}</Link>
        <BulkUploadForm courseId={course.id} slots={slots} existing={existing} />
      </Container>
    </>
  );
}
