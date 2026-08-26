import { useEffect, useMemo, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { Placeholder } from "@tiptap/extensions";
import { DOMParser as ProseMirrorDOMParser } from "@tiptap/pm/model";
import {
  AlignJustify,
  AlignLeft,
  Bold,
  Eraser,
  IndentDecrease,
  IndentIncrease,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
} from "lucide-react";

function escapeHtml(value = "") {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cleanLine(value = "") {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\u200b|\u200c|\u200d|\ufeff/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function getIndentLevel(value = "") {
  const leadingWhitespace =
    String(value || "").match(/^[\t ]*/)?.[0] || "";

  const tabCount =
    (leadingWhitespace.match(/\t/g) || []).length;

  const spaceCount =
    leadingWhitespace.replace(/\t/g, "").length;

  return Math.min(
    6,
    tabCount + Math.floor(spaceCount / 4),
  );
}

function parseListMarker(value = "") {
  const rawValue = String(value || "");
  const line = cleanLine(rawValue);
  const explicitLevel = getIndentLevel(rawValue);

  const decimalMatch = line.match(
    /^(\d+(?:\.\d+)+)(?:[.)])?(?:\s+|$)(.*)$/,
  );

  if (decimalMatch) {
    return {
      kind: "number",
      level: Math.max(
        explicitLevel,
        decimalMatch[1].split(".").length - 1,
      ),
      value:
        Number(decimalMatch[1].split(".").at(-1)) ||
        1,
      text: decimalMatch[2] || "",
    };
  }

  const numberMatch = line.match(
    /^(?:\((\d+)\)|(\d+)[.)])(?:\s+|$)(.*)$/,
  );

  if (numberMatch) {
    return {
      kind: "number",
      level: explicitLevel,
      value: Number(
        numberMatch[1] || numberMatch[2],
      ) || 1,
      text: numberMatch[3] || "",
    };
  }

  const letterMatch = line.match(
    /^(?:\(([a-zA-Z])\)|([a-zA-Z])[.)])(?:\s+|$)(.*)$/,
  );

  if (letterMatch) {
    const letter = String(
      letterMatch[1] || letterMatch[2],
    ).toLowerCase();

    return {
      kind: "letter",
      level: Math.max(1, explicitLevel),
      value: Math.max(
        1,
        letter.charCodeAt(0) - 96,
      ),
      text: letterMatch[3] || "",
    };
  }

  const romanMatch = line.match(
    /^(?:\(([ivxlcdm]+)\)|([ivxlcdm]+)[.)])(?:\s+|$)(.*)$/i,
  );

  if (romanMatch) {
    return {
      kind: "roman",
      level: Math.max(1, explicitLevel),
      value: 1,
      text: romanMatch[3] || "",
    };
  }

  const bulletMatch = line.match(
    /^[•●▪◦‣⁃∙·–—*-](?:\s+|$)(.*)$/,
  );

  if (bulletMatch) {
    return {
      kind: "bullet",
      level: Math.max(1, explicitLevel),
      value: 1,
      text: bulletMatch[1] || "",
    };
  }

  return null;
}

