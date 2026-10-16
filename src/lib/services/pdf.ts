import "server-only";
import { extractText, getDocumentProxy } from "unpdf";
import { ValidationError } from "@/lib/errors";
import { PDF_MAX_BYTES, RESUME_MAX_CHARS } from "@/lib/validators/resume";

const PDF_MAGIC = "%PDF-";

/** Validates an uploaded file and extracts its text. Only text is kept; the file is discarded. */
export async function extractPdfText(file: File): Promise<{ text: string; pages: number }> {
  if (file.size === 0) throw new ValidationError("The file is empty.");
  if (file.size > PDF_MAX_BYTES) {
    throw new ValidationError(`The PDF is larger than ${PDF_MAX_BYTES / 1024 / 1024} MB.`);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  // Check the real file signature, not just the name or MIME type the browser sent.
  const header = new TextDecoder().decode(bytes.slice(0, PDF_MAGIC.length));
  if (header !== PDF_MAGIC) throw new ValidationError("This file is not a PDF.");

  let text: string;
  let pages: number;
  try {
    const pdf = await getDocumentProxy(bytes);
    const result = await extractText(pdf, { mergePages: true });
    text = result.text;
    pages = result.totalPages;
  } catch {
    throw new ValidationError("Couldn't read this PDF. It may be damaged or password-protected.");
  }

  const cleaned = text
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (cleaned.length < 50) {
    throw new ValidationError(
      "No text found in this PDF. It may be a scanned image — paste your CV text instead.",
    );
  }

  return { text: cleaned.slice(0, RESUME_MAX_CHARS), pages };
}
