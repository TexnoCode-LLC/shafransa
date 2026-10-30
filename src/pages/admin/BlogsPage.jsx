import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  ExternalLink,
  Eye,
  Images,
  MoreHorizontal,
  Newspaper,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Video,
  X,
} from "lucide-react"

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
import { cn, safeExternalUrl } from "@/lib/utils"
import { useAdminBlogs, useDeleteBlog } from "./queries"
import { blogPath } from "@/lib/blog"

const PAGE_SIZES = [10, 20, 50]

function Cover({ url }) {
  const [failed, setFailed] = useState(false)
  const safe = safeExternalUrl(url)
  if (!safe || failed) {
    return (
      <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded-md border bg-muted">
        <Newspaper className="size-4 text-muted-foreground" />
      </div>
    )
  }
  return <img src={safe} alt="" loading="lazy" onError={() => setFailed(true)} className="h-10 w-14 shrink-0 rounded-md border object-cover" />
}

function LanguageDots({ translations }) {
  const filled = new Set((translations || []).filter((t) => t.title?.trim()).map((t) => (t.language === "eng" ? "en" : t.language)))
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

export default function BlogsPage() {
  const navigate = useNavigate()
  const { canEditContent } = useAdminRole()
  const { params, update, clear } = useUrlFilters()
  const deleteBlog = useDeleteBlog()

  const page = Math.max(1, Number(params.get("page")) || 1)
  const pageSize = PAGE_SIZES.includes(Number(params.get("size"))) ? Number(params.get("size")) : 10
  const q = params.get("q") || ""
  const [search, setSearch] = useState(q)
  const blogs = useAdminBlogs({ search: q || undefined, page, limit: pageSize })

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

  const items = blogs.data?.items || []
  const total = blogs.data?.total || 0
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  useEffect(() => {
    if (!blogs.isPlaceholderData && total > 0 && page > pageCount) update({ page: pageCount }, { resetPage: false })
  }, [blogs.isPlaceholderData, total, page, pageCount, update])

  const confirmDelete = () => {
    const blog = deleting
    deleteBlog.mutate(blog.id, {
      onSuccess: () => {
        toast.success(`"${blog.title}" silindi`)
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
        title="Bloglar"
        description="Sağlamlıq və bitkilər haqqında məqalələr: 4 dildə mətn, şəkillər və video."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => blogs.refetch()} disabled={blogs.isFetching}>
              <RefreshCw className={cn(blogs.isFetching && "animate-spin")} />
              Yenilə
            </Button>
            {canEditContent && (
              <Button size="sm" asChild>
                <Link to="/admin/blogs/new">
                  <Plus />
                  Yeni yazı
                </Link>
              </Button>
            )}
          </>
        }
      />

      {!canEditContent && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <Eye className="size-4 shrink-0" />
          Baxış rejimi: blogları dəyişmək icazəniz yoxdur.
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="border-b p-4">
          <div className="relative sm:w-80">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Başlıq və ya mətn ilə axtar"
              className="h-9 pl-8 pr-8"
              aria-label="Blog axtar"
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

        <div className={cn("transition-opacity", blogs.isPlaceholderData && "opacity-60")}>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Yazı</TableHead>
                <TableHead className="hidden md:table-cell">Dillər</TableHead>
                <TableHead className="hidden lg:table-cell">Media</TableHead>
                <TableHead className="hidden xl:table-cell">Tarix</TableHead>
                <TableHead className="w-12 pr-4">
                  <span className="sr-only">Əməliyyatlar</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blogs.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-14 rounded-md" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell />
                  </TableRow>
                ))
              ) : blogs.isError ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="py-16 text-center">
                    <p className="text-sm font-medium">Bloglar yüklənmədi</p>
                    <p className="mt-1 text-sm text-muted-foreground">{apiErrorMessage(blogs.error)}</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => blogs.refetch()}>
                      Yenidən cəhd et
                    </Button>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="py-16 text-center">
                    <Newspaper className="mx-auto size-8 text-muted-foreground" />
                    <p className="mt-3 text-sm font-medium">{q ? "Axtarışa uyğun yazı tapılmadı" : "Hələ blog yazısı yoxdur"}</p>
                    {q ? (
                      <Button variant="outline" size="sm" className="mt-4" onClick={() => { setSearch(""); clear() }}>
                        Axtarışı təmizlə
                      </Button>
                    ) : (
                      canEditContent && (
                        <Button size="sm" className="mt-4" asChild>
                          <Link to="/admin/blogs/new">
                            <Plus />
                            İlk yazını yarat
                          </Link>
                        </Button>
                      )
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((blog) => (
                  <TableRow
                    key={blog.id}
                    className={cn(canEditContent && "cursor-pointer")}
                    onClick={(e) => {
                      if (canEditContent && !e.target.closest("button, a, [role=menuitem]")) navigate(`/admin/blogs/${blog.id}`)
                    }}
                  >
                    <TableCell className="pl-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <Cover url={blog.images?.[0]} />
                        <div className="min-w-0">
                          <p className="flex max-w-[200px] items-center gap-2 font-medium sm:max-w-[400px]" title={blog.title}>
                            <span className="truncate">{blog.title || "Başlıqsız"}</span>
                            {blog.isPublished === false && (
                              <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">Qaralama</span>
                            )}
                          </p>
                          <p className="max-w-[160px] truncate text-xs text-muted-foreground sm:max-w-[360px]">
                            {blog.author || "Müəllif göstərilməyib"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <LanguageDots translations={blog.translations} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span className="inline-flex items-center gap-1" title="Şəkil sayı">
                          <Images className="size-4" />
                          <span className="tabular-nums">{blog.images?.length || 0}</span>
                        </span>
                        {blog.videoUrl && <Video className="size-4 text-primary" aria-label="Video var" />}
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground xl:table-cell">{formatDate(blog.createdAt)}</TableCell>
                    <TableCell className="pr-4 text-right">
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8" aria-label={`${blog.title} üçün əməliyyatlar`}>
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem asChild>
                            <Link to={blogPath(blog)} target="_blank" rel="noopener noreferrer">
                              <ExternalLink />
                              Saytda bax
                            </Link>
                          </DropdownMenuItem>
                          {canEditContent && (
                            <>
                              <DropdownMenuItem asChild>
                                <Link to={`/admin/blogs/${blog.id}`}>
                                  <Pencil />
                                  Redaktə et
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onSelect={() => setDeleting(blog)} className="text-destructive focus:text-destructive">
                                <Trash2 />
                                Sil
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {!blogs.isLoading && !blogs.isError && (
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
        title={`"${lastDeletingRef.current?.title ?? ""}" silinsin?`}
        description="Yazı, bütün dillərdəki mətni və şəkilləri birdəfəlik silinəcək. Bu əməliyyat geri qaytarıla bilməz."
        confirmLabel="Sil"
        destructive
        pending={deleteBlog.isPending}
        onConfirm={confirmDelete}
      />
    </>
  )
}
