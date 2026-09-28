import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Ban,
  CheckCircle2,
  Copy,
  MailWarning,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldOff,
  UserX,
  X,
} from "lucide-react"

import { ConfirmDialog } from "@/components/admin/ConfirmDialog"
import { NoAccess } from "@/components/admin/NoAccess"
import { PageHeader } from "@/components/admin/PageHeader"
import { TablePagination } from "@/components/admin/TablePagination"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/admin/ui/avatar"
import { Badge } from "@/components/admin/ui/badge"
import { Button } from "@/components/admin/ui/button"
import { Card } from "@/components/admin/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/admin/ui/dropdown-menu"
import { Input } from "@/components/admin/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/admin/ui/select"
import { Skeleton } from "@/components/admin/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/admin/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/admin/ui/tooltip"
import { useAdminRole } from "@/hooks/use-admin-role"
import { apiErrorMessage, getInitials, USER_ROLE_LABELS } from "@/lib/admin"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useAdminUsers, useUpdateUser } from "./queries"
import { UserEditSheet } from "./UserEditSheet"

const ROLE_TABS = [
  { value: "all", label: "Hamısı" },
  { value: "Member", label: "İstifadəçilər" },
  { value: "Therapist", label: "Terapevtlər" },
  { value: "admins", label: "Adminlər" },
]

const STATUS_OPTIONS = [
  { value: "all", label: "Bütün statuslar" },
  { value: "active", label: "Aktiv" },
  { value: "blocked", label: "Bloklanıb" },
]

const ROLE_BADGE_CLASS = {
  SuperAdmin: "border-violet-200 bg-violet-50 text-violet-700",
  Admin: "border-sky-200 bg-sky-50 text-sky-700",
  Therapist: "border-amber-200 bg-amber-50 text-amber-700",
  Member: "border-border bg-muted/60 text-foreground",
}

const normalize = (value) => (value || "").toLocaleLowerCase("az").trim()

function SortButton({ label, column, sort, onSort }) {
  const active = sort.column === column
  const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown
  return (
    <Button variant="ghost" size="sm" className="-ml-3 h-8 gap-1 font-medium" onClick={() => onSort(column)}>
      {label}
      <Icon className={cn("size-3.5", !active && "text-muted-foreground/60")} />
    </Button>
  )
}

// Hansı əməliyyatın təsdiqi gözlənilir: { user, action: "block" | "unblock" | "makeAdmin" | "removeAdmin" }
function confirmCopy({ user, action }) {
  const name = user.fullName
  switch (action) {
    case "block":
      return {
        title: `${name} bloklansın?`,
        description:
          "İstifadəçi dərhal sistemdən çıxarılacaq və yenidən daxil ola bilməyəcək. İstənilən vaxt blokdan çıxara bilərsiniz.",
        confirmLabel: "Blokla",
        destructive: true,
      }
    case "unblock":
      return {
        title: `${name} blokdan çıxarılsın?`,
        description: "İstifadəçi yenidən hesabına daxil ola biləcək.",
        confirmLabel: "Blokdan çıxar",
      }
    case "makeAdmin":
      return {
        title: `${name} admin olsun?`,
        description:
          "Admin panelinə giriş əldə edəcək (məhsullar, terapevt müraciətləri). Aktiv sessiyası bitəcək və yenidən daxil olmalı olacaq.",
        confirmLabel: "Admin et",
      }
    case "removeAdmin":
      return {
        title: `${name} adminlikdən çıxarılsın?`,
        description: "Admin panelinə girişi bağlanacaq və adi istifadəçi olacaq. Aktiv sessiyası bitəcək.",
        confirmLabel: "Adminlikdən çıxar",
        destructive: true,
      }
    default:
      return {}
  }
}

