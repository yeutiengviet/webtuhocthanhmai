"use client";

import { useState } from "react";
import { blockedMessage, type DownloadDecision } from "@/lib/download-access";

/** Nút "In bài": xanh khi tài khoản được tải/in tài liệu này; xám (bấm hiện lời nhắn) khi chưa. */
export function PrintButton({ decision }: { decision: DownloadDecision }) {
  const [notice, setNotice] = useState(false);
  if (!decision.ok) {
    return (
      <span className="inline-flex flex-col gap-2">
        <button
          type="button"
          data-khoa="true"
          aria-expanded={notice}
          onClick={() => setNotice((v) => !v)}
          title={blockedMessage(decision.reason)}
          className="rounded-full border-2 border-gray-300 bg-gray-100 px-5 py-2.5 font-semibold text-gray-700"
        >
          In bài
        </button>
        {notice && <span role="status" className="max-w-xs text-sm font-bold text-amber-900">🔒 {blockedMessage(decision.reason)}</span>}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full border-2 border-brand-600 px-5 py-2.5 font-semibold text-brand-700 hover:bg-brand-50"
    >
      In bài
    </button>
  );
}
