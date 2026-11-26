import { create } from "zustand";
import { IssueStatus } from "@/types/issue.types";

export interface CreateIssueOptions {
  defaultStatus?: IssueStatus;
  defaultAssigneeId?: string | null;
  defaultParentId?: string | null;
  defaultParentIdentifier?: string | null;
}

interface ModalState {
  isCreateIssueOpen: boolean;
  defaultStatus?: IssueStatus;
  defaultAssigneeId?: string | null;
  defaultParentId?: string | null;
  defaultParentIdentifier?: string | null;
  openCreateIssue: (options?: IssueStatus | CreateIssueOptions) => void;
  closeCreateIssue: () => void;
  toggleCreateIssue: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isCreateIssueOpen: false,
  defaultStatus: undefined,
  defaultAssigneeId: undefined,
  defaultParentId: undefined,
  defaultParentIdentifier: undefined,
  openCreateIssue: (options) => {
    if (typeof options === "string") {
      set({
        isCreateIssueOpen: true,
        defaultStatus: options,
        defaultAssigneeId: undefined,
        defaultParentId: undefined,
        defaultParentIdentifier: undefined,
      });
      return;
    }

    set({
      isCreateIssueOpen: true,
      defaultStatus: options?.defaultStatus,
      defaultAssigneeId: options?.defaultAssigneeId,
      defaultParentId: options?.defaultParentId,
      defaultParentIdentifier: options?.defaultParentIdentifier,
    });
  },
  closeCreateIssue: () =>
    set({
      isCreateIssueOpen: false,
      defaultStatus: undefined,
      defaultAssigneeId: undefined,
      defaultParentId: undefined,
      defaultParentIdentifier: undefined,
    }),
  toggleCreateIssue: () =>
    set((state) => ({ isCreateIssueOpen: !state.isCreateIssueOpen })),
}));
