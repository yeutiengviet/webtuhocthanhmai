import Link from "next/link";
import { redirect } from "next/navigation";
import { ParentSignOutButton } from "@/components/ParentSignOutButton";
import { Container, GRADE_THEME, PageHero } from "@/components/ui";
import { GRADES, gradeSlug } from "@/lib/content";
import { phoneFromAccountEmail } from "@/lib/account-id";
import { getAdmin } from "@/lib/supabase/server";

export const metadata = { title: "Tài khoản", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ moi?: string }> }) {
  let ctx: Awaited<ReturnType<typeof getAdmin>> | null = null;
  try {
    ctx = await getAdmin();
  } catch {
    ctx = null;
  }
  if (!ctx?.user) redirect("/dang-nhap?next=/tai-khoan");
  const { user, isAdmin } = ctx;
  const { moi } = await searchParams;
  const meta = (user.user_metadata ?? {}) as { full_name?: string; grade?: string | null };
  const name = typeof meta.full_name === "string" && meta.full_name.trim() ? meta.full_name.trim() : null;
  const childGrade = Number(meta.grade);
  const grades = GRADES.includes(childGrade as (typeof GRADES)[number])
    ? [childGrade as (typeof GRADES)[number], ...GRADES.filter((g) => g !== childGrade)]
    : [...GRADES];

  return (
    <>
      <PageHero badge="Tài khoản phụ huynh · Miễn phí" title={name ? `Chào ${name}!` : "Tài khoản của tôi"} subtitle={phoneFromAccountEmail(user.email) ? `Số điện thoại: ${phoneFromAccountEmail(user.email)}` : (user.email ?? undefined)} />
      <Container className="max-w-4xl space-y-6 py-8">
        {moi && (
          <p role="status" className="rounded-3xl bg-emerald-50 p-4 font-bold text-emerald-900 ring-1 ring-emerald-200">
            <span aria-hidden>🎉</span> Tạo tài khoản thành công! Toàn bộ bài học đã mở cho con — chọn lớp bên dưới để bắt đầu.
          </p>
        )}
        {isAdmin && (
          <Link href="/quan-tri" className="btn-toy inline-block rounded-full bg-violet-700 px-6 py-3 font-extrabold text-white">Vào trang quản trị →</Link>
        )}

        <section>
          <h2 className="text-2xl text-gray-900">Học theo lớp</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {grades.map((g) => {
              const t = GRADE_THEME[g];
              return (
                <li key={g} className={`rounded-3xl bg-white p-4 shadow-sm ring-2 ${t.ring}`}>
                  <p className="flex items-center gap-2 font-display text-2xl font-extrabold text-gray-900">
                    <span aria-hidden>{t.emoji}</span> Lớp {g}
                    {g === childGrade && <span className="rounded-full bg-emerald-700 px-2.5 py-0.5 text-xs font-extrabold text-white">Lớp của con</span>}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-extrabold">
                    <Link href={`/toan/${gradeSlug(g)}/theo-tuan`} className="rounded-2xl bg-brand-50 px-3 py-2.5 text-center text-brand-800 ring-1 ring-brand-200">🔢 Toán theo tuần</Link>
                    <Link href={`/tieng-viet/${gradeSlug(g)}/theo-tuan`} className="rounded-2xl bg-accent-50 px-3 py-2.5 text-center text-accent-700 ring-1 ring-accent-200">📖 Tiếng Việt theo tuần</Link>
                    <Link href={`/toan/${gradeSlug(g)}/on-tap-he`} className="rounded-2xl bg-amber-50 px-3 py-2.5 text-center text-amber-900 ring-1 ring-amber-200">☀️ Ôn hè Toán</Link>
                    <Link href={`/tieng-viet/${gradeSlug(g)}/on-tap-he`} className="rounded-2xl bg-amber-50 px-3 py-2.5 text-center text-amber-900 ring-1 ring-amber-200">☀️ Ôn hè Tiếng Việt</Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="flex flex-wrap items-center gap-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <Link href="/doi-mat-khau" className="min-h-11 rounded-full bg-white px-5 py-2.5 font-extrabold text-brand-700 ring-2 ring-brand-200">Đổi mật khẩu</Link>
          <ParentSignOutButton />
        </section>
      </Container>
    </>
  );
}
