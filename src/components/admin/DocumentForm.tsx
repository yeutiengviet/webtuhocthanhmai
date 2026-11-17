"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createDocument, discardUpload, updateDocument, type ActionResult } from "@/app/quan-tri/actions";
import { uploadToStorage } from "@/components/admin/FileSlot";
import { DOC_CATEGORIES, titleFromFileName, validateDocumentInput, type DocCategory } from "@/lib/document-meta";
import { checkFileContent, kindFromFileName, MAX_FILE_BYTES } from "@/lib/exam-meta";
import type { SubjectSlug } from "@/lib/types";

export interface DocumentFormInitial {
  id: string;
  subject: SubjectSlug;
  grade: number;
  category: DocCategory;
  title: string;
  isFree: boolean;
  published: boolean;
}

const field = "mt-1 block w-full rounded-2xl border-2 bg-white px-4 py-3 font-semibold text-gray-900 focus:border-brand-500";
const label = "block font-extrabold text-gray-800";

/** Một file PDF cô đã chọn, kèm tên tài liệu (tự gợi ý từ tên file, sửa được). */
interface Picked {
  key: string;
  file: File;
  title: string;
  error: string | null;
  status: "cho" | "dang-tai" | "xong" | "loi";
  message?: string;
}

async function checkPdf(f: File): Promise<string | null> {
  if (kindFromFileName(f.name) !== "pdf") return "Chỉ nhận file .pdf.";
  if (f.size > MAX_FILE_BYTES) return "File quá lớn (tối đa 10 MB).";
  return checkFileContent(new Uint8Array(await f.slice(0, 8192).arrayBuffer()), "pdf");
}

/**
 * Tải tài liệu lên mục "Tài liệu".
 * - Thêm mới: chọn lớp, môn, nhóm rồi chọn MỘT HOẶC NHIỀU file PDF cùng lúc; mỗi file thành một tài liệu (tên lấy theo tên file, sửa được).
 * - Sửa: đổi tên / lớp / môn / nhóm, thay file PDF.
 */
