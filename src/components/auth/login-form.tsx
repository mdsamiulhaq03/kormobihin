"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { FormField, fieldA11y } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiClientError, apiRequest } from "@/lib/client/api-client";
import { apiFieldErrors, zodFieldErrors, type FieldErrors } from "@/lib/client/form-errors";
import { loginSchema } from "@/lib/validators/auth";

type LoginFormProps = {
  redirectTo: string;
};

export function LoginForm({ redirectTo }: LoginFormProps) {
  const router = useRouter();
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field: keyof typeof values) => (value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }

    setSubmitting(true);
    try {
      const user = await apiRequest<{ name: string }>("/api/auth/login", {
        method: "POST",
        body: parsed.data,
      });
      toast.success(`Welcome back, ${user.name.split(" ")[0]}!`);
      router.replace(redirectTo);
      router.refresh();
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrors(apiFieldErrors(error.fieldErrors));
        setFormError(error.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      {formError ? (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      <FormField id="email" label="Email" error={errors.email}>
        <Input
          {...fieldA11y("email", errors.email)}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={values.email}
          onChange={(e) => update("email")(e.target.value)}
          disabled={submitting}
        />
      </FormField>

      <FormField id="password" label="Password" error={errors.password}>
        <Input
          {...fieldA11y("password", errors.password)}
          type="password"
          autoComplete="current-password"
          value={values.password}
          onChange={(e) => update("password")(e.target.value)}
          disabled={submitting}
        />
      </FormField>

      <Button type="submit" size="lg" disabled={submitting} className="mt-1 w-full">
        {submitting ? <Loader2Icon className="animate-spin" aria-hidden /> : null}
        {submitting ? "Logging in…" : "Log in"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/register" className="font-medium text-foreground underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </form>
  );
}
