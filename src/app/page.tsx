import Link from "next/link";
import { HeroArt, Icon, MathArt, VietArt } from "@/components/art";
import { BannerCarousel } from "@/components/BannerCarousel";
import { Container, GRADE_THEME } from "@/components/ui";
import { site } from "@/data/site";
import { allCourses, getCourses, GRADES, gradeSlug, isReady, publishedWeeks, SUBJECTS } from "@/lib/content";
import { countUploadedWorksheets } from "@/lib/lesson-files";

// Lưu sẵn trang, tự làm mới mỗi 60 giây để con số phiếu/đề luôn khớp với những gì cô đã tải lên.
export const revalidate = 60;

/** Số tuần học theo sách Kết nối tri thức trong một năm học. */
const WEEKS_PER_YEAR = 35;

const COMMIT_ICONS = ["📘", "✅", "👨‍👩‍👧", "🎁"];
const COMMIT_COLORS = ["bg-brand-50 ring-brand-200", "bg-emerald-50 ring-emerald-200", "bg-violet-50 ring-violet-200", "bg-amber-50 ring-amber-200"];

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-5">
      <p className="text-sm font-extrabold uppercase tracking-wider text-brand-600">{kicker}</p>
      <h2 className="text-2xl text-gray-900 sm:text-3xl">{title}</h2>
    </div>
  );
}

