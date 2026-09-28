import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { ChevronLeft, ChevronRight, Leaf, PackageSearch, Search, SlidersHorizontal, X } from "lucide-react"

import { Checkbox } from "@/components/admin/ui/checkbox"
import { Input } from "@/components/admin/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/admin/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/admin/ui/sheet"
import { ProductCard, ProductCardSkeleton } from "@/components/shop/ProductCard"
import { useShopActions } from "@/hooks/use-shop-actions"
import { cn } from "@/lib/utils"
import SEO from "../../components/common/SEO"
import { getCategories } from "../../services/category.service"
import { getProducts } from "../../services/product.service"
import { STATIC_PAGE_SEO } from "../../utils/seoTranslations"

const PAGE_SIZE = 12
const SORTS = [
  { value: "newest", key: "shop.sort_newest" },
  { value: "oldest", key: "shop.sort_oldest" },
  { value: "priceAsc", key: "shop.sort_price_asc" },
  { value: "priceDesc", key: "shop.sort_price_desc" },
]

const asList = (value) => (Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : [])
const cleanAmount = (value) => (value === "" || Number(value) >= 0 ? value : "")

const totalCount = (category) =>
  (category.productsCount || 0) + (category.children || []).reduce((sum, child) => sum + (child.productsCount || 0), 0)

// 1 … 4 5 6 … 12 — uzun siyahıda bütün nömrələr göstərilmir
function pageList(page, pages) {
  const set = new Set([1, pages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pages))
  const sorted = [...set].sort((a, b) => a - b)
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? ["gap", p] : [p]))
}

