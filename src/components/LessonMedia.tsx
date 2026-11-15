import { safeWorksheetUrl, youtubeId } from "@/lib/content";

/**
 * Video YouTube (chế độ không công khai). Dùng tên miền youtube-nocookie.com để hạn chế cookie theo dõi.
 * Chỉ được gọi khi người xem có quyền — trang bài giảng kiểm tra trước khi render.
 */
export function VideoEmbed({ videoRef, title }: { videoRef: string | null; title: string }) {
  const id = youtubeId(videoRef);
  if (!id) {
    return (
      <div className="grid aspect-video w-full place-items-center rounded-2xl bg-gray-900 p-6 text-center text-white">
        <div>
          <p className="text-4xl" aria-hidden>▶</p>
          <p className="mt-2 font-semibold">Video bài giảng đang được cập nhật</p>
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
 *  - allow-same-origin: CHỈ an toàn vì phiếu nằm ở tên miền KHÁC website (github.io);
 *    nó chỉ đọc được dữ liệu của chính tên miền đó, không đọc được phiên đăng nhập của website.
 *    Khi chuyển phiếu vào kho riêng (Giai đoạn 2), phiếu cũng sẽ được phục vụ từ một tên miền tách riêng.
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
