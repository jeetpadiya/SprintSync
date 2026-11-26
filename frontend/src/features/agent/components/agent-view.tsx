"use client";

import { useState } from "react";
import { toast } from "sonner";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import {
  ChevronDown,
  Plus,
  ArrowUp,
  Box,
  Search,
  Users,
  X,
  Sparkles,
  RotateCcw,
} from "lucide-react";

interface ExamplePrompt {
  id: string;
  title: string;
  description: string;
  prompt: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const EXAMPLE_PROMPTS: ExamplePrompt[] = [
  {
    id: "project",
    title: "Create a new project",
    description: "Turn an idea into a well-scoped project",
    prompt: "Create a new project for our Q1 mobile offline sync milestone",
    icon: Box,
  },
  {
    id: "research",
    title: "Research a topic",
    description: "Research a topic across the issue backlog",
    prompt: "Research all open authentication and session bugs in the backlog",
    icon: Search,
  },
  {
    id: "team",
    title: "Set up new team",
    description: "Create a team that matches how your organization works",
    prompt: "Set up a new Platform Engineering team with default workflows",
    icon: Users,
  },
];

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function AgentView() {
  const [prompt, setPrompt] = useState("");
  const [showExamples, setShowExamples] = useState(true);
  const [isChatMenuOpen, setIsChatMenuOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const handleSend = (text?: string) => {
    const value = (text ?? prompt).trim();
    if (!value) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: value,
    };

    const assistantMsg: ChatMessage = {
      id: `a-${Date.now() + 1}`,
      role: "assistant",
      content:
        "Agent UI preview mode — backend AI orchestration will be connected in the next phase. Your prompt is ready to be routed to workspace tools.",
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    if (!text) setPrompt("");
  };

  const resetChat = () => {
    setMessages([]);
    setPrompt("");
    setIsChatMenuOpen(false);
  };

  return (
    <WorkspaceShell>
      {/* Top Header Bar */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsChatMenuOpen((v) => !v)}
            className="flex h-7 items-center gap-1.5 rounded-[var(--radius)] px-2 text-[13px] font-medium tracking-tight text-[var(--text)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
          >
            <span>{messages.length > 0 ? "Active chat" : "New chat"}</span>
            <ChevronDown
              className="h-3.5 w-3.5 text-[var(--text-4)]"
              strokeWidth={1.5}
            />
          </button>

          {isChatMenuOpen && (
            <div className="absolute left-0 top-full mt-1 z-40 w-52 rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--bg-panel)] p-1 shadow-xl">
              <button
                type="button"
                onClick={resetChat}
                className="flex h-7 w-full items-center gap-2 rounded px-2 text-[12px] text-[var(--text)] hover:bg-[var(--bg-hover)] cursor-pointer"
              >
                <RotateCcw className="h-3 w-3 text-[var(--text-3)]" />
                <span>New chat</span>
              </button>
              <div className="my-1 border-t border-[var(--border)]" />
              <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-[var(--text-4)]">
                Recent
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsChatMenuOpen(false);
                  handleSend("Set up new team");
                }}
                className="flex h-7 w-full items-center justify-between rounded px-2 text-[12px] text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)] cursor-pointer"
              >
                <span className="truncate">Set up new team</span>
                <span className="text-[11px] text-[var(--text-4)]">11min</span>
              </button>
            </div>
          )}
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={resetChat}
            className="flex h-7 items-center gap-1.5 rounded-[var(--radius)] px-2 text-[12px] text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)] transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>New chat</span>
          </button>
        )}
      </header>

      {/* Main Centered Canvas */}
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-y-auto bg-[var(--bg)] px-4 py-10">
        {/* Faint Circular Watermark Emblem */}
        {messages.length === 0 && (
          <div className="pointer-events-none absolute top-14 left-1/2 -translate-x-1/2 opacity-[0.035] select-none">
            <svg className="h-72 w-72" viewBox="0 0 200 200" fill="none">
              <circle
                cx="100"
                cy="100"
                r="88"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M28 118 L82 172 M22 92 L108 178 M32 66 L134 168"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}

        <div className="relative z-10 w-full max-w-[540px] space-y-5">
          {/* Active Conversation Preview (if user sent a prompt) */}
          {messages.length > 0 && (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-[10px] border px-3.5 py-2.5 text-[13px] leading-relaxed ${
                    msg.role === "user"
                      ? "ml-10 border-[var(--border-strong)] bg-[var(--bg-elev)] text-[var(--text)]"
                      : "mr-6 border-[var(--border)] bg-[var(--bg-panel)] text-[var(--text-2)]"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-3)]">
                      <Sparkles className="h-3 w-3 text-[var(--accent)]" />
                      <span>SprintSync Agent</span>
                    </div>
                  )}
                  <p>{msg.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Prompt Composer Card */}
          <div className="rounded-[12px] border border-[var(--border-strong)] bg-[var(--bg-panel)] p-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.45)] focus-within:border-[var(--accent)]/60 transition-colors">
            <textarea
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask SprintSync..."
              className="w-full resize-none bg-transparent text-[13px] text-[var(--text)] placeholder:text-[var(--text-4)] focus:outline-none leading-relaxed"
            />

            <div className="mt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                title="Add context"
                onClick={() =>
                  toast.info("Context picker coming soon", {
                    description:
                      "Attach issues, documents, or cycles when Agent backend is wired.",
                  })
                }
                className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>

              <button
                type="button"
                title="Send message"
                onClick={() => handleSend()}
                className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors cursor-pointer ${
                  prompt.trim()
                    ? "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
                    : "bg-[var(--accent)]/75 text-white/90 hover:bg-[var(--accent)]"
                }`}
              >
                <ArrowUp className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Empty-state Controls (Connect Git provider + Examples + Recent) */}
          {messages.length === 0 && (
            <>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() =>
                    toast.info("Git provider integration coming soon", {
                      description:
                        "Backend GitHub/GitLab connection will be added later.",
                    })
                  }
                  className="flex h-7 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-panel)] px-3 text-[12px] font-medium text-[var(--text-2)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                >
                  <svg
                    className="h-3.5 w-3.5 fill-current"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    />
                  </svg>
                  <span>Connect Git provider</span>
                </button>
              </div>

              {showExamples && (
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between px-0.5">
                    <span className="text-[12px] text-[var(--text-4)]">
                      Get started with some examples
                    </span>
                    <button
                      type="button"
                      title="Dismiss examples"
                      onClick={() => setShowExamples(false)}
                      className="flex h-5 w-5 items-center justify-center rounded text-[var(--text-4)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)] transition-colors cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    {EXAMPLE_PROMPTS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setPrompt(item.prompt)}
                          className="flex flex-col items-start rounded-[8px] border border-[var(--border)] bg-[var(--bg-panel)] p-3.5 text-left hover:border-[var(--border-strong)] hover:bg-[rgba(255,255,255,0.03)] transition-colors cursor-pointer"
                        >
                          <Icon
                            className="mb-4 h-4 w-4 text-[var(--text-3)]"
                            strokeWidth={1.5}
                          />
                          <span className="text-[12px] font-medium text-[var(--text)]">
                            {item.title}
                          </span>
                          <span className="mt-1 text-[11px] leading-relaxed text-[var(--text-4)]">
                            {item.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent Item Row */}
              <button
                type="button"
                onClick={() => handleSend("Set up new team")}
                className="flex h-10 w-full items-center justify-between rounded-[8px] border border-[var(--border)] bg-[var(--bg-panel)] px-3.5 text-[12px] hover:border-[var(--border-strong)] hover:bg-[rgba(255,255,255,0.03)] transition-colors cursor-pointer"
              >
                <span className="text-[var(--text-2)]">Set up new team</span>
                <span className="text-[11px] text-[var(--text-4)]">11min</span>
              </button>
            </>
          )}
        </div>
      </div>
    </WorkspaceShell>
  );
}
