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

function areIdsEqual(a: string[], b: string[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export const useUIStore = create<UIState>((set, get) => ({
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
  setIssueNavigation: ({ activeIssueId, orderedIssueIds, onSelect }) => {
    const prev = get();
    if (
      prev.activeIssueId === activeIssueId &&
      prev.onSelectActiveIssue === onSelect &&
      areIdsEqual(prev.orderedIssueIds, orderedIssueIds)
    ) {
      return;
    }
    set({
      activeIssueId,
      orderedIssueIds,
      onSelectActiveIssue: onSelect,
    });
  },
  clearIssueNavigation: () => {
    const prev = get();
    if (
      prev.activeIssueId === null &&
      prev.orderedIssueIds.length === 0 &&
      prev.onSelectActiveIssue === null
    ) {
      return;
    }
    set({
      activeIssueId: null,
      orderedIssueIds: [],
      onSelectActiveIssue: null,
    });
  },
}));
