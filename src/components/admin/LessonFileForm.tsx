"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveLessonFiles, type ActionResult } from "@/app/quan-tri/actions";
import { discardPair, FileSlot, uploadPair, useFilePair, type UploadedIds } from "@/components/admin/FileSlot";
import { discardImages, ImageListEditor, initialImageEntries, uploadImage, type ImageEntry } from "@/components/admin/ImageListEditor";
import type { ImageExt } from "@/lib/exam-meta";

export function LessonFileForm({
  itemId,
  accepts,
  initial,
  publicHref,
  images = [],
}: {
  itemId: string;
  accepts: { html: boolean; pdf: boolean; images: boolean };
  initial: { hasHtml: boolean; hasPdf: boolean; isFree: boolean; published: boolean } | null;
  publicHref: string;
  /** Đường dẫn các ảnh đang có (mục ảnh), theo thứ tự. */
  images?: string[];
}) {
  const router = useRouter();
  const pair = useFilePair();
  const [imageEntries, setImageEntries] = useState<ImageEntry[]>(() => initialImageEntries(images));
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<ActionResult | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult(null);
    const fd = new FormData(e.currentTarget);
    if (accepts.images) return submitImages(fd);
    if (!initial && !pair.html && !pair.pdf) {
      setResult({ ok: false, message: accepts.html ? "Cô chọn ít nhất một file: phiếu tương tác hoặc phiếu PDF." : "Cô chọn file PDF trước nhé." });
      return;
    }
    if (pair.htmlError || pair.pdfError) return;
    let ids: UploadedIds = {};
    try {
      if (pair.html || pair.pdf) {
        setBusy("Đang tải file lên kho…");
        const up = await uploadPair({ html: pair.html, pdf: pair.pdf }, "lessons");
        if (!up) {
          setResult({ ok: false, message: "Chưa tải được file lên. Cô kiểm tra mạng rồi thử lại." });
          return;
        }
        ids = up;
      }
      setBusy("Đang kiểm tra file và lưu…");
      const res = await saveLessonFiles(itemId, {
        ...ids,
        removeHtml: pair.removeHtml,
        removePdf: pair.removePdf,
        isFree: fd.get("isFree") === "on",
        published: fd.get("published") === "on",
      });
      setResult(res);
      if (!res.ok) {
        await discardPair(ids, "lessons");
        return;
      }
      pair.clear();
      router.refresh();
    } catch {
      setResult({ ok: false, message: "Có lỗi khi gửi. Cô thử lại sau ít phút." });
      await discardPair(ids, "lessons");
    } finally {
      setBusy(null);
    }
  }

  /** Mục ảnh: tải các ảnh mới lên kho rồi lưu cả danh sách theo thứ tự cô sắp. */
  async function submitImages(fd: FormData) {
    if (!initial && imageEntries.length === 0) {
      setResult({ ok: false, message: "Cô chọn ít nhất một ảnh nhé." });
      return;
    }
    const uploaded: { fileId: string; ext: ImageExt }[] = [];
    try {
      const list: ({ keep: number } | { fileId: string; ext: ImageExt })[] = [];
      const fresh = imageEntries.filter((e) => "file" in e).length;
      for (const e of imageEntries) {
        if ("keep" in e) {
          list.push({ keep: e.keep });
          continue;
        }
        setBusy(`Đang tải ảnh lên kho (${uploaded.length + 1}/${fresh})…`);
        const fileId = await uploadImage(e.file, e.ext);
        if (!fileId) {
          setResult({ ok: false, message: "Chưa tải được ảnh lên. Cô kiểm tra mạng rồi thử lại." });
          await discardImages(uploaded);
          return;
        }
        uploaded.push({ fileId, ext: e.ext });
        list.push({ fileId, ext: e.ext });
      }
      setBusy("Đang kiểm tra ảnh và lưu…");
      const res = await saveLessonFiles(itemId, {
        images: list,
        isFree: fd.get("isFree") === "on",
        published: fd.get("published") === "on",
      });
      setResult(res);
      if (!res.ok) {
        await discardImages(uploaded);
        return;
      }
      router.refresh();
    } catch {
      setResult({ ok: false, message: "Có lỗi khi gửi. Cô thử lại sau ít phút." });
      await discardImages(uploaded);
    } finally {
      setBusy(null);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-brand-100 sm:p-7" noValidate>
      {accepts.html && <FileSlot key={`html-${pair.generation}`} {...pair.slot("html", Boolean(initial?.hasHtml))} />}
      {accepts.pdf && <FileSlot key={`pdf-${pair.generation}`} {...pair.slot("pdf", Boolean(initial?.hasPdf))} />}
      {accepts.images && <ImageListEditor entries={imageEntries} onChange={setImageEntries} />}

      <div className="space-y-1 rounded-2xl bg-gray-50 p-4">
        <label className="flex items-center gap-3 py-2 font-semibold">
          <input type="checkbox" name="isFree" defaultChecked={initial?.isFree ?? true} className="h-5 w-5 accent-brand-600" />
          Ai cũng xem được, kể cả chưa đăng nhập (nhãn Free)
        </label>
        <label className="flex items-center gap-3 py-2 font-semibold">
          <input type="checkbox" name="published" defaultChecked={initial?.published ?? true} className="h-5 w-5 accent-brand-600" />
          Hiện ngay trên website
        </label>
      </div>

      {result && (
        <div role={result.ok ? "status" : "alert"} className={`rounded-2xl p-4 font-bold ${result.ok ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200" : "bg-red-50 text-red-800 ring-1 ring-red-200"}`}>
          {result.message}
          {result.ok && <Link href={publicHref} className="ml-2 underline">Xem trên website →</Link>}
        </div>
      )}

      <button type="submit" disabled={Boolean(busy)} className="btn-toy w-full rounded-full bg-brand-600 px-6 py-4 text-lg font-extrabold text-white disabled:opacity-60">
        {busy ?? (accepts.images ? "Lưu ảnh" : "Lưu phiếu")}
      </button>
    </form>
  );
}