export function DocumentForm({ initial }: { initial?: DocumentFormInitial }) {
  const router = useRouter();
  const editing = Boolean(initial);
  const [subject, setSubject] = useState<SubjectSlug>(initial?.subject ?? "tieng-viet");
  const [category, setCategory] = useState<DocCategory>(initial?.category ?? "doc-hieu");
  const [picked, setPicked] = useState<Picked[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [inputKey, setInputKey] = useState(0);

  function onSubject(s: SubjectSlug) {
    setSubject(s);
    setCategory(DOC_CATEGORIES[s][0].slug);
  }

  async function pick(files: FileList | null) {
    setResult(null);
    const list = Array.from(files ?? []);
    if (editing) list.splice(1);
    const next: Picked[] = [];
    for (const f of list) {
      next.push({ key: `${f.name}-${f.size}-${f.lastModified}-${Math.random()}`, file: f, title: titleFromFileName(f.name), error: await checkPdf(f), status: "cho" });
    }
    setPicked(editing ? next : (old) => [...old.filter((p) => p.status !== "xong"), ...next]);
  }

  const update = (key: string, patch: Partial<Picked>) => setPicked((old) => old.map((p) => (p.key === key ? { ...p, ...patch } : p)));

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult(null);
    const fd = new FormData(e.currentTarget);
    const base = {
      subject,
      grade: fd.get("grade"),
      category,
      isFree: fd.get("isFree") === "on",
      published: fd.get("published") === "on",
    };

    if (editing) {
      const raw = { ...base, title: fd.get("title") };
      const v = validateDocumentInput(raw);
      if (!v.ok) return setErrors(v.errors);
      setErrors({});
      const p = picked[0];
      if (p?.error) return;
      let pdfFileId: string | undefined;
      try {
        if (p) {
          setBusy("Đang tải file lên kho…");
          const id = await uploadToStorage(p.file, "pdf", "documents");
          if (!id) return setResult({ ok: false, message: "Chưa tải được file lên. Cô kiểm tra mạng rồi thử lại." });
          pdfFileId = id;
        }
        setBusy("Đang lưu…");
        const res = await updateDocument(initial!.id, { ...raw, pdfFileId });
        setResult(res);
        if (!res.ok) {
          if (res.errors) setErrors(res.errors);
          if (pdfFileId) await discardUpload(pdfFileId, "pdf", "documents");
          return;
        }
        setPicked([]);
        setInputKey((k) => k + 1);
        router.refresh();
      } catch {
        setResult({ ok: false, message: "Có lỗi khi gửi. Cô thử lại sau ít phút." });
        if (pdfFileId) await discardUpload(pdfFileId, "pdf", "documents");
      } finally {
        setBusy(null);
      }
      return;
    }

    // Thêm mới: kiểm tra phần chung trước (dùng tên tạm), rồi từng file.
    const common = validateDocumentInput({ ...base, title: "tạm thời" });
    if (!common.ok) return setErrors(common.errors);
    setErrors({});
    const todo = picked.filter((p) => p.status !== "xong");
    if (todo.length === 0) return setResult({ ok: false, message: "Cô chọn ít nhất một file PDF." });
    if (todo.some((p) => p.error)) return setResult({ ok: false, message: "Có file chưa hợp lệ (đánh dấu đỏ). Cô bỏ file đó ra rồi thử lại." });
    if (todo.some((p) => p.title.trim().length < 3)) return setResult({ ok: false, message: "Tên tài liệu cần ít nhất 3 ký tự." });

    let ok = 0;
    for (const [i, p] of todo.entries()) {
      setBusy(`Đang tải ${i + 1}/${todo.length}: ${p.title}`);
      update(p.key, { status: "dang-tai", message: undefined });
      let id: string | null = null;
      try {
        id = await uploadToStorage(p.file, "pdf", "documents");
        if (!id) {
          update(p.key, { status: "loi", message: "Chưa tải được file lên (mạng?)." });
          continue;
        }
        const res = await createDocument({ ...base, title: p.title, pdfFileId: id });
        if (res.ok) {
          ok++;
          update(p.key, { status: "xong", message: "Đã tải lên" });
        } else {
          update(p.key, { status: "loi", message: res.errors?.title ?? res.message });
          await discardUpload(id, "pdf", "documents");
        }
      } catch {
        update(p.key, { status: "loi", message: "Có lỗi khi gửi." });
        if (id) await discardUpload(id, "pdf", "documents");
      }
    }
    setBusy(null);
    setInputKey((k) => k + 1);
    const fail = todo.length - ok;
    setResult(
      fail === 0
        ? { ok: true, message: `Đã tải lên ${ok} tài liệu.`, href: `/tai-lieu/lop-${common.data.grade}` }
        : { ok: false, message: `Đã tải ${ok} tài liệu, còn ${fail} file chưa được (xem dòng báo đỏ). Cô bấm tải lại để thử tiếp.` },
    );
    router.refresh();
  }

  const err = (k: string) => (errors[k] ? <span className="mt-1 block text-sm font-bold text-red-700">{errors[k]}</span> : null);
  const border = (k: string) => (errors[k] ? "border-red-400" : "border-gray-200");
  const categories = DOC_CATEGORIES[subject];

  return (
    <form onSubmit={submit} className="space-y-5 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-brand-100 sm:p-7" noValidate>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className={label}>
          Lớp
          <select name="grade" className={`${field} ${border("grade")}`} defaultValue={String(initial?.grade ?? 1)}>
            {[1, 2, 3, 4, 5].map((g) => <option key={g} value={g}>Lớp {g}</option>)}
          </select>
          {err("grade")}
        </label>
        <label className={label}>
          Môn
          <select name="subject" className={`${field} ${border("subject")}`} value={subject} onChange={(e) => onSubject(e.target.value as SubjectSlug)}>
            <option value="toan">Toán</option>
            <option value="tieng-viet">Tiếng Việt</option>
          </select>
          {err("subject")}
        </label>
        <label className={label}>
          Nhóm
          <select name="category" className={`${field} ${border("category")}`} value={category} onChange={(e) => setCategory(e.target.value as DocCategory)} disabled={categories.length === 1}>
            {categories.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
          </select>
          {err("category")}
        </label>
      </div>

      {editing && (
        <label className={label}>
          Tên tài liệu
          <input name="title" className={`${field} ${border("title")}`} defaultValue={initial?.title} maxLength={200} required />
          {err("title")}
        </label>
      )}

      <div className="rounded-2xl bg-gray-50 p-3">
        <p className="font-extrabold text-gray-800"><span aria-hidden>⬇️</span> File PDF {editing ? "(chọn file mới nếu muốn thay)" : "(chọn được nhiều file một lần)"}</p>
        {!editing && <p className="text-sm text-gray-600">Mỗi file thành một tài liệu. Tên tài liệu lấy theo tên file — cô sửa lại ở ô bên dưới nếu cần.</p>}
        <label className="mt-2 block cursor-pointer rounded-2xl border-2 border-dashed border-brand-300 bg-white p-4 text-center">
          <span className="block font-extrabold text-brand-700">Bấm để chọn file PDF</span>
          <span className="mt-1 block text-xs text-gray-600">Tối đa 10 MB mỗi file</span>
          <input key={inputKey} type="file" multiple={!editing} accept=".pdf,application/pdf" className="sr-only" onChange={(e) => pick(e.target.files)} aria-label="Chọn file PDF" />
        </label>
        {picked.length > 0 && (
          <ul className="mt-3 space-y-2">
            {picked.map((p) => (
              <li key={p.key} className={`rounded-2xl bg-white p-3 ring-1 ${p.error || p.status === "loi" ? "ring-red-300" : p.status === "xong" ? "ring-emerald-300" : "ring-gray-200"}`}>
                <p className="text-xs font-semibold text-gray-600">📄 {p.file.name}</p>
                {!editing && (
                  <label className="mt-1 block text-sm font-extrabold text-gray-800">
                    Tên tài liệu
                    <input
                      value={p.title}
                      onChange={(e) => update(p.key, { title: e.target.value })}
                      disabled={p.status === "xong" || p.status === "dang-tai"}
                      maxLength={200}
                      className="mt-1 block w-full rounded-xl border-2 border-gray-200 px-3 py-2 font-semibold"
                    />
                  </label>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm font-bold">
                  {p.error && <span role="alert" className="text-red-700">{p.error}</span>}
                  {p.status === "dang-tai" && <span className="text-brand-700">Đang tải…</span>}
                  {p.status === "xong" && <span className="text-emerald-800">✓ {p.message}</span>}
                  {p.status === "loi" && <span role="alert" className="text-red-700">✗ {p.message}</span>}
                  {p.status !== "dang-tai" && p.status !== "xong" && (
                    <button type="button" onClick={() => setPicked((old) => old.filter((x) => x.key !== p.key))} className="ml-auto min-h-9 rounded-full px-3 text-red-700 ring-1 ring-red-200">
                      Bỏ file
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-1 rounded-2xl bg-gray-50 p-4">
        <label className="flex items-center gap-3 py-2 font-semibold">
          <input type="checkbox" name="isFree" defaultChecked={initial?.isFree ?? true} className="h-5 w-5 accent-brand-600" />
          Miễn phí cho mọi người (nhãn Free)
        </label>
        <label className="flex items-center gap-3 py-2 font-semibold">
          <input type="checkbox" name="published" defaultChecked={initial?.published ?? true} className="h-5 w-5 accent-brand-600" />
          Hiện ngay trên website
        </label>
        <p className="pl-8 text-sm text-gray-600">Ai cũng xem được PDF trên web; tải về theo quyền tải của tài khoản phụ huynh (còn hạn tải là tải được).</p>
      </div>

      {result && (
        <div role={result.ok ? "status" : "alert"} className={`rounded-2xl p-4 font-bold ${result.ok ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200" : "bg-red-50 text-red-800 ring-1 ring-red-200"}`}>
          {result.message}
          {result.ok && result.href && (
            <Link href={result.href} className="ml-2 underline">Xem trên website →</Link>
          )}
        </div>
      )}

      <button type="submit" disabled={Boolean(busy)} className="btn-toy w-full rounded-full bg-brand-600 px-6 py-4 text-lg font-extrabold text-white disabled:opacity-60">
        {busy ?? (editing ? "Lưu thay đổi" : "Tải tài liệu lên")}
      </button>
    </form>
  );
}
