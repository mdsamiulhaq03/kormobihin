import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/app/wordmark";
import { LoginForm } from "@/components/auth/login-form";
import { safeRedirectPath } from "@/lib/client/api-client";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, demo, expired } = await searchParams;
  const redirectTo = safeRedirectPath(typeof next === "string" ? next : undefined);

  return (
    <div className="grid gap-6">
      <div className="grid gap-1.5">
        <Link href="/" className="mb-2 w-fit lg:hidden" aria-label="KormoBihin home">
          <Wordmark />
        </Link>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-balance">Log in</h1>
        <p className="text-sm text-muted-foreground">Welcome back. Pick up where you left off.</p>
      </div>
      {expired === "1" ? (
        <p
          role="status"
          className="rounded-xl border-2 border-ink bg-sun/40 px-3 py-2 text-sm font-medium"
        >
          Your session expired. Log in again and we’ll take you back to where you were.
        </p>
      ) : null}
      <LoginForm redirectTo={redirectTo} prefillDemo={demo === "1"} />
      <p className="text-xs text-muted-foreground">
        Demo account: <span className="font-mono">demo@kormobihin.app</span> /{" "}
        <span className="font-mono">Demo@1234</span>
      </p>
    </div>
  );
}
