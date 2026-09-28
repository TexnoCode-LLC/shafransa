import { useEffect, useState } from "react"
import { Award, FileText, Loader2, Mail, MailWarning, Phone } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/admin/ui/avatar"
import { Badge } from "@/components/admin/ui/badge"
import { Button } from "@/components/admin/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/dialog"
import { Label } from "@/components/admin/ui/label"
import { Separator } from "@/components/admin/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/admin/ui/sheet"
import { Textarea } from "@/components/admin/ui/textarea"
import { getInitials, therapistName } from "@/lib/admin"
import { formatDate, formatPrice } from "@/lib/format"
import { cn, safeExternalUrl } from "@/lib/utils"

export function TherapistAvatar({ therapist, className }) {
  return (
    <Avatar className={cn("size-10", className)}>
      <AvatarImage src={safeExternalUrl(therapist?.user?.avatar) || undefined} alt={therapistName(therapist)} />
      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
        {getInitials(therapistName(therapist))}
      </AvatarFallback>
    </Avatar>
  )
}

// Müraciət/terapevt statusu nişanı: gözləyir / təsdiqlənib / rədd edilib
export function StatusBadge({ status }) {
  const map = {
    pending: ["Gözləyir", "border-amber-200 bg-amber-50 text-amber-700", "bg-amber-500"],
    approved: ["Təsdiqlənib", "border-emerald-200 bg-emerald-50 text-emerald-700", "bg-emerald-500"],
    rejected: ["Rədd edilib", "border-red-200 bg-red-50 text-red-700", "bg-red-500"],
  }
  const [label, className, dot] = map[status] || map.pending
  return (
    <Badge variant="outline" className={cn("gap-1.5 font-medium", className)}>
      <span className={cn("size-1.5 rounded-full", dot)} />
      {label}
    </Badge>
  )
}

// CV və sertifikatlar — yalnız http(s) linklər açılır
export function DocumentLinks({ therapist, compact = false }) {
  const docs = [
    ...(safeExternalUrl(therapist?.cv) ? [{ url: safeExternalUrl(therapist.cv), label: "CV", icon: FileText }] : []),
    ...(therapist?.certificates || [])
      .map((c, i) => ({ url: safeExternalUrl(c.fileUrl), label: c.name || `Sertifikat ${i + 1}`, icon: Award }))
      .filter((d) => d.url),
  ]
  if (docs.length === 0) return <p className="text-xs text-muted-foreground">Sənəd yüklənməyib</p>
  return (
    <div className="flex flex-wrap gap-2">
      {docs.map((doc) => (
        <a
          key={doc.url}
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex max-w-[220px] items-center gap-1.5 rounded-md border bg-muted/40 px-2.5 py-1 text-xs font-medium transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            compact && "px-2 py-0.5"
          )}
        >
          <doc.icon className="size-3.5 shrink-0" />
          <span className="truncate">{doc.label}</span>
        </a>
      ))}
    </div>
  )
}

const QUICK_REASONS = [
  "Sənədlər natamamdır — CV və sertifikatları yükləyin.",
  "Lisenziya nömrəsi təsdiqlənmədi.",
  "Profil məlumatları natamam və ya uyğunsuzdur.",
]

export function RejectDialog({ open, onOpenChange, therapist, pending, onConfirm }) {
  const [reason, setReason] = useState("")
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (open) {
      setReason("")
      setTouched(false)
    }
  }, [open])

  const trimmed = reason.trim()
  const error = trimmed.length < 5 ? "Səbəbi yazın (ən azı 5 simvol)." : trimmed.length > 1000 ? "Səbəb ən çox 1000 simvol ola bilər." : null

  const submit = (event) => {
    event.preventDefault()
    setTouched(true)
    if (!error) onConfirm(trimmed)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} noValidate>
          <DialogHeader>
            <DialogTitle>Müraciət rədd edilsin?</DialogTitle>
            <DialogDescription>
              {therapistName(therapist)} — səbəb terapevtə emaillə göndəriləcək.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-5">
            <div className="flex flex-wrap gap-2">
              {QUICK_REASONS.map((text) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => setReason(text)}
                  className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {text}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="reject-reason">Səbəb</Label>
                <span className="text-xs tabular-nums text-muted-foreground">{reason.length}/1000</span>
              </div>
              <Textarea
                id="reject-reason"
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Terapevt nəyi düzəltməlidir?"
                aria-invalid={touched && !!error}
                className={cn(touched && error && "border-destructive focus-visible:ring-destructive")}
                autoFocus
              />
              {touched && error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Ləğv et
            </Button>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Rədd et
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function InfoRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right font-medium">{children}</span>
    </div>
  )
}

