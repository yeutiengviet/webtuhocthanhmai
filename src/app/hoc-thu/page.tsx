import Link from "next/link";
import { Container, ItemIcon, LevelBadge, PageHero } from "@/components/ui";
import { freeItems, getSubject, isReady, itemHref } from "@/lib/content";

export const metadata = { title: "Học thử" };

export default function TrialPage() {
  const list = freeItems();
  return (
    <>
      <PageHero title="Học thử miễn phí" subtitle="Các bài có nhãn Free — không cần đăng nhập, không cần đăng ký gói." />
      <Container className="py-8">
        <ul className="grid gap-3 sm:grid-cols-2">
          {list.map(({ course, week, item }) => (
            <li key={item.id}>
              <Link href={itemHref(course, week, item)} className="flex h-full items-start gap-3 rounded-2xl bg-white p-4 shadow-sm hover:bg-brand-50">
                <ItemIcon type={item.type} />
                <span className="min-w-0">
                  <span className="block text-sm text-gray-600">
                    {getSubject(course.subject)?.name} lớp {course.grade} · Tuần {week.number}
                  </span>
                  <span className="block font-semibold text-gray-900">{item.title}</span>
                  <span className="mt-1 flex items-center gap-2">
                    <LevelBadge level={item.level} />
                    {!isReady(item) && <span className="text-xs text-gray-500">đang cập nhật</span>}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
