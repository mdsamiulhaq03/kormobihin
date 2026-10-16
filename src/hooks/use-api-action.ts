"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ApiClientError } from "@/lib/client/api-client";

type Options = {
  /** Toast shown on success. */
  successMessage?: string;
  /** Re-render the server components on the page after success (default true). */
  refresh?: boolean;
};

/**
 * Runs a mutation with a pending flag, success/error toasts and a page refresh.
 * Returns the result, or null if it failed (the error is already shown).
 */
export function useApiAction() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const run = useCallback(
    async <T>(action: () => Promise<T>, options: Options = {}): Promise<T | null> => {
      setPending(true);
      try {
        const result = await action();
        if (options.successMessage) toast.success(options.successMessage);
        if (options.refresh !== false) router.refresh();
        return result;
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : "Something went wrong. Please try again.";
        toast.error(message);
        return null;
      } finally {
        setPending(false);
      }
    },
    [router],
  );

  return { run, pending };
}
