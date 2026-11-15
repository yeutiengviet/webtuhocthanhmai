"use client";

import { discardUpload } from "@/app/quan-tri/actions";
import { useState } from "react";
import { checkFileContent, kindFromFileName, MAX_FILE_BYTES, storagePath, type FileKind, type StorageFolder } from "@/lib/exam-meta";
import { STORAGE_BUCKET } from "@/lib/supabase/env";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

const TEXT: Record<FileKind, { title: string; icon: string; hint: string; aria: string }> = {
  html: { title: "Phiếu tương tác (.html)", icon: "✏️", hint: "Học sinh làm và được chấm điểm ngay trên website.", aria: "Chọn phiếu tương tác" },
  pdf: { title: "Phiếu PDF để tải về (.pdf)", icon: "⬇️", hint: "Phụ huynh tải về để in cho con làm trên giấy.", aria: "Chọn file PDF" },
};

/** Một ô chọn file (chỉ nhận đúng loại html hoặc pdf). Kiểm tra nội dung file ngay khi chọn. */
export function FileSlot({
  kind,
  current,
  file,
  onFile,
  remove,
  onRemove,
  error,
  onError,
}: {
  kind: FileKind;
  current: boolean;
  file: File | null;
  onFile: (f: File | null) => void;
  remove: boolean;
  onRemove: (v: boolean) => void;
  error: string | null;
  onError: (e: string | null) => void;
}) {
  const [checking, setChecking] = useState(false);
  const t = TEXT[kind];

  async function pick(f: File | null) {
    onError(null);
    onFile(null);
    if (!f) return;
    if (kindFromFileName(f.name) !== kind) return onError(kind === "html" ? "Ô này chỉ nhận file .html (phiếu tương tác)." : "Ô này chỉ nhận file .pdf.");
    if (f.size > MAX_FILE_BYTES) return onError("File quá lớn (tối đa 10 MB).");
    setChecking(true);
    const problem = checkFileContent(new Uint8Array(await f.slice(0, 8192).arrayBuffer()), kind);
    setChecking(false);
    if (problem) return onError(problem);
    onFile(f);
    onRemove(false);
  }

  return (
    <div className="rounded-2xl bg-gray-50 p-3">
      <p className="font-extrabold text-gray-800">
        <span aria-hidden>{t.icon}</span> {t.title}
      </p>
      <p className="text-sm text-gray-600">{t.hint}</p>
      {current && !file && (
        <p className={`mt-1 text-sm font-semibold ${remove ? "text-red-700 line-through" : "text-emerald-800"}`}>✓ Đã có file. Chọn file mới để thay.</p>
      )}
      <label className={`mt-2 block cursor-pointer rounded-2xl border-2 border-dashed p-4 text-center ${error ? "border-red-400 bg-red-50" : "border-brand-300 bg-white"}`}>
        <span className="block font-extrabold text-brand-700">{checking ? "Đang kiểm tra file…" : file ? `Đã chọn: ${file.name}` : "Bấm để chọn file"}</span>
        <span className="mt-1 block text-xs text-gray-600">Tối đa 10 MB</span>
        <input type="file" accept={kind === "html" ? ".html,.htm,text/html" : ".pdf,application/pdf"} className="sr-only" onChange={(e) => pick(e.target.files?.[0] ?? null)} aria-label={t.aria} />
      </label>
      {error && <span role="alert" className="mt-1 block text-sm font-bold text-red-700">{error}</span>}
      {current && !file && (
        <label className="mt-2 flex items-center gap-2 text-sm font-semibold text-red-700">
          <input type="checkbox" checked={remove} onChange={(e) => onRemove(e.target.checked)} className="h-5 w-5 accent-red-600" />
          Gỡ file này
        </label>
      )}
    </div>
  );
}

/** Tải file lên kho (thư mục exams/ hoặc lessons/), tên file do hệ thống đặt. Trả về mã file. */
export async function uploadToStorage(file: File, kind: FileKind, folder: StorageFolder): Promise<string | null> {
  const fileId = crypto.randomUUID();
  const { error } = await createSupabaseBrowser()
    .storage.from(STORAGE_BUCKET)
    .upload(storagePath(fileId, kind, folder), file, { contentType: kind === "html" ? "text/html" : "application/pdf", upsert: false });
  return error ? null : fileId;
}

/** Trạng thái cho một cặp ô (tương tác + PDF). */
export function useFilePair() {
  const [html, setHtml] = useState<File | null>(null);
  const [pdf, setPdf] = useState<File | null>(null);
  const [removeHtml, setRemoveHtml] = useState(false);
  const [removePdf, setRemovePdf] = useState(false);
  const [htmlError, setHtmlError] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  // Tăng số này để vẽ lại ô chọn file (xóa tên file đã chọn) sau khi lưu xong.
  const [generation, setGeneration] = useState(0);
  return {
    html, pdf, removeHtml, removePdf, htmlError, pdfError, generation,
    slot(kind: FileKind, current: boolean) {
      return kind === "html"
        ? { kind, current, file: html, onFile: setHtml, remove: removeHtml, onRemove: setRemoveHtml, error: htmlError, onError: setHtmlError }
        : { kind, current, file: pdf, onFile: setPdf, remove: removePdf, onRemove: setRemovePdf, error: pdfError, onError: setPdfError };
    },
    clear() {
      setHtml(null);
      setPdf(null);
      setRemoveHtml(false);
      setRemovePdf(false);
      setGeneration((g) => g + 1);
    },
  };
}

export type UploadedIds = { htmlFileId?: string; pdfFileId?: string };

/** Tải lên các file đã chọn. Lỗi giữa chừng thì gỡ file đã lên kho. */
export async function uploadPair(files: { html: File | null; pdf: File | null }, folder: StorageFolder): Promise<UploadedIds | null> {
  const ids: UploadedIds = {};
  if (files.html) {
    const id = await uploadToStorage(files.html, "html", folder);
    if (!id) return null;
    ids.htmlFileId = id;
  }
  if (files.pdf) {
    const id = await uploadToStorage(files.pdf, "pdf", folder);
    if (!id) {
      await discardPair(ids, folder);
      return null;
    }
    ids.pdfFileId = id;
  }
  return ids;
}

export async function discardPair(ids: UploadedIds, folder: StorageFolder): Promise<void> {
  await Promise.all([
    ids.htmlFileId ? discardUpload(ids.htmlFileId, "html", folder) : null,
    ids.pdfFileId ? discardUpload(ids.pdfFileId, "pdf", folder) : null,
  ]);
}
