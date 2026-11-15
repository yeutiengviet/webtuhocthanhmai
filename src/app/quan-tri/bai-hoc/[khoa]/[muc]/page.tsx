import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonFileForm } from "@/components/admin/LessonFileForm";
import { NotAdmin } from "@/components/admin/NotAdmin";
import { Container, PageHero } from "@/components/ui";
import { requireAdminPage } from "@/lib/admin";
import { findItemById, itemAcceptsFiles, itemHref } from "@/lib/content";
import { isItemId } from "@/lib/exam-meta";
import { LESSON_FILE_COLUMNS, type LessonFileRow } from "@/lib/lesson-files";

export const metadata = { title: "Tải phiếu" };

export default async function AdminLessonItem({ params }: { params: Promise<{ khoa: string; muc: string }> }) {
  const { khoa, muc } = await params;
  const { supabase, user, isAdmin } = await requireAdminPage();
  if (!isAdmin) return <NotAdmin email={user?.email} />;
  const found = isItemId(muc) ? findItemById(muc) : null;
  if (!found || found.course.id !== khoa) notFound();
  const { course, week, item } = found;
  const accepts = itemAcceptsFiles(item);
  if (!accepts.pdf) notFound();
  const { data } = await supabase.from("lesson_files").select(LESSON_FILE_COLUMNS).eq("item_id", item.id).maybeSingle();
  const row = data as LessonFileRow | null;
  const name = `${course.subject === "toan" ? "Toán" : "Tiếng Việt"} lớp ${course.grade}`;

  return (
    <>
      <PageHero badge="Trang quản trị" title={item.title} subtitle={`${name} · Tuần ${week.number}: ${week.title}`} />
      <Container className="max-w-2xl py-8">
        <Link href={`/quan-tri/bai-hoc/${course.id}`} className="mb-4 inline-block py-2 font-extrabold text-brand-700 underline">← Các tuần {name}</Link>
        <LessonFileForm
          key={row?.updated_at ?? "moi"}
          itemId={item.id}
          accepts={accepts}
          publicHref={itemHref(course, week, item)}
          initial={row ? { hasHtml: Boolean(row.html_path), hasPdf: Boolean(row.pdf_path), isFree: row.is_free, published: row.published } : null}
        />
      </Container>
    </>
  );
}
