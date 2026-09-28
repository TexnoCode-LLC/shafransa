import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { ArrowRight, BadgeCheck, CalendarClock, Heart, Loader2, Package, Stethoscope, Trash2, Upload, Video } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/admin/ui/avatar"
import { Badge } from "@/components/admin/ui/badge"
import { Button } from "@/components/admin/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/admin/ui/card"
import { Input } from "@/components/admin/ui/input"
import { Label } from "@/components/admin/ui/label"
import { Skeleton } from "@/components/admin/ui/skeleton"
import { Textarea } from "@/components/admin/ui/textarea"
import { getInitials } from "@/lib/admin"
import { formatDate, formatDateTime } from "@/lib/format"
import { cn } from "@/lib/utils"
import { getRoleName } from "../../constants/roles"
import { getMyOrders } from "../../services/order.service"
import { getMySessions } from "../../services/therapySession.service"
import { deleteMyAvatar, getMe, updateMe, uploadMyAvatar } from "../../services/user.service"
import { useAuthStore } from "../../store/useAuthStore"
import { getWishlist } from "../../services/wishlist.service"
import { accountKeys } from "./queries"

const MAX_BYTES = 10 * 1024 * 1024
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const UPCOMING = [0, 1, 2] // gözləyir, terapevt təsdiqləyib, təsdiqlənib
const asList = (value) => (Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : [])

function StatCard({ icon: Icon, label, value, to, loading }) {
  const { t } = useTranslation()
  return (
    <Card className="transition-colors hover:border-primary/40">
      {/* Mobildə üç kart bir sırada, kompakt */}
      <Link to={to} className="flex flex-col items-start gap-2 p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:size-10">
          <Icon className="size-4 sm:size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xl font-semibold tabular-nums sm:text-2xl">{loading ? <Skeleton className="h-7 w-10" /> : value}</span>
          <span className="block text-xs leading-tight text-muted-foreground sm:truncate sm:text-sm">{label}</span>
        </span>
        <span className="sr-only">{t("account.overview.open")}</span>
        <ArrowRight className="hidden size-4 text-muted-foreground sm:block" />
      </Link>
    </Card>
  )
}

// Avatar dərhal yüklənir (ayrıca "yadda saxla" tələb etmir)
function AvatarField({ me }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const inputRef = useRef(null)
  const [error, setError] = useState(null)

  const syncStore = (updated) => {
    queryClient.setQueryData(accountKeys.me, updated)
    useAuthStore.setState((state) => ({ user: { ...state.user, avatar: updated.avatar } }))
  }
  const upload = useMutation({
    mutationFn: uploadMyAvatar,
    onSuccess: (updated) => {
      syncStore(updated)
      toast.success(t("account.profile.avatar_updated"))
    },
    onError: () => toast.error(t("account.errors.generic")),
  })
  const remove = useMutation({
    mutationFn: deleteMyAvatar,
    onSuccess: (updated) => {
      syncStore(updated)
      toast.success(t("account.profile.avatar_removed"))
    },
    onError: () => toast.error(t("account.errors.generic")),
  })
  const busy = upload.isPending || remove.isPending

  const pick = (file) => {
    if (!file) return
    if (!IMAGE_TYPES.includes(file.type)) return setError(t("account.errors.file_type"))
    if (file.size > MAX_BYTES) return setError(t("account.errors.file_size"))
    setError(null)
    upload.mutate(file)
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-20 rounded-xl">
        <AvatarImage src={me?.avatar || undefined} alt={me?.fullName} className="object-cover" />
        <AvatarFallback className="rounded-xl bg-primary/10 text-lg font-semibold text-primary">{getInitials(me?.fullName)}</AvatarFallback>
      </Avatar>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={busy}>
            {upload.isPending ? <Loader2 className="animate-spin" /> : <Upload />}
            {me?.avatar ? t("account.profile.change") : t("account.profile.upload")}
          </Button>
          {me?.avatar && (
            <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => remove.mutate()} disabled={busy}>
              {remove.isPending ? <Loader2 className="animate-spin" /> : <Trash2 />}
              {t("account.profile.remove")}
            </Button>
          )}
        </div>
        <p className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")}>{error || t("account.profile.avatar_hint")}</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.gif"
        className="sr-only"
        tabIndex={-1}
        aria-label={t("account.profile.avatar")}
        onChange={(e) => {
          pick(e.target.files?.[0])
          e.target.value = ""
        }}
      />
    </div>
  )
}

