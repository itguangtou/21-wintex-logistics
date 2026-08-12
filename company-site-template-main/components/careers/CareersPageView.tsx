import type { CareersData } from '@/lib/careersContent';
import CareersJobTabs from '@/components/careers/CareersJobTabs';

type Props = {
  locale: string;
  data: CareersData;
};

/** 服务端渲染：岗位数据直接进 HTML；仅页签切换为客户端，不 fetch */
export default function CareersPageView({ locale, data }: Props) {
  const lang = locale === 'en' ? 'en' : 'cn';
  const isEn = lang === 'en';

  const labels = {
    title: isEn ? 'Join Our Logistics Team' : '物流人才招聘',
    tagline: isEn
      ? 'Build the future of clean energy logistics in the Philippines with Wintex'
      : '加入Wintex，共同打造菲律宾清洁能源未来',
    locationTitle: isEn ? 'Location' : '工作地点',
    locationDesc: isEn ? 'Philippines project sites' : '菲律宾项目现场',
    contractTitle: isEn ? 'Contract' : '合同类型',
    contractDesc: isEn ? 'Long-term project-based' : '长期项目制',
    statusTitle: isEn ? 'Status' : '招聘状态',
    statusDesc: isEn ? 'Actively hiring' : '火热进行中',
    responsibilities: isEn ? 'Key Responsibilities' : '核心职责',
    requirements: isEn ? 'Requirements' : '职位要求',
    preferred: isEn ? 'Preferred' : '优先条件',
    apply: isEn ? 'Send your resume' : '立即提交简历',
    hotline: isEn ? 'Hotline' : '招聘热线',
    email: isEn ? 'Email' : '邮箱',
  };

  const mailto = `mailto:${data.contact.email}`;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#f0f7ff] to-[#e6f7ff]">
      <div className="relative z-10 pt-28 pb-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <header
            className="rounded-xl overflow-hidden text-white text-center px-6 py-12 mb-8 shadow-lg"
            style={{
              backgroundImage:
                "linear-gradient(rgba(26,75,117,0.72),rgba(44,91,138,0.72)), url('/highresolution/WechatIMG155.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-3 drop-shadow">{labels.title}</h1>
            <p className="text-base md:text-lg text-[#a8d1ff] font-light mb-8">{labels.tagline}</p>

            <div className="flex flex-wrap justify-center gap-4 md:gap-8">
              {[
                { t: labels.locationTitle, d: labels.locationDesc },
                { t: labels.contractTitle, d: labels.contractDesc },
                { t: labels.statusTitle, d: labels.statusDesc },
              ].map((item) => (
                <div
                  key={item.t}
                  className="bg-white/90 text-left rounded-xl px-5 py-4 min-w-[160px] shadow"
                >
                  <h3 className="text-[#1a4b75] font-semibold mb-1">{item.t}</h3>
                  <p className="text-sm text-[#666]">{item.d}</p>
                </div>
              ))}
            </div>
          </header>

          <CareersJobTabs
            lang={lang}
            jobs={data.jobs}
            labels={{
              responsibilities: labels.responsibilities,
              requirements: labels.requirements,
              preferred: labels.preferred,
            }}
          />

          <div className="text-center mt-12">
            <a
              href={mailto}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2ecc71] to-[#27ae60] text-white font-semibold px-8 py-3.5 shadow-md hover:opacity-95"
            >
              {labels.apply}
            </a>
          </div>

          <footer className="mt-16 text-center text-sm text-[#555] space-y-2">
            <p className="font-semibold text-[#1a4b75]">Wintex Logistics Corporation</p>
            <p>
              {labels.hotline}: {data.contact.phone}
            </p>
            <p>
              {labels.email}: {data.contact.email}
            </p>
            <p>{data.contact.address[lang]}</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
