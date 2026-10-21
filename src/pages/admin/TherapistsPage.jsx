import { useMemo, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Inbox,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Stethoscope,
  Trash2,
  UserRound,
  X,
} from "lucide-react"

import { ConfirmDialog } from "@/components/admin/ConfirmDialog"
import { CreateTherapistDialog } from "./CreateTherapistDialog"
import { PageHeader } from "@/components/admin/PageHeader"
import { Button } from "@/components/admin/ui/button"
import { Card, CardContent } from "@/components/admin/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/admin/ui/dropdown-menu"
import { Input } from "@/components/admin/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/admin/ui/select"
import { Skeleton } from "@/components/admin/ui/skeleton"
import { Switch } from "@/components/admin/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/admin/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/admin/ui/tooltip"
import { useAdminRole } from "@/hooks/use-admin-role"
import { useUrlFilters } from "@/hooks/use-url-filters"
import { apiErrorMessage, therapistName } from "@/lib/admin"
import { formatDate, formatPrice, formatRelative } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  useAdminTherapists,
  usePendingTherapistRequests,
  useProcessedTherapistRequests,
  useReviewTherapistRequest,
  useCreateTherapist,
  useDeleteUser,
  useUpdateTherapistMenuStatus,
} from "./queries"
import {
  DocumentLinks,
  RejectDialog,
  StatusBadge,
  TherapistAvatar,
  TherapistDetailSheet,
} from "./therapist-parts"

const TABS = ["requests", "therapists", "history"]
const STATUS_FROM_REQUEST = { 0: "pending", 1: "approved", 2: "rejected" }
const normalize = (value) => (value || "").toLocaleLowerCase("az").trim()

function SearchBox({ value, onChange, placeholder, label }) {
  return (
    <div className="relative sm:w-72">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-9 pl-8 pr-8" aria-label={label} />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Axtarışı təmizlə"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <Icon className="size-8 text-muted-foreground" />
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
    </div>
  )
}

function ErrorState({ query }) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <p className="text-sm font-medium">Məlumat yüklənmədi</p>
      <p className="text-sm text-muted-foreground">{apiErrorMessage(query.error)}</p>
      <Button variant="outline" size="sm" className="mt-2" onClick={() => query.refetch()}>
        Yenidən cəhd et
      </Button>
    </div>
  )
}

