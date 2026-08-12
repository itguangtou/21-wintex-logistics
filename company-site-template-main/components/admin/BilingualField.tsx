'use client';

type BilingualFieldProps = {
  label: string;
  zh: string;
  en: string;
  onZhChange: (v: string) => void;
  onEnChange: (v: string) => void;
  multiline?: boolean;
  /** textarea 行数提示（仅 multiline） */
  rows?: number;
  /** 额外最小高度 class，如 min-h-[320px] */
  minHeightClass?: string;
  /** 上下排布（适合长正文），默认左右两列 */
  stacked?: boolean;
  zhPlaceholder?: string;
  enPlaceholder?: string;
};

export default function BilingualField({
  label,
  zh,
  en,
  onZhChange,
  onEnChange,
  multiline,
  rows = 4,
  minHeightClass,
  stacked,
  zhPlaceholder,
  enPlaceholder,
}: BilingualFieldProps) {
  const Input = multiline ? 'textarea' : 'input';
  const shared =
    'border rounded-lg px-3 py-2 text-sm w-full outline-none focus:border-[#0E2745] focus:ring-2 focus:ring-[#0E2745]/15' +
    (multiline ? ` resize-y ${minHeightClass || 'min-h-[100px]'}` : '');

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className={stacked ? 'grid gap-4' : 'grid md:grid-cols-2 gap-4'}>
        <label className="grid gap-1">
          <span className="text-xs text-gray-500">中文</span>
          <Input
            className={shared}
            value={zh}
            rows={multiline ? rows : undefined}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
              onZhChange(e.target.value)
            }
            placeholder={zhPlaceholder}
          />
        </label>
        <label className="grid gap-1">
          <span className="text-xs text-gray-500">English</span>
          <Input
            className={shared}
            value={en}
            rows={multiline ? rows : undefined}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
              onEnChange(e.target.value)
            }
            placeholder={enPlaceholder}
          />
        </label>
      </div>
    </div>
  );
}
