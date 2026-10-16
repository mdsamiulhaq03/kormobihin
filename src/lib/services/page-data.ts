import "server-only";
import { notFound } from "next/navigation";
import { NotFoundError } from "@/lib/errors";
import { getApplication } from "@/lib/services/applications";
import { idSchema } from "@/lib/validators/common";

/** For pages: load the user's application or show the 404 page (bad id, missing or not yours). */
export async function loadApplicationOr404(userId: string, id: string) {
  if (!idSchema.safeParse(id).success) notFound();
  try {
    return await getApplication(userId, id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}
