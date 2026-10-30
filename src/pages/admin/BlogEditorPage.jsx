import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useBlocker, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import DOMPurify from "dompurify"
import { ArrowLeft, ChevronDown, Eye, ExternalLink, Loader2, PlayCircle, Plus, Search, Trash2, Wand2, X } from "lucide-react"

import { ConfirmDialog } from "@/components/admin/ConfirmDialog"
import { GalleryField } from "@/components/admin/GalleryField"
import { NoAccess } from "@/components/admin/NoAccess"
import { Badge } from "@/components/admin/ui/badge"
import { Button } from "@/components/admin/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/admin/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/admin/ui/dialog"
import { Input } from "@/components/admin/ui/input"
import { Label } from "@/components/admin/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/admin/ui/select"
import { Skeleton } from "@/components/admin/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/admin/ui/tabs"
import { Textarea } from "@/components/admin/ui/textarea"
import { useAdminRole } from "@/hooks/use-admin-role"
import { apiErrorMessage, CONTENT_LANGUAGES, isValidSlug, slugify } from "@/lib/admin"
import { BLOG_CATEGORIES, blogPath } from "@/lib/blog"
import { cn, toYouTubeEmbedUrl } from "@/lib/utils"
import { uploadBlogContentImage, useAdminBlog, useSaveBlog } from "./queries"

// Redaktor yalnız bu səhifə açılanda yüklənir (public saytın bundle-ı böyüməsin)
const RichTextEditor = lazy(() => import("@/components/admin/RichTextEditor"))

const TITLE_MAX = 200
const SUMMARY_MAX = 500
const SEO_TITLE_MAX = 120
const SEO_TITLE_IDEAL = 60
const SEO_DESC_MAX = 300
const SEO_DESC_IDEAL = 160
const AUTHOR_MAX = 100
const TAGS_MAX = 15
const TAG_LEN_MAX = 40
const SOURCES_MAX = 30

// Admin paneli Azərbaycan dilindədir — kateqoriya adları da (saytda hər dilə tərcümə olunur)
const CATEGORY_LABELS = {
  phytotherapy: "Fitoterapiya",
  herbs: "Dərman bitkiləri",
  health: "Sağlamlıq",
  nutrition: "Qidalanma",
  research: "Elmi araşdırma",
  news: "Xəbərlər",
}
const NO_CATEGORY = "__none"

