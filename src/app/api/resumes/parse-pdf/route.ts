import { ok, withErrorHandling } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { ValidationError } from "@/lib/errors";
import { extractPdfText } from "@/lib/services/pdf";

// PDF parsing needs Node.js APIs.
export const runtime = "nodejs";

/** Accepts multipart form data with a "file" field and returns the extracted text (nothing is stored). */
export const POST = withErrorHandling(async (request: Request) => {
  await requireUser();

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw new ValidationError("Upload the PDF as multipart form data.");
  }

  const file = form.get("file");
  if (!(file instanceof File)) throw new ValidationError("Choose a PDF file to upload.");

  return ok(await extractPdfText(file));
});
