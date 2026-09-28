import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  BadgeCheck,
  ExternalLink,
  Loader2,
  MoreHorizontal,
  Package,
  PackageX,
  Pencil,
  Plus,
  RefreshCw,
  Tags,
  Search,
  ShieldCheck,
  ShieldOff,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react"

import { ConfirmDialog } from "@/components/admin/ConfirmDialog"
import { PageHeader } from "@/components/admin/PageHeader"
import { TablePagination } from "@/components/admin/TablePagination"
import { Badge } from "@/components/admin/ui/badge"
import { Button } from "@/components/admin/ui/button"
import { Card } from "@/components/admin/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/admin/ui/dropdown-menu"
import { Input } from "@/components/admin/ui/input"
import { Label } from "@/components/admin/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/admin/ui/select"
import { Skeleton } from "@/components/admin/ui/skeleton"
import { Switch } from "@/components/admin/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table"
import { useUrlFilters } from "@/hooks/use-url-filters"
import { apiErrorMessage } from "@/lib/admin"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useAdminCategories, useAdminProducts, useDeleteProduct, useUpdateProduct } from "./queries"

const STATUS_OPTIONS = [
  { value: "all", label: "Bütün məhsullar", params: {} },
  { value: "verified", label: "Təsdiqlənmiş", params: { verified: true } },
  { value: "pending", label: "Təsdiq gözləyən", params: { verified: false } },
  { value: "featured", label: "Önə çıxarılan", params: { featured: true } },
  { value: "outofstock", label: "Stoku bitən", params: { inStock: false } },
]

const SORT_OPTIONS = [
  { value: "newest", label: "Ən yeni" },
  { value: "oldest", label: "Ən köhnə" },
  { value: "priceAsc", label: "Qiymət: artan" },
  { value: "priceDesc", label: "Qiymət: azalan" },
]

const PAGE_SIZES = [10, 20, 50]

function ProductThumb({ product }) {
  const [failed, setFailed] = useState(false)
  if (!product.image || failed) {
    return (
      <div className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-muted">
        <Package className="size-4 text-muted-foreground" />
      </div>
    )
  }
  return (
    <img
      src={product.image}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className="size-10 shrink-0 rounded-md border object-cover"
    />
  )
}

function StockBadge({ stock }) {
  if (stock <= 0)
    return (
      <Badge variant="outline" className="border-red-200 bg-red-50 font-medium text-red-700">
        Bitib
      </Badge>
    )
  if (stock <= 5)
    return (
      <Badge variant="outline" className="border-amber-200 bg-amber-50 font-medium text-amber-700">
        {stock} ədəd
      </Badge>
    )
  return <span className="tabular-nums">{stock}</span>
}

