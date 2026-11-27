import { Suspense } from "react";
import { TeamIssuesView } from "@/features/issues/components/team-issues-view";

export const metadata = {
  title: "Team Issues — SprintSync",
};

async function TeamIssuesLoader({
  params,
}: {
  params: Promise<{ teamKey: string }>;
}) {
  const { teamKey } = await params;
  return <TeamIssuesView teamKey={teamKey} scope="all" />;
}

export default function TeamIssuesPage({
  params,
}: {
  params: Promise<{ teamKey: string }>;
}) {
  return (
    <Suspense fallback={<div className="h-screen w-full bg-[var(--bg)]" />}>
      <TeamIssuesLoader params={params} />
    </Suspense>
  );
}
