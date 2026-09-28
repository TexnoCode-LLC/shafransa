import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useBlocker, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { ArrowLeft, ExternalLink, Loader2, Plus, Trash2, Wand2 } from "lucide-react"

import { ConfirmDialog } from "@/components/admin/ConfirmDialog"
import { GalleryField } from "@/components/admin/GalleryField"
import { ImageUploadField } from "@/components/admin/ImageUploadField"
import { NoAccess } from "@/components/admin/NoAccess"
import { Badge } from "@/components/admin/ui/badge"
import { Button } from "@/components/admin/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/admin/ui/card"
import { Input } from "@/components/admin/ui/input"
import { Label } from "@/components/admin/ui/label"
import { Skeleton } from "@/components/admin/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/admin/ui/tabs"
import { Textarea } from "@/components/admin/ui/textarea"
import { useAdminRole } from "@/hooks/use-admin-role"
import { apiErrorMessage, CONTENT_LANGUAGES, isValidSlug, slugify } from "@/lib/admin"
import { cn } from "@/lib/utils"
import { PLANT_SECTIONS, TEXT_FIELD_KEYS } from "./plantFields"
import { useAdminPlant, useSavePlant } from "./queries"

let keySeed = 0
const newKey = () => `k${++keySeed}`

const isHttpUrl = (value) => {
  try {
    const url = new URL(value.trim())
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

function emptyTranslation() {
  return { ...Object.fromEntries(TEXT_FIELD_KEYS.map((k) => [k, ""])), references: [], usageForms: [] }
}

function stateFromPlant(plant) {
  const translations = Object.fromEntries(
    CONTENT_LANGUAGES.map(({ code }) => {
      const t = plant?.translations?.find((x) => x.language === code || (code === "en" && x.language === "eng"))
      if (!t) return [code, emptyTranslation()]
      return [
        code,
        {
          ...Object.fromEntries(TEXT_FIELD_KEYS.map((k) => [k, t[k] ?? ""])),
          references: (t.references || []).map((r) => ({ id: r.id, key: newKey(), link: r.link ?? "", description: r.description ?? "" })),
          usageForms: (t.usageForms || []).map((u) => ({ id: u.id, key: newKey(), name: u.name ?? "", description: u.description ?? "" })),
        },
      ]
    })
  )
  return {
    slug: plant?.slug ?? "",
    slugTouched: !!plant,
    scientificName: plant?.scientificName ?? "",
    translations,
    image: { file: null, removed: false },
    gallery: { newFiles: [], removedUrls: [] },
  }
}

// Dəyişiklik yoxlaması üçün (fayl obyektləri yox, sayları müqayisə olunur; siyahı açarları nəzərə alınmır)
const snapshot = (s) =>
  JSON.stringify({
    slug: s.slug,
    sci: s.scientificName,
    t: Object.fromEntries(
      Object.entries(s.translations).map(([lang, t]) => [
        lang,
        {
          ...Object.fromEntries(TEXT_FIELD_KEYS.map((k) => [k, t[k]])),
          r: t.references.map(({ id, link, description }) => [id, link, description]),
          u: t.usageForms.map(({ id, name, description }) => [id, name, description]),
        },
      ])
    ),
    img: [!!s.image.file, s.image.removed],
    gal: [s.gallery.newFiles.length, s.gallery.removedUrls],
  })

const hasContent = (t) =>
  TEXT_FIELD_KEYS.some((k) => k !== "name" && t[k]?.trim()) || t.references.length > 0 || t.usageForms.length > 0

// Bütün xətalar: { "az.name": "…", "en.ref.k3": "…" } + ilk xətanın yeri (dil, bölmə)
function validate(state, isEdit) {
  const errors = {}
  let first = null
  const add = (key, message, lang, section) => {
    errors[key] = message
    if (!first) first = { lang, section }
  }

  const langs = CONTENT_LANGUAGES.map(({ code }) => code)
  if (!langs.some((l) => state.translations[l].name.trim())) add("az.name", "Ən azı bir dildə ad yazın.", "az", "basic")

  for (const lang of langs) {
    const t = state.translations[lang]
    if (!t.name.trim()) {
      // Adsız dil backend-də silinir — yazılmış məzmun səssizcə itməsin
      if (hasContent(t)) add(`${lang}.name`, "Bu dildə məzmun var — ad yazın və ya məzmunu silin.", lang, "basic")
      continue
    }
    if (t.name.length > 150) add(`${lang}.name`, "Ad ən çox 150 simvol ola bilər.", lang, "basic")
    if (t.shortSummary.length > 500) add(`${lang}.shortSummary`, "Qısa xülasə ən çox 500 simvol ola bilər.", lang, "basic")
    t.usageForms.forEach((u) => {
      if (!u.name.trim()) add(`${lang}.uf.${u.key}`, "Forma adı boş ola bilməz.", lang, "usage")
    })
    t.references.forEach((r) => {
      if (!isHttpUrl(r.link)) add(`${lang}.ref.${r.key}`, "Link http:// və ya https:// ilə başlayan düzgün ünvan olmalıdır.", lang, "science")
    })
  }

  const slug = state.slug
  if (slug && !isValidSlug(slug)) add("slug", "Yalnız kiçik latın hərfləri, rəqəmlər və tire (-).", first?.lang ?? "az", first?.section ?? "basic")
  if (isEdit && !slug) add("slug", "Slug boş ola bilməz.", first?.lang ?? "az", first?.section ?? "basic")
  if (state.scientificName.length > 150) add("scientificName", "Elmi ad ən çox 150 simvol ola bilər.", first?.lang ?? "az", first?.section ?? "basic")

  return { errors, first }
}

function FieldControl({ field, id, value, onChange, error }) {
  const Control = field.type === "textarea" ? Textarea : Input
  const over = field.maxLength && value.length > field.maxLength
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>
          {field.label}
          {field.required && <span className="text-destructive"> *</span>}
        </Label>
        {field.maxLength && (
          <span className={cn("text-xs tabular-nums text-muted-foreground", over && "text-destructive")}>
            {value.length}/{field.maxLength}
          </span>
        )}
      </div>
      <Control
        id={id}
        value={value}
        rows={field.rows}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        className={cn(error && "border-destructive focus-visible:ring-destructive")}
      />
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : (
        field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>
      )}
    </div>
  )
}

