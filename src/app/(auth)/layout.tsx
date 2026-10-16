import Link from "next/link";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          KormoBihin
        </Link>
        <div className="max-w-md space-y-4">
          <p className="text-3xl leading-tight font-semibold">
            Every job you applied to, in one place.
          </p>
          <p className="text-primary-foreground/70">
            Track stages from Applied to Offer, never miss a deadline or interview, and see how well
            your CV matches each job before you apply.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/60">
          Built for fresh graduates in Bangladesh.
        </p>
      </aside>

      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
