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
import { registerSchema } from "@/lib/validators/auth";

export function RegisterForm() {
  const router = useRouter();
  const [values, setValues] = useState({ name: "", email: "", password: "" });
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

    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest("/api/auth/register", { method: "POST", body: parsed.data });
      toast.success("Account created. Let's track your first application!");
      router.replace("/dashboard");
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
        <p
          role="alert"
          className="rounded-xl border-2 border-destructive bg-destructive/5 font-medium px-3 py-2 text-sm text-destructive"
        >
          {formError}
        </p>
      ) : null}

      <FormField id="name" label="Full name" error={errors.name}>
        <Input
          {...fieldA11y("name", errors.name)}
          autoComplete="name"
          placeholder="Samiul Haque"
          value={values.name}
          onChange={(e) => update("name")(e.target.value)}
          disabled={submitting}
        />
      </FormField>

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

      <FormField
        id="password"
        label="Password"
        error={errors.password}
        hint="At least 8 characters with an uppercase letter, a lowercase letter and a number."
      >
        <Input
          {...fieldA11y("password", errors.password)}
          type="password"
          autoComplete="new-password"
          value={values.password}
          onChange={(e) => update("password")(e.target.value)}
          disabled={submitting}
        />
      </FormField>

      <Button type="submit" size="lg" disabled={submitting} className="mt-1 w-full">
        {submitting ? <Loader2Icon className="animate-spin" aria-hidden /> : null}
        {submitting ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-bold text-primary underline decoration-2 underline-offset-4 hover:decoration-sun"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