// Terapevt haqqında tam məlumat; müraciət üçün açılıbsa altda təsdiq/rədd düymələri
export function TherapistDetailSheet({ open, onOpenChange, therapist, status, appliedAt, actions }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b p-6 text-left">
          <div className="flex items-center gap-4">
            <TherapistAvatar therapist={therapist} className="size-14" />
            <div className="min-w-0 space-y-1">
              <SheetTitle className="truncate">{therapistName(therapist)}</SheetTitle>
              <SheetDescription className="truncate">{therapist?.specialization || "İxtisas göstərilməyib"}</SheetDescription>
              {status && <StatusBadge status={status} />}
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <section>
            <h3 className="mb-1 text-sm font-semibold">Əlaqə</h3>
            <InfoRow label="Email">
              <a href={`mailto:${therapist?.email}`} className="inline-flex items-center gap-1.5 hover:text-primary">
                <Mail className="size-3.5" />
                {therapist?.email}
              </a>
            </InfoRow>
            <InfoRow label="Telefon">
              {therapist?.phoneNumber ? (
                <a href={`tel:${therapist.phoneNumber}`} className="inline-flex items-center gap-1.5 hover:text-primary">
                  <Phone className="size-3.5" />
                  {therapist.phoneNumber}
                </a>
              ) : (
                "—"
              )}
            </InfoRow>
            <InfoRow label="Email təsdiqi">
              {therapist?.isEmailVerified ? (
                "Təsdiqlənib"
              ) : (
                <span className="inline-flex items-center gap-1.5 text-amber-600">
                  <MailWarning className="size-3.5" />
                  Təsdiqlənməyib
                </span>
              )}
            </InfoRow>
          </section>
          <Separator />
          <section>
            <h3 className="mb-1 text-sm font-semibold">Peşəkar məlumat</h3>
            <InfoRow label="Lisenziya">
              {therapist?.licenseNumber || <span className="text-amber-600">Göstərilməyib</span>}
            </InfoRow>
            <InfoRow label="Onlayn seans">{therapist?.onlinePrice ? formatPrice(therapist.onlinePrice) : "—"}</InfoRow>
            <InfoRow label="Əyani seans">{therapist?.offlinePrice ? formatPrice(therapist.offlinePrice) : "—"}</InfoRow>
            <InfoRow label="Seans müddəti">{therapist?.sessionDurationInMinutes ? `${therapist.sessionDurationInMinutes} dəq` : "—"}</InfoRow>
            <InfoRow label="Reytinq">{therapist?.rating ? `★ ${Number(therapist.rating).toFixed(1)}` : "Hələ yoxdur"}</InfoRow>
            <InfoRow label="Qeydiyyat">{formatDate(appliedAt || therapist?.createdAt)}</InfoRow>
          </section>
          <Separator />
          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Haqqında</h3>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {therapist?.bio?.trim() || "Terapevt özü haqqında məlumat yazmayıb."}
            </p>
          </section>
          <Separator />
          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Sənədlər</h3>
            <DocumentLinks therapist={therapist} />
          </section>
        </div>

        {actions && <SheetFooter className="border-t p-4 sm:justify-end">{actions}</SheetFooter>}
      </SheetContent>
    </Sheet>
  )
}
