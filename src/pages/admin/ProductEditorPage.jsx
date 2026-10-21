import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useBlocker, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { ArrowLeft, Check, ChevronsUpDown, ExternalLink, Loader2, X } from "lucide-react"

import { ConfirmDialog } from "@/components/admin/ConfirmDialog"
import { GalleryField } from "@/components/admin/GalleryField"
import { ImageUploadField } from "@/components/admin/ImageUploadField"
import { Badge } from "@/components/admin/ui/badge"
import { Button } from "@/components/admin/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/admin/ui/card"
import { Input } from "@/components/admin/ui/input"
import { Label } from "@/components/admin/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/admin/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/admin/ui/select"
import { Skeleton } from "@/components/admin/ui/skeleton"
import { Switch } from "@/components/admin/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/admin/ui/tabs"
import { Textarea } from "@/components/admin/ui/textarea"
import { apiErrorMessage, CONTENT_LANGUAGES } from "@/lib/admin"
import { cn } from "@/lib/utils"
import { useAdminCategories, useAdminPlant, useAdminPlants, useAdminProduct, useSaveProduct } from "./queries"

// Hər dil üçün mətn sahələri (backend limitləri ilə eyni)
const TEXT_FIELDS = [
  { key: "title", label: "Ad", required: true, maxLength: 200, placeholder: "məs. Zəfəran çayı" },
  { key: "description", label: "Təsvir", type: "textarea", rows: 6, maxLength: 10000, placeholder: "Məhsul haqqında ətraflı məlumat" },
  { key: "form", label: "Forma", maxLength: 200, placeholder: "məs. Çay, kapsul, yağ", half: true },
  { key: "region", label: "Mənşə regionu", maxLength: 200, placeholder: "məs. Xorasan, İran", half: true },
  { key: "activeCompounds", label: "Aktiv birləşmələr", type: "textarea", rows: 3, maxLength: 1000, placeholder: "məs. Krosin, safranal, pikrokrosin" },
  {
    key: "qualityTracking",
    label: "Keyfiyyət izlənməsi",
    type: "textarea",
    rows: 3,
    maxLength: 1000,
    hint: "Sertifikatlar, laboratoriya, istehsal zənciri",
  },
]
const TEXT_KEYS = TEXT_FIELDS.map((f) => f.key)
const MAX_AMOUNT = 1_000_000

const emptyTranslation = () => Object.fromEntries(TEXT_KEYS.map((k) => [k, ""]))
const numberToInput = (value) => (value === null || value === undefined ? "" : String(value))

function stateFromProduct(product) {
  const translations = Object.fromEntries(
    CONTENT_LANGUAGES.map(({ code }) => {
      const t = product?.translations?.find((x) => x.language === code || (code === "en" && x.language === "eng"))
      return [code, t ? Object.fromEntries(TEXT_KEYS.map((k) => [k, t[k] ?? ""])) : emptyTranslation()]
    })
  )
  return {
    translations,
    price: numberToInput(product?.price),
    originalPrice: numberToInput(product?.originalPrice),
    stock: product ? numberToInput(product.stock) : "",
    categoryId: product?.category?.id ?? "",
    plantId: product?.plantId ?? "",
    scientificName: product?.scientificName ?? "",
    batchNumber: product?.batchNumber ?? "",
    activeCompoundPercent: numberToInput(product?.activeCompoundPercent),
    heavyMetalTest: !!product?.heavyMetalTest,
    pesticideTest: !!product?.pesticideTest,
    verified: !!product?.verified,
    featured: !!product?.featured,
    image: { file: null, removed: false },
    gallery: { newFiles: [], removedUrls: [] },
  }
}

// Dəyişiklik yoxlaması üçün (fayl obyektləri yox, sayları müqayisə olunur)
const snapshot = (s) =>
  JSON.stringify({
    ...s,
    image: [!!s.image.file, s.image.removed],
    gallery: [s.gallery.newFiles.length, s.gallery.removedUrls],
  })

const parseAmount = (value) => (value.trim() === "" ? null : Number(value))
const hasContent = (t) => TEXT_KEYS.some((k) => k !== "title" && t[k]?.trim())

