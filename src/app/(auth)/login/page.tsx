import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { safeRedirectPath } from "@/lib/client/api-client";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const redirectTo = safeRedirectPath(typeof next === "string" ? next : undefined);

  return (
    <div className="grid gap-6">
      <div className="grid gap-1.5">
        <Link href="/" className="text-sm font-semibold tracking-tight lg:hidden">
          KormoBihin
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
        <p className="text-sm text-muted-foreground">Welcome back. Pick up where you left off.</p>
      </div>
      <LoginForm redirectTo={redirectTo} />
      <p className="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
        Demo account: <span className="font-mono">demo@kormobihin.app</span> /{" "}
        <span className="font-mono">Demo@1234</span>
      </p>
    </div>
  );
}
