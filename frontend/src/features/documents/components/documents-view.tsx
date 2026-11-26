"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { RichEditor } from "@/features/editor/rich-editor";
import { useAuthStore } from "@/store/useAuthStore";
import {
  useCreateDocument,
  useDeleteDocument,
  useDocument,
  useDocuments,
  useUpdateDocument,
} from "../hooks/use-documents";
import { UpdateDocumentInput } from "@/types/document.types";
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Loader2,
  Check,
} from "lucide-react";

type DocsTab = "all" | "mine";

const AUTOSAVE_DEBOUNCE_MS = 1800;
const AUTOSAVE_MAX_WAIT_MS = 10000;

export function DocumentsView() {
  const { user, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<DocsTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxWaitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<{
    docId: string;
    data: UpdateDocumentInput;
  } | null>(null);

  const { data: documents = [], isLoading } = useDocuments(
    undefined,
    isAuthenticated
  );

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      if (activeTab === "mine" && doc.creatorId !== user?.id) {
        return false;
      }
      if (
        searchQuery.trim() &&
        !doc.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [documents, activeTab, searchQuery, user?.id]);

  const effectiveDocId = selectedDocId ?? filteredDocs[0]?.id ?? null;
  const listSummaryDoc =
    documents.find((d) => d.id === effectiveDocId) ?? null;

  const { data: detailDoc, isLoading: isDetailLoading } = useDocument(
    effectiveDocId,
    isAuthenticated
  );

  const activeDoc =
    (detailDoc && detailDoc.id === effectiveDocId ? detailDoc : null) ??
    listSummaryDoc;

  const createDocument = useCreateDocument();
  const updateDocument = useUpdateDocument();
  const deleteDocument = useDeleteDocument();

  const updateMutateRef = useRef(updateDocument.mutate);
  updateMutateRef.current = updateDocument.mutate;

  const clearTimers = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (maxWaitTimerRef.current) {
      clearTimeout(maxWaitTimerRef.current);
      maxWaitTimerRef.current = null;
    }
  }, []);

  const flushPendingSave = useCallback(() => {
    clearTimers();
    const pending = pendingSaveRef.current;
    if (!pending) return;

    pendingSaveRef.current = null;
    setSaveStatus("saving");
    updateMutateRef.current(
      { id: pending.docId, data: pending.data },
      {
        onSuccess: () => setSaveStatus("saved"),
        onError: () => setSaveStatus("idle"),
      }
    );
  }, [clearTimers]);

  const scheduleAutoSave = useCallback(
    (docId: string, payload: UpdateDocumentInput) => {
      // If switching docs while a previous doc had pending changes, flush it first
      if (
        pendingSaveRef.current &&
        pendingSaveRef.current.docId !== docId
      ) {
        flushPendingSave();
      }

      pendingSaveRef.current = {
        docId,
        data: {
          ...(pendingSaveRef.current?.data ?? {}),
          ...payload,
        },
      };

      setSaveStatus("saving");

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(() => {
        flushPendingSave();
      }, AUTOSAVE_DEBOUNCE_MS);

      if (!maxWaitTimerRef.current) {
        maxWaitTimerRef.current = setTimeout(() => {
          flushPendingSave();
        }, AUTOSAVE_MAX_WAIT_MS);
      }
    },
    [flushPendingSave]
  );

  // Flush pending edits if user hides/closes tab or navigates away
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushPendingSave();
      }
    };
    const handlePageHide = () => {
      flushPendingSave();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      flushPendingSave();
    };
  }, [flushPendingSave]);

  const handleSelectDoc = (docId: string) => {
    if (docId === effectiveDocId) return;
    flushPendingSave();
    setSelectedDocId(docId);
    setTitleDraft(null);
    setSaveStatus("idle");
  };

  const handleCreateDoc = async () => {
    flushPendingSave();
    const res = await createDocument.mutateAsync({
      title: "Untitled",
    });
    if (res.document?.id) {
      setSelectedDocId(res.document.id);
      setTitleDraft(null);
      setSaveStatus("idle");
    }
  };

  return (
    <WorkspaceShell>
      {/* Top Header Bar */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FileText
              className="h-3.5 w-3.5 text-[var(--text-3)]"
              strokeWidth={1.5}
            />
            <span className="text-[13px] font-medium tracking-tight text-[var(--text)]">
              Documents
            </span>
          </div>

          <div className="flex items-center gap-1">
            {(
              [
                { id: "all", label: "All" },
                { id: "mine", label: "Created by me" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  flushPendingSave();
                  setActiveTab(tab.id);
                  setSelectedDocId(null);
                }}
                className={`h-6 rounded-full border px-2.5 text-[11px] transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? "border-[var(--border-strong)] bg-[rgba(255,255,255,0.08)] font-medium text-[var(--text)]"
                    : "border-[var(--border)] text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveStatus === "saving" && (
            <span className="text-[11px] text-[var(--text-4)]">Saving...</span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1 text-[11px] text-[var(--text-4)]">
              <Check className="h-3 w-3 text-[var(--success)]" />
              <span>Saved</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleCreateDoc}
            disabled={createDocument.isPending}
            className="flex h-7 items-center gap-1.5 rounded-[var(--radius)] bg-[var(--accent)] px-2.5 text-[12px] font-medium text-[var(--text)] hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            <span>New document</span>
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center text-[var(--text-3)]">
            <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.5} />
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 text-center select-none">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-panel)] text-[var(--text-3)]">
              <FileText className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <h2 className="text-[14px] font-medium text-[var(--text)]">
              No documents yet
            </h2>
            <p className="mt-1 max-w-sm text-[12px] text-[var(--text-3)]">
              Write product specs, RFCs, and meeting notes alongside your
              issues with slash commands and checklists.
            </p>
            <button
              type="button"
              onClick={handleCreateDoc}
              className="mt-4 flex h-8 items-center gap-1.5 rounded-[var(--radius)] bg-[var(--accent)] px-3.5 text-[12px] font-medium text-[var(--text)] hover:bg-[var(--accent-hover)] transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2} />
              <span>Create document</span>
            </button>
          </div>
        ) : (
          <>
            {/* Left Sidebar List */}
            <div className="flex w-[280px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg)]">
              <div className="border-b border-[var(--border)] p-2.5">
                <div className="flex h-7 items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-panel)] px-2">
                  <Search
                    className="h-3.5 w-3.5 text-[var(--text-4)] shrink-0"
                    strokeWidth={1.5}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search documents..."
                    className="w-full bg-transparent text-[12px] text-[var(--text)] placeholder:text-[var(--text-4)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)]">
                {filteredDocs.length === 0 ? (
                  <p className="p-4 text-center text-[12px] text-[var(--text-4)]">
                    No matching documents
                  </p>
                ) : (
                  filteredDocs.map((doc) => {
                    const isSelected = activeDoc?.id === doc.id;
                    return (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => handleSelectDoc(doc.id)}
                        className={`flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-[rgba(255,255,255,0.06)]"
                            : "hover:bg-[rgba(255,255,255,0.025)]"
                        }`}
                      >
                        <FileText
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--text-4)]"
                          strokeWidth={1.5}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] font-medium text-[var(--text)]">
                            {doc.title || "Untitled"}
                          </div>
                          <div className="mt-0.5 flex items-center justify-between text-[11px] text-[var(--text-4)]">
                            <span className="truncate">
                              {doc.creator?.name || "Workspace"}
                            </span>
                            <span className="shrink-0 ml-2">
                              {new Date(doc.updatedAt).toLocaleDateString(
                                undefined,
                                { month: "short", day: "numeric" }
                              )}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Document Editor Canvas */}
            <div className="flex-1 overflow-y-auto bg-[var(--bg)] px-8 py-8">
              {activeDoc ? (
                <div className="mx-auto max-w-3xl space-y-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-[11px] text-[var(--text-4)]">
                      <span>{activeDoc.creator?.name || "Unknown author"}</span>
                      <span>·</span>
                      <span>
                        Updated{" "}
                        {new Date(activeDoc.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <button
                      type="button"
                      title="Delete document"
                      onClick={() => {
                        clearTimers();
                        pendingSaveRef.current = null;
                        deleteDocument.mutate(activeDoc.id, {
                          onSuccess: () => {
                            setSelectedDocId(null);
                            setTitleDraft(null);
                            setSaveStatus("idle");
                          },
                        });
                      }}
                      className="flex h-6 items-center gap-1 rounded px-2 text-[11px] text-[var(--text-4)] hover:bg-[var(--bg-hover)] hover:text-[var(--danger)] transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                      <span>Delete</span>
                    </button>
                  </div>

                  {/* Editable Document Title */}
                  <input
                    type="text"
                    value={titleDraft !== null ? titleDraft : activeDoc.title}
                    placeholder="Untitled"
                    onChange={(e) => {
                      const val = e.target.value;
                      setTitleDraft(val);
                      if (val.trim()) {
                        scheduleAutoSave(activeDoc.id, { title: val.trim() });
                      }
                    }}
                    onBlur={() => {
                      if (titleDraft !== null && !titleDraft.trim()) {
                        setTitleDraft(null);
                      } else if (pendingSaveRef.current?.data.title) {
                        flushPendingSave();
                      }
                    }}
                    className="w-full bg-transparent text-[26px] font-semibold tracking-tight text-[var(--text)] placeholder:text-[var(--text-4)] focus:outline-none"
                  />

                  {/* Wait for detail content before mounting Tiptap so initialContent is loaded */}
                  {detailDoc && detailDoc.id === activeDoc.id ? (
                    <RichEditor
                      documentId={detailDoc.id}
                      initialContent={detailDoc.content ?? null}
                      onChange={(content) =>
                        scheduleAutoSave(detailDoc.id, { content })
                      }
                    />
                  ) : isDetailLoading ? (
                    <div className="flex h-48 items-center justify-center text-[var(--text-4)]">
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        strokeWidth={1.5}
                      />
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-[12px] text-[var(--text-4)]">
                  Select a document to edit
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </WorkspaceShell>
  );
}
