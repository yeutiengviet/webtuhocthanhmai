import { Container, PageHero } from "@/components/ui";
import { EXAM_CATEGORY_LABELS, GRADES, SUBJECTS } from "@/lib/content";

export const metadata = { title: "Tải đề lên (bản xem trước)", robots: { index: false, follow: false } };

// BẢN XEM TRƯỚC THIẾT KẾ — chưa hoạt động.
// Khi có kho dữ liệu Supabase (Giai đoạn 2), trang này sẽ: yêu cầu đăng nhập quản trị,
// lưu file vào kho riêng tư (bucket không công khai), ghi đề vào bảng exams, và hiện ngay ở khu "Đề thi".
export default function UploadExamPreview() {
  const field = "mt-1 block w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 font-semibold text-gray-900 disabled:cursor-not-allowed disabled:bg-gray-50";
  const label = "block font-extrabold text-gray-800";
  return (
    <>
      <PageHero badge="Trang quản trị · Bản xem trước" title="Tải đề lên" subtitle="Đây là thiết kế màn hình cô sẽ dùng để tự tải đề. Màn hình chưa hoạt động cho đến khi có kho dữ liệu." />
      <Container className="max-w-2xl py-8">
        <p role="status" className="mb-6 rounded-3xl bg-amber-50 p-4 text-sm font-bold text-amber-900 ring-1 ring-amber-200">
          <span aria-hidden>🛠️</span> Chưa hoạt động: cần tạo kho dữ liệu Supabase trước. Mọi ô bên dưới đang bị khóa, bấm không có tác dụng.
        </p>

        <form className="space-y-5 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-brand-100 sm:p-7" aria-describedby="xem-truoc">
          <fieldset disabled className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={label}>
                Môn
                <select className={field} defaultValue="toan">
                  {SUBJECTS.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
                </select>
              </label>
              <label className={label}>
                Lớp
                <select className={field} defaultValue="4">
                  {GRADES.map((g) => <option key={g} value={g}>Lớp {g}</option>)}
                </select>
              </label>
            </div>

            <label className={label}>
              Tên đề
              <input className={field} placeholder="VD: Đề 2 – Giữa học kì I – Toán 4" />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className={label}>
                Loại đề
                <select className={field} defaultValue="giua-ki-1">
                  {Object.entries(EXAM_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
              <label className={label}>
                Thời gian làm bài (phút)
                <input className={field} type="number" min={5} max={120} defaultValue={40} />
              </label>
            </div>

            <div>
              <p className={label}>File đề</p>
              <div className="mt-1 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50 p-6 text-center">
                <p className="text-4xl" aria-hidden>📤</p>
                <p className="mt-2 font-extrabold text-brand-700">Bấm để chọn file đề từ điện thoại hoặc máy tính</p>
                <p className="mt-1 text-sm text-gray-700">Nhận: phiếu tương tác <strong>.html</strong> (tự chấm điểm) hoặc đề in <strong>.pdf</strong>. Tối đa 10 MB.</p>
                <input type="file" accept=".html,.pdf" className="sr-only" aria-label="Chọn file đề" />
              </div>
            </div>

            <fieldset className="rounded-2xl bg-gray-50 p-4">
              <legend className="px-1 font-extrabold text-gray-800">Ai được làm đề này?</legend>
              <label className="mt-1 flex items-center gap-3 py-2 font-semibold">
                <input type="radio" name="quyen" defaultChecked className="h-5 w-5 accent-brand-600" /> Chỉ học sinh đã đăng ký gói
              </label>
              <label className="flex items-center gap-3 py-2 font-semibold">
                <input type="radio" name="quyen" className="h-5 w-5 accent-brand-600" /> Miễn phí cho mọi người (nhãn Free)
              </label>
            </fieldset>

            <label className="flex items-center gap-3 font-semibold">
              <input type="checkbox" defaultChecked className="h-5 w-5 accent-brand-600" /> Hiện ngay trên website (bỏ chọn để soạn trước, chưa hiện)
            </label>

            <button type="submit" className="w-full rounded-full bg-brand-600 px-6 py-4 text-lg font-extrabold text-white disabled:opacity-60">
              Tải đề lên
            </button>
          </fieldset>
          <p id="xem-truoc" className="text-center text-sm font-semibold text-gray-600">Bản xem trước thiết kế — chưa lưu được dữ liệu.</p>
        </form>

        <section className="mt-8 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-accent-100 sm:p-7">
          <h2 className="text-2xl text-gray-900">Sau khi bấm “Tải đề lên” (khi đã hoạt động)</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-gray-800">
            <li>File được cất vào <strong>kho riêng tư</strong>: không ai mở được bằng cách đoán đường dẫn.</li>
            <li>Đề hiện ngay ở mục <strong>Đề thi → môn → lớp</strong>, đúng nhóm (giữa kì, cuối kì…).</li>
            <li>Đề <strong>Free</strong>: ai cũng làm được. Đề trả phí: chỉ học sinh có gói còn hạn mới mở được.</li>
            <li>Phiếu .html được mở trong <strong>khung cách ly</strong>: không đọc được tài khoản của học sinh.</li>
            <li>Cô sửa tên, đổi Free/trả phí, ẩn hoặc xóa đề bất cứ lúc nào trong danh sách đề.</li>
          </ol>
        </section>
      </Container>
    </>
  );
}
