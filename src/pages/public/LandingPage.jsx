import { useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BookOpenCheck,
  Check,
  FileText,
  FlaskConical,
  HeartPulse,
  Languages,
  Leaf,
  MapPin,
  Microscope,
  Package,
  Plus,
  ShieldAlert,
  Sprout,
  Stethoscope,
  Truck,
  UserRound,
} from "lucide-react"

import api from "../../services/api"
import { getPlants } from "../../services/plant.service"
import { formatDateLocale, formatPrice, formatPriceDual } from "@/lib/format"
import heroVideo from "../../assets/heroVideo.mp4"
import SEO from "../../components/common/SEO"
import { STATIC_PAGE_SEO } from "../../utils/seoTranslations"
import { blogPath } from "@/lib/blog"
import ChatWidget from "@/components/common/ChatWidget"

// Canlı bölmələr real datadan qurulur; data yoxdursa bölmə göstərilmir (boş "skelet" qalmasın)
const asList = (value) => (Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : [])
const stripHtml = (html) => (html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
const LIVE = { staleTime: 5 * 60_000 }

function useLandingData(lang) {
  const categories = useQuery({
    queryKey: ["landing", "categories", lang],
    queryFn: async () => asList(await api.get("/categories")),
    ...LIVE,
  })
  const products = useQuery({
    queryKey: ["landing", "products", lang],
    queryFn: async () => asList(await api.get("/products", { params: { limit: 4, sort: "newest" } })),
    ...LIVE,
  })
  const plants = useQuery({
    queryKey: ["landing", "plants", lang],
    queryFn: () => getPlants({ random: true, limit: 4 }),
    ...LIVE,
  })
  const therapists = useQuery({
    queryKey: ["landing", "therapists", lang],
    queryFn: async () => asList(await api.get("/therapists/verified")).slice(0, 3),
    ...LIVE,
  })
  const blogs = useQuery({
    queryKey: ["landing", "blogs", lang],
    queryFn: async () => asList(await api.get("/blogs", { params: { page: 1, limit: 3 } })),
    ...LIVE,
  })
  return {
    categories: categories.data || [],
    products: products.data || [],
    plants: plants.data || [],
    therapists: therapists.data || [],
    blogs: blogs.data || [],
  }
}

function Container({ className = "", children }) {
  return <div className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${className}`}>{children}</div>
}

function Section({ id, tone = "white", children }) {
  const tones = { white: "bg-white", muted: "bg-[#fafafa]" }
  return (
    <section id={id} className={`scroll-mt-20 border-t border-neutral-200 py-16 md:py-20 ${tones[tone]}`}>
      <Container>{children}</Container>
    </section>
  )
}

function SectionLabel({ children }) {
  return <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">{children}</p>
}

function SectionHeading({ label, title, text, action }) {
  return (
    <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl space-y-3">
        <SectionLabel>{label}</SectionLabel>
        <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
        {text && <p className="text-base leading-relaxed text-neutral-600">{text}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

function TextLink({ to, children, className = "" }) {
  return (
    <Link
      to={to}
      className={`group inline-flex items-center gap-1.5 text-sm font-medium text-[#1a1c1e] underline decoration-neutral-300 underline-offset-4 transition-colors hover:decoration-primary ${className}`}
    >
      {children}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

// Radius maksimum 16px: düymələr rounded-xl (12px)
const buttonBase =
  "inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"

// Şəkil yüklənməsə neytral yer tutucu (sındırılmış şəkil ikonu görünməsin)
function Photo({ src, alt, fallback: Fallback, className = "" }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-neutral-100 ${className}`}>
        <Fallback className="h-8 w-8 text-neutral-300" strokeWidth={1.25} />
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover transition-transform duration-700 group-hover:scale-[1.03] ${className}`}
    />
  )
}

function CheckList({ items, className = "" }) {
  return (
    <ul className={`space-y-3 ${className}`}>
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-[0.95rem] leading-relaxed">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export default function LandingPage() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language || "az").toLowerCase().slice(0, 2)
  const seo = STATIC_PAGE_SEO.home[lang] || STATIC_PAGE_SEO.home.az
  const { categories, products, plants, therapists, blogs } = useLandingData(lang)

  const facts = [
    { key: "sources", icon: BookOpenCheck },
    { key: "lab", icon: FlaskConical },
    { key: "cod", icon: Truck },
    { key: "lang", icon: Languages },
  ]
  const pillars = [
    { key: "encyclopedia", to: "/herbs", icon: Leaf },
    { key: "market", to: "/marketplace", icon: Package },
    { key: "therapists", to: "/therapists", icon: Stethoscope },
  ]
  const sampleRows = [
    ["row_batch", "SF-2026-014"],
    ["row_heavy_metal", t("landing.market.value_passed")],
    ["row_pesticide", t("landing.market.value_passed")],
    ["row_active", "2,4 %"],
    ["row_origin", t("landing.market.value_origin")],
    ["row_status", t("landing.market.value_verified"), true],
  ]
  const anatomy = [
    { key: "basic", icon: FileText },
    { key: "usage", icon: Sprout },
    { key: "safety", icon: ShieldAlert },
    { key: "origin", icon: MapPin },
    { key: "science", icon: Microscope },
  ]
  const audiences = [
    { key: "a1", to: "/herbs", icon: Leaf },
    { key: "a2", to: "/therapists", icon: HeartPulse },
    { key: "a3", to: "/register-therapist", icon: Stethoscope },
  ]
  const topCategories = categories.slice(0, 8)

  return (
    <div className="w-full bg-white text-[#1a1c1e] selection:bg-primary/20">
      <SEO title={seo.title} description={seo.description} keywords={seo.keywords} canonical="/" />

      {/* 1. HERO — video və overlay dəyişdirilməyib, mətn tam mərkəzdə */}
      <section className="relative z-0 flex min-h-[100svh] w-full items-center justify-center overflow-hidden pb-16 pt-28">
        <video src={heroVideo} autoPlay loop muted playsInline className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-black/45 backdrop-blur-[1px]" />

        <Container>
          <div className="mx-auto max-w-5xl text-center motion-safe:animate-fade-in-up">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/70 sm:text-sm">{t("landing.hero.kicker")}</p>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {/* Hər hissə ayrıca blok: sətirlər balanslı bölünür (tək söz ayrıca sətrə düşmür) */}
              <span className="block text-balance">{t("landing.hero.title_1")}</span>
              <span className="block text-balance font-medium italic text-primary">{t("landing.hero.title_2")}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">{t("landing.hero.subtitle")}</p>
            <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Link to="/marketplace" className={`${buttonBase} bg-primary text-white hover:bg-primary/90 focus-visible:ring-white focus-visible:ring-offset-black`}>
                {t("landing.hero.cta_primary")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/herbs" className={`${buttonBase} border border-white/40 text-white hover:bg-white/10 focus-visible:ring-white focus-visible:ring-offset-black`}>
                {t("landing.hero.cta_secondary")}
              </Link>
            </div>
          </div>
        </Container>

        <a
          href="#facts"
          className="absolute bottom-6 left-1/2 hidden h-10 w-10 -translate-x-1/2 items-center justify-center rounded-xl border border-white/30 text-white/70 transition-colors hover:border-white hover:text-white md:flex"
          aria-label={t("landing.hero.scroll")}
        >
          <ArrowDown className="h-4 w-4" />
        </a>
      </section>

      {/* 2. ƏSAS FAKTLAR */}
      <section id="facts" className="scroll-mt-20 bg-white">
        <Container>
          <ul className="grid grid-cols-2 lg:grid-cols-4">
            {facts.map(({ key, icon: Icon }, index) => (
              <li
                key={key}
                className={[
                  "flex items-start gap-3 py-7 sm:gap-4",
                  index % 2 === 1 ? "border-l border-neutral-200 pl-4 sm:pl-6" : "pr-4",
                  index > 1 ? "border-t border-neutral-200 lg:border-t-0" : "",
                  index > 0 ? "lg:border-l lg:pl-6" : "",
                ].join(" ")}
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} />
                <div>
                  <p className="text-sm font-semibold">{t(`landing.facts.${key}_title`)}</p>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-500 sm:text-sm">{t(`landing.facts.${key}_text`)}</p>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* 3. NƏDİR — bəyanat + üç istiqamət */}
      <Section id="about" tone="muted">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div>
            <SectionLabel>{t("landing.intro.label")}</SectionLabel>
            <p className="mt-4 text-balance text-2xl font-medium leading-snug tracking-tight md:text-3xl">{t("landing.intro.statement")}</p>
          </div>
          <ul className="grid gap-3">
            {pillars.map(({ key, to, icon: Icon }) => (
              <li key={key}>
                <Link
                  to={to}
                  className="group flex h-full items-start gap-4 rounded-2xl border border-neutral-200 bg-white p-5 transition-colors hover:border-primary/40 sm:items-center"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold">{t(`landing.intro.${key}.title`)}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-600">{t(`landing.intro.${key}.text`)}</p>
                  </div>
                  <ArrowUpRight className="hidden h-5 w-5 shrink-0 text-neutral-400 transition-colors group-hover:text-primary sm:block" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* 4. KATEQORİYALAR (data yoxdursa göstərilmir) */}
      {topCategories.length > 0 && (
        <Section>
          <SectionHeading
            label={t("landing.categories.label")}
            title={t("landing.categories.title")}
            action={<TextLink to="/marketplace">{t("landing.categories.view_all")}</TextLink>}
          />
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {topCategories.map((category) => (
              <li key={category.id}>
                <Link
                  to={`/marketplace?category=${encodeURIComponent(category.slug)}`}
                  className="group flex items-center gap-3 rounded-2xl border border-neutral-200 p-4 transition-colors hover:border-primary/40 hover:bg-primary/[0.03]"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-neutral-100">
                    {category.icon ? (
                      <img src={category.icon} alt="" loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <Leaf className="h-5 w-5 text-neutral-400" strokeWidth={1.5} />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{category.name}</span>
                    {/* Alt kateqoriyalardakı məhsullar da sayılır (market filtri kimi) */}
                    {(() => {
                      const count = (category.productsCount || 0) + (category.children || []).reduce((sum, c) => sum + (c.productsCount || 0), 0)
                      return count > 0 && <span className="block text-xs text-neutral-500">{t("landing.categories.products", { count })}</span>
                    })()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 5. MARKET — şəffaflıq + yeni məhsullar */}
      <Section tone={topCategories.length > 0 ? "muted" : "white"}>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionLabel>{t("landing.market.label")}</SectionLabel>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{t("landing.market.title")}</h2>
            <p className="mt-4 text-base leading-relaxed text-neutral-600">{t("landing.market.text")}</p>
            <CheckList className="mt-6" items={[1, 2, 3].map((n) => t(`landing.market.point_${n}`))} />
          </div>

          {/* Məhsul kartındakı sahələrin illüstrasiyası — "Nümunə" kimi işarələnib */}
          <figure className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-7">
            <figcaption className="flex items-center justify-between gap-4 border-b border-neutral-200 pb-4">
              <span className="text-sm font-semibold">{t("landing.market.sample_title")}</span>
              <span className="rounded-md border border-neutral-200 px-2 py-0.5 text-xs text-neutral-500">{t("landing.market.sample_badge")}</span>
            </figcaption>
            <dl className="divide-y divide-dashed divide-neutral-200">
              {sampleRows.map(([key, value, highlight]) => (
                <div key={key} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <dt className="text-neutral-500">{t(`landing.market.${key}`)}</dt>
                  <dd className={`font-medium tabular-nums ${highlight ? "inline-flex items-center gap-1.5 text-primary" : ""}`}>
                    {highlight && <BadgeCheck className="h-4 w-4" />}
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </figure>
        </div>

        {products.length > 0 ? (
          <div className="mt-14">
            <div className="mb-6 flex items-end justify-between gap-4">
              <h3 className="text-xl font-semibold tracking-tight">{t("landing.market.latest")}</h3>
              <TextLink to="/marketplace">{t("landing.market.view_all")}</TextLink>
            </div>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4 lg:gap-x-5">
              {products.map((product) => (
                <li key={product.id}>
                  <Link to={`/product/${product.id}`} className="group block">
                    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                      <Photo src={product.image} alt={product.title} fallback={Package} className="aspect-square w-full" />
                    </div>
                    <div className="mt-3 space-y-1">
                      <p className="line-clamp-2 text-sm font-medium leading-snug group-hover:text-primary">{product.title}</p>
                      <p className="flex flex-wrap items-center gap-x-2 text-sm">
                        <span className="font-semibold tabular-nums">{formatPriceDual(product.price)}</span>
                        {product.originalPrice > product.price && (
                          <span className="text-xs text-neutral-400 line-through">{formatPrice(product.originalPrice)}</span>
                        )}
                        {product.verified && (
                          <span className="inline-flex items-center gap-1 text-xs text-primary">
                            <BadgeCheck className="h-3.5 w-3.5" />
                            {t("landing.market.verified")}
                          </span>
                        )}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mt-10">
            <TextLink to="/marketplace">{t("landing.market.view_all")}</TextLink>
          </div>
        )}
      </Section>

      {/* 6. ENSİKLOPEDİYA — məqalənin quruluşu + təsadüfi bitkilər */}
      <Section>
        <SectionHeading
          label={t("landing.encyclopedia.label")}
          title={t("landing.encyclopedia.title")}
          text={t("landing.encyclopedia.text")}
          action={<TextLink to="/herbs">{t("landing.encyclopedia.view_all")}</TextLink>}
        />
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {anatomy.map(({ key, icon: Icon }, index) => (
            <li key={key} className="rounded-2xl border border-neutral-200 p-5">
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
                <span className="text-xs tabular-nums text-neutral-400">0{index + 1}</span>
              </div>
              <h3 className="mt-4 text-sm font-semibold">{t(`landing.encyclopedia.${key}_title`)}</h3>
              <p className="mt-1 text-sm leading-relaxed text-neutral-600">{t(`landing.encyclopedia.${key}_text`)}</p>
            </li>
          ))}
        </ol>

        {plants.length > 0 && (
          <div className="mt-14">
            <div className="mb-6 flex items-end justify-between gap-4">
              <h3 className="text-xl font-semibold tracking-tight">{t("landing.plants.title")}</h3>
              <TextLink to="/herbs">{t("landing.plants.view_all")}</TextLink>
            </div>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4 lg:gap-x-5">
              {plants.slice(0, 4).map((plant) => {
                const name = plant.localName || plant.name
                const grade = plant.evidenceGrade?.trim().charAt(0)
                return (
                  <li key={plant.id}>
                    <Link to={`/herb/${plant.id}`} className="group block">
                      <div className="relative overflow-hidden rounded-2xl">
                        <Photo src={plant.image || plant.gallery?.[0]} alt={name} fallback={Leaf} className="aspect-[4/3] w-full" />
                        {grade && (
                          <span className="absolute left-3 top-3 rounded-md bg-white/90 px-2 py-0.5 text-xs font-medium backdrop-blur">
                            {t("landing.plants.grade", { grade })}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 space-y-0.5">
                        <p className="font-semibold leading-tight group-hover:text-primary">{name}</p>
                        {plant.scientificName && <p className="text-sm italic text-neutral-500">{plant.scientificName}</p>}
                        {plant.shortSummary && <p className="line-clamp-2 pt-1 text-sm leading-relaxed text-neutral-600">{plant.shortSummary}</p>}
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </Section>

      {/* 7. TƏHLÜKƏSİZLİK */}
      <Section tone="muted">
        <div className="grid gap-8 rounded-2xl border border-primary/15 bg-primary/[0.04] p-6 sm:p-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14">
          <div>
            <SectionLabel>{t("landing.safety.label")}</SectionLabel>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-4xl">{t("landing.safety.title")}</h2>
            <p className="mt-4 text-base leading-relaxed text-neutral-700">{t("landing.safety.text")}</p>
          </div>
          <div className="flex flex-col justify-center gap-6">
            <CheckList items={[1, 2, 3].map((n) => t(`landing.safety.point_${n}`))} />
            <p className="flex items-start gap-3 rounded-xl bg-white p-4 text-sm font-medium leading-relaxed">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" strokeWidth={1.75} />
              {t("landing.safety.note")}
            </p>
          </div>
        </div>
      </Section>

      {/* 8. FİZİOTERAPEVTLƏR — necə işləyir + canlı siyahı */}
      <Section>
        <SectionHeading
          label={t("landing.therapists.label")}
          title={t("landing.therapists.title")}
          text={t("landing.therapists.text")}
          action={<TextLink to="/therapists">{t("landing.therapists.view_all")}</TextLink>}
        />
        <ol className="grid gap-3 md:grid-cols-3">
          {[1, 2, 3].map((step) => (
            <li key={step} className="rounded-2xl border border-neutral-200 p-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1a1c1e] text-sm font-semibold tabular-nums text-white">{step}</span>
              <h3 className="mt-5 text-base font-semibold">{t(`landing.therapists.step_${step}_title`)}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{t(`landing.therapists.step_${step}_text`)}</p>
            </li>
          ))}
        </ol>

        {therapists.length > 0 && (
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {therapists.map((therapist) => {
              const name = therapist.user?.fullName || ""
              return (
                <li key={therapist.id}>
                  <Link
                    to={`/therapist/${therapist.id}`}
                    className="group flex items-center gap-4 rounded-2xl border border-neutral-200 bg-[#fafafa] p-4 transition-colors hover:border-primary/40"
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                      <Photo src={therapist.user?.avatar} alt={name} fallback={UserRound} className="h-full w-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{name}</p>
                      {therapist.specialization && <p className="truncate text-sm text-neutral-500">{therapist.specialization}</p>}
                      {therapist.onlinePrice > 0 && (
                        <p className="mt-0.5 text-xs font-medium text-primary">
                          {t("landing.therapists.from_price", { price: formatPriceDual(therapist.onlinePrice) })}
                        </p>
                      )}
                    </div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-neutral-400 transition-colors group-hover:text-primary" />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </Section>

      {/* 9. KİMLƏR ÜÇÜN */}
      <Section tone="muted">
        <SectionHeading label={t("landing.audience.label")} title={t("landing.audience.title")} />
        <ul className="grid gap-3 md:grid-cols-3">
          {audiences.map(({ key, to, icon: Icon }) => (
            <li key={key} className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-6">
              <Icon className="h-6 w-6 text-primary" strokeWidth={1.75} />
              <h3 className="mt-5 text-lg font-semibold leading-snug">{t(`landing.audience.${key}_title`)}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-600">{t(`landing.audience.${key}_text`)}</p>
              <TextLink to={to} className="mt-6">
                {t(`landing.audience.${key}_link`)}
              </TextLink>
            </li>
          ))}
        </ul>
      </Section>

      {/* 10. BLOQ (data yoxdursa göstərilmir) */}
      {blogs.length > 0 && (
        <Section>
          <SectionHeading
            label={t("landing.blog.label")}
            title={t("landing.blog.title")}
            action={<TextLink to="/blogs">{t("landing.blog.view_all")}</TextLink>}
          />
          <ul className="grid gap-8 md:grid-cols-3 md:gap-5">
            {blogs.map((blog) => (
              <li key={blog.id}>
                <Link to={blogPath(blog)} className="group block">
                  <div className="overflow-hidden rounded-2xl">
                    <Photo src={blog.images?.[0]} alt={blog.title} fallback={Leaf} className="aspect-[16/10] w-full" />
                  </div>
                  <p className="mt-4 text-xs text-neutral-500">
                    {formatDateLocale(blog.createdAt, lang)}
                  </p>
                  <h3 className="mt-1.5 text-lg font-semibold leading-snug group-hover:text-primary">{blog.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-neutral-600">{blog.summary || stripHtml(blog.description)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 11. SUALLAR */}
      <Section tone={blogs.length > 0 ? "muted" : "white"}>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
          <div>
            <SectionLabel>{t("landing.faq.label")}</SectionLabel>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{t("landing.faq.title")}</h2>
          </div>
          <div className="divide-y divide-neutral-200 border-y border-neutral-200">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <details key={n} className="group">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-left font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 [&::-webkit-details-marker]:hidden">
                  <span>{t(`landing.faq.q${n}`)}</span>
                  <Plus className="mt-0.5 h-5 w-5 shrink-0 text-neutral-400 transition-transform duration-200 group-open:rotate-45" />
                </summary>
                <p className="max-w-2xl pb-5 pr-10 text-[0.95rem] leading-relaxed text-neutral-600">{t(`landing.faq.a${n}`)}</p>
              </details>
            ))}
          </div>
        </div>
      </Section>

      {/* 12. SON ÇAĞIRIŞ */}
      <section className="bg-[#1a1c1e] py-16 text-white md:py-20">
        <Container>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">{t("landing.cta.title")}</h2>
              <p className="mt-4 text-base leading-relaxed text-white/60 md:text-lg">{t("landing.cta.text")}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/register" className={`${buttonBase} bg-white text-[#1a1c1e] hover:bg-white/90 focus-visible:ring-white focus-visible:ring-offset-[#1a1c1e]`}>
                {t("landing.cta.register")}
              </Link>
              <Link
                to="/register-therapist"
                className={`${buttonBase} border border-white/25 text-white hover:bg-white/10 focus-visible:ring-white focus-visible:ring-offset-[#1a1c1e]`}
              >
                {t("landing.cta.therapist")}
              </Link>
            </div>
          </div>
          <p className="mt-12 border-t border-white/10 pt-6 text-xs leading-relaxed text-white/40">{t("landing.disclaimer")}</p>
        </Container>
      </section>
      <ChatWidget />
    </div>
  )
}
