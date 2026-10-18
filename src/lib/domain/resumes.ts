/**
 * The CV a new application starts with: the one the user has sent most often.
 * A fresh upload should not silently become the default for every new job.
 * Ties keep the incoming order (most recently edited first).
 */
export function defaultResumeId(
  resumes: { id: string; applicationCount: number }[],
): string | null {
  const best = resumes.reduce<(typeof resumes)[number] | null>(
    (top, resume) =>
      top === null || resume.applicationCount > top.applicationCount ? resume : top,
    null,
  );
  return best?.id ?? null;
}
