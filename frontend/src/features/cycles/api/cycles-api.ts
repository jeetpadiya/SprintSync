import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/endpoints";
import {
  CloseCycleResponse,
  CreateCycleInput,
  Cycle,
} from "@/types/cycle.types";

export const cyclesApi = {
  getCycles: (
    teamId?: string
  ): Promise<{ success: boolean; cycles: Cycle[] }> => {
    const url = teamId
      ? `${ENDPOINTS.CYCLES}?teamId=${teamId}`
      : ENDPOINTS.CYCLES;
    return apiClient<{ success: boolean; cycles: Cycle[] }>(url, {
      method: "GET",
    });
  },

  createCycle: (
    data: CreateCycleInput
  ): Promise<{ success: boolean; cycle: Cycle }> => {
    return apiClient<{ success: boolean; cycle: Cycle }>(ENDPOINTS.CYCLES, {
      method: "POST",
      data,
    });
  },

  closeCycle: (
    id: string,
    rolloverTarget: "NEXT_CYCLE" | "BACKLOG" = "NEXT_CYCLE"
  ): Promise<CloseCycleResponse> => {
    return apiClient<CloseCycleResponse>(`${ENDPOINTS.CYCLES}/${id}/close`, {
      method: "POST",
      data: { rolloverTarget },
    });
  },
};
