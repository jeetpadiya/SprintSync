import { create } from "zustand";

export type IssueViewMode = "list" | "board";

interface UIState {
  issueViewMode: IssueViewMode;
  collapsedGroups: Record<string, boolean>;
  activeIssueId: string | null;
  orderedIssueIds: string[];
  onSelectActiveIssue: ((id: string | null) => void) | null;
  setIssueViewMode: (mode: IssueViewMode) => void;
  toggleGroupCollapsed: (key: string) => void;
  setIssueNavigation: (params: {
    activeIssueId: string | null;
    orderedIssueIds: string[];
    onSelect: (id: string | null) => void;
  }) => void;
  clearIssueNavigation: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  issueViewMode: "list",
  collapsedGroups: {},
  activeIssueId: null,
  orderedIssueIds: [],
  onSelectActiveIssue: null,
  setIssueViewMode: (issueViewMode) => set({ issueViewMode }),
  toggleGroupCollapsed: (key) =>
    set((state) => ({
      collapsedGroups: {
        ...state.collapsedGroups,
        [key]: !state.collapsedGroups[key],
      },
    })),
  setIssueNavigation: ({ activeIssueId, orderedIssueIds, onSelect }) =>
    set({
      activeIssueId,
      orderedIssueIds,
      onSelectActiveIssue: onSelect,
    }),
  clearIssueNavigation: () =>
    set({
      activeIssueId: null,
      orderedIssueIds: [],
      onSelectActiveIssue: null,
    }),
}));
