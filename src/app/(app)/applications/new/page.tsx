import type { Metadata } from "next";
import { ApplicationForm } from "@/components/applications/application-form";
import { PageHeader } from "@/components/app/page-header";
import { requirePageUser } from "@/lib/auth/session";
import { listResumes } from "@/lib/services/resumes";

export const metadata: Metadata = { title: "Add application" };

export default async function NewApplicationPage() {
  const user = await requirePageUser();
  const resumes = await listResumes(user.id);

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6">
      <PageHeader
        title="Add application"
        description="Save a job you applied to, or one you plan to apply to."
      />
      <ApplicationForm resumes={resumes.map(({ id, label }) => ({ id, label }))} />
    </div>
  );
}
