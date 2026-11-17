import Link from "next/link";
import { MissingMigration } from "@/components/admin/MissingMigration";
import { NotAdmin } from "@/components/admin/NotAdmin";
import { Container, PageHero } from "@/components/ui";
import { requireAdminPage } from "@/lib/admin";
import { countRecent, formatVnDateTime, listParents } from "@/lib/admin-stats";

export const metadata = { title: "Phụ huynh đăng ký" };

const GRADE_FILTERS = [
  { key: "", label: "Tất cả" },
  { key: "2", label: "Lớp 2" },
  { key: "3", label: "Lớp 3" },
  { key: "4", label: "Lớp 4" },
  { key: "5", label: "Lớp 5" },
  { key: "khac", label: "Chưa chọn lớp" },
];

export default async function AdminParents({ searchParams }: { searchParams: Promise<{ lop?: string; q?: string }> }) {
  const { supabase, user, isAdmin } = await requireAdminPage();
  if (!isAdmin) return <NotAdmin email={user?.email} />;
  const sp = await searchParams;
  const lop = GRADE_FILTERS.some((f) => f.key === sp.lop) ? (sp.lop ?? "") : "";
  const q = (sp.q ?? "").trim().toLowerCase().slice(0, 60);
  const { parents, error, missing } = await listParents(supabase);

  const byGrade = (g: number | null) => parents.filter((p) => p.grade === g).length;
  const last7 = countRecent(parents, 7);
  const shown = parents.filter((p) => {
    if (lop === "khac" ? p.grade !== null : lop && p.grade !== Number(lop)) return false;
    if (!q) return true;
    return [p.fullName, p.phone, p.email].some((v) => v?.toLowerCase().includes(q));
  });

  return (
    <>
      <PageHero badge="Trang quản trị" title="Phụ huynh đăng ký" subtitle="Họ tên, số điện thoại và lớp của con — chỉ quản trị xem được." />
      <Container className="max-w-5xl space-y-5 py-8">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/quan-tri" className="inline-block py-2 font-extrabold text-brand-700 underline">← Trang quản trị</Link>
          {!error && parents.length > 0 && (
            // File tải về (route trả CSV) — dùng thẻ <a> thường, không điều hướng kiểu Link.
            // eslint-disable-next-line @next/next/no-html-link-for-pages
            <a href="/quan-tri/phu-huynh/tai-csv" className="btn-toy inline-flex items-center gap-2 rounded-full bg-accent-600 px-5 py-2.5 font-extrabold text-white">
              <span aria-hidden>📥</span> Tải danh sách (Excel/CSV)
            </a>
          )}
        </div>
        {missing ? (
          <MissingMigration />
        ) : error ? (
          <p role="alert" className="rounded-2xl bg-red-50 p-3 font-bold text-red-800">Chưa tải được danh sách. Cô tải lại trang sau ít phút.</p>
        ) : (
          <>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {[
                { label: "Tổng phụ huynh", value: parents.length, strong: true },
                { label: "Mới 7 ngày qua", value: last7 },
                { label: "Lớp 2", value: byGrade(2) },
                { label: "Lớp 3", value: byGrade(3) },
                { label: "Lớp 4", value: byGrade(4) },
                { label: "Lớp 5", value: byGrade(5) },
                { label: "Chưa chọn lớp", value: byGrade(null) },
              ].map((s) => (
                <li key={s.label} className={`rounded-3xl p-4 shadow-sm ring-1 ${s.strong ? "bg-brand-600 text-white ring-brand-700" : "bg-white ring-brand-100"}`}>
                  <p className={`text-sm font-bold ${s.strong ? "text-white" : "text-gray-700"}`}>{s.label}</p>
                  <p className="font-display text-3xl font-extrabold">{s.value}</p>
                </li>
              ))}
            </ul>

            <form className="flex flex-wrap items-end gap-2" action="/quan-tri/phu-huynh">
              <label className="text-sm font-bold text-gray-800">
                Tìm theo tên / SĐT / email
                <input name="q" defaultValue={sp.q ?? ""} className="mt-1 block w-64 max-w-full rounded-2xl border-2 border-brand-200 px-3 py-2" />
              </label>
              {lop && <input type="hidden" name="lop" value={lop} />}
              <button className="rounded-full bg-brand-600 px-5 py-2.5 font-extrabold text-white">Tìm</button>
            </form>
            <nav aria-label="Lọc theo lớp" className="flex flex-wrap gap-2">
              {GRADE_FILTERS.map((f) => {
                const params = new URLSearchParams({ ...(f.key ? { lop: f.key } : {}), ...(q ? { q } : {}) }).toString();
                return (
                  <Link key={f.key} href={`/quan-tri/phu-huynh${params ? `?${params}` : ""}`} aria-current={lop === f.key ? "page" : undefined}
                    className={`inline-flex min-h-11 items-center rounded-full px-4 font-extrabold ring-2 ${lop === f.key ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-brand-800 ring-brand-200"}`}>
                    {f.label}
                  </Link>
                );
              })}
            </nav>

            <p className="font-bold text-gray-800">Đang hiện {shown.length} / {parents.length} phụ huynh</p>
            {shown.length === 0 ? (
              <p className="rounded-3xl border-2 border-dashed border-brand-200 bg-white p-5 text-center font-semibold text-gray-700">Chưa có phụ huynh nào.</p>
            ) : (
              <div className="overflow-x-auto rounded-3xl bg-white shadow-sm ring-1 ring-brand-100">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-brand-600 text-white">
                    <tr>
                      <th scope="col" className="px-3 py-3 font-extrabold">#</th>
                      <th scope="col" className="px-3 py-3 font-extrabold">Họ tên phụ huynh</th>
                      <th scope="col" className="px-3 py-3 font-extrabold">Số điện thoại</th>
                      <th scope="col" className="px-3 py-3 font-extrabold">Lớp của con</th>
                      <th scope="col" className="px-3 py-3 font-extrabold">Email</th>
                      <th scope="col" className="px-3 py-3 font-extrabold">Ngày đăng ký</th>
                      <th scope="col" className="px-3 py-3 font-extrabold">Đăng nhập gần nhất</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-100">
                    {shown.map((p, i) => (
                      <tr key={p.id} className="hover:bg-brand-50">
                        <td className="px-3 py-2 text-gray-600">{i + 1}</td>
                        <td className="px-3 py-2 font-bold text-gray-900">{p.fullName ?? <span className="text-gray-500">—</span>}</td>
                        <td className="px-3 py-2">{p.phone ? <a href={`tel:${p.phone}`} className="font-semibold text-brand-700 underline">{p.phone}</a> : "—"}</td>
                        <td className="px-3 py-2 font-semibold">{p.grade ? `Lớp ${p.grade}` : "—"}</td>
                        <td className="px-3 py-2 text-gray-700">{p.email ?? "—"}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{formatVnDateTime(p.createdAt)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-700">{formatVnDateTime(p.lastSignInAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </Container>
    </>
  );
}
