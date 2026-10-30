import { useMemo, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import i18next from "i18next"
import { formatPrice, formatPriceUsd } from "../../lib/format"
import { cn } from "@/lib/utils"
import { getTherapistById } from "../../services/therapist.service"
import { getAvailabilitySummary, createSession } from "../../services/therapySession.service"
import { useAuthStore } from "../../store/useAuthStore"
import { toast } from "../../store/useToastStore"
import { safeGet } from "../../lib/safeData"
import { safeExternalUrl } from "../../lib/utils"
import SEO from "../../components/common/SEO"
import { getTherapistSchema } from "../../utils/seoSchemas"
import { BASE_URL } from "../../utils/seoTranslations"
import { Badge } from "../../components/ui/Badge"
import { Button } from "../../components/ui/Button"
import {
  Activity,
  ArrowLeft,
  Award,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  User,
} from "lucide-react"

// Gün adları render zamanı tərcümə olunur (modul yüklənəndə i18n hələ hazır deyil və ingiliscə qalırdı)
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
// Ay adları: Chrome az-AZ üçün ay adlarını bilmir ("2026 M10" çıxırdı)
const MONTH_KEYS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=900&q=80"

const toIsoDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const toDisplayDate = (isoDate) => {
  if (!isoDate) return ""
  const [year, month, day] = isoDate.split("-")
  return `${day}.${month}.${year}`
}

const normalizeDate = (value) => {
  if (!value) return ""
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(value)) {
    const [day, month, year] = value.split(".")
    return `${year}-${month}-${day}`
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ""
  return toIsoDate(parsed)
}

const getSlotTime = (slot) => {
  if (typeof slot === "string") return slot.slice(0, 5)

  const rawTime = slot?.hour || slot?.time
  if (typeof rawTime === "string") return rawTime.slice(0, 5)

  const start = slot?.startTime || slot?.StartTime
  if (!start) return ""

  if (typeof start === "string" && /^\d{2}:\d{2}/.test(start)) return start.slice(0, 5)
  if (typeof start === "string") {
    const timeMatch = start.match(/T(\d{2}:\d{2})/)
    if (timeMatch?.[1]) return timeMatch[1]
  }

  const parsed = new Date(start)
  if (Number.isNaN(parsed.getTime())) return ""

  return parsed.toLocaleTimeString("az-AZ", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  })
}

const getInitials = (name) =>
  (name || "Ş")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()

const normalizeTherapist = (therapist) => {
  const data = therapist?.data || therapist || {}
  const user = data.user || data.User || {}
  const userId = data.userId || data.UserId || user.id || user.Id
  // Yalnız API datası — admin redaktələri brauzerdəki köhnə localStorage ilə əzilməsin
  const rawName = data.fullName || data.FullName || user.fullName || user.FullName || ""
  const fullName = rawName && !rawName.includes("@") ? rawName : i18next.t("therapist.unnamed", "Fitoterapevt")

  return {
    id: data.id || data.Id,
    userId,
    fullName,
    email: data.email || data.Email || user.email || user.Email || "",
    phone: data.phoneNumber || data.PhoneNumber || data.phone || "",
    specialization: data.specialization || data.Specialization || "Fitoterapevt",
    // Qısa məlumat yuxarıda (adın altında), geniş "Haqqında" isə aşağı bölmədə
    shortBio: (data.shortBio || data.ShortBio || "").trim(),
    bio: (data.bio || data.Bio || data.description || data.Description || "").trim(),
    avatar: data.avatar || data.Avatar || user.avatar || user.Avatar || "",
    rating: Number(data.rating || data.Rating || 0),
    reviewsCount: Number(data.reviewsCount || data.ReviewsCount || data.reviewCount || 0),
    cv: data.cv || data.CV || "",
    certificates: data.certificates || data.Certificates || [],
    isVerified: Boolean(data.isVerified ?? data.IsVerified ?? data.verified ?? false),
    isEmailVerified: Boolean(data.isEmailVerified ?? data.IsEmailVerified),
    onlinePrice: Number(data.onlinePrice ?? 0),
    offlinePrice: Number(data.offlinePrice ?? 0),
    sessionDurationInMinutes: data.sessionDurationInMinutes || 60,
    createdAt: data.createdAt || data.CreatedAt || "",
  }
}

