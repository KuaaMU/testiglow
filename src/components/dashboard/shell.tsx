"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Code2,
  Settings,
  LogOut,
  Menu,
  MessageSquareHeart,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/forms", label: "Forms", icon: FileText },
  { href: "/testimonials", label: "Testimonials", icon: MessageSquare },
  { href: "/widgets", label: "Widgets", icon: Code2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

function NavLinks({ pathname }: { pathname: string }) {
  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? "bg-indigo-50 text-indigo-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardShell({
  children,
  user,
  plan,
}: {
  children: React.ReactNode;
  user: { email: string; name: string };
  plan: string;
}) {
  const pathname = usePathname();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-white">
        <div className="p-4 border-b">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <MessageSquareHeart className="size-5 text-indigo-600" />
            TestiSpark
          </Link>
        </div>
        <div className="flex-1 p-4">
          <NavLinks pathname={pathname} />
        </div>
        <div className="p-4 border-t">
          <div className="flex items-center gap-2 mb-3">
            <div className="size-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-medium">
              {user.name[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <Badge variant={plan === "pro" ? "default" : "secondary"} className="text-xs">
                {plan === "pro" ? "Pro" : "Free"}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start text-gray-500" onClick={handleLogout}>
            <LogOut className="size-4 mr-2" />
            Log out
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex-1 flex flex-col">
        <header className="md:hidden flex items-center justify-between border-b bg-white px-4 h-14">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <MessageSquareHeart className="size-5 text-indigo-600" />
            TestiSpark
          </Link>
          <MobileNav pathname={pathname} onLogout={handleLogout} />
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function MobileNav({ pathname, onLogout }: { pathname: string; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Only render Sheet after hydration to avoid SSR/CSR DOM mismatch
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon">
        <Menu className="size-5" />
      </Button>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-4">
        <SheetTitle className="flex items-center gap-2 font-bold text-lg mb-6">
          <MessageSquareHeart className="size-5 text-indigo-600" />
          TestiSpark
        </SheetTitle>
        <NavLinks pathname={pathname} />
        <div className="mt-8 pt-4 border-t">
          <Button variant="ghost" size="sm" className="w-full justify-start text-gray-500" onClick={onLogout}>
            <LogOut className="size-4 mr-2" />
            Log out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
