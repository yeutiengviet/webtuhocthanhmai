import Link from "next/link";
import { notFound } from "next/navigation";
import { BulkUploadForm } from "@/components/admin/BulkUploadForm";
import { NotAdmin } from "@/components/admin/NotAdmin";
import { Container, PageHero } from "@/components/ui";
import { requireAdminPage } from "@/lib/admin";
import { adminLessonFiles } from "@/lib/admin-lessons";
import { isMonthlySlug, type SlotInfo } from "@/lib/bulk-match";
import { getCourseById, itemAcceptsFiles } from "@/lib/content";

export const metadata = { title: "Tải phiếu hàng loạt" };

export default async function BulkUploadPage({ params, searchParams }: { params: Promise<{ khoa: string }>; searchParams: Promise<{ thang?: string }> }) {
  const { khoa } = await params;
  const { thang } = await searchParams;
  const { supabase, user, isAdmin } = await requireAdminPage();
  if (!isAdmin) return <NotAdmin email={user?.email} />;
  const course = /^[a-z0-9-]{1,60}$/.test(khoa) ? getCourseById(khoa) : undefined;
  if (!course) notFound();
  const { rows } = await adminLessonFiles(supabase, course);
  const allSlots: SlotInfo[] = course.weeks.flatMap((w) =>
    w.items
      .map((it) => ({ it, a: itemAcceptsFiles(it) }))
      .filter(({ a }) => a.pdf)
      .map(({ it, a }) => ({ id: it.id, week: w.number, slug: it.slug, title: it.title, html: a.html, pdf: a.pdf })),
  );
  // ?thang=<tuần>: chỉ tải các đề kiểm tra cuối tháng của tuần đó
  const monthWeek = thang && /^\d{1,2}$/.test(thang) ? Number(thang) : null;
  const monthlySlots = monthWeek ? allSlots.filter((s) => s.week === monthWeek && isMonthlySlug(s.slug)) : [];
  const monthLabel = monthlySlots[0]?.title.replace(/^Đề kiểm tra (cuối tháng \d+).*$/, "đề kiểm tra $1");
  const slots = monthlySlots.length ? monthlySlots : allSlots;
  const existing = Object.fromEntries([...rows.values()].map((r) => [r.item_id, { html: Boolean(r.html_path), pdf: Boolean(r.pdf_path) }]));
  const { data: examRows } = course.track === "on-tap-he" ? { data: [] } : await supabase.from("exams").select("title, category").eq("subject", course.subject).eq("grade", course.grade);
  const name = `${course.subject === "toan" ? "Toán" : "Tiếng Việt"} lớp ${course.grade}${course.track === "on-tap-he" ? " – Ôn tập hè" : ""}`;

  return (
    <>
      <PageHero badge="Trang quản trị" title={monthlySlots.length ? `${monthLabel?.replace(/^đ/, "Đ")} – ${name}` : `Tải hàng loạt – ${name}`} subtitle={monthlySlots.length ? `Tuần ${monthWeek}. Chọn nhiều file một lần, website tự xếp vào Đề 1, Đề 2…; cô xem lại rồi bấm Lưu.` : course.track === "on-tap-he" ? "Chọn nhiều file một lần; website tự xếp vào đề theo số đề trong tên file, cô xem lại rồi bấm Lưu." : "Chọn nhiều file một lần; website đọc tên file: có “tuần N” thì xếp vào tuần N, có “giữa kì / cuối kì / ôn tập học kì” thì xếp vào mục Đề thi. Cô xem lại rồi bấm Lưu."} />
      <Container className="max-w-3xl space-y-4 py-8">
        <Link href={`/quan-tri/bai-hoc/${course.id}`} className="inline-block py-2 font-extrabold text-brand-700 underline">← {name}</Link>
        <BulkUploadForm courseId={course.id} slots={slots} existing={existing} summer={course.track === "on-tap-he"} course={{ subject: course.subject, grade: course.grade }} existingExams={(examRows ?? []) as { title: string; category: string }[]} monthly={monthlySlots.length ? { label: monthLabel ?? "" } : null} />
      </Container>
    </>
  );
}