const normalizeAvailability = (availability) => {
  const list = Array.isArray(availability) ? availability : availability?.data || []

  return list.reduce((acc, item) => {
    const isoDate = normalizeDate(item?.date || item?.Date)
    if (!isoDate) return acc

    const slots = (item?.slots || item?.Slots || [])
      .map((slot) => ({
        raw: slot,
        time: getSlotTime(slot),
        isAvailable: slot?.isAvailable ?? slot?.IsAvailable ?? true,
      }))
      .filter((slot) => slot.time && slot.isAvailable)

    acc[isoDate] = {
      date: isoDate,
      isAvailable: slots.length > 0 || Boolean(item?.isAvailable ?? item?.IsAvailable),
      slots,
    }

    return acc
  }, {})
}

const buildFallbackAvailability = (year, month, today) => {
  return {} // No longer providing fake fallback slots
}

export default function TherapistDetailPage() {
  const { id } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()

  const today = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [])

  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [isOnline, setIsOnline] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1)
  const [currentYear, setCurrentYear] = useState(today.getFullYear())

  const { data: therapist, isLoading: loadingTherapist, isError } = useQuery({
    queryKey: ["therapist", id],
    queryFn: () => getTherapistById(id),
    enabled: Boolean(id),
  })

  const { data: availability, isLoading: loadingAvailability } = useQuery({
    queryKey: ["availability", id, currentYear, currentMonth],
    queryFn: () => getAvailabilitySummary(id, currentYear, currentMonth),
    enabled: Boolean(id),
  })

  const profile = useMemo(() => normalizeTherapist(therapist), [therapist])
  const normalizedAvailability = useMemo(() => normalizeAvailability(availability), [availability])
  const usingFallbackAvailability = Object.keys(normalizedAvailability).length === 0

  const availabilityByDate = useMemo(() => {
    const normalized = normalizeAvailability(availability)
    if (Object.keys(normalized).length > 0) return normalized
    return buildFallbackAvailability(currentYear, currentMonth, today)
  }, [availability, currentMonth, currentYear, today])

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1)
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
    const days = Array.from({ length: startingDayOfWeek }, () => null)

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(currentYear, currentMonth - 1, day)
      const isoDate = toIsoDate(date)
      const availabilityData = availabilityByDate[isoDate]

      days.push({
        day,
        date: isoDate,
        isToday: isoDate === toIsoDate(today),
        isPast: date < today,
        isAvailable: Boolean(availabilityData?.isAvailable),
        slots: availabilityData?.slots || [],
      })
    }

    return days
  }, [availabilityByDate, currentMonth, currentYear, today])

  const selectedDayData = calendarDays.find((day) => day?.date === selectedDate)
  const selectedSlots = selectedDayData?.slots || []

  const nextAvailableDay = calendarDays.find((day) => day?.isAvailable && !day.isPast)

  const { mutate: bookSession, isPending: booking } = useMutation({
    mutationFn: createSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions", "my"] })
      queryClient.invalidateQueries({ queryKey: ["availability", id] })
      toast.success(t("therapists.booking_success", "Seans müraciətiniz göndərildi"))
      navigate("/user/sessions")
    },
    onError: (err) =>
      toast.error(err?.message || t("therapists.booking_error", "Seansı bron etmək alınmadı")),
  })

  const changeMonth = (offset) => {
    let nextMonth = currentMonth + offset
    let nextYear = currentYear

    if (nextMonth > 12) {
      nextMonth = 1
      nextYear += 1
    }

    if (nextMonth < 1) {
      nextMonth = 12
      nextYear -= 1
    }

    setCurrentMonth(nextMonth)
    setCurrentYear(nextYear)
    setSelectedDate(null)
    setSelectedSlot(null)
  }

  const handleDateSelect = (day) => {
    if (!day?.isAvailable || day.isPast) return
    setSelectedDate(day.date)
    setSelectedSlot(null)
  }

  const handleBook = () => {
    if (!isAuthenticated) {
      toast.info(t("auth.login_required_booking", "Seans üçün hesaba daxil olun"))
      navigate("/login")
      return
    }

    if (!selectedDate || !selectedSlot) {
      toast.info(t("therapists.pick_time", "Tarix və saat seçin"))
      return
    }

    bookSession({
      therapistId: id,
      date: toDisplayDate(selectedDate),
      hour: selectedSlot,
      isOnline,
      therapistSnapshot: {
        id,
        fullName: profile.fullName,
        specialization: profile.specialization,
        avatar: profile.avatar,
      },
    })
  }

  if (loadingTherapist) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white px-5 py-4 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
          <span className="text-sm font-semibold text-stone-700">{t('therapists.loading_profile', 'Mütəxəssis məlumatları yüklənir')}</span>
        </div>
      </div>
    )
  }

  if (isError || !profile?.id) {
    return (
      <div className="min-h-screen bg-stone-50 px-4 py-20">
        <div className="mx-auto max-w-xl rounded-lg border border-rose-200 bg-white p-8 text-center shadow-sm">
          <User className="mx-auto mb-4 h-12 w-12 text-rose-400" />
          <h1 className="text-2xl font-semibold text-stone-900">{t('therapists.not_found', 'Terapevt tapılmadı')}</h1>
          <p className="mt-2 text-sm text-stone-500">{t('therapists.not_found_desc', 'Bu profil silinmiş və ya artıq menyuda göstərilmir.')}</p>
          <Button onClick={() => navigate("/therapists")} className="mt-6 bg-emerald-700 text-white hover:bg-emerald-800">
            {t('therapists.back_to_list', 'Siyahıya qayıt')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-stone-900">
      <SEO
        title={`${profile.fullName} - ${profile.specialization}`}
        description={profile.shortBio || profile.bio || `${profile.fullName} - ${profile.specialization}`}
        keywords={`${profile.fullName}, ${profile.specialization}, fitoterapist, fitoterapiya, shafransa`}
        image={profile.avatar}
        canonical={`/therapist/${id}`}
        type="profile"
        schema={getTherapistSchema(profile, `${BASE_URL}/therapist/${id}`)}
        crumbs={[
          { name: "Home", url: "/" },
          { name: "Therapists", url: "/therapists" },
          { name: profile.fullName, url: `/therapist/${id}` }
        ]}
      />
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex h-9 items-center gap-2 rounded-md border border-stone-200 bg-white px-3 text-xs font-medium text-stone-600 transition hover:border-emerald-500 hover:text-emerald-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('common.back', 'Geri qayıt')}
          </button>

          <div className="grid gap-7 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
            <div className="grid gap-6 md:grid-cols-[180px_1fr] md:items-end">
              <div className="relative h-[210px] overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm md:h-[230px]">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.fullName}
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.src = DEFAULT_AVATAR
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-emerald-50 text-4xl font-semibold text-emerald-700">
                    {getInitials(profile.fullName)}
                  </div>
                )}
                {profile.isVerified && (
                  <div className="absolute left-3 top-3 rounded-md bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 shadow-sm">
                    {t('therapists.verified_badge', 'Təsdiqli')}
                  </div>
                )}
              </div>

              <div className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  <Badge className="rounded-md border-emerald-200 bg-emerald-50 text-emerald-800">
                    <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                    {t('therapists.verified_by', 'Shafransa tərəfindən təsdiqlənib')}
                  </Badge>
                </div>

                <div>
                  <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-stone-900 lg:text-5xl">
                    {profile.fullName}
                  </h1>
                  <p className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald-700">
                    <Stethoscope className="h-4 w-4" />
                    {profile.specialization}
                  </p>
                </div>

                {(profile.shortBio || profile.bio) && (
                  <p className={cn("max-w-3xl text-base leading-7 text-stone-600", !profile.shortBio && "line-clamp-3")}>
                    {profile.shortBio || profile.bio}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
              <div className="border-r border-stone-200 p-5">
                <div className="flex items-center gap-1.5 text-amber-500">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-xl font-semibold text-stone-900">{profile.rating > 0 ? profile.rating.toFixed(1) : "—"}</span>
                </div>
              
              </div>
              <div className="border-r border-stone-200 p-5">
                <div className="text-xl font-semibold text-stone-900">{profile.sessionDurationInMinutes}</div>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-stone-500">{t('therapists.minutes_label', 'Dəqiqə')}</p>
              </div>
              <div className="p-5">
                <div className="text-xl font-semibold text-emerald-700">{formatPrice(isOnline ? profile.onlinePrice : profile.offlinePrice)}</div>
                <div className="text-xs font-medium text-stone-500 tabular-nums">≈ {formatPriceUsd(isOnline ? profile.onlinePrice : profile.offlinePrice)}</div>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-stone-500">{t('therapists.price_label', 'Qiymət')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1fr_420px] lg:px-8">
        <div className="space-y-6">
          {profile.bio && (
            <section className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                  <Sparkles className="h-[18px] w-[18px]" />
                </div>
                <h2 className="text-lg font-semibold text-stone-900">{t('therapists.about_title', 'Haqqında')}</h2>
              </div>
              <p className="whitespace-pre-line text-sm leading-7 text-stone-600">{profile.bio}</p>
            </section>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: Activity, title: t('therapists.steps.evaluation', 'Qiymətləndirmə'), text: t('therapists.steps.evaluation_desc', 'İlk görüşdə şikayət, hərəkət və gündəlik rutin analiz olunur.') },
              { icon: Calendar, title: t('therapists.steps.plan', 'Plan'), text: t('therapists.steps.plan_desc', 'Seanslar real qrafikə uyğun ardıcıllıqla qurulur.') },
              { icon: CheckCircle2, title: t('therapists.steps.tracking', 'İzləmə'), text: t('therapists.steps.tracking_desc', 'Proqres sadə tapşırıqlar və növbəti addımlarla davam edir.') },
            ].map((item) => (
              <article key={item.title} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
                <item.icon className="mb-4 h-5 w-5 text-emerald-700" />
                <h3 className="font-semibold text-stone-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-500">{item.text}</p>
              </article>
            ))}
          </div>

          <section className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-50 text-amber-700">
                <Award className="h-[18px] w-[18px]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-stone-900">{t('therapists.docs_title', 'Sertifikatlar və sənədlər')}</h2>
                <p className="text-sm text-stone-500">{t('therapists.docs_subtitle', 'Profilə əlavə olunan rəsmi materiallar')}</p>
              </div>
            </div>

            {profile.certificates.length > 0 || profile.cv ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {safeExternalUrl(profile.cv) && (
                  <a
                    href={safeExternalUrl(profile.cv)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-md border border-stone-200 bg-stone-50 p-4 text-sm font-medium text-stone-700 transition hover:border-emerald-400 hover:bg-emerald-50"
                  >
                    <FileText className="h-4 w-4 text-emerald-700" />
                    {t('therapists.cv_file', 'CV faylı')}
                  </a>
                )}

                {profile.certificates.map((certificate, index) => {
                  const url = safeExternalUrl(certificate.fileUrl || certificate.FileUrl)
                  if (!url) return null
                  const name = certificate.name || certificate.Name || `${t('therapists.certificate_prefix', 'Sertifikat')} ${index + 1}`

                  return (
                    <a
                      key={certificate.id || certificate.Id || name}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-md border border-stone-200 bg-stone-50 p-4 text-sm font-medium text-stone-700 transition hover:border-emerald-400 hover:bg-emerald-50"
                    >
                      <FileText className="h-4 w-4 text-emerald-700" />
                      {name}
                    </a>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-stone-300 bg-stone-50 p-5 text-sm text-stone-500">
                {t('therapists.no_docs', 'Bu profil üçün sənəd hələ əlavə edilməyib.')}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-900">{t('therapists.contact_info', 'Əlaqə məlumatları')}</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-md border border-stone-200 bg-stone-50 p-4">
                <Mail className="h-4 w-4 text-emerald-700" />
                <span className="min-w-0 truncate text-sm font-medium text-stone-700">
                  {profile.email || t('therapists.no_email', 'Email göstərilməyib')}
                </span>
              </div>
              <div className="flex items-center gap-3 rounded-md border border-stone-200 bg-stone-50 p-4">
                <Phone className="h-4 w-4 text-emerald-700" />
                <span className="text-sm font-medium text-stone-700">{profile.phone || t('therapists.no_phone', 'Telefon göstərilməyib')}</span>
              </div>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-stone-900">{t('therapists.book_session', 'Seans bron et')}</h2>
                <p className="mt-1 text-sm text-stone-500">
                  {t('therapists.select_date_time', 'Tarixi və uyğun saatı seçin')}
                </p>
              </div>
              <div className="rounded-md bg-emerald-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                {profile.sessionDurationInMinutes} {t('therapists.mins_short', 'dəq')}
              </div>
            </div>

            {/* Online/Offline Choice */}
            <div className="mb-6 grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-xl">
               <button 
                  onClick={() => setIsOnline(true)}
                  className={`h-10 rounded-lg text-xs font-bold transition-all ${isOnline ? "bg-white text-[#1a1c1e] shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
               >
                  {t('therapists.online_label', 'Onlayn')} ({formatPrice(profile.onlinePrice)})
               </button>
               <button 
                  onClick={() => setIsOnline(false)}
                  className={`h-10 rounded-lg text-xs font-bold transition-all ${!isOnline ? "bg-white text-[#1a1c1e] shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
               >
                  {t('therapists.offline_label', 'Əyani')} ({formatPrice(profile.offlinePrice)})
               </button>
            </div>

            <div className="rounded-lg border border-stone-200 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold capitalize text-stone-900">
                  {t(`therapist.months.${MONTH_KEYS[currentMonth - 1]}`)} {currentYear}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => changeMonth(-1)}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-stone-200 transition hover:border-emerald-500 hover:text-emerald-700"
                    aria-label="Əvvəlki ay"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => changeMonth(1)}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-stone-200 transition hover:border-emerald-500 hover:text-emerald-700"
                    aria-label="Növbəti ay"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-wide text-stone-400">
                {DAY_KEYS.map((key) => t(`therapist.days.${key}`)).map((label) => (
                  <div key={label} className="py-2">
                    {label}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  if (!day) return <div key={`empty-${index}`} className="aspect-square" />

                  const isSelected = selectedDate === day.date
                  const isDisabled = !day.isAvailable || day.isPast || loadingAvailability

                  return (
                    <button
                      key={day.date}
                      disabled={isDisabled}
                      onClick={() => handleDateSelect(day)}
                      className={[
                        "relative aspect-square rounded-md border text-xs font-semibold transition",
                        isSelected
                          ? "border-emerald-700 bg-emerald-700 text-white"
                          : "border-stone-200 bg-white text-stone-700 hover:border-emerald-500 hover:bg-emerald-50",
                        day.isToday && !isSelected ? "ring-2 ring-amber-300" : "",
                        isDisabled ? "cursor-not-allowed bg-stone-50 text-stone-300 hover:border-stone-200 hover:bg-stone-50" : "",
                      ].join(" ")}
                    >
                      {day.day}
                      {day.isAvailable && !day.isPast && (
                        <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-emerald-500" />
                      )}
                    </button>
                  )
                })}
              </div>

              {loadingAvailability && (
                <div className="mt-4 flex items-center gap-2 rounded-md bg-stone-50 px-3 py-3 text-sm font-semibold text-stone-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('therapists.checking_slots', 'Boş saatlar yoxlanılır')}
                </div>
              )}
            </div>

            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">{t('therapists.slots_title', 'Saatlar')}</h3>
                {selectedDate && <span className="text-sm font-medium text-emerald-700">{toDisplayDate(selectedDate)}</span>}
              </div>

              {!selectedDate ? (
                <div className="rounded-md border border-dashed border-stone-300 bg-stone-50 p-4 text-sm leading-6 text-stone-500">
                  {nextAvailableDay
                    ? `${t('therapists.next_available_date', 'Ən yaxın boş tarix')}: ${toDisplayDate(nextAvailableDay.date)}`
                    : t('therapists.no_slots_month', 'Bu ay üçün boş vaxt görünmür. Növbəti ayı yoxla.')}
                </div>
              ) : selectedSlots.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {selectedSlots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => setSelectedSlot(slot.time)}
                      className={[
                        "flex h-10 items-center justify-center rounded-md border text-xs font-semibold transition",
                        selectedSlot === slot.time
                          ? "border-emerald-700 bg-emerald-700 text-white"
                          : "border-stone-200 bg-white text-stone-700 hover:border-emerald-500 hover:bg-emerald-50",
                      ].join(" ")}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-stone-300 bg-stone-50 p-4 text-sm text-stone-500">
                  {t('therapists.no_slots_day', 'Bu tarix üçün boş saat qalmayıb.')}
                </div>
              )}
            </div>

            <Button
              onClick={handleBook}
              disabled={!selectedDate || !selectedSlot || booking}
              className="mt-5 h-11 w-full rounded-md bg-emerald-700 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              {booking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.booking_submitting', 'Göndərilir')}
                </>
              ) : (
                <>
                  <Clock className="mr-2 h-4 w-4" />
                  {t('therapists.book_session', 'Seansı bron et')}
                </>
              )}
            </Button>

            <p className="mt-4 rounded-md bg-stone-50 border border-stone-100 p-3 text-[10px] font-bold uppercase tracking-widest text-stone-400">
              {t('therapists.booking_disclaimer', 'Müraciət göndərildikdən sonra seans terapevt tərəfindən təsdiqlənməlidir.')}
            </p>
          </div>
        </aside>
      </main>
    </div>
  )
}
