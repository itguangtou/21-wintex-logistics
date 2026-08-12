'use client';

import { useState } from 'react';
import type { CareersJob } from '@/lib/careersContent';
import { jobFieldToLines } from '@/lib/careersContent';

type Lang = 'cn' | 'en';

type Props = {
  lang: Lang;
  jobs: CareersJob[];
  labels: {
    responsibilities: string;
    requirements: string;
    preferred: string;
  };
};

export default function CareersJobTabs({ lang, jobs, labels }: Props) {
  const [activeId, setActiveId] = useState(jobs[0]?.id ?? '');

  if (jobs.length === 0) {
    return (
      <p className="text-center text-[#1a4b75]/80 py-12">
        {lang === 'cn' ? '暂无招聘岗位' : 'No open positions at the moment'}
      </p>
    );
  }

  const active = jobs.find((j) => j.id === activeId) ?? jobs[0];
  const preferredLines = jobFieldToLines(active.preferredConditions?.[lang]);

  const section = (title: string, lines: string[]) => {
    if (lines.length === 0) return null;
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-[#e8eef5]">
        <h2 className="text-lg font-semibold text-[#1a4b75] mb-4">{title}</h2>
        <ul className="space-y-2 text-[#333] text-sm md:text-base leading-relaxed list-disc pl-5">
          {lines.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        {jobs.map((job) => {
          const selected = job.id === active.id;
          return (
            <button
              key={job.id}
              type="button"
              onClick={() => setActiveId(job.id)}
              className={`min-w-[140px] px-6 py-3 text-sm md:text-base font-semibold rounded-full border transition-colors ${
                selected
                  ? 'bg-[#2ecc71] border-[#2ecc71] text-white shadow'
                  : 'bg-white border-[#1a4b75]/25 text-[#1a4b75] hover:border-[#1a4b75]'
              }`}
            >
              {job.title[lang] || job.id}
            </button>
          );
        })}
      </div>

      <div className="grid gap-5 md:grid-cols-1 lg:grid-cols-3">
        {section(labels.responsibilities, jobFieldToLines(active.responsibilities?.[lang]))}
        {section(labels.requirements, jobFieldToLines(active.requirements?.[lang]))}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#e8eef5]">
          <h2 className="text-lg font-semibold text-[#1a4b75] mb-4">{labels.preferred}</h2>
          {preferredLines.length > 0 ? (
            <ul className="space-y-2 text-[#333] text-sm md:text-base leading-relaxed list-disc pl-5 mb-5">
              {preferredLines.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm mb-5">—</p>
          )}
          {(active.salary?.[lang] || '').trim() && (
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#ffd166] to-[#ff9e00] text-white font-bold px-5 py-2.5 text-sm">
              {active.salary?.[lang]}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
