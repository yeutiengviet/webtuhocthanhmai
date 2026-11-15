import Link from "next/link";
import { BannerCarousel } from "@/components/BannerCarousel";
import { Container } from "@/components/ui";
import { site } from "@/data/site";
import { allCourses, courseStats, getCourses, GRADES, gradeSlug, SUBJECTS } from "@/lib/content";

export default function HomePage() {
  // Con số tin cậy: chỉ dùng số đếm thật từ dữ liệu + số chủ dự án tự điền.
  const totals = allCourses().reduce(
    (acc, c) => {
      const s = courseStats(c);
      return { weeks: acc.weeks + s.weeks, videos: acc.videos + s.videos, worksheets: acc.worksheets + s.worksheets + s.tests };
    },
    { weeks: 0, videos: 0, worksheets: 0 },
  );
  const stats = [
    { label: "tuần học theo sách", value: String(totals.weeks) },
    { label: "video bài giảng (dự kiến)", value: String(totals.videos) },
    { label: "phiếu & đề luyện tập (dự kiến)", value: String(totals.worksheets) },
    ...site.extraStats,
  ];

  return (
    <>
      {/* 1. Câu nói truyền cảm hứng + video giới thiệu */}
      <section className="bg-gradient-to-r from-brand-700 to-accent-700 text-white">
        <Container className="flex flex-col items-start gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-accent-100">{site.name}</p>
            <p className="mt-1 text-2xl font-bold sm:text-3xl">“{site.quote}”</p>
          </div>
          <Link href="/gioi-thieu#video" className="flex items-center gap-2 rounded-full bg-white px-5 py-3 font-semibold text-brand-700 shadow hover:bg-accent-50">
            <span aria-hidden className="grid h-7 w-7 place-items-center rounded-full bg-brand-600 text-sm text-white">▶</span>
            Xem video giới thiệu
          </Link>
        </Container>
      </section>

      {/* 2. Banner */}
      <Container className="pt-6">
        <BannerCarousel banners={site.banners} />
      </Container>

      {/* 3. Con số */}
      <Container className="pt-8">
        <ul className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <li key={s.label} className="rounded-2xl bg-white p-3 text-center shadow-sm sm:p-5">
              <p className="text-2xl font-extrabold text-brand-700 sm:text-4xl">{s.value}</p>
              <p className="mt-1 text-xs text-gray-700 sm:text-sm">{s.label}</p>
            </li>
          ))}
        </ul>
      </Container>

      {/* 4. Năm cam kết */}
      <Container className="pt-10">
        <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">5 cam kết với phụ huynh</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {site.commitments.map((c, i) => (
            <li key={c.title} className="rounded-2xl border border-accent-200 bg-white p-4">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-700 font-bold text-white">{i + 1}</span>
              <p className="mt-2 font-semibold text-gray-900">{c.title}</p>
              <p className="mt-1 text-sm text-gray-700">{c.text}</p>
            </li>
          ))}
        </ol>
      </Container>

      {/* 5. Hai ô lớn Toán / Tiếng Việt */}
      <Container className="pt-10">
        <div className="grid gap-4 sm:grid-cols-2">
          {SUBJECTS.map((s) => {
            const has = getCourses(s.slug).length > 0;
            return (
              <Link
                key={s.slug}
                href={`/${s.slug}`}
                className={`rounded-3xl p-6 text-white shadow-md transition hover:scale-[1.01] sm:p-8 ${s.slug === "toan" ? "bg-gradient-to-br from-brand-800 to-brand-600" : "bg-gradient-to-br from-accent-700 to-brand-700"}`}
              >
                <p className="text-3xl font-extrabold sm:text-4xl">{s.name}</p>
                <p className="mt-2 text-white/95">{s.shortDescription}</p>
                <p className="mt-4 inline-block rounded-full bg-white px-3 py-1 text-sm font-semibold text-brand-800">
                  {has ? "Vào xem →" : "Sắp ra mắt"}
                </p>
              </Link>
            );
          })}
        </div>
      </Container>

      {/* 6. Lưới chọn lớp */}
      <Container className="pt-10">
        <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Chọn lớp</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {GRADES.map((g) => {
            const has = getCourses("toan", g).length > 0 || getCourses("tieng-viet", g).length > 0;
            return (
              <Link
                key={g}
                href={has ? `/toan/${gradeSlug(g)}` : "/toan"}
                className={`rounded-2xl border-2 p-5 text-center ${has ? "border-brand-500 bg-white" : "border-gray-200 bg-gray-50"}`}
              >
                <p className="text-sm text-gray-600">Lớp</p>
                <p className={`text-4xl font-extrabold ${has ? "text-brand-700" : "text-gray-400"}`}>{g}</p>
                <p className={`mt-1 text-sm font-medium ${has ? "text-green-700" : "text-gray-500"}`}>{has ? "Bản dùng thử" : "Sắp ra mắt"}</p>
              </Link>
            );
          })}
        </div>
      </Container>

      {/* 7. Phản hồi phụ huynh (chỉ hiện khi có phản hồi thật) + hướng dẫn */}
      {site.testimonials.length > 0 && (
        <Container className="pt-10">
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Phụ huynh nói gì</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {site.testimonials.map((t) => (
              <li key={t.name} className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="italic text-gray-800">“{t.text}”</p>
                <p className="mt-2 text-sm font-semibold text-brand-700">{t.name}</p>
              </li>
            ))}
          </ul>
        </Container>
      )}

      <Container className="pt-10">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">Hướng dẫn cách học</h2>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-gray-800">
              <li>Chọn môn và lớp của con.</li>
              <li>Mở tuần học đúng với tuần trên lớp.</li>
              <li>Xem video bài giảng, rồi làm phiếu luyện tập.</li>
              <li>Làm lại phiếu để đạt điểm cao hơn.</li>
            </ol>
            <Link href="/huong-dan" className="mt-3 inline-block py-2 font-semibold text-brand-700 underline">Xem chi tiết</Link>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">Hướng dẫn nộp phí</h2>
            <p className="mt-2 rounded-lg bg-accent-50 p-2 text-sm font-semibold text-accent-700">Bản dùng thử: chưa mở đăng ký gói, vui lòng chưa chuyển khoản.</p>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-gray-800">
              <li>Đăng ký tài khoản phụ huynh, thêm hồ sơ của con.</li>
              <li>Chọn gói học (môn + lớp + số tháng).</li>
              <li>Chuyển khoản đúng số tiền và nội dung website đưa ra.</li>
              <li>Cô xác nhận, bài học được mở cho con.</li>
            </ol>
            <Link href="/thanh-toan" className="mt-3 inline-block py-2 font-semibold text-brand-700 underline">Xem chi tiết</Link>
          </div>
        </div>
      </Container>
    </>
  );
}
