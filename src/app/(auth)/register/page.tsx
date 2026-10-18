import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/app/wordmark";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-1.5">
        <Link href="/" className="mb-2 w-fit lg:hidden" aria-label="KormoBihin home">
          <Wordmark />
        </Link>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-balance">
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Free. Your applications stay private to you.
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
