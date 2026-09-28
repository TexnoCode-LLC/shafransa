import { useEffect, useRef, useState } from "react"
import { ImagePlus, RotateCcw, Star, X } from "lucide-react"

import { Button } from "@/components/admin/ui/button"
import { cn } from "@/lib/utils"

const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"]

// Çoxlu şəkil: mövcud URL-lər (silinmək üçün işarələnir, geri qaytarmaq olur) + yeni fayllar.
// value: { newFiles: File[], removedUrls: string[], order?: string[] }
// coverMode: ilk şəkil örtükdür (saytda əsas şəkil kimi) — mövcud şəkillərdən örtük seçmək olur
export function GalleryField({ existingUrls = [], value, onChange, max = 12, coverMode = false }) {
  const inputRef = useRef(null)
  const [error, setError] = useState(null)

  const [previews, setPreviews] = useState([])

  // Önizləmə URL-ləri eyni effektdə yaradılır və buraxılır (yaddaş sızmasın, StrictMode-da da qırılmasın)
  useEffect(() => {
    const next = value.newFiles.map((file) => ({ file, url: URL.createObjectURL(file) }))
    setPreviews(next)
    return () => next.forEach((p) => URL.revokeObjectURL(p.url))
  }, [value.newFiles])

  const orderedExisting = value.order?.length ? value.order.filter((url) => existingUrls.includes(url)) : existingUrls
  const kept = orderedExisting.filter((url) => !value.removedUrls.includes(url))
  const keptCount = kept.length
  const total = keptCount + value.newFiles.length
  // Örtük: ilk saxlanılan mövcud şəkil, yoxdursa ilk yeni şəkil
  const coverUrl = coverMode ? kept[0] ?? null : null
  const coverIsNewFile = coverMode && !coverUrl && value.newFiles.length > 0

  const makeCover = (url) => onChange({ ...value, order: [url, ...orderedExisting.filter((u) => u !== url)] })

  const add = (fileList) => {
    const files = Array.from(fileList || [])
    const valid = files.filter((f) => ALLOWED.includes(f.type) && f.size <= MAX_BYTES)
    const room = max - total
    if (valid.length < files.length) setError("Bəzi fayllar atıldı: yalnız JPG/PNG/WEBP/GIF, maks. 10 MB.")
    else if (valid.length > room) setError(`Qalereyada ən çox ${max} şəkil ola bilər.`)
    else setError(null)
    if (room > 0 && valid.length) onChange({ ...value, newFiles: [...value.newFiles, ...valid.slice(0, room)] })
    if (inputRef.current) inputRef.current.value = ""
  }

  const toggleExisting = (url) =>
    onChange({
      ...value,
      removedUrls: value.removedUrls.includes(url) ? value.removedUrls.filter((u) => u !== url) : [...value.removedUrls, url],
    })

  const removeNew = (file) => onChange({ ...value, newFiles: value.newFiles.filter((f) => f !== file) })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Qalereya</span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {total}/{max}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {orderedExisting.map((url) => {
          const removed = value.removedUrls.includes(url)
          const isCover = url === coverUrl
          return (
            <div key={url} className={cn("group relative aspect-square overflow-hidden rounded-md border", isCover && "ring-2 ring-primary ring-offset-1")}>
              <img src={url} alt="" className={cn("size-full object-cover transition", removed && "opacity-30 grayscale")} />
              <button
                type="button"
                onClick={() => toggleExisting(url)}
                className={cn(
                  "absolute right-1 top-1 flex size-6 items-center justify-center rounded-full shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  removed ? "bg-background text-foreground" : "bg-background/90 text-destructive"
                )}
                aria-label={removed ? "Silinməni geri al" : "Şəkli sil"}
              >
                {removed ? <RotateCcw className="size-3.5" /> : <X className="size-3.5" />}
              </button>
              {coverMode && !removed && !isCover && (
                <button
                  type="button"
                  onClick={() => makeCover(url)}
                  className="absolute left-1 top-1 flex size-6 items-center justify-center rounded-full bg-background/90 text-muted-foreground shadow-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Örtük et"
                  title="Örtük et"
                >
                  <Star className="size-3.5" />
                </button>
              )}
              {removed ? (
                <span className="absolute inset-x-0 bottom-0 bg-destructive/90 py-0.5 text-center text-[10px] font-medium text-destructive-foreground">
                  Silinəcək
                </span>
              ) : (
                isCover && (
                  <span className="absolute inset-x-0 bottom-0 bg-primary/90 py-0.5 text-center text-[10px] font-medium text-primary-foreground">
                    Örtük
                  </span>
                )
              )}
            </div>
          )
        })}
        {previews.map(({ file, url }, index) => (
          <div
            key={url}
            className={cn(
              "relative aspect-square overflow-hidden rounded-md border border-primary/40",
              coverIsNewFile && index === 0 && "ring-2 ring-primary ring-offset-1"
            )}
          >
            <img src={url} alt="" className="size-full object-cover" />
            <button
              type="button"
              onClick={() => removeNew(file)}
              className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-background/90 text-destructive shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Yeni şəkli çıxar"
            >
              <X className="size-3.5" />
            </button>
            <span className="absolute inset-x-0 bottom-0 bg-primary/90 py-0.5 text-center text-[10px] font-medium text-primary-foreground">
              {coverIsNewFile && index === 0 ? "Örtük · yeni" : "Yeni"}
            </span>
          </div>
        ))}
        {total < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              add(e.dataTransfer.files)
            }}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-md border border-dashed text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Qalereyaya şəkil əlavə et"
          >
            <ImagePlus className="size-5" />
            <span className="text-[11px]">Əlavə et</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.gif"
        multiple
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => add(e.target.files)}
      />
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : (
        total === 0 && (
          <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => inputRef.current?.click()}>
            Şəkil seç və ya bura sürüşdür
          </Button>
        )
      )}
    </div>
  )
}
