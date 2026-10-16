import type { getApplication, listApplications } from "@/lib/services/applications";
import type { listResumes } from "@/lib/services/resumes";

// Types of the data the services return, for use in components (type-only imports,
// so no server code reaches the browser bundle).
export type ApplicationListItem = Awaited<ReturnType<typeof listApplications>>[number];
export type ApplicationDetail = Awaited<ReturnType<typeof getApplication>>;
export type ResumeListItem = Awaited<ReturnType<typeof listResumes>>[number];
export type ResumeOption = { id: string; label: string };
