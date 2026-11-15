import Link from "next/link";
import { VideoEmbed } from "@/components/LessonMedia";
import { Container, PageHero } from "@/components/ui";
import { site } from "@/data/site";

export const metadata = { title: "Giới thiệu" };

export default function AboutPage() {
  return (
    <>
      <PageHero title="Giới thiệu" subtitle={site.name} />
      <Container className="grid gap-6 py-8 lg:grid-cols-2">
        <section id="video" className="scroll-mt-28">
          <h2 className="mb-3 text-xl font-bold">Video giới thiệu</h2>
          <VideoEmbed videoRef={site.introVideoRef} title="Video giới thiệu" />
        </section>
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold">Về cô Thanh Mai</h2>
          {/* BẢN NHÁP — chủ dự án thay bằng lời giới thiệu thật */}
          <p className="mt-2 text-gray-800">
            Phần giới thiệu giáo viên sẽ được cô Thanh Mai cập nhật: kinh nghiệm giảng dạy, phương pháp học, và cách website giúp con học đều mỗi tuần.
          </p>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-gray-800">
            {site.commitments.map((c) => (
              <li key={c.title}><strong>{c.title}:</strong> {c.text}</li>
            ))}
          </ul>
          <Link href="/hoc-thu" className="mt-4 inline-block rounded-full bg-brand-600 px-5 py-2.5 font-semibold text-white">Vào học thử</Link>
        </section>
      </Container>
    </>
  );
}