// Bütün xətalar: { "az.title": "…", price: "…" } + ilk xətalı dil
function validate(state, { isEdit, hadImage }) {
  const errors = {}
  let firstLang = null
  const add = (key, message, lang = null) => {
    errors[key] = message
    if (lang && !firstLang) firstLang = lang
  }

  const langs = CONTENT_LANGUAGES.map(({ code }) => code)
  if (!langs.some((l) => state.translations[l].title.trim())) add("az.title", "Ən azı bir dildə məhsulun adını yazın.", "az")
  for (const lang of langs) {
    const t = state.translations[lang]
    if (!t.title.trim()) {
      // Adsız dil backend-də silinir — yazılmış məzmun səssizcə itməsin
      if (hasContent(t)) add(`${lang}.title`, "Bu dildə məzmun var — ad yazın və ya məzmunu silin.", lang)
      continue
    }
    for (const field of TEXT_FIELDS) {
      if (t[field.key].length > field.maxLength) add(`${lang}.${field.key}`, `Ən çox ${field.maxLength} simvol ola bilər.`, lang)
    }
  }

  const price = parseAmount(state.price)
  if (price === null) add("price", "Qiyməti yazın.")
  else if (Number.isNaN(price) || price <= 0 || price > MAX_AMOUNT) add("price", "Qiymət 0-dan böyük olmalıdır.")

  const originalPrice = parseAmount(state.originalPrice)
  if (originalPrice !== null) {
    if (Number.isNaN(originalPrice) || originalPrice > MAX_AMOUNT) add("originalPrice", "Düzgün məbləğ yazın.")
    else if (price !== null && !Number.isNaN(price) && originalPrice <= price)
      add("originalPrice", "Köhnə qiymət yeni qiymətdən böyük olmalıdır.")
  }

  const stock = parseAmount(state.stock)
  if (stock === null) add("stock", "Stok sayını yazın.")
  else if (!Number.isInteger(stock) || stock < 0 || stock > MAX_AMOUNT) add("stock", "Stok 0 və ya daha böyük tam ədəd olmalıdır.")

  const percent = parseAmount(state.activeCompoundPercent)
  if (percent !== null && (Number.isNaN(percent) || percent < 0 || percent > 100))
    add("activeCompoundPercent", "0 ilə 100 arasında faiz yazın.")
  if (state.scientificName.trim().length > 150) add("scientificName", "Ən çox 150 simvol ola bilər.")
  if (state.batchNumber.trim().length > 100) add("batchNumber", "Ən çox 100 simvol ola bilər.")

  // Məhsul kartı şəkilsiz boş görünür — yeni məhsulda və mövcud şəkli silərkən şəkil tələb olunur
  const noImage = !state.image.file && (!isEdit || (hadImage && state.image.removed))
  if (noImage) add("image", "Əsas şəkil əlavə edin — məhsul kartında göstərilir.")

  return { errors, firstLang }
}

function FieldError({ message, hint }) {
  if (message) return <p className="text-xs text-destructive">{message}</p>
  return hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null
}

