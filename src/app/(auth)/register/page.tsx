import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-1.5">
        <Link href="/" className="text-sm font-semibold tracking-tight lg:hidden">
          KormoBihin
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          Free. Your applications stay private to you.
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
