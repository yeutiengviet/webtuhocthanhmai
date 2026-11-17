"use client";

import { useEffect, useRef, useState } from "react";
import { discardUpload } from "@/app/quan-tri/actions";
import { IMAGE_MIME, imageExtFromBytes, MAX_FILE_BYTES, MAX_IMAGES, storagePath, type ImageExt } from "@/lib/exam-meta";
import { STORAGE_BUCKET } from "@/lib/supabase/env";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

/** Một ảnh trong danh sách: ảnh đã có (giữ lại, theo số thứ tự cũ) hoặc ảnh mới chọn từ máy. */
export type ImageEntry =
  | { key: string; keep: number; src: string }
  | { key: string; file: File; ext: ImageExt; src: string };

let seq = 0;
const nextKey = () => `anh-${++seq}`;

export function initialImageEntries(srcs: string[]): ImageEntry[] {
  return srcs.map((src, i) => ({ key: nextKey(), keep: i, src }));
}

/** Cạnh dài nhất khi phải chuyển ảnh sang JPG (ảnh quá nặng hoặc dạng HEIC…). */
const MAX_SIDE = 3000;

/**
 * Chuẩn bị ảnh trước khi tải: JPG/PNG/WEBP dưới 10 MB giữ nguyên.
 * Ảnh nặng hơn hoặc dạng khác mà trình duyệt mở được (vd. HEIC trên iPhone/Safari) → thu nhỏ, chuyển sang JPG.
 */
async function prepareImage(file: File): Promise<{ file: File; ext: ImageExt } | { error: string }> {
  const ext = imageExtFromBytes(new Uint8Array(await file.slice(0, 16).arrayBuffer()));
  if (ext && file.size <= MAX_FILE_BYTES) return { file, ext };
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    if (!blob || blob.size > MAX_FILE_BYTES) return { error: "Ảnh quá lớn (tối đa 10 MB)." };
    return { file: new File([blob], file.name.replace(/\.[^.]*$/, "") + ".jpg", { type: "image/jpeg" }), ext: "jpg" };
  } catch {
    return { error: "Không đọc được ảnh này. Cô chọn ảnh dạng JPG hoặc PNG nhé." };
  }
}

/** Tải một ảnh lên kho (thư mục lessons/), tên file do hệ thống đặt. Trả về mã file. */
export async function uploadImage(file: File, ext: ImageExt): Promise<string | null> {
  const fileId = crypto.randomUUID();
  const { error } = await createSupabaseBrowser()
    .storage.from(STORAGE_BUCKET)
    .upload(storagePath(fileId, ext, "lessons"), file, { contentType: IMAGE_MIME[ext], upsert: false });
  return error ? null : fileId;
}

export async function discardImages(uploaded: { fileId: string; ext: ImageExt }[]): Promise<void> {
  await Promise.all(uploaded.map((u) => discardUpload(u.fileId, u.ext, "lessons")));
}

/** Ô quản lý nhiều ảnh: thêm (chọn nhiều ảnh một lúc), sắp thứ tự, gỡ ảnh. */
export function ImageListEditor({ entries, onChange }: { entries: ImageEntry[]; onChange: (next: ImageEntry[]) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  // Giải phóng ảnh xem trước của file mới khi rời trang
  const created = useRef<string[]>([]);
  useEffect(() => () => created.current.forEach((u) => URL.revokeObjectURL(u)), []);

  async function pick(list: FileList | null) {
    setError(null);
    if (!list?.length) return;
    const room = MAX_IMAGES - entries.length;
    if (room <= 0) return setError(`Mỗi mục tối đa ${MAX_IMAGES} ảnh.`);
    setChecking(true);
    const added: ImageEntry[] = [];
    const problems: string[] = [];
    for (const f of [...list].slice(0, room)) {
      const r = await prepareImage(f);
      if ("error" in r) {
        problems.push(`${f.name}: ${r.error}`);
        continue;
      }
      const src = URL.createObjectURL(r.file);
      created.current.push(src);
      added.push({ key: nextKey(), file: r.file, ext: r.ext, src });
    }
    setChecking(false);
    if (list.length > room) problems.push(`Chỉ thêm được ${room} ảnh (mỗi mục tối đa ${MAX_IMAGES} ảnh).`);
    if (problems.length) setError(problems.join(" "));
    if (added.length) onChange([...entries, ...added]);
  }

  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= entries.length) return;
    const next = [...entries];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="rounded-2xl bg-gray-50 p-3">
      <p className="font-extrabold text-gray-800"><span aria-hidden>🖼️</span> Ảnh ({entries.length}/{MAX_IMAGES})</p>
      <p className="text-sm text-gray-600">Chọn được nhiều ảnh một lúc. Ảnh hiện trên website theo đúng thứ tự dưới đây; dùng nút ↑ ↓ để đổi thứ tự.</p>

      {entries.length > 0 && (
        <ol className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {entries.map((e, i) => (
            <li key={e.key} className="overflow-hidden rounded-2xl bg-white ring-1 ring-brand-100">
              {/* eslint-disable-next-line @next/next/no-img-element -- ảnh xem trước (file trên máy hoặc ảnh riêng tư qua route có kiểm tra quyền) */}
              <img src={e.src} alt={`Ảnh ${i + 1}`} className="aspect-[3/4] w-full bg-gray-100 object-contain" />
              <div className="flex items-center gap-1 p-1.5">
                <span className="flex-1 text-sm font-extrabold text-gray-800">
                  {i + 1}
                  {"file" in e && <span className="ml-1 rounded-full bg-emerald-100 px-1.5 text-xs text-emerald-800">mới</span>}
                </span>
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 font-extrabold text-brand-700 disabled:opacity-30" aria-label={`Đưa ảnh ${i + 1} lên trước`}>↑</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === entries.length - 1} className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 font-extrabold text-brand-700 disabled:opacity-30" aria-label={`Đưa ảnh ${i + 1} xuống sau`}>↓</button>
                <button type="button" onClick={() => onChange(entries.filter((x) => x.key !== e.key))} className="grid h-9 w-9 place-items-center rounded-full bg-red-50 font-extrabold text-red-700" aria-label={`Gỡ ảnh ${i + 1}`}>✕</button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <label className={`mt-3 block cursor-pointer rounded-2xl border-2 border-dashed p-4 text-center ${error ? "border-red-400 bg-red-50" : "border-brand-300 bg-white"}`}>
        <span className="block font-extrabold text-brand-700">{checking ? "Đang kiểm tra ảnh…" : "Bấm để thêm ảnh"}</span>
        <span className="mt-1 block text-xs text-gray-600">JPG, PNG hoặc WEBP · mỗi ảnh tối đa 10 MB (ảnh nặng hơn được tự thu nhỏ)</span>
        <input type="file" multiple accept="image/*" className="sr-only" aria-label="Chọn ảnh" onChange={(ev) => { pick(ev.target.files); ev.target.value = ""; }} />
      </label>
      {error && <span role="alert" className="mt-1 block text-sm font-bold text-red-700">{error}</span>}
    </div>
  );
}
