import { useEffect, useId, useRef, useState } from "react"
import { ImagePlus, Trash2, Upload } from "lucide-react"

import { Button } from "@/components/admin/ui/button"
import { cn } from "@/lib/utils"

const MAX_BYTES = 10 * 1024 * 1024
const ACCEPT = ".jpg,.jpeg,.png,.webp,.gif"
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"]

// Tək şəkil: mövcud şəkil (URL) və ya yeni seçilən fayl önizlənir; dəyişmək/silmək olur.
// value: { file: File | null, removed: boolean } — currentUrl backend-dəki mövcud şəkildir
export function ImageUploadField({ currentUrl, value, onChange, label = "Şəkil", hint }) {
  const inputId = useId()
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState(null)

  // Seçilmiş faylın önizləməsi; yaddaş sızmasın deyə köhnə URL buraxılır
  useEffect(() => {
    if (!value.file) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(value.file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [value.file])

  const shown = preview || (!value.removed && currentUrl ? currentUrl : null)

  const pick = (file) => {
    if (!file) return
    if (!ALLOWED.includes(file.type)) {
      setError("Yalnız JPG, PNG, WEBP və ya GIF şəkil seçin.")
      return
    }
    if (file.size > MAX_BYTES) {
      setError("Şəkil 10 MB-dan böyük ola bilməz.")
      return
    }
    setError(null)
    onChange({ file, removed: false })
  }

  const remove = () => {
    setError(null)
    onChange({ file: null, removed: !!currentUrl })
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-sm font-medium leading-none">
        {label}
      </label>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            pick(e.dataTransfer.files?.[0])
          }}
          className={cn(
            "group relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted/40 transition-colors hover:border-primary/50 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            shown && "border-solid"
          )}
          aria-label={shown ? "Şəkli dəyiş" : "Şəkil seç"}
        >
          {shown ? (
            <img src={shown} alt="" className="size-full object-cover" />
          ) : (
            <ImagePlus className="size-6 text-muted-foreground group-hover:text-primary" />
          )}
        </button>
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              <Upload />
              {shown ? "Dəyiş" : "Yüklə"}
            </Button>
            {shown && (
              <Button type="button" variant="ghost" size="sm" onClick={remove} className="text-destructive hover:text-destructive">
                <Trash2 />
                Sil
              </Button>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {value.file ? value.file.name : hint || "JPG, PNG, WEBP, GIF · maks. 10 MB"}
          </p>
        </div>
      </div>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => pick(e.target.files?.[0])}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
