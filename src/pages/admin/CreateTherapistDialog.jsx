import { useState } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/admin/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/dialog"
import { Input } from "@/components/admin/ui/input"
import { Label } from "@/components/admin/ui/label"
import { Switch } from "@/components/admin/ui/switch"
import { Textarea } from "@/components/admin/ui/textarea"
import { cn } from "@/lib/utils"

// Backend EmailRules.Pattern ilə eyni qayda
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/

const SHORT_BIO_MAX = 500

const EMPTY = {
  fullName: "",
  email: "",
  password: "",
  phoneNumber: "",
  specialization: "",
  shortBio: "",
  bio: "",
  isShowMenu: true,
}

function validate(form) {
  const errors = {}
  if (form.fullName.trim().length < 2) errors.fullName = "Ad ən azı 2 simvol olmalıdır."
  if (!EMAIL_RE.test(form.email.trim())) errors.email = "Düzgün email daxil edin."
  if (form.password.length < 8) errors.password = "Parol ən azı 8 simvol olmalıdır."
  if (!/^\+?[\d\s()-]{7,30}$/.test(form.phoneNumber.trim())) errors.phoneNumber = "Düzgün telefon nömrəsi daxil edin."
  if (form.shortBio.trim().length > SHORT_BIO_MAX) errors.shortBio = `Ən çox ${SHORT_BIO_MAX} simvol ola bilər.`
  return errors
}

// Admin fitoterapevti birbaşa yaradır (müraciət/OTP olmadan, dərhal təsdiqlənmiş).
// Şəkil, qiymət və iş saatları yaradıldıqdan sonra redaktorda doldurulur.
export function CreateTherapistDialog({ open, onOpenChange, onSubmit, saving }) {
  const [form, setForm] = useState(EMPTY)
  const [touched, setTouched] = useState(false)
  const errors = validate(form)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const close = (next) => {
    if (saving) return
    if (!next) {
      setForm(EMPTY)
      setTouched(false)
    }
    onOpenChange(next)
  }

  const submit = (e) => {
    e.preventDefault()
    setTouched(true)
    if (Object.keys(errors).length) return
    onSubmit({
      ...form,
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim(),
      specialization: form.specialization.trim() || null,
      shortBio: form.shortBio.trim() || null,
      bio: form.bio.trim() || null,
    }, () => close(false))
  }

  const field = (key, label, props = {}) => (
    <div className="space-y-2">
      <Label htmlFor={`new-therapist-${key}`}>{label}</Label>
      <Input
        id={`new-therapist-${key}`}
        value={form[key]}
        onChange={set(key)}
        aria-invalid={touched && !!errors[key]}
        className={cn(touched && errors[key] && "border-destructive focus-visible:ring-destructive")}
        {...props}
      />
      {touched && errors[key] && <p className="text-xs text-destructive">{errors[key]}</p>}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={submit} noValidate>
          <DialogHeader>
            <DialogTitle>Yeni fitoterapevt</DialogTitle>
            <DialogDescription>
              Hesab dərhal təsdiqlənmiş yaradılır. Fitoterapevt bu email və parolla daxil ola bilər.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-6 sm:grid-cols-2">
            <div className="sm:col-span-2">{field("fullName", "Ad, soyad", { autoFocus: true })}</div>
            {field("email", "Email", { type: "email", autoComplete: "off" })}
            {field("password", "Parol", { type: "text", autoComplete: "new-password" })}
            {field("phoneNumber", "Telefon", { type: "tel", placeholder: "+994 50 000 00 00" })}
            {field("specialization", "İxtisas", { placeholder: "məs. Klinik fitoterapiya" })}
            <div className="space-y-2 sm:col-span-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="new-therapist-shortBio">Qısa məlumat</Label>
                <span className="text-xs tabular-nums text-muted-foreground">{form.shortBio.length}/{SHORT_BIO_MAX}</span>
              </div>
              <Textarea
                id="new-therapist-shortBio"
                rows={2}
                value={form.shortBio}
                onChange={set("shortBio")}
                placeholder="Profilin yuxarısında, adın altında görünür (1-3 cümlə)"
                aria-invalid={touched && !!errors.shortBio}
                className={cn(touched && errors.shortBio && "border-destructive focus-visible:ring-destructive")}
              />
              {touched && errors.shortBio && <p className="text-xs text-destructive">{errors.shortBio}</p>}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="new-therapist-bio">Haqqında (geniş məlumat)</Label>
              <Textarea id="new-therapist-bio" rows={5} value={form.bio} onChange={set("bio")} placeholder="Profilin aşağısındakı «Haqqında» bölməsində görünür" />
            </div>
            <label className="flex items-center justify-between gap-4 rounded-md border p-3 sm:col-span-2">
              <span className="text-sm">
                <span className="font-medium">Saytda göstər</span>
                <span className="block text-xs text-muted-foreground">Söndürsəniz, profil hazır olana qədər gizli qalır.</span>
              </span>
              <Switch checked={form.isShowMenu} onCheckedChange={(v) => setForm((f) => ({ ...f, isShowMenu: v }))} />
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => close(false)} disabled={saving}>
              Ləğv et
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="animate-spin" />}
              Yarat və redaktə et
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
