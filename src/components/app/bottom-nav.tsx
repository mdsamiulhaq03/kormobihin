"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseIcon, FileTextIcon, LayoutDashboardIcon, PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/applications", label: "Applications", icon: BriefcaseIcon },
  { href: "/applications/new", label: "Add", icon: PlusIcon, primary: true },
  { href: "/resumes", label: "My CVs", icon: FileTextIcon },
] as const;

/** "/applications/new" is its own tab, so it must not also light up "Applications". */
function isActive(pathname: string, href: string) {
  if (href === "/applications") {
    return (
      pathname === href || (pathname.startsWith(`${href}/`) && pathname !== "/applications/new")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Phones only: navigation and "Add" in the thumb zone, where one-handed use is easiest.
 * Wider screens keep the header navigation.
 */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-ink bg-paper pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-md grid-cols-4">
        {TABS.map((tab) => {
          const { href, label, icon: Icon } = tab;
          const active = isActive(pathname, href);
          const primary = "primary" in tab;
          return (
            <li key={href} className="flex">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="group flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-bold"
              >
                <span
                  className={cn(
                    "grid place-items-center rounded-full border-2 transition-colors",
                    primary
                      ? "-mt-5 size-12 border-ink bg-primary text-primary-foreground shadow-pop"
                      : "h-8 w-14",
                    !primary && active && "border-ink bg-primary text-primary-foreground",
                    !primary && !active && "border-transparent group-hover:bg-sun/50",
                  )}
                >
                  <Icon className={primary ? "size-5" : "size-4"} aria-hidden />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
