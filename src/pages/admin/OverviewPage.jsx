import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowRight,
  CheckCircle2,
  Database,
  Leaf,
  LayoutGrid,
  Newspaper,
  Package,
  RefreshCw,
  Server,
  Stethoscope,
  Users,
} from "lucide-react"

import { PageHeader } from "@/components/admin/PageHeader"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/admin/ui/avatar"
import { Badge } from "@/components/admin/ui/badge"
import { Button } from "@/components/admin/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/admin/ui/card"
import { Skeleton } from "@/components/admin/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table"
import { useAdminRole } from "@/hooks/use-admin-role"
import { getInitials, USER_ROLE_LABELS } from "@/lib/admin"
import { formatDate, formatNumber, formatRelative, formatTime } from "@/lib/format"
import { cn } from "@/lib/utils"
import api from "@/services/api"
import { adminKeys, useAdminUsers, usePendingTherapistRequests } from "./queries"

// Siyahı endpointlərindən yalnız ümumi sayı götürürük (limit=1)
async function fetchTotal(url, params) {
  const data = await api.get(url, { params })
  return data?.pagination?.total ?? 0
}

function StatCard({ title, icon: Icon, to, query, hint }) {
  const { data, isLoading, isError } = query

  return (
    <Link
      to={to}
      className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="h-full transition-colors group-hover:border-primary/40 group-hover:bg-muted/30">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 p-4 pb-2 sm:p-6 sm:pb-2">
          <CardTitle className="truncate text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="size-4" />
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div className="text-2xl font-semibold tabular-nums">{isError ? "—" : formatNumber(data)}</div>
          )}
          <p className="mt-1 truncate text-xs text-muted-foreground">{isError ? "Məlumat yüklənmədi" : hint}</p>
        </CardContent>
      </Card>
    </Link>
  )
}

function StatusRow({ icon: Icon, label, ok, okText, failText, loading }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex items-center gap-3 text-sm">
        <Icon className="size-4 text-muted-foreground" />
        {label}
      </div>
      {loading ? (
        <Skeleton className="h-5 w-20" />
      ) : (
        <Badge
          variant="outline"
          className={cn(
            "gap-1.5 font-medium",
            ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
          )}
        >
          <span className={cn("size-1.5 rounded-full", ok ? "bg-emerald-500" : "bg-red-500")} />
          {ok ? okText : failText}
        </Badge>
      )}
    </div>
  )
}

