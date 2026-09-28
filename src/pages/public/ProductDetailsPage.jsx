import { useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  ChevronRight,
  Heart,
  Loader2,
  MessageSquare,
  Minus,
  Plus,
  Share2,
  ShoppingCart,
  Star,
  Truck,
} from "lucide-react"

import { Textarea } from "@/components/admin/ui/textarea"
import { ProductCard, ProductImage } from "@/components/shop/ProductCard"
import { discountPercent } from "@/lib/shop"
import { useShopActions } from "@/hooks/use-shop-actions"
import { formatDate, formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"
import SEO from "../../components/common/SEO"
import { getProductById, getProducts } from "../../services/product.service"
import { createReview, getProductReviews } from "../../services/review.service"
import { useAuthStore } from "../../store/useAuthStore"
import { getProductSchema } from "../../utils/seoSchemas"
import { BASE_URL } from "../../utils/seoTranslations"

function Stars({ value, className = "h-4 w-4" }) {
  return (
    <span className="inline-flex" aria-hidden>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={cn(className, s <= Math.round(value) ? "fill-amber-400 text-amber-400" : "fill-neutral-200 text-neutral-200")} />
      ))}
    </span>
  )
}

function SectionTitle({ id, children, extra }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <h2 id={id} className="scroll-mt-24 text-2xl font-semibold tracking-tight text-[#1a1c1e]">
        {children}
      </h2>
      {extra}
    </div>
  )
}

function ReviewForm({ productId }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [rating, setRating] = useState(5)
  const [text, setText] = useState("")
  const submit = useMutation({
    mutationFn: () => createReview(productId, { rating, text: text.trim() || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] })
      queryClient.invalidateQueries({ queryKey: ["product", productId] })
      setText("")
      toast.success(t("shop.product.review_sent"))
    },
    onError: () => toast.error(t("shop.action_failed")),
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit.mutate()
      }}
      className="rounded-2xl border border-neutral-200 p-5 sm:p-6"
    >
      <h3 className="font-semibold">{t("shop.product.write_review")}</h3>
      <fieldset className="mt-4">
        <legend className="text-sm text-neutral-600">{t("shop.product.your_rating")}</legend>
        <div className="mt-2 flex gap-1" role="radiogroup">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={t("shop.product.rate", { count: value })}
              onClick={() => setRating(value)}
              className="rounded-md p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <Star className={cn("h-7 w-7 transition-colors", value <= rating ? "fill-amber-400 text-amber-400" : "fill-neutral-200 text-neutral-200 hover:fill-amber-200 hover:text-amber-200")} />
            </button>
          ))}
        </div>
      </fieldset>
      <label className="mt-4 block text-sm text-neutral-600" htmlFor="review-text">
        {t("shop.product.your_review")}
      </label>
      <Textarea
        id="review-text"
        rows={4}
        maxLength={2000}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("shop.product.review_placeholder")}
        className="mt-2 rounded-xl"
      />
      <p className="mt-2 text-xs text-neutral-500">{t("shop.product.review_hint")}</p>
      <button
        type="submit"
        disabled={submit.isPending}
        className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
      >
        {submit.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {t("shop.product.submit_review")}
      </button>
    </form>
  )
}

export default function ProductDetailsPage() {
  const { id } = useParams()
  // Başqa məhsula keçəndə (oxşar məhsullar) seçilmiş şəkil və say sıfırlansın
  return <ProductDetails key={id} id={id} />
}

