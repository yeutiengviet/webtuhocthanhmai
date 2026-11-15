"use client";

export function PrintButton() {
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
