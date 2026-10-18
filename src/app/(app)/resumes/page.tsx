import type { Metadata } from "next";
import { ResumeManager } from "@/components/resumes/resume-manager";
import { requirePageUser } from "@/lib/auth/session";
import { listResumes } from "@/lib/services/resumes";

export const metadata: Metadata = { title: "My CVs" };

export default async function ResumesPage() {
  const user = await requirePageUser();
  const resumes = await listResumes(user.id);

  return <ResumeManager resumes={resumes} />;
}
