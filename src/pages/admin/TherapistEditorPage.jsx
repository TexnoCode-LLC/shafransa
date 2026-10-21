import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import { Link, useBlocker, useParams } from "react-router-dom"
import { toast } from "sonner"
import { ArrowLeft, Award, Clock, ExternalLink, FileText, Loader2, Plus, RotateCcw, Trash2, Upload, X } from "lucide-react"

import { ConfirmDialog } from "@/components/admin/ConfirmDialog"
import { ImageUploadField } from "@/components/admin/ImageUploadField"
import { Badge } from "@/components/admin/ui/badge"
import { Button } from "@/components/admin/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/admin/ui/card"
import { Input } from "@/components/admin/ui/input"
import { Label } from "@/components/admin/ui/label"
import { Skeleton } from "@/components/admin/ui/skeleton"
import { Textarea } from "@/components/admin/ui/textarea"
import { apiErrorMessage, therapistName } from "@/lib/admin"
import { formatDate } from "@/lib/format"
import { cn, safeExternalUrl } from "@/lib/utils"
import { useAdminTherapist, useSaveTherapist } from "./queries"

// Backend FileValidator ilə eyni: sənədlər PDF və ya şəkil ola bilər
const DOC_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,.gif"
const DOC_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "webp", "gif"]
const MAX_BYTES = 10 * 1024 * 1024
const MAX_CERTIFICATES = 20
const MAX_HOURS = 24
const PHONE_PATTERN = /^\+?[0-9\s\-()]{7,20}$/

const numberToInput = (value) => (value === null || value === undefined ? "" : String(value))

function stateFromTherapist(t) {
  return {
    fullName: t?.user?.fullName ?? "",
    phoneNumber: t?.phoneNumber ?? "",
    licenseNumber: t?.licenseNumber ?? "",
    specialization: t?.specialization ?? "",
    bio: t?.bio ?? "",
    onlinePrice: numberToInput(t?.onlinePrice ?? 0),
    offlinePrice: numberToInput(t?.offlinePrice ?? 0),
    sessionDuration: numberToInput(t?.sessionDurationInMinutes ?? 60),
    workingHours: [...(t?.workingHours || [])].sort(),
    avatar: { file: null, removed: false },
    cv: { file: null, removed: false },
    certificates: { newFiles: [], removedIds: [] },
  }
}

// Dəyişiklik yoxlaması üçün (fayl obyektləri yox, adları müqayisə olunur)
const snapshot = (s) =>
  JSON.stringify({
    ...s,
    avatar: [!!s.avatar.file, s.avatar.removed],
    cv: [s.cv.file?.name ?? null, s.cv.removed],
    certificates: [s.certificates.newFiles.map((f) => f.name), s.certificates.removedIds],
  })

function validateDocument(file) {
  const extension = file.name.split(".").pop()?.toLowerCase()
  if (!DOC_EXTENSIONS.includes(extension)) return "Yalnız PDF, JPG, PNG, WEBP və GIF faylları qəbul olunur."
  if (file.size > MAX_BYTES) return "Fayl çox böyükdür (maksimum 10 MB)."
  return null
}

const toMinutes = (hour) => {
  const [h, m] = hour.split(":").map(Number)
  return h * 60 + m
}

