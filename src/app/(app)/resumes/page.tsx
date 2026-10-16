import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { ResumeManager } from "@/components/resumes/resume-manager";
import { requirePageUser } from "@/lib/auth/session";
import { listResumes } from "@/lib/services/resumes";

export const metadata: Metadata = { title: "My CVs" };

export default async function ResumesPage() {
  const user = await requirePageUser();
  const resumes = await listResumes(user.id);

  return (
    <>
      <PageHeader
        title="My CVs"
        description="Keep a version of your CV for each kind of job, e.g. Frontend and General."
      />
      <ResumeManager resumes={resumes} />
    </>
  );
}
