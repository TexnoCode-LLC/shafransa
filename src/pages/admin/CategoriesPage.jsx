import { useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import {
  CornerDownRight,
  ExternalLink,
  Eye,
  FolderPlus,
  LayoutGrid,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react"

import { ConfirmDialog } from "@/components/admin/ConfirmDialog"
import { PageHeader } from "@/components/admin/PageHeader"
import { Badge } from "@/components/admin/ui/badge"
import { Button } from "@/components/admin/ui/button"
import { Card } from "@/components/admin/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/admin/ui/dropdown-menu"
import { Input } from "@/components/admin/ui/input"
import { Skeleton } from "@/components/admin/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table"
import { useAdminRole } from "@/hooks/use-admin-role"
import { apiErrorMessage, CONTENT_LANGUAGES } from "@/lib/admin"
import { cn } from "@/lib/utils"
import { CategoryFormSheet } from "./CategoryFormSheet"
import { useAdminCategories, useDeleteCategory } from "./queries"

const normalize = (value) => (value || "").toLocaleLowerCase("az").trim()

function CategoryIcon({ url }) {
  const [failed, setFailed] = useState(false)
  if (!url || failed) {
    return (
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted">
        <LayoutGrid className="size-4 text-muted-foreground" />
      </div>
    )
  }
  return <img src={url} alt="" loading="lazy" onError={() => setFailed(true)} className="size-9 shrink-0 rounded-md border object-cover" />
}

function LanguageDots({ translations }) {
  const filled = new Set((translations || []).filter((t) => t.name?.trim()).map((t) => (t.language === "eng" ? "en" : t.language)))
  return (
    <div className="flex gap-1">
      {CONTENT_LANGUAGES.map(({ code, label }) => (
        <span
          key={code}
          title={`${label}: ${filled.has(code) ? "var" : "yoxdur"}`}
          className={cn(
            "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
            filled.has(code) ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground/60 line-through"
          )}
        >
          {code}
        </span>
      ))}
    </div>
  )
}

// Silmə mümkün deyilsə səbəbi (backend də eyni qaydanı yoxlayır)
function deleteBlockReason(category) {
  if (category.children?.length) return "Əvvəlcə alt kateqoriyaları silin"
  if (category.productsCount > 0) return "Kateqoriyada məhsul var"
  return null
}

export default function CategoriesPage() {
  const { canEditContent } = useAdminRole()
  const categories = useAdminCategories()
  const deleteCategory = useDeleteCategory()
  const [search, setSearch] = useState("")
  const [form, setForm] = useState({ open: false, category: null, parentId: null })
  const [deleting, setDeleting] = useState(null)
  const lastDeletingRef = useRef(null)
  if (deleting) lastDeletingRef.current = deleting

  const topLevel = useMemo(() => categories.data || [], [categories.data])

  // Ağac düz siyahıya: əsas kateqoriya, altında onun alt kateqoriyaları (parentId əlavə olunur — DTO-da yoxdur)
  const rows = useMemo(() => {
    const q = normalize(search)
    const matches = (c) =>
      !q ||
      normalize(c.name).includes(q) ||
      normalize(c.slug).includes(q) ||
      (c.translations || []).some((t) => normalize(t.name).includes(q))

    return topLevel.flatMap((parent) => {
      const children = (parent.children || []).map((child) => ({ ...child, parentId: parent.id, parentName: parent.name }))
      const visibleChildren = children.filter(matches)
      if (!matches(parent) && visibleChildren.length === 0) return []
      return [{ ...parent, parentId: null, depth: 0 }, ...(matches(parent) ? children : visibleChildren).map((c) => ({ ...c, depth: 1 }))]
    })
  }, [topLevel, search])

  const totalCount = topLevel.reduce((sum, c) => sum + 1 + (c.children?.length || 0), 0)

  const openCreate = (parentId = null) => setForm({ open: true, category: null, parentId })
  const openEdit = (category) => setForm({ open: true, category, parentId: null })

  const confirmDelete = () => {
    const category = deleting
    deleteCategory.mutate(category.id, {
      onSuccess: () => {
        toast.success(`"${category.name}" silindi`)
        setDeleting(null)
      },
      onError: (error) => {
        setDeleting(null)
        toast.error(apiErrorMessage(error))
      },
    })
  }

  return (
    <>
      <PageHeader
        title="Kateqoriyalar"
        description="Marketin kateqoriya strukturu: əsas kateqoriyalar və onların alt kateqoriyaları."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => categories.refetch()} disabled={categories.isFetching}>
              <RefreshCw className={cn(categories.isFetching && "animate-spin")} />
              Yenilə
            </Button>
            {canEditContent && (
              <Button size="sm" onClick={() => openCreate()}>
                <Plus />
                Yeni kateqoriya
              </Button>
            )}
          </>
        }
      />

      {!canEditContent && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <Eye className="size-4 shrink-0" />
          Baxış rejimi: kateqoriyaları dəyişmək icazəniz yoxdur.
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ad və ya slug ilə axtar"
              className="h-9 pl-8 pr-8"
              aria-label="Kateqoriya axtar"
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
          {!categories.isLoading && !categories.isError && (
            <p className="text-sm text-muted-foreground">
              {topLevel.length} əsas · {totalCount - topLevel.length} alt kateqoriya
            </p>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Kateqoriya</TableHead>
              <TableHead className="hidden md:table-cell">Dillər</TableHead>
              <TableHead className="text-right">Məhsullar</TableHead>
              <TableHead className="w-12 pr-4">
                <span className="sr-only">Əməliyyatlar</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-9 rounded-md" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="ml-auto h-4 w-8" /></TableCell>
                  <TableCell />
                </TableRow>
              ))
            ) : categories.isError ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="py-16 text-center">
                  <p className="text-sm font-medium">Kateqoriyalar yüklənmədi</p>
                  <p className="mt-1 text-sm text-muted-foreground">{apiErrorMessage(categories.error)}</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => categories.refetch()}>
                    Yenidən cəhd et
                  </Button>
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="py-16 text-center">
                  <LayoutGrid className="mx-auto size-8 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium">{search ? "Axtarışa uyğun kateqoriya tapılmadı" : "Hələ kateqoriya yoxdur"}</p>
                  {search ? (
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => setSearch("")}>
                      Axtarışı təmizlə
                    </Button>
                  ) : (
                    canEditContent && (
                      <Button size="sm" className="mt-4" onClick={() => openCreate()}>
                        <Plus />
                        İlk kateqoriyanı yarat
                      </Button>
                    )
                  )}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((category) => {
                const blockReason = deleteBlockReason(category)
                return (
                  <TableRow key={category.id} className={cn(category.depth === 0 && "bg-muted/20")}>
                    <TableCell className="pl-4">
                      <div className={cn("flex min-w-0 items-center gap-3", category.depth === 1 && "pl-6")}>
                        {category.depth === 1 && <CornerDownRight className="size-4 shrink-0 text-muted-foreground/60" />}
                        <CategoryIcon url={category.icon} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="max-w-[160px] truncate font-medium sm:max-w-[320px]" title={category.name}>
                              {category.name}
                            </span>
                            {category.depth === 0 && category.children?.length > 0 && (
                              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-medium">
                                {category.children.length} alt
                              </Badge>
                            )}
                          </div>
                          <p className="max-w-[160px] truncate font-mono text-xs text-muted-foreground sm:max-w-[320px]">
                            {category.slug}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <LanguageDots translations={category.translations} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {category.productsCount > 0 ? (
                        <Link
                          to={`/admin/products?category=${encodeURIComponent(category.slug)}`}
                          className="font-medium text-primary underline-offset-4 hover:underline"
                          title="Bu kateqoriyanın məhsullarına bax"
                        >
                          {category.productsCount}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8" aria-label={`${category.name} üçün əməliyyatlar`}>
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem asChild>
                            <Link to={`/marketplace?category=${encodeURIComponent(category.slug)}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink />
                              Saytda bax
                            </Link>
                          </DropdownMenuItem>
                          {canEditContent && (
                            <>
                              <DropdownMenuItem onSelect={() => openEdit(category)}>
                                <Pencil />
                                Redaktə et
                              </DropdownMenuItem>
                              {category.depth === 0 && (
                                <DropdownMenuItem onSelect={() => openCreate(category.id)}>
                                  <FolderPlus />
                                  Alt kateqoriya əlavə et
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                disabled={!!blockReason}
                                onSelect={() => setDeleting(category)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 />
                                <div className="flex flex-col">
                                  <span>Sil</span>
                                  {blockReason && <span className="text-xs text-muted-foreground">{blockReason}</span>}
                                </div>
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {canEditContent && (
        <CategoryFormSheet
          open={form.open}
          onOpenChange={(open) => setForm((prev) => ({ ...prev, open }))}
          category={form.category}
          defaultParentId={form.parentId}
          topLevelCategories={topLevel}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`"${lastDeletingRef.current?.name ?? ""}" silinsin?`}
        description="Kateqoriya və onun ikonu birdəfəlik silinəcək. Bu əməliyyat geri qaytarıla bilməz."
        confirmLabel="Sil"
        destructive
        pending={deleteCategory.isPending}
        onConfirm={confirmDelete}
      />
    </>
  )
}
