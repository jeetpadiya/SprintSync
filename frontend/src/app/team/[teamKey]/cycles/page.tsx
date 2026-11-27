import { Suspense } from "react";
import { TeamCyclesView } from "@/features/cycles/components/team-cycles-view";

export const metadata = {
  title: "Team Cycles — SprintSync",
};

async function TeamCyclesLoader({
  params,
}: {
  params: Promise<{ teamKey: string }>;
}) {
  const { teamKey } = await params;
  return <TeamCyclesView teamKey={teamKey} />;
}

export default function TeamCyclesPage({
  params,
}: {
  params: Promise<{ teamKey: string }>;
}) {
  return (
    <Suspense fallback={<div className="h-screen w-full bg-[var(--bg)]" />}>
      <TeamCyclesLoader params={params} />
    </Suspense>
  );
}
