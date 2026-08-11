'use client';

import type { Locale } from '@/i18n/routing';
import { useEffect, useRef, useState } from 'react';
import {
  DEFAULT_MISSION_CONTENT,
  defaultTimelineRows,
  groupTimelineByYear,
  type MissionPageContent,
  type TimelineItemRow,
  type TimelineYearGroup,
} from '@/lib/missionPageContent';

function useInView(options = {}) {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.1, ...options }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return [ref, isInView] as const;
}

export default function MissionPage({ params: { locale } }: { params: { locale: string } }) {
  const currentLocale = (locale as Locale) ?? 'zh';
  const lang = currentLocale === 'en' ? 'en' : 'zh';

  const [pageContent, setPageContent] = useState<MissionPageContent>(DEFAULT_MISSION_CONTENT);
  const [timelineGroups, setTimelineGroups] = useState<TimelineYearGroup[]>(() =>
    groupTimelineByYear(defaultTimelineRows(), lang)
  );

  const [titleInView, setTitleInView] = useState(false);
  const [timelineRef, timelineInView] = useInView();
  const [newSectionRef, newSectionInView] = useInView();

  useEffect(() => {
    setTitleInView(true);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [pageRes, timelineRes] = await Promise.all([
          fetch('/api/pages/mission', { cache: 'no-store' }),
          fetch('/api/timeline', { cache: 'no-store' }),
        ]);

        if (pageRes.ok) {
          const j = await pageRes.json();
          if (mounted && j?.content) setPageContent(j.content);
        }

        if (timelineRes.ok) {
          const j = await timelineRes.json();
          const items = (Array.isArray(j?.items) ? j.items : []) as TimelineItemRow[];
          if (mounted) {
            setTimelineGroups(
              groupTimelineByYear(items.length ? items : defaultTimelineRows(), lang)
            );
          }
        }
      } catch {
        /* keep defaults */
      }
    })();
    return () => {
      mounted = false;
    };
  }, [lang]);

  const headerTitle = pageContent.header.title[lang];
  const headerSubtitle = pageContent.header.subtitle[lang];
  const focusLabel = pageContent.focus.label[lang];
  const focusBody = pageContent.focus.body[lang];
  const cards = pageContent.focus.cards;

  return (
    <div className="relative min-h-screen bg-white" style={{ fontSize: '0.9em' }}>
      <div className="relative z-10 pt-32 pb-32">
        <div className="container max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-[80px]">
          <div
            className="text-left mb-16"
            style={{
              opacity: titleInView ? 1 : 0,
              transform: titleInView ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
            }}
          >
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-brand-primary mb-2">
              {headerTitle}
            </h1>
            <h2 className="text-lg md:text-xl lg:text-2xl text-gray-600">{headerSubtitle}</h2>
          </div>

          <div
            ref={timelineRef as any}
            className="relative max-w-4xl mx-auto"
            style={{
              opacity: timelineInView ? 1 : 0,
              transform: timelineInView ? 'translateY(0)' : 'translateY(30px)',
              transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
            }}
          >
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-400"></div>

            {timelineGroups.map((item, index) => (
              <div key={item.year} className="relative mb-12 last:mb-0">
                <div className="absolute left-8 w-4 h-4 rounded-full bg-brand-accent transform -translate-x-1/2 z-10"></div>

                <div className="ml-20 mb-4">
                  <div className="bg-gray-400 rounded-lg px-6 py-3 inline-block">
                    <div className="text-2xl md:text-3xl font-bold text-brand-accent">{item.year}</div>
                  </div>
                </div>

                <div
                  className={`ml-20 bg-gray-400 rounded-lg p-6 ${item.projects.length > 1 ? 'space-y-6' : ''}`}
                  style={{
                    opacity: timelineInView ? 1 : 0,
                    transform: timelineInView ? 'translateX(0)' : 'translateX(-20px)',
                    transition: `opacity 0.6s ease-out ${0.3 + index * 0.2}s, transform 0.6s ease-out ${0.3 + index * 0.2}s`,
                  }}
                >
                  {item.projects.map((project, pIndex) => (
                    <div key={project.id ?? pIndex} className={pIndex > 0 ? 'pt-6' : ''}>
                      <h3 className="text-lg md:text-xl font-bold text-brand-accent mb-3">
                        {project.projectName}
                      </h3>
                      <p className="text-sm md:text-base text-white leading-relaxed">
                        {project.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="mt-12 text-center">
              <p className="text-lg md:text-xl text-gray-600 font-bold">{focusLabel}</p>
            </div>
          </div>

          <div
            ref={newSectionRef as any}
            className="max-w-6xl mx-auto mt-20"
            style={{
              opacity: newSectionInView ? 1 : 0,
              transform: newSectionInView ? 'translateY(0)' : 'translateY(30px)',
              transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
            }}
          >
            <div className="mb-12">
              <div className="rounded-lg p-6 md:p-8">
                <p
                  className="text-base md:text-lg text-gray-700 leading-relaxed"
                  style={{ fontSize: '1.5em' }}
                >
                  {focusBody}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cards.map((card, i) => (
                <div key={i}>
                  <div
                    className="rounded-lg overflow-hidden mb-4 w-full"
                    style={{ backgroundColor: '#156082' }}
                  >
                    <div className="p-2">
                      <div className="flex items-center justify-center rounded-lg">
                        <img
                          src={card.image}
                          alt={card.title[lang]}
                          className="max-w-full max-h-[320px] md:max-h-[400px] w-auto h-auto object-contain"
                        />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-black mb-2 text-center">
                    {card.title[lang]}
                  </h3>
                  <p className="text-sm md:text-base text-gray-400 leading-relaxed text-center">
                    {card.caption[lang]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
