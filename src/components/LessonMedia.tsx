import { PdfActions, PdfViewer } from "@/components/PdfViewer";
import { features } from "@/data/site";
import { isOwnFileHref } from "@/lib/exam-meta";
import { safeWorksheetUrl, youtubeId } from "@/lib/urls";

/**
 * Video YouTube (chế độ không công khai). Dùng tên miền youtube-nocookie.com để hạn chế cookie theo dõi.
 * Chỉ được gọi khi người xem có quyền — trang bài giảng kiểm tra trước khi render.
 */
export function VideoEmbed({
  videoRef,
  title,
  placeholder = "Video bài giảng đang được cập nhật",
}: {
  videoRef: string | null;
  title: string;
  placeholder?: string;
}) {
  const id = youtubeId(videoRef);
  if (!id) {
    return (
      <div className="grid aspect-video w-full place-items-center rounded-2xl bg-gray-900 p-6 text-center text-white">
        <div>
          <p className="text-4xl" aria-hidden>▶</p>
          <p className="mt-2 font-semibold">{placeholder}</p>
          <p className="mt-1 text-sm text-gray-300">Cô Thanh Mai sẽ gắn video vào đây.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
      <iframe
        className="h-full w-full"
        src={`https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`}
        title={title}
        loading="lazy"
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}

/**
 * Phiếu bài tập HTML tương tác — coi là nội dung KHÔNG đáng tin.
 * Nhúng trong iframe có `sandbox`:
 *  - allow-scripts, allow-forms: để phiếu chạy và nộp điểm (Google Sheet cũ).
 *  - allow-same-origin: CHỈ an toàn vì phiếu nằm ở tên miền KHÁC website (github.io).
 *    Điều này được THỰC THI bởi safeWorksheetUrl (chỉ nhận tên miền trong WORKSHEET_HOSTS, từ chối tên miền website)
 *    và bởi CSP frame-src trong next.config.ts.
 *  - Không có allow-top-navigation: phiếu không thể chuyển hướng cả trang sang chỗ khác.
 */
export function WorksheetFrame({ url, title }: { url: string | null; title: string }) {
  const safe = safeWorksheetUrl(url);
  if (!safe) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-accent-200 bg-white p-6 text-center">
        <p className="text-3xl" aria-hidden>✎</p>
        <p className="mt-2 font-semibold text-accent-700">Phiếu bài tập đang được cô soạn</p>
        <p className="mt-1 text-sm text-gray-600">Khi có phiếu, con sẽ làm bài ngay tại đây và được chấm điểm tự động.</p>
      </div>
    );
  }
  return (
    <div>
      <iframe
        src={safe}
        title={title}
        className="h-[80vh] min-h-[520px] w-full rounded-2xl border border-gray-200 bg-white"
        sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-modals"
        referrerPolicy="no-referrer"
        loading="lazy"
      />
      <p className="no-print mt-2 text-sm text-gray-600">
        Nếu phiếu hiển thị chưa vừa màn hình,{" "}
        <a href={safe} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 underline">
          mở phiếu ở cửa sổ riêng
        </a>
        .
      </p>
    </div>
  );
}

/**
 * Phiếu HTML do cô tải lên kho riêng tư, phục vụ qua /phieu/[id] (cùng tên miền website).
 * Vì cùng tên miền nên TUYỆT ĐỐI KHÔNG có allow-same-origin: phiếu chạy ở "nguồn gốc rỗng" (opaque origin),
 * không đọc được cookie/phiên đăng nhập. Máy chủ còn gửi kèm header "CSP: sandbox" nên kể cả mở trực tiếp
 * (không qua khung) phiếu vẫn bị cách ly.
 */
export function UploadedWorksheetFrame({ src, title }: { src: string; title: string }) {
  if (!isOwnFileHref(src)) return null;
  return (
    <div>
      <iframe
        src={src}
        title={title}
        className="h-[80vh] min-h-[520px] w-full rounded-2xl border border-gray-200 bg-white"
        sandbox="allow-scripts allow-forms allow-popups allow-modals"
        referrerPolicy="no-referrer"
        loading="lazy"
      />
      <p className="no-print mt-2 text-sm text-gray-600">
        Nếu phiếu hiển thị chưa vừa màn hình,{" "}
        <a href={src} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 underline">mở phiếu ở cửa sổ riêng</a>.
      </p>
    </div>
  );
}

/**
 * PDF do cô tải lên, xem ngay trong trang (khi chưa có phiếu tương tác).
 * Đang tắt tải PDF: dùng khung "chỉ xem" (vẽ trang bằng pdf.js, không có nút tải/in của trình duyệt).
 */
export function UploadedPdf({ src, title }: { src: string; title: string }) {
  if (!isOwnFileHref(src)) return null;
  if (!features.allowPdfDownload) return <PdfViewer src={src} title={title} />;
  return <iframe src={src} title={title} className="h-[80vh] min-h-[520px] w-full rounded-2xl border border-gray-200 bg-white" loading="lazy" />;
}

/** Nút tải phiếu PDF về máy để in. Đang tắt tải PDF: nút vẫn hiện nhưng xám, bấm không được; vẫn "Xem PDF" được. */
export function PdfDownloadButton({
  src,
  fileName,
  label = "Tải phiếu PDF",
  title = "Phiếu PDF",
  viewHref,
}: {
  src: string;
  fileName: string;
  label?: string;
  title?: string;
  /** Trang đã hiện sẵn PDF bên dưới (vd. "#bai-lam"): "Xem PDF" chỉ cuộn tới đó. */
  viewHref?: string;
}) {
  if (!isOwnFileHref(src)) return null;
  return <PdfActions src={src} fileName={fileName} label={label} title={title} viewHref={viewHref} allowDownload={features.allowPdfDownload} />;
}
