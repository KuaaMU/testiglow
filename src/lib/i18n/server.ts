import { cookies } from 'next/headers';
import { translations, type Locale } from './translations';

export async function getDict() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'en') as Locale;
  return translations[lang];
}

export async function getLang(): Promise<Locale> {
  const cookieStore = await cookies();
  return (cookieStore.get('lang')?.value || 'en') as Locale;
}