export default async function HomePage() {
  // Con số thật: video đã gắn đường dẫn, phiếu & đề đã tải lên (đọc từ kho).
  const videos = allCourses()
    .flatMap((c) => publishedWeeks(c).flatMap((w) => w.items))
    .filter((i) => i.type === "video" && isReady(i)).length;
  const worksheets = await countUploadedWorksheets();
  const stats = [
    { label: "tuần học theo sách", value: String(WEEKS_PER_YEAR), icon: "📚" },
    { label: "video bài giảng", value: String(videos), icon: "🎬" },
    { label: "phiếu & đề luyện tập", value: worksheets === null ? "—" : String(worksheets), icon: "📝" },
    ...site.extraStats.map((s) => ({ ...s, icon: "⭐" })),
  ];

  return (
    <>
      {/* 1. Câu nói truyền cảm hứng + video giới thiệu */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-100 via-brand-50 to-accent-50">
        <span aria-hidden className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-brand-200/60" />
        <span aria-hidden className="absolute -bottom-20 right-1/3 h-44 w-44 rounded-full bg-accent-200/50" />
        <Container className="relative grid items-center gap-6 py-8 sm:py-12 md:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-extrabold text-brand-700 shadow-sm">
              <Icon name="spark" className="h-4 w-4" /> Toán · Tiếng Việt lớp 1–5
            </p>
            <h1 className="mt-3 text-4xl text-gray-900 sm:text-5xl">
              Mỗi ngày <span className="text-brand-600">một bài nhỏ</span>,<br />
              cả năm <span className="text-accent-600">vững vàng</span>!
            </h1>
            <p className="mt-3 max-w-xl text-lg text-gray-700">
              Video bài giảng và phiếu luyện tập tương tác, bám sát sách <strong>Kết nối tri thức</strong> từng tuần — con học vui, phụ huynh yên tâm.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/toan" className="btn-toy inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-lg font-extrabold text-white">
                Vào học Toán <Icon name="arrow" className="h-5 w-5" />
              </Link>
              <Link href="/gioi-thieu" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-extrabold text-accent-700 shadow ring-2 ring-accent-200">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-600 text-white"><Icon name="play" className="h-4 w-4" /></span>
                Về cô Thanh Mai
              </Link>
            </div>
          </div>
          <HeroArt className="mx-auto w-full max-w-[260px] sm:max-w-sm md:max-w-md" />
        </Container>
      </section>

      {/* 3. Con số */}
      <Container className="relative -mt-4">
        <ul className="grid grid-cols-3 gap-2 sm:gap-4">
          {stats.map((s) => (
            <li key={s.label} className="rounded-3xl bg-white p-3 text-center shadow-md ring-1 ring-brand-100 sm:p-5">
              <p className="text-2xl" aria-hidden>{s.icon}</p>
              <p className="font-display text-3xl font-extrabold text-brand-600 sm:text-5xl">{s.value}</p>
              <p className="text-xs font-semibold text-gray-600 sm:text-sm">{s.label}</p>
            </li>
          ))}
        </ul>
      </Container>

      {/* 2. Banner */}
      <Container className="pt-8">
        <BannerCarousel banners={site.banners} />
      </Container>

      {/* 5. Hai ô lớn Toán / Tiếng Việt */}
      <Container className="pt-12">
        <SectionTitle kicker="Chọn môn học" title="Con muốn học môn gì hôm nay?" />
        <div className="grid gap-4 sm:grid-cols-2">
          {SUBJECTS.map((s) => {
            const has = getCourses(s.slug).length > 0;
            const isMath = s.slug === "toan";
            return (
              <Link
                key={s.slug}
                href={`/${s.slug}`}
                className={`card-lift relative flex items-center gap-4 overflow-hidden rounded-[2rem] p-6 text-white shadow-lg sm:p-8 ${isMath ? "bg-gradient-to-br from-brand-600 to-brand-700" : "bg-gradient-to-br from-accent-600 to-accent-700"}`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-4xl font-extrabold sm:text-5xl">{s.name}</span>
                  <span className="mt-1 block font-semibold text-white">{s.shortDescription}</span>
                  <span className={`mt-4 inline-flex items-center gap-1 rounded-full bg-white px-4 py-1.5 text-sm font-extrabold ${isMath ? "text-brand-700" : "text-accent-700"}`}>
                    {has ? "Vào xem →" : "Sắp ra mắt"}
                  </span>
                </span>
                {isMath ? <MathArt className="h-24 w-24 shrink-0 sm:h-32 sm:w-32" /> : <VietArt className="h-24 w-24 shrink-0 sm:h-32 sm:w-32" />}
              </Link>
            );
          })}
        </div>
      </Container>

      {/* 6. Lưới chọn lớp */}
      <Container className="pt-12">
        <SectionTitle kicker="Chọn lớp" title="Con đang học lớp mấy?" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
          {GRADES.map((g) => {
            const t = GRADE_THEME[g];
            const has = getCourses("toan", g).length > 0 || getCourses("tieng-viet", g).length > 0;
            return (
              <Link
                key={g}
                href={has ? `/toan/${gradeSlug(g)}` : "/toan"}
                className={`card-lift relative overflow-hidden rounded-[2rem] bg-white p-5 text-center shadow-sm ring-2 ${has ? t.ring : "ring-gray-100"}`}
              >
                <span aria-hidden className={`absolute -right-5 -top-5 h-16 w-16 rounded-full ${t.soft}`} />
                <span aria-hidden className="relative text-3xl">{t.emoji}</span>
                <p className="relative text-sm font-bold text-gray-600">Lớp</p>
                <p className={`relative font-display text-6xl font-extrabold leading-none ${has ? t.text : "text-gray-400"}`}>{g}</p>
                <p className={`relative mt-2 inline-block rounded-full px-3 py-1 text-xs font-extrabold ${has ? `${t.bg} text-white` : "bg-gray-100 text-gray-600"}`}>
                  {has ? "Vào học" : "Sắp ra mắt"}
                </p>
              </Link>
            );
          })}
        </div>
      </Container>

      {/* Đề ôn tập hè */}
      <Container className="pt-12">
        <SectionTitle kicker="Ôn tập hè" title="Đề ôn tập hè – chuẩn bị lên lớp" />
        <div className="rounded-[2rem] bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-5 shadow-sm ring-2 ring-amber-200 sm:p-6">
          <p className="text-gray-800"><span aria-hidden>☀️</span> Mỗi lớp có bộ <strong>đề ôn tập hè Toán và Tiếng Việt</strong>: con làm bài tương tác ngay trên web, nộp là được chấm điểm tự động.</p>
          <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {GRADES.map((g) => (
              <li key={g} className="rounded-2xl bg-white p-3 ring-1 ring-amber-200">
                <p className="font-display text-xl font-extrabold text-gray-900">Lớp {g}</p>
                <div className="mt-2 flex flex-col gap-1.5 text-sm font-extrabold">
                  <Link href={`/toan/${gradeSlug(g)}/on-tap-he`} className="rounded-full bg-brand-600 px-3 py-2 text-center text-white">Toán</Link>
                  <Link href={`/tieng-viet/${gradeSlug(g)}/on-tap-he`} className="rounded-full bg-accent-600 px-3 py-2 text-center text-white">Tiếng Việt</Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Container>

      {/* 4. Các cam kết */}
      <Container className="pt-12">
        <SectionTitle kicker="Vì sao chọn cô Thanh Mai" title={`${site.commitments.length} cam kết với phụ huynh`} />
        <ol className="grid gap-3 sm:grid-cols-3">
          {site.commitments.map((c, i) => (
            <li key={c.title} className={`rounded-3xl p-5 ring-2 ${COMMIT_COLORS[i % COMMIT_COLORS.length]}`}>
              <span aria-hidden className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-2xl shadow-sm">{COMMIT_ICONS[i % COMMIT_ICONS.length]}</span>
              <p className="mt-3 font-display text-lg font-extrabold leading-tight text-gray-900">{c.title}</p>
              <p className="mt-1 text-sm text-gray-700">{c.text}</p>
            </li>
          ))}
        </ol>
      </Container>

      {/* 7. Phản hồi phụ huynh (chỉ hiện khi có phản hồi thật) */}
      {site.testimonials.length > 0 && (
        <Container className="pt-12">
          <SectionTitle kicker="Phụ huynh nói gì" title="Cảm nhận của phụ huynh" />
          <ul className="grid gap-3 sm:grid-cols-3">
            {site.testimonials.map((t) => (
              <li key={t.name} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-brand-100">
                <p className="text-gray-800">“{t.text}”</p>
                <p className="mt-2 text-sm font-extrabold text-brand-700">{t.name}</p>
              </li>
            ))}
          </ul>
        </Container>
      )}

      {/* 7. Hướng dẫn học + nộp phí */}
      <Container className="pt-12">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-brand-100">
            <h2 className="flex items-center gap-2 text-2xl text-gray-900"><span aria-hidden>🧭</span> Hướng dẫn cách học</h2>
            <ol className="mt-4 space-y-3">
              {["Chọn môn và lớp của con.", "Mở tuần học đúng với tuần trên lớp.", "Xem video bài giảng, rồi làm phiếu luyện tập.", "Làm lại phiếu để đạt điểm cao hơn."].map((t, i) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-600 font-display font-extrabold text-white">{i + 1}</span>
                  <span className="pt-1 text-gray-800">{t}</span>
                </li>
              ))}
            </ol>
            <Link href="/huong-dan" className="mt-4 inline-block py-2 font-extrabold text-brand-700 underline">Xem chi tiết</Link>
          </div>
          <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-accent-100">
            <h2 className="flex items-center gap-2 text-2xl text-gray-900"><span aria-hidden>🎁</span> Tạo tài khoản miễn phí</h2>
            <p className="mt-3 rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-900 ring-1 ring-emerald-200">Hiện tại toàn bộ bài học miễn phí — phụ huynh không cần chuyển khoản.</p>
            <ol className="mt-4 space-y-3">
              {["Bấm “Tạo tài khoản”, nhập họ tên phụ huynh, số điện thoại (hoặc email) và mật khẩu.", "Không cần mã xác nhận — tạo xong là vào học ngay.", "Đăng nhập — mọi bài giảng, phiếu luyện tập và đề ôn tập hè đều mở.", "Con làm bài trực tiếp trên web, nộp là có điểm ngay."].map((t, i) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-600 font-display font-extrabold text-white">{i + 1}</span>
                  <span className="pt-1 text-gray-800">{t}</span>
                </li>
              ))}
            </ol>
            <Link href="/dang-nhap?tab=dang-ky" className="btn-toy mt-4 inline-block rounded-full bg-accent-600 px-6 py-3 font-extrabold text-white">Tạo tài khoản miễn phí</Link>
          </div>
        </div>
      </Container>
    </>
  );
}
