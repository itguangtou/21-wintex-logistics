'use client';

type BilingualFieldProps = {
  label: string;
  zh: string;
  en: string;
  onZhChange: (v: string) => void;
  onEnChange: (v: string) => void;
  multiline?: boolean;
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
  zhPlaceholder,
  enPlaceholder,
}: BilingualFieldProps) {
  const Input = multiline ? 'textarea' : 'input';
  const shared =
    'border rounded-lg px-3 py-2 text-sm w-full outline-none focus:border-[#0E2745] focus:ring-2 focus:ring-[#0E2745]/15' +
    (multiline ? ' min-h-[100px] resize-y' : '');

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="grid md:grid-cols-2 gap-4">
        <label className="grid gap-1">
          <span className="text-xs text-gray-500">中文</span>
          <Input
            className={shared}
            value={zh}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onZhChange(e.target.value)}
            placeholder={zhPlaceholder}
          />
        </label>
        <label className="grid gap-1">
          <span className="text-xs text-gray-500">English</span>
          <Input
            className={shared}
            value={en}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onEnChange(e.target.value)}
            placeholder={enPlaceholder}
          />
        </label>
      </div>
    </div>
  );
}