// "<p></p>" kimi boş HTML-i də boş say
const isEmptyHtml = (html) => !html || !html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim()
const DOI_RE = /^(doi:\s*)?10\.\d{4,9}\/\S+$/i
const isValidSourceUrl = (url) => {
  const value = url.trim()
  if (DOI_RE.test(value)) return true
  try {
    const parsed = new URL(value)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

function stateFromBlog(blog) {
  const translations = Object.fromEntries(
    CONTENT_LANGUAGES.map(({ code }) => {
      const t = blog?.translations?.find((x) => x.language === code || (code === "en" && x.language === "eng"))
      return [
        code,
        {
          title: t?.title ?? "",
          summary: t?.summary ?? "",
          description: t?.description ?? "",
          seoTitle: t?.seoTitle ?? "",
          seoDescription: t?.seoDescription ?? "",
          tags: t?.tags ?? [],
        },
      ]
    })
  )
  return {
    author: blog?.author ?? "",
    videoUrl: blog?.videoUrl ?? "",
    category: blog?.category ?? "",
    slug: blog?.slug ?? "",
    sources: (blog?.sources ?? []).map((s) => ({ title: s.title ?? "", url: s.url ?? "" })),
    translations,
    gallery: { newFiles: [], removedUrls: [], order: null },
  }
}

const snapshot = (s) =>
  JSON.stringify({
    a: s.author,
    v: s.videoUrl,
    c: s.category,
    sl: s.slug,
    src: s.sources.filter((x) => x.title.trim() || x.url.trim()),
    t: Object.fromEntries(
      Object.entries(s.translations).map(([k, t]) => [
        k,
        [t.title, t.summary, isEmptyHtml(t.description) ? "" : t.description, t.seoTitle, t.seoDescription, t.tags],
      ])
    ),
    g: [s.gallery.newFiles.length, s.gallery.removedUrls, s.gallery.order],
  })

function validate(state) {
  const errors = {}
  let firstLang = null
  const add = (key, message, lang) => {
    errors[key] = message
    if (!firstLang && lang) firstLang = lang
  }
  const codes = CONTENT_LANGUAGES.map(({ code }) => code)
  if (!codes.some((c) => state.translations[c].title.trim())) add("az.title", "Ən azı bir dildə başlıq yazın.", "az")
  for (const code of codes) {
    const t = state.translations[code]
    const hasContent = !isEmptyHtml(t.description) || t.summary.trim() || t.seoTitle.trim() || t.seoDescription.trim() || t.tags.length > 0
    if (!t.title.trim()) {
      // Başlıqsız dil backend-də silinir — yazılmış mətn səssizcə itməsin
      if (hasContent) add(`${code}.title`, "Bu dildə mətn var — başlıq yazın və ya mətni silin.", code)
      continue
    }
    if (t.title.length > TITLE_MAX) add(`${code}.title`, `Başlıq ən çox ${TITLE_MAX} simvol ola bilər.`, code)
    if (t.summary.length > SUMMARY_MAX) add(`${code}.summary`, `Qısa təsvir ən çox ${SUMMARY_MAX} simvol ola bilər.`, code)
    if (t.seoTitle.length > SEO_TITLE_MAX) add(`${code}.seoTitle`, `Ən çox ${SEO_TITLE_MAX} simvol ola bilər.`, code)
    if (t.seoDescription.length > SEO_DESC_MAX) add(`${code}.seoDescription`, `Ən çox ${SEO_DESC_MAX} simvol ola bilər.`, code)
  }
  if (state.author.length > AUTHOR_MAX) add("author", `Müəllif adı ən çox ${AUTHOR_MAX} simvol ola bilər.`)
  if (state.videoUrl.trim() && !toYouTubeEmbedUrl(state.videoUrl.trim()))
    add("videoUrl", "Yalnız YouTube linki (youtube.com/watch?v=… və ya youtu.be/…).")
  if (state.slug && !isValidSlug(state.slug))
    add("slug", "Yalnız kiçik latın hərfləri, rəqəmlər və defis (-), ən çox 80 simvol.")
  const sources = state.sources.filter((s) => s.title.trim() || s.url.trim())
  if (sources.length > SOURCES_MAX) add("sources", `Ən çox ${SOURCES_MAX} mənbə ola bilər.`)
  state.sources.forEach((s, i) => {
    if (!s.title.trim() && !s.url.trim()) return
    if (!s.url.trim()) add(`source.${i}`, "Link və ya DOI yazın.")
    else if (!isValidSourceUrl(s.url)) add(`source.${i}`, "https://… link və ya DOI (10.xxxx/…) yazın.")
  })
  return { errors, firstLang, hasErrors: Object.keys(errors).length > 0 }
}

// Etiket sahəsi: Enter və ya vergül əlavə edir, Backspace sonuncunu silir
function TagsInput({ value, onChange }) {
  const [draft, setDraft] = useState("")
  const [error, setError] = useState(null)

  const addTag = (raw) => {
    const tag = raw.trim().replace(/^#+/, "").trim()
    if (!tag) return
    if (tag.length > TAG_LEN_MAX) return setError(`Etiket ən çox ${TAG_LEN_MAX} simvol ola bilər.`)
    if (value.length >= TAGS_MAX) return setError(`Ən çox ${TAGS_MAX} etiket.`)
    if (value.some((t) => t.toLocaleLowerCase("az") === tag.toLocaleLowerCase("az"))) return setDraft("")
    onChange([...value, tag])
    setDraft("")
    setError(null)
  }

  return (
    <div className="space-y-1.5">
      <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border bg-background px-2 py-1.5 focus-within:ring-1 focus-within:ring-ring">
        {value.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            #{tag}
            <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} aria-label={`${tag} etiketini sil`} className="rounded-full hover:text-destructive">
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          id="blog-tags"
          value={draft}
          onChange={(e) => {
            const v = e.target.value
            if (v.includes(",")) v.split(",").forEach(addTag)
            else setDraft(v)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              addTag(draft)
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1))
            }
          }}
          onBlur={() => addTag(draft)}
          placeholder={value.length ? "" : "Etiket əlavə edin"}
          className="min-w-[120px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : <p className="text-xs text-muted-foreground">Enter və ya vergül ilə əlavə edin</p>}
    </div>
  )
}

