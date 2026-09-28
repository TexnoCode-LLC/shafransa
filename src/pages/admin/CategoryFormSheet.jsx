import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Loader2, Wand2 } from "lucide-react"

import { ConfirmDialog } from "@/components/admin/ConfirmDialog"
import { ImageUploadField } from "@/components/admin/ImageUploadField"
import { TranslationFields } from "@/components/admin/TranslationFields"
import { Button } from "@/components/admin/ui/button"
import { Input } from "@/components/admin/ui/input"
import { Label } from "@/components/admin/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/admin/ui/select"
import { Separator } from "@/components/admin/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/admin/ui/sheet"
import { apiErrorMessage, CONTENT_LANGUAGES, isValidSlug, slugify } from "@/lib/admin"
import { cn } from "@/lib/utils"
import { useSaveCategory } from "./queries"

const NAME_MAX = 100
const DESCRIPTION_MAX = 1000
const NO_PARENT = "none"

const FIELDS = [
  { key: "name", label: "Ad", type: "input", maxLength: NAME_MAX, placeholder: "məs. Bitki çayları" },
  { key: "description", label: "Təsvir", type: "textarea", maxLength: DESCRIPTION_MAX, rows: 4, placeholder: "Qısa izah (istəyə bağlı)" },
]

function initialState(category, defaultParentId) {
  const translations = Object.fromEntries(
    CONTENT_LANGUAGES.map(({ code }) => {
      const t = category?.translations?.find((x) => x.language === code || (code === "en" && x.language === "eng"))
      return [code, { name: t?.name ?? "", description: t?.description ?? "" }]
    })
  )
  return {
    translations,
    slug: category?.slug ?? "",
    slugTouched: !!category,
    parentId: category ? category.parentId || NO_PARENT : defaultParentId || NO_PARENT,
    icon: { file: null, removed: false },
  }
}

// Formun "çirkli" olub-olmadığını yoxlamaq üçün müqayisə olunan hissə (fayl obyekti ayrıca)
const snapshot = (state) =>
  JSON.stringify({ t: state.translations, s: state.slug, p: state.parentId, f: !!state.icon.file, r: state.icon.removed })