function FilterPanel({ t, categories, category, onCategory, minPrice, maxPrice, onPrice, verified, inStock, onToggle }) {
  const [min, setMin] = useState(minPrice)
  const [max, setMax] = useState(maxPrice)
  useEffect(() => setMin(minPrice), [minPrice])
  useEffect(() => setMax(maxPrice), [maxPrice])
  // Qiymət yazılarkən hər hərfdə yox, 500ms sonra tətbiq olunur
  useEffect(() => {
    const handle = setTimeout(() => {
      if (min !== minPrice || max !== maxPrice) onPrice(cleanAmount(min), cleanAmount(max))
    }, 500)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min, max])

  const itemClass = (active) =>
    cn(
      "flex w-full items-center justify-between gap-2 rounded-[10px] px-3 py-2 text-left text-sm transition-colors",
      active ? "bg-primary/10 font-medium text-primary" : "text-neutral-700 hover:bg-neutral-100"
    )

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">{t("shop.categories")}</h3>
        <ul className="mt-3 space-y-0.5">
          <li>
            <button type="button" className={itemClass(!category)} onClick={() => onCategory("")} aria-pressed={!category}>
              {t("shop.all_categories")}
            </button>
          </li>
          {categories.map((parent) => (
            <li key={parent.id}>
              <button type="button" className={itemClass(category === parent.slug)} onClick={() => onCategory(parent.slug)} aria-pressed={category === parent.slug}>
                <span className="truncate">{parent.name}</span>
                {/* Ana kateqoriya filtri alt kateqoriyaları da əhatə edir — say da cəmdir */}
                {totalCount(parent) > 0 && <span className="text-xs tabular-nums text-neutral-400">{totalCount(parent)}</span>}
              </button>
              {parent.children?.length > 0 && (
                <ul className="ml-3 border-l border-neutral-200 pl-2">
                  {parent.children.map((child) => (
                    <li key={child.id}>
                      <button type="button" className={itemClass(category === child.slug)} onClick={() => onCategory(child.slug)} aria-pressed={category === child.slug}>
                        <span className="truncate">{child.name}</span>
                        {child.productsCount > 0 && <span className="text-xs tabular-nums text-neutral-400">{child.productsCount}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">{t("shop.price")}</h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Input type="number" inputMode="decimal" min="0" placeholder={t("shop.min")} aria-label={t("shop.min")} value={min} onChange={(e) => setMin(e.target.value)} className="h-10 rounded-[10px]" />
          <Input type="number" inputMode="decimal" min="0" placeholder={t("shop.max")} aria-label={t("shop.max")} value={max} onChange={(e) => setMax(e.target.value)} className="h-10 rounded-[10px]" />
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">{t("shop.availability")}</h3>
        <div className="mt-3 space-y-3">
          {[
            ["verified", verified, t("shop.verified_only")],
            ["inStock", inStock, t("shop.in_stock_only")],
          ].map(([key, checked, label]) => (
            <label key={key} className="flex cursor-pointer items-center gap-3 text-sm text-neutral-700">
              <Checkbox checked={checked} onCheckedChange={(value) => onToggle(key, value === true)} className="h-[18px] w-[18px] rounded-[5px]" />
              {label}
            </label>
          ))}
        </div>
      </section>
    </div>
  )
}

export default function Marketplace() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language || "az").toLowerCase().slice(0, 2)
  const seo = STATIC_PAGE_SEO.marketplace[lang] || STATIC_PAGE_SEO.marketplace.az
  const [params, setParams] = useSearchParams()
  const shop = useShopActions()
  const gridTopRef = useRef(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const q = params.get("search") || ""
  const category = params.get("category") || ""
  const sort = SORTS.some((s) => s.value === params.get("sort")) ? params.get("sort") : "newest"
  const minPrice = params.get("minPrice") || ""
  const maxPrice = params.get("maxPrice") || ""
  const verified = params.get("verified") === "true"
  const inStock = params.get("inStock") === "true"
  const page = Math.max(1, Number(params.get("page")) || 1)
  const [search, setSearch] = useState(q)

  // Həmişə cari URL-dən başlanır — gecikmiş axtarış yazısı başqa filtr dəyişikliyini geri qaytarmasın
  const update = (changes, { resetPage = true } = {}) => {
    const next = new URLSearchParams(window.location.search)
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, String(value)) : next.delete(key)))
    if (resetPage && !("page" in changes)) next.delete("page")
    setParams(next, { replace: true })
  }

  useEffect(() => setSearch(q), [q])
  useEffect(() => {
    const handle = setTimeout(() => search.trim() !== q && update({ search: search.trim() }), 350)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const query = {
    search: q || undefined,
    category: category || undefined,
    sort,
    minPrice: minPrice || undefined,
    maxPrice: maxPrice || undefined,
    verified: verified || undefined,
    inStock: inStock || undefined,
    page,
    limit: PAGE_SIZE,
  }
  const products = useQuery({
    queryKey: ["products", lang, query],
    queryFn: () => getProducts(query),
    placeholderData: keepPreviousData,
  })
  const categoriesQuery = useQuery({
    queryKey: ["categories", lang],
    queryFn: async () => asList(await getCategories()),
    staleTime: 5 * 60_000,
  })
  const categories = useMemo(() => categoriesQuery.data || [], [categoriesQuery.data])

  const items = products.data?.data || []
  const total = products.data?.pagination?.total ?? 0
  const pages = Math.max(1, products.data?.pagination?.pages || 1)
  const hasFilters = !!(q || category || minPrice || maxPrice || verified || inStock)

  const categoryName = useMemo(() => {
    for (const parent of categories) {
      if (parent.slug === category) return parent.name
      const child = parent.children?.find((c) => c.slug === category)
      if (child) return child.name
    }
    return category
  }, [categories, category])

  const chips = [
    q && { key: "search", label: `“${q}”`, clear: () => { setSearch(""); update({ search: "" }) } },
    category && { key: "category", label: categoryName, clear: () => update({ category: "" }) },
    (minPrice || maxPrice) && { key: "price", label: `$${minPrice || 0} – ${maxPrice ? `$${maxPrice}` : "∞"}`, clear: () => update({ minPrice: "", maxPrice: "" }) },
    verified && { key: "verified", label: t("shop.verified_only"), clear: () => update({ verified: "" }) },
    inStock && { key: "inStock", label: t("shop.in_stock_only"), clear: () => update({ inStock: "" }) },
  ].filter(Boolean)

  const resetAll = () => {
    setSearch("")
    setParams({}, { replace: true })
  }

  const goToPage = (next) => {
    update({ page: next > 1 ? next : "" }, { resetPage: false })
    gridTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const filterPanel = (
    <FilterPanel
      t={t}
      categories={categories}
      category={category}
      onCategory={(slug) => update({ category: slug })}
      minPrice={minPrice}
      maxPrice={maxPrice}
      onPrice={(min, max) => update({ minPrice: min, maxPrice: max })}
      verified={verified}
      inStock={inStock}
      onToggle={(key, value) => update({ [key]: value ? "true" : "" })}
    />
  )

  return (
    <div className="bg-white">
      <SEO
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords}
        canonical="/marketplace"
        crumbs={[{ name: t("shop.product.breadcrumb_home"), url: "/" }, { name: t("shop.label"), url: "/marketplace" }]}
      />

      <header className="border-b border-neutral-200 bg-[#fafafa]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-12">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">{t("shop.label")}</p>
          <h1 className="mt-3 max-w-3xl text-balance text-3xl font-semibold tracking-tight text-[#1a1c1e] md:text-4xl">{t("shop.title")}</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-neutral-600">{t("shop.subtitle")}</p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Axtarış və sıralama */}
        <div ref={gridTopRef} className="scroll-mt-20 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("shop.search_placeholder")}
              aria-label={t("shop.search_placeholder")}
              className="h-11 rounded-xl pl-10 pr-10"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label={t("shop.clear_search")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-neutral-400 hover:text-[#1a1c1e]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-200 px-4 text-sm font-medium hover:bg-neutral-50 lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {t("shop.filters")}
              {chips.length > 0 && <span className="rounded-md bg-primary px-1.5 text-xs font-semibold text-white">{chips.length}</span>}
            </button>
            <Select value={sort} onValueChange={(value) => update({ sort: value === "newest" ? "" : value })}>
              <SelectTrigger className="h-11 flex-1 rounded-xl sm:w-52 sm:flex-none" aria-label={t("shop.sort")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.key)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="hidden lg:block" aria-label={t("shop.filters")}>
            {filterPanel}
          </aside>

          <section aria-live="polite" aria-busy={products.isFetching}>
            <div className="mb-5 flex min-h-8 flex-wrap items-center gap-2">
              {!products.isLoading && !products.isError && (
                <p className="mr-2 text-sm text-neutral-500">{t("shop.results", { count: total })}</p>
              )}
              {chips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.clear}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:border-neutral-300"
                >
                  {chip.label}
                  <X className="h-3.5 w-3.5 text-neutral-400" />
                </button>
              ))}
              {chips.length > 1 && (
                <button type="button" onClick={resetAll} className="text-xs font-medium text-primary hover:underline">
                  {t("shop.reset")}
                </button>
              )}
            </div>

            {products.isLoading ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : products.isError ? (
              <div className="rounded-2xl border border-neutral-200 p-10 text-center">
                <p className="font-medium">{t("shop.error")}</p>
                <button type="button" onClick={() => products.refetch()} className="mt-4 inline-flex h-10 items-center rounded-xl border px-4 text-sm font-medium hover:bg-neutral-50">
                  {t("shop.retry")}
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-300 px-6 py-16 text-center">
                {hasFilters ? <PackageSearch className="mx-auto h-9 w-9 text-neutral-300" /> : <Leaf className="mx-auto h-9 w-9 text-neutral-300" />}
                <p className="mt-4 font-semibold">{hasFilters ? t("shop.empty_title") : t("shop.empty_catalog_title")}</p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500">{hasFilters ? t("shop.empty_text") : t("shop.empty_catalog_text")}</p>
                {hasFilters ? (
                  <button type="button" onClick={resetAll} className="mt-6 inline-flex h-10 items-center rounded-xl border px-4 text-sm font-medium hover:bg-neutral-50">
                    {t("shop.reset")}
                  </button>
                ) : (
                  <Link to="/herbs" className="mt-6 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90">
                    {t("shop.go_encyclopedia")}
                  </Link>
                )}
              </div>
            ) : (
              <>
                <ul className={cn("grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 transition-opacity", products.isPlaceholderData && "opacity-60")}>
                  {items.map((product) => (
                    <li key={product.id}>
                      <ProductCard
                        product={product}
                        saved={shop.isSaved(product.id)}
                        onToggleSave={shop.toggleSave}
                        onAddToCart={(p) => shop.addToCart(p)}
                        adding={shop.isAddingToCart(product.id)}
                      />
                    </li>
                  ))}
                </ul>

                {pages > 1 && (
                  <nav className="mt-12 flex items-center justify-between gap-4 border-t border-neutral-200 pt-6" aria-label={t("shop.page_of", { page, pages })}>
                    <button
                      type="button"
                      onClick={() => goToPage(page - 1)}
                      disabled={page <= 1}
                      className="inline-flex h-10 items-center gap-1 rounded-xl border px-3 text-sm font-medium hover:bg-neutral-50 disabled:pointer-events-none disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">{t("shop.prev")}</span>
                    </button>
                    <ol className="flex items-center gap-1">
                      {pageList(page, pages).map((p, i) =>
                        p === "gap" ? (
                          <li key={`gap-${i}`} className="px-1 text-neutral-400">
                            …
                          </li>
                        ) : (
                          <li key={p}>
                            <button
                              type="button"
                              onClick={() => goToPage(p)}
                              aria-current={p === page ? "page" : undefined}
                              className={cn(
                                "h-10 min-w-10 rounded-xl px-3 text-sm font-medium tabular-nums",
                                p === page ? "bg-[#1a1c1e] text-white" : "hover:bg-neutral-100"
                              )}
                            >
                              {p}
                            </button>
                          </li>
                        )
                      )}
                    </ol>
                    <button
                      type="button"
                      onClick={() => goToPage(page + 1)}
                      disabled={page >= pages}
                      className="inline-flex h-10 items-center gap-1 rounded-xl border px-3 text-sm font-medium hover:bg-neutral-50 disabled:pointer-events-none disabled:opacity-40"
                    >
                      <span className="hidden sm:inline">{t("shop.next")}</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </nav>
                )}
              </>
            )}
          </section>
        </div>
      </div>

      {/* Mobil filtrlər */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="left" className="flex w-[320px] max-w-[88vw] flex-col gap-0 p-0 font-sans">
          <SheetHeader className="border-b px-5 py-4 text-left">
            <SheetTitle>{t("shop.filters")}</SheetTitle>
            <SheetDescription className="sr-only">{t("shop.filters")}</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-6">{filterPanel}</div>
          <SheetFooter className="flex-row gap-2 border-t p-4">
            <button type="button" onClick={resetAll} className="h-11 flex-1 rounded-xl border text-sm font-medium hover:bg-neutral-50">
              {t("shop.reset")}
            </button>
            <button type="button" onClick={() => setFiltersOpen(false)} className="h-11 flex-1 rounded-xl bg-primary text-sm font-semibold text-white hover:bg-primary/90">
              {t("shop.show_results")}
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
