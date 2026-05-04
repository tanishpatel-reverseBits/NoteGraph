"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Markdown } from "tiptap-markdown";
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTitleSearch } from "@/hooks/use-titles";
import { cn } from "@/lib/utils";

type RichEditorProps = {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  className?: string;
  invalid?: boolean;
  ariaLabelledBy?: string;
  onCaretChange?: (caret: number | null) => void;
};

const WIKILINK_RE = /\[\[([^\[\]\n]+)\]\]/g;

function buildWikilinkDecorations(doc: import("@tiptap/pm/model").Node) {
  const decos: Decoration[] = [];
  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    let match: RegExpExecArray | null;
    const text = node.text;
    WIKILINK_RE.lastIndex = 0;
    while ((match = WIKILINK_RE.exec(text)) !== null) {
      const from = pos + match.index;
      const to = from + match[0].length;
      decos.push(
        Decoration.inline(from, to, {
          class: "wikilink-token",
        }),
      );
    }
  });
  return DecorationSet.create(doc, decos);
}

const WikilinkDecoration = Extension.create({
  name: "wikilinkDecoration",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("wikilink-decoration"),
        state: {
          init: (_, { doc }) => buildWikilinkDecorations(doc),
          apply: (tr, old) =>
            tr.docChanged ? buildWikilinkDecorations(tr.doc) : old,
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});

type ActiveWiki = {
  start: number;
  end: number;
  query: string;
  left: number;
  top: number;
};

export function RichEditor({
  value,
  onChange,
  placeholder = "Start writing. Use [[Title]] to link notes.",
  className,
  invalid,
  ariaLabelledBy,
}: RichEditorProps) {
  const lastEmitted = useRef<string>(value);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState<ActiveWiki | null>(null);
  const [highlighted, setHighlighted] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline underline-offset-2" },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Markdown.configure({
        html: false,
        tightLists: true,
        linkify: true,
        breaks: false,
      }),
      WikilinkDecoration,
    ],
    content: value || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          "tiptap prose prose-sm max-w-none dark:prose-invert focus:outline-none min-h-72 px-4 py-3",
          "prose-headings:font-semibold prose-pre:bg-muted prose-pre:text-foreground",
          "prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-foreground",
        ),
        "aria-labelledby": ariaLabelledBy ?? "",
      },
    },
    onUpdate({ editor }) {
      const md: string = (editor.storage as unknown as { markdown: { getMarkdown: () => string } }).markdown.getMarkdown();
      lastEmitted.current = md;
      onChange(md);
      updateActive(editor);
    },
    onSelectionUpdate({ editor }) {
      updateActive(editor);
    },
    onBlur() {
      window.setTimeout(() => {
        if (!containerRef.current?.contains(document.activeElement)) {
          setActive(null);
        }
      }, 120);
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value === lastEmitted.current) return;
    editor.commands.setContent(value || "", { emitUpdate: false });
    lastEmitted.current = value;
  }, [editor, value]);

  function updateActive(editor: Editor) {
    const { from, to } = editor.state.selection;
    if (from !== to) {
      setActive(null);
      return;
    }
    const $from = editor.state.doc.resolve(from);
    const parent = $from.parent;
    if (!parent.isTextblock) {
      setActive(null);
      return;
    }
    const parentStart = $from.start();
    const offset = from - parentStart;
    const text = parent.textBetween(0, parent.content.size, "\n", "\n");
    const before = text.slice(0, offset);
    const start = before.lastIndexOf("[[");
    if (start === -1) {
      setActive(null);
      return;
    }
    const between = before.slice(start + 2);
    if (between.includes("]]") || between.includes("\n")) {
      setActive(null);
      return;
    }
    const closeRel = text.indexOf("]]", offset);
    const endRel = closeRel === -1 ? offset : closeRel + 2;
    const container = containerRef.current;
    if (!container) {
      setActive(null);
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const coordsAt = editor.view.coordsAtPos(from);
    const popupWidth = 288;
    const maxLeft = container.clientWidth - popupWidth - 8;
    const rawLeft = coordsAt.left - containerRect.left;
    setActive({
      start: parentStart + start,
      end: parentStart + endRel,
      query: between,
      left: Math.max(8, Math.min(rawLeft, maxLeft)),
      top: coordsAt.bottom - containerRect.top + 6,
    });
    setHighlighted(0);
  }

  const query = active?.query.trim() ?? "";
  const titlesQuery = useTitleSearch(query);
  const suggestions = useMemo(
    () => titlesQuery.data ?? [],
    [titlesQuery.data],
  );
  const showSuggest = Boolean(active) && suggestions.length > 0;

  const insert = useCallback(
    (title: string) => {
      if (!editor || !active) return;
      const replacement = `[[${title}]]`;
      editor
        .chain()
        .focus()
        .insertContentAt({ from: active.start, to: active.end }, replacement)
        .run();
      setActive(null);
    },
    [editor, active],
  );

  useEffect(() => {
    if (!showSuggest) return;
    function handler(event: KeyboardEvent) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlighted((h) => (h + 1) % suggestions.length);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlighted((h) => (h - 1 + suggestions.length) % suggestions.length);
      } else if (event.key === "Enter" || event.key === "Tab") {
        const choice = suggestions[highlighted];
        if (choice) {
          event.preventDefault();
          insert(choice.title);
        }
      } else if (event.key === "Escape") {
        setActive(null);
      }
    }
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [showSuggest, suggestions, highlighted, insert]);

  const toolbar = useMemo(() => {
    if (!editor) return null;
    return (
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 px-2 py-1.5">
        <ToolbarButton
          label="Heading 1"
          icon={<Heading1 className="size-3.5" />}
          active={editor.isActive("heading", { level: 1 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        />
        <ToolbarButton
          label="Heading 2"
          icon={<Heading2 className="size-3.5" />}
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        />
        <ToolbarButton
          label="Heading 3"
          icon={<Heading3 className="size-3.5" />}
          active={editor.isActive("heading", { level: 3 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        />
        <Divider />
        <ToolbarButton
          label="Bold"
          icon={<Bold className="size-3.5" />}
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          label="Italic"
          icon={<Italic className="size-3.5" />}
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          label="Strike"
          icon={<Strikethrough className="size-3.5" />}
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        />
        <ToolbarButton
          label="Inline code"
          icon={<Code className="size-3.5" />}
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        />
        <Divider />
        <ToolbarButton
          label="Bullet list"
          icon={<List className="size-3.5" />}
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          label="Numbered list"
          icon={<ListOrdered className="size-3.5" />}
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <ToolbarButton
          label="Task list"
          icon={<ListTodo className="size-3.5" />}
          active={editor.isActive("taskList")}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        />
        <ToolbarButton
          label="Quote"
          icon={<Quote className="size-3.5" />}
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        />
        <Divider />
        <ToolbarButton
          label="Wikilink"
          icon={<LinkIcon className="size-3.5" />}
          onClick={() => {
            editor.chain().focus().insertContent("[[]]").run();
            const pos = editor.state.selection.from - 2;
            editor.commands.setTextSelection(pos);
          }}
        />
        <Divider />
        <ToolbarButton
          label="Undo"
          icon={<Undo2 className="size-3.5" />}
          onClick={() => editor.chain().focus().undo().run()}
        />
        <ToolbarButton
          label="Redo"
          icon={<Redo2 className="size-3.5" />}
          onClick={() => editor.chain().focus().redo().run()}
        />
      </div>
    );
  }, [editor]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden rounded-lg border bg-background transition-colors",
        invalid
          ? "border-destructive ring-2 ring-destructive/20"
          : "border-input focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20",
        className,
      )}
    >
      {toolbar}
      <EditorContent editor={editor} />
      {showSuggest && active ? (
        <div
          className="absolute z-30 w-72 rounded-lg border border-border bg-popover p-1 shadow-lg"
          style={{
            left: active.left,
            top: active.top,
          }}
        >
          {suggestions.map((suggestion, i) => (
            <button
              key={suggestion.id}
              type="button"
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm",
                i === highlighted
                  ? "bg-muted text-foreground"
                  : "hover:bg-muted",
              )}
              onMouseEnter={() => setHighlighted(i)}
              onMouseDown={(event) => {
                event.preventDefault();
                insert(suggestion.title);
              }}
            >
              <span className="min-w-0 flex-1 truncate">{suggestion.title}</span>
              {suggestion.isPlaceholder ? (
                <span className="text-xs text-muted-foreground">Placeholder</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ToolbarButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label={label}
      title={label}
      data-active={active ? "true" : undefined}
      className={cn(
        "rounded-md",
        active && "bg-muted text-foreground",
      )}
      onClick={onClick}
    >
      {icon}
    </Button>
  );
}

function Divider() {
  return <span className="mx-0.5 h-4 w-px bg-border" aria-hidden />;
}
