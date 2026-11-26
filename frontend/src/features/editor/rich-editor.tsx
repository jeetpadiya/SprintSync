"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  SquareCode,
  Minus,
} from "lucide-react";

interface RichEditorProps {
  documentId: string;
  initialContent?: Record<string, unknown> | null;
  onChange: (content: Record<string, unknown>) => void;
}

interface SlashCommandItem {
  id: string;
  label: string;
  description: string;
  keywords: string[];
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  run: (editor: NonNullable<ReturnType<typeof useEditor>>) => void;
}

const SLASH_COMMANDS: SlashCommandItem[] = [
  {
    id: "h1",
    label: "Heading 1",
    description: "Large section heading",
    keywords: ["h1", "heading", "title"],
    icon: Heading1,
    run: (ed) => ed.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    id: "h2",
    label: "Heading 2",
    description: "Medium section heading",
    keywords: ["h2", "heading", "subtitle"],
    icon: Heading2,
    run: (ed) => ed.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: "h3",
    label: "Heading 3",
    description: "Small subsection heading",
    keywords: ["h3", "heading"],
    icon: Heading3,
    run: (ed) => ed.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    id: "task",
    label: "Task list",
    description: "Interactive checklist items",
    keywords: ["task", "todo", "checkbox", "checklist"],
    icon: CheckSquare,
    run: (ed) => ed.chain().focus().toggleTaskList().run(),
  },
  {
    id: "bullet",
    label: "Bullet list",
    description: "Unordered list of items",
    keywords: ["bullet", "list", "ul"],
    icon: List,
    run: (ed) => ed.chain().focus().toggleBulletList().run(),
  },
  {
    id: "ordered",
    label: "Numbered list",
    description: "Ordered list with numbers",
    keywords: ["numbered", "ordered", "ol"],
    icon: ListOrdered,
    run: (ed) => ed.chain().focus().toggleOrderedList().run(),
  },
  {
    id: "code",
    label: "Code block",
    description: "Monospace code snippet",
    keywords: ["code", "codeblock", "pre"],
    icon: SquareCode,
    run: (ed) => ed.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: "quote",
    label: "Callout / Quote",
    description: "Highlight a note or quote",
    keywords: ["quote", "callout", "blockquote"],
    icon: Quote,
    run: (ed) => ed.chain().focus().toggleBlockquote().run(),
  },
  {
    id: "divider",
    label: "Divider",
    description: "Horizontal separator line",
    keywords: ["divider", "hr", "line", "separator"],
    icon: Minus,
    run: (ed) => ed.chain().focus().setHorizontalRule().run(),
  },
];

