import { useState, useEffect } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import i18next from "i18next"
import { getVerifiedTherapists } from "../../services/therapist.service"
import { Badge } from "../../components/ui/Badge"
import { Search, User, MapPin, Star, X, ShieldCheck, Calendar, Clock, DollarSign } from "lucide-react"
import SEO from "../../components/common/SEO"
import { STATIC_PAGE_SEO } from "../../utils/seoTranslations"

const LOCAL_AVATAR_KEY = "shafransa_local_profile_avatar"
const LOCAL_PROFILE_KEY = "shafransa_local_profile_data"
const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=900&q=80"

const getLocalAvatar = (userId) => {
  if (!userId) return ""
  try {
    return localStorage.getItem(`${LOCAL_AVATAR_KEY}_${userId}`) || ""
  } catch {
    return ""
  }
}

const getLocalProfile = (userId) => {
  if (!userId) return {}
  try {
    return JSON.parse(localStorage.getItem(`${LOCAL_PROFILE_KEY}_${userId}`) || "{}")
  } catch {
    return {}
  }
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
  const user = therapist?.user || therapist?.User || {}
  const userId = therapist?.userId || therapist?.UserId || user.id || user.Id
  const localProfile = getLocalProfile(userId)
  const rawName = therapist?.fullName || therapist?.FullName || user.fullName || user.FullName || ""
  const fullName = localProfile.fullName || (rawName && !rawName.includes("@") ? rawName : "Zakir Aliyev")

  return {
    ...therapist,
    id: therapist?.id || therapist?.Id,
    userId,
    fullName,
    specialization: localProfile.specialization || therapist?.specialization || therapist?.Specialization || i18next.t('therapist.specialization_default', "Physiotherapist"),
    description:
      localProfile.therapistBio ||
      localProfile.description ||
      therapist?.description ||
      therapist?.Description ||
      therapist?.bio ||
      therapist?.Bio ||
      i18next.t('therapist.bio_default', "Helping you return to healthy movement with personalized recovery plans and careful session tracking."),
    avatar:
      getLocalAvatar(userId) ||
      therapist?.avatar ||
      therapist?.Avatar ||
      user.avatar ||
      user.Avatar ||
      "",
    rating: Number(therapist?.rating || therapist?.Rating || 0),
    reviewsCount: Number(therapist?.reviewsCount || therapist?.reviewCount || therapist?.ReviewCount || 0),
    onlinePrice: therapist?.onlinePrice || therapist?.OnlinePrice || 0,
    offlinePrice: therapist?.offlinePrice || therapist?.OfflinePrice || 0,
    sessionDurationInMinutes: therapist?.sessionDurationInMinutes || therapist?.SessionDurationInMinutes || 60,
  }
}

