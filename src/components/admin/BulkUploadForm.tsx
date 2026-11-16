"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createExam, saveLessonFiles } from "@/app/quan-tri/actions";
import { discardPair, uploadPair, type UploadedIds } from "@/components/admin/FileSlot";
import { courseMismatch, examGroupKey, examTarget, examTitleFromFileName, groupByExam, groupByItem, guessExamFromFileName, matchSummerSlot, parseExamTarget, routeFile, validateTargets, type MatchProblem, type SlotInfo } from "@/lib/bulk-match";
import { checkFileContent, EXAM_CATEGORIES, EXAM_CATEGORY_LABELS, kindFromFileName, MAX_FILE_BYTES } from "@/lib/exam-meta";
import type { SubjectSlug } from "@/lib/types";

interface Row {
  key: string;
  file: File;
  /** mã mục của tuần ("t3-w5-…"), hoặc "exam:<nhóm>" nếu vào khu Đề thi; null = chưa xếp */
  itemId: string | null;
  /** lỗi nội dung file (rỗng, giả mạo, quá lớn) */
  contentError: string | null;
}

const PROBLEM: Record<MatchProblem, string> = {
  "khong-nhan-dien": "Chưa nhận ra tuần/mục — cô chọn ở ô bên dưới",
  "sai-loai-file": "Mục này không nhận loại file này",
  trung: "Trùng: có 2 file cùng loại cho một mục",
};