function validate(state, existingCertificates) {
  const errors = {}
  const name = state.fullName.trim()
  if (name.length < 2) errors.fullName = "Ad ən azı 2 simvol olmalıdır."
  else if (name.length > 100) errors.fullName = "Ad ən çox 100 simvol ola bilər."

  const phone = state.phoneNumber.trim()
  if (!phone) errors.phoneNumber = "Telefon nömrəsini yazın."
  else if (!PHONE_PATTERN.test(phone)) errors.phoneNumber = "Düzgün telefon nömrəsi yazın, məs. +994 50 123 45 67"

  if (state.licenseNumber.trim().length > 100) errors.licenseNumber = "Ən çox 100 simvol ola bilər."
  if (state.specialization.trim().length > 200) errors.specialization = "Ən çox 200 simvol ola bilər."
  if (state.bio.length > 4000) errors.bio = "Ən çox 4000 simvol ola bilər."

  for (const key of ["onlinePrice", "offlinePrice"]) {
    const value = state[key].trim()
    const number = Number(value)
    if (value === "" || Number.isNaN(number) || number < 0 || number > 100000) errors[key] = "0 ilə 100 000 arasında məbləğ yazın."
  }
  const duration = Number(state.sessionDuration)
  if (!Number.isInteger(duration) || duration < 15 || duration > 480) errors.sessionDuration = "15 ilə 480 dəqiqə arasında tam ədəd yazın."

  const certificateCount = existingCertificates - state.certificates.removedIds.length + state.certificates.newFiles.length
  if (certificateCount > MAX_CERTIFICATES) errors.certificates = `Ən çox ${MAX_CERTIFICATES} sertifikat ola bilər.`

  return errors
}

// Seans müddətindən qısa aralıqla qoyulmuş saatlar üst-üstə düşür (terapevt eyni anda iki seansda olar)
function overlappingHours(hours, duration) {
  const minutes = Number(duration)
  if (!Number.isInteger(minutes) || minutes <= 0) return []
  const pairs = []
  for (let i = 1; i < hours.length; i++) {
    if (toMinutes(hours[i]) - toMinutes(hours[i - 1]) < minutes) pairs.push([hours[i - 1], hours[i]])
  }
  return pairs
}

function FieldError({ message, hint }) {
  if (message) return <p className="text-xs text-destructive">{message}</p>
  return hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null
}

function Field({ id, label, required, error, hint, counter, children }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-destructive"> *</span>}
        </Label>
        {counter}
      </div>
      {children}
      <FieldError message={error} hint={hint} />
    </div>
  )
}

const invalidClass = (error) => cn(error && "border-destructive focus-visible:ring-destructive")

// Tək sənəd (CV): mövcud fayla keçid, dəyiş / sil / ləğv
function CvField({ currentUrl, value, onChange }) {
  const inputId = useId()
  const inputRef = useRef(null)
  const [error, setError] = useState(null)
  const safeUrl = safeExternalUrl(currentUrl)
  const hasCurrent = !!safeUrl && !value.removed

  const pick = (file) => {
    if (!file) return
    const problem = validateDocument(file)
    setError(problem)
    if (!problem) onChange({ file, removed: false })
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>CV</Label>
      <div className="flex flex-wrap items-center gap-2 rounded-md border p-3">
        <FileText className="size-5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1 text-sm">
          {value.file ? (
            <span className="flex items-center gap-2">
              <span className="truncate">{value.file.name}</span>
              <Badge variant="outline" className="shrink-0 border-primary/30 text-primary">
                yeni
              </Badge>
            </span>
          ) : hasCurrent ? (
            <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
              CV-yə bax <ExternalLink className="size-3.5" />
            </a>
          ) : (
            <span className="text-muted-foreground">{value.removed ? "Yadda saxlayanda silinəcək" : "CV yüklənməyib"}</span>
          )}
        </div>
        <div className="flex gap-1">
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            <Upload />
            {value.file || hasCurrent ? "Dəyiş" : "Yüklə"}
          </Button>
          {value.file ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange({ ...value, file: null })}>
              Ləğv
            </Button>
          ) : hasCurrent ? (
            <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onChange({ file: null, removed: true })}>
              <Trash2 />
              Sil
            </Button>
          ) : (
            value.removed && (
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange({ file: null, removed: false })}>
                <RotateCcw />
                Geri qaytar
              </Button>
            )
          )}
        </div>
      </div>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={DOC_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          pick(e.target.files?.[0])
          e.target.value = ""
        }}
      />
      <FieldError message={error} hint="PDF və ya şəkil · maks. 10 MB" />
    </div>
  )
}

