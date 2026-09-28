import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { ExternalLink, Eye, Images, Leaf, MoreHorizontal, Pencil, Plus, RefreshCw, Search, Trash2, X } from "lucide-react"

import { ConfirmDialog } from "@/components/admin/ConfirmDialog"
import { PageHeader } from "@/components/admin/PageHeader"
import { TablePagination } from "@/components/admin/TablePagination"
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
import { useUrlFilters } from "@/hooks/use-url-filters"
import { apiErrorMessage, CONTENT_LANGUAGES } from "@/lib/admin"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useAdminPlants, useDeletePlant } from "./queries"

const PAGE_SIZES = [10, 20, 50]

function PlantThumb({ url }) {
  const [failed, setFailed] = useState(false)
  if (!url || failed) {
    return (
      <div className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-muted">
        <Leaf className="size-4 text-muted-foreground" />
      </div>
    )
  }
  return <img src={url} alt="" loading="lazy" onError={() => setFailed(true)} className="size-10 shrink-0 rounded-md border object-cover" />
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

// Siyahıda göstərilən ad: az → en → ilk mövcud
function displayName(plant) {
  const t = plant.translations || []
  return (t.find((x) => x.language === "az") || t.find((x) => x.language === "en" || x.language === "eng") || t[0])?.name || plant.slug
}

export default function PlantsPage() {
  const navigate = useNavigate()
  const { canEditContent } = useAdminRole()
  const { params, update, clear } = useUrlFilters()
  const deletePlant = useDeletePlant()

  const page = Math.max(1, Number(params.get("page")) || 1)
  const pageSize = PAGE_SIZES.includes(Number(params.get("size"))) ? Number(params.get("size")) : 10
  const q = params.get("q") || ""
  const [search, setSearch] = useState(q)
  const plants = useAdminPlants({ search: q || undefined, page, pageSize })

  useEffect(() => {
    const handle = setTimeout(() => {
      if (q !== search.trim()) update({ q: search.trim() })
    }, 300)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const [deleting, setDeleting] = useState(null)
  const lastDeletingRef = useRef(null)
  if (deleting) lastDeletingRef.current = deleting

  const items = plants.data?.items || []
  const total = plants.data?.total || 0
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  useEffect(() => {
    if (!plants.isPlaceholderData && total > 0 && page > pageCount) update({ page: pageCount }, { resetPage: false })
  }, [plants.isPlaceholderData, total, page, pageCount, update])

  const confirmDelete = () => {
    const plant = deleting
    deletePlant.mutate(plant.id, {
      onSuccess: () => {
        toast.success(`"${displayName(plant)}" silindi`)
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
        title="Ensiklopediya"
        description="Müalicəvi bitkilər haqqında məqalələr: 4 dildə məzmun, təhlükəsizlik məlumatı və mənbələr."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => plants.refetch()} disabled={plants.isFetching}>
              <RefreshCw className={cn(plants.isFetching && "animate-spin")} />
              Yenilə
            </Button>
            {canEditContent && (
              <Button size="sm" asChild>
                <Link to="/admin/plants/new">
                  <Plus />
                  Yeni bitki
                </Link>
              </Button>
            )}
          </>
        }
      />

      {!canEditContent && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <Eye className="size-4 shrink-0" />
          Baxış rejimi: ensiklopediyanı dəyişmək icazəniz yoxdur.
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="border-b p-4">
          <div className="relative sm:w-80">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ad, yerli və ya latın adı ilə axtar"
              className="h-9 pl-8 pr-8"
              aria-label="Bitki axtar"
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
        </div>

        <div className={cn("transition-opacity", plants.isPlaceholderData && "opacity-60")}>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Bitki</TableHead>
                <TableHead className="hidden md:table-cell">Dillər</TableHead>
                <TableHead className="hidden lg:table-cell">Qalereya</TableHead>
                <TableHead className="hidden xl:table-cell">Əlavə edilib</TableHead>
                <TableHead className="w-12 pr-4">
                  <span className="sr-only">Əməliyyatlar</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plants.isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-10 rounded-md" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-36" />
                          <Skeleton className="h-3 w-28" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell />
                  </TableRow>
                ))
              ) : plants.isError ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="py-16 text-center">
                    <p className="text-sm font-medium">Bitkilər yüklənmədi</p>
                    <p className="mt-1 text-sm text-muted-foreground">{apiErrorMessage(plants.error)}</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => plants.refetch()}>
                      Yenidən cəhd et
                    </Button>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="py-16 text-center">
                    <Leaf className="mx-auto size-8 text-muted-foreground" />
                    <p className="mt-3 text-sm font-medium">{q ? "Axtarışa uyğun bitki tapılmadı" : "Ensiklopediya hələ boşdur"}</p>
                    {q ? (
                      <Button variant="outline" size="sm" className="mt-4" onClick={() => { setSearch(""); clear() }}>
                        Axtarışı təmizlə
                      </Button>
                    ) : (
                      canEditContent && (
                        <Button size="sm" className="mt-4" asChild>
                          <Link to="/admin/plants/new">
                            <Plus />
                            İlk bitkini əlavə et
                          </Link>
                        </Button>
                      )
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((plant) => {
                  const name = displayName(plant)
                  return (
                    <TableRow
                      key={plant.id}
                      className={cn(canEditContent && "cursor-pointer")}
                      onClick={(e) => {
                        // Sətirə klik redaktora aparır (menyu/link klikləri istisna)
                        if (canEditContent && !e.target.closest("button, a, [role=menuitem]")) navigate(`/admin/plants/${plant.id}`)
                      }}
                    >
                      <TableCell className="pl-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <PlantThumb url={plant.image} />
                          <div className="min-w-0">
                            <p className="max-w-[170px] truncate font-medium sm:max-w-[320px]" title={name}>
                              {name}
                            </p>
                            <p className="max-w-[170px] truncate text-xs italic text-muted-foreground sm:max-w-[320px]">
                              {plant.scientificName || <span className="not-italic">{plant.slug}</span>}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <LanguageDots translations={plant.translations} />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          <Images className="size-4" />
                          <span className="tabular-nums">{plant.galleryCount ?? 0}</span>
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground xl:table-cell">{formatDate(plant.createdAt)}</TableCell>
                      <TableCell className="pr-4 text-right">
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8" aria-label={`${name} üçün əməliyyatlar`}>
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem asChild>
                              <Link to={`/herb/${plant.id}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink />
                                Saytda bax
                              </Link>
                            </DropdownMenuItem>
                            {canEditContent && (
                              <>
                                <DropdownMenuItem asChild>
                                  <Link to={`/admin/plants/${plant.id}`}>
                                    <Pencil />
                                    Redaktə et
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => setDeleting({ ...plant, name })} className="text-destructive focus:text-destructive">
                                  <Trash2 />
                                  Sil
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
        </div>

        {!plants.isLoading && !plants.isError && (
          <TablePagination
            page={Math.min(page, pageCount)}
            pageSize={pageSize}
            total={total}
            onPageChange={(next) => update({ page: next > 1 ? next : null }, { resetPage: false })}
            onPageSizeChange={(size) => update({ size: size === 10 ? null : size })}
          />
        )}
      </Card>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`"${lastDeletingRef.current?.name ?? ""}" silinsin?`}
        description="Bitki, bütün dillərdəki məzmunu, mənbələri və şəkilləri birdəfəlik silinəcək. Ona bağlı məhsullar qalacaq, sadəcə bitki əlaqəsi boşalacaq."
        confirmLabel="Sil"
        destructive
        pending={deletePlant.isPending}
        onConfirm={confirmDelete}
      />
    </>
  )
}
