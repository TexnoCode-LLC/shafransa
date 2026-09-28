import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import {
  Ban,
  CalendarDays,
  CalendarX2,
  ExternalLink,
  Loader2,
  MapPin,
  MoreHorizontal,
  RefreshCw,
  Search,
  Star,
  UserRound,
  Video,
  X,
} from "lucide-react"

import { PageHeader } from "@/components/admin/PageHeader"
import { TablePagination } from "@/components/admin/TablePagination"
import { Badge } from "@/components/admin/ui/badge"
import { Button } from "@/components/admin/ui/button"
import { Card } from "@/components/admin/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/admin/ui/dropdown-menu"
import { Input } from "@/components/admin/ui/input"
import { Label } from "@/components/admin/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/admin/ui/select"
import { Separator } from "@/components/admin/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/admin/ui/sheet"
import { Skeleton } from "@/components/admin/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/admin/ui/tabs"
import { Textarea } from "@/components/admin/ui/textarea"
import { useUrlFilters } from "@/hooks/use-url-filters"
import { apiErrorMessage, therapistName } from "@/lib/admin"
import { formatDate, formatDateTime, formatHourMinute, formatPrice, formatRelativeFuture } from "@/lib/format"
import { cn, safeExternalUrl } from "@/lib/utils"
import { useAdminCancelSession, useAdminSessions, useAdminTherapists } from "./queries"

const STATUS_TABS = [
  { value: "all", label: "Hamısı" },
  { value: "pending", label: "Gözləyən" },
  { value: "confirmed", label: "Təsdiqlənmiş" },
  { value: "completed", label: "Tamamlanmış" },
  { value: "cancelled", label: "Ləğv edilmiş" },
  { value: "expired", label: "Vaxtı keçmiş" },
]
const PAGE_SIZES = [10, 20, 50]

const STATUS_STYLE = {
  pending: ["Gözləyir", "border-amber-200 bg-amber-50 text-amber-700", "bg-amber-500"],
  confirmed: ["Təsdiqlənib", "border-sky-200 bg-sky-50 text-sky-700", "bg-sky-500"],
  completed: ["Tamamlanıb", "border-emerald-200 bg-emerald-50 text-emerald-700", "bg-emerald-500"],
  cancelled: ["Ləğv edilib", "border-red-200 bg-red-50 text-red-700", "bg-red-500"],
  expired: ["Vaxtı keçib", "border-border bg-muted text-muted-foreground", "bg-muted-foreground/60"],
}

// Backend statusu (0 Pending, 1 TherapistConfirmed, 2 Confirmed, 3 Completed, 4 Cancelled) → görünən status.
// Terapevt cavab verməmiş və vaxtı keçmiş seans "Vaxtı keçib" sayılır.
function sessionStatus(session) {
  if (session.status === 3) return "completed"
  if (session.status === 4) return "cancelled"
  if (session.status === 2) return "confirmed"
  return new Date(session.sessionStartTime) < new Date() ? "expired" : "pending"
}

const canCancel = (session) => ["pending", "confirmed", "expired"].includes(sessionStatus(session))

function StatusBadge({ status }) {
  const [label, className, dot] = STATUS_STYLE[status]
  return (
    <Badge variant="outline" className={cn("gap-1.5 whitespace-nowrap font-medium", className)}>
      <span className={cn("size-1.5 rounded-full", dot)} />
      {label}
    </Badge>
  )
}

function TypeBadge({ online }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      {online ? <Video className="size-4 text-primary" /> : <MapPin className="size-4" />}
      {online ? "Onlayn" : "Əyani"}
    </span>
  )
}

const QUICK_REASONS = [
  "Terapevt seansı keçirə bilmir.",
  "Pasiyentin müraciəti əsasında ləğv edildi.",
  "Texniki problem səbəbindən ləğv edildi.",
]