function EditProductDialog({ product, open, onOpenChange, onSave, saving }) {
  const [price, setPrice] = useState("")
  const [stock, setStock] = useState("")
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (open && product) {
      setPrice(String(product.price ?? ""))
      setStock(String(product.stock ?? ""))
      setTouched(false)
    }
  }, [open, product])

  const priceNumber = Number(price)
  const stockNumber = Number(stock)
  const priceError =
    price.trim() === "" || Number.isNaN(priceNumber) || priceNumber <= 0 || priceNumber > 1_000_000
      ? "Qiymət 0-dan böyük olmalıdır"
      : product?.originalPrice && priceNumber >= product.originalPrice
        ? `Köhnə qiymətdən (${formatPrice(product.originalPrice)}) aşağı olmalıdır — endirimi redaktorda dəyişin`
        : null
  const stockError =
    stock.trim() === "" || !Number.isInteger(stockNumber) || stockNumber < 0 || stockNumber > 1_000_000
      ? "Stok 0 və ya daha böyük tam ədəd olmalıdır"
      : null

  const submit = (event) => {
    event.preventDefault()
    setTouched(true)
    if (priceError || stockError) return
    onSave({ price: priceNumber, stock: stockNumber })
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} noValidate>
          <DialogHeader>
            <DialogTitle>Qiymət və stok</DialogTitle>
            <DialogDescription className="truncate">{product?.title}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="product-price">Qiymət ($)</Label>
              <Input
                id="product-price"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                aria-invalid={touched && !!priceError}
                className={cn(touched && priceError && "border-destructive focus-visible:ring-destructive")}
                autoFocus
              />
              {touched && priceError && <p className="text-xs text-destructive">{priceError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-stock">Stok (ədəd)</Label>
              <Input
                id="product-stock"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                aria-invalid={touched && !!stockError}
                className={cn(touched && stockError && "border-destructive focus-visible:ring-destructive")}
              />
              {touched && stockError && <p className="text-xs text-destructive">{stockError}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Ləğv et
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="animate-spin" />}
              Yadda saxla
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function ProductsPage() {
  const navigate = useNavigate()
  const { params, update, clear } = useUrlFilters()
  const categories = useAdminCategories()
  const updateProduct = useUpdateProduct()
  const deleteProduct = useDeleteProduct()

  const status = STATUS_OPTIONS.find((o) => o.value === params.get("status")) || STATUS_OPTIONS[0]
  const sort = SORT_OPTIONS.some((o) => o.value === params.get("sort")) ? params.get("sort") : "newest"
  const category = params.get("category") || "all"
  const page = Math.max(1, Number(params.get("page")) || 1)
  const pageSize = PAGE_SIZES.includes(Number(params.get("size"))) ? Number(params.get("size")) : 10
  const q = params.get("q") || ""
  const [search, setSearch] = useState(q)

  const products = useAdminProducts({
    search: q || undefined,
    category: category === "all" ? undefined : category,
    sort,
    page,
    limit: pageSize,
    ...status.params,
  })

  // Axtarış 300ms gecikmə ilə URL-ə (və API-yə) yazılır
  useEffect(() => {
    const handle = setTimeout(() => {
      if (q !== search.trim()) update({ q: search.trim() })
    }, 300)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const lastDeletingRef = useRef(null)
  if (deleting) lastDeletingRef.current = deleting
  // Eyni anda bir neçə sətirdə switch dəyişdirilə bilər — hər məhsulun öz "gözləyir" vəziyyəti
  const [pendingIds, setPendingIds] = useState(() => new Set())

  const categoryOptions = (categories.data || []).flatMap((c) => [
    { value: c.slug, label: c.name },
    ...(c.children || []).map((child) => ({ value: child.slug, label: `${c.name} › ${child.name}` })),
  ])

  const items = products.data?.items || []
  const total = products.data?.total || 0
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const hasFilters = !!q || category !== "all" || status.value !== "all"

  // Səhifə nömrəsi mövcud olmayan səhifəyə düşübsə (məs. silmədən sonra) sonuncuya qayıt
  useEffect(() => {
    if (!products.isPlaceholderData && total > 0 && page > pageCount) update({ page: pageCount }, { resetPage: false })
  }, [products.isPlaceholderData, total, page, pageCount, update])

  const mutateProduct = (product, fields, { success, onSuccess } = {}) => {
    setPendingIds((prev) => new Set(prev).add(product.id))
    updateProduct.mutate(
      { id: product.id, fields },
      {
        onSuccess: () => {
          if (success) toast.success(success)
          onSuccess?.()
        },
        onError: (error) => toast.error(apiErrorMessage(error)),
        onSettled: () =>
          setPendingIds((prev) => {
            const next = new Set(prev)
            next.delete(product.id)
            return next
          }),
      }
    )
  }

  const confirmDelete = () => {
    const product = deleting
    deleteProduct.mutate(product.id, {
      onSuccess: () => {
        toast.success(`"${product.title}" silindi`)
        setDeleting(null)
      },
      onError: (error) => {
        setDeleting(null)
        if (error?.code === "PRODUCT_HAS_ORDERS" && product.stock > 0) {
          toast.error(apiErrorMessage(error), {
            duration: 8000,
            action: {
              label: "Stoku 0 et",
              onClick: () => mutateProduct(product, { stock: 0 }, { success: `"${product.title}" satışdan çıxarıldı` }),
            },
          })
        } else {
          toast.error(apiErrorMessage(error))
        }
      },
    })
  }

  const clearFilters = () => {
    setSearch("")
    clear()
  }

  return (
    <>
      <PageHeader
        title="Məhsullar"
        description="Marketdəki məhsulları əlavə et, redaktə et, təsdiqlə və önə çıxar."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => products.refetch()} disabled={products.isFetching}>
              <RefreshCw className={cn(products.isFetching && "animate-spin")} />
              Yenilə
            </Button>
            <Button size="sm" asChild>
              <Link to="/admin/products/new">
                <Plus />
                Yeni məhsul
              </Link>
            </Button>
          </>
        }
      />

      <Card className="overflow-hidden">
        <div className="grid gap-2 border-b p-4 sm:grid-cols-3 xl:grid-cols-[minmax(0,1fr)_200px_180px_160px]">
          <div className="relative sm:col-span-3 xl:col-span-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ad, təsvir və ya elmi ad ilə axtar"
              className="h-9 pl-8 pr-8"
              aria-label="Məhsul axtar"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Axtarışı təmizlə"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <Select value={category} onValueChange={(value) => update({ category: value })}>
            <SelectTrigger className="h-9" aria-label="Kateqoriya filtri">
              <SelectValue placeholder="Kateqoriya" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Bütün kateqoriyalar</SelectItem>
              {categoryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status.value} onValueChange={(value) => update({ status: value })}>
            <SelectTrigger className="h-9" aria-label="Status filtri">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(value) => update({ sort: value === "newest" ? null : value })}>
            <SelectTrigger className="h-9" aria-label="Sıralama">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className={cn("transition-opacity", products.isPlaceholderData && "opacity-60")}>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Məhsul</TableHead>
                <TableHead className="hidden xl:table-cell">Kateqoriya</TableHead>
                <TableHead className="hidden 2xl:table-cell">Əlavə edən</TableHead>
                <TableHead className="text-right">Qiymət</TableHead>
                <TableHead className="hidden sm:table-cell">Stok</TableHead>
                <TableHead className="hidden xl:table-cell">Reytinq</TableHead>
                <TableHead className="hidden text-center sm:table-cell">Təsdiq</TableHead>
                <TableHead className="hidden text-center lg:table-cell">Önə çıxar</TableHead>
                <TableHead className="w-12 pr-4">
                  <span className="sr-only">Əməliyyatlar</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-10 rounded-md" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="hidden 2xl:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="ml-auto h-4 w-12" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="mx-auto h-5 w-9 rounded-full" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="mx-auto h-5 w-9 rounded-full" /></TableCell>
                    <TableCell />
                  </TableRow>
                ))
              ) : products.isError ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={9} className="py-16 text-center">
                    <p className="text-sm font-medium">Məhsullar yüklənmədi</p>
                    <p className="mt-1 text-sm text-muted-foreground">{apiErrorMessage(products.error)}</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => products.refetch()}>
                      Yenidən cəhd et
                    </Button>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={9} className="py-16 text-center">
                    <PackageX className="mx-auto size-8 text-muted-foreground" />
                    <p className="mt-3 text-sm font-medium">
                      {hasFilters ? "Filtrlərə uyğun məhsul tapılmadı" : "Hələ məhsul yoxdur"}
                    </p>
                    {hasFilters ? (
                      <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
                        Filtrləri təmizlə
                      </Button>
                    ) : (
                      <Button size="sm" className="mt-4" asChild>
                        <Link to="/admin/products/new">
                          <Plus />
                          İlk məhsulu əlavə et
                        </Link>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((product) => {
                  const pending = pendingIds.has(product.id)
                  const hasDiscount = product.originalPrice && product.originalPrice > product.price
                  return (
                    <TableRow
                      key={product.id}
                      className="cursor-pointer"
                      onClick={(e) => {
                        if (!e.target.closest("button, a, [role=menuitem], [role=switch]")) navigate(`/admin/products/${product.id}`)
                      }}
                    >
                      <TableCell className="pl-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <ProductThumb product={product} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <p className="max-w-[150px] truncate font-medium sm:max-w-[260px]" title={product.title}>
                                {product.title || "Adsız məhsul"}
                              </p>
                              {/* Mobildə "Təsdiq" sütunu gizlidir — status nişanla göstərilir */}
                              {product.verified && (
                                <BadgeCheck className="size-4 shrink-0 text-primary sm:hidden" aria-label="Təsdiqlənib" />
                              )}
                            </div>
                            <p className="max-w-[150px] truncate text-xs italic text-muted-foreground sm:max-w-[260px]">
                              {product.scientificName || product.category?.name || "—"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        {product.category ? (
                          <Badge variant="outline" className="font-normal">
                            {product.category.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden max-w-[140px] truncate text-muted-foreground 2xl:table-cell">
                        {product.seller?.fullName || "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <div className="font-medium">{formatPrice(product.price)}</div>
                        {hasDiscount && (
                          <div className="text-xs text-muted-foreground line-through">{formatPrice(product.originalPrice)}</div>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <StockBadge stock={product.stock} />
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        {product.reviewsCount > 0 ? (
                          <span className="inline-flex items-center gap-1 tabular-nums">
                            <Star className="size-3.5 fill-amber-400 text-amber-400" />
                            {product.avgRating.toFixed(1)}
                            <span className="text-xs text-muted-foreground">({product.reviewsCount})</span>
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Rəy yoxdur</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden text-center sm:table-cell">
                        <Switch
                          checked={product.verified}
                          disabled={pending}
                          aria-label={`${product.title} təsdiqlənib`}
                          onCheckedChange={(checked) =>
                            mutateProduct(product, { verified: checked }, {
                              success: checked ? "Məhsul təsdiqləndi" : "Təsdiq geri götürüldü",
                            })
                          }
                        />
                      </TableCell>
                      <TableCell className="hidden text-center lg:table-cell">
                        <Switch
                          checked={product.featured}
                          disabled={pending}
                          aria-label={`${product.title} önə çıxarılıb`}
                          onCheckedChange={(checked) =>
                            mutateProduct(product, { featured: checked }, {
                              success: checked ? "Məhsul önə çıxarıldı" : "Önə çıxarma ləğv edildi",
                            })
                          }
                        />
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8" aria-label={`${product.title} üçün əməliyyatlar`}>
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem asChild>
                              <Link to={`/product/${product.id}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink />
                                Saytda bax
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => navigate(`/admin/products/${product.id}`)}>
                              <Pencil />
                              Redaktə et
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setEditing(product)}>
                              <Tags />
                              Qiymət və stok
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              disabled={pending}
                              onSelect={() =>
                                mutateProduct(product, { verified: !product.verified }, {
                                  success: product.verified ? "Təsdiq geri götürüldü" : "Məhsul təsdiqləndi",
                                })
                              }
                            >
                              {product.verified ? <ShieldOff /> : <ShieldCheck />}
                              {product.verified ? "Təsdiqi geri götür" : "Təsdiqlə"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={pending}
                              onSelect={() =>
                                mutateProduct(product, { featured: !product.featured }, {
                                  success: product.featured ? "Önə çıxarma ləğv edildi" : "Məhsul önə çıxarıldı",
                                })
                              }
                            >
                              <Sparkles />
                              {product.featured ? "Önə çıxarmanı ləğv et" : "Önə çıxar"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={() => setDeleting(product)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 />
                              Sil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {!products.isLoading && !products.isError && (
          <TablePagination
            page={Math.min(page, pageCount)}
            pageSize={pageSize}
            total={total}
            onPageChange={(next) => update({ page: next > 1 ? next : null }, { resetPage: false })}
            onPageSizeChange={(size) => update({ size: size === 10 ? null : size })}
          />
        )}
      </Card>

      <EditProductDialog
        product={editing}
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        saving={!!editing && pendingIds.has(editing.id)}
        onSave={(fields) =>
          mutateProduct(editing, fields, { success: "Qiymət və stok yeniləndi", onSuccess: () => setEditing(null) })
        }
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`"${lastDeletingRef.current?.title ?? ""}" silinsin?`}
        description="Məhsul, onun şəkilləri, rəyləri və səbətlərdəki qeydləri birdəfəlik silinəcək. Bu əməliyyat geri qaytarıla bilməz."
        confirmLabel="Sil"
        destructive
        pending={deleteProduct.isPending}
        onConfirm={confirmDelete}
      />
    </>
  )
}
