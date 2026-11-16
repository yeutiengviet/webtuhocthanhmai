import Link from "next/link";
import { Container, PageHero } from "@/components/ui";

export const metadata = {
  title: "Giới thiệu",
  description: "THANH MAI – website học tập và ôn luyện Toán, Tiếng Việt cho học sinh tiểu học, từ tâm huyết 15 năm của Thạc sĩ Thanh Mai.",
};

const SYSTEM = [
  { title: "Bài tập hằng ngày – rèn luyện đều đặn, tiến bộ từng bước", text: "Hệ thống bài tập Toán và Tiếng Việt từ lớp 1 đến lớp 5 giúp học sinh ôn lại kiến thức, luyện các dạng bài và hình thành thói quen tự học. Nội dung có mức độ cơ bản và nâng cao, phù hợp để các con củng cố những điều đã học và từng bước thử sức với yêu cầu mới." },
  { title: "Bài tập hằng tuần – củng cố kiến thức, rèn chắc kĩ năng", text: "Các phiếu bài tập hằng tuần giúp học sinh hệ thống lại nội dung đã học, luyện tập những kĩ năng cần thiết và nhận ra phần kiến thức còn chưa vững. Phụ huynh có thể sử dụng để cùng con ôn tập cuối tuần, duy trì nhịp học vừa sức và đều đặn." },
  { title: "Bài tập tổng hợp cuối tháng – kết nối kiến thức, nâng cao khả năng vận dụng", text: "Bài tập tổng hợp cuối tháng tạo cơ hội để học sinh ôn luyện nhiều nội dung trong cùng một bài, biết kết nối kiến thức và lựa chọn cách giải quyết phù hợp. Qua bài làm, bố mẹ có thêm căn cứ để nhận biết sự tiến bộ và những nội dung con cần rèn luyện thêm." },
  { title: "Đề ôn tập giữa kì, cuối kì – ôn luyện có định hướng", text: "Hệ thống đề Toán và Tiếng Việt giữa học kì, cuối học kì dành cho các khối lớp 1–5 giúp học sinh ôn tập có trọng tâm, làm quen với các dạng câu hỏi và rèn cách trình bày bài. Nội dung từ cơ bản đến nâng cao hỗ trợ các con chuẩn bị kiến thức, kĩ năng và tâm thế tự tin trước mỗi đợt kiểm tra." },
  { title: "Đề ôn luyện hè – giữ vững nền tảng, sẵn sàng cho năm học mới", text: "Các bộ đề ôn hè giúp học sinh củng cố kiến thức của năm học vừa qua, duy trì thói quen học tập và chuẩn bị nền tảng cho chặng đường tiếp theo. Với các mức độ cơ bản và nâng cao, phụ huynh có thể lựa chọn lượng bài, độ khó phù hợp để con vừa nghỉ ngơi, vừa ôn luyện trong dịp hè." },
  { title: "Luyện tập trực tuyến – chấm điểm tự động", text: "Website cung cấp các bài tập trực tuyến có chấm điểm tự động, giúp học sinh nhận kết quả ngay sau khi hoàn thành. Với những dạng bài được hỗ trợ chấm tự động, các con có thể chủ động kiểm tra mức độ nắm kiến thức; phụ huynh cũng thuận tiện hơn khi theo dõi kết quả luyện tập của con." },
  { title: "Tải tài liệu về in – thuận tiện cho việc học tại nhà", text: "Bên cạnh hình thức luyện tập trực tuyến, phụ huynh có thể tải các tệp bài tập, phiếu ôn luyện và đề ôn tập về để in cho con làm trên giấy. Hệ thống tài liệu bao gồm bài tập hằng ngày, hằng tuần, bài tổng hợp cuối tháng, đề giữa kì, cuối kì và đề ôn hè của các khối lớp, thuận tiện để bố mẹ lựa chọn và sử dụng." },
  { title: "Nội dung cơ bản và nâng cao – phù hợp với từng học sinh", text: "Các nhóm tài liệu đều có nội dung cơ bản và nâng cao. Phần cơ bản giúp học sinh nắm chắc kiến thức, rèn kĩ năng thiết yếu; phần nâng cao khuyến khích các con suy nghĩ sâu hơn, vận dụng linh hoạt và thử sức với những yêu cầu mới. Bố mẹ có thể bắt đầu từ mức độ phù hợp với con, sau đó từng bước tăng yêu cầu khi con đã sẵn sàng." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero title="Giới thiệu" subtitle="THANH MAI – Vững nền tảng, sáng tư duy, nuôi dưỡng tình yêu học tập" />
      <Container className="max-w-4xl space-y-8 py-8">
        <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-brand-100 sm:p-8">
          <p className="text-lg leading-relaxed text-gray-800">
            <strong>THANH MAI</strong> là website học tập và ôn luyện Toán – Tiếng Việt dành cho học sinh từ lớp 1 đến lớp 5, được xây dựng từ tâm huyết và kinh nghiệm{" "}
            <strong>15 năm đồng hành cùng học sinh tiểu học của Thạc sĩ Thanh Mai, được đào tạo tại Trường Đại học Sư phạm Hà Nội.</strong>
          </p>
          <p className="mt-4 leading-relaxed text-gray-800">
            Chúng tôi tin rằng mỗi học sinh đều có thể tiến bộ khi được hướng dẫn phù hợp, được khích lệ đúng lúc và được rèn luyện từng ngày. Học Toán giúp các con biết suy luận, tìm tòi và giải quyết vấn đề; học Tiếng Việt giúp các con biết diễn đạt, cảm nhận và nuôi dưỡng tình yêu với ngôn ngữ, cuộc sống.
          </p>
          <p className="mt-4 leading-relaxed text-gray-800">
            Với mong muốn giúp việc học tại nhà trở nên thuận tiện và hiệu quả hơn,{" "}
            <strong>THANH MAI mang đến hệ thống bài tập từ cơ bản đến nâng cao, kết hợp luyện tập trực tuyến có chấm điểm tự động và tài liệu có thể tải về, in cho con làm.</strong>{" "}
            Đây là nơi học sinh rèn luyện kiến thức, đồng thời giúp phụ huynh dễ dàng lựa chọn nội dung phù hợp để đồng hành cùng con trong suốt năm học.
          </p>
        </section>

        <section aria-labelledby="he-thong">
          <h2 id="he-thong" className="text-2xl text-gray-900 sm:text-3xl">Hệ thống học tập Toán – Tiếng Việt Thanh Mai</h2>
          <p className="mt-2 leading-relaxed text-gray-800">
            Hướng đến việc xây dựng nền tảng vững chắc và phát triển năng lực của từng học sinh, THANH MAI sắp xếp nội dung học tập theo khối lớp, môn học và từng giai đoạn ôn luyện. Từ bài tập hằng ngày đến đề ôn tập cuối học kì, phụ huynh có thể tìm thấy tài liệu phù hợp với nhu cầu học tập của con.
          </p>
          <ol className="mt-5 grid gap-4 sm:grid-cols-2">
            {SYSTEM.map((s, i) => (
              <li key={s.title} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-brand-100">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 font-display text-lg font-extrabold text-white" aria-hidden>{i + 1}</span>
                <h3 className="mt-2 text-lg font-extrabold uppercase leading-snug text-brand-800">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-gray-800">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-[2rem] bg-gradient-to-br from-brand-50 to-accent-50 p-6 ring-1 ring-brand-200 sm:p-8" aria-labelledby="nguoi-dong-hanh">
          <h2 id="nguoi-dong-hanh" className="text-2xl text-gray-900 sm:text-3xl">Người đồng hành chuyên môn – Thạc sĩ Thanh Mai</h2>
          <p className="mt-3 leading-relaxed text-gray-800">
            Đứng sau website là <strong>Thạc sĩ Thanh Mai, được đào tạo tại Trường Đại học Sư phạm Hà Nội, với 15 năm kinh nghiệm đồng hành cùng học sinh tiểu học từ lớp 1 đến lớp 5.</strong>
          </p>
          <p className="mt-4 leading-relaxed text-gray-800">
            Trong quá trình giảng dạy, cô hiểu rằng mỗi học sinh có một nhịp độ tiếp thu, một thế mạnh và những khó khăn riêng. Có con cần thêm thời gian để nắm chắc phép tính; có con cần những câu hỏi gợi mở để viết thành câu, thành đoạn; cũng có con cần những bài tập thử thách để phát huy khả năng của mình.
          </p>
          <p className="mt-4 leading-relaxed text-gray-800">
            Từ sự thấu hiểu ấy, THANH MAI hướng đến cách học vừa sức, có định hướng và khuyến khích học sinh chủ động suy nghĩ. Với môn Toán, các con được chú trọng rèn tư duy và khả năng vận dụng. Với môn Tiếng Việt, các con được bồi đắp vốn từ, khả năng đọc hiểu, diễn đạt và cảm nhận.
          </p>
          <p className="mt-5 rounded-2xl bg-white p-4 text-lg font-extrabold leading-snug text-brand-800 shadow-sm">
            Mỗi bài tập là một cơ hội để học sinh hiểu bài hơn, tự tin hơn và cảm nhận được niềm vui khi tự mình làm được.
          </p>
        </section>

        <section aria-labelledby="cau-chuyen">
          <h2 id="cau-chuyen" className="text-2xl text-gray-900 sm:text-3xl">Câu chuyện hình thành và định hướng phát triển</h2>
          <p className="mt-3 leading-relaxed text-gray-800">
            THANH MAI được xây dựng từ những điều rất gần gũi trong quá trình dạy học: mong muốn học sinh có tài liệu phù hợp để luyện tập, và mong muốn phụ huynh bớt lúng túng khi tìm bài cho con học tại nhà.
          </p>
          <p className="mt-4 leading-relaxed text-gray-800">
            “Con cần ôn phần nào?”, “Nên chọn bài cơ bản hay nâng cao?”, “Tìm đâu những phiếu bài tập phù hợp với lớp của con?” – đó là những câu hỏi thôi thúc việc xây dựng một website tập hợp nội dung Toán và Tiếng Việt có hệ thống, dễ tìm và thuận tiện sử dụng.
          </p>
          <p className="mt-4 leading-relaxed text-gray-800">
            Từ kinh nghiệm 15 năm đồng hành cùng học sinh tiểu học, cô Thanh Mai mong muốn đưa những giá trị tích lũy trong giảng dạy đến gần hơn với các gia đình. Sự kết hợp giữa bài tập trực tuyến và tài liệu in giúp bố mẹ linh hoạt lựa chọn cách học phù hợp với điều kiện, thói quen và nhu cầu của con.
          </p>
          <p className="mt-4 leading-relaxed text-gray-800">
            Trên hành trình phát triển, THANH MAI hướng đến việc tiếp tục hoàn thiện nội dung, mở rộng nguồn bài tập và nâng cao trải nghiệm học tập, để trở thành người bạn đồng hành tin cậy của phụ huynh và học sinh trong những năm học đầu đời.
          </p>
          <blockquote className="mt-6 rounded-3xl bg-brand-700 p-5 text-center font-display text-xl font-extrabold text-white">
            THANH MAI – Vững nền tảng, sáng tư duy, nuôi dưỡng tình yêu học tập.
          </blockquote>
          <div className="mt-6 text-center">
            <Link href="/toan" className="btn-toy inline-block rounded-full bg-brand-600 px-6 py-3 font-extrabold text-white">Vào học Toán</Link>
          </div>
        </section>
      </Container>
    </>
  );
}
