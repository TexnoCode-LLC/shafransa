import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useBlocker, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { ArrowLeft, ExternalLink, Loader2, PlayCircle } from "lucide-react"

import { ConfirmDialog } from "@/components/admin/ConfirmDialog"
import { GalleryField } from "@/components/admin/GalleryField"
import { NoAccess } from "@/components/admin/NoAccess"
import { Badge } from "@/components/admin/ui/badge"
import { Button } from "@/components/admin/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/admin/ui/card"
import { Input } from "@/components/admin/ui/input"
import { Label } from "@/components/admin/ui/label"
import { Skeleton } from "@/components/admin/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/admin/ui/tabs"
import { useAdminRole } from "@/hooks/use-admin-role"
import { apiErrorMessage, CONTENT_LANGUAGES } from "@/lib/admin"
import { cn, toYouTubeEmbedUrl } from "@/lib/utils"
import { useAdminBlog, useSaveBlog } from "./queries"

// Redaktor yalnız bu səhifə açılanda yüklənir (public saytın bundle-ı böyüməsin)
const RichTextEditor = lazy(() => import("@/components/admin/RichTextEditor"))

const TITLE_MAX = 200
const AUTHOR_MAX = 100

// "<p></p>" kimi boş HTML-i də boş say
const isEmptyHtml = (html) => !html || !html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim()

function stateFromBlog(blog) {
  const translations = Object.fromEntries(
    CONTENT_LANGUAGES.map(({ code }) => {
      const t = blog?.translations?.find((x) => x.language === code || (code === "en" && x.language === "eng"))
      return [code, { title: t?.title ?? "", description: t?.description ?? "" }]
    })
  )
  return {
    author: blog?.author ?? "",
    videoUrl: blog?.videoUrl ?? "",
    translations,
    gallery: { newFiles: [], removedUrls: [], order: null },
  }
}