export function RichEditor({
  documentId,
  initialContent,
  onChange,
}: RichEditorProps) {
  const [slashState, setSlashState] = useState<{
    open: boolean;
    query: string;
    from: number;
    to: number;
    selectedIndex: number;
  }>({
    open: false,
    query: "",
    from: 0,
    to: 0,
    selectedIndex: 0,
  });

  const slashStateRef = useRef(slashState);
  slashStateRef.current = slashState;

  const lastDocIdRef = useRef(documentId);

  const filteredCommands = SLASH_COMMANDS.filter((cmd) => {
    const q = slashState.query.toLowerCase();
    if (!q) return true;
    return (
      cmd.label.toLowerCase().includes(q) ||
      cmd.keywords.some((kw) => kw.includes(q))
    );
  });

  const filteredRef = useRef(filteredCommands);
  filteredRef.current = filteredCommands;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({
        placeholder: "Write something, or press '/' for commands...",
      }),
    ],
    content: initialContent ?? {
      type: "doc",
      content: [{ type: "paragraph" }],
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getJSON() as Record<string, unknown>);

      const { selection } = ed.state;
      const { $from } = selection;
      const textBefore = $from.parent.textBetween(
        0,
        $from.parentOffset,
        undefined,
        "\ufffc"
      );
      const match = /(?:^|\s)\/([a-zA-Z0-9]*)$/.exec(textBefore);

      if (match && selection.empty) {
        const query = match[1] ?? "";
        const slashOffset = match[0].startsWith(" ")
          ? match[0].length - 1
          : match[0].length;
        const from = selection.from - slashOffset;
        setSlashState((prev) => ({
          open: true,
          query,
          from,
          to: selection.from,
          selectedIndex: prev.open ? prev.selectedIndex : 0,
        }));
      } else if (slashStateRef.current.open) {
        setSlashState((prev) => ({ ...prev, open: false, selectedIndex: 0 }));
      }
    },
    editorProps: {
      handleKeyDown: (_view, event) => {
        if (!slashStateRef.current.open) return false;
        const items = filteredRef.current;

        if (event.key === "ArrowDown") {
          event.preventDefault();
          setSlashState((prev) => ({
            ...prev,
            selectedIndex: items.length
              ? (prev.selectedIndex + 1) % items.length
              : 0,
          }));
          return true;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          setSlashState((prev) => ({
            ...prev,
            selectedIndex: items.length
              ? (prev.selectedIndex - 1 + items.length) % items.length
              : 0,
          }));
          return true;
        }
        if (event.key === "Enter" && items.length > 0) {
          event.preventDefault();
          const chosen = items[slashStateRef.current.selectedIndex] ?? items[0];
          if (chosen && editor) {
            editor
              .chain()
              .focus()
              .deleteRange({
                from: slashStateRef.current.from,
                to: slashStateRef.current.to,
              })
              .run();
            chosen.run(editor);
            setSlashState((prev) => ({ ...prev, open: false, selectedIndex: 0 }));
          }
          return true;
        }
        if (event.key === "Escape") {
          event.preventDefault();
          setSlashState((prev) => ({ ...prev, open: false, selectedIndex: 0 }));
          return true;
        }
        return false;
      },
    },
  });

  // Sync editor content only when switching to a different document
  useEffect(() => {
    if (!editor) return;
    if (lastDocIdRef.current !== documentId) {
      lastDocIdRef.current = documentId;
      editor.commands.setContent(
        initialContent ?? { type: "doc", content: [{ type: "paragraph" }] },
        { emitUpdate: false }
      );
      setSlashState((prev) => ({ ...prev, open: false, selectedIndex: 0 }));
    }
  }, [documentId, initialContent, editor]);

  const executeSlashCommand = (cmd: SlashCommandItem) => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .deleteRange({ from: slashState.from, to: slashState.to })
      .run();
    cmd.run(editor);
    setSlashState((prev) => ({ ...prev, open: false, selectedIndex: 0 }));
  };

  if (!editor) return null;

  return (
    <div className="relative space-y-3">
      {/* Compact Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-panel)] p-1">
        <ToolbarBtn
          title="Heading 1"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="h-3.5 w-3.5" strokeWidth={1.5} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-3.5 w-3.5" strokeWidth={1.5} />
        </ToolbarBtn>
        <div className="mx-1 h-4 w-px bg-[var(--border)]" />
        <ToolbarBtn
          title="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-3.5 w-3.5" strokeWidth={1.5} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-3.5 w-3.5" strokeWidth={1.5} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Strikethrough"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-3.5 w-3.5" strokeWidth={1.5} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Inline code"
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code className="h-3.5 w-3.5" strokeWidth={1.5} />
        </ToolbarBtn>
        <div className="mx-1 h-4 w-px bg-[var(--border)]" />
        <ToolbarBtn
          title="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-3.5 w-3.5" strokeWidth={1.5} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-3.5 w-3.5" strokeWidth={1.5} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Task checklist"
          active={editor.isActive("taskList")}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          <CheckSquare className="h-3.5 w-3.5" strokeWidth={1.5} />
        </ToolbarBtn>
        <div className="mx-1 h-4 w-px bg-[var(--border)]" />
        <ToolbarBtn
          title="Quote / Callout"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-3.5 w-3.5" strokeWidth={1.5} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Code block"
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <SquareCode className="h-3.5 w-3.5" strokeWidth={1.5} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Divider"
          active={false}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="h-3.5 w-3.5" strokeWidth={1.5} />
        </ToolbarBtn>
      </div>

      {/* Slash Command Menu ('/') */}
      {slashState.open && filteredCommands.length > 0 && (
        <div className="absolute left-0 top-11 z-40 w-64 rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--bg-panel)] p-1 shadow-2xl">
          <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-[var(--text-4)]">
            Insert block
          </div>
          {filteredCommands.map((cmd, idx) => {
            const Icon = cmd.icon;
            const active = idx === slashState.selectedIndex;
            return (
              <button
                key={cmd.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  executeSlashCommand(cmd);
                }}
                className={`flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-left transition-colors cursor-pointer ${
                  active
                    ? "bg-[rgba(255,255,255,0.08)] text-[var(--text)]"
                    : "text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)]"
                }`}
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-[var(--border)] bg-[var(--bg-elev)]">
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-medium text-[var(--text)]">
                    {cmd.label}
                  </div>
                  <div className="truncate text-[11px] text-[var(--text-4)]">
                    {cmd.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Tiptap ProseMirror Surface */}
      <div className="tiptap-editor min-h-[420px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function ToolbarBtn({
  children,
  title,
  active,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex h-6 w-6 items-center justify-center rounded transition-colors cursor-pointer ${
        active
          ? "bg-[rgba(255,255,255,0.1)] text-[var(--text)]"
          : "text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
      }`}
    >
      {children}
    </button>
  );
}
