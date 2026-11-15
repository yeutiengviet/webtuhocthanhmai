import Link from "next/link";
import { Icon } from "@/components/art";
import { FreeBadge, LockBadge } from "@/components/ui";
import { EXAM_CATEGORY_LABELS, examHref } from "@/lib/exam-meta";
import type { Exam } from "@/lib/types";

/**
 * Bảng đề thi: trên điện thoại hiện dạng thẻ (dễ bấm), trên máy tính hiện dạng bảng.
 * "Điểm của con" và "Điểm cao nhất" sẽ có từ Giai đoạn 4 (khi học sinh đăng nhập) — không hiện số giả.
 */
export function ExamTable({ exams, error = false }: { exams: Exam[]; error?: boolean }) {
  if (error) {
    return (
      <p role="alert" className="rounded-3xl bg-amber-50 p-5 text-center font-semibold text-amber-900 ring-1 ring-amber-200">
        Chưa tải được danh sách đề. Cô/phụ huynh vui lòng tải lại trang sau ít phút.
      </p>
    );
  }
  if (exams.length === 0) {
    return (
      <p className="rounded-3xl border-2 border-dashed border-brand-200 bg-white p-5 text-center font-semibold text-gray-700">
        <span aria-hidden>🛠️</span> Cô Thanh Mai đang cập nhật đề cho lớp này.
      </p>
    );
  }
  return (
    <>
      {/* Điện thoại: thẻ */}
      <ul className="grid gap-2 sm:hidden">
        {exams.map((e) => (
          <li key={e.id}>
            <Link href={examHref(e)} className="card-lift flex items-start gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-brand-100">
              <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-700 text-white">
                <Icon name="timer" className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold leading-snug text-gray-900">{e.title}</span>
                <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-gray-700">
                  {e.isFree ? <FreeBadge /> : <LockBadge />}
                  <span className="rounded-full bg-violet-50 px-2 py-0.5 text-violet-800 ring-1 ring-violet-200">{EXAM_CATEGORY_LABELS[e.category]}</span>
                  {e.durationMinutes && <span>⏱ {e.durationMinutes} phút</span>}
                  {!(e.hasFile || e.externalUrl) && <span className="text-gray-600">· đang cập nhật</span>}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Máy tính bảng / máy tính: bảng */}
      <div className="hidden overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-brand-100 sm:block">
        <table className="w-full text-left">
          <thead className="bg-brand-600 text-sm text-white">
            <tr>
              <th scope="col" className="px-4 py-3 font-extrabold">Đề thi</th>
              <th scope="col" className="px-4 py-3 font-extrabold">Loại đề</th>
              <th scope="col" className="px-4 py-3 font-extrabold">Thời gian</th>
              <th scope="col" className="px-4 py-3 font-extrabold">Điểm của con</th>
              <th scope="col" className="px-4 py-3 font-extrabold">Điểm cao nhất</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-100">
            {exams.map((e) => (
              <tr key={e.id} className="hover:bg-brand-50">
                <td className="px-4 py-3">
                  <Link href={examHref(e)} className="font-bold text-brand-700 hover:underline">{e.title}</Link>{" "}
                  {e.isFree ? <FreeBadge /> : <LockBadge />}
                  {!(e.hasFile || e.externalUrl) && <span className="ml-1 text-xs text-gray-600">đang cập nhật</span>}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-violet-800">{EXAM_CATEGORY_LABELS[e.category]}</td>
                <td className="px-4 py-3 text-sm">{e.durationMinutes ? `${e.durationMinutes} phút` : "—"}</td>
                <td className="px-4 py-3 text-sm text-gray-600" title="Hiện khi con đăng nhập">—</td>
                <td className="px-4 py-3 text-sm text-gray-600" title="Hiện khi con đăng nhập">—</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
