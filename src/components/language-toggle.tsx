'use client';

import { useLanguage } from '@/lib/i18n/context';
import { useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LanguageToggle({ variant = 'outline' }: { variant?: 'ghost' | 'outline' }) {
  const { lang, setLang } = useLanguage();
  const router = useRouter();

  const toggle = () => {
    const next = lang === 'en' ? 'zh' : 'en';
    setLang(next);
    router.refresh();
  };

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={toggle}
      className="w-full justify-center gap-1.5 text-sm"
      title={lang === 'en' ? '切换到中文' : 'Switch to English'}
    >
      <Globe className="size-4" />
      {lang === 'en' ? '切换中文' : 'English'}
    </Button>
  );
}
