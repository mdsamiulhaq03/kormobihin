import type { Metadata } from "next";
import { ApplicationForm } from "@/components/applications/application-form";
import { PageHeader } from "@/components/app/page-header";
import { requirePageUser } from "@/lib/auth/session";
import { loadApplicationOr404 } from "@/lib/services/page-data";
import { listResumes } from "@/lib/services/resumes";

export const metadata: Metadata = { title: "Edit application" };

export default async function EditApplicationPage({
  params,
}: PageProps<"/applications/[id]/edit">) {
  const user = await requirePageUser();
  const { id } = await params;
  const [application, resumes] = await Promise.all([
    loadApplicationOr404(user.id, id),
    listResumes(user.id),
  ]);

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6">
      <PageHeader
        title="Edit application"
        description={`${application.company} · ${application.title}`}
      />
      <ApplicationForm
        application={application}
        resumes={resumes.map(({ id: resumeId, label }) => ({ id: resumeId, label }))}
      />
    </div>
  );
}
