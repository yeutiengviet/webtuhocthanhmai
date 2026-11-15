"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { createExam, discardUpload, updateExam, type ActionResult } from "@/app/quan-tri/actions";
import { checkFileContent, EXAM_CATEGORIES, EXAM_CATEGORY_LABELS, kindFromFileName, MAX_FILE_BYTES, storagePath, validateExamInput, type FileKind } from "@/lib/exam-meta";
import { STORAGE_BUCKET } from "@/lib/supabase/env";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import type { ExamCategory, SubjectSlug } from "@/lib/types";

export interface ExamFormInitial {
  id: string;
  subject: SubjectSlug;
  grade: number;
  category: ExamCategory;
  title: string;
  durationMinutes: number | null;
  isFree: boolean;
  published: boolean;
  fileLabel: string | null;
}

const field = "mt-1 block w-full rounded-2xl border-2 bg-white px-4 py-3 font-semibold text-gray-900 focus:border-brand-500";
const label = "block font-extrabold text-gray-800";

export function ExamForm({ initial }: { initial?: ExamFormInitial }) {
  const router = useRouter();
  const editing = Boolean(initial);
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<ActionResult | null>(null);

  async function onPickFile(f: File | null) {
    setFileError(null);
    setFile(null);
    if (!f) return;
    const kind = kindFromFileName(f.name);
    if (!kind) return setFileError("Chỉ nhận file .html (phiếu tương tác) hoặc .pdf.");
    if (f.size > MAX_FILE_BYTES) return setFileError("File quá lớn (tối đa 10 MB).");
    const problem = checkFileContent(new Uint8Array(await f.slice(0, 8192).arrayBuffer()), kind);
    if (problem) return setFileError(problem);
    setFile(f);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const raw = Object.fromEntries(fd.entries()) as Record<string, unknown>;
    raw.isFree = fd.get("isFree") === "on";
    raw.published = fd.get("published") === "on";
    const v = validateExamInput(raw);
    if (!v.ok) return setErrors(v.errors);
    setErrors({});
    if (!editing && !file) return setFileError("Cô chọn file đề trước nhé.");
    if (fileError) return;

    let fileId: string | undefined;
    let fileKind: FileKind | undefined;
    try {
      if (file) {
        fileKind = kindFromFileName(file.name)!;
        fileId = crypto.randomUUID();
        setBusy("Đang tải file lên kho…");
        const supabase = createSupabaseBrowser();
        const { error } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(storagePath(fileId, fileKind), file, { contentType: fileKind === "html" ? "text/html" : "application/pdf", upsert: false });
        if (error) {
          setResult({ ok: false, message: "Chưa tải được file lên. Cô kiểm tra mạng rồi thử lại." });
          return;
        }
      }
      setBusy("Đang kiểm tra file và lưu đề…");
      const payload = { ...raw, fileId, fileKind };
      const res = editing ? await updateExam(initial!.id, payload) : await createExam(payload);
      setResult(res);
      if (!res.ok) {
        if (res.errors) setErrors(res.errors);
        if (fileId && fileKind) await discardUpload(fileId, fileKind);
        return;
      }
      if (!editing) {
        form.reset();
        setFile(null);
        if (fileRef.current) fileRef.current.value = "";
      }
      router.refresh();
    } catch {
      setResult({ ok: false, message: "Có lỗi khi gửi. Cô thử lại sau ít phút." });
      if (fileId && fileKind) await discardUpload(fileId, fileKind);
    } finally {
      setBusy(null);
    }
  }

  const err = (k: string) => (errors[k] ? <span className="mt-1 block text-sm font-bold text-red-700">{errors[k]}</span> : null);
  const border = (k: string) => (errors[k] ? "border-red-400" : "border-gray-200");

  return (
    <form onSubmit={submit} className="space-y-5 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-brand-100 sm:p-7" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>
          Môn
          <select name="subject" className={`${field} ${border("subject")}`} defaultValue={initial?.subject ?? "toan"}>
            <option value="toan">Toán</option>
            <option value="tieng-viet">Tiếng Việt</option>
          </select>
          {err("subject")}
        </label>
        <label className={label}>
          Lớp
          <select name="grade" className={`${field} ${border("grade")}`} defaultValue={String(initial?.grade ?? 4)}>
            {[2, 3, 4, 5].map((g) => <option key={g} value={g}>Lớp {g}</option>)}
          </select>
          {err("grade")}
        </label>
      </div>

      <label className={label}>
        Tên đề
        <input name="title" className={`${field} ${border("title")}`} placeholder="VD: Đề 2 – Giữa học kì I – Toán 4" defaultValue={initial?.title} maxLength={200} required />
        {err("title")}
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>
          Loại đề
          <select name="category" className={`${field} ${border("category")}`} defaultValue={initial?.category ?? "giua-ki-1"}>
            {EXAM_CATEGORIES.map((c) => <option key={c} value={c}>{EXAM_CATEGORY_LABELS[c]}</option>)}
          </select>
          {err("category")}
        </label>
        <label className={label}>
          Thời gian làm bài (phút)
          <input name="durationMinutes" type="number" inputMode="numeric" min={1} max={240} className={`${field} ${border("durationMinutes")}`} placeholder="Để trống nếu không giới hạn" defaultValue={initial?.durationMinutes ?? ""} />
          {err("durationMinutes")}
        </label>
      </div>

      <div>
        <p className={label}>{editing ? "Thay file đề (không bắt buộc)" : "File đề"}</p>
        {editing && initial?.fileLabel && <p className="mt-1 text-sm text-gray-700">File hiện tại: {initial.fileLabel}</p>}
        <label className={`mt-1 block cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center ${fileError ? "border-red-400 bg-red-50" : "border-brand-300 bg-brand-50"}`}>
          <span className="text-4xl" aria-hidden>📤</span>
          <span className="mt-2 block font-extrabold text-brand-700">{file ? `Đã chọn: ${file.name}` : "Bấm để chọn file đề từ điện thoại hoặc máy tính"}</span>
          <span className="mt-1 block text-sm text-gray-700">Nhận: phiếu tương tác <strong>.html</strong> hoặc đề in <strong>.pdf</strong>. Tối đa 10 MB.</span>
          <input ref={fileRef} type="file" accept=".html,.htm,.pdf,text/html,application/pdf" className="sr-only" onChange={(e) => onPickFile(e.target.files?.[0] ?? null)} aria-label="Chọn file đề" />
        </label>
        {fileError && <span role="alert" className="mt-1 block text-sm font-bold text-red-700">{fileError}</span>}
      </div>

      <div className="space-y-1 rounded-2xl bg-gray-50 p-4">
        <label className="flex items-center gap-3 py-2 font-semibold">
          <input type="checkbox" name="isFree" defaultChecked={initial?.isFree ?? false} className="h-5 w-5 accent-brand-600" />
          Miễn phí cho mọi người (nhãn Free)
        </label>
        <p className="pl-8 text-sm text-gray-600">Không chọn: chỉ học sinh đã đăng ký gói mới làm được (khi có chức năng gói học).</p>
        <label className="flex items-center gap-3 py-2 font-semibold">
          <input type="checkbox" name="published" defaultChecked={initial?.published ?? true} className="h-5 w-5 accent-brand-600" />
          Hiện ngay trên website
        </label>
        <p className="pl-8 text-sm text-gray-600">Bỏ chọn để soạn trước, chưa cho học sinh thấy.</p>
      </div>

      {result && (
        <div role={result.ok ? "status" : "alert"} className={`rounded-2xl p-4 font-bold ${result.ok ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200" : "bg-red-50 text-red-800 ring-1 ring-red-200"}`}>
          {result.message}
          {result.ok && result.href && (
            <Link href={result.href} className="ml-2 underline">Xem đề trên website →</Link>
          )}
        </div>
      )}

      <button type="submit" disabled={Boolean(busy)} className="btn-toy w-full rounded-full bg-brand-600 px-6 py-4 text-lg font-extrabold text-white disabled:opacity-60">
        {busy ?? (editing ? "Lưu thay đổi" : "Tải đề lên")}
      </button>
    </form>
  );
}
