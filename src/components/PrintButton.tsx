"use client";

import { features } from "@/data/site";

/** Nút "In bài". Đang tắt tải PDF thì nút vẫn hiện nhưng xám, bấm không được. */
export function PrintButton() {
  if (!features.allowPdfDownload) {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        title="Bài chỉ làm trên web, không in được"
        className="cursor-not-allowed rounded-full border-2 border-gray-300 bg-gray-100 px-5 py-2.5 font-semibold text-gray-500"
      >
        In bài
      </button>
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