export default function UsersPage() {
  const { user: me, isSuperAdmin } = useAdminRole()
  const [params, setParams] = useSearchParams()
  const users = useAdminUsers({ enabled: isSuperAdmin })
  const updateUser = useUpdateUser()
  const [pendingAction, setPendingAction] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const lastEditingRef = useRef(null)
  if (editingId) lastEditingRef.current = editingId
  // Dialoq bağlanma animasiyası zamanı mətn boşalmasın deyə son əməliyyat yadda saxlanır
  const lastActionRef = useRef(null)
  if (pendingAction) lastActionRef.current = pendingAction

  // Filtrlər URL-də: səhifəni yeniləmək və ya geri düyməsi filtrləri itirmir
  const role = params.get("role") || "all"
  const status = params.get("status") || "all"
  const page = Math.max(1, Number(params.get("page")) || 1)
  const pageSize = [10, 20, 50].includes(Number(params.get("size"))) ? Number(params.get("size")) : 10
  const sort = { column: params.get("sort") || "createdAt", dir: params.get("dir") === "asc" ? "asc" : "desc" }
  const [search, setSearch] = useState(params.get("q") || "")

  // Həmişə cari URL-dən başlanır: react-router-in "prev" dəyəri köhnə render-dən ola bilər və
  // gecikmiş axtarış yazısı (debounce) əvvəlki filtr dəyişikliyini geri qaytarardı
  const updateParams = (changes, { resetPage = true } = {}) => {
    const next = new URLSearchParams(window.location.search)
    Object.entries(changes).forEach(([key, value]) => {
      if (value === null || value === "" || value === "all") next.delete(key)
      else next.set(key, String(value))
    })
    if (resetPage && !("page" in changes)) next.delete("page")
    setParams(next, { replace: true })
  }

  // Axtarış yazılarkən hər hərfdə yox, 250ms sonra URL-ə yazılır
  useEffect(() => {
    const handle = setTimeout(() => {
      if ((params.get("q") || "") !== search.trim()) updateParams({ q: search.trim() })
    }, 250)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const all = useMemo(() => users.data || [], [users.data])

  const roleCounts = useMemo(
    () => ({
      all: all.length,
      Member: all.filter((u) => u.role === "Member").length,
      Therapist: all.filter((u) => u.role === "Therapist").length,
      admins: all.filter((u) => u.role === "Admin" || u.role === "SuperAdmin").length,
    }),
    [all]
  )

  const filtered = useMemo(() => {
    const q = normalize(params.get("q"))
    const rows = all.filter((u) => {
      if (role === "admins" ? !(u.role === "Admin" || u.role === "SuperAdmin") : role !== "all" && u.role !== role)
        return false
      if (status === "active" && !u.isActive) return false
      if (status === "blocked" && u.isActive) return false
      if (q && !normalize(u.fullName).includes(q) && !normalize(u.email).includes(q)) return false
      return true
    })
    const factor = sort.dir === "asc" ? 1 : -1
    return rows.sort((a, b) =>
      sort.column === "name"
        ? factor * (a.fullName || "").localeCompare(b.fullName || "", "az")
        : factor * (new Date(a.createdAt) - new Date(b.createdAt))
    )
  }, [all, role, status, params, sort.column, sort.dir])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const hasFilters = role !== "all" || status !== "all" || !!params.get("q")

  const toggleSort = (column) => {
    const dir = sort.column === column && sort.dir === "desc" ? "asc" : "desc"
    updateParams({ sort: column === "createdAt" ? null : column, dir: dir === "desc" ? null : dir }, { resetPage: false })
  }

  const clearFilters = () => {
    setSearch("")
    setParams({}, { replace: true })
  }

  const runAction = () => {
    if (!pendingAction) return
    const { user, action } = pendingAction
    const request =
      action === "block" || action === "unblock"
        ? { id: user.id, action: "status", value: action === "unblock" }
        : { id: user.id, action: "role", value: action === "makeAdmin" ? "Admin" : "Member" }

    const messages = {
      block: `${user.fullName} bloklandı`,
      unblock: `${user.fullName} blokdan çıxarıldı`,
      makeAdmin: `${user.fullName} artıq admindir`,
      removeAdmin: `${user.fullName} adminlikdən çıxarıldı`,
    }

    updateUser.mutate(request, {
      onSuccess: () => {
        toast.success(messages[action])
        setPendingAction(null)
      },
      onError: (error) => toast.error(apiErrorMessage(error)),
    })
  }

  const copyEmail = async (email) => {
    try {
      await navigator.clipboard.writeText(email)
      toast.success("Email kopyalandı")
    } catch {
      toast.error("Kopyalamaq alınmadı")
    }
  }

  if (!isSuperAdmin) return <NoAccess description="İstifadəçi siyahısı yalnız super admin üçündür." />

  const dialog = lastActionRef.current ? confirmCopy(lastActionRef.current) : {}

  return (
    <>
      <PageHeader
        title="İstifadəçilər"
        description="Hesabları idarə et: redaktə et, admin təyin et, blokla və ya sil."
        actions={
          <Button variant="outline" size="sm" onClick={() => users.refetch()} disabled={users.isFetching}>
            <RefreshCw className={cn(users.isFetching && "animate-spin")} />
            Yenilə
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Dar ekranda 4 tab sığmır — eyni seçim Select ilə */}
          <Select value={role} onValueChange={(value) => updateParams({ role: value })}>
            <SelectTrigger className="h-9 sm:hidden" aria-label="Rol filtri">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_TABS.map((tab) => (
                <SelectItem key={tab.value} value={tab.value}>
                  {tab.label}
                  {users.isLoading ? "" : ` (${roleCounts[tab.value]})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="-mx-1 hidden overflow-x-auto px-1 sm:block">
            <Tabs value={role} onValueChange={(value) => updateParams({ role: value })}>
              <TabsList>
                {ROLE_TABS.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
                    {tab.label}
                    <span className="rounded-full bg-muted-foreground/10 px-1.5 text-xs tabular-nums text-muted-foreground">
                      {users.isLoading ? "…" : roleCounts[tab.value]}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative sm:w-64">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ad və ya email ilə axtar"
                className="h-9 pl-8 pr-8"
                aria-label="İstifadəçi axtar"
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
            <Select value={status} onValueChange={(value) => updateParams({ status: value })}>
              <SelectTrigger className="h-9 sm:w-44" aria-label="Status filtri">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">
                <SortButton label="İstifadəçi" column="name" sort={sort} onSort={toggleSort} />
              </TableHead>
              <TableHead className="hidden lg:table-cell">Rol</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="hidden xl:table-cell">
                <SortButton label="Qeydiyyat" column="createdAt" sort={sort} onSort={toggleSort} />
              </TableHead>
              <TableHead className="w-12 pr-4">
                <span className="sr-only">Əməliyyatlar</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-9 rounded-full" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-44" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell />
                </TableRow>
              ))
            ) : users.isError ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="py-16 text-center">
                  <p className="text-sm font-medium">İstifadəçilər yüklənmədi</p>
                  <p className="mt-1 text-sm text-muted-foreground">{apiErrorMessage(users.error)}</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => users.refetch()}>
                    Yenidən cəhd et
                  </Button>
                </TableCell>
              </TableRow>
            ) : pageRows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="py-16 text-center">
                  <UserX className="mx-auto size-8 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium">
                    {hasFilters ? "Filtrlərə uyğun istifadəçi tapılmadı" : "Hələ istifadəçi yoxdur"}
                  </p>
                  {hasFilters && (
                    <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
                      Filtrləri təmizlə
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((u) => {
                const isMe = u.id === me?.id
                const isProtected = isMe || u.role === "SuperAdmin"
                const canChangeRole = u.role === "Member" || u.role === "Admin"
                const canEdit = isMe || u.role !== "SuperAdmin"
                return (
                  <TableRow
                    key={u.id}
                    className={cn(canEdit && "cursor-pointer", !u.isActive && "bg-muted/30")}
                    onClick={(e) => {
                      // Sətirə klik redaktə panelini açır (menyu klikləri istisna)
                      if (canEdit && !e.target.closest("button, a, [role=menuitem]")) setEditingId(u.id)
                    }}
                  >
                    <TableCell className="pl-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarImage src={u.avatar || undefined} alt={u.fullName} />
                          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                            {getInitials(u.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="max-w-[140px] truncate font-medium sm:max-w-[220px]" title={u.fullName}>
                              {u.fullName}
                            </span>
                            {isMe && (
                              <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-medium">
                                Siz
                              </Badge>
                            )}
                          </div>
                          <p className="max-w-[190px] truncate text-xs text-muted-foreground sm:max-w-[260px]" title={u.email}>
                            {u.email}
                          </p>
                          {/* Dar ekranda "Rol" sütunu gizlidir — rol burada göstərilir */}
                          <p className="text-xs text-muted-foreground lg:hidden">
                            {USER_ROLE_LABELS[u.role] || u.role}
                            {/* Mobildə "Status" sütunu gizlidir — blok vəziyyəti burada */}
                            {!u.isActive && <span className="font-medium text-red-600 sm:hidden"> · Bloklanıb</span>}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="outline" className={cn("font-medium", ROLE_BADGE_CLASS[u.role])}>
                        {USER_ROLE_LABELS[u.role] || u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            "gap-1.5 font-medium",
                            u.isActive
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-red-200 bg-red-50 text-red-700"
                          )}
                        >
                          <span className={cn("size-1.5 rounded-full", u.isActive ? "bg-emerald-500" : "bg-red-500")} />
                          {u.isActive ? "Aktiv" : "Bloklanıb"}
                        </Badge>
                        {!u.isEmailVerified && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex" tabIndex={0} aria-label="Email təsdiqlənməyib">
                                <MailWarning className="size-4 text-amber-500" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Email təsdiqlənməyib</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground xl:table-cell">{formatDate(u.createdAt)}</TableCell>
                    <TableCell className="pr-4 text-right">
                      {/* modal={false}: menyudan dialoq açılanda Radix body-də pointer-events:none qoyub "ilişdirməsin" */}
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8" aria-label={`${u.fullName} üçün əməliyyatlar`}>
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
                            {u.email}
                          </DropdownMenuLabel>
                          {canEdit && (
                            <DropdownMenuItem onSelect={() => setEditingId(u.id)}>
                              <Pencil />
                              Redaktə et
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onSelect={() => copyEmail(u.email)}>
                            <Copy />
                            Email-i kopyala
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {isProtected ? (
                            <DropdownMenuItem disabled>
                              <ShieldCheck />
                              {isMe ? "Öz rolunuz və statusunuz dəyişmir" : "Super admin dəyişdirilə bilməz"}
                            </DropdownMenuItem>
                          ) : (
                            <>
                              {canChangeRole &&
                                (u.role === "Admin" ? (
                                  <DropdownMenuItem onSelect={() => setPendingAction({ user: u, action: "removeAdmin" })}>
                                    <ShieldOff />
                                    Adminlikdən çıxar
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onSelect={() => setPendingAction({ user: u, action: "makeAdmin" })}>
                                    <ShieldCheck />
                                    Admin et
                                  </DropdownMenuItem>
                                ))}
                              {u.isActive ? (
                                <DropdownMenuItem
                                  onSelect={() => setPendingAction({ user: u, action: "block" })}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Ban />
                                  Blokla
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onSelect={() => setPendingAction({ user: u, action: "unblock" })}>
                                  <CheckCircle2 />
                                  Blokdan çıxar
                                </DropdownMenuItem>
                              )}
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

        {!users.isLoading && !users.isError && (
          <TablePagination
            page={currentPage}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={(next) => updateParams({ page: next > 1 ? next : null }, { resetPage: false })}
            onPageSizeChange={(size) => updateParams({ size: size === 10 ? null : size })}
          />
        )}
      </Card>

      <UserEditSheet userId={lastEditingRef.current} open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)} />

      <ConfirmDialog
        open={!!pendingAction}
        onOpenChange={(open) => !open && setPendingAction(null)}
        title={dialog.title}
        description={dialog.description}
        confirmLabel={dialog.confirmLabel}
        destructive={dialog.destructive}
        pending={updateUser.isPending}
        onConfirm={runAction}
      />
    </>
  )
}