export function CategoryFormSheet({ open, onOpenChange, category, defaultParentId, topLevelCategories }) {
  const isEdit = !!category
  const save = useSaveCategory()
  const [state, setState] = useState(() => initialState(category, defaultParentId))
  const [initial, setInitial] = useState(() => snapshot(state))
  const [submitted, setSubmitted] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  // Hər açılışda formu seçilmiş kateqoriya ilə doldur.
  // Yalnız açılış və ID dəyişəndə — arxa planda siyahı yenilənəndə (pəncərəyə qayıdanda) yazılanlar silinməsin
  useEffect(() => {
    if (!open) return
    const next = initialState(category, defaultParentId)
    setState(next)
    setInitial(snapshot(next))
    setSubmitted(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, category?.id, defaultParentId])

  const hasChildren = (category?.children?.length ?? 0) > 0
  const parentOptions = (topLevelCategories || []).filter((c) => c.id !== category?.id)
  const dirty = snapshot(state) !== initial

  // Slug əl ilə dəyişdirilməyibsə addan avtomatik yaranır (az, yoxdursa en)
  const autoSlug = useMemo(
    () => slugify(state.translations.az.name || state.translations.en.name || state.translations.ru.name || state.translations.tr.name),
    [state.translations]
  )
  const slug = state.slugTouched ? state.slug : autoSlug

  const errors = useMemo(() => {
    const result = {}
    const langs = Object.values(state.translations)
    if (!langs.some((t) => t.name.trim())) result.translations = "Ən azı bir dildə ad yazın."
    else if (langs.some((t) => t.name.length > NAME_MAX || t.description.length > DESCRIPTION_MAX))
      result.translations = `Ad ən çox ${NAME_MAX}, təsvir ən çox ${DESCRIPTION_MAX} simvol ola bilər.`
    if (slug && !isValidSlug(slug)) result.slug = "Yalnız kiçik latın hərfləri, rəqəmlər və tire (-)."
    if (isEdit && !slug) result.slug = "Slug boş ola bilməz."
    return result
  }, [state.translations, slug, isEdit])

  const requestClose = () => {
    if (save.isPending) return
    if (dirty) setConfirmDiscard(true)
    else onOpenChange(false)
  }

  const submit = (event) => {
    event.preventDefault()
    setSubmitted(true)
    if (Object.keys(errors).length > 0) return

    const form = new FormData()
    const translations = CONTENT_LANGUAGES.map(({ code }) => ({
      language: code,
      name: state.translations[code].name.trim(),
      description: state.translations[code].description.trim() || null,
    }))
    // Yaradarkən yalnız doldurulmuş dillər; redaktədə hamısı (adı boş olan dil silinir)
    form.append("translationJson", JSON.stringify(isEdit ? translations : translations.filter((t) => t.name)))

    if (!isEdit) {
      if (slug) form.append("slug", slug)
      if (state.parentId !== NO_PARENT) form.append("parentId", state.parentId)
      if (state.icon.file) form.append("IconFile", state.icon.file)
    } else {
      if (slug !== category.slug) form.append("slug", slug)
      const currentParent = category.parentId || NO_PARENT
      if (state.parentId !== currentParent) {
        if (state.parentId === NO_PARENT) form.append("clearParent", "true")
        else form.append("parentId", state.parentId)
      }
      if (state.icon.file) form.append("NewIconFile", state.icon.file)
      else if (state.icon.removed) form.append("removeIcon", "true")
    }

    save.mutate(
      { id: category?.id, form },
      {
        onSuccess: () => {
          toast.success(isEdit ? "Kateqoriya yeniləndi" : "Kateqoriya yaradıldı")
          onOpenChange(false)
        },
        onError: (error) => toast.error(apiErrorMessage(error)),
      }
    )
  }

  const set = (patch) => setState((prev) => ({ ...prev, ...patch }))

  return (
    <>
      <Sheet open={open} onOpenChange={(next) => (next ? onOpenChange(true) : requestClose())}>
        <SheetContent
          className="flex w-full flex-col gap-0 p-0 sm:max-w-lg"
          onOpenAutoFocus={(event) => {
            // Desktopda dərhal "Ad" sahəsinə yazmaq olsun; mobildə klaviatura özbaşına açılmasın
            event.preventDefault()
            if (window.matchMedia("(min-width: 768px)").matches) document.getElementById("category-az-name")?.focus()
            else event.currentTarget.focus()
          }}
        >
          <SheetHeader className="border-b p-6">
            <SheetTitle>{isEdit ? "Kateqoriyanı redaktə et" : "Yeni kateqoriya"}</SheetTitle>
            <SheetDescription>
              {isEdit ? "Dəyişikliklər saytda dərhal görünəcək." : "Məhsulları qruplaşdırmaq üçün kateqoriya yarat."}
            </SheetDescription>
          </SheetHeader>

          <form id="category-form" onSubmit={submit} noValidate className="flex-1 space-y-6 overflow-y-auto p-6">
            <TranslationFields
              values={state.translations}
              onChange={(translations) => set({ translations })}
              fields={FIELDS}
              idPrefix="category"
              error={submitted ? errors.translations : null}
            />

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="category-slug">Slug (URL)</Label>
                {state.slugTouched && !isEdit && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => set({ slugTouched: false })}
                  >
                    <Wand2 />
                    Addan yarat
                  </Button>
                )}
              </div>
              <Input
                id="category-slug"
                value={slug}
                onChange={(e) => set({ slug: e.target.value.toLowerCase(), slugTouched: true })}
                placeholder="avtomatik yaranacaq"
                className={cn("font-mono text-sm", submitted && errors.slug && "border-destructive focus-visible:ring-destructive")}
                aria-invalid={submitted && !!errors.slug}
              />
              {submitted && errors.slug ? (
                <p className="text-xs text-destructive">{errors.slug}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Saytda ünvan: <span className="font-mono">/marketplace?category={slug || "…"}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-parent">Ana kateqoriya</Label>
              <Select value={state.parentId} onValueChange={(parentId) => set({ parentId })} disabled={hasChildren}>
                <SelectTrigger id="category-parent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PARENT}>Yoxdur — əsas kateqoriya</SelectItem>
                  {parentOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {hasChildren
                  ? "Bu kateqoriyanın alt kateqoriyaları var, ona görə başqasının altına keçə bilməz."
                  : "Yalnız 2 səviyyə: əsas kateqoriya və onun alt kateqoriyaları."}
              </p>
            </div>

            <ImageUploadField
              label="İkon"
              currentUrl={category?.icon || null}
              value={state.icon}
              onChange={(icon) => set({ icon })}
            />
          </form>

          <SheetFooter className="border-t p-4 sm:justify-between">
            <Button type="button" variant="outline" onClick={requestClose} disabled={save.isPending}>
              Ləğv et
            </Button>
            <Button type="submit" form="category-form" disabled={save.isPending}>
              {save.isPending && <Loader2 className="animate-spin" />}
              {isEdit ? "Yadda saxla" : "Yarat"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title="Dəyişikliklər yadda saxlanmayıb"
        description="Bağlasanız, etdiyiniz dəyişikliklər itəcək."
        confirmLabel="Bağla"
        cancelLabel="Redaktəyə qayıt"
        destructive
        onConfirm={() => {
          setConfirmDiscard(false)
          onOpenChange(false)
        }}
      />
    </>
  )
}
