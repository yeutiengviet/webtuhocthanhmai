"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { blockedMessage, type DownloadDecision } from "@/lib/download-access";
import { PDF_VIEW_HEADER } from "@/lib/exam-meta";

/**
 * Xem PDF ngay trên trang, KHÔNG dùng trình xem PDF của trình duyệt (vốn có nút tải/in):
 * vẽ từng trang thành ảnh bằng pdf.js. Chặn chuột phải, và không in ra được (ẩn khi in).
 * Chạy được cả trên điện thoại (trình duyệt điện thoại thường tự tải PDF về thay vì hiện).
 */
export function PdfViewer({ src, title }: { src: string; title: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [pages, setPages] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let destroy: (() => void) | undefined;
    (async () => {
      try {
        const res = await fetch(src, { headers: { [PDF_VIEW_HEADER]: "1" }, credentials: "same-origin", cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const data = new Uint8Array(await res.arrayBuffer());
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
        const task = pdfjs.getDocument({ data });
        destroy = () => void task.destroy();
        const doc = await task.promise;
        if (cancelled) return destroy();
        setPages(doc.numPages);
        const el = box.current;
        if (!el) return;
        el.replaceChildren();
        const width = Math.max(280, el.clientWidth);
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        for (let n = 1; n <= doc.numPages && !cancelled; n++) {
          const page = await doc.getPage(n);
          const base = page.getViewport({ scale: 1 });
          const vp = page.getViewport({ scale: (width / base.width) * ratio });
          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(vp.width);
          canvas.height = Math.floor(vp.height);
          canvas.className = "block h-auto w-full rounded-xl bg-white shadow-sm ring-1 ring-gray-200";
          canvas.setAttribute("aria-label", `${title} – trang ${n}`);
          canvas.setAttribute("role", "img");
          el.appendChild(canvas);
          await page.render({ canvas, viewport: vp }).promise;
          if (n === 1 && !cancelled) setState("ready");
        }
        if (!cancelled) setState("ready");
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [src, title]);

  return (
    <div className="pdf-view-only rounded-2xl bg-gray-100 p-2 sm:p-3" onContextMenu={(e) => e.preventDefault()} onDragStart={(e) => e.preventDefault()}>
      <p className="mb-2 px-1 text-sm font-semibold text-gray-700">
        <span aria-hidden>👀</span> Chỉ xem trên web{pages > 0 ? ` · ${pages} trang` : ""}
      </p>
      {state === "loading" && <p className="p-6 text-center font-semibold text-gray-600">Đang mở phiếu…</p>}
      {state === "error" && <p className="p-6 text-center font-semibold text-red-700">Chưa mở được phiếu. Phụ huynh tải lại trang sau ít phút.</p>}
      <div ref={box} className="max-h-[80vh] min-h-[200px] space-y-3 overflow-y-auto select-none" />
    </div>
  );
}

/**
 * Nút tải PDF và nút xem PDF.
 * - Được tải (decision.ok): nút tải XANH, bấm là tải về.
 * - Chưa được tải: nút tải vẫn hiện nhưng XÁM; bấm vào hiện lời nhắn (đăng nhập / liên hệ cô để gia hạn).
 * - "Xem PDF" luôn có: mở khung "chỉ xem" ngay bên dưới (hoặc cuộn tới khung đã có sẵn trên trang).
 * Máy chủ kiểm tra lại quyền khi tải (route /phieu/.../pdf) — nút chỉ để hiển thị.
 */
export function PdfActions({
  src,
  fileName,
  label,
  decision,
  title,
  viewHref,
}: {
  src: string;
  fileName: string;
  label: string;
  decision: DownloadDecision;
  title: string;
  /** Trang đã hiện sẵn khung xem PDF ở chỗ khác (vd. "#bai-lam"): "Xem PDF" chỉ cuộn tới đó. */
  viewHref?: string;
}) {
  // Mở sẵn khung xem khi đến từ nút "Xem PDF" ở trang danh sách (đường dẫn có #phieu-pdf).
  const hashOpen = useSyncExternalStore(subscribeHash, () => window.location.hash === "#phieu-pdf", () => false);
  const [toggled, setToggled] = useState<boolean | null>(null);
  const [notice, setNotice] = useState(false);
  const open = toggled ?? hashOpen;

  return (
    <div id="phieu-pdf" className="no-print flex w-full flex-wrap items-center gap-2 scroll-mt-28">
      {decision.ok ? (
        <a href={src} download={fileName} className="btn-toy inline-flex items-center gap-2 rounded-full bg-accent-600 px-6 py-3 font-extrabold text-white">
          <span aria-hidden>⬇️</span> {label}
        </a>
      ) : (
        <button
          type="button"
          data-khoa="true"
          aria-expanded={notice}
          onClick={() => setNotice((v) => !v)}
          title={blockedMessage(decision.reason)}
          className="inline-flex items-center gap-2 rounded-full bg-gray-300 px-6 py-3 font-extrabold text-gray-700"
        >
          <span aria-hidden>⬇️</span> {label}
        </button>
      )}
      {viewHref ? (
        <a href={viewHref} className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white px-4 font-extrabold text-brand-700 ring-2 ring-brand-200">
          <span aria-hidden>📄</span> Xem PDF
        </a>
      ) : (
        <button
          type="button"
          onClick={() => setToggled(!open)}
          aria-expanded={open}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white px-4 font-extrabold text-brand-700 ring-2 ring-brand-200"
        >
          <span aria-hidden>📄</span> {open ? "Đóng PDF" : "Xem PDF"}
        </button>
      )}
      {!decision.ok && notice && (
        <p role="status" className="w-full rounded-2xl bg-amber-50 px-4 py-2 text-sm font-bold text-amber-900 ring-1 ring-amber-200">
          🔒 {blockedMessage(decision.reason)}
          {decision.reason === "guest" && (
            <Link href="/dang-nhap" className="ml-1 underline">Đăng nhập</Link>
          )}
        </p>
      )}
      {open && !viewHref && (
        <div className="w-full">
          <PdfViewer src={src} title={title} />
        </div>
      )}
    </div>
  );
}

function subscribeHash(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}
