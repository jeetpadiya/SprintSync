"use client";

import { useHotkeys } from "react-hotkeys-hook";
import { useModalStore } from "@/store/useModalStore";

/**
 * Global Keyboard Navigation Provider Hook
 * - 'C': Open quick issue creation modal from anywhere
 * - 'Escape': Close open modal
 */
export function useKeyboardShortcuts() {
  const { openCreateIssue, closeCreateIssue, isCreateIssueOpen } = useModalStore();

  useHotkeys(
    "c",
    (e) => {
      e.preventDefault();
      openCreateIssue();
    },
    {
      enableOnFormTags: false, // Don't trigger when user is typing in form inputs
      preventDefault: true,
    }
  );

  useHotkeys(
    "escape",
    () => {
      if (isCreateIssueOpen) {
        closeCreateIssue();
      }
    },
    {
      enableOnFormTags: true,
    }
  );
}
