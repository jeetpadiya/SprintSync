"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cyclesApi } from "../api/cycles-api";
import { CreateCycleInput } from "@/types/cycle.types";
import { issueKeys } from "@/features/issues/hooks/use-issues";

export const cycleKeys = {
  all: ["cycles"] as const,
  team: (teamId?: string) => [...cycleKeys.all, teamId ?? "all"] as const,
};

export function useCycles(teamId?: string, enabled = true) {
  return useQuery({
    queryKey: cycleKeys.team(teamId),
    queryFn: async () => {
      const res = await cyclesApi.getCycles(teamId);
      return res.cycles ?? [];
    },
    enabled,
  });
}

export function useCreateCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCycleInput) => cyclesApi.createCycle(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cycleKeys.all });
      toast.success("Cycle created");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to create cycle");
    },
  });
}

export function useCloseCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      rolloverTarget,
    }: {
      id: string;
      rolloverTarget: "NEXT_CYCLE" | "BACKLOG";
    }) => cyclesApi.closeCycle(id, rolloverTarget),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: cycleKeys.all });
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
      toast.success("Cycle closed", {
        description:
          res.rolledOverCount > 0
            ? `${res.rolledOverCount} unfinished issue${res.rolledOverCount > 1 ? "s" : ""} rolled over`
            : "All issues in this cycle were completed",
      });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to close cycle");
    },
  });
}
