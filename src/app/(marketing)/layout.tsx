import Link from "next/link";
import { MessageSquareHeart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getDict } from "@/lib/i18n/server";
import { LanguageToggle } from "@/components/language-toggle";

export const dynamic = "force-dynamic";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getDict();

  let isLoggedIn = false;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    isLoggedIn = !!user;
  } catch {
    // ignore - treat as logged out
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <MessageSquareHeart className="size-6 text-indigo-600" />
            <span>TestiSpark</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-600">
            <Link href="/#features" className="hover:text-gray-900">{t.nav.features}</Link>
            <Link href="/pricing" className="hover:text-gray-900">{t.nav.pricing}</Link>
          </nav>
          <div className="flex items-center gap-3">
            <LanguageToggle variant="outline" />
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {t.nav.go_to_dashboard}
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  {t.nav.log_in}
                </Link>
                <Link
                  href="/signup"
                  className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {t.nav.get_started}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <MessageSquareHeart className="size-4 text-indigo-600" />
            <span>&copy; {new Date().getFullYear()} TestiSpark. {t.nav.rights}</span>
          </div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-gray-700">{t.nav.privacy}</Link>
            <Link href="/terms" className="hover:text-gray-700">{t.nav.terms}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
