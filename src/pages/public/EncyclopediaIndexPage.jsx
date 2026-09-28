import React, { useState, useEffect, useRef } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getPlantsPaginated } from "../../services/plant.service"
import { Badge } from "../../components/ui/Badge"
import { Loader2, Search, Leaf, FlaskConical, MapPin, BookOpen, X, Microscope, Filter } from "lucide-react"
import SEO from "../../components/common/SEO"
import { STATIC_PAGE_SEO } from "../../utils/seoTranslations"

const EVIDENCE_GRADES = ["A", "B", "C", "D"]
const CONTINENTS = ["Africa", "Asia", "Europe", "North America", "South America", "Oceania"]

const CONTINENT_VARIATIONS = {
  "africa": ["africa", "afrika", "африка"],
  "asia": ["asia", "asiya", "asya", "азия"],
  "europe": ["europe", "avropa", "avrupa", "европа"],
  "north america": ["north america", "şimali amerika", "kuzey amerika", "северная америка"],
  "south america": ["south america", "cənubi amerika", "güney amerika", "южная америка"],
  "oceania": ["oceania", "okeaniya", "okyanusya", "океания"]
}

export default function EncyclopediaIndexPage() {
  const { t, i18n } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "")
  const [debouncedSearch, setDebouncedSearch] = useState(searchInput)

  const activeGrade = searchParams.get("grade") || ""
  const activeContinent = searchParams.get("continent") || ""

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    if (debouncedSearch) params.set("search", debouncedSearch)
    else params.delete("search")
    setSearchParams(params, { replace: true })
  }, [debouncedSearch])

  const currentLang = i18n.language || 'az'

  const {
    data: plantsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: ["plants", debouncedSearch, currentLang, activeGrade, activeContinent],
    queryFn: ({ pageParam = 1 }) => getPlantsPaginated({
      search: debouncedSearch,
      language: currentLang,
      page: pageParam,
      ...(activeGrade ? { grade: activeGrade } : {}),
      ...(activeContinent ? { continent: activeContinent } : {}),
    }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage) return undefined

      // 1. Root pagination object format (from our updated API interceptor wrapper)
      const pagination = lastPage.pagination || lastPage.Pagination
      if (pagination) {
        const page = pagination.page ?? pagination.Page ?? allPages.length
        const pages = pagination.pages ?? pagination.Pages ?? 1
        return page < pages ? page + 1 : undefined
      }

      // 2. Envelope format: { data: [...], pageNumber: X, totalPages: Y }
      if (typeof lastPage === "object" && !Array.isArray(lastPage)) {
        const pageNumber = lastPage.pageNumber ?? lastPage.PageNumber ?? lastPage.page ?? lastPage.Page ?? allPages.length
        const totalPages = lastPage.totalPages ?? lastPage.TotalPages ?? lastPage.pages ?? lastPage.Pages ?? 1
        return pageNumber < totalPages ? pageNumber + 1 : undefined
      }
      // 3. Direct array format
      if (Array.isArray(lastPage)) {
        if (lastPage.length === 0) return undefined
        return allPages.length + 1
      }
      return undefined
    }
  })

  const loadMoreRef = useRef(null)

  useEffect(() => {
    let observer;
    if (hasNextPage && !isFetchingNextPage) {
      observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage()
        }
      }, { threshold: 0.1 })

      if (loadMoreRef.current) {
        observer.observe(loadMoreRef.current)
      }
    }

    const handleScroll = () => {
      if (!hasNextPage || isFetchingNextPage) return

      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollTop = window.scrollY || window.pageYOffset

      if (documentHeight - windowHeight - scrollTop < 300) {
        fetchNextPage()
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => {
      if (observer) observer.disconnect()
      window.removeEventListener("scroll", handleScroll)
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // The interceptor unwraps {statusCode, message, data} → returns raw backend payload
  const herbList = React.useMemo(() => {
    if (!plantsData?.pages) return []
    const raw = plantsData.pages.flatMap(page => {
      if (Array.isArray(page)) return page
      if (page && typeof page === "object") {
        const list = page.data ?? page.Data ?? page.items ?? page.Items
        if (Array.isArray(list)) return list
      }
      return []
    })
    return raw.map(plant => {
      if (!plant.translations || !Array.isArray(plant.translations)) return plant
      const translation = plant.translations.find(t => t.language === currentLang)
      if (!translation) return plant

      const merged = { ...plant }
      Object.keys(translation).forEach(key => {
        const val = translation[key]
        const isValid = Array.isArray(val) ? val.length > 0 : (val !== null && val !== undefined && val !== "")
        if (isValid) {
          merged[key] = val
        }
      })
      return merged
    })
  }, [plantsData, currentLang])

  const totalCount = React.useMemo(() => {
    if (!plantsData?.pages || plantsData.pages.length === 0) return null
    const firstPage = plantsData.pages[0]
    if (!firstPage) return null
    const pagination = firstPage.pagination || firstPage.Pagination
    if (pagination) {
      const t = pagination.total ?? pagination.Total
      if (t != null) return t
    }
    if (typeof firstPage === "object" && !Array.isArray(firstPage)) {
      const t = firstPage.total ?? firstPage.Total ?? firstPage.totalCount ?? firstPage.TotalCount
      if (t != null) return t
    }
    return null
  }, [plantsData])

  const filtered = herbList.filter(p => {
    if (activeGrade && !p.evidenceGrade?.trim().toUpperCase().startsWith(activeGrade.trim().toUpperCase())) return false
    if (activeContinent) {
      const selectedLower = activeContinent.toLowerCase().trim()
      const variations = CONTINENT_VARIATIONS[selectedLower] || [selectedLower]
      
      const plantContinents = (p.continent || "")
        .split(",")
        .map(c => c.toLowerCase().trim())
        .filter(Boolean)
        
      const matches = plantContinents.some(pc => variations.includes(pc))
      if (!matches) return false
    }
    return true
  })

  useEffect(() => {
    if (filtered && filtered.length === 0 && hasNextPage && !isFetchingNextPage && !isLoading) {
      fetchNextPage()
    }
  }, [filtered, hasNextPage, isFetchingNextPage, isLoading, fetchNextPage])

  function updateParam(key, value) {
    const params = new URLSearchParams(searchParams)
    if (value) params.set(key, value)
    else params.delete(key)
    setSearchParams(params, { replace: true })
  }

  const hasFilters = activeGrade || activeContinent || debouncedSearch

  const currentLangCode = (i18n.language || 'az').toLowerCase().slice(0, 2)
  const seoData = STATIC_PAGE_SEO.herbs[currentLangCode] || STATIC_PAGE_SEO.herbs.az

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <SEO 
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        canonical="/herbs"
        crumbs={[{ name: "Home", url: "/" }, { name: "Encyclopedia", url: "/herbs" }]}
      />

      {/* Hero */}
      <div className="bg-[#1a1c1e] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs font-bold uppercase tracking-widest text-white/60 mb-2">
            <Leaf className="w-3.5 h-3.5" /> {t('encyclopedia.badge', 'Botanical Encyclopedia')}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight leading-none">
            {t('encyclopedia.title_p1', 'Herbal')}<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">{t('encyclopedia.title_p2', 'Knowledge Base')}</span>
          </h1>
          <p className="text-base sm:text-lg text-white/50 font-medium max-w-xl mx-auto">
            {t('encyclopedia.subtitle', 'Clinical-grade botanical intelligence. Research, evidence grades, active compounds, and safety profiles.')}
          </p>

          {/* Search */}
          <div className="relative max-w-xl mx-auto mt-8">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <input
              type="text"
              placeholder={t('encyclopedia.search_placeholder', 'Search herbs, compounds, benefits...')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full h-14 pl-14 pr-5 rounded-2xl bg-white/10 border border-white/10 text-white placeholder:text-white/30 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 transition-all"
            />
            {searchInput && (
              <button onClick={() => setSearchInput("")} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-6 pt-4 max-w-lg mx-auto">
            {[
              { label: t('encyclopedia.stats.herbs', 'Herbs Catalogued'), value: totalCount != null ? totalCount : (herbList.length || "...") },
              { label: t('encyclopedia.stats.research', 'Research Articles'), value: "1,240+" },
              { label: t('encyclopedia.stats.compounds', 'Compounds Tracked'), value: "850+" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-xl sm:text-2xl font-display font-bold text-white">{s.value}</div>
                <div className="text-[9px] sm:text-xs font-bold uppercase tracking-widest text-white/30 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-12 px-4 lg:px-8">

        {/* Filter bar */}
        <div className="flex flex-col md:flex-row md:items-end gap-6 mb-8 bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm">
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{t('encyclopedia.filters.grade', 'Evidence Grade')}</div>
            <div className="flex flex-wrap gap-2">
              {EVIDENCE_GRADES.map((g) => (
                <button
                  key={g}
                  onClick={() => updateParam("grade", activeGrade === g ? "" : g)}
                  className={`w-10 h-10 rounded-xl font-bold text-sm border transition-colors ${activeGrade === g
                      ? "bg-emerald-500 text-white border-emerald-500"
                      : "border-neutral-200 text-muted-foreground hover:border-emerald-300"
                    }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{t('encyclopedia.filters.continent', 'Continent')}</div>
            <div className="flex flex-wrap gap-2">
              {CONTINENTS.map((c) => (
                <button
                  key={c}
                  onClick={() => updateParam("continent", activeContinent === c ? "" : c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${activeContinent === c
                      ? "bg-[#1a1c1e] text-white border-[#1a1c1e]"
                      : "border-neutral-200 text-muted-foreground hover:border-neutral-400"
                    }`}
                >
                  {t(`encyclopedia.continents.${c.toLowerCase().replace(/\s+/g, '_')}`, c)}
                </button>
              ))}
            </div>
          </div>

          {hasFilters && (
            <div className="w-full md:w-auto md:ml-auto">
              <button
                onClick={() => { setSearchInput(""); setSearchParams({}); }}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 text-xs font-bold hover:bg-rose-100 transition-colors"
              >
                <X className="w-3.5 h-3.5" /> {t('common.reset_filters', 'Reset Filters')}
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin opacity-30" />
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/40">{t('encyclopedia.loading', 'Loading botanical database...')}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-32 rounded-3xl border-2 border-dashed border-neutral-200 bg-neutral-50">
            <Leaf className="mx-auto w-12 h-12 text-muted-foreground/20 mb-4" />
            <p className="font-bold text-xl text-[#1a1c1e]">{t('encyclopedia.no_results', 'No entries found')}</p>
            <p className="text-muted-foreground text-sm mt-2">{t('encyclopedia.no_results_sub', 'Try adjusting your search or clearing filters.')}</p>
            {hasFilters && (
              <button onClick={() => { setSearchInput(""); setSearchParams({}); }} className="mt-6 text-sm font-bold text-emerald-600 hover:underline">
                {t('encyclopedia.clear_all', 'Clear all filters')}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 mb-6">
              {totalCount != null ? totalCount : filtered.length} {(totalCount != null ? totalCount : filtered.length) === 1 ? t('encyclopedia.entry_count_single', 'entry') : t('encyclopedia.entry_count_plural', 'entries')} {t('encyclopedia.found', 'found')}
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((herb) => (
                <Link key={herb.id} to={`/herb/${herb.id}`} className="group block h-full">
                  <div className="h-full flex flex-col rounded-3xl overflow-hidden border border-neutral-100 bg-white hover:shadow-2xl hover:shadow-black/8 hover:border-emerald-200 transition-all duration-500">

                    {/* Image / Visual */}
                    <div className="relative aspect-square bg-[#f5f5f7] overflow-hidden flex-shrink-0">
                      {herb.evidenceGrade && (
                        <div className="absolute top-3 left-3 z-10">
                          <Badge className={`font-bold text-[10px] shadow-sm ${
                            herb.evidenceGrade.startsWith("A") ? "bg-emerald-500 text-white border-none" :
                            herb.evidenceGrade.startsWith("B") ? "bg-blue-500 text-white border-none" :
                            "bg-amber-500 text-white border-none"
                          }`}>
                            {t('encyclopedia.grade', 'Grade')} {herb.evidenceGrade.trim().charAt(0)}
                          </Badge>
                        </div>
                      )}
                      {herb.image || herb.images?.[0] ? (
                        <img
                          src={herb.image || herb.images[0]}
                          alt={herb.localName || herb.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Leaf className="w-14 h-14 text-emerald-200 stroke-1 group-hover:text-emerald-300 transition-colors" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-5 flex flex-col flex-grow justify-between">
                      <div className="space-y-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            {herb.continent && (
                              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50 flex items-center gap-1 min-w-0 max-w-full">
                                <MapPin className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate">{t(`encyclopedia.continents.${herb.continent.toLowerCase().replace(/\s+/g, '_')}`, herb.continent)}</span>
                              </span>
                            )}
                          </div>
                          <h3 className="font-display font-bold text-lg text-[#1a1c1e] leading-tight group-hover:text-emerald-700 transition-colors">
                            {herb.localName || herb.name}
                          </h3>
                          {herb.localName && (herb.scientificName || herb.name) && (
                            <p className="text-xs italic text-muted-foreground mt-0.5">{herb.scientificName || herb.name}</p>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {herb.shortSummary || herb.description}
                        </p>

                        {herb.activeCompounds && (
                          <div className="flex items-start gap-1.5 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                            <FlaskConical className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            <span className="break-words flex-1 min-w-0 line-clamp-2">{herb.activeCompounds}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-neutral-50 mt-4">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                          <BookOpen className="w-3 h-3" /> {t('encyclopedia.monograph', 'Full Monograph')}
                        </div>
                        <div className="text-[10px] font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">→</div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Infinite Scroll Trigger */}
            <div ref={loadMoreRef} className="h-16 flex items-center justify-center mt-6">
              {(isFetchingNextPage || (filtered.length === 0 && hasNextPage)) && (
                <Loader2 className="w-6 h-6 text-emerald-500 animate-spin opacity-55" />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
