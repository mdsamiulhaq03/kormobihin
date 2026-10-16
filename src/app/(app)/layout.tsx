import { AppHeader } from "@/components/app/app-header";
import { requirePageUser } from "@/lib/auth/session";

// Shell for every logged-in page. proxy.ts already redirects users without a valid
// cookie; this also catches a valid token whose user no longer exists.
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requirePageUser();

  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      <AppHeader userName={user.name} />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