function ListEditor({ title, description, items, onChange, errors, errorPrefix, columns, addLabel, emptyText }) {
  const update = (key, patch) => onChange(items.map((item) => (item.key === key ? { ...item, ...patch } : item)))
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...items, { key: newKey(), ...Object.fromEntries(columns.map((c) => [c.key, ""])) }])}
        >
          <Plus />
          {addLabel}
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="rounded-md bg-muted/40 py-4 text-center text-xs text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item, index) => {
            const error = errors[`${errorPrefix}.${item.key}`]
            return (
              <li key={item.key} className="flex gap-2">
                <span className="mt-2 w-5 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{index + 1}.</span>
                <div className="grid flex-1 gap-2 sm:grid-cols-2">
                  {columns.map((column) => (
                    <Input
                      key={column.key}
                      value={item[column.key]}
                      placeholder={column.placeholder}
                      aria-label={`${column.placeholder} ${index + 1}`}
                      onChange={(e) => update(item.key, { [column.key]: e.target.value })}
                      aria-invalid={!!error && column.key === columns[0].key}
                      className={cn(error && column.key === columns[0].key && "border-destructive focus-visible:ring-destructive")}
                    />
                  ))}
                  {error && <p className="text-xs text-destructive sm:col-span-2">{error}</p>}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => onChange(items.filter((x) => x.key !== item.key))}
                  aria-label={`${index + 1}-ci sətri sil`}
                >
                  <Trash2 />
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function buildTranslations(state, isEdit) {
  return CONTENT_LANGUAGES.map(({ code }) => {
    const t = state.translations[code]
    return {
      language: code,
      ...Object.fromEntries(TEXT_FIELD_KEYS.map((k) => [k, t[k].trim()])),
      references: t.references.map((r) => ({ ...(r.id ? { id: r.id } : {}), link: r.link.trim(), description: r.description.trim() || null })),
      usageForms: t.usageForms.map((u) => ({ ...(u.id ? { id: u.id } : {}), name: u.name.trim(), description: u.description.trim() })),
    }
  }).filter((t) => isEdit || t.name) // redaktədə adı boş dil göndərilir ki, backend onu silsin
}

