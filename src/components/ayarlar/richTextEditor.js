"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import DOMPurify from "dompurify";
import { Bold, Italic, List, ListOrdered, Heading2, Link2, Code2, Undo2, Redo2, Underline as UnderlineIcon } from "lucide-react";
import Underline from "@tiptap/extension-underline";

const allowedTags = ["p", "br", "strong", "b", "em", "i", "u", "s", "h1", "h2", "h3", "h4", "ul", "ol", "li", "blockquote", "a", "span", "div"];
const allowedAttrs = ["href", "title"];
const sanitize = (html) => DOMPurify.sanitize(html || "", { ALLOWED_TAGS: allowedTags, ALLOWED_ATTR: allowedAttrs });

export default function RichTextEditor({ value = "", onChange, disabled = false }) {
  const [sourceMode, setSourceMode] = useState(false);
  const [source, setSource] = useState(value || "");
  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [StarterKit, Underline, Link.configure({ openOnClick: false })],
    content: "",
    onUpdate({ editor }) { if (!sourceMode) onChange(editor.getHTML()); },
  });

  useEffect(() => {
    if (!editor) return;
    const clean = sanitize(value);
    if (!sourceMode && editor.getHTML() !== clean) editor.commands.setContent(clean, { emitUpdate: false });
    if (!sourceMode) setSource(value || "");
  }, [editor, value, sourceMode]);

  useEffect(() => { editor?.setEditable(!disabled); }, [editor, disabled]);

  const toggleSource = () => {
    if (!editor) return;
    if (sourceMode) {
      const cleaned = sanitize(source);
      editor.commands.setContent(cleaned, { emitUpdate: false });
      onChange(cleaned);
    } else setSource(editor.getHTML());
    setSourceMode(!sourceMode);
  };

  const addLink = () => {
    if (!editor) return;
    const url = window.prompt("Bağlantı adresi (https:// veya mailto:)", "https://");
    if (url === null) return;
    if (!url.trim()) { editor.chain().focus().unsetLink().run(); return; }
    if (!/^(https?:\/\/|mailto:)/i.test(url.trim())) { window.alert("Yalnızca https, http veya mailto bağlantıları kullanılabilir."); return; }
    editor.chain().focus().setLink({ href: url.trim() }).run();
  };

  const tools = [
    { label: "Kalın", Icon: Bold, run: () => editor?.chain().focus().toggleBold().run(), active: editor?.isActive("bold") },
    { label: "İtalik", Icon: Italic, run: () => editor?.chain().focus().toggleItalic().run(), active: editor?.isActive("italic") },
    { label: "Altı çizili", Icon: UnderlineIcon, run: () => editor?.chain().focus().toggleUnderline().run(), active: editor?.isActive("underline") },
    { label: "Başlık", Icon: Heading2, run: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), active: editor?.isActive("heading", { level: 2 }) },
    { label: "Liste", Icon: List, run: () => editor?.chain().focus().toggleBulletList().run(), active: editor?.isActive("bulletList") },
    { label: "Numaralı liste", Icon: ListOrdered, run: () => editor?.chain().focus().toggleOrderedList().run(), active: editor?.isActive("orderedList") },
    { label: "Bağlantı", Icon: Link2, run: addLink, active: editor?.isActive("link") },
    { label: "Geri al", Icon: Undo2, run: () => editor?.chain().focus().undo().run(), active: false },
    { label: "Yinele", Icon: Redo2, run: () => editor?.chain().focus().redo().run(), active: false },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-blue-400">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 p-2">
        {tools.map(({ label, Icon, run, active }) => (
          <button key={label} type="button" title={label} aria-label={label} disabled={disabled || sourceMode || !editor} onClick={run}
            className={`rounded-lg p-2 disabled:opacity-35 ${active ? "bg-blue-100 text-blue-700" : "text-slate-600 hover:bg-slate-200"}`}>
            <Icon size={17} />
          </button>
        ))}
        <button type="button" onClick={toggleSource} disabled={disabled || !editor}
          className={`ml-auto flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold ${sourceMode ? "bg-blue-100 text-blue-700" : "bg-white text-slate-600"}`}>
          <Code2 size={16} /> HTML
        </button>
      </div>
      {sourceMode ? (
        <textarea rows={13} spellCheck={false} value={source} disabled={disabled}
          onChange={(e) => { setSource(e.target.value); onChange(e.target.value); }}
          className="w-full resize-y p-4 font-mono text-xs text-slate-800 outline-none" />
      ) : (
        <EditorContent editor={editor} className="rich-editor min-h-56 px-4 py-3 text-sm text-slate-800 [&_.ProseMirror]:min-h-52 [&_.ProseMirror]:outline-none [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_p]:my-2 [&_ul]:ml-5 [&_ul]:list-disc [&_ol]:ml-5 [&_ol]:list-decimal [&_a]:text-blue-600 [&_a]:underline" />
      )}
      <p className="border-t border-slate-100 px-3 py-2 text-xs text-slate-400">HTML kaydedilmeden önce sunucuda güvenli etiketlere göre temizlenir.</p>
    </div>
  );
}