export default function TherapistListingPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "")
  const [debouncedSearch, setDebouncedSearch] = useState(searchInput)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    setSearchParams((currentParams) => {
      const params = new URLSearchParams(currentParams)
      if (debouncedSearch) params.set("search", debouncedSearch)
      else params.delete("search")
      return params
    }, { replace: true })
  }, [debouncedSearch, setSearchParams])

  const { data, isLoading, error } = useQuery({
    queryKey: ["therapists", "verified"],
    queryFn: getVerifiedTherapists,
  })

  const therapistsList = (Array.isArray(data) ? data : (data?.data || [])).map(normalizeTherapist)
  
  const filteredTherapists = therapistsList.filter(therapist => {
    const searchLower = debouncedSearch.toLowerCase()
    return (
      therapist.fullName?.toLowerCase().includes(searchLower) ||
      therapist.description?.toLowerCase().includes(searchLower) ||
      therapist.specialization?.toLowerCase().includes(searchLower)
    )
  })

  const hasFilters = debouncedSearch

  const currentLangCode = (i18next.language || 'az').toLowerCase().slice(0, 2)
  const seoData = STATIC_PAGE_SEO.therapists[currentLangCode] || STATIC_PAGE_SEO.therapists.az

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <SEO 
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        canonical="/therapists"
        crumbs={[{ name: "Home", url: "/" }, { name: "Therapists", url: "/therapists" }]}
      />
      
      {/* Hero Section */}
      <div className="bg-[#1a1c1e] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold uppercase tracking-widest text-[10px] px-3 mb-3">
            {t('therapists.badge', 'Verified Professionals')}
          </Badge>
          <h1 className="text-5xl lg:text-6xl font-display font-bold tracking-tight leading-none">
            {t('therapists.title_p1', 'Find Your')}<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              {t('therapists.title_p2', 'Physiotherapist')}
            </span>
          </h1>
          <p className="text-lg text-white/50 font-medium max-w-xl mx-auto">
            {t('therapists.subtitle', 'Connect with clinically verified specialists for personalized treatment and recovery.')}
          </p>

          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto mt-8">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <input
              type="text"
              placeholder={t('therapists.search_placeholder', 'Search by name, specialty, or condition...')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full h-14 pl-14 pr-5 rounded-2xl bg-white/10 border border-white/10 text-white placeholder:text-white/30 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
            />
            {searchInput && (
              <button onClick={() => setSearchInput("")} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-12 px-4 lg:px-8">
        
        {/* Status / Filter Summary */}
        <div className="flex items-center justify-between mb-8">
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">
            {isLoading ? t('common.loading', 'Loading...') : `${filteredTherapists.length} ${t('therapists.count_label', 'Specialists Found')}`}
          </div>
          {hasFilters && (
            <button
              onClick={() => { setSearchInput(""); setSearchParams({}); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 text-sm font-bold hover:bg-rose-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> {t('common.reset_filters', 'Reset Filters')}
            </button>
          )}
        </div>

        {/* Results Grid */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-3xl border border-neutral-100 bg-white h-[400px]" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-32 rounded-3xl border-2 border-dashed border-rose-100 bg-rose-50/30">
            <p className="font-bold text-rose-500">{t('therapists.error', 'Failed to load specialists')}</p>
            <button onClick={() => window.location.reload()} className="mt-4 text-sm font-bold text-primary hover:underline">{t('common.retry', 'Retry')}</button>
          </div>
        ) : filteredTherapists.length === 0 ? (
          <div className="text-center py-32 rounded-3xl border-2 border-dashed border-neutral-200 bg-neutral-50">
            <User className="mx-auto w-12 h-12 text-muted-foreground/20 mb-4" />
            <p className="font-bold text-xl text-[#1a1c1e]">{t('therapists.no_results', 'No specialists found')}</p>
            <p className="text-muted-foreground text-sm mt-2">{t('therapists.no_results_sub', 'Try a different search term or clear filters.')}</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTherapists.map((therapist) => (
              <TherapistCard key={therapist.id} therapist={therapist} t={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TherapistCard({ therapist, t }) {
  return (
    <Link to={`/therapist/${therapist.id}`} className="group block h-full">
      <div className="h-full rounded-3xl overflow-hidden border border-neutral-100 bg-white hover:shadow-2xl hover:shadow-black/8 hover:border-emerald-200 transition-all duration-500 flex flex-col">
        
        {/* Avatar Area */}
        <div className="relative aspect-[1.1/1] bg-[#f5f5f7] overflow-hidden">
          {therapist.avatar ? (
            <img
              src={therapist.avatar}
              alt={therapist.fullName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              onError={(event) => {
                event.currentTarget.src = DEFAULT_AVATAR
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-4xl font-semibold text-emerald-700">
              {getInitials(therapist.fullName)}
            </div>
          )}
          <div className="absolute top-3 left-3">
             <Badge className="bg-white/90 backdrop-blur text-emerald-600 border-emerald-100 text-[9px] font-bold shadow-sm">
                <ShieldCheck className="w-3 h-3 mr-1" /> VERIFIED
             </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 flex-1 flex flex-col">
          <div className="flex-1">
            <h3 className="font-display font-bold text-xl text-[#1a1c1e] group-hover:text-emerald-600 transition-colors">
              {therapist.fullName}
            </h3>
            <p className="text-emerald-600 text-sm font-bold mt-1">
              {therapist.specialization || t('therapists.default_specialty', 'Physiotherapist')}
            </p>
            <p className="text-muted-foreground text-sm mt-3 line-clamp-3 leading-relaxed">
              {therapist.description || t('therapists.no_description', 'Qualified specialist dedicated to your recovery and physical well-being.')}
            </p>
          </div>

          <div className="space-y-3 pt-4 border-t border-neutral-50">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#1a1c1e]">
                  <Star className={`w-3.5 h-3.5 ${therapist.rating > 0 ? "text-amber-400 fill-current" : "text-neutral-200"}`} />
                  {therapist.rating > 0 ? therapist.rating.toFixed(1) : "—"}
                  <span className="text-muted-foreground/40 font-medium">({therapist.reviewsCount || "0"})</span>
                </div>
               <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> ₼{therapist.onlinePrice}
               </div>
               <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {therapist.sessionDurationInMinutes}m
               </div>
            </div>

            <button className="w-full h-11 rounded-2xl bg-[#1a1c1e] text-white text-sm font-bold flex items-center justify-center gap-2 group-hover:bg-emerald-600 transition-all shadow-lg shadow-black/5 group-hover:shadow-emerald-200">
               <Calendar className="w-4 h-4" />
               {t('therapists.book_now', 'Book Session')}
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}