// Hər bitki (və "yeni") üçün redaktor sıfırdan mount olunur: /new → /:id keçidində köhnə vəziyyət qalmasın
export default function PlantEditorPage() {
  const { id } = useParams()
  return <PlantEditor key={id ?? "new"} id={id} />
}

function PlantEditor({ id }) {
  const isEdit = !!id
  const navigate = useNavigate()
  const { canEditContent } = useAdminRole()
  const plant = useAdminPlant(id, { enabled: isEdit && canEditContent, refetchOnWindowFocus: false })
  const save = useSavePlant()

  const [state, setState] = useState(() => stateFromPlant(null))
  const [baseline, setBaseline] = useState(() => snapshot(stateFromPlant(null)))
  const [lang, setLang] = useState("az")
  const [section, setSection] = useState("basic")
  const [showErrors, setShowErrors] = useState(false)
  const allowNavigationRef = useRef(false)

  // Server datası formu yalnız ilk yükləmədə və uğurlu yadda saxlamadan sonra doldurur (yazılanlar itməsin)
  const loadedVersionRef = useRef(null)
  useEffect(() => {
    if (!isEdit || !plant.data || loadedVersionRef.current === plant.dataUpdatedAt) return
    loadedVersionRef.current = plant.dataUpdatedAt
    const next = stateFromPlant(plant.data)
    setState(next)
    setBaseline(snapshot(next))
  }, [isEdit, plant.data, plant.dataUpdatedAt])

  const dirty = snapshot(state) !== baseline

  // Yadda saxlanmamış dəyişiklik: səhifədən çıxış (router) və tabı bağlamaq (brauzer) xəbərdarlığı
  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) =>
        dirty && !allowNavigationRef.current && currentLocation.pathname !== nextLocation.pathname,
      [dirty]
    )
  )
  useEffect(() => {
    if (!dirty) return
    const handler = (event) => {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [dirty])

  const autoSlug = useMemo(
    () =>
      slugify(
        state.translations.en.name || state.translations.az.name || state.translations.ru.name || state.translations.tr.name
      ),
    [state.translations]
  )
  const effectiveState = useMemo(() => (state.slugTouched ? state : { ...state, slug: autoSlug }), [state, autoSlug])
  const { errors, first } = useMemo(() => validate(effectiveState, isEdit), [effectiveState, isEdit])
  const visibleErrors = showErrors ? errors : {}

  const setField = (key, value) =>
    setState((prev) => ({
      ...prev,
      translations: { ...prev.translations, [lang]: { ...prev.translations[lang], [key]: value } },
    }))

  const submit = () => {
    setShowErrors(true)
    if (first) {
      setLang(first.lang)
      setSection(first.section)
      toast.error("Formda düzəldilməli sahələr var")
      return
    }

    const form = new FormData()
    form.append("translationJson", JSON.stringify(buildTranslations(state, isEdit)))
    const slug = effectiveState.slug
    if (!isEdit) {
      if (slug) form.append("slug", slug)
      if (state.scientificName.trim()) form.append("scientificName", state.scientificName.trim())
      if (state.image.file) form.append("ImageFile", state.image.file)
      state.gallery.newFiles.forEach((file) => form.append("GalleryFiles", file))
    } else {
      if (slug !== plant.data.slug) form.append("slug", slug)
      form.append("scientificName", state.scientificName.trim()) // boş = təmizlə
      if (state.image.file) form.append("NewImageFile", state.image.file)
      else if (state.image.removed) form.append("removeImage", "true")
      state.gallery.newFiles.forEach((file) => form.append("NewGalleryFiles", file))
      state.gallery.removedUrls.forEach((url) => form.append("DeleteGalleryUrls", url))
    }

    save.mutate(
      { id, form },
      {
        onSuccess: (created) => {
          setShowErrors(false)
          if (!isEdit) {
            toast.success("Bitki yaradıldı")
            allowNavigationRef.current = true
            navigate(`/admin/plants/${created.id}`, { replace: true })
          } else {
            toast.success("Dəyişikliklər yadda saxlanıldı")
            // Dərhal "saxlanılıb" say; sonra serverdən gələn təzə data ilə doldur (yeni referans ID-ləri, şəkil URL-ləri)
            setBaseline(snapshot(state))
            loadedVersionRef.current = null
          }
        },
        onError: (error) => toast.error(apiErrorMessage(error)),
      }
    )
  }

  if (!canEditContent) return <NoAccess description="Ensiklopediyanı dəyişmək icazəniz yoxdur." />

  if (isEdit && plant.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Skeleton className="h-[480px] w-full" />
          <Skeleton className="h-[480px] w-full" />
        </div>
      </div>
    )
  }

  if (isEdit && plant.isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="font-medium">{plant.error?.status === 404 ? "Bitki tapılmadı" : "Bitki yüklənmədi"}</p>
          <p className="text-sm text-muted-foreground">{apiErrorMessage(plant.error)}</p>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/plants">Ensiklopediyaya qayıt</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const current = state.translations[lang]
  const title = isEdit ? plant.data?.name || "Bitki" : state.translations.az.name || "Yeni bitki"

  return (
    <>
      {/* Sabit əməliyyat paneli (header-in altında) */}
      <div className="sticky top-14 z-10 -mx-4 mb-6 flex flex-wrap items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
        <Button variant="ghost" size="icon" className="size-8" asChild>
          <Link to="/admin/plants" aria-label="Ensiklopediyaya qayıt">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
          <p className="truncate text-xs text-muted-foreground">
            {isEdit ? "Bitkini redaktə et" : "Ensiklopediyaya yeni bitki əlavə et"}
          </p>
        </div>
        {dirty && (
          <Badge variant="outline" className="hidden border-amber-200 bg-amber-50 text-amber-700 sm:inline-flex">
            Yadda saxlanmayıb
          </Badge>
        )}
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin/plants">Ləğv et</Link>
        </Button>
        <Button size="sm" onClick={submit} disabled={save.isPending || (isEdit && !dirty)}>
          {save.isPending && <Loader2 className="animate-spin" />}
          {isEdit ? "Yadda saxla" : "Yarat"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="min-w-0">
          <CardHeader className="space-y-4 pb-4">
            <Tabs value={lang} onValueChange={setLang}>
              <TabsList className="grid w-full grid-cols-4">
                {CONTENT_LANGUAGES.map(({ code, label }) => {
                  const filled = !!state.translations[code].name.trim()
                  const hasError = Object.keys(visibleErrors).some((k) => k.startsWith(`${code}.`))
                  return (
                    <TabsTrigger
                      key={code}
                      value={code}
                      className="gap-1.5"
                      title={label}
                      aria-label={`${label}${hasError ? ", xəta var" : filled ? ", doldurulub" : ", boşdur"}`}
                    >
                      <span className="uppercase">{code}</span>
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          hasError ? "bg-destructive" : filled ? "bg-primary" : "bg-muted-foreground/30"
                        )}
                      />
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </Tabs>
            <CardDescription>
              {CONTENT_LANGUAGES.find((l) => l.code === lang)?.label} dilində məzmun. Adı boş qalan dil saytda göstərilmir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={section} onValueChange={setSection}>
              <div className="-mx-1 overflow-x-auto px-1 pb-1">
                <TabsList className="w-max">
                  {PLANT_SECTIONS.map((s) => {
                    const filled = s.fields.filter((f) => current[f.key]?.trim()).length
                    const hasError = Object.keys(visibleErrors).some(
                      (k) =>
                        k.startsWith(`${lang}.`) &&
                        (s.fields.some((f) => k === `${lang}.${f.key}`) ||
                          (s.list === "references" && k.startsWith(`${lang}.ref.`)) ||
                          (s.list === "usageForms" && k.startsWith(`${lang}.uf.`)))
                    )
                    return (
                      <TabsTrigger key={s.id} value={s.id} className="gap-1.5">
                        {s.label}
                        <span className={cn("text-[10px] tabular-nums", hasError ? "text-destructive" : "text-muted-foreground")}>
                          {filled}/{s.fields.length}
                        </span>
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
              </div>

              {PLANT_SECTIONS.map((s) => (
                <TabsContent key={s.id} value={s.id} className="mt-6 space-y-5">
                  <div className={cn("grid gap-5", s.id === "origin" && "sm:grid-cols-2")}>
                    {s.fields.map((field) => (
                      <FieldControl
                        key={`${lang}-${field.key}`}
                        field={field}
                        id={`plant-${lang}-${field.key}`}
                        value={current[field.key]}
                        onChange={(value) => setField(field.key, value)}
                        error={visibleErrors[`${lang}.${field.key}`]}
                      />
                    ))}
                  </div>
                  {s.list === "usageForms" && (
                    <ListEditor
                      title="İstifadə formaları"
                      description="məs. Dəmləmə — 1 çay qaşığı 200 ml suya"
                      items={current.usageForms}
                      onChange={(usageForms) => setField("usageForms", usageForms)}
                      errors={visibleErrors}
                      errorPrefix={`${lang}.uf`}
                      columns={[
                        { key: "name", placeholder: "Forma adı" },
                        { key: "description", placeholder: "İzah" },
                      ]}
                      addLabel="Forma əlavə et"
                      emptyText="Hələ istifadə forması əlavə edilməyib"
                    />
                  )}
                  {s.list === "references" && (
                    <ListEditor
                      title="Mənbələr"
                      description="Elmi məqalə və ya etibarlı mənbə linkləri"
                      items={current.references}
                      onChange={(references) => setField("references", references)}
                      errors={visibleErrors}
                      errorPrefix={`${lang}.ref`}
                      columns={[
                        { key: "link", placeholder: "https://…" },
                        { key: "description", placeholder: "Qısa izah (istəyə bağlı)" },
                      ]}
                      addLabel="Mənbə əlavə et"
                      emptyText="Hələ mənbə əlavə edilməyib"
                    />
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Ümumi</CardTitle>
              <CardDescription>Bütün dillər üçün eynidir</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="plant-scientific">Elmi (latın) ad</Label>
                <Input
                  id="plant-scientific"
                  value={state.scientificName}
                  onChange={(e) => setState((prev) => ({ ...prev, scientificName: e.target.value }))}
                  placeholder="məs. Crocus sativus"
                  className={cn("italic", visibleErrors.scientificName && "border-destructive")}
                />
                {visibleErrors.scientificName && <p className="text-xs text-destructive">{visibleErrors.scientificName}</p>}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="plant-slug">Slug (URL)</Label>
                  {!isEdit && state.slugTouched && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setState((prev) => ({ ...prev, slugTouched: false }))}
                    >
                      <Wand2 />
                      Addan yarat
                    </Button>
                  )}
                </div>
                <Input
                  id="plant-slug"
                  value={effectiveState.slug}
                  onChange={(e) => setState((prev) => ({ ...prev, slug: e.target.value.toLowerCase(), slugTouched: true }))}
                  placeholder="avtomatik yaranacaq"
                  className={cn("font-mono text-sm", visibleErrors.slug && "border-destructive focus-visible:ring-destructive")}
                />
                {visibleErrors.slug && <p className="text-xs text-destructive">{visibleErrors.slug}</p>}
              </div>
              {isEdit && (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to={`/herb/${id}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink />
                    Saytda bax
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-6 pt-6">
              <ImageUploadField
                label="Əsas şəkil"
                currentUrl={plant.data?.image || null}
                value={state.image}
                onChange={(image) => setState((prev) => ({ ...prev, image }))}
              />
              <GalleryField
                existingUrls={plant.data?.gallery || []}
                value={state.gallery}
                onChange={(gallery) => setState((prev) => ({ ...prev, gallery }))}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={blocker.state === "blocked"}
        onOpenChange={(open) => !open && blocker.state === "blocked" && blocker.reset()}
        title="Dəyişikliklər yadda saxlanmayıb"
        description="Səhifədən çıxsanız, etdiyiniz dəyişikliklər itəcək."
        confirmLabel="Çıx"
        cancelLabel="Redaktəyə qayıt"
        destructive
        onConfirm={() => blocker.state === "blocked" && blocker.proceed()}
      />
    </>
  )
}
