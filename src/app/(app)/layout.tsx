import { AppHeader } from "@/components/app/app-header";
import { BottomNav } from "@/components/app/bottom-nav";
import { requirePageUser } from "@/lib/auth/session";

// Shell for every logged-in page. proxy.ts already redirects users without a valid
// cookie; this also catches a valid token whose user no longer exists.
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requirePageUser();

  return (
    <div className="flex min-h-svh flex-col overflow-x-clip bg-canvas">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-background px-3 py-2 text-sm font-medium shadow focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <AppHeader userName={user.name} />
      <main
        id="main"
        className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 pt-6 pb-28 sm:px-6 sm:pt-8 md:pb-8"
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