function ProfileForm({ me }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [fullName, setFullName] = useState(me.fullName || "")
  const [about, setAbout] = useState(me.description || "")
  const [submitted, setSubmitted] = useState(false)
  useEffect(() => {
    setFullName(me.fullName || "")
    setAbout(me.description || "")
  }, [me.fullName, me.description])

  const nameError = fullName.trim().length < 2 || fullName.trim().length > 100 ? t("account.profile.name_error") : null
  const aboutError = about.length > 2000 ? t("account.profile.about_error") : null
  const dirty = fullName.trim() !== (me.fullName || "") || about.trim() !== (me.description || "")

  const save = useMutation({
    mutationFn: () => updateMe({ fullName: fullName.trim(), description: about.trim() }),
    onSuccess: (updated) => {
      queryClient.setQueryData(accountKeys.me, updated)
      useAuthStore.setState((state) => ({ user: { ...state.user, fullName: updated.fullName } }))
      setSubmitted(false)
      toast.success(t("account.profile.saved"))
    },
    onError: () => toast.error(t("account.errors.generic")),
  })

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        setSubmitted(true)
        if (!nameError && !aboutError) save.mutate()
      }}
      className="space-y-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="profile-name">{t("account.profile.full_name")}</Label>
          <Input
            id="profile-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            aria-invalid={submitted && !!nameError}
            className={cn(submitted && nameError && "border-destructive focus-visible:ring-destructive")}
          />
          {submitted && nameError && <p className="text-xs text-destructive">{nameError}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-email" className="flex items-center gap-2">
            {t("account.profile.email")}
            {me.isEmailVerified && (
              <Badge variant="outline" className="gap-1 border-emerald-200 bg-emerald-50 font-medium text-emerald-700">
                <BadgeCheck className="size-3" />
                {t("account.profile.email_verified")}
              </Badge>
            )}
          </Label>
          <Input id="profile-email" value={me.email} readOnly disabled />
          <p className="text-xs text-muted-foreground">{t("account.profile.email_hint")}</p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="profile-about">{t("account.profile.about")}</Label>
          <span className={cn("text-xs tabular-nums text-muted-foreground", aboutError && "text-destructive")}>{about.length}/2000</span>
        </div>
        <Textarea
          id="profile-about"
          rows={4}
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          placeholder={t("account.profile.about_placeholder")}
          aria-invalid={!!aboutError}
          className={cn(aboutError && "border-destructive focus-visible:ring-destructive")}
        />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={!dirty || save.isPending}>
          {save.isPending && <Loader2 className="animate-spin" />}
          {t("account.profile.save")}
        </Button>
        {dirty && <span className="text-xs text-amber-700">{t("account.profile.unsaved")}</span>}
      </div>
    </form>
  )
}

export default function OverviewPage() {
  const { t } = useTranslation()
  const role = getRoleName(useAuthStore((state) => state.user)?.role)
  const me = useQuery({ queryKey: accountKeys.me, queryFn: getMe })
  const orders = useQuery({ queryKey: accountKeys.orders, queryFn: getMyOrders })
  const sessions = useQuery({ queryKey: accountKeys.sessions, queryFn: getMySessions })
  const wishlist = useQuery({ queryKey: accountKeys.wishlist, queryFn: getWishlist })

  const now = Date.now()
  const upcoming = asList(sessions.data)
    .filter((s) => UPCOMING.includes(s.status) && new Date(s.startTime).getTime() > now)
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
  const next = upcoming[0]

  if (me.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-80" />
      </div>
    )
  }

  if (me.isError || !me.data) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="font-medium">{t("account.errors.load")}</p>
          <Button variant="outline" size="sm" onClick={() => me.refetch()}>
            {t("account.errors.retry")}
          </Button>
        </CardContent>
      </Card>
    )
  }

  const profile = me.data
  const therapistName = next?.therapist?.user?.fullName || next?.therapist?.fullName

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("account.overview.greeting", { name: profile.fullName })}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("account.overview.subtitle")}</p>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard icon={Package} label={t("account.overview.stat_orders")} value={asList(orders.data).length} to="/user/orders" loading={orders.isLoading} />
        <StatCard icon={Heart} label={t("account.overview.stat_saved")} value={asList(wishlist.data).length} to="/user/wishlist" loading={wishlist.isLoading} />
        <StatCard icon={CalendarClock} label={t("account.overview.stat_sessions")} value={upcoming.length} to="/user/sessions" loading={sessions.isLoading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("account.profile.title")}</CardTitle>
            <CardDescription>{t("account.profile.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <AvatarField me={profile} />
            <ProfileForm me={profile} />
            <p className="text-xs text-muted-foreground">{t("account.profile.member_since", { date: formatDate(profile.createdAt) })}</p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("account.overview.next_session")}</CardTitle>
            </CardHeader>
            <CardContent>
              {sessions.isLoading ? (
                <Skeleton className="h-16" />
              ) : next ? (
                <div className="space-y-3">
                  <p className="font-medium">{formatDateTime(next.startTime)}</p>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    {next.isOnline ? <Video className="size-4 text-primary" /> : <Stethoscope className="size-4" />}
                    {next.isOnline ? t("account.overview.online") : t("account.overview.offline")}
                    {therapistName && <> · {t("account.overview.with", { name: therapistName })}</>}
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/user/sessions">
                      {t("account.nav_sessions")}
                      <ArrowRight />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{t("account.overview.no_next_session")}</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/therapists">
                      {t("account.overview.find_therapist")}
                      <ArrowRight />
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {role === "THERAPIST" && (
            <Card className="border-primary/20 bg-primary/[0.03]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Stethoscope className="size-4 text-primary" />
                  {t("account.overview.therapist_title")}
                </CardTitle>
                <CardDescription>{t("account.overview.therapist_text")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="sm" asChild>
                  <Link to="/expert">{t("account.overview.open_expert")}</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
