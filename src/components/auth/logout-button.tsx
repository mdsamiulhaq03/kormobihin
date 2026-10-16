"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOutIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/client/api-client";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
      toast.success("Logged out.");
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("Couldn't log out. Please try again.");
      setPending(false);
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout} disabled={pending}>
      <LogOutIcon aria-hidden />
      {pending ? "Logging out…" : "Log out"}
    </Button>
  );
}
