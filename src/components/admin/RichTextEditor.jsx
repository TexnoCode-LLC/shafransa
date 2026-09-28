import { useState } from "react"
import { EditorContent, useEditor, useEditorState } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Placeholder } from "@tiptap/extensions"
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
  Unlink,
} from "lucide-react"

import { Button } from "@/components/admin/ui/button"
import { Input } from "@/components/admin/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/admin/ui/popover"
import { Separator } from "@/components/admin/ui/separator"
import { Toggle } from "@/components/admin/ui/toggle"
import { cn } from "@/lib/utils"

// Yalnız təhlükəsiz link protokolları (javascript: və s. saytda XSS yaradar)
function normalizeLink(value) {
  const raw = value.trim()
  if (!raw) return null
  const withProtocol = /^[a-z]+:/i.test(raw) ? raw : `https://${raw}`
  try {
    const url = new URL(withProtocol)
    return ["http:", "https:", "mailto:"].includes(url.protocol) ? url.href : null
  } catch {
    return null
  }
}

function LinkButton({ editor, isLink }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")
  const [error, setError] = useState(null)

  const openPopover = (next) => {
    if (next) {
      setValue(editor.getAttributes("link").href || "")
      setError(null)
    }
    setOpen(next)
  }

  const apply = (event) => {
    event.preventDefault()
    const href = normalizeLink(value)
    if (!href) {
      setError("Düzgün link daxil edin (https://…)")
      return
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run()
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={openPopover}>
      <PopoverTrigger asChild>
        <Toggle size="sm" pressed={isLink} aria-label="Link əlavə et">
          <Link2 />
        </Toggle>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <form onSubmit={apply} className="space-y-2">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="https://…"
            aria-label="Link ünvanı"
            aria-invalid={!!error}
            autoFocus
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            {isLink && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  editor.chain().focus().extendMarkRange("link").unsetLink().run()
                  setOpen(false)
                }}
              >
                <Unlink />
                Sil
              </Button>
            )}
            <Button type="submit" size="sm">
              Tətbiq et
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  )
}

// Blog məzmunu üçün redaktor: HTML çıxarır (saytda DOMPurify ilə təmizlənib göstərilir).
// value yalnız ilk dəfə oxunur — hər dil üçün ayrıca instance (key ilə) yaradılır.
export default function RichTextEditor({ id, value, onChange, placeholder = "Mətni yazın…", invalid }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true, protocols: ["http", "https", "mailto"] },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        id,
        class: "admin-rich-text min-h-[280px] px-4 py-3 focus:outline-none",
        "aria-label": "Məzmun redaktoru",
      },
    },
    // Boş redaktor "<p></p>" qaytarır — boş sətir kimi saxlanılır
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? "" : e.getHTML()),
  })

  // Alətlər panelinin aktiv vəziyyəti (v3-də redaktor hər dəyişiklikdə yenidən render olunmur)
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive("bold"),
            italic: e.isActive("italic"),
            underline: e.isActive("underline"),
            strike: e.isActive("strike"),
            h2: e.isActive("heading", { level: 2 }),
            h3: e.isActive("heading", { level: 3 }),
            bullet: e.isActive("bulletList"),
            ordered: e.isActive("orderedList"),
            quote: e.isActive("blockquote"),
            link: e.isActive("link"),
            canUndo: e.can().undo(),
            canRedo: e.can().redo(),
          }
        : null,
  })

  if (!editor || !state) return <div className="min-h-[330px] rounded-md border bg-muted/30" />

  const marks = [
    ["bold", Bold, "Qalın", () => editor.chain().focus().toggleBold().run()],
    ["italic", Italic, "Kursiv", () => editor.chain().focus().toggleItalic().run()],
    ["underline", Underline, "Altından xətt", () => editor.chain().focus().toggleUnderline().run()],
    ["strike", Strikethrough, "Üstündən xətt", () => editor.chain().focus().toggleStrike().run()],
  ]
  const blocks = [
    ["h2", Heading2, "Böyük başlıq (H2)", () => editor.chain().focus().toggleHeading({ level: 2 }).run()],
    ["h3", Heading3, "Alt başlıq (H3)", () => editor.chain().focus().toggleHeading({ level: 3 }).run()],
    ["bullet", List, "Nöqtəli siyahı", () => editor.chain().focus().toggleBulletList().run()],
    ["ordered", ListOrdered, "Nömrəli siyahı", () => editor.chain().focus().toggleOrderedList().run()],
    ["quote", Quote, "Sitat", () => editor.chain().focus().toggleBlockquote().run()],
  ]

  const renderToggle = ([key, Icon, label, run]) => (
    <Toggle key={key} size="sm" pressed={state[key]} onPressedChange={run} aria-label={label} title={label}>
      <Icon />
    </Toggle>
  )

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border bg-background focus-within:ring-1 focus-within:ring-ring",
        invalid && "border-destructive focus-within:ring-destructive"
      )}
    >
      {/* Düymələr fokusu götürmür (mousedown preventDefault) — əks halda klikdən dərhal sonra yazılan hərflər itir */}
      <div
        className="flex flex-wrap items-center gap-0.5 border-b bg-muted/30 p-1"
        role="toolbar"
        aria-label="Formatlama"
        onMouseDown={(event) => {
          if (event.target.closest("button")) event.preventDefault()
        }}
      >
        {marks.map(renderToggle)}
        <Separator orientation="vertical" className="mx-1 h-5" />
        {blocks.map(renderToggle)}
        <Separator orientation="vertical" className="mx-1 h-5" />
        <LinkButton editor={editor} isLink={state.link} />
        <div className="ml-auto flex gap-0.5">
          <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => editor.chain().focus().undo().run()} disabled={!state.canUndo} aria-label="Geri al">
            <Undo2 />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => editor.chain().focus().redo().run()} disabled={!state.canRedo} aria-label="Təkrarla">
            <Redo2 />
          </Button>
        </div>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