function Counter({ value, max, ideal }) {
  const over = value > max
  const long = ideal && value > ideal
  return <span className={cn("text-xs tabular-nums text-muted-foreground", long && "text-amber-600", over && "text-destructive")}>{value}/{ideal ?? max}</span>
}

// Hər yazı (və "yeni") üçün redaktor sıfırdan mount olunur
export default function BlogEditorPage() {
  const { id } = useParams()
  return <BlogEditor key={id ?? "new"} id={id} />
}

function BlogEditor({ id }) {
  const isEdit = !!id
  const navigate = useNavigate()
  const { canEditContent } = useAdminRole()
  const blog = useAdminBlog(id, { enabled: isEdit && canEditContent, refetchOnWindowFocus: false })
  const save = useSaveBlog()

  const [state, setState] = useState(() => stateFromBlog(null))
  const [baseline, setBaseline] = useState(() => snapshot(stateFromBlog(null)))
  const [lang, setLang] = useState("az")
  const [editorVersion, setEditorVersion] = useState(0) // serverdən təzə data gələndə redaktoru yenidən yarat
  const [showErrors, setShowErrors] = useState(false)
  const [seoOpen, setSeoOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [slugTouched, setSlugTouched] = useState(false)
  const [pendingAction, setPendingAction] = useState(null) // "draft" | "publish"
  const allowNavigationRef = useRef(false)

  const loadedVersionRef = useRef(null)
  useEffect(() => {
    if (!isEdit || !blog.data || loadedVersionRef.current === blog.dataUpdatedAt) return
    loadedVersionRef.current = blog.dataUpdatedAt
    const next = stateFromBlog(blog.data)
    setState(next)
    setBaseline(snapshot(next))
    setSlugTouched(!!blog.data.slug)
    setEditorVersion((v) => v + 1)
  }, [isEdit, blog.data, blog.dataUpdatedAt])

  const isPublished = isEdit ? blog.data?.isPublished !== false : false
  const dirty = snapshot(state) !== baseline

  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) => dirty && !allowNavigationRef.current && currentLocation.pathname !== nextLocation.pathname,
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

  const { errors, firstLang, hasErrors } = useMemo(() => validate(state), [state])
  const coverUrl = useCoverPreview(state.gallery, blog.data?.images)
  const visibleErrors = showErrors ? errors : {}
  const embedUrl = toYouTubeEmbedUrl(state.videoUrl.trim())
  const videoId = embedUrl?.split("/embed/")[1]?.split("?")[0]

  const setTranslation = (patch) =>
    setState((prev) => ({ ...prev, translations: { ...prev.translations, [lang]: { ...prev.translations[lang], ...patch } } }))

  // URL ünvanı əl ilə dəyişilməyibsə az başlığından avtomatik yaranır
  const setTitle = (title) => {
    setState((prev) => {
      const next = { ...prev, translations: { ...prev.translations, [lang]: { ...prev.translations[lang], title } } }
      if (!slugTouched && lang === "az") next.slug = slugify(title)
      return next
    })
  }

  const setSource = (index, patch) =>
    setState((prev) => ({ ...prev, sources: prev.sources.map((s, i) => (i === index ? { ...s, ...patch } : s)) }))

  const submit = (publish) => {
    setShowErrors(true)
    if (hasErrors) {
      if (firstLang) setLang(firstLang)
      if (Object.keys(errors).some((k) => k.endsWith("seoTitle") || k.endsWith("seoDescription") || k === "slug")) setSeoOpen(true)
      toast.error("Formda düzəldilməli sahələr var")
      return
    }

    const translations = CONTENT_LANGUAGES.map(({ code }) => {
      const t = state.translations[code]
      return {
        language: code,
        title: t.title.trim(),
        summary: t.summary.trim(),
        description: isEmptyHtml(t.description) ? "" : t.description,
        seoTitle: t.seoTitle.trim(),
        seoDescription: t.seoDescription.trim(),
        tags: t.tags,
      }
    })
    const sources = state.sources
      .filter((s) => s.title.trim() || s.url.trim())
      .map((s) => ({ title: s.title.trim(), url: s.url.trim() }))

    const form = new FormData()
    // Yaradarkən yalnız başlıqlı dillər; redaktədə hamısı (başlığı boş dil silinir)
    form.append("translationJson", JSON.stringify(isEdit ? translations : translations.filter((t) => t.title)))
    form.append("isPublished", String(publish))
    form.append("sourcesJson", JSON.stringify(sources))
    if (!isEdit) {
      if (state.author.trim()) form.append("author", state.author.trim())
      if (state.videoUrl.trim()) form.append("videoUrl", state.videoUrl.trim())
      if (state.category) form.append("category", state.category)
      if (state.slug) form.append("slug", state.slug)
      state.gallery.newFiles.forEach((file) => form.append("GalleryFiles", file))
    } else {
      // boş = təmizlə
      form.append("author", state.author.trim())
      form.append("videoUrl", state.videoUrl.trim())
      form.append("category", state.category)
      form.append("slug", state.slug)
      state.gallery.newFiles.forEach((file) => form.append("NewGalleryFiles", file))
      state.gallery.removedUrls.forEach((url) => form.append("DeleteGalleryUrls", url))
      state.gallery.order?.forEach((url) => form.append("ImagesOrder", url))
    }

    setPendingAction(publish ? "publish" : "draft")
    save.mutate(
      { id, form },
      {
        onSuccess: (created) => {
          setShowErrors(false)
          const message = publish ? (isEdit && isPublished ? "Dəyişikliklər yayımlandı" : "Məqalə yayımlandı") : "Qaralama yadda saxlanıldı"
          toast.success(message)
          if (!isEdit) {
            allowNavigationRef.current = true
            navigate(`/admin/blogs/${created.id}`, { replace: true })
          } else {
            setBaseline(snapshot(state))
            loadedVersionRef.current = null
          }
        },
        onError: (error) => {
          if (error?.code === "SLUG_TAKEN" || error?.code === "INVALID_SLUG") setSeoOpen(true)
          toast.error(apiErrorMessage(error))
        },
        onSettled: () => setPendingAction(null),
      }
    )
  }

  if (!canEditContent) return <NoAccess description="Blogları dəyişmək icazəniz yoxdur." />

  if (isEdit && blog.isLoading) {
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

  if (isEdit && blog.isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="font-medium">{blog.error?.status === 404 ? "Yazı tapılmadı" : "Yazı yüklənmədi"}</p>
          <p className="text-sm text-muted-foreground">{apiErrorMessage(blog.error)}</p>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/blogs">Bloglara qayıt</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const current = state.translations[lang]
  const langLabel = CONTENT_LANGUAGES.find((l) => l.code === lang)?.label
  const pageTitle = isEdit ? blog.data?.title || "Məqalə" : state.translations.az.title || "Yeni məqalə"
  const busy = save.isPending
  const seoTitlePreview = current.seoTitle.trim() || current.title.trim() || "Məqalənin başlığı"
  const seoDescPreview = current.seoDescription.trim() || current.summary.trim() || "Qısa təsvir və ya meta təsvir burada görünəcək."

  return (
    <>
      <div className="sticky top-14 z-10 -mx-4 mb-6 flex flex-wrap items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
        <Button variant="ghost" size="icon" className="size-8" asChild>
          <Link to="/admin/blogs" aria-label="Bloglara qayıt">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-lg font-semibold tracking-tight">{pageTitle}</h1>
            {isPublished ? (
              <Badge className="shrink-0 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">Yayımda</Badge>
            ) : (
              <Badge variant="outline" className="shrink-0 border-neutral-200 bg-neutral-100 text-neutral-600">Qaralama</Badge>
            )}
            {dirty && (
              <Badge variant="outline" className="hidden shrink-0 border-amber-200 bg-amber-50 text-amber-700 sm:inline-flex">Yadda saxlanmayıb</Badge>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">Shafransa / Bloq idarəetməsi</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
          <Eye />
          Ön baxış
        </Button>
        <Button variant="outline" size="sm" onClick={() => submit(false)} disabled={busy}>
          {pendingAction === "draft" && <Loader2 className="animate-spin" />}
          {isPublished ? "Qaralamaya keçir" : "Qaralama saxla"}
        </Button>
        <Button size="sm" onClick={() => submit(true)} disabled={busy || (isEdit && isPublished && !dirty)}>
          {pendingAction === "publish" && <Loader2 className="animate-spin" />}
          {isEdit && isPublished ? "Yenilə" : "Yayımla"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <Card className="min-w-0">
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
                        <span className={cn("size-1.5 rounded-full", hasError ? "bg-destructive" : filled ? "bg-primary" : "bg-muted-foreground/30")} />
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
              </Tabs>
              <CardDescription>{langLabel} dilində mətn. Başlığı boş qalan dil saytda göstərilmir.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`blog-${lang}-title`}>
                    Başlıq <span className="text-destructive">*</span>
                  </Label>
                  <Counter value={current.title.length} max={TITLE_MAX} />
                </div>
                <Input
                  id={`blog-${lang}-title`}
                  value={current.title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Məqalənin başlığını daxil edin…"
                  aria-invalid={!!visibleErrors[`${lang}.title`]}
                  className={cn("text-base", visibleErrors[`${lang}.title`] && "border-destructive focus-visible:ring-destructive")}
                />
                {visibleErrors[`${lang}.title`] && <p className="text-xs text-destructive">{visibleErrors[`${lang}.title`]}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`blog-${lang}-summary`}>Qısa təsvir</Label>
                  <Counter value={current.summary.length} max={SUMMARY_MAX} />
                </div>
                <Textarea
                  id={`blog-${lang}-summary`}
                  rows={2}
                  value={current.summary}
                  onChange={(e) => setTranslation({ summary: e.target.value })}
                  placeholder="Bloq səhifəsində görünəcək qısa xülasə…"
                  aria-invalid={!!visibleErrors[`${lang}.summary`]}
                  className={cn(visibleErrors[`${lang}.summary`] && "border-destructive focus-visible:ring-destructive")}
                />
                {visibleErrors[`${lang}.summary`] && <p className="text-xs text-destructive">{visibleErrors[`${lang}.summary`]}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`blog-${lang}-content`}>Məqalənin mətni</Label>
                <Suspense fallback={<Skeleton className="h-[330px] w-full" />}>
                  <RichTextEditor
                    key={`${lang}-${editorVersion}`}
                    id={`blog-${lang}-content`}
                    value={current.description}
                    onChange={(description) => setTranslation({ description })}
                    placeholder="Məqalənizi burada yazın…"
                    onImageUpload={uploadBlogContentImage}
                    onImageError={(message) => toast.error(message)}
                  />
                </Suspense>
                <p className="text-xs text-muted-foreground">H2 — bölmə başlığı, H3 — alt başlıq. Şəkil düyməsi ilə mətnin istənilən yerinə şəkil əlavə edə bilərsiniz.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="blog-tags">Etiketlər ({lang.toUpperCase()})</Label>
                <TagsInput key={lang} value={current.tags} onChange={(tags) => setTranslation({ tags })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid gap-5 pt-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="blog-category">Kateqoriya (bütün dillər üçün)</Label>
                <Select value={state.category || NO_CATEGORY} onValueChange={(v) => setState((prev) => ({ ...prev, category: v === NO_CATEGORY ? "" : v }))}>
                  <SelectTrigger id="blog-category">
                    <SelectValue placeholder="Kateqoriya seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_CATEGORY}>Kateqoriya seçin</SelectItem>
                    {BLOG_CATEGORIES.map((key) => (
                      <SelectItem key={key} value={key}>
                        {CATEGORY_LABELS[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="self-end text-xs text-muted-foreground sm:pb-2">Kateqoriyanın adı saytda hər dildə avtomatik tərcümə olunur. Etiketlər isə hər dil üçün ayrıca yazılır — yuxarıdakı dil tablarında.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Elmi mənbələr</CardTitle>
              <CardDescription>Məqalənin sonunda göstərilir. DOI yazsanız (10.xxxx/…) avtomatik linkə çevrilir.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {state.sources.map((source, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-start gap-2">
                    <span className="mt-2 w-5 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{index + 1}.</span>
                    <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                      <Input value={source.title} onChange={(e) => setSource(index, { title: e.target.value })} placeholder="Mənbənin adı (məs. müəllif, il, jurnal)" aria-label={`Mənbə ${index + 1} adı`} />
                      <Input
                        value={source.url}
                        onChange={(e) => setSource(index, { url: e.target.value })}
                        placeholder="https://… və ya 10.1000/xyz"
                        aria-label={`Mənbə ${index + 1} linki`}
                        aria-invalid={!!visibleErrors[`source.${index}`]}
                        className={cn(visibleErrors[`source.${index}`] && "border-destructive focus-visible:ring-destructive")}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => setState((prev) => ({ ...prev, sources: prev.sources.filter((_, i) => i !== index) }))}
                      aria-label={`Mənbə ${index + 1}-i sil`}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                  {visibleErrors[`source.${index}`] && <p className="pl-7 text-xs text-destructive">{visibleErrors[`source.${index}`]}</p>}
                </div>
              ))}
              {visibleErrors.sources && <p className="text-xs text-destructive">{visibleErrors.sources}</p>}
              <button
                type="button"
                onClick={() => setState((prev) => ({ ...prev, sources: [...prev.sources, { title: "", url: "" }] }))}
                disabled={state.sources.length >= SOURCES_MAX}
                className="flex w-full items-center gap-2 rounded-md border border-dashed px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
              >
                <Plus className="size-4 text-primary" />
                Mənbə və ya DOI linki əlavə et
              </button>
            </CardContent>
          </Card>

          <Card>
            <button type="button" onClick={() => setSeoOpen((o) => !o)} className="flex w-full items-center gap-3 p-6 text-left" aria-expanded={seoOpen}>
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold">SEO parametrləri</span>
                <span className="block text-sm text-muted-foreground">Google başlığı, meta təsvir və URL ünvanı</span>
              </span>
              <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", seoOpen && "rotate-180")} />
            </button>
            {seoOpen && (
              <CardContent className="space-y-5 border-t pt-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`blog-${lang}-seoTitle`}>Google başlığı ({lang.toUpperCase()})</Label>
                    <Counter value={current.seoTitle.length} max={SEO_TITLE_MAX} ideal={SEO_TITLE_IDEAL} />
                  </div>
                  <Input
                    id={`blog-${lang}-seoTitle`}
                    value={current.seoTitle}
                    onChange={(e) => setTranslation({ seoTitle: e.target.value })}
                    placeholder={current.title || "Boş qalsa məqalənin başlığı işlədilir"}
                    className={cn(visibleErrors[`${lang}.seoTitle`] && "border-destructive")}
                  />
                  {visibleErrors[`${lang}.seoTitle`] && <p className="text-xs text-destructive">{visibleErrors[`${lang}.seoTitle`]}</p>}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`blog-${lang}-seoDesc`}>Meta təsvir ({lang.toUpperCase()})</Label>
                    <Counter value={current.seoDescription.length} max={SEO_DESC_MAX} ideal={SEO_DESC_IDEAL} />
                  </div>
                  <Textarea
                    id={`blog-${lang}-seoDesc`}
                    rows={2}
                    value={current.seoDescription}
                    onChange={(e) => setTranslation({ seoDescription: e.target.value })}
                    placeholder={current.summary || "Boş qalsa qısa təsvir işlədilir"}
                    className={cn(visibleErrors[`${lang}.seoDescription`] && "border-destructive")}
                  />
                  {visibleErrors[`${lang}.seoDescription`] && <p className="text-xs text-destructive">{visibleErrors[`${lang}.seoDescription`]}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blog-slug">URL ünvanı (bütün dillər üçün)</Label>
                  <div className="flex gap-2">
                    <div className={cn("flex min-w-0 flex-1 items-center rounded-md border bg-background focus-within:ring-1 focus-within:ring-ring", visibleErrors.slug && "border-destructive")}>
                      <span className="shrink-0 pl-3 text-sm text-muted-foreground">shafransa.com/blog/</span>
                      <input
                        id="blog-slug"
                        value={state.slug}
                        onChange={(e) => {
                          setSlugTouched(true)
                          setState((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))
                        }}
                        placeholder="meqalenin-adi"
                        className="h-9 min-w-0 flex-1 bg-transparent pr-3 text-sm outline-none"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9"
                      onClick={() => {
                        setSlugTouched(true)
                        setState((prev) => ({ ...prev, slug: slugify(prev.translations.az.title || prev.translations[lang].title) }))
                      }}
                      title="Azərbaycan dilindəki başlıqdan yarat"
                    >
                      <Wand2 />
                      Başlıqdan
                    </Button>
                  </div>
                  {visibleErrors.slug ? (
                    <p className="text-xs text-destructive">{visibleErrors.slug}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Boş qalsa link yazının id-si ilə olur.</p>
                  )}
                </div>
                <div className="rounded-md border bg-muted/20 p-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Google-da belə görünəcək</p>
                  <p className="truncate text-xs text-emerald-800">shafransa.com › blog › {state.slug || "…"}</p>
                  <p className="truncate text-lg leading-snug text-[#1a0dab]">{seoTitlePreview} | Shafransa</p>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{seoDescPreview}</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Məlumat</CardTitle>
              <CardDescription>Bütün dillər üçün eynidir</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="blog-author">Müəllif</Label>
                <Input
                  id="blog-author"
                  value={state.author}
                  onChange={(e) => setState((prev) => ({ ...prev, author: e.target.value }))}
                  placeholder="məs. Shafransa redaksiyası"
                  className={cn(visibleErrors.author && "border-destructive")}
                />
                {visibleErrors.author && <p className="text-xs text-destructive">{visibleErrors.author}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="blog-video">YouTube video (istəyə bağlı)</Label>
                <Input
                  id="blog-video"
                  value={state.videoUrl}
                  onChange={(e) => setState((prev) => ({ ...prev, videoUrl: e.target.value }))}
                  placeholder="https://youtu.be/…"
                  aria-invalid={!!visibleErrors.videoUrl}
                  className={cn(visibleErrors.videoUrl && "border-destructive focus-visible:ring-destructive")}
                />
                {visibleErrors.videoUrl ? (
                  <p className="text-xs text-destructive">{visibleErrors.videoUrl}</p>
                ) : (
                  state.videoUrl.trim() &&
                  !videoId && <p className="text-xs text-amber-600">Bu link YouTube videosu kimi tanınmadı.</p>
                )}
                {videoId && (
                  <a
                    href={`https://www.youtube.com/watch?v=${videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative block overflow-hidden rounded-md border"
                  >
                    <img src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} alt="Video önizləmə" className="aspect-video w-full object-cover" />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
                      <PlayCircle className="size-10 text-white drop-shadow" />
                    </span>
                  </a>
                )}
              </div>
              {isEdit && isPublished && (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to={blogPath(blog.data)} target="_blank" rel="noopener noreferrer">
                    <ExternalLink />
                    Saytda bax
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Şəkillər</CardTitle>
              <CardDescription>İlk şəkil saytda örtük kimi göstərilir</CardDescription>
            </CardHeader>
            <CardContent>
              <GalleryField
                coverMode
                existingUrls={blog.data?.images || []}
                value={state.gallery}
                onChange={(gallery) => setState((prev) => ({ ...prev, gallery }))}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Ön baxış ({lang.toUpperCase()})</DialogTitle>
            <DialogDescription>Saytda belə görünəcək. Yadda saxlanmamış dəyişikliklər də göstərilir.</DialogDescription>
          </DialogHeader>
          <article className="space-y-5 py-2">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {state.category && <Badge className="border-primary/20 bg-primary/10 text-primary hover:bg-primary/10">{CATEGORY_LABELS[state.category]}</Badge>}
              {state.author.trim() && <span>{state.author.trim()}</span>}
            </div>
            <h2 className="text-3xl font-bold leading-tight tracking-tight">{current.title || "Başlıqsız"}</h2>
            {current.summary.trim() && <p className="text-lg leading-relaxed text-muted-foreground">{current.summary}</p>}
            {coverUrl && <img src={coverUrl} alt="" className="aspect-[21/9] w-full rounded-xl object-cover" />}
            <div className="rich-content" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(current.description || "", { USE_PROFILES: { html: true } }) }} />
            {current.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 border-t pt-4">
                {current.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">#{tag}</span>
                ))}
              </div>
            )}
            {state.sources.some((s) => s.url.trim()) && (
              <div className="border-t pt-4">
                <h3 className="mb-2 font-semibold">Elmi mənbələr</h3>
                <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                  {state.sources.filter((s) => s.url.trim()).map((s, i) => (
                    <li key={i}>{s.title.trim() || s.url.trim()}</li>
                  ))}
                </ol>
              </div>
            )}
          </article>
        </DialogContent>
      </Dialog>

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

// Ön baxış üçün örtük şəkli: yeni seçilmiş fayl (object URL) və ya mövcud ilk şəkil
function useCoverPreview(gallery, existingUrls) {
  const firstNew = gallery.newFiles[0]
  const [objectUrl, setObjectUrl] = useState(null)
  useEffect(() => {
    if (!firstNew) {
      setObjectUrl(null)
      return undefined
    }
    const url = URL.createObjectURL(firstNew)
    setObjectUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [firstNew])
  const existing = (gallery.order || existingUrls || []).filter((u) => !gallery.removedUrls.includes(u))
  return existing[0] || objectUrl
}
