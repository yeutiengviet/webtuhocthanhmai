import Link from "next/link";
import { MissingMigration } from "@/components/admin/MissingMigration";
import { NotAdmin } from "@/components/admin/NotAdmin";
import { Container, PageHero } from "@/components/ui";
import { requireAdminPage } from "@/lib/admin";
import { adminLessonFiles } from "@/lib/admin-lessons";
import { attemptStats, formatVnDateTime, type AttemptStat } from "@/lib/admin-stats";
import { findItemById, TRACK_LABELS, weekLabel } from "@/lib/content";
import { EXAM_CATEGORY_LABELS } from "@/lib/exam-meta";
import { EXAM_COLUMNS, toExam, type ExamRow } from "@/lib/exams";

export const metadata = { title: "Lượt làm bài" };

interface Row {
  key: string;
  group: string;
  title: string;
  sub: string;
  href: string;
  stat: AttemptStat;
}

const EMPTY: AttemptStat = { total: 0, accounts: 0, last: null };
const GROUPS = ["Đề thi", "Ôn tập hè", "Học theo tuần", "Nâng cao theo chuyên đề"];

export default async function AdminAttempts({ searchParams }: { searchParams: Promise<{ nhom?: string }> }) {
  const { supabase, user, isAdmin } = await requireAdminPage();
  if (!isAdmin) return <NotAdmin email={user?.email} />;
  const sp = await searchParams;
  const group = GROUPS.includes(sp.nhom ?? "") ? sp.nhom! : "";
  const [{ stats, error, missing }, examsRes, lessons] = await Promise.all([attemptStats(supabase), supabase.from("exams").select(EXAM_COLUMNS), adminLessonFiles(supabase)]);

  const rows: Row[] = [];
  for (const e of ((examsRes.data ?? []) as ExamRow[]).map(toExam)) {
    if (!(e.hasFile && e.fileKind === "html")) continue;
    rows.push({
      key: `de:${e.id}`,
      group: "Đề thi",
      title: e.title,
      sub: `${e.subject === "toan" ? "Toán" : "Tiếng Việt"} lớp ${e.grade} · ${EXAM_CATEGORY_LABELS[e.category]}${e.published ? "" : " · đang ẩn"}`,
      href: `/quan-tri/de/${e.id}`,
      stat: stats.get(`de:${e.id}`) ?? EMPTY,
    });
  }
  for (const r of lessons.rows.values()) {
    if (!r.html_path) continue;
    const found = findItemById(r.item_id);
    if (!found) continue;
    const { course, week, item } = found;
    rows.push({
      key: `bai:${r.item_id}`,
      group: course.track === "on-tap-he" ? "Ôn tập hè" : TRACK_LABELS[course.track].name,
      title: course.track === "on-tap-he" ? `${week.label ?? ""} – Đề ${item.order}` : item.title,
      sub: `${course.subject === "toan" ? "Toán" : "Tiếng Việt"} lớp ${course.grade} · ${weekLabel(course, week)}${r.published ? "" : " · đang ẩn"}`,
      href: `/quan-tri/bai-hoc/${course.id}/${item.id}`,
      stat: stats.get(`bai:${r.item_id}`) ?? EMPTY,
    });
  }
  const shown = rows.filter((r) => !group || r.group === group).sort((a, b) => b.stat.total - a.stat.total || a.sub.localeCompare(b.sub, "vi") || a.title.localeCompare(b.title, "vi"));
  const sum = (list: Row[]) => list.reduce((a, r) => a + r.stat.total, 0);

  return (
    <>
      <PageHero badge="Trang quản trị" title="Lượt làm bài" subtitle="Mỗi lần học sinh mở phiếu tương tác để làm bài được tính một lượt (cô mở để kiểm tra thì không tính)." />
      <Container className="max-w-4xl space-y-5 py-8">
        <Link href="/quan-tri" className="inline-block py-2 font-extrabold text-brand-700 underline">← Trang quản trị</Link>
        {missing ? (
          <MissingMigration />
        ) : error ? (
          <p role="alert" className="rounded-2xl bg-red-50 p-3 font-bold text-red-800">Chưa tải được số liệu. Cô tải lại trang sau ít phút.</p>
        ) : (
          <>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <li className="rounded-3xl bg-brand-600 p-4 text-white shadow-sm">
                <p className="text-sm font-bold">Tổng lượt làm</p>
                <p className="font-display text-3xl font-extrabold">{sum(rows)}</p>
              </li>
              {GROUPS.map((g) => (
                <li key={g} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-brand-100">
                  <p className="text-sm font-bold text-gray-700">{g}</p>
                  <p className="font-display text-3xl font-extrabold text-gray-900">{sum(rows.filter((r) => r.group === g))}</p>
                </li>
              ))}
            </ul>
            <nav aria-label="Lọc theo nhóm" className="flex flex-wrap gap-2">
              {["", ...GROUPS].map((g) => (
                <Link key={g || "all"} href={g ? `/quan-tri/luot-lam?nhom=${encodeURIComponent(g)}` : "/quan-tri/luot-lam"} aria-current={group === g ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center rounded-full px-4 font-extrabold ring-2 ${group === g ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-brand-800 ring-brand-200"}`}>
                  {g || "Tất cả"}
                </Link>
              ))}
            </nav>
            {shown.length === 0 ? (
              <p className="rounded-3xl border-2 border-dashed border-brand-200 bg-white p-5 text-center font-semibold text-gray-700">Chưa có đề/phiếu tương tác nào trong nhóm này.</p>
            ) : (
              <div className="overflow-x-auto rounded-3xl bg-white shadow-sm ring-1 ring-brand-100">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead className="bg-brand-600 text-white">
                    <tr>
                      <th scope="col" className="px-3 py-3 font-extrabold">Đề / phiếu</th>
                      <th scope="col" className="px-3 py-3 text-right font-extrabold">Lượt làm</th>
                      <th scope="col" className="px-3 py-3 text-right font-extrabold">Số tài khoản</th>
                      <th scope="col" className="px-3 py-3 font-extrabold">Lần gần nhất</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-100">
                    {shown.map((r) => (
                      <tr key={r.key} className="hover:bg-brand-50">
                        <td className="px-3 py-2">
                          <Link href={r.href} className="font-bold text-brand-700 hover:underline">{r.title}</Link>
                          <span className="block text-xs font-semibold text-gray-600">{r.group} · {r.sub}</span>
                        </td>
                        <td className="px-3 py-2 text-right font-display text-lg font-extrabold text-gray-900">{r.stat.total}</td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-700" title="Số tài khoản phụ huynh khác nhau đã làm (không tính khách chưa đăng nhập)">{r.stat.accounts}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-700">{formatVnDateTime(r.stat.last)}</td>
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
