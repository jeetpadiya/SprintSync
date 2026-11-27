"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useHotkeys } from "react-hotkeys-hook";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi } from "@/features/auth/api/auth-api";
import { useDeleteIssue } from "@/features/issues/hooks/use-issues";
import { useAuthStore } from "@/store/useAuthStore";
import { useModalStore } from "@/store/useModalStore";
import { useUIStore } from "@/store/useUIStore";

function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
    return true;
  }
  return target.isContentEditable || Boolean(target.closest("[contenteditable='true']"));
}

/**
 * Global Keyboard Navigation Hook
 * - 'Cmd+K' / 'Ctrl+K': Toggle Command Palette
 * - 'C': Open quick issue creation modal
 * - 'J' / 'ArrowDown': Select next issue in active list
 * - 'K' / 'ArrowUp': Select previous issue in active list
 * - 'S' / 'P' / 'A': Open quick Status / Priority / Assignee picker for selected issue
 * - 'Backspace': Delete selected issue (when not editing text)
 * - 'G' then 'S': Go to Settings
 * - 'Alt+Shift+Q': Log out
 * - 'Escape': Close open modals
 */
export function useKeyboardShortcuts() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { clearAuth } = useAuthStore();
  const deleteIssue = useDeleteIssue();

  const {
    isCreateIssueOpen,
    isCommandMenuOpen,
    openCreateIssue,
    closeCreateIssue,
    toggleCommandMenu,
    openCommandMenu,
    closeCommandMenu,
  } = useModalStore();

  const {
    activeIssueId,
    orderedIssueIds,
    onSelectActiveIssue,
  } = useUIStore();

  const gChordActiveRef = useRef(false);
  const gChordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const anyModalOpen = isCreateIssueOpen || isCommandMenuOpen;

  useEffect(() => {
    return () => {
      if (gChordTimerRef.current) clearTimeout(gChordTimerRef.current);
    };
  }, []);

  // Cmd+K / Ctrl+K -> Command Palette
  useHotkeys(
    "meta+k, ctrl+k",
    (e) => {
      e.preventDefault();
      toggleCommandMenu();
    },
    {
      enableOnFormTags: true,
      preventDefault: true,
    }
  );

  // C -> Create Issue
  useHotkeys(
    "c",
    (e) => {
      if (anyModalOpen || isEditableElement(e.target)) return;
      e.preventDefault();
      openCreateIssue();
    },
    {
      enableOnFormTags: false,
      preventDefault: true,
    },
    [anyModalOpen, openCreateIssue]
  );

  // J / Down -> Next issue
  useHotkeys(
    "j, down",
    (e) => {
      if (anyModalOpen || isEditableElement(e.target)) return;
      if (orderedIssueIds.length === 0 || !onSelectActiveIssue) return;
      e.preventDefault();
      const idx = activeIssueId ? orderedIssueIds.indexOf(activeIssueId) : -1;
      const nextIdx =
        idx < 0 ? 0 : Math.min(idx + 1, orderedIssueIds.length - 1);
      const nextId = orderedIssueIds[nextIdx];
      if (nextId) onSelectActiveIssue(nextId);
    },
    {
      enableOnFormTags: false,
    },
    [anyModalOpen, orderedIssueIds, activeIssueId, onSelectActiveIssue]
  );

  // K / Up -> Previous issue
  useHotkeys(
    "k, up",
    (e) => {
      if (anyModalOpen || isEditableElement(e.target)) return;
      if (orderedIssueIds.length === 0 || !onSelectActiveIssue) return;
      e.preventDefault();
      const idx = activeIssueId ? orderedIssueIds.indexOf(activeIssueId) : 0;
      const prevIdx = idx <= 0 ? 0 : idx - 1;
      const prevId = orderedIssueIds[prevIdx];
      if (prevId) onSelectActiveIssue(prevId);
    },
    {
      enableOnFormTags: false,
    },
    [anyModalOpen, orderedIssueIds, activeIssueId, onSelectActiveIssue]
  );

  // S -> Quick Status picker for selected issue (or G -> S chord to Settings)
  useHotkeys(
    "s",
    (e) => {
      if (anyModalOpen || isEditableElement(e.target)) return;
      e.preventDefault();

      if (gChordActiveRef.current) {
        gChordActiveRef.current = false;
        if (gChordTimerRef.current) clearTimeout(gChordTimerRef.current);
        router.push("/settings");
        return;
      }

      if (!activeIssueId) {
        toast.info("Select an issue first");
        return;
      }
      openCommandMenu("status");
    },
    {
      enableOnFormTags: false,
    },
    [anyModalOpen, activeIssueId, openCommandMenu, router]
  );

  // G -> arm 'G then S' navigation chord
  useHotkeys(
    "g",
    (e) => {
      if (anyModalOpen || isEditableElement(e.target)) return;
      gChordActiveRef.current = true;
      if (gChordTimerRef.current) clearTimeout(gChordTimerRef.current);
      gChordTimerRef.current = setTimeout(() => {
        gChordActiveRef.current = false;
      }, 900);
    },
    {
      enableOnFormTags: false,
    },
    [anyModalOpen]
  );

  // P -> Quick Priority picker for selected issue
  useHotkeys(
    "p",
    (e) => {
      if (anyModalOpen || isEditableElement(e.target)) return;
      e.preventDefault();
      if (!activeIssueId) {
        toast.info("Select an issue first");
        return;
      }
      openCommandMenu("priority");
    },
    {
      enableOnFormTags: false,
    },
    [anyModalOpen, activeIssueId, openCommandMenu]
  );

  // A -> Quick Assignee picker for selected issue
  useHotkeys(
    "a",
    (e) => {
      if (anyModalOpen || isEditableElement(e.target)) return;
      e.preventDefault();
      if (!activeIssueId) {
        toast.info("Select an issue first");
        return;
      }
      openCommandMenu("assignee");
    },
    {
      enableOnFormTags: false,
    },
    [anyModalOpen, activeIssueId, openCommandMenu]
  );

  // Backspace -> Delete selected issue
  useHotkeys(
    "backspace",
    (e) => {
      if (anyModalOpen || isEditableElement(e.target)) return;
      if (!activeIssueId) return;
      e.preventDefault();
      const targetId = activeIssueId;
      deleteIssue.mutate(targetId, {
        onSuccess: () => onSelectActiveIssue?.(null),
      });
    },
    {
      enableOnFormTags: false,
    },
    [anyModalOpen, activeIssueId, deleteIssue, onSelectActiveIssue]
  );

  // Alt+Shift+Q -> Log out
  useHotkeys(
    "alt+shift+q",
    (e) => {
      e.preventDefault();
      authApi
        .logout()
        .catch(() => {})
        .finally(() => {
          queryClient.clear();
          clearAuth();
          toast.success("Logged out");
          router.replace("/login");
        });
    },
    {
      enableOnFormTags: true,
    }
  );

  // Escape -> Close modals
  useHotkeys(
    "escape",
    () => {
      if (isCommandMenuOpen) {
        closeCommandMenu();
      } else if (isCreateIssueOpen) {
        closeCreateIssue();
      }
    },
    {
      enableOnFormTags: true,
    },
    [isCommandMenuOpen, isCreateIssueOpen, closeCommandMenu, closeCreateIssue]
  );
}
