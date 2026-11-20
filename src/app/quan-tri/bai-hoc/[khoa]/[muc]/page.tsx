import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonFileForm } from "@/components/admin/LessonFileForm";
import { NotAdmin } from "@/components/admin/NotAdmin";
import { Container, PageHero } from "@/components/ui";
import { requireAdminPage } from "@/lib/admin";
import { findItemById, itemAcceptsFiles, itemHref, itemTakesUploads, parentItem, subItems } from "@/lib/content";
import { isItemId, lessonImageHref } from "@/lib/exam-meta";
import { imagePathsOf, LESSON_FILE_COLUMNS, type LessonFileRow } from "@/lib/lesson-files";

export const metadata = { title: "Tải phiếu" };

export default async function AdminLessonItem({ params }: { params: Promise<{ khoa: string; muc: string }> }) {
  const { khoa, muc } = await params;
  const { supabase, user, isAdmin } = await requireAdminPage();
  if (!isAdmin) return <NotAdmin email={user?.email} />;
  const found = isItemId(muc) ? findItemById(muc) : null;
  if (!found || found.course.id !== khoa) notFound();
  const { course, week, item } = found;
  const accepts = itemAcceptsFiles(item);
  if (!itemTakesUploads(item)) notFound();
  if (item.multi) return <MultiItemAdmin courseId={course.id} found={found} supabase={supabase} />;
  const parent = parentItem(week.items, item);
  const { data } = await supabase.from("lesson_files").select(LESSON_FILE_COLUMNS).eq("item_id", item.id).maybeSingle();
  const row = data as LessonFileRow | null;
  const name = `${course.subject === "toan" ? "Toán" : "Tiếng Việt"} lớp ${course.grade}${course.track === "on-tap-he" ? " – Ôn tập hè" : ""}`;

  return (
    <>
      <PageHero badge="Trang quản trị" title={item.title} subtitle={`${name} · ${week.label ?? `${course.track === "nang-cao" ? "Chuyên đề" : "Tuần"} ${week.number}`}: ${week.title}`} />
      <Container className="max-w-2xl py-8">
        <Link href={`/quan-tri/bai-hoc/${course.id}${parent ? `/${parent.id}` : ""}`} className="mb-4 inline-block py-2 font-extrabold text-brand-700 underline">← {parent ? `${parent.title} – Tuần ${week.number}` : name}</Link>
        <LessonFileForm
          key={row?.updated_at ?? "moi"}
          itemId={item.id}
          accepts={accepts}
          publicHref={itemHref(course, week, item)}
          initial={row ? { hasHtml: Boolean(row.html_path), hasPdf: Boolean(row.pdf_path), isFree: row.is_free, published: row.published } : null}
          images={imagePathsOf(row).map((_, i) => lessonImageHref(item.id, i))}
        />
      </Container>
    </>
  );
}

/** Mục nhiều phiếu (vd. "Phiếu bài tập hàng ngày"): danh sách phiếu đã tải, thêm một phiếu hoặc tải nhiều phiếu một lần. */
async function MultiItemAdmin({ courseId, found, supabase }: { courseId: string; found: NonNullable<ReturnType<typeof findItemById>>; supabase: Awaited<ReturnType<typeof requireAdminPage>>["supabase"] }) {
  const { course, week, item } = found;
  const kids = subItems(week.items, item);
  const { data, error } = await supabase.from("lesson_files").select(LESSON_FILE_COLUMNS).in("item_id", kids.map((k) => k.id));
  const rows = new Map(((data ?? []) as LessonFileRow[]).map((r) => [r.item_id, r]));
  const uploaded = kids.filter((k) => rows.has(k.id));
  const next = kids.find((k) => !rows.has(k.id));
  const name = `${course.subject === "toan" ? "Toán" : "Tiếng Việt"} lớp ${course.grade}`;

  return (
    <>
      <PageHero badge="Trang quản trị" title={item.title} subtitle={`${name} · ${week.label ?? `Tuần ${week.number}`}: ${week.title}`} />
      <Container className="max-w-2xl space-y-4 py-8">
        <Link href={`/quan-tri/bai-hoc/${courseId}`} className="inline-block py-2 font-extrabold text-brand-700 underline">← {name}</Link>
        {error && <p role="alert" className="rounded-2xl bg-red-50 p-3 font-bold text-red-800">Chưa tải được danh sách phiếu. Cô tải lại trang sau ít phút.</p>}
        <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-brand-100">
          <p className="font-semibold text-gray-700">Mục này nhận <strong>nhiều phiếu</strong> (tối đa {kids.length} phiếu mỗi tuần). Mỗi phiếu gồm 1 file tương tác (.html) và/hoặc 1 file PDF. Phụ huynh thấy một mục “{item.title}”, bấm vào thì thấy danh sách các phiếu.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={`/quan-tri/bai-hoc/${courseId}/tai-hang-loat?ngay=${week.number}`} className="btn-toy inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-600 px-5 py-3 font-extrabold text-white">
              <span aria-hidden>📂</span> Tải nhiều phiếu một lần
            </Link>
            {next && (
              <Link href={`/quan-tri/bai-hoc/${courseId}/${next.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 py-3 font-extrabold text-brand-700 ring-2 ring-brand-200">
                <span aria-hidden>➕</span> Thêm một phiếu
              </Link>
            )}
          </div>
        </div>
        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-brand-100" aria-labelledby="ds-phieu">
          <h2 id="ds-phieu" className="text-xl text-gray-900">Các phiếu đã tải ({uploaded.length})</h2>
          {uploaded.length === 0 ? (
            <p className="mt-2 text-gray-700">Chưa có phiếu nào.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {uploaded.map((k) => {
                const r = rows.get(k.id)!;
                return (
                  <li key={k.id}>
                    <Link href={`/quan-tri/bai-hoc/${courseId}/${k.id}`} className="flex min-h-11 items-center gap-3 rounded-2xl p-2 ring-1 ring-gray-100 hover:bg-brand-50">
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold text-gray-900">{k.title.replace(/^.*– /, "")}</span>
                        <span className="text-xs font-semibold text-gray-700">{[r.html_path ? "✏️ Tương tác" : null, r.pdf_path ? "⬇️ PDF" : null, r.is_free ? "Free" : null, r.published ? null : "đang ẩn"].filter(Boolean).join(" · ")}</span>
                      </span>
                      <span className="rounded-full bg-brand-600 px-3 py-1 text-sm font-extrabold text-white">Sửa</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <Link href={itemHref(course, week, item)} className="mt-3 inline-block text-sm font-semibold text-brand-700 underline">Xem trang phụ huynh thấy →</Link>
        </section>
      </Container>
    </>
  );
}