function ProductDetails({ id }) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language || "az").toLowerCase().slice(0, 2)
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const shop = useShopActions()
  const [activeImage, setActiveImage] = useState(0)
  const [qty, setQty] = useState(1)

  const productQuery = useQuery({ queryKey: ["product", id, lang], queryFn: () => getProductById(id), retry: false })
  const product = productQuery.data
  const reviewsQuery = useQuery({
    queryKey: ["product-reviews", id],
    queryFn: () => getProductReviews(id),
    enabled: !!product,
  })
  const categorySlug = product?.category?.slug
  const relatedQuery = useQuery({
    queryKey: ["products", lang, "related", categorySlug],
    queryFn: () => getProducts({ category: categorySlug, limit: 5 }),
    enabled: !!categorySlug,
    staleTime: 5 * 60_000,
  })

  if (productQuery.isLoading) {
    return (
      <div className="mx-auto grid max-w-7xl animate-pulse gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_440px]">
        <div className="aspect-square rounded-2xl bg-neutral-100" />
        <div className="space-y-4">
          <div className="h-4 w-1/3 rounded bg-neutral-100" />
          <div className="h-9 w-3/4 rounded bg-neutral-100" />
          <div className="h-8 w-1/4 rounded bg-neutral-100" />
          <div className="h-12 rounded-xl bg-neutral-100" />
        </div>
      </div>
    )
  }

  if (productQuery.isError || !product) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-5 py-20 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t("shop.product.not_found_title")}</h1>
        <p className="mt-3 text-neutral-600">{t("shop.product.not_found_text")}</p>
        <Link to="/marketplace" className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary/90">
          {t("shop.product.back_to_market")}
        </Link>
      </div>
    )
  }

  const images = [product.image, ...(product.images || [])].filter(Boolean)
  const discount = discountPercent(product)
  const outOfStock = product.stock <= 0
  const lowStock = !outOfStock && product.stock <= 5
  const saved = shop.isSaved(product.id)
  const adding = shop.isAddingToCart(product.id)
  const reviews = Array.isArray(reviewsQuery.data?.data) ? reviewsQuery.data.data : []
  const related = (relatedQuery.data?.data || []).filter((p) => p.id !== product.id).slice(0, 4)
  const loginHref = `/login?redirect=${encodeURIComponent(location.pathname)}`

  const details = [
    [t("shop.product.scientific_name"), product.scientificName && <i>{product.scientificName}</i>],
    [t("shop.product.category"), product.category?.name],
    [t("shop.product.form"), product.form],
    [t("shop.product.region"), product.region],
    [t("shop.product.batch"), product.batchNumber],
    [t("shop.product.active_percent"), product.activeCompoundPercent != null && `${product.activeCompoundPercent}%`],
    [t("shop.product.heavy_metal"), product.heavyMetalTest ? t("shop.product.passed") : t("shop.product.no_data"), product.heavyMetalTest],
    [t("shop.product.pesticide"), product.pesticideTest ? t("shop.product.passed") : t("shop.product.no_data"), product.pesticideTest],
  ].filter(([, value]) => value)

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: product.title, url })
      else {
        await navigator.clipboard.writeText(url)
        toast.success(t("shop.product.link_copied"))
      }
    } catch {
      // istifadəçi paylaşmanı ləğv edib
    }
  }

  return (
    <div className="bg-white">
      <SEO
        title={product.title}
        description={(product.description || product.title).slice(0, 160)}
        image={product.image}
        canonical={`/product/${id}`}
        type="product"
        schema={getProductSchema(product, `${BASE_URL}/product/${id}`)}
        crumbs={[
          { name: t("shop.product.breadcrumb_home"), url: "/" },
          { name: t("shop.label"), url: "/marketplace" },
          { name: product.title, url: `/product/${id}` },
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-neutral-500">
            <li><Link to="/" className="hover:text-[#1a1c1e]">{t("shop.product.breadcrumb_home")}</Link></li>
            <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
            <li><Link to="/marketplace" className="hover:text-[#1a1c1e]">{t("shop.label")}</Link></li>
            {product.category && (
              <>
                <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
                <li>
                  <Link to={`/marketplace?category=${encodeURIComponent(product.category.slug)}`} className="hover:text-[#1a1c1e]">
                    {product.category.name}
                  </Link>
                </li>
              </>
            )}
            <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
            <li className="max-w-[16rem] truncate text-[#1a1c1e]" aria-current="page">{product.title}</li>
          </ol>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-14">
          {/* Qalereya */}
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white">
              <ProductImage src={images[activeImage]} alt={product.title} className="aspect-square w-full" />
              {discount && <span className="absolute left-4 top-4 rounded-md bg-[#1a1c1e] px-2 py-1 text-sm font-semibold text-white">{t("shop.product.discount", { percent: discount })}</span>}
            </div>
            {images.length > 1 && (
              <ul className="flex gap-2 overflow-x-auto pb-1">
                {images.map((src, index) => (
                  <li key={src} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveImage(index)}
                      aria-label={`${product.title} — ${index + 1}`}
                      aria-current={index === activeImage}
                      className={cn(
                        "h-20 w-20 overflow-hidden rounded-xl border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                        index === activeImage ? "border-primary" : "border-transparent hover:border-neutral-300"
                      )}
                    >
                      <ProductImage src={src} alt="" className="h-full w-full" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Alış bloku */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            {product.category?.name && <p className="text-sm text-neutral-500">{product.category.name}</p>}
            <h1 className="mt-1 text-balance text-3xl font-semibold tracking-tight text-[#1a1c1e]">{product.title}</h1>
            {product.scientificName && <p className="mt-1 italic text-neutral-500">{product.scientificName}</p>}

            {product.reviewsCount > 0 && (
              <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-[#1a1c1e]">
                <Stars value={product.avgRating} />
                <span className="font-medium text-[#1a1c1e]">{product.avgRating.toFixed(1)}</span>
                <span>· {t("shop.product.reviews_count", { count: product.reviewsCount })}</span>
              </a>
            )}

            <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-3xl font-semibold tabular-nums">{formatPrice(product.price)}</span>
              {discount && <span className="text-lg text-neutral-400 line-through">{formatPrice(product.originalPrice)}</span>}
            </div>

            <p className={cn("mt-3 inline-flex items-center gap-2 text-sm font-medium", outOfStock ? "text-rose-600" : lowStock ? "text-amber-600" : "text-primary")}>
              <span className={cn("h-2 w-2 rounded-sm", outOfStock ? "bg-rose-500" : lowStock ? "bg-amber-500" : "bg-primary")} />
              {outOfStock ? t("shop.out_of_stock") : lowStock ? t("shop.low_stock", { count: product.stock }) : t("shop.in_stock")}
            </p>

            {!outOfStock && (
              <div className="mt-6 flex items-center gap-3">
                <span className="text-sm text-neutral-600">{t("shop.product.quantity")}</span>
                <div className="flex items-center rounded-xl border border-neutral-200">
                  <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label={t("shop.product.decrease")} className="flex h-10 w-10 items-center justify-center rounded-l-xl hover:bg-neutral-50 disabled:opacity-40">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold tabular-nums" aria-live="polite">{qty}</span>
                  <button type="button" onClick={() => setQty((q) => Math.min(product.stock, q + 1))} disabled={qty >= product.stock} aria-label={t("shop.product.increase")} className="flex h-10 w-10 items-center justify-center rounded-r-xl hover:bg-neutral-50 disabled:opacity-40">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => shop.addToCart(product, qty)}
                disabled={outOfStock || adding}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                {outOfStock ? t("shop.out_of_stock") : t("shop.add_to_cart")}
              </button>
              <button
                type="button"
                onClick={() => shop.addToCart(product, qty, () => navigate("/cart"))}
                disabled={outOfStock || adding}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#1a1c1e] text-sm font-semibold text-[#1a1c1e] hover:bg-[#1a1c1e] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("shop.product.buy_now")}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => shop.toggleSave(product)}
                aria-pressed={saved}
                className={cn(
                  "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-colors",
                  saved ? "border-rose-200 bg-rose-50 text-rose-600" : "border-neutral-200 hover:bg-neutral-50"
                )}
              >
                <Heart className={cn("h-4 w-4", saved && "fill-current")} />
                {saved ? t("shop.unsave") : t("shop.save")}
              </button>
              <button type="button" onClick={share} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-200 text-sm font-medium hover:bg-neutral-50">
                <Share2 className="h-4 w-4" />
                {t("shop.product.share")}
              </button>
            </div>

            <ul className="mt-6 space-y-2 rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-700">
              <li className="flex gap-2">
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
                {t("shop.product.payment_note")}
              </li>
              {product.verified && (
                <li className="flex gap-2">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {t("shop.product.verified_note")}
                </li>
              )}
              {product.plantId && (
                <li className="flex gap-2">
                  <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
                  <Link to={`/herb/${product.plantId}`} className="font-medium text-primary hover:underline">
                    {t("shop.product.plant_link")}
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Təsvir və göstəricilər */}
        <div className="mt-16 grid gap-12 border-t border-neutral-200 pt-12 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-14">
          <section>
            <SectionTitle id="description">{t("shop.product.description")}</SectionTitle>
            {product.description ? (
              <p className="whitespace-pre-line text-base leading-relaxed text-neutral-700">{product.description}</p>
            ) : (
              <p className="text-neutral-500">{t("shop.product.no_description")}</p>
            )}
            {product.activeCompounds && (
              <div className="mt-8">
                <h3 className="font-semibold">{t("shop.product.active_compounds")}</h3>
                <p className="mt-2 whitespace-pre-line leading-relaxed text-neutral-700">{product.activeCompounds}</p>
              </div>
            )}
            {product.qualityTracking && (
              <div className="mt-8">
                <h3 className="font-semibold">{t("shop.product.quality_tracking")}</h3>
                <p className="mt-2 whitespace-pre-line leading-relaxed text-neutral-700">{product.qualityTracking}</p>
              </div>
            )}
          </section>

          <section>
            <SectionTitle id="details">{t("shop.product.details")}</SectionTitle>
            <dl className="divide-y divide-neutral-200 rounded-2xl border border-neutral-200 px-5">
              {details.map(([label, value, passed]) => (
                <div key={label} className="flex items-center justify-between gap-4 py-3.5 text-sm">
                  <dt className="text-neutral-500">{label}</dt>
                  <dd className={cn("text-right font-medium", passed === true && "inline-flex items-center gap-1.5 text-primary", passed === false && "text-neutral-400")}>
                    {passed === true && <BadgeCheck className="h-4 w-4" />}
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        {/* Rəylər */}
        <section className="mt-16 border-t border-neutral-200 pt-12">
          <SectionTitle
            id="reviews"
            extra={
              product.reviewsCount > 0 && (
                <span className="inline-flex items-center gap-2 text-sm text-neutral-600">
                  <Stars value={product.avgRating} />
                  <span className="font-semibold text-[#1a1c1e]">{product.avgRating.toFixed(1)}</span>· {t("shop.product.reviews_count", { count: product.reviewsCount })}
                </span>
              )
            }
          >
            {t("shop.product.reviews")}
          </SectionTitle>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-14">
            <div>
              {reviewsQuery.isLoading ? (
                <div className="h-24 animate-pulse rounded-2xl bg-neutral-100" />
              ) : reviews.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-300 px-6 py-10 text-center">
                  <MessageSquare className="mx-auto h-8 w-8 text-neutral-300" />
                  <p className="mt-3 text-sm text-neutral-600">{t("shop.product.no_reviews")}</p>
                </div>
              ) : (
                <ul className="divide-y divide-neutral-200">
                  {reviews.map((review) => (
                    <li key={review.id} className="py-5 first:pt-0">
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-medium">{review.user?.fullName}</p>
                        <p className="text-xs text-neutral-500">{formatDate(review.createdAt)}</p>
                      </div>
                      <div className="mt-1">
                        <Stars value={review.rating} className="h-3.5 w-3.5" />
                      </div>
                      {review.text && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neutral-700">{review.text}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              {isAuthenticated ? (
                <ReviewForm productId={product.id} />
              ) : (
                <div className="rounded-2xl border border-neutral-200 p-6">
                  <p className="text-sm text-neutral-600">{t("shop.product.login_to_review")}</p>
                  <Link to={loginHref} className="mt-4 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90">
                    {t("shop.product.login")}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Oxşar məhsullar */}
        {related.length > 0 && (
          <section className="mt-16 border-t border-neutral-200 pt-12">
            <SectionTitle
              extra={
                <Link to={`/marketplace?category=${encodeURIComponent(categorySlug)}`} className="inline-flex items-center gap-1 text-sm font-medium hover:text-primary">
                  {product.category?.name}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              }
            >
              {t("shop.product.related")}
            </SectionTitle>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
              {related.map((item) => (
                <li key={item.id}>
                  <ProductCard
                    product={item}
                    saved={shop.isSaved(item.id)}
                    onToggleSave={shop.toggleSave}
                    onAddToCart={(p) => shop.addToCart(p)}
                    adding={shop.isAddingToCart(item.id)}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}
