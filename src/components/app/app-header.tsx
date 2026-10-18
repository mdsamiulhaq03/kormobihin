"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseIcon, FileTextIcon, LayoutDashboardIcon } from "lucide-react";
import { Wordmark } from "@/components/app/wordmark";
import { LogoutButton } from "@/components/auth/logout-button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/applications", label: "Applications", icon: BriefcaseIcon },
  { href: "/resumes", label: "My CVs", icon: FileTextIcon },
] as const;

/** Header navigation for tablets and up; phones use the bottom bar (bottom-nav.tsx). */
function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1" aria-label="Main">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-10 items-center gap-2 rounded-full border-2 border-transparent px-4 py-2 text-sm font-bold text-foreground transition-colors hover:bg-sun/50",
              active &&
                "border-ink bg-primary text-primary-foreground shadow-pop-press hover:bg-primary",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppHeader({ userName }: { userName: string }) {
  const firstName = userName.split(" ")[0];

  return (
    <header className="sticky top-0 z-30 border-b-2 border-ink bg-paper">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/dashboard" className="flex min-h-10 items-center" aria-label="Dashboard">
          <Wordmark />
        </Link>

        <div className="hidden md:block">
          <NavLinks />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-sm font-semibold sm:inline">Hi, {firstName}</span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