function CancelDialog({ session, open, onOpenChange, pending, onConfirm }) {
  const [reason, setReason] = useState("")
  const [touched, setTouched] = useState(false)
  useEffect(() => {
    if (open) {
      setReason("")
      setTouched(false)
    }
  }, [open])
  const trimmed = reason.trim()
  const error = trimmed.length < 5 ? "Səbəbi yazın (ən azı 5 simvol)." : trimmed.length > 1000 ? "Ən çox 1000 simvol." : null

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            setTouched(true)
            if (!error) onConfirm(trimmed)
          }}
        >
          <DialogHeader>
            <DialogTitle>Seans ləğv edilsin?</DialogTitle>
            <DialogDescription>
              {session ? `${formatDateTime(session.sessionStartTime)} · ${therapistName(session.therapist)} — ${session.user?.fullName ?? "pasiyent"}` : ""}.
              Səbəb hər iki tərəfə emaillə göndəriləcək.
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
                <Label htmlFor="cancel-reason">Səbəb</Label>
                <span className="text-xs tabular-nums text-muted-foreground">{reason.length}/1000</span>
              </div>
              <Textarea
                id="cancel-reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                aria-invalid={touched && !!error}
                className={cn(touched && error && "border-destructive focus-visible:ring-destructive")}
                autoFocus
              />
              {touched && error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Ləğv etmə
            </Button>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Seansı ləğv et
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Görünən ad input-un içində: iki eyni "gg.aa.iiii" sahəsi qarışdırılmasın
function DateFilter({ label, ariaLabel, value, min, max, onChange }) {
  return (
    <div className="relative xl:w-[200px]">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{label}</span>
      <Input
        type="date"
        value={value}
        min={min || undefined}
        max={max || undefined}
        onChange={(e) => onChange(e.target.value)}
        className={cn("h-9", label.length > 4 ? "pl-[4.75rem]" : "pl-11")}
        aria-label={ariaLabel}
      />
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right font-medium">{children}</span>
    </div>
  )
}

function SessionDetailSheet({ session, open, onOpenChange, onCancel }) {
  const status = session ? sessionStatus(session) : null
  const meeting = safeExternalUrl(session?.meetingLink)
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b p-6 text-left">
          <SheetTitle>{session ? formatDateTime(session.sessionStartTime) : ""}</SheetTitle>
          <SheetDescription>
            {session ? `${session.durationInMinutes} dəqiqəlik ${session.isOnline ? "onlayn" : "əyani"} seans · ${formatRelativeFuture(session.sessionStartTime)}` : ""}
          </SheetDescription>
          {status && <StatusBadge status={status} />}
        </SheetHeader>
        {session && (
          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            <section>
              <h3 className="mb-1 text-sm font-semibold">Terapevt</h3>
              <Row label="Ad">{therapistName(session.therapist)}</Row>
              <Row label="Email">
                <a className="hover:text-primary" href={`mailto:${session.therapist?.email}`}>{session.therapist?.email}</a>
              </Row>
              <Row label="Telefon">{session.therapist?.phoneNumber || "—"}</Row>
            </section>
            <Separator />
            <section>
              <h3 className="mb-1 text-sm font-semibold">Pasiyent</h3>
              <Row label="Ad">{session.user?.fullName || "Hesab silinib"}</Row>
              <Row label="Email">
                {session.user?.email ? (
                  <a className="hover:text-primary" href={`mailto:${session.user.email}`}>{session.user.email}</a>
                ) : (
                  "—"
                )}
              </Row>
            </section>
            <Separator />
            <section>
              <h3 className="mb-1 text-sm font-semibold">Seans</h3>
              <Row label="Başlama">{formatDateTime(session.sessionStartTime)}</Row>
              <Row label="Bitmə">{formatHourMinute(session.sessionEndTime)}</Row>
              <Row label="Qiymət">{session.price ? formatPrice(session.price) : "—"}</Row>
              <Row label="Rezerv edilib">{formatDate(session.createdAt)}</Row>
              <Row label="Terapevt təsdiqi">{session.therapistConfirmedAt ? formatDateTime(session.therapistConfirmedAt) : "—"}</Row>
              {session.isOnline && (
                <Row label="Video link">
                  {meeting ? (
                    <a href={meeting} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                      Jitsi <ExternalLink className="size-3.5" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground">Təsdiqdən sonra yaranır</span>
                  )}
                </Row>
              )}
            </section>
            {session.notes && (
              <>
                <Separator />
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold">Pasiyentin qeydi</h3>
                  <p className="whitespace-pre-line text-sm text-muted-foreground">{session.notes}</p>
                </section>
              </>
            )}
            {session.rating && (
              <>
                <Separator />
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold">Rəy</h3>
                  <p className="inline-flex items-center gap-1 text-sm font-medium">
                    <Star className="size-4 fill-amber-400 text-amber-400" />
                    {session.rating} / 5
                  </p>
                  {session.review && <p className="text-sm text-muted-foreground">“{session.review}”</p>}
                </section>
              </>
            )}
          </div>
        )}
        {session && canCancel(session) && (
          <SheetFooter className="border-t p-4">
            <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => onCancel(session)}>
              <Ban />
              Seansı ləğv et
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default function SessionsPage() {
  const { params, update, clear } = useUrlFilters()
  const status = STATUS_TABS.some((t) => t.value === params.get("status")) ? params.get("status") : "all"
  const therapistId = params.get("therapist") || "all"
  const from = params.get("from") || ""
  const to = params.get("to") || ""
  const page = Math.max(1, Number(params.get("page")) || 1)
  const pageSize = PAGE_SIZES.includes(Number(params.get("size"))) ? Number(params.get("size")) : 10
  const q = params.get("q") || ""
  const [search, setSearch] = useState(q)

  const sessions = useAdminSessions({
    status,
    therapistId: therapistId === "all" ? undefined : therapistId,
    from: from || undefined,
    to: to || undefined,
    search: q || undefined,
    page,
    pageSize,
  })
  const therapists = useAdminTherapists()
  const cancel = useAdminCancelSession()

  useEffect(() => {
    const handle = setTimeout(() => {
      if (q !== search.trim()) update({ q: search.trim() })
    }, 300)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const [detail, setDetail] = useState(null)
  const [cancelling, setCancelling] = useState(null)
  const lastCancellingRef = useRef(null)
  if (cancelling) lastCancellingRef.current = cancelling

  const items = sessions.data?.items || []
  const total = sessions.data?.total || 0
  const counts = sessions.data?.counts
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const hasFilters = !!q || therapistId !== "all" || !!from || !!to || status !== "all"
  const dateError = from && to && from > to ? "Başlanğıc tarixi sondan sonra ola bilməz" : null

  useEffect(() => {
    if (!sessions.isPlaceholderData && total > 0 && page > pageCount) update({ page: pageCount }, { resetPage: false })
  }, [sessions.isPlaceholderData, total, page, pageCount, update])

  const therapistOptions = useMemo(
    () => (therapists.data || []).filter((t) => t.isVerified).sort((a, b) => therapistName(a).localeCompare(therapistName(b), "az")),
    [therapists.data]
  )

  const confirmCancel = (reason) => {
    const session = cancelling
    cancel.mutate(
      { id: session.id, reason },
      {
        onSuccess: () => {
          toast.success("Seans ləğv edildi, tərəflərə email göndərildi")
          setCancelling(null)
          setDetail(null)
        },
        onError: (error) => {
          setCancelling(null)
          toast.error(apiErrorMessage(error))
        },
      }
    )
  }

  const clearFilters = () => {
    setSearch("")
    clear()
  }

  return (
    <>
      <PageHeader
        title="Seanslar"
        description="Bütün terapiya seansları: rezervlər, təsdiqlər, tamamlanan və ləğv edilənlər."
        actions={
          <Button variant="outline" size="sm" onClick={() => sessions.refetch()} disabled={sessions.isFetching}>
            <RefreshCw className={cn(sessions.isFetching && "animate-spin")} />
            Yenilə
          </Button>
        }
      />

      {/* 6 tab dar ekrana sığmır — xl-dən aşağı eyni seçim Select ilə */}
      <Tabs value={status} onValueChange={(value) => update({ status: value })} className="mb-4 hidden xl:block">
        <TabsList>
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
              {tab.label}
              <span className="rounded-full bg-muted-foreground/10 px-1.5 text-xs tabular-nums text-muted-foreground">
                {counts ? counts[tab.value] : "…"}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Select value={status} onValueChange={(value) => update({ status: value })}>
        <SelectTrigger className="mb-4 h-9 w-full sm:w-64 xl:hidden" aria-label="Status filtri">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_TABS.map((tab) => (
            <SelectItem key={tab.value} value={tab.value}>
              {tab.label}
              {counts ? ` (${counts[tab.value]})` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Card className="overflow-hidden">
        <div className="grid gap-2 border-b p-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_220px_auto_auto_auto]">
          <div className="relative sm:col-span-2 xl:col-span-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pasiyent və ya terapevt (ad, email)"
              className="h-9 pl-8 pr-8"
              aria-label="Seans axtar"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Axtarışı təmizlə"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <Select value={therapistId} onValueChange={(value) => update({ therapist: value })}>
            <SelectTrigger className="h-9 sm:col-span-2 xl:col-span-1" aria-label="Terapevt filtri">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Bütün terapevtlər</SelectItem>
              {therapistOptions.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {therapistName(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DateFilter label="Başlanğıc" ariaLabel="Başlanğıc tarixi" value={from} max={to} onChange={(value) => update({ from: value })} />
          <DateFilter label="Son" ariaLabel="Son tarix" value={to} min={from} onChange={(value) => update({ to: value })} />
          {hasFilters && (
            <Button variant="ghost" size="sm" className="h-9 justify-self-start" onClick={clearFilters}>
              <X />
              Təmizlə
            </Button>
          )}
          {dateError && <p className="text-xs text-destructive sm:col-span-2 xl:col-span-5">{dateError}</p>}
        </div>

        <div className={cn("transition-opacity", sessions.isPlaceholderData && "opacity-60")}>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Vaxt</TableHead>
                <TableHead className="hidden xl:table-cell">Terapevt</TableHead>
                <TableHead>
                  Pasiyent<span className="xl:hidden"> · Terapevt</span>
                </TableHead>
                <TableHead className="hidden lg:table-cell">Növ</TableHead>
                <TableHead className="hidden xl:table-cell">Qiymət</TableHead>
                <TableHead className="hidden lg:table-cell">Status</TableHead>
                <TableHead className="w-12 pr-4">
                  <span className="sr-only">Əməliyyatlar</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-4" colSpan={7}>
                      <Skeleton className="h-9 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : sessions.isError ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="py-16 text-center">
                    <p className="text-sm font-medium">Seanslar yüklənmədi</p>
                    <p className="mt-1 text-sm text-muted-foreground">{apiErrorMessage(sessions.error)}</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => sessions.refetch()}>
                      Yenidən cəhd et
                    </Button>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="py-16 text-center">
                    <CalendarX2 className="mx-auto size-8 text-muted-foreground" />
                    <p className="mt-3 text-sm font-medium">{hasFilters ? "Filtrlərə uyğun seans tapılmadı" : "Hələ seans yoxdur"}</p>
                    {hasFilters && (
                      <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
                        Filtrləri təmizlə
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((session) => {
                  const st = sessionStatus(session)
                  return (
                    <TableRow
                      key={session.id}
                      className="cursor-pointer"
                      onClick={(e) => {
                        if (!e.target.closest("button, a, [role=menuitem]")) setDetail(session)
                      }}
                    >
                      <TableCell className="pl-4">
                        <p className="whitespace-nowrap font-medium">{formatDateTime(session.sessionStartTime)}</p>
                        <p className="text-xs text-muted-foreground">{formatRelativeFuture(session.sessionStartTime)}</p>
                      </TableCell>
                      <TableCell className="hidden max-w-[200px] truncate xl:table-cell">{therapistName(session.therapist)}</TableCell>
                      <TableCell>
                        <p className="max-w-[140px] truncate sm:max-w-[200px]">{session.user?.fullName || "Hesab silinib"}</p>
                        <p className="max-w-[140px] truncate text-xs text-muted-foreground sm:max-w-[200px] xl:hidden">
                          {therapistName(session.therapist)}
                        </p>
                        <div className="mt-1 lg:hidden">
                          <StatusBadge status={st} />
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <TypeBadge online={session.isOnline} />
                      </TableCell>
                      <TableCell className="hidden tabular-nums xl:table-cell">{session.price ? formatPrice(session.price) : "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={st} />
                          {session.rating && (
                            <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground" title="Pasiyentin reytinqi">
                              <Star className="size-3.5 fill-amber-400 text-amber-400" />
                              {session.rating}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8" aria-label="Seans üçün əməliyyatlar">
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onSelect={() => setDetail(session)}>
                              <UserRound />
                              Ətraflı
                            </DropdownMenuItem>
                            {canCancel(session) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => setCancelling(session)} className="text-destructive focus:text-destructive">
                                  <Ban />
                                  Ləğv et
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {!sessions.isLoading && !sessions.isError && (
          <TablePagination
            page={Math.min(page, pageCount)}
            pageSize={pageSize}
            total={total}
            onPageChange={(next) => update({ page: next > 1 ? next : null }, { resetPage: false })}
            onPageSizeChange={(size) => update({ size: size === 10 ? null : size })}
          />
        )}
      </Card>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <CalendarDays className="size-3.5" />
        Bütün vaxtlar Bakı vaxtı ilə göstərilir.
      </p>

      <SessionDetailSheet
        session={detail}
        open={!!detail}
        onOpenChange={(open) => !open && setDetail(null)}
        onCancel={(session) => setCancelling(session)}
      />

      <CancelDialog
        session={lastCancellingRef.current}
        open={!!cancelling}
        onOpenChange={(open) => !open && setCancelling(null)}
        pending={cancel.isPending}
        onConfirm={confirmCancel}
      />
    </>
  )
}
