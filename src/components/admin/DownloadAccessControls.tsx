"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { extendDownload, revokeDownload, type ActionResult } from "@/app/quan-tri/actions";
import { EXTEND_MONTHS } from "@/lib/download-access";

/** Nút gia hạn tải PDF (+1 / +3 / +6 tháng, cộng dồn) và thu hồi cho một tài khoản phụ huynh. */
export function DownloadAccessControls({ userId, name, active }: { userId: string; name: string; active: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);

  async function run(fn: () => Promise<ActionResult>) {
    setBusy(true);
    setResult(null);
    try {
      const res = await fn();
      setResult(res);
      if (res.ok) router.refresh();
    } catch {
      setResult({ ok: false, message: "Có lỗi khi gửi. Cô thử lại sau ít phút." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {EXTEND_MONTHS.map((m) => (
        <button
          key={m}
          type="button"
          disabled={busy}
          onClick={() => run(() => extendDownload(userId, m))}
          aria-label={`Gia hạn tải PDF ${m} tháng cho ${name}`}
          className="min-h-9 rounded-full bg-emerald-600 px-3 text-xs font-extrabold text-white disabled:opacity-60"
        >
          +{m} tháng
        </button>
      ))}
      {active && (
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (window.confirm(`Thu hồi quyền tải PDF của ${name}? Nút tải của tài khoản này sẽ chuyển xám ngay.`)) run(() => revokeDownload(userId));
          }}
          className="min-h-9 rounded-full bg-white px-3 text-xs font-extrabold text-red-700 ring-2 ring-red-200 disabled:opacity-60"
        >
          Thu hồi
        </button>
      )}
      {result && (
        <span role={result.ok ? "status" : "alert"} className={`w-full text-xs font-bold ${result.ok ? "text-emerald-800" : "text-red-700"}`}>
          {result.message}
        </span>
      )}
    </div>
  );
}
