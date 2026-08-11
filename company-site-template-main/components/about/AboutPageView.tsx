import type { AboutPageContent } from '@/lib/aboutPageContent';

type Props = {
  locale: string;
  content: AboutPageContent;
};

/** 纯服务端渲染：文案直接进 HTML，不走客户端 fetch / React state */
export default function AboutPageView({ locale, content }: Props) {
  const lang = locale === 'en' ? 'en' : 'zh';
  const intro = content.intro;
  const networkItems = content.network.items;
  const bgUrl = content.backgroundImage || '/highresolution/WechatIMG153.jpg';
  const logoUrl = content.network.centerLogo || '/logo.png';

  const cornerNodes = [
    {
      key: 'left-top',
      left: '15%',
      topClass: 'top-[43%] md:top-[40%]',
      itemIndex: 0,
    },
    {
      key: 'right-top',
      left: '85%',
      topClass: 'top-[43%] md:top-[40%]',
      itemIndex: 1,
    },
    {
      key: 'left-bottom',
      left: '15%',
      topClass: 'top-[57%] md:top-[60%]',
      itemIndex: 2,
    },
    {
      key: 'right-bottom',
      left: '85%',
      topClass: 'top-[57%] md:top-[60%]',
      itemIndex: 3,
    },
  ];

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 bg-[#1a1a1a]"
          style={{
            backgroundImage: `url(${bgUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative z-10 pt-32 pb-32" style={{ fontSize: '0.9em' }}>
        <div className="container max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-[80px]">
          <div className="max-w-[1287px] mx-auto space-y-16 md:space-y-24">
            {intro.map((block, bi) => (
              <div key={bi} className="max-w-4xl mx-auto text-center">
                <h2 className="text-1xl md:text-2xl lg:text-3xl font-bold text-brand-accent mb-6 leading-tight">
                  {block.title[lang]}
                </h2>
                <div className="space-y-6">
                  {block.body.map((para, pi) => (
                    <p key={pi} className="text-sm md:text-xl text-white/90 leading-relaxed">
                      {para[lang]}
                    </p>
                  ))}
                </div>

                {bi === intro.length - 1 && (
                  <div
                    className="flex flex-col justify-center items-center mt-16 gap-2"
                    style={{ marginBottom: '-4rem' }}
                  >
                    {[0, 0.3, 0.6].map((delay, i) => (
                      <svg
                        key={i}
                        className="w-12 h-12 md:w-24 md:h-24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#F7B959"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          animation: 'blink 1.5s ease-in-out infinite',
                          animationDelay: `${delay}s`,
                          opacity: 1 - i * 0.2,
                        }}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="relative w-full h-screen min-h-[800px] flex items-center justify-center">
              {/* 桌面连线 */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none hidden md:block">
                <line x1="50%" y1="40%" x2="15%" y2="40%" stroke="rgba(247, 185, 89, 0.6)" strokeWidth="2" />
                <line x1="50%" y1="40%" x2="85%" y2="40%" stroke="rgba(247, 185, 89, 0.6)" strokeWidth="2" />
                <line x1="50%" y1="60%" x2="15%" y2="60%" stroke="rgba(247, 185, 89, 0.6)" strokeWidth="2" />
                <line x1="50%" y1="60%" x2="85%" y2="60%" stroke="rgba(247, 185, 89, 0.6)" strokeWidth="2" />
                <line x1="50%" y1="50%" x2="50%" y2="85%" stroke="rgba(247, 185, 89, 0.6)" strokeWidth="2" />
                {[
                  { x: 32.5, y: 40 },
                  { x: 67.5, y: 40 },
                  { x: 32.5, y: 60 },
                  { x: 67.5, y: 60 },
                  { x: 50, y: 67.5 },
                ].map((point, i) => (
                  <g key={i} transform={`translate(${point.x}%, ${point.y}%)`}>
                    <polygon
                      points="0,-8 8,0 0,8 -8,0"
                      fill="#F7B959"
                      stroke="rgba(247, 185, 89, 0.8)"
                      strokeWidth="1"
                    />
                  </g>
                ))}
              </svg>

              {/* 移动端连线 */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none md:hidden">
                <line x1="50%" y1="43%" x2="15%" y2="43%" stroke="rgba(247, 185, 89, 0.6)" strokeWidth="2" />
                <line x1="50%" y1="43%" x2="85%" y2="43%" stroke="rgba(247, 185, 89, 0.6)" strokeWidth="2" />
                <line x1="50%" y1="57%" x2="15%" y2="57%" stroke="rgba(247, 185, 89, 0.6)" strokeWidth="2" />
                <line x1="50%" y1="57%" x2="85%" y2="57%" stroke="rgba(247, 185, 89, 0.6)" strokeWidth="2" />
                <line x1="50%" y1="50%" x2="50%" y2="72%" stroke="rgba(247, 185, 89, 0.6)" strokeWidth="2" />
                {[
                  { x: 32.5, y: 43 },
                  { x: 67.5, y: 43 },
                  { x: 32.5, y: 57 },
                  { x: 67.5, y: 57 },
                  { x: 50, y: 61 },
                ].map((point, i) => (
                  <g key={i} transform={`translate(${point.x}%, ${point.y}%)`}>
                    <polygon
                      points="0,-8 8,0 0,8 -8,0"
                      fill="#F7B959"
                      stroke="rgba(247, 185, 89, 0.8)"
                      strokeWidth="1"
                    />
                  </g>
                ))}
              </svg>

              <div className="relative z-20 flex items-center justify-center">
                <div className="absolute w-32 h-32 md:w-80 md:h-80 rounded-full bg-gray-400" />
                <div className="relative w-24 h-24 md:w-64 md:h-64 rounded-full bg-white border-2 border-brand-accent flex flex-col items-center justify-center overflow-hidden">
                  <img
                    src={logoUrl}
                    alt="Wintex Logo"
                    className="object-contain"
                    style={{ width: '60%', height: '60%' }}
                  />
                </div>
              </div>

              {cornerNodes.map((node) => {
                const text = networkItems[node.itemIndex]?.[lang] || '';
                return (
                  <div
                    key={node.key}
                    className={`absolute ${node.topClass} -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white/10 backdrop-blur-md border-2 border-brand-accent/70 p-1.5 md:p-5 w-[110px] md:w-[280px] min-h-[50px] md:min-h-[105px] flex flex-col justify-center text-center shadow-lg`}
                    style={{ left: node.left }}
                  >
                    <div className="text-[8px] md:text-xs text-white/80 leading-tight md:leading-relaxed">
                      <div className="flex items-start justify-center gap-0.5 md:gap-2">
                        <svg
                          width="6"
                          height="6"
                          viewBox="0 0 12 12"
                          className="flex-shrink-0 mt-0.5 md:mt-1"
                          style={{ width: '6px', height: '6px' }}
                        >
                          <polygon
                            points="6,0 12,6 6,12 0,6"
                            fill="#F7B959"
                            stroke="rgba(247, 185, 89, 0.8)"
                            strokeWidth="0.5"
                          />
                        </svg>
                        <span className="text-center">
                          {node.itemIndex + 1}. {text}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="absolute left-1/2 top-[72%] md:top-[85%] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white/10 backdrop-blur-md border-2 border-brand-accent/70 p-1.5 md:p-6 w-[55%] max-w-[110px] md:w-[90%] md:max-w-[260px] text-center shadow-lg">
                <div className="text-[8px] md:text-xs text-white/80 leading-tight md:leading-relaxed">
                  <div className="flex items-start justify-center gap-0.5 md:gap-2">
                    <svg
                      width="6"
                      height="6"
                      viewBox="0 0 12 12"
                      className="flex-shrink-0 mt-0.5 md:mt-1"
                      style={{ width: '6px', height: '6px' }}
                    >
                      <polygon
                        points="6,0 12,6 6,12 0,6"
                        fill="#F7B959"
                        stroke="rgba(247, 185, 89, 0.8)"
                        strokeWidth="0.5"
                      />
                    </svg>
                    <span className="text-center">5. {networkItems[4]?.[lang] || ''}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