function CertificatesField({ existing, value, onChange, error: limitError }) {
  const inputRef = useRef(null)
  const [error, setError] = useState(null)
  const removed = new Set(value.removedIds)

  const add = (files) => {
    const list = Array.from(files || [])
    const problems = list.map(validateDocument).filter(Boolean)
    setError(problems[0] || null)
    const valid = list.filter((file) => !validateDocument(file))
    if (valid.length) onChange({ ...value, newFiles: [...value.newFiles, ...valid] })
  }
  const toggleRemoved = (id) =>
    onChange({ ...value, removedIds: removed.has(id) ? value.removedIds.filter((x) => x !== id) : [...value.removedIds, id] })

  const total = existing.length - value.removedIds.length + value.newFiles.length
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Sertifikatlar</Label>
        <span className={cn("text-xs tabular-nums text-muted-foreground", total > MAX_CERTIFICATES && "text-destructive")}>
          {total}/{MAX_CERTIFICATES}
        </span>
      </div>
      {existing.length === 0 && value.newFiles.length === 0 ? (
        <p className="rounded-md border border-dashed py-4 text-center text-xs text-muted-foreground">Sertifikat yüklənməyib</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {existing.map((certificate, index) => {
            const isRemoved = removed.has(certificate.id)
            const url = safeExternalUrl(certificate.fileUrl)
            const name = certificate.name || `Sertifikat ${index + 1}`
            return (
              <li key={certificate.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                <Award className="size-4 shrink-0 text-muted-foreground" />
                <div className={cn("min-w-0 flex-1", isRemoved && "text-muted-foreground line-through")}>
                  {url && !isRemoved ? (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="block truncate hover:text-primary hover:underline">
                      {name}
                    </a>
                  ) : (
                    <span className="block truncate">{name}</span>
                  )}
                  <span className="text-xs text-muted-foreground no-underline">{formatDate(certificate.createdAt)}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(!isRemoved && "text-muted-foreground hover:text-destructive")}
                  onClick={() => toggleRemoved(certificate.id)}
                  aria-label={isRemoved ? `${name} geri qaytar` : `${name} sil`}
                >
                  {isRemoved ? <RotateCcw /> : <Trash2 />}
                  <span className="hidden sm:inline">{isRemoved ? "Geri qaytar" : "Sil"}</span>
                </Button>
              </li>
            )
          })}
          {value.newFiles.map((file, index) => (
            <li key={`${file.name}-${index}`} className="flex items-center gap-2 px-3 py-2 text-sm">
              <Award className="size-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              <Badge variant="outline" className="shrink-0 border-primary/30 text-primary">
                yeni
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-destructive"
                onClick={() => onChange({ ...value, newFiles: value.newFiles.filter((_, i) => i !== index) })}
                aria-label={`${file.name} əlavə etmə`}
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={total >= MAX_CERTIFICATES}>
        <Plus />
        Sertifikat əlavə et
      </Button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={DOC_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-label="Sertifikat faylları"
        onChange={(e) => {
          add(e.target.files)
          e.target.value = ""
        }}
      />
      <FieldError message={limitError || error} hint="PDF və ya şəkil · hər biri maks. 10 MB" />
    </div>
  )
}

function WorkingHoursField({ hours, onChange, duration }) {
  const [draft, setDraft] = useState("")
  const [error, setError] = useState(null)
  const overlaps = overlappingHours(hours, duration)

  const add = () => {
    if (!/^\d{2}:\d{2}$/.test(draft)) return setError("Saatı seçin.")
    if (hours.includes(draft)) return setError(`${draft} artıq əlavə edilib.`)
    if (hours.length >= MAX_HOURS) return setError(`Ən çox ${MAX_HOURS} saat ola bilər.`)
    setError(null)
    onChange([...hours, draft].sort())
    setDraft("")
  }

  return (
    <div className="space-y-3">
      {hours.length === 0 ? (
        <p className="rounded-md border border-dashed py-4 text-center text-xs text-muted-foreground">
          İş saatı yoxdur — pasiyentlər rezerv edə bilməz
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2" aria-label="İş saatları">
          {hours.map((hour) => (
            <li key={hour}>
              <Badge variant="secondary" className="gap-1 py-1 pl-2.5 pr-1 text-sm font-medium tabular-nums">
                {hour}
                <button
                  type="button"
                  onClick={() => onChange(hours.filter((h) => h !== hour))}
                  className="rounded-full p-0.5 text-muted-foreground hover:bg-background hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`${hour} saatını sil`}
                >
                  <X className="size-3.5" />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Input
          type="time"
          step={300}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            setError(null)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              add()
            }
          }}
          className="w-32 tabular-nums"
          aria-label="Yeni iş saatı"
        />
        <Button type="button" variant="outline" onClick={add}>
          <Plus />
          Əlavə et
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {overlaps.length > 0 && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {overlaps.map(([a, b]) => `${a} və ${b}`).join(", ")} seansları üst-üstə düşür (seans {duration} dəqiqədir).
        </p>
      )}
    </div>
  )
}

function buildForm(state) {
  const form = new FormData()
  const append = (key, value) => form.append(key, String(value))
  append("fullName", state.fullName.trim())
  append("phoneNumber", state.phoneNumber.trim())
  // Boş sətir = təmizlə
  append("licenseNumber", state.licenseNumber.trim())
  append("specialization", state.specialization.trim())
  append("bio", state.bio.trim())
  append("onlinePrice", Number(state.onlinePrice))
  append("offlinePrice", Number(state.offlinePrice))
  append("sessionDurationInMinutes", Number(state.sessionDuration))
  append("workingHoursJson", JSON.stringify(state.workingHours))
  if (state.avatar.file) form.append("ProfileImageFile", state.avatar.file)
  else if (state.avatar.removed) append("removeProfileImage", true)
  if (state.cv.file) form.append("CvFile", state.cv.file)
  else if (state.cv.removed) append("removeCv", true)
  state.certificates.newFiles.forEach((file) => form.append("CertificateFiles", file))
  state.certificates.removedIds.forEach((id) => form.append("DeleteCertificateIds", id))
  return form
}

// Hər terapevt üçün redaktor sıfırdan mount olunur (başqa terapevtə keçəndə köhnə vəziyyət qalmasın)
export default function TherapistEditorPage() {
  const { id } = useParams()
  return <TherapistEditor key={id} id={id} />
}

function TherapistEditor({ id }) {
  const therapist = useAdminTherapist(id, { refetchOnWindowFocus: false })
  const save = useSaveTherapist()

  const [state, setState] = useState(() => stateFromTherapist(null))
  const [baseline, setBaseline] = useState(() => snapshot(stateFromTherapist(null)))
  const [showErrors, setShowErrors] = useState(false)

  // Server datası formu yalnız ilk yükləmədə və uğurlu yadda saxlamadan sonra doldurur
  const loadedVersionRef = useRef(null)
  useEffect(() => {
    if (!therapist.data || loadedVersionRef.current === therapist.dataUpdatedAt) return
    loadedVersionRef.current = therapist.dataUpdatedAt
    const next = stateFromTherapist(therapist.data)
    setState(next)
    setBaseline(snapshot(next))
  }, [therapist.data, therapist.dataUpdatedAt])

  const dirty = !!therapist.data && snapshot(state) !== baseline

  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname,
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

  const existingCertificates = useMemo(() => therapist.data?.certificates || [], [therapist.data])
  const errors = useMemo(() => validate(state, existingCertificates.length), [state, existingCertificates.length])
  const visibleErrors = showErrors ? errors : {}
  const set = (patch) => setState((prev) => ({ ...prev, ...patch }))

  const submit = () => {
    setShowErrors(true)
    if (Object.keys(errors).length > 0) {
      toast.error("Formda düzəldilməli sahələr var")
      requestAnimationFrame(() => document.querySelector('main [aria-invalid="true"]')?.focus())
      return
    }
    save.mutate(
      { id, form: buildForm(state) },
      {
        onSuccess: () => {
          setShowErrors(false)
          toast.success("Terapevt profili yadda saxlanıldı")
          // Dərhal "saxlanılıb" say; sonra serverdən gələn təzə data (yeni fayl URL-ləri) ilə doldur
          setBaseline(snapshot(state))
          loadedVersionRef.current = null
        },
        onError: (error) => toast.error(apiErrorMessage(error)),
      }
    )
  }

  if (therapist.isLoading) {
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

  if (therapist.isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="font-medium">{therapist.error?.status === 404 ? "Terapevt tapılmadı" : "Terapevt yüklənmədi"}</p>
          <p className="text-sm text-muted-foreground">{apiErrorMessage(therapist.error)}</p>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/therapists?tab=therapists">Terapevtlərə qayıt</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const data = therapist.data
  const isPublic = data.isVerified && data.isShowMenu

  return (
    <>
      <div className="sticky top-14 z-10 -mx-4 mb-6 flex flex-wrap items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
        <Button variant="ghost" size="icon" className="size-8" asChild>
          <Link to="/admin/therapists?tab=therapists" aria-label="Terapevtlərə qayıt">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold tracking-tight">{therapistName(data)}</h1>
          <p className="truncate text-xs text-muted-foreground">Terapevt profilini redaktə et</p>
        </div>
        {dirty && (
          <Badge variant="outline" className="hidden border-amber-200 bg-amber-50 text-amber-700 sm:inline-flex">
            Yadda saxlanmayıb
          </Badge>
        )}
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin/therapists?tab=therapists">Ləğv et</Link>
        </Button>
        <Button size="sm" onClick={submit} disabled={save.isPending || !dirty}>
          {save.isPending && <Loader2 className="animate-spin" />}
          Yadda saxla
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Profil</CardTitle>
              <CardDescription>Saytdakı terapevt səhifəsində göstərilir</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <ImageUploadField
                label="Profil şəkli"
                currentUrl={safeExternalUrl(data.user?.avatar) || null}
                value={state.avatar}
                onChange={(avatar) => set({ avatar })}
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="th-name" label="Ad, soyad" required error={visibleErrors.fullName}>
                  <Input
                    id="th-name"
                    value={state.fullName}
                    onChange={(e) => set({ fullName: e.target.value })}
                    aria-invalid={!!visibleErrors.fullName}
                    className={invalidClass(visibleErrors.fullName)}
                  />
                </Field>
                <Field id="th-specialization" label="İxtisas" error={visibleErrors.specialization}>
                  <Input
                    id="th-specialization"
                    value={state.specialization}
                    onChange={(e) => set({ specialization: e.target.value })}
                    placeholder="məs. Fitoterapevt, idman travmaları"
                    aria-invalid={!!visibleErrors.specialization}
                    className={invalidClass(visibleErrors.specialization)}
                  />
                </Field>
              </div>
              <Field
                id="th-bio"
                label="Haqqında"
                error={visibleErrors.bio}
                counter={
                  <span className={cn("text-xs tabular-nums text-muted-foreground", state.bio.length > 4000 && "text-destructive")}>
                    {state.bio.length}/4000
                  </span>
                }
              >
                <Textarea
                  id="th-bio"
                  rows={6}
                  value={state.bio}
                  onChange={(e) => set({ bio: e.target.value })}
                  placeholder="Təcrübə, təhsil, iş üsulları"
                  aria-invalid={!!visibleErrors.bio}
                  className={invalidClass(visibleErrors.bio)}
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Sənədlər</CardTitle>
              <CardDescription>Yalnız adminlər görür — saytda açıq göstərilmir</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Field id="th-license" label="Lisenziya nömrəsi" error={visibleErrors.licenseNumber}>
                <Input
                  id="th-license"
                  value={state.licenseNumber}
                  onChange={(e) => set({ licenseNumber: e.target.value })}
                  placeholder="məs. LIC-2231"
                  aria-invalid={!!visibleErrors.licenseNumber}
                  className={invalidClass(visibleErrors.licenseNumber)}
                />
              </Field>
              <CvField currentUrl={data.cv} value={state.cv} onChange={(cv) => set({ cv })} />
              <CertificatesField
                existing={existingCertificates}
                value={state.certificates}
                onChange={(certificates) => set({ certificates })}
                error={visibleErrors.certificates}
              />
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Müraciət</span>
                <span className="font-medium">{data.isVerified ? "Təsdiqlənib" : "Təsdiqlənməyib"}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Saytda</span>
                <span className="font-medium">{isPublic ? "Göstərilir" : "Gizlidir"}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Qeydiyyat</span>
                <span className="font-medium">{formatDate(data.createdAt)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Saytda göstərməni terapevtlər siyahısındakı açarla dəyişə bilərsiniz.</p>
              {isPublic && (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to={`/therapist/${id}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink />
                    Saytda bax
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Əlaqə</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <Field id="th-email" label="Email" hint="Giriş emailidir — istifadəçilər bölməsindən dəyişdirilir">
                <Input id="th-email" value={data.email} readOnly disabled />
              </Field>
              <Field id="th-phone" label="Telefon" required error={visibleErrors.phoneNumber}>
                <Input
                  id="th-phone"
                  type="tel"
                  value={state.phoneNumber}
                  onChange={(e) => set({ phoneNumber: e.target.value })}
                  placeholder="+994 50 123 45 67"
                  aria-invalid={!!visibleErrors.phoneNumber}
                  className={invalidClass(visibleErrors.phoneNumber)}
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Seans və qiymət</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {[
                ["onlinePrice", "Onlayn", "₼"],
                ["offlinePrice", "Əyani", "₼"],
              ].map(([key, label, suffix]) => (
                <Field key={key} id={`th-${key}`} label={label} required error={visibleErrors[key]}>
                  <div className="relative">
                    <Input
                      id={`th-${key}`}
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={state[key]}
                      onChange={(e) => set({ [key]: e.target.value })}
                      onWheel={(e) => e.currentTarget.blur()}
                      aria-invalid={!!visibleErrors[key]}
                      className={cn("pr-8 tabular-nums", invalidClass(visibleErrors[key]))}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{suffix}</span>
                  </div>
                </Field>
              ))}
              <div className="col-span-2">
                <Field id="th-duration" label="Seans müddəti" required error={visibleErrors.sessionDuration}>
                  <div className="relative w-1/2 pr-2">
                    <Input
                      id="th-duration"
                      type="number"
                      inputMode="numeric"
                      min="15"
                      max="480"
                      step="5"
                      value={state.sessionDuration}
                      onChange={(e) => set({ sessionDuration: e.target.value })}
                      onWheel={(e) => e.currentTarget.blur()}
                      aria-invalid={!!visibleErrors.sessionDuration}
                      className={cn("pr-12 tabular-nums", invalidClass(visibleErrors.sessionDuration))}
                    />
                    <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">dəq</span>
                  </div>
                </Field>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="size-4 text-muted-foreground" />
                İş saatları
              </CardTitle>
              <CardDescription>Pasiyentlər hər gün bu saatlarda seans rezerv edə bilər (Bakı vaxtı)</CardDescription>
            </CardHeader>
            <CardContent>
              <WorkingHoursField
                hours={state.workingHours}
                duration={state.sessionDuration}
                onChange={(workingHours) => set({ workingHours })}
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
