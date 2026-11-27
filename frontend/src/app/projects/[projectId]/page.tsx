import { Suspense } from "react";
import { ProjectDetailView } from "@/features/projects/components/project-detail-view";

export const metadata = {
  title: "Project — SprintSync",
};

async function ProjectDetailLoader({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <ProjectDetailView projectId={projectId} />;
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  return (
    <Suspense fallback={<div className="h-screen w-full bg-[var(--bg)]" />}>
      <ProjectDetailLoader params={params} />
    </Suspense>
  );
}