function RequestCard({ request, onApprove, onReject, onDetails, busy }) {
  const t = request.therapist
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 gap-4">
          <TherapistAvatar therapist={t} className="size-12" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="font-semibold">{therapistName(t)}</p>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-3.5" />
                {formatRelative(request.createdAt)} müraciət edib
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{t?.specialization || "İxtisas göstərilməyib"}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="size-3.5" />
                {t?.email}
              </span>
              {t?.phoneNumber && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="size-3.5" />
                  {t.phoneNumber}
                </span>
              )}
              {t?.licenseNumber ? (
                <span>Lisenziya: <span className="font-medium text-foreground">{t.licenseNumber}</span></span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-600">
                  <ShieldAlert className="size-3.5" />
                  Lisenziya göstərilməyib
                </span>
              )}
            </div>
            {t?.bio?.trim() && <p className="line-clamp-2 text-sm text-muted-foreground">{t.bio}</p>}
            <DocumentLinks therapist={t} compact />
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col lg:items-stretch">
          <Button size="sm" onClick={onApprove} disabled={busy}>
            <CheckCircle2 />
            Təsdiqlə
          </Button>
          <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={onReject} disabled={busy}>
            <X />
            Rədd et
          </Button>
          <Button size="sm" variant="ghost" onClick={onDetails}>
            Ətraflı
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function TherapistsPage() {
  const navigate = useNavigate()
  const { params, update } = useUrlFilters()
  const tab = TABS.includes(params.get("tab")) ? params.get("tab") : "requests"

  const pending = usePendingTherapistRequests()
  const processed = useProcessedTherapistRequests()
  const therapists = useAdminTherapists()
  const review = useReviewTherapistRequest()
  const menuStatus = useUpdateTherapistMenuStatus()
  const createTherapist = useCreateTherapist()
  const [creating, setCreating] = useState(false)
  // Silmə hesabla birlikdədir (backend: DELETE /user/{id}, yalnız SuperAdmin); seans tarixçəsi varsa backend imtina edir
  const { isSuperAdmin } = useAdminRole()
  const deleteUser = useDeleteUser()
  const [deleting, setDeleting] = useState(null)
  const lastDeletingRef = useRef(null)
  if (deleting) lastDeletingRef.current = deleting

  const [approving, setApproving] = useState(null)
  const [rejecting, setRejecting] = useState(null)
  const [detail, setDetail] = useState(null) // { therapist, status, appliedAt, request? }
  const lastApprovingRef = useRef(null)
  if (approving) lastApprovingRef.current = approving

  const [therapistSearch, setTherapistSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [historySearch, setHistorySearch] = useState("")

  // Terapevtin son müraciət statusu (siyahıda "Gözləyir / Rədd edilib" fərqini göstərmək üçün)
  const requestStatusByTherapist = useMemo(() => {
    const map = {}
    ;[...(processed.data || [])].reverse().forEach((r) => (map[r.therapistId] = STATUS_FROM_REQUEST[r.status]))
    ;(pending.data || []).forEach((r) => (map[r.therapistId] = "pending"))
    return map
  }, [pending.data, processed.data])

  const therapistStatus = (t) => (t.isVerified ? "approved" : requestStatusByTherapist[t.id] || "pending")

  const filteredTherapists = useMemo(() => {
    const q = normalize(therapistSearch)
    return (therapists.data || []).filter((t) => {
      const status = t.isVerified ? "approved" : requestStatusByTherapist[t.id] || "pending"
      if (statusFilter === "approved" && status !== "approved") return false
      if (statusFilter === "pending" && status !== "pending") return false
      if (statusFilter === "rejected" && status !== "rejected") return false
      if (statusFilter === "hidden" && !(t.isVerified && !t.isShowMenu)) return false
      if (!q) return true
      return [therapistName(t), t.email, t.specialization, t.phoneNumber].some((v) => normalize(v).includes(q))
    })
  }, [therapists.data, therapistSearch, statusFilter, requestStatusByTherapist])

  const filteredHistory = useMemo(() => {
    const q = normalize(historySearch)
    return (processed.data || []).filter(
      (r) => !q || [therapistName(r.therapist), r.therapist?.email, r.rejectionReason].some((v) => normalize(v).includes(q))
    )
  }, [processed.data, historySearch])

  const runReview = (request, action, reason) => {
    const name = therapistName(request.therapist)
    review.mutate(
      { requestId: request.id, action, reason },
      {
        onSuccess: () => {
          toast.success(action === "approve" ? `${name} təsdiqləndi və saytda göstərilir` : `${name} müraciəti rədd edildi`)
          setApproving(null)
          setRejecting(null)
          setDetail(null)
        },
        onError: (error) => {
          setApproving(null)
          setRejecting(null)
          toast.error(apiErrorMessage(error))
        },
      }
    )
  }

  const toggleMenu = (therapist, isShowMenu) =>
    menuStatus.mutate(
      { id: therapist.id, isShowMenu },
      {
        onSuccess: () => toast.success(isShowMenu ? `${therapistName(therapist)} saytda göstərilir` : `${therapistName(therapist)} saytdan gizlədildi`),
        onError: (error) => toast.error(apiErrorMessage(error)),
      }
    )

  const refetchAll = () => {
    pending.refetch()
    processed.refetch()
    therapists.refetch()
  }
  const fetching = pending.isFetching || processed.isFetching || therapists.isFetching

  const counts = {
    requests: pending.data?.length,
    therapists: therapists.data?.length,
    history: processed.data?.length,
  }

  return (
    <>
      <PageHeader
        title="Terapevtlər"
        description="Qeydiyyat müraciətlərini yoxla və terapevtlərin saytda görünməsini idarə et."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={refetchAll} disabled={fetching}>
              <RefreshCw className={cn(fetching && "animate-spin")} />
              Yenilə
            </Button>
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus />
              Yeni fitoterapevt
            </Button>
          </>
        }
      />

      <CreateTherapistDialog
        open={creating}
        onOpenChange={setCreating}
        saving={createTherapist.isPending}
        onSubmit={(data, done) =>
          createTherapist.mutate(data, {
            onSuccess: (therapist) => {
              done()
              toast.success(`${data.fullName} yaradıldı — şəkil, qiymət və iş saatlarını əlavə edin`)
              if (therapist?.id) navigate(`/admin/therapists/${therapist.id}`)
            },
            onError: (error) => toast.error(apiErrorMessage(error)),
          })
        }
      />

      <Tabs value={tab} onValueChange={(value) => update({ tab: value === "requests" ? null : value })}>
        <div className="-mx-1 mb-4 overflow-x-auto px-1">
          <TabsList>
            {[
              ["requests", "Müraciətlər"],
              ["therapists", "Terapevtlər"],
              ["history", "Tarixçə"],
            ].map(([value, label]) => (
              <TabsTrigger key={value} value={value} className="gap-1.5">
                {label}
                {counts[value] !== undefined && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-xs tabular-nums",
                      value === "requests" && counts[value] > 0 ? "bg-primary text-primary-foreground" : "bg-muted-foreground/10 text-muted-foreground"
                    )}
                  >
                    {counts[value]}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ── Gözləyən müraciətlər ── */}
        <TabsContent value="requests" className="mt-0 space-y-3">
          {pending.isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="flex gap-4 p-5">
                  <Skeleton className="size-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-full max-w-md" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : pending.isError ? (
            <Card><ErrorState query={pending} /></Card>
          ) : pending.data.length === 0 ? (
            <Card>
              <EmptyState icon={Inbox} title="Gözləyən müraciət yoxdur" description="Yeni terapevt qeydiyyatları burada görünəcək." />
            </Card>
          ) : (
            pending.data.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                busy={review.isPending && review.variables?.requestId === request.id}
                onApprove={() => setApproving(request)}
                onReject={() => setRejecting(request)}
                onDetails={() => setDetail({ therapist: request.therapist, status: "pending", appliedAt: request.createdAt, request })}
              />
            ))
          )}
        </TabsContent>

        {/* ── Bütün terapevtlər ── */}
        <TabsContent value="therapists" className="mt-0">
          <Card className="overflow-hidden">
            <div className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-center">
              <SearchBox value={therapistSearch} onChange={setTherapistSearch} placeholder="Ad, email və ya ixtisas" label="Terapevt axtar" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 sm:w-52" aria-label="Status filtri">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Bütün statuslar</SelectItem>
                  <SelectItem value="approved">Təsdiqlənmiş</SelectItem>
                  <SelectItem value="pending">Təsdiq gözləyən</SelectItem>
                  <SelectItem value="rejected">Rədd edilmiş</SelectItem>
                  <SelectItem value="hidden">Saytda gizli</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {therapists.isError ? (
              <ErrorState query={therapists} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Terapevt</TableHead>
                    <TableHead className="hidden lg:table-cell">İxtisas</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="hidden xl:table-cell">Qiymət</TableHead>
                    <TableHead className="text-center">Saytda</TableHead>
                    <TableHead className="w-12 pr-4">
                      <span className="sr-only">Əməliyyatlar</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {therapists.isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell className="pl-4" colSpan={6}>
                          <Skeleton className="h-9 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredTherapists.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={6}>
                        <EmptyState icon={Stethoscope} title="Uyğun terapevt tapılmadı" />
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTherapists.map((t) => {
                      const status = therapistStatus(t)
                      const toggling = menuStatus.isPending && menuStatus.variables?.id === t.id
                      const switchControl = (
                        <Switch
                          checked={t.isShowMenu && t.isVerified}
                          disabled={!t.isVerified || toggling}
                          onCheckedChange={(checked) => toggleMenu(t, checked)}
                          aria-label={`${therapistName(t)} saytda göstərilsin`}
                        />
                      )
                      return (
                        <TableRow
                          key={t.id}
                          className="cursor-pointer"
                          onClick={(e) => {
                            // Sətirə klik redaktora aparır (menyu/açar/link klikləri istisna)
                            if (!e.target.closest("button, a, [role=menuitem], [role=switch]")) navigate(`/admin/therapists/${t.id}`)
                          }}
                        >
                          <TableCell className="pl-4">
                            <div className="flex min-w-0 items-center gap-3">
                              <TherapistAvatar therapist={t} />
                              <div className="min-w-0">
                                <p className="max-w-[160px] truncate font-medium sm:max-w-[240px]">{therapistName(t)}</p>
                                <p className="max-w-[160px] truncate text-xs text-muted-foreground sm:max-w-[240px]">{t.email}</p>
                                <div className="mt-1 sm:hidden">
                                  <StatusBadge status={status} />
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden max-w-[200px] truncate text-muted-foreground lg:table-cell">
                            {t.specialization || "—"}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <StatusBadge status={status} />
                          </TableCell>
                          <TableCell className="hidden text-sm xl:table-cell">
                            {t.onlinePrice || t.offlinePrice ? (
                              <span className="tabular-nums">
                                {t.onlinePrice ? formatPrice(t.onlinePrice) : "—"} <span className="text-muted-foreground">onlayn</span>
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Təyin edilməyib</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {t.isVerified ? (
                              switchControl
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex" tabIndex={0}>{switchControl}</span>
                                </TooltipTrigger>
                                <TooltipContent>Əvvəlcə müraciət təsdiqlənməlidir</TooltipContent>
                              </Tooltip>
                            )}
                          </TableCell>
                          <TableCell className="pr-4 text-right">
                            <DropdownMenu modal={false}>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8" aria-label={`${therapistName(t)} üçün əməliyyatlar`}>
                                  <MoreHorizontal />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onSelect={() => navigate(`/admin/therapists/${t.id}`)}>
                                  <Pencil />
                                  Redaktə et
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setDetail({ therapist: t, status })}>
                                  <UserRound />
                                  Ətraflı
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild disabled={!(t.isVerified && t.isShowMenu)}>
                                  <Link to={`/therapist/${t.id}`} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink />
                                    Saytda bax
                                  </Link>
                                </DropdownMenuItem>
                                {isSuperAdmin && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onSelect={() => setDeleting(t)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 />
                                      Sil
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
            )}
          </Card>
        </TabsContent>

        {/* ── Tarixçə ── */}
        <TabsContent value="history" className="mt-0">
          <Card className="overflow-hidden">
            <div className="border-b p-4">
              <SearchBox value={historySearch} onChange={setHistorySearch} placeholder="Ad, email və ya səbəb" label="Tarixçədə axtar" />
            </div>
            {processed.isError ? (
              <ErrorState query={processed} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Terapevt</TableHead>
                    <TableHead>Nəticə</TableHead>
                    <TableHead className="hidden md:table-cell">Səbəb</TableHead>
                    <TableHead className="hidden lg:table-cell">Müraciət</TableHead>
                    <TableHead className="hidden sm:table-cell pr-4 text-right">Emal olunub</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processed.isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell className="pl-4" colSpan={5}>
                          <Skeleton className="h-9 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredHistory.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={5}>
                        <EmptyState icon={Inbox} title={historySearch ? "Uyğun qeyd tapılmadı" : "Hələ emal olunmuş müraciət yoxdur"} />
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredHistory.map((r) => (
                      <TableRow
                        key={r.id}
                        className="cursor-pointer"
                        onClick={() => setDetail({ therapist: r.therapist, status: STATUS_FROM_REQUEST[r.status], appliedAt: r.createdAt })}
                      >
                        <TableCell className="pl-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <TherapistAvatar therapist={r.therapist} />
                            <div className="min-w-0">
                              <p className="max-w-[160px] truncate font-medium sm:max-w-[240px]">{therapistName(r.therapist)}</p>
                              <p className="max-w-[160px] truncate text-xs text-muted-foreground sm:max-w-[240px]">{r.therapist?.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={STATUS_FROM_REQUEST[r.status]} />
                        </TableCell>
                        <TableCell className="hidden max-w-[280px] md:table-cell">
                          {r.rejectionReason ? (
                            <p className="truncate text-sm text-muted-foreground" title={r.rejectionReason}>
                              {r.rejectionReason}
                            </p>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground lg:table-cell">{formatDate(r.createdAt)}</TableCell>
                        <TableCell className="hidden pr-4 text-right text-muted-foreground sm:table-cell">{formatDate(r.processedAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <TherapistDetailSheet
        open={!!detail}
        onOpenChange={(open) => !open && setDetail(null)}
        therapist={detail?.therapist}
        status={detail?.status}
        appliedAt={detail?.appliedAt}
        actions={
          detail?.request ? (
            <>
              <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setRejecting(detail.request)}>
                <X />
                Rədd et
              </Button>
              <Button onClick={() => setApproving(detail.request)}>
                <CheckCircle2 />
                Təsdiqlə
              </Button>
            </>
          ) : (
            detail?.therapist && (
              <Button variant="outline" asChild>
                <Link to={`/admin/therapists/${detail.therapist.id}`}>
                  <Pencil />
                  Profili redaktə et
                </Link>
              </Button>
            )
          )
        }
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`${therapistName(lastDeletingRef.current)} silinsin?`}
        description="Fitoterapevt profili və hesabı (sənədləri ilə birlikdə) birdəfəlik silinəcək. Seans tarixçəsi varsa silinmir — onda saytdan gizlədin və ya hesabı bloklayın."
        confirmLabel="Sil"
        destructive
        pending={deleteUser.isPending}
        onConfirm={() => {
          const t = deleting
          deleteUser.mutate(t.userId, {
            onSuccess: () => {
              toast.success(`${therapistName(t)} silindi`)
              setDeleting(null)
            },
            onError: (error) => toast.error(apiErrorMessage(error)),
          })
        }}
      />

      <ConfirmDialog
        open={!!approving}
        onOpenChange={(open) => !open && setApproving(null)}
        title={`${therapistName(lastApprovingRef.current?.therapist)} təsdiqlənsin?`}
        description="Profil dərhal saytdakı terapevtlər siyahısında görünəcək və terapevtə təsdiq emaili göndəriləcək."
        confirmLabel="Təsdiqlə"
        pending={review.isPending}
        onConfirm={() => runReview(approving, "approve")}
      />

      <RejectDialog
        open={!!rejecting}
        onOpenChange={(open) => !open && setRejecting(null)}
        therapist={rejecting?.therapist}
        pending={review.isPending}
        onConfirm={(reason) => runReview(rejecting, "reject", reason)}
      />
    </>
  )
}
