import { create } from "zustand";
import { IssueStatus } from "@/types/issue.types";

export interface CreateIssueOptions {
  defaultStatus?: IssueStatus;
  defaultAssigneeId?: string | null;
  defaultTeamId?: string | null;
  defaultProjectId?: string | null;
  defaultCycleId?: string | null;
  defaultParentId?: string | null;
  defaultParentIdentifier?: string | null;
}

export type CommandMenuPage = "root" | "status" | "priority" | "assignee";

interface ModalState {
  isCreateIssueOpen: boolean;
  isCommandMenuOpen: boolean;
  commandMenuPage: CommandMenuPage;
  defaultStatus?: IssueStatus;
  defaultAssigneeId?: string | null;
  defaultTeamId?: string | null;
  defaultProjectId?: string | null;
  defaultCycleId?: string | null;
  defaultParentId?: string | null;
  defaultParentIdentifier?: string | null;
  openCreateIssue: (options?: IssueStatus | CreateIssueOptions) => void;
  closeCreateIssue: () => void;
  toggleCreateIssue: () => void;
  openCommandMenu: (page?: CommandMenuPage) => void;
  closeCommandMenu: () => void;
  toggleCommandMenu: () => void;
  setCommandMenuPage: (page: CommandMenuPage) => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isCreateIssueOpen: false,
  isCommandMenuOpen: false,
  commandMenuPage: "root",
  defaultStatus: undefined,
  defaultAssigneeId: undefined,
  defaultTeamId: undefined,
  defaultProjectId: undefined,
  defaultCycleId: undefined,
  defaultParentId: undefined,
  defaultParentIdentifier: undefined,
  openCreateIssue: (options) => {
    if (typeof options === "string") {
      set({
        isCreateIssueOpen: true,
        isCommandMenuOpen: false,
        defaultStatus: options,
        defaultAssigneeId: undefined,
        defaultTeamId: undefined,
        defaultProjectId: undefined,
        defaultCycleId: undefined,
        defaultParentId: undefined,
        defaultParentIdentifier: undefined,
      });
      return;
    }

    set({
      isCreateIssueOpen: true,
      isCommandMenuOpen: false,
      defaultStatus: options?.defaultStatus,
      defaultAssigneeId: options?.defaultAssigneeId,
      defaultTeamId: options?.defaultTeamId,
      defaultProjectId: options?.defaultProjectId,
      defaultCycleId: options?.defaultCycleId,
      defaultParentId: options?.defaultParentId,
      defaultParentIdentifier: options?.defaultParentIdentifier,
    });
  },
  closeCreateIssue: () =>
    set({
      isCreateIssueOpen: false,
      defaultStatus: undefined,
      defaultAssigneeId: undefined,
      defaultTeamId: undefined,
      defaultProjectId: undefined,
      defaultCycleId: undefined,
      defaultParentId: undefined,
      defaultParentIdentifier: undefined,
    }),
  toggleCreateIssue: () =>
    set((state) => ({ isCreateIssueOpen: !state.isCreateIssueOpen })),
  openCommandMenu: (page = "root") =>
    set({
      isCommandMenuOpen: true,
      commandMenuPage: page,
      isCreateIssueOpen: false,
    }),
  closeCommandMenu: () =>
    set({
      isCommandMenuOpen: false,
      commandMenuPage: "root",
    }),
  toggleCommandMenu: () =>
    set((state) => ({
      isCommandMenuOpen: !state.isCommandMenuOpen,
      commandMenuPage: "root",
      isCreateIssueOpen: false,
    })),
  setCommandMenuPage: (commandMenuPage) => set({ commandMenuPage }),
}));