function joinWrappedText(previousValue = "", nextValue = "") {
  const previous = cleanLine(previousValue);
  const next = cleanLine(nextValue);

  if (!previous) return next;
  if (!next) return previous;

  if (
    /[A-Za-z]-$/.test(previous) &&
    /^[A-Za-z]/.test(next)
  ) {
    return `${previous}${next}`.trim();
  }

  return `${previous} ${next}`
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function parsePdfOrPlainDocument(value = "") {
  const lines = String(value || "")
    .replace(/\r\n?/g, "\n")
    .replace(/\u2028|\u2029/g, "\n")
    .split("\n");

  const blocks = [];
  let paragraph = "";
  let list = null;
  let parentItem = null;
  let childItem = null;
  let pendingMarker = null;
  let blankSeen = false;

  function flushParagraph() {
    const text = cleanLine(paragraph);

    if (text) {
      blocks.push({
        type: "paragraph",
        text,
      });
    }

    paragraph = "";
  }

  function flushList() {
    if (list?.items?.length) {
      blocks.push(list);
    }

    list = null;
    parentItem = null;
    childItem = null;
  }

  function ensureList(kind) {
    if (!list || list.kind !== kind) {
      flushParagraph();
      flushList();

      list = {
        type: "list",
        kind,
        items: [],
      };
    }
  }

  function addListItem(marker, suppliedText = "") {
    const text = cleanLine(suppliedText);

    if (!text) {
      pendingMarker = marker;
      return;
    }

    flushParagraph();

    if (
      marker.level > 0 &&
      list &&
      parentItem
    ) {
      const child = {
        kind: marker.kind,
        value: marker.value,
        text,
        children: [],
      };

      parentItem.children.push(child);
      childItem = child;
      pendingMarker = null;
      blankSeen = false;
      return;
    }

    ensureList(marker.kind);

    const item = {
      kind: marker.kind,
      value: marker.value,
      text,
      children: [],
    };

    list.items.push(item);
    parentItem = item;
    childItem = null;
    pendingMarker = null;
    blankSeen = false;
  }

  lines.forEach((rawLine) => {
    const line = cleanLine(rawLine);

    if (!line) {
      blankSeen = true;

      if (paragraph) {
        flushParagraph();
      }

      return;
    }

    const marker = parseListMarker(rawLine);

    if (marker) {
      addListItem(marker, marker.text);
      return;
    }

    if (pendingMarker) {
      addListItem(pendingMarker, line);
      return;
    }

    if (childItem) {
      childItem.text = joinWrappedText(
        childItem.text,
        line,
      );

      blankSeen = false;
      return;
    }

    if (parentItem) {
      const isSeparateParagraph =
        blankSeen &&
        /[.!?;:]$/.test(parentItem.text) &&
        /^[A-Z]/.test(line);

      if (isSeparateParagraph) {
        flushList();
        paragraph = line;
        blankSeen = false;
        return;
      }

      parentItem.text = joinWrappedText(
        parentItem.text,
        line,
      );

      blankSeen = false;
      return;
    }

    paragraph = joinWrappedText(paragraph, line);
    blankSeen = false;
  });

  flushParagraph();
  flushList();

  return blocks;
}

function renderList(items = [], kind = "number") {
  const isBullet = kind === "bullet";
  const ListTag = isBullet ? "ul" : "ol";
  const startValue = Number(items[0]?.value) || 1;
  const startAttribute =
    !isBullet && startValue !== 1
      ? ` start="${startValue}"`
      : "";

  const itemHtml = items
    .map((item) => {
      const childGroups = [];
      let activeGroup = null;

      (item.children || []).forEach((child) => {
        if (
          !activeGroup ||
          activeGroup.kind !== child.kind
        ) {
          activeGroup = {
            kind: child.kind,
            items: [],
          };

          childGroups.push(activeGroup);
        }

        activeGroup.items.push(child);
      });

      const childrenHtml = childGroups
        .map((group) =>
          renderList(group.items, group.kind),
        )
        .join("");

      return `<li><p>${escapeHtml(
        item.text,
      )}</p>${childrenHtml}</li>`;
    })
    .join("");

  return `<${ListTag}${startAttribute}>${itemHtml}</${ListTag}>`;
}

function plainDocumentToHtml(value = "") {
  const blocks = parsePdfOrPlainDocument(value);

  if (!blocks.length) return "<p></p>";

  return blocks
    .map((block) => {
      if (block.type === "list") {
        return renderList(
          block.items,
          block.kind,
        );
      }

      return `<p>${escapeHtml(block.text)}</p>`;
    })
    .join("");
}

function normalizeInitialContent(value = "") {
  const content = String(value || "").trim();

  if (!content) return "<p></p>";

  return /<\/?[a-z][\s\S]*>/i.test(content)
    ? content
    : plainDocumentToHtml(content);
}

function hasSemanticClipboardHtml(html = "") {
  const source = String(html || "");

  return (
    /<(ol|ul|li|table|strong|b|em|i|u|h[1-6])\b/i.test(
      source,
    ) ||
    /mso-list|docs-internal-guid/i.test(source)
  );
}

function insertHtmlAtSelection(view, html) {
  if (
    !html ||
    typeof document === "undefined"
  ) {
    return false;
  }

  const container = document.createElement("div");
  container.innerHTML = html;

  const parser = ProseMirrorDOMParser.fromSchema(
    view.state.schema,
  );

  const slice = parser.parseSlice(container, {
    preserveWhitespace: "full",
  });

  view.dispatch(
    view.state.tr
      .replaceSelection(slice)
      .scrollIntoView(),
  );

  return true;
}

function ToolbarButton({
  title,
  active = false,
  disabled = false,
  onClick,
  children,
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(event) => {
        event.preventDefault();

        if (!disabled) {
          onClick?.();
        }
      }}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-md border transition ${
        active
          ? "border-sibs-primary-1 bg-sibs-primary-1 text-white"
          : "border-transparent text-[#667085] hover:border-[#D7DEE8] hover:bg-white hover:text-[#FF5C28]"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({
  id,
  value = "",
  onChange,
  onFocus,
  onBlur,
  syncValue = true,
  placeholder = "Enter content...",
  minHeight = 120,
}) {
  const [, forceToolbarRender] = useState(0);

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: false,
      }),
      TextAlign.configure({
        types: ["paragraph"],
        alignments: [
          "left",
          "center",
          "right",
          "justify",
        ],
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    [placeholder],
  );

  const editor = useEditor({
    extensions,
    content: normalizeInitialContent(value),
    editorProps: {
      attributes: {
        id,
        class:
          "jd-rich-text-prosemirror min-h-[inherit] w-full outline-none",
        spellcheck: "true",
      },

      handlePaste(view, event) {
        const clipboard = event.clipboardData;

        if (!clipboard) return false;

        const html =
          clipboard.getData("text/html") || "";

        const plainText =
          clipboard.getData("text/plain") || "";

        /*
         * Keep semantic HTML from Word, Google Docs, and webpages.
         * Repair PDF/plain text when its number and sentence are copied
         * on separate physical lines.
         */
        if (
          html &&
          hasSemanticClipboardHtml(html)
        ) {
          return false;
        }

        if (!plainText.trim()) return false;

        event.preventDefault();

        return insertHtmlAtSelection(
          view,
          plainDocumentToHtml(plainText),
        );
      },
    },

    onUpdate({ editor: currentEditor }) {
      onChange?.(
        currentEditor.getHTML(),
        currentEditor.getText({
          blockSeparator: "\n",
        }),
      );

      forceToolbarRender((current) => current + 1);
    },

    onBlur({ editor: currentEditor }) {
      onBlur?.(
        currentEditor.getHTML(),
        currentEditor.getText({
          blockSeparator: "\n",
        }),
      );
    },

    onSelectionUpdate() {
      forceToolbarRender((current) => current + 1);
    },

    onTransaction() {
      forceToolbarRender((current) => current + 1);
    },

    immediatelyRender: true,
  });

  useEffect(() => {
    if (!editor || !syncValue) return;

    const nextContent =
      normalizeInitialContent(value);

    if (editor.getHTML() !== nextContent) {
      editor.commands.setContent(
        nextContent,
        {
          emitUpdate: false,
          parseOptions: {
            preserveWhitespace: "full",
          },
        },
      );
    }
  }, [editor, syncValue, value]);

  const canIndent =
    editor?.isActive("listItem") ||
    editor?.isActive("orderedList") ||
    editor?.isActive("bulletList");

  return (
    <>
      <style>{`
        /*
         * Tailwind Preflight removes browser list markers. These rules restore
         * ordered and unordered markers everywhere RichTextEditor is used,
         * including Add JD, Details, approval, and revision views.
         */
        .jd-rich-text-editor .ProseMirror {
          min-height: inherit;
          color: var(--sibs-primary-1);
          font-size: 0.8125rem;
          font-weight: 600;
          line-height: 1.5;
          outline: none;
          overflow-wrap: anywhere;
          word-break: normal;
        }

        .jd-rich-text-editor > div {
          min-height: inherit;
        }

        .jd-rich-text-editor .ProseMirror:focus,
        .jd-rich-text-editor .ProseMirror:focus-visible {
          border: 0 !important;
          outline: none !important;
          outline-offset: 0 !important;
          box-shadow: none !important;
        }

        .jd-rich-text-editor .ProseMirror > * + * {
          margin-top: 0.55rem;
        }

        .jd-rich-text-editor .ProseMirror em {
          font-style: italic;
        }

        .jd-rich-text-editor .ProseMirror strong {
          font-weight: 700;
        }

        .jd-rich-text-editor .ProseMirror u {
          text-decoration: underline;
        }

        .jd-rich-text-editor .ProseMirror s {
          text-decoration: line-through;
        }

        .jd-rich-text-editor .ProseMirror p {
          margin: 0;
          line-height: 1.5;
        }

        .jd-rich-text-editor .ProseMirror ol,
        .jd-rich-text-editor .ProseMirror ul {
          display: block !important;
          margin-top: 0.55rem !important;
          margin-bottom: 0.55rem !important;
          padding-left: 2.5rem !important;
          list-style-position: outside !important;
        }

        .jd-rich-text-editor .ProseMirror ol {
          list-style-type: decimal !important;
        }

        .jd-rich-text-editor .ProseMirror ul {
          list-style-type: disc !important;
        }

        .jd-rich-text-editor .ProseMirror ol ol {
          list-style-type: lower-alpha !important;
          padding-left: 2.5rem !important;
        }

        .jd-rich-text-editor .ProseMirror ol ol ol {
          list-style-type: lower-roman !important;
        }

        .jd-rich-text-editor .ProseMirror ol ol ol ol {
          list-style-type: decimal !important;
        }

        .jd-rich-text-editor .ProseMirror ul ul {
          list-style-type: circle !important;
          padding-left: 2.5rem !important;
        }

        .jd-rich-text-editor .ProseMirror ul ul ul {
          list-style-type: square !important;
        }

        .jd-rich-text-editor .ProseMirror li {
          display: list-item !important;
          padding-left: 0.4rem;
          line-height: 1.5;
        }

        .jd-rich-text-editor .ProseMirror li::marker {
          color: currentColor;
          font-weight: 600;
        }

        .jd-rich-text-editor .ProseMirror li + li {
          margin-top: 0.45rem;
        }

        .jd-rich-text-editor .ProseMirror li > p {
          display: inline;
          margin: 0;
        }

        .jd-rich-text-editor .ProseMirror li > p + ol,
        .jd-rich-text-editor .ProseMirror li > p + ul {
          display: block !important;
        }

        .jd-rich-text-editor
          .ProseMirror
          p.is-editor-empty:first-child::before {
          float: left;
          height: 0;
          color: #91a4b7;
          content: attr(data-placeholder);
          pointer-events: none;
        }

        .jd-rich-text-editor
          .ProseMirror
          [style*="text-align: justify"] {
          text-align: justify;
          text-justify: inter-word;
        }

        .jd-rich-text-editor
          .ProseMirror
          [style*="text-align: center"] {
          text-align: center;
        }

        .jd-rich-text-editor
          .ProseMirror
          [style*="text-align: right"] {
          text-align: right;
        }
      `}</style>

      <div
        onFocusCapture={onFocus}
        className="overflow-hidden rounded-[10px] border border-[#D7DEE8] bg-[#F8FAFC] transition hover:border-[#FF5C28]/40 hover:bg-white focus-within:border-[#FF5C28] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#FF5C28]/10"
      >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-[#D7DEE8] bg-[#F2F4F7] px-2.5 py-1.5">
        <ToolbarButton
          title="Bold"
          active={editor?.isActive("bold")}
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .toggleBold()
              .run()
          }
        >
          <Bold size={15} />
        </ToolbarButton>

        <ToolbarButton
          title="Italic"
          active={editor?.isActive("italic")}
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .toggleItalic()
              .run()
          }
        >
          <Italic size={15} />
        </ToolbarButton>

        <ToolbarButton
          title="Underline"
          active={editor?.isActive("underline")}
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .toggleUnderline()
              .run()
          }
        >
          <Underline size={15} />
        </ToolbarButton>

        <ToolbarButton
          title="Strikethrough"
          active={editor?.isActive("strike")}
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .toggleStrike()
              .run()
          }
        >
          <Strikethrough size={15} />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-[#D7E1EB]" />

        <ToolbarButton
          title="Numbered list"
          active={editor?.isActive("orderedList")}
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .toggleOrderedList()
              .run()
          }
        >
          <ListOrdered size={15} />
        </ToolbarButton>

        <ToolbarButton
          title="Bulleted list"
          active={editor?.isActive("bulletList")}
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .toggleBulletList()
              .run()
          }
        >
          <List size={15} />
        </ToolbarButton>

        <ToolbarButton
          title="Increase list indent"
          disabled={!canIndent}
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .sinkListItem("listItem")
              .run()
          }
        >
          <IndentIncrease size={15} />
        </ToolbarButton>

        <ToolbarButton
          title="Decrease list indent"
          disabled={!canIndent}
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .liftListItem("listItem")
              .run()
          }
        >
          <IndentDecrease size={15} />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-[#D7E1EB]" />

        <ToolbarButton
          title="Align left"
          active={editor?.isActive({
            textAlign: "left",
          })}
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .setTextAlign("left")
              .run()
          }
        >
          <AlignLeft size={15} />
        </ToolbarButton>

        <ToolbarButton
          title="Justify"
          active={editor?.isActive({
            textAlign: "justify",
          })}
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .setTextAlign("justify")
              .run()
          }
        >
          <AlignJustify size={15} />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-[#D7E1EB]" />

        <ToolbarButton
          title="Clear formatting"
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .unsetAllMarks()
              .clearNodes()
              .run()
          }
        >
          <Eraser size={15} />
        </ToolbarButton>

        <ToolbarButton
          title="Undo"
          disabled={
            !editor
              ?.can()
              .chain()
              .focus()
              .undo()
              .run()
          }
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .undo()
              .run()
          }
        >
          <Undo2 size={15} />
        </ToolbarButton>

        <ToolbarButton
          title="Redo"
          disabled={
            !editor
              ?.can()
              .chain()
              .focus()
              .redo()
              .run()
          }
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .redo()
              .run()
          }
        >
          <Redo2 size={15} />
        </ToolbarButton>
      </div>

      <div
        style={{ minHeight }}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            event.preventDefault();
            editor?.chain().focus().run();
          }
        }}
        className="jd-rich-text-editor bg-[#F8FAFC] px-3 py-2.5 focus-within:bg-white"
      >
        <EditorContent editor={editor} />
      </div>
      </div>
    </>
  );
}
