import { ok, parseOrThrow, readJson, searchParamsToObject, withErrorHandling } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { createApplication, listApplications } from "@/lib/services/applications";
import { applicationCreateSchema, applicationListQuerySchema } from "@/lib/validators/application";

/** GET /api/applications?stage=APPLIED&source=BDJOBS&q=react&sort=deadline */
export const GET = withErrorHandling(async (request: Request) => {
  const user = await requireUser();
  const query = parseOrThrow(applicationListQuerySchema, searchParamsToObject(request));
  return ok(await listApplications(user.id, query));
});

export const POST = withErrorHandling(async (request: Request) => {
  const user = await requireUser();
  const input = parseOrThrow(applicationCreateSchema, await readJson(request));
  return ok(await createApplication(user.id, input), 201);
});