export default function OverviewPage() {
  const { user, isSuperAdmin } = useAdminRole()

  const users = useAdminUsers({ enabled: isSuperAdmin })
  const products = useQuery({ queryKey: adminKeys.stats("products"), queryFn: () => fetchTotal("/products", { limit: 1 }) })
  const plants = useQuery({ queryKey: adminKeys.stats("plants"), queryFn: () => fetchTotal("/plants/paginated", { page: 1 }) })
  const blogs = useQuery({ queryKey: adminKeys.stats("blogs"), queryFn: () => fetchTotal("/blogs", { limit: 1 }) })
  const categories = useQuery({
    queryKey: adminKeys.stats("categories"),
    queryFn: async () => {
      const data = await api.get("/categories")
      const list = Array.isArray(data) ? data : []
      return list.reduce((sum, c) => sum + 1 + (c.children?.length || 0), 0)
    },
  })
  const pending = usePendingTherapistRequests()
  const health = useQuery({
    queryKey: adminKeys.health,
    queryFn: () => api.get("/health"),
    refetchInterval: 60_000,
    retry: false,
  })

  const usersCount = { ...users, data: users.data?.length }
  const pendingCount = { ...pending, data: pending.data?.length }
  const recentUsers = (users.data || []).slice(0, 5)
  const pendingPreview = (pending.data || []).slice(0, 5)

  const apiOnline = health.isSuccess && health.data?.status === "healthy"
  const dbOnline = health.isSuccess && health.data?.database === "connected"
  const firstName = user?.fullName?.split(" ")[0]

  return (
    <>
      <PageHeader
        title={firstName ? `Xoş gəldin, ${firstName}` : "Ümumi baxış"}
        description="Platformanın əsas göstəriciləri və diqqət tələb edən işlər."
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
        {isSuperAdmin && (
          <StatCard title="İstifadəçilər" icon={Users} to="/admin/users" query={usersCount} hint="Qeydiyyatlı hesablar" />
        )}
        <StatCard title="Məhsullar" icon={Package} to="/admin/products" query={products} hint="Marketdəki məhsullar" />
        <StatCard title="Ensiklopediya" icon={Leaf} to="/admin/plants" query={plants} hint="Bitki məqalələri" />
        <StatCard title="Kateqoriyalar" icon={LayoutGrid} to="/admin/categories" query={categories} hint="Alt kateqoriyalar daxil" />
        <StatCard title="Bloglar" icon={Newspaper} to="/admin/blogs" query={blogs} hint="Dərc olunmuş yazılar" />
        <StatCard
          title="Müraciətlər"
          icon={Stethoscope}
          to="/admin/therapists"
          query={pendingCount}
          hint="Gözləyən terapevtlər"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div className="space-y-1.5">
              <CardTitle>Terapevt müraciətləri</CardTitle>
              <CardDescription>Təsdiq və ya rədd gözləyən qeydiyyatlar</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/therapists">
                Hamısı
                <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pending.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="size-9 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : pending.isError ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Müraciətlər yüklənmədi.</p>
            ) : pendingPreview.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                <CheckCircle2 className="size-8 text-primary" />
                <p className="text-sm font-medium">Gözləyən müraciət yoxdur</p>
                <p className="text-xs text-muted-foreground">Yeni qeydiyyatlar burada görünəcək.</p>
              </div>
            ) : (
              <ul className="divide-y">
                {pendingPreview.map((request) => {
                  const therapist = request.therapist
                  const name = therapist?.user?.fullName || therapist?.email || "Adsız"
                  return (
                    <li key={request.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <Avatar className="size-9">
                        <AvatarImage src={therapist?.user?.avatar || undefined} alt={name} />
                        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                          {getInitials(name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {therapist?.specialization || "İxtisas göstərilməyib"}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">{formatRelative(request.createdAt)}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div className="space-y-1.5">
              <CardTitle>Sistem vəziyyəti</CardTitle>
              <CardDescription>
                {health.dataUpdatedAt ? `Son yoxlama: ${formatTime(health.dataUpdatedAt)}` : "Yoxlanılır…"}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => health.refetch()}
              disabled={health.isFetching}
              aria-label="Yenidən yoxla"
            >
              <RefreshCw className={cn(health.isFetching && "animate-spin")} />
            </Button>
          </CardHeader>
          <CardContent className="divide-y pt-0">
            <StatusRow icon={Server} label="API" ok={apiOnline} okText="İşləyir" failText="Əlçatan deyil" loading={health.isLoading} />
            <StatusRow icon={Database} label="Verilənlər bazası" ok={dbOnline} okText="Qoşulub" failText="Qoşulmayıb" loading={health.isLoading} />
            <div className="flex items-center justify-between gap-4 py-3 text-sm">
              <span className="text-muted-foreground">Mühit</span>
              {health.isLoading ? <Skeleton className="h-5 w-20" /> : <span className="font-medium">{health.data?.environment || "—"}</span>}
            </div>
          </CardContent>
        </Card>
      </div>

      {isSuperAdmin && (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div className="space-y-1.5">
              <CardTitle>Son qeydiyyatlar</CardTitle>
              <CardDescription>Platformaya ən son qoşulan istifadəçilər</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/users">
                Hamısı
                <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">Qeydiyyat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={4}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : recentUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-20 text-center text-sm text-muted-foreground">
                      {users.isError ? "İstifadəçilər yüklənmədi." : "Hələ istifadəçi yoxdur."}
                    </TableCell>
                  </TableRow>
                ) : (
                  recentUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="max-w-[160px] truncate font-medium sm:max-w-[260px]" title={u.fullName}>
                        {u.fullName}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">
                          {USER_ROLE_LABELS[u.role] || u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden text-right text-muted-foreground sm:table-cell">
                        {formatDate(u.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  )
}