export function BulkUploadForm({
  courseId,
  slots,
  existing,
  summer = false,
  course,
  existingExams = [],
}: {
  courseId: string;
  slots: SlotInfo[];
  existing: Record<string, { html: boolean; pdf: boolean }>;
  summer?: boolean;
  /** môn + lớp của khóa đang tải (dùng khi file thuộc khu Đề thi) */
  course: { subject: SubjectSlug; grade: 2 | 3 | 4 | 5 };
  existingExams?: { title: string; category: string }[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [isFree, setIsFree] = useState(true);
  const [published, setPublished] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [report, setReport] = useState<{ ok: string[]; fail: string[] } | null>(null);
  /** tên đề cô sửa, theo khóa ghép file (file .html và .pdf cùng đề dùng chung một tên) */
  const [titles, setTitles] = useState<Record<string, string>>({});

  const byId = useMemo(() => new Map(slots.map((s) => [s.id, s])), [slots]);
  const weeks = useMemo(() => [...new Set(slots.map((s) => s.week))].sort((a, b) => a - b), [slots]);
  const matches = useMemo(() => validateTargets(rows.map((r) => ({ name: r.file.name, target: r.itemId })), slots), [rows, slots]);
  const problems = matches.filter((m, i) => m.problem || rows[i].contentError).length;
  const checked = useMemo(() => matches.map((m, i) => ({ ...m, problem: m.problem ?? (rows[i].contentError ? ("khong-nhan-dien" as const) : null) })), [matches, rows]);
  const groups = useMemo(() => groupByItem(checked), [checked]);
  const examGroups = useMemo(() => groupByExam(checked), [checked]);
  const total = groups.size + examGroups.size;
  const titleOf = (name: string) => titles[examGroupKey(name)] ?? examTitleFromFileName(name);

  async function pick(list: FileList | null) {
    setReport(null);
    if (!list) return;
    const added: Row[] = [];
    for (const file of Array.from(list)) {
      const kind = kindFromFileName(file.name);
      let contentError: string | null = null;
      if (!kind) contentError = "Chỉ nhận file .html hoặc .pdf";
      else if (file.size > MAX_FILE_BYTES) contentError = "File quá lớn (tối đa 10 MB)";
      else contentError = checkFileContent(new Uint8Array(await file.slice(0, 8192).arrayBuffer()), kind);
      if (!contentError && !summer) contentError = courseMismatch(file.name, course);
      const itemId = summer ? (matchSummerSlot(file.name, slots)?.id ?? null) : routeFile(file.name, slots);
      added.push({ key: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`, file, itemId, contentError });
    }
    added.sort((a, b) => (byId.get(a.itemId ?? "")?.week ?? 99) - (byId.get(b.itemId ?? "")?.week ?? 99) || a.file.name.localeCompare(b.file.name, "vi", { numeric: true }));
    setRows((r) => [...r, ...added]);
  }

  async function save() {
    if (problems > 0 || total === 0) return;
    const ok: string[] = [];
    const fail: string[] = [];
    const savedIds = new Set<string>();
    const savedExamKeys = new Set<string>();
    let n = 0;
    for (const [itemId, g] of groups) {
      n++;
      const title = byId.get(itemId);
      const label = title ? (summer ? title.title : `Tuần ${title.week} – ${title.title}`) : itemId;
      setBusy(`Đang lưu ${n}/${total}: ${label}`);
      let ids: UploadedIds = {};
      try {
        const up = await uploadPair({ html: g.html ? rows[g.html.index].file : null, pdf: g.pdf ? rows[g.pdf.index].file : null }, "lessons");
        if (!up) {
          fail.push(`${label}: chưa tải được file (mạng?)`);
          continue;
        }
        ids = up;
        const res = await saveLessonFiles(itemId, { ...ids, isFree, published });
        if (res.ok) {
          ok.push(label);
          savedIds.add(itemId);
        }
        else {
          fail.push(`${label}: ${res.message}`);
          await discardPair(ids, "lessons");
        }
      } catch {
        fail.push(`${label}: có lỗi khi gửi`);
        await discardPair(ids, "lessons");
      }
    }
    // Đề thi: mỗi đề tạo một lần (file tương tác + PDF cùng lúc)
    for (const [key, g] of examGroups) {
      n++;
      const first = g.html ?? g.pdf!;
      const title = titleOf(rows[first.index].file.name).trim();
      const label = `Đề thi – ${EXAM_CATEGORY_LABELS[g.category]}: ${title}`;
      setBusy(`Đang lưu ${n}/${total}: ${label}`);
      let ids: UploadedIds = {};
      try {
        const up = await uploadPair({ html: g.html ? rows[g.html.index].file : null, pdf: g.pdf ? rows[g.pdf.index].file : null }, "exams");
        if (!up) {
          fail.push(`${label}: chưa tải được file (mạng?)`);
          continue;
        }
        ids = up;
        const res = await createExam({ subject: course.subject, grade: course.grade, category: g.category, title, isFree, published, ...ids });
        if (res.ok) {
          ok.push(label);
          savedExamKeys.add(key);
        } else {
          fail.push(`${label}: ${res.errors?.title ?? res.message}`);
          await discardPair(ids, "exams");
        }
      } catch {
        fail.push(`${label}: có lỗi khi gửi`);
        await discardPair(ids, "exams");
      }
    }
    setBusy(null);
    setReport({ ok, fail });
    // Giữ lại các file chưa lưu được để cô bấm lưu lại
    setRows((r) => r.filter((row, i) => {
      const m = matches[i];
      if (m.examKey) return !(m.examKey && savedExamKeys.has(m.examKey));
      return !row.itemId || !savedIds.has(row.itemId);
    }));
    // (matches theo thứ tự rows hiện tại nên chỉ số khớp)
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-brand-100">
        <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50 p-6 text-center">
          <span className="text-4xl" aria-hidden>📂</span>
          <span className="mt-2 block font-extrabold text-brand-700">Bấm để chọn nhiều file cùng lúc</span>
          {summer ? (
            <span className="mt-1 block text-sm text-gray-700">
              Đặt tên file có <strong>số đề</strong>, ví dụ: <code>Đề 1.html</code>, <code>Đề 1.pdf</code>, <code>On he lop 3 - De 12.html</code>. Mỗi đề nhận 1 file tương tác (.html) và 1 file PDF.
            </span>
          ) : (
          <span className="mt-1 block text-sm text-gray-700">
            Đặt tên file có <strong>số tuần</strong> và <strong>loại phiếu</strong>, ví dụ: <code>Tuan 5 - Co ban.html</code>, <code>Tuần 5 nâng cao.pdf</code>,{" "}
            <code>Tuần 4 kiểm tra 15 phút.html</code>, <code>Tuần 3 tài liệu.pdf</code>, <code>Tuần 9 đề 2.html</code>
            <span className="mt-2 block rounded-xl bg-white p-3 text-left ring-1 ring-brand-100">
              <strong>Đề thi</strong> (vào mục Đề thi, không vào tuần): tên file có <strong>giữa kì / cuối kì / ôn tập học kì</strong> và số kì, ví dụ:{" "}
              <code>Đề giữa kì 1.html</code>, <code>Đề cuối học kỳ 1.pdf</code>, <code>Ôn tập cuối học kì 1.pdf</code>, <code>Đề cuối năm.pdf</code>. Cùng tên thì file .html và .pdf ghép thành một đề.
            </span>
          </span>
          )}
          <input type="file" multiple accept=".html,.htm,.pdf,text/html,application/pdf" className="sr-only" aria-label="Chọn nhiều file" onChange={(e) => { pick(e.target.files); e.target.value = ""; }} />
        </label>
      </div>

      {rows.length > 0 && (
        <div className="rounded-[2rem] bg-white p-4 shadow-sm ring-1 ring-brand-100 sm:p-6">
          <h2 className="text-xl text-gray-900">Kiểm tra cách xếp ({rows.length} file)</h2>
          <p className="text-sm text-gray-700">Website đã tự xếp theo tên file. Cô xem lại; chỗ nào sai thì chọn lại ở ô tương ứng.</p>
          <ul className="mt-3 space-y-2">
            {rows.map((r, i) => {
              const m = matches[i];
              const err = r.contentError ?? (m.problem ? PROBLEM[m.problem] : null);
              const old = r.itemId && m.kind ? existing[r.itemId]?.[m.kind] : false;
              return (
                <li key={r.key} className={`rounded-2xl p-3 ring-1 ${err ? "bg-red-50 ring-red-200" : "bg-emerald-50/60 ring-emerald-200"}`}>
                  <div className="flex items-start gap-2">
                    <span aria-hidden>{m.kind === "pdf" ? "⬇️" : "✏️"}</span>
                    <span className="min-w-0 flex-1 break-all font-bold text-gray-900">{r.file.name}</span>
                    <button type="button" onClick={() => setRows((x) => x.filter((y) => y.key !== r.key))} className="min-h-9 rounded-full px-3 text-sm font-bold text-red-700 ring-1 ring-red-200" aria-label={`Bỏ file ${r.file.name}`}>Bỏ</button>
                  </div>
                  <select
                    aria-label={`Xếp file ${r.file.name} vào`}
                    value={r.itemId ?? ""}
                    onChange={(e) => setRows((x) => x.map((y) => (y.key === r.key ? { ...y, itemId: e.target.value || null } : y)))}
                    className="mt-2 block w-full rounded-xl border-2 border-gray-200 bg-white px-3 py-2 font-semibold"
                  >
                    <option value="">{summer ? "— Chọn đề —" : "— Chọn tuần và mục, hoặc Đề thi —"}</option>
                    {summer ? slots.map((s) => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    )) : (
                      <>
                        <optgroup label="📝 Mục Đề thi">
                          {EXAM_CATEGORIES.map((c) => (
                            <option key={c} value={examTarget(c)}>Đề thi – {EXAM_CATEGORY_LABELS[c]}</option>
                          ))}
                        </optgroup>
                        {weeks.map((w) => (
                          <optgroup key={w} label={`Tuần ${w}`}>
                            {slots.filter((s) => s.week === w).map((s) => (
                              <option key={s.id} value={s.id}>Tuần {w} – {s.title}{s.html ? "" : " (chỉ PDF)"}</option>
                            ))}
                          </optgroup>
                        ))}
                      </>
                    )}
                  </select>
                  {parseExamTarget(r.itemId) && (
                    <label className="mt-2 block text-sm font-bold text-gray-800">
                      Tên đề hiện trên website
                      <input
                        value={titleOf(r.file.name)}
                        onChange={(e) => setTitles((t) => ({ ...t, [examGroupKey(r.file.name)]: e.target.value }))}
                        maxLength={200}
                        className="mt-1 block w-full rounded-xl border-2 border-gray-200 bg-white px-3 py-2 font-semibold"
                      />
                    </label>
                  )}
                  {err ? (
                    <p className="mt-1 text-sm font-bold text-red-700">{err}</p>
                  ) : !r.itemId && guessExamFromFileName(r.file.name).isExam ? (
                    <p className="mt-1 text-sm font-bold text-red-700">Đây là file đề thi nhưng tên chưa ghi rõ kì nào — cô chọn nhóm ở mục “Đề thi” trong ô trên</p>
                  ) : parseExamTarget(r.itemId) ? (
                    <p className="mt-1 text-sm font-semibold text-emerald-800">
                      Sẽ tạo đề mới ở mục Đề thi – {course.subject === "toan" ? "Toán" : "Tiếng Việt"} lớp {course.grade}.
                      {existingExams.some((x) => x.title.trim().toLowerCase() === titleOf(r.file.name).trim().toLowerCase()) && <span className="text-amber-800"> Đã có đề cùng tên — lưu sẽ thêm một đề nữa (không thay đề cũ).</span>}
                    </p>
                  ) : old ? (
                    <p className="mt-1 text-sm font-semibold text-amber-800">Mục này đã có file {m.kind === "pdf" ? "PDF" : "tương tác"} — sẽ thay bằng file này.</p>
                  ) : null}
                </li>
              );
            })}
          </ul>

          <div className="mt-4 space-y-1 rounded-2xl bg-gray-50 p-4">
            <label className="flex items-center gap-3 py-1 font-semibold">
              <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} className="h-5 w-5 accent-brand-600" /> Ai cũng xem được, kể cả chưa đăng nhập (nhãn Free)
            </label>
            <label className="flex items-center gap-3 py-1 font-semibold">
              <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-5 w-5 accent-brand-600" /> Hiện ngay trên website
            </label>
          </div>

          {problems > 0 && <p role="alert" className="mt-3 font-bold text-red-700">Còn {problems} file cần sửa (hoặc bấm “Bỏ”) trước khi lưu.</p>}
          <button type="button" onClick={save} disabled={Boolean(busy) || problems > 0 || total === 0} className="btn-toy mt-3 w-full rounded-full bg-brand-600 px-6 py-4 text-lg font-extrabold text-white disabled:opacity-60">
            {busy ?? `Lưu ${rows.length} file vào ${groups.size + examGroups.size} mục`}
          </button>
        </div>
      )}

      {report && (
        <div role="status" className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-brand-100">
          <p className="font-extrabold text-emerald-800">Đã lưu {report.ok.length} mục.</p>
          {report.fail.length > 0 && (
            <>
              <p className="mt-2 font-extrabold text-red-700">Chưa lưu được {report.fail.length} mục (file vẫn còn trong danh sách ở trên để cô bấm lưu lại):</p>
              <ul className="mt-1 list-disc pl-5 text-sm text-red-800">{report.fail.map((f) => <li key={f}>{f}</li>)}</ul>
            </>
          )}
          <Link href={`/quan-tri/bai-hoc/${courseId}`} className="mt-3 inline-block font-extrabold text-brand-700 underline">Xem danh sách tuần →</Link>
        </div>
      )}
    </div>
  );
}
