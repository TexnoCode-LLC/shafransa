import { useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { BadgeCheck, Heart, Loader2, Package, ShoppingCart, Star } from "lucide-react"

import { formatPrice } from "@/lib/format"
import { discountPercent } from "@/lib/shop"
import { cn } from "@/lib/utils"

export function ProductImage({ src, alt, className }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <div className={cn("flex items-center justify-center bg-neutral-100", className)}>
        <Package className="h-10 w-10 text-neutral-300" strokeWidth={1.25} />
      </div>
    )
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={cn("object-cover", className)} />
}

// Kart içində iç-içə interaktiv element yoxdur: şəkil və ad link, düymələr ayrıca
export function ProductCard({ product, saved, onToggleSave, onAddToCart, adding }) {
  const { t } = useTranslation()
  const discount = discountPercent(product)
  const outOfStock = product.stock <= 0
  const lowStock = !outOfStock && product.stock <= 5
  const href = `/product/${product.id}`

  return (
    <article className="group relative flex h-full flex-col">
      <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <Link to={href} tabIndex={-1} aria-hidden>
          <ProductImage
            src={product.image}
            alt={product.title}
            className={cn("aspect-square w-full transition-transform duration-700 group-hover:scale-[1.03]", outOfStock && "opacity-60")}
          />
        </Link>
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.verified && (
            <span className="inline-flex items-center gap-1 rounded-md bg-white/95 px-2 py-0.5 text-xs font-medium text-primary shadow-sm">
              <BadgeCheck className="h-3.5 w-3.5" />
              {t("shop.verified")}
            </span>
          )}
          {discount && <span className="rounded-md bg-[#1a1c1e] px-2 py-0.5 text-xs font-semibold text-white">−{discount}%</span>}
        </div>
        <button
          type="button"
          onClick={() => onToggleSave(product)}
          aria-pressed={saved}
          aria-label={saved ? t("shop.unsave") : t("shop.save")}
          title={saved ? t("shop.unsave") : t("shop.save")}
          className={cn(
            "absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-[10px] bg-white/95 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            saved ? "text-rose-500" : "text-neutral-500 hover:text-rose-500"
          )}
        >
          <Heart className={cn("h-4 w-4", saved && "fill-current")} />
        </button>
      </div>

      <div className="mt-3 flex flex-1 flex-col">
        {product.category?.name && <p className="text-xs text-neutral-500">{product.category.name}</p>}
        <h3 className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug text-[#1a1c1e]">
          <Link to={href} className="hover:text-primary focus-visible:outline-none focus-visible:underline">
            {product.title}
          </Link>
        </h3>
        {product.reviewsCount > 0 && (
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-neutral-500">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="font-medium text-[#1a1c1e]">{product.avgRating.toFixed(1)}</span>({product.reviewsCount})
          </p>
        )}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-base font-semibold tabular-nums">{formatPrice(product.price)}</span>
            {discount && <span className="text-xs text-neutral-400 line-through">{formatPrice(product.originalPrice)}</span>}
          </p>
          <span className={cn("shrink-0 text-xs", outOfStock ? "text-rose-600" : lowStock ? "text-amber-600" : "text-neutral-500")}>
            {outOfStock ? t("shop.out_of_stock") : lowStock ? t("shop.low_stock", { count: product.stock }) : t("shop.in_stock")}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onAddToCart(product)}
          disabled={outOfStock || adding}
          className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#1a1c1e] text-sm font-semibold text-white transition-colors hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
        >
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
          {outOfStock ? t("shop.out_of_stock") : adding ? t("shop.adding") : t("shop.add_to_cart")}
        </button>
      </div>
    </article>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-square rounded-2xl bg-neutral-100" />
      <div className="mt-3 h-3 w-1/3 rounded bg-neutral-100" />
      <div className="mt-2 h-4 w-3/4 rounded bg-neutral-100" />
      <div className="mt-4 h-10 rounded-xl bg-neutral-100" />
    </div>
  )
}