function TextField({ field, id, value, onChange, error }) {
  const Control = field.type === "textarea" ? Textarea : Input
  const over = value.length > field.maxLength
  return (
    <div className={cn("space-y-2", !field.half && "sm:col-span-2")}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>
          {field.label}
          {field.required && <span className="text-destructive"> *</span>}
        </Label>
        {(field.type === "textarea" || over) && (
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
      <FieldError message={error} hint={field.hint} />
    </div>
  )
}

function NumberField({ id, label, value, onChange, error, hint, required, step = "0.01", suffix, ...props }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          inputMode={step === "1" ? "numeric" : "decimal"}
          min="0"
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onWheel={(e) => e.currentTarget.blur()} // siçan təkəri rəqəmi təsadüfən dəyişməsin
          aria-invalid={!!error}
          className={cn("tabular-nums", suffix && "pr-8", error && "border-destructive focus-visible:ring-destructive")}
          {...props}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      <FieldError message={error} hint={hint} />
    </div>
  )
}

function SwitchRow({ id, label, description, checked, onCheckedChange }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5">
        <Label htmlFor={id} className="cursor-pointer">
          {label}
        </Label>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

// Siyahıda göstərilən ad: az → en → ilk mövcud
function plantDisplayName(plant) {
  const t = plant.translations || []
  return (t.find((x) => x.language === "az") || t.find((x) => x.language === "en" || x.language === "eng") || t[0])?.name || plant.slug
}

// Ensiklopediyada yüzlərlə bitki ola bilər — adi Select əvəzinə serverdə axtarışlı seçim
function PlantPicker({ id, value, onChange }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [query, setQuery] = useState("")
  useEffect(() => {
    const handle = setTimeout(() => setQuery(search.trim()), 250)
    return () => clearTimeout(handle)
  }, [search])

  const list = useAdminPlants({ search: query || undefined, page: 1, pageSize: 20 }, { enabled: open })
  const selected = useAdminPlant(value || undefined, { enabled: !!value, staleTime: 5 * 60_000 })
  const items = list.data?.items || []
  const selectedLabel = value ? selected.data?.name || (selected.isLoading ? "Yüklənir…" : "Bitki tapılmadı") : null

  const choose = (plant) => {
    onChange(plant)
    setOpen(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setSearch("")
      }}
    >
      <PopoverTrigger asChild>
        <Button id={id} type="button" variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between px-3 font-normal">
          <span className={cn("truncate", !value && "text-muted-foreground")}>{selectedLabel ?? "Bitki seçilməyib"}</span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[260px] p-0" align="start">
        <div className="border-b p-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Bitki axtar…"
            className="h-8"
            aria-label="Bitki axtar"
            autoFocus
          />
        </div>
        <div role="listbox" aria-label="Bitkilər" className="max-h-64 overflow-y-auto p-1">
          {value && (
            <button
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => choose(null)}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
            >
              <X className="size-4" />
              Əlaqəni sil
            </button>
          )}
          {list.isLoading ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">Yüklənir…</p>
          ) : list.isError ? (
            <p className="px-2 py-6 text-center text-sm text-destructive">{apiErrorMessage(list.error)}</p>
          ) : items.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              {query ? "Bitki tapılmadı" : "Ensiklopediyada hələ bitki yoxdur"}
            </p>
          ) : (
            items.map((plant) => (
              <button
                key={plant.id}
                type="button"
                role="option"
                aria-selected={plant.id === value}
                onClick={() => choose(plant)}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
              >
                <Check className={cn("size-4 shrink-0 text-primary", plant.id === value ? "opacity-100" : "opacity-0")} />
                <span className="min-w-0 flex-1 truncate">{plantDisplayName(plant)}</span>
                {plant.scientificName && (
                  <span className="max-w-[45%] truncate text-xs italic text-muted-foreground">{plant.scientificName}</span>
                )}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function buildTranslations(state, isEdit) {
  return CONTENT_LANGUAGES.map(({ code }) => ({
    language: code,
    ...Object.fromEntries(TEXT_KEYS.map((k) => [k, state.translations[code][k].trim()])),
  })).filter((t) => isEdit || t.title) // redaktədə adı boş dil göndərilir ki, backend onu silsin
}

function buildForm(state, { isEdit }) {
  const form = new FormData()
  const append = (key, value) => form.append(key, String(value))
  form.append("translationJson", JSON.stringify(buildTranslations(state, isEdit)))
  append("price", Number(state.price))
  append("stock", Number(state.stock))
  append("heavyMetalTest", state.heavyMetalTest)
  append("pesticideTest", state.pesticideTest)
  append("verified", state.verified)
  append("featured", state.featured)

  const originalPrice = parseAmount(state.originalPrice)
  const percent = parseAmount(state.activeCompoundPercent)
  if (!isEdit) {
    if (originalPrice !== null) append("originalPrice", originalPrice)
    if (percent !== null) append("activeCompoundPercent", percent)
    if (state.categoryId) append("categoryId", state.categoryId)
    if (state.plantId) append("plantId", state.plantId)
    if (state.scientificName.trim()) append("scientificName", state.scientificName.trim())
    if (state.batchNumber.trim()) append("batchNumber", state.batchNumber.trim())
    if (state.image.file) form.append("ImageFile", state.image.file)
    state.gallery.newFiles.forEach((file) => form.append("GalleryFiles", file))
  } else {
    // Redaktədə hər sahə göndərilir: boş sətir = təmizlə, rəqəmlər üçün ayrıca bayraq
    if (originalPrice !== null) append("originalPrice", originalPrice)
    else append("clearOriginalPrice", true)
    if (percent !== null) append("activeCompoundPercent", percent)
    else append("clearActiveCompoundPercent", true)
    append("categoryId", state.categoryId)
    append("plantId", state.plantId)
    append("scientificName", state.scientificName.trim())
    append("batchNumber", state.batchNumber.trim())
    if (state.image.file) form.append("NewImageFile", state.image.file)
    else if (state.image.removed) append("removeImage", true)
    state.gallery.newFiles.forEach((file) => form.append("NewGalleryFiles", file))
    state.gallery.removedUrls.forEach((url) => form.append("DeleteGalleryUrls", url))
  }
  return form
}

// Hər məhsul (və "yeni") üçün redaktor sıfırdan mount olunur: /new → /:id keçidində köhnə vəziyyət qalmasın
export default function ProductEditorPage() {
  const { id } = useParams()
  return <ProductEditor key={id ?? "new"} id={id} />
}

function ProductEditor({ id }) {
  const isEdit = !!id
  const navigate = useNavigate()
  const product = useAdminProduct(id, { refetchOnWindowFocus: false })
  const categories = useAdminCategories()
  const save = useSaveProduct()

  const [state, setState] = useState(() => stateFromProduct(null))
  const [baseline, setBaseline] = useState(() => snapshot(stateFromProduct(null)))
  const [lang, setLang] = useState("az")
  const [showErrors, setShowErrors] = useState(false)
  const allowNavigationRef = useRef(false)

  // Server datası formu yalnız ilk yükləmədə və uğurlu yadda saxlamadan sonra doldurur (yazılanlar itməsin)
  const loadedVersionRef = useRef(null)
  useEffect(() => {
    if (!isEdit || !product.data || loadedVersionRef.current === product.dataUpdatedAt) return
    loadedVersionRef.current = product.dataUpdatedAt
    const next = stateFromProduct(product.data)
    setState(next)
    setBaseline(snapshot(next))
  }, [isEdit, product.data, product.dataUpdatedAt])

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

  const hadImage = !!product.data?.image
  const { errors, firstLang } = useMemo(() => validate(state, { isEdit, hadImage }), [state, isEdit, hadImage])
  const visibleErrors = showErrors ? errors : {}

  const categoryOptions = useMemo(
    () =>
      (categories.data || []).flatMap((c) => [
        { value: c.id, label: c.name, depth: 0 },
        ...(c.children || []).map((child) => ({ value: child.id, label: child.name, parent: c.name, depth: 1 })),
      ]),
    [categories.data]
  )

  const set = (patch) => setState((prev) => ({ ...prev, ...patch }))
  const setText = (key, value) =>
    setState((prev) => ({
      ...prev,
      translations: { ...prev.translations, [lang]: { ...prev.translations[lang], [key]: value } },
    }))

  const submit = () => {
    setShowErrors(true)
    if (Object.keys(errors).length > 0) {
      if (firstLang) setLang(firstLang)
      toast.error("Formda düzəldilməli sahələr var")
      // Dil dəyişəndən sonra ilk xətalı sahəyə fokus
      requestAnimationFrame(() => requestAnimationFrame(() => document.querySelector('main [aria-invalid="true"]')?.focus()))
      return
    }

    save.mutate(
      { id, form: buildForm(state, { isEdit }) },
      {
        onSuccess: (created) => {
          setShowErrors(false)
          if (!isEdit) {
            toast.success("Məhsul yaradıldı")
            allowNavigationRef.current = true
            navigate(`/admin/products/${created.id}`, { replace: true })
          } else {
            toast.success("Dəyişikliklər yadda saxlanıldı")
            // Dərhal "saxlanılıb" say; sonra serverdən gələn təzə data ilə doldur (yeni şəkil URL-ləri)
            setBaseline(snapshot(state))
            loadedVersionRef.current = null
          }
        },
        onError: (error) => toast.error(apiErrorMessage(error)),
      }
    )
  }

  if (isEdit && product.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Skeleton className="h-[520px] w-full" />
          <Skeleton className="h-[520px] w-full" />
        </div>
      </div>
    )
  }

  if (isEdit && product.isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="font-medium">{product.error?.status === 404 ? "Məhsul tapılmadı" : "Məhsul yüklənmədi"}</p>
          <p className="text-sm text-muted-foreground">{apiErrorMessage(product.error)}</p>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/products">Məhsullara qayıt</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const current = state.translations[lang]
  const title = isEdit ? product.data?.title || "Məhsul" : state.translations.az.title || "Yeni məhsul"
  const price = parseAmount(state.price)
  const originalPrice = parseAmount(state.originalPrice)
  const discount =
    price > 0 && originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : null

  return (
    <>
      {/* Sabit əməliyyat paneli (header-in altında) */}
      <div className="sticky top-14 z-10 -mx-4 mb-6 flex flex-wrap items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
        <Button variant="ghost" size="icon" className="size-8" asChild>
          <Link to="/admin/products" aria-label="Məhsullara qayıt">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
          <p className="truncate text-xs text-muted-foreground">{isEdit ? "Məhsulu redaktə et" : "Markete yeni məhsul əlavə et"}</p>
        </div>
        {dirty && (
          <Badge variant="outline" className="hidden border-amber-200 bg-amber-50 text-amber-700 sm:inline-flex">
            Yadda saxlanmayıb
          </Badge>
        )}
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin/products">Ləğv et</Link>
        </Button>
        <Button size="sm" onClick={submit} disabled={save.isPending || (isEdit && !dirty)}>
          {save.isPending && <Loader2 className="animate-spin" />}
          {isEdit ? "Yadda saxla" : "Yarat"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader className="space-y-4 pb-4">
              <Tabs value={lang} onValueChange={setLang}>
                <TabsList className="grid w-full grid-cols-4">
                  {CONTENT_LANGUAGES.map(({ code, label }) => {
                    const filled = !!state.translations[code].title.trim()
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
            <CardContent className="grid gap-5 sm:grid-cols-2">
              {TEXT_FIELDS.map((field) => (
                <TextField
                  key={`${lang}-${field.key}`}
                  field={field}
                  id={`product-${lang}-${field.key}`}
                  value={current[field.key]}
                  onChange={(value) => setText(field.key, value)}
                  error={visibleErrors[`${lang}.${field.key}`]}
                />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Şəkillər</CardTitle>
              <CardDescription>Əsas şəkil kartda və məhsul səhifəsində, qalereya məhsul səhifəsində göstərilir</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <ImageUploadField
                  label="Əsas şəkil *"
                  currentUrl={product.data?.image || null}
                  value={state.image}
                  onChange={(image) => set({ image })}
                />
                <FieldError message={visibleErrors.image} />
              </div>
              <GalleryField
                existingUrls={product.data?.images || []}
                value={state.gallery}
                onChange={(gallery) => set({ gallery })}
              />
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <SwitchRow
                id="product-verified"
                label="Təsdiqlənib"
                description="Keyfiyyəti yoxlanılıb — saytda təsdiq nişanı ilə göstərilir"
                checked={state.verified}
                onCheckedChange={(verified) => set({ verified })}
              />
              <SwitchRow
                id="product-featured"
                label="Önə çıxarılıb"
                description="Ana səhifədə və marketdə öndə göstərilir"
                checked={state.featured}
                onCheckedChange={(featured) => set({ featured })}
              />
              {isEdit && (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to={`/product/${id}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink />
                    Saytda bax
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Qiymət və stok</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <NumberField
                id="product-price"
                label="Qiymət"
                required
                suffix="₼"
                value={state.price}
                onChange={(value) => set({ price: value })}
                error={visibleErrors.price}
              />
              <NumberField
                id="product-original-price"
                label="Köhnə qiymət"
                suffix="₼"
                value={state.originalPrice}
                onChange={(value) => set({ originalPrice: value })}
                error={visibleErrors.originalPrice}
                placeholder="—"
              />
              <p className="col-span-2 -mt-2 text-xs text-muted-foreground">
                {discount ? (
                  <span className="font-medium text-primary">Saytda −{discount}% endirim göstəriləcək</span>
                ) : (
                  "Endirim göstərmək üçün köhnə qiyməti yazın"
                )}
              </p>
              <NumberField
                id="product-stock"
                label="Stok"
                required
                step="1"
                suffix="əd."
                value={state.stock}
                onChange={(value) => set({ stock: value })}
                error={visibleErrors.stock}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Təsnifat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="product-category">Kateqoriya</Label>
                <Select value={state.categoryId || "none"} onValueChange={(value) => set({ categoryId: value === "none" ? "" : value })}>
                  <SelectTrigger id="product-category">
                    <SelectValue placeholder={categories.isLoading ? "Yüklənir…" : "Kateqoriya seçin"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-muted-foreground">Kateqoriyasız</span>
                    </SelectItem>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className={cn(option.depth === 1 && "pl-8")}>
                        {option.depth === 1 ? `${option.parent} › ${option.label}` : option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!categories.isLoading && categoryOptions.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Hələ kateqoriya yoxdur —{" "}
                    <Link to="/admin/categories" className="font-medium text-primary hover:underline">
                      kateqoriya yarat
                    </Link>
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-plant">Ensiklopediyadakı bitki</Label>
                <PlantPicker
                  id="product-plant"
                  value={state.plantId}
                  onChange={(plant) =>
                    setState((prev) => ({
                      ...prev,
                      plantId: plant?.id ?? "",
                      // Elmi ad boşdursa bitkidən götürülür
                      scientificName: plant && !prev.scientificName.trim() ? plant.scientificName || "" : prev.scientificName,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">Məhsul səhifəsində bitki məqaləsinə keçid göstərilir</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-scientific">Elmi (latın) ad</Label>
                <Input
                  id="product-scientific"
                  value={state.scientificName}
                  onChange={(e) => set({ scientificName: e.target.value })}
                  placeholder="məs. Crocus sativus"
                  aria-invalid={!!visibleErrors.scientificName}
                  className={cn("italic", visibleErrors.scientificName && "border-destructive focus-visible:ring-destructive")}
                />
                <FieldError message={visibleErrors.scientificName} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Keyfiyyət və laboratoriya</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product-batch">Partiya nömrəsi</Label>
                  <Input
                    id="product-batch"
                    value={state.batchNumber}
                    onChange={(e) => set({ batchNumber: e.target.value })}
                    placeholder="məs. SF-2026-01"
                    aria-invalid={!!visibleErrors.batchNumber}
                    className={cn(visibleErrors.batchNumber && "border-destructive focus-visible:ring-destructive")}
                  />
                  <FieldError message={visibleErrors.batchNumber} />
                </div>
                <NumberField
                  id="product-percent"
                  label="Aktiv maddə"
                  suffix="%"
                  max="100"
                  value={state.activeCompoundPercent}
                  onChange={(value) => set({ activeCompoundPercent: value })}
                  error={visibleErrors.activeCompoundPercent}
                  placeholder="—"
                />
              </div>
              <SwitchRow
                id="product-heavy-metal"
                label="Ağır metal testi keçib"
                checked={state.heavyMetalTest}
                onCheckedChange={(heavyMetalTest) => set({ heavyMetalTest })}
              />
              <SwitchRow
                id="product-pesticide"
                label="Pestisid testi keçib"
                checked={state.pesticideTest}
                onCheckedChange={(pesticideTest) => set({ pesticideTest })}
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
