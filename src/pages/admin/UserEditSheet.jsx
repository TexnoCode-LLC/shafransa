import { useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { ExternalLink, Loader2, Trash2 } from "lucide-react"

import { ConfirmDialog } from "@/components/admin/ConfirmDialog"
import { ImageUploadField } from "@/components/admin/ImageUploadField"
import { Badge } from "@/components/admin/ui/badge"
import { Button } from "@/components/admin/ui/button"
import { Input } from "@/components/admin/ui/input"
import { Label } from "@/components/admin/ui/label"
import { Separator } from "@/components/admin/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/admin/ui/sheet"
import { Skeleton } from "@/components/admin/ui/skeleton"
import { Switch } from "@/components/admin/ui/switch"
import { Textarea } from "@/components/admin/ui/textarea"
import { apiErrorMessage, USER_ROLE_LABELS } from "@/lib/admin"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/useAuthStore"
import { useAdminUser, useDeleteUser, useSaveUser } from "./queries"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DESCRIPTION_MAX = 2000

const stateFromUser = (user) => ({
  fullName: user?.fullName ?? "",
  email: user?.email ?? "",
  description: user?.description ?? "",
  isEmailVerified: !!user?.isEmailVerified,
  avatar: { file: null, removed: false },
})

const snapshot = (s) => JSON.stringify({ ...s, avatar: [!!s.avatar.file, s.avatar.removed] })

function validate(state) {
  const errors = {}
  const name = state.fullName.trim()
  if (name.length < 2) errors.fullName = "Ad ən azı 2 simvol olmalıdır."
  else if (name.length > 100) errors.fullName = "Ad ən çox 100 simvol ola bilər."
  const email = state.email.trim()
  if (!email) errors.email = "Email yazın."
  else if (!EMAIL_PATTERN.test(email) || email.length > 200) errors.email = "Düzgün email ünvanı yazın."
  if (state.description.length > DESCRIPTION_MAX) errors.description = `Ən çox ${DESCRIPTION_MAX} simvol ola bilər.`
  return errors
}

// Silmə backend-də bu hallarda bloklanır — səbəb düymənin yanında əvvəlcədən göstərilir
function deleteBlockReason(user, isMe) {
  if (isMe) return "Öz hesabınızı silə bilməzsiniz."
  if (user.role === "SuperAdmin") return "Super admin hesabı silinə bilməz."
  if (user.stats?.orders > 0) return `${user.stats.orders} sifarişi var — silmək əvəzinə bloklayın.`
  if (user.stats?.products > 0) return `${user.stats.products} məhsul əlavə edib — silmək əvəzinə bloklayın.`
  if (user.stats?.therapistSessions > 0) return "Terapevt kimi seans tarixçəsi var — silmək əvəzinə bloklayın."
  return null
}

function Stat({ label, value }) {
  return (
    <div className="rounded-md border bg-muted/30 px-3 py-2">
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

export function UserEditSheet({ userId, open, onOpenChange }) {
  const me = useAuthStore((s) => s.user)
  const user = useAdminUser(userId, {
    enabled: open && !!userId,
    refetchOnWindowFocus: false,
  })
  const save = useSaveUser()
  const remove = useDeleteUser()

  const [state, setState] = useState(() => stateFromUser(null))
  const [initial, setInitial] = useState(() => snapshot(stateFromUser(null)))
  const [submitted, setSubmitted] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Form yalnız açılışda / başqa istifadəçiyə keçəndə doldurulur (arxa plan yenilənməsi yazılanları silməsin)
  const loadedRef = useRef(null)
  useEffect(() => {
    if (!open) {
      loadedRef.current = null
      return
    }
    if (!user.data || loadedRef.current === user.data.id) return
    loadedRef.current = user.data.id
    const next = stateFromUser(user.data)
    setState(next)
    setInitial(snapshot(next))
    setSubmitted(false)
  }, [open, user.data])

  const data = user.data
  const isMe = data?.id === me?.id
  const dirty = !!data && snapshot(state) !== initial
  const errors = useMemo(() => validate(state), [state])
  const visibleErrors = submitted ? errors : {}
  const blockReason = data ? deleteBlockReason(data, isMe) : null
  const set = (patch) => setState((prev) => ({ ...prev, ...patch }))

  const requestClose = () => {
    if (save.isPending || remove.isPending) return
    if (dirty) setConfirmDiscard(true)
    else onOpenChange(false)
  }

  const submit = (event) => {
    event.preventDefault()
    setSubmitted(true)
    if (Object.keys(errors).length > 0) {
      requestAnimationFrame(() => document.querySelector('[role="dialog"] [aria-invalid="true"]')?.focus())
      return
    }
    const form = new FormData()
    form.append("fullName", state.fullName.trim())
    form.append("email", state.email.trim())
    form.append("description", state.description.trim()) // boş = təmizlə
    form.append("isEmailVerified", String(state.isEmailVerified))
    if (state.avatar.file) form.append("AvatarFile", state.avatar.file)
    else if (state.avatar.removed) form.append("removeAvatar", "true")

    save.mutate(
      { id: data.id, form },
      {
        onSuccess: (updated) => {
          toast.success("İstifadəçi yadda saxlanıldı")
          // Öz hesabı: sidebar və başlıqdakı ad/email dərhal yenilənsin
          if (isMe)
            useAuthStore.setState((s) => ({
              user: {
                ...s.user,
                fullName: updated.fullName,
                email: updated.email,
              },
            }))
          const next = stateFromUser(updated)
          setState(next)
          setInitial(snapshot(next))
          setSubmitted(false)
        },
        onError: (error) => toast.error(apiErrorMessage(error)),
      },
    )
  }

  const runDelete = () => {
    remove.mutate(data.id, {
      onSuccess: () => {
        toast.success(`${data.fullName} hesabı silindi`)
        setConfirmDelete(false)
        onOpenChange(false)
      },
      onError: (error) => {
        setConfirmDelete(false)
        toast.error(apiErrorMessage(error))
      },
    })
  }

  return (
    <>
      <Sheet open={open} onOpenChange={(next) => (next ? onOpenChange(true) : requestClose())}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
          <SheetHeader className="border-b p-6 text-left">
            <SheetTitle>İstifadəçini redaktə et</SheetTitle>
            {/* Description <p> render edir — içində Badge (div) olduğu üçün div kimi */}
            <SheetDescription asChild>
              <div>
                {data ? (
                  <span className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="font-medium">
                      {USER_ROLE_LABELS[data.role] || data.role}
                    </Badge>
                    <span>Qeydiyyat: {formatDate(data.createdAt)}</span>
                  </span>
                ) : (
                  "Yüklənir…"
                )}
              </div>
            </SheetDescription>
          </SheetHeader>

          {user.isLoading || (!data && !user.isError) ? (
            <div className="space-y-4 p-6">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : user.isError ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
              <p className="font-medium">İstifadəçi yüklənmədi</p>
              <p className="text-sm text-muted-foreground">{apiErrorMessage(user.error)}</p>
              <Button variant="outline" size="sm" onClick={() => user.refetch()}>
                Yenidən cəhd et
              </Button>
            </div>
          ) : (
            <form id="user-edit-form" noValidate onSubmit={submit} className="flex-1 space-y-6 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat label="Sifariş" value={data.stats.orders} />
                <Stat label="Rəy" value={data.stats.reviews} />
                <Stat label="Seans" value={data.stats.sessions + data.stats.therapistSessions} />
                <Stat label="Məhsul" value={data.stats.products} />
              </div>

              {data.therapistId && (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to={`/admin/therapists/${data.therapistId}`}>
                    <ExternalLink />
                    Terapevt profilini redaktə et
                  </Link>
                </Button>
              )}

              <ImageUploadField
                label="Profil şəkli"
                currentUrl={data.avatar || null}
                value={state.avatar}
                onChange={(avatar) => set({ avatar })}
              />

              <div className="space-y-2">
                <Label htmlFor="user-name">
                  Ad, soyad <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="user-name"
                  value={state.fullName}
                  onChange={(e) => set({ fullName: e.target.value })}
                  aria-invalid={!!visibleErrors.fullName}
                  className={cn(visibleErrors.fullName && "border-destructive focus-visible:ring-destructive")}
                />
                {visibleErrors.fullName && <p className="text-xs text-destructive">{visibleErrors.fullName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="user-email"
                  type="email"
                  value={state.email}
                  onChange={(e) => set({ email: e.target.value })}
                  aria-invalid={!!visibleErrors.email}
                  className={cn(visibleErrors.email && "border-destructive focus-visible:ring-destructive")}
                />
                {visibleErrors.email ? (
                  <p className="text-xs text-destructive">{visibleErrors.email}</p>
                ) : (
                  state.email.trim() !== data.email && (
                    <p className="text-xs text-amber-700">İstifadəçi bundan sonra yeni emaillə daxil olacaq — ona xəbər verin.</p>
                  )
                )}
              </div>

              <div className="flex items-start justify-between gap-4 rounded-md border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="user-email-verified" className="cursor-pointer">
                    Email təsdiqlənib
                  </Label>
                  <p className="text-xs text-muted-foreground">Təsdiqlənməmiş hesab sistemə daxil ola bilmir</p>
                </div>
                <Switch
                  id="user-email-verified"
                  checked={state.isEmailVerified}
                  onCheckedChange={(isEmailVerified) => set({ isEmailVerified })}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="user-description">Haqqında</Label>
                  <span
                    className={cn(
                      "text-xs tabular-nums text-muted-foreground",
                      state.description.length > DESCRIPTION_MAX && "text-destructive",
                    )}
                  >
                    {state.description.length}/{DESCRIPTION_MAX}
                  </span>
                </div>
                <Textarea
                  id="user-description"
                  rows={4}
                  value={state.description}
                  onChange={(e) => set({ description: e.target.value })}
                  aria-invalid={!!visibleErrors.description}
                  className={cn(visibleErrors.description && "border-destructive focus-visible:ring-destructive")}
                />
                {visibleErrors.description && <p className="text-xs text-destructive">{visibleErrors.description}</p>}
              </div>

              <Separator />

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-destructive">Hesabı sil</h3>
                <p className="text-xs text-muted-foreground">
                  {blockReason ||
                    `Hesab birdəfəlik silinir: rəyləri, səbəti və istək siyahısı da silinəcək.${
                      data.therapistId ? " Terapevt profili və sənədləri də silinəcək." : ""
                    } Pasiyent kimi seansları tarixçədə qalır.`}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  disabled={!!blockReason || remove.isPending}
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 />
                  Hesabı sil
                </Button>
              </section>
            </form>
          )}

          <SheetFooter className="border-t p-4">
            <Button type="button" variant="outline" onClick={requestClose} disabled={save.isPending}>
              Bağla
            </Button>
            <Button type="submit" form="user-edit-form" disabled={!dirty || save.isPending}>
              {save.isPending && <Loader2 className="animate-spin" />}
              Yadda saxla
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title="Dəyişikliklər yadda saxlanmayıb"
        description="Bağlasanız, etdiyiniz dəyişikliklər itəcək."
        confirmLabel="Bağla"
        cancelLabel="Redaktəyə qayıt"
        destructive
        onConfirm={() => {
          setConfirmDiscard(false)
          onOpenChange(false)
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={(next) => !remove.isPending && setConfirmDelete(next)}
        title={`${data?.fullName ?? ""} hesabı silinsin?`}
        description={`Bu əməliyyat geri qaytarıla bilməz. Hesab, rəyləri, səbəti və istək siyahısı${
          data?.therapistId ? ", terapevt profili və sənədləri" : ""
        } birdəfəlik silinəcək.`}
        confirmLabel="Hesabı sil"
        destructive
        pending={remove.isPending}
        onConfirm={runDelete}
      />
    </>
  )
}