const snapshot = (s) =>
  JSON.stringify({
    a: s.author,
    v: s.videoUrl,
    t: Object.fromEntries(Object.entries(s.translations).map(([k, t]) => [k, [t.title, isEmptyHtml(t.description) ? "" : t.description]])),
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
    if (!t.title.trim()) {
      // Başlıqsız dil backend-də silinir — yazılmış mətn səssizcə itməsin
      if (!isEmptyHtml(t.description)) add(`${code}.title`, "Bu dildə mətn var — başlıq yazın və ya mətni silin.", code)
      continue
    }
    if (t.title.length > TITLE_MAX) add(`${code}.title`, `Başlıq ən çox ${TITLE_MAX} simvol ola bilər.`, code)
  }
  if (state.author.length > AUTHOR_MAX) add("author", `Müəllif adı ən çox ${AUTHOR_MAX} simvol ola bilər.`)
  if (state.videoUrl.trim() && !toYouTubeEmbedUrl(state.videoUrl.trim()))
    add("videoUrl", "Yalnız YouTube linki (youtube.com/watch?v=… və ya youtu.be/…).")
  return { errors, firstLang, hasErrors: Object.keys(errors).length > 0 }
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
  const allowNavigationRef = useRef(false)

  const loadedVersionRef = useRef(null)
  useEffect(() => {
    if (!isEdit || !blog.data || loadedVersionRef.current === blog.dataUpdatedAt) return
    loadedVersionRef.current = blog.dataUpdatedAt
    const next = stateFromBlog(blog.data)
    setState(next)
    setBaseline(snapshot(next))
    setEditorVersion((v) => v + 1)
  }, [isEdit, blog.data, blog.dataUpdatedAt])

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
  const visibleErrors = showErrors ? errors : {}
  const embedUrl = toYouTubeEmbedUrl(state.videoUrl.trim())
  const videoId = embedUrl?.split("/embed/")[1]?.split("?")[0]

  const setTranslation = (patch) =>
    setState((prev) => ({ ...prev, translations: { ...prev.translations, [lang]: { ...prev.translations[lang], ...patch } } }))

  const submit = () => {
    setShowErrors(true)
    if (hasErrors) {
      if (firstLang) setLang(firstLang)
      toast.error("Formda düzəldilməli sahələr var")
      return
    }

    const translations = CONTENT_LANGUAGES.map(({ code }) => ({
      language: code,
      title: state.translations[code].title.trim(),
      description: isEmptyHtml(state.translations[code].description) ? "" : state.translations[code].description,
    }))

    const form = new FormData()
    // Yaradarkən yalnız başlıqlı dillər; redaktədə hamısı (başlığı boş dil silinir)
    form.append("translationJson", JSON.stringify(isEdit ? translations : translations.filter((t) => t.title)))
    if (!isEdit) {
      if (state.author.trim()) form.append("author", state.author.trim())
      if (state.videoUrl.trim()) form.append("videoUrl", state.videoUrl.trim())
      state.gallery.newFiles.forEach((file) => form.append("GalleryFiles", file))
    } else {
      form.append("author", state.author.trim()) // boş = təmizlə
      form.append("videoUrl", state.videoUrl.trim())
      state.gallery.newFiles.forEach((file) => form.append("NewGalleryFiles", file))
      state.gallery.removedUrls.forEach((url) => form.append("DeleteGalleryUrls", url))
      state.gallery.order?.forEach((url) => form.append("ImagesOrder", url))
    }

    save.mutate(
      { id, form },
      {
        onSuccess: (created) => {
          setShowErrors(false)
          if (!isEdit) {
            toast.success("Yazı yaradıldı")
            allowNavigationRef.current = true
            navigate(`/admin/blogs/${created.id}`, { replace: true })
          } else {
            toast.success("Dəyişikliklər yadda saxlanıldı")
            setBaseline(snapshot(state))
            loadedVersionRef.current = null
          }
        },
        onError: (error) => toast.error(apiErrorMessage(error)),
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
  const title = isEdit ? blog.data?.title || "Yazı" : state.translations.az.title || "Yeni yazı"

  return (
    <>
      <div className="sticky top-14 z-10 -mx-4 mb-6 flex flex-wrap items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
        <Button variant="ghost" size="icon" className="size-8" asChild>
          <Link to="/admin/blogs" aria-label="Bloglara qayıt">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
          <p className="truncate text-xs text-muted-foreground">{isEdit ? "Yazını redaktə et" : "Yeni blog yazısı"}</p>
        </div>
        {dirty && (
          <Badge variant="outline" className="hidden border-amber-200 bg-amber-50 text-amber-700 sm:inline-flex">
            Yadda saxlanmayıb
          </Badge>
        )}
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin/blogs">Ləğv et</Link>
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
            <CardDescription>
              {CONTENT_LANGUAGES.find((l) => l.code === lang)?.label} dilində mətn. Başlığı boş qalan dil saytda göstərilmir.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={`blog-${lang}-title`}>
                  Başlıq <span className="text-destructive">*</span>
                </Label>
                <span className={cn("text-xs tabular-nums text-muted-foreground", current.title.length > TITLE_MAX && "text-destructive")}>
                  {current.title.length}/{TITLE_MAX}
                </span>
              </div>
              <Input
                id={`blog-${lang}-title`}
                value={current.title}
                onChange={(e) => setTranslation({ title: e.target.value })}
                placeholder="məs. Zəfəranın 7 faydası"
                aria-invalid={!!visibleErrors[`${lang}.title`]}
                className={cn("text-base", visibleErrors[`${lang}.title`] && "border-destructive focus-visible:ring-destructive")}
              />
              {visibleErrors[`${lang}.title`] && <p className="text-xs text-destructive">{visibleErrors[`${lang}.title`]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`blog-${lang}-content`}>Mətn</Label>
              <Suspense fallback={<Skeleton className="h-[330px] w-full" />}>
                <RichTextEditor
                  key={`${lang}-${editorVersion}`}
                  id={`blog-${lang}-content`}
                  value={current.description}
                  onChange={(description) => setTranslation({ description })}
                  placeholder="Yazının mətnini buraya yazın…"
                />
              </Suspense>
            </div>
          </CardContent>
        </Card>

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
              {isEdit && (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to={`/blog/${id}`} target="_blank" rel="noopener noreferrer">
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
