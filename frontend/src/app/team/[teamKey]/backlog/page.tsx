import { Suspense } from "react";
import { TeamIssuesView } from "@/features/issues/components/team-issues-view";

export const metadata = {
  title: "Team Backlog — SprintSync",
};

async function TeamBacklogLoader({
  params,
}: {
  params: Promise<{ teamKey: string }>;
}) {
  const { teamKey } = await params;
  return <TeamIssuesView teamKey={teamKey} scope="backlog" />;
}

export default function TeamBacklogPage({
  params,
}: {
  params: Promise<{ teamKey: string }>;
}) {
  return (
    <Suspense fallback={<div className="h-screen w-full bg-[var(--bg)]" />}>
      <TeamBacklogLoader params={params} />
    </Suspense>
  );
}
