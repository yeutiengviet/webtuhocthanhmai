"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteExam, setExamFlags } from "@/app/quan-tri/actions";

export function ExamRowActions({ id, title, published, isFree }: { id: string; title: string; published: boolean; isFree: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run(fn: () => Promise<{ ok: boolean; message: string }>) {
    setBusy(true);
    setMsg(null);
    const r = await fn();
    setBusy(false);
    if (!r.ok) setMsg(r.message);
    router.refresh();
  }

  const btn = "min-h-11 rounded-full px-4 text-sm font-extrabold ring-2 disabled:opacity-50";
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <Link href={`/quan-tri/de/${id}`} className={`${btn} inline-flex items-center bg-brand-600 text-white ring-brand-600`}>Sửa</Link>
      <button type="button" disabled={busy} onClick={() => run(() => setExamFlags(id, { published: !published }))} className={`${btn} bg-white text-accent-700 ring-accent-200`}>
        {published ? "Ẩn khỏi website" : "Hiện lên website"}
      </button>
      <button type="button" disabled={busy} onClick={() => run(() => setExamFlags(id, { isFree: !isFree }))} className={`${btn} bg-white text-emerald-800 ring-emerald-200`}>
        {isFree ? "Bỏ Free" : "Đặt Free"}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          if (window.confirm(`Xóa hẳn đề “${title}”? Không khôi phục được.`)) run(() => deleteExam(id));
        }}
        className={`${btn} bg-white text-red-700 ring-red-200`}
      >
        Xóa
      </button>
      {msg && <p role="alert" className="w-full text-sm font-bold text-red-700">{msg}</p>}
    </div>
  );
}
