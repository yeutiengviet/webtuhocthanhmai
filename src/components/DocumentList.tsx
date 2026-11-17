import Link from "next/link";
import { Icon } from "@/components/art";
import { FreeBadge, LockBadge } from "@/components/ui";
import { DOC_CATEGORIES, documentHref, type DocumentInfo } from "@/lib/document-meta";
import type { SubjectSlug } from "@/lib/types";

/** Danh sách tài liệu của một nhóm: tên tài liệu + lượt tải. Bấm vào để xem / tải PDF. */
export function DocumentRows({ documents }: { documents: DocumentInfo[] }) {
  if (documents.length === 0) {
    return (
      <p className="rounded-2xl border-2 border-dashed border-brand-200 bg-white p-4 text-center text-sm font-semibold text-gray-700">
        <span aria-hidden>🛠️</span> Cô Thanh Mai đang cập nhật tài liệu.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-brand-100 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-brand-100">
      {documents.map((d) => (
        <li key={d.id}>
          <Link href={documentHref(d)} className="flex items-center gap-3 p-3 hover:bg-brand-50">
            <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-600 text-white">
              <Icon name="doc" className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold leading-snug text-gray-900">{d.title}</span>
              <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-gray-700">
                {d.isFree ? <FreeBadge /> : <LockBadge />}
                <span>⬇️ {d.downloads} lượt tải</span>
              </span>
            </span>
            <span aria-hidden className="shrink-0 text-sm font-extrabold text-brand-700">Xem →</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Tài liệu của một môn trong một lớp, chia theo nhóm (Tiếng Việt: 4 nhóm; Toán: một danh sách). */
export function SubjectDocuments({ subject, documents }: { subject: SubjectSlug; documents: DocumentInfo[] }) {
  const groups = DOC_CATEGORIES[subject];
  if (groups.length === 1) return <DocumentRows documents={documents.filter((d) => d.subject === subject)} />;
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {groups.map((g) => {
        const list = documents.filter((d) => d.subject === subject && d.category === g.slug);
        return (
          <section key={g.slug} aria-labelledby={`nhom-${subject}-${g.slug}`}>
            <h3 id={`nhom-${subject}-${g.slug}`} className="mb-2 flex items-center gap-2 text-xl text-gray-900">
              <span aria-hidden>{g.emoji}</span> {g.label} <span className="text-base font-semibold text-gray-600">({list.length})</span>
            </h3>
            <DocumentRows documents={list} />
          </section>
        );
      })}
    </div>
  );
}
