"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BriefcaseIcon, FileTextIcon, LayoutDashboardIcon, MenuIcon } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/applications", label: "Applications", icon: BriefcaseIcon },
  { href: "/resumes", label: "My CVs", icon: FileTextIcon },
] as const;

function NavLinks({
  onNavigate,
  vertical = false,
}: {
  onNavigate?: () => void;
  vertical?: boolean;
}) {
  const pathname = usePathname();
  return (
    <nav className={cn("flex gap-1", vertical && "flex-col")} aria-label="Main">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              active && "bg-muted text-foreground",
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
  const [open, setOpen] = useState(false);
  const firstName = userName.split(" ")[0];

  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle>KormoBihin</SheetTitle>
            </SheetHeader>
            <div className="px-4">
              <NavLinks vertical onNavigate={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>

        <Link href="/dashboard" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-7 place-items-center rounded-lg bg-primary text-sm text-primary-foreground">
            K
          </span>
          <span className="hidden sm:inline">KormoBihin</span>
        </Link>

        <div className="hidden md:block">
          <NavLinks />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-sm text-muted-foreground sm:inline">Hi, {firstName}</span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
