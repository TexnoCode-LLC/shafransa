import React from "react"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Link, useSearchParams } from "react-router-dom"
import { Card, CardContent } from "../../components/ui/Card"
import { Badge } from "../../components/ui/Badge"
import { Calendar, Clock, ArrowRight, ArrowLeft, BookOpen } from "lucide-react"
import { getBlogs } from "../../services/blog.service"
import { formatDateLocale } from "../../lib/format"
import { BLOG_CATEGORIES, blogPath, categoryLabel, readMinutes } from "../../lib/blog"
import SEO from "../../components/common/SEO"
import { STATIC_PAGE_SEO } from "../../utils/seoTranslations"

const PAGE_SIZE = 9

export default function BlogListingPage() {
  const { t, i18n } = useTranslation()
  const [page, setPage] = React.useState(1)
  const [searchParams, setSearchParams] = useSearchParams()
  const category = BLOG_CATEGORIES.includes(searchParams.get("category")) ? searchParams.get("category") : ""
  const tag = searchParams.get("tag") || ""

  const currentLang = (i18n.language || "az").toLowerCase().slice(0, 2)

  const setFilter = (key, value) => {
    setPage(1)
    setSearchParams((params) => {
      if (value) params.set(key, value)
      else params.delete(key)
      return params
    }, { replace: true })
  }

  // Admin paneldən əlavə olunan real bloqlar (yalnız yayımda olanlar)
  const { data, isLoading, isError } = useQuery({
    queryKey: ["blogs", currentLang, page, category, tag],
    queryFn: () => getBlogs({ page, limit: PAGE_SIZE, category: category || undefined, tag: tag || undefined }),
    placeholderData: keepPreviousData,
  })

  const totalPages = data?.pagination?.pages ?? 1

  const blogs = React.useMemo(() => {
    const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
    return list.map(blog => {
      const trans = blog.translations?.find(tr => tr.language === currentLang)
      return {
        ...blog,
        title: trans?.title || blog.title,
        description: trans?.description || blog.description,
        summary: trans ? trans.summary : blog.summary,
      }
    })
  }, [data, currentLang])

  const stripHtml = (html) => {
    if (!html) return ""
    return html.replace(/<[^>]*>/g, "")
  }

  const currentLangCode = (i18n.language || 'az').toLowerCase().slice(0, 2)
  const seoData = STATIC_PAGE_SEO.blogs[currentLangCode] || STATIC_PAGE_SEO.blogs.az

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <SEO 
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        canonical="/blogs"
        crumbs={[{ name: "Home", url: "/" }, { name: "Blogs", url: "/blogs" }]}
      />
      {/* Hero Header */}
      <header className="pt-4 pb-4 bg-white border-b border-neutral-100">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl">
            <Badge className="bg-primary/10 text-primary border-primary/20 font-bold uppercase tracking-widest text-[10px] px-3 mb-6">
               {t('blog.badge', 'Research & Education')}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-[#1a1c1e] tracking-tight leading-[1.1] mb-6">
               {t('blog.title', 'Shafransa Blogs')}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
               {t('blog.subtitle', 'Deep dives into phytotherapy, herbal medicine, and holistic wellness protocols.')}
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 md:py-16">
        <div className="mb-10 flex flex-wrap items-center gap-2">
          {["", ...BLOG_CATEGORIES].map((key) => (
            <button
              key={key || "all"}
              type="button"
              onClick={() => setFilter("category", key)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                category === key ? "border-primary bg-primary text-white" : "border-neutral-200 bg-white text-neutral-600 hover:border-primary hover:text-primary"
              }`}
            >
              {key ? categoryLabel(key, t) : t('blog.all_categories', 'Hamısı')}
            </button>
          ))}
          {tag && (
            <button
              type="button"
              onClick={() => setFilter("tag", "")}
              className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-sm font-medium text-primary"
            >
              #{tag} <span aria-hidden>×</span>
            </button>
          )}
        </div>
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[16/10] bg-neutral-200 rounded-3xl mb-6" />
                <div className="h-4 bg-neutral-200 rounded w-1/4 mb-4" />
                <div className="h-8 bg-neutral-200 rounded w-3/4 mb-4" />
                <div className="h-20 bg-neutral-200 rounded mb-4" />
              </div>
            ))}
          </div>
        ) : isError || blogs.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-neutral-200 rounded-[32px] bg-white max-w-4xl mx-auto">
            <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-10" />
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">{t('blog.empty', 'New protocols are being drafted. Check back soon.')}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog) => (
              <Link key={blog.id} to={blogPath(blog)} className="group flex flex-col h-full">
                <Card className="h-full border-none shadow-none bg-transparent flex flex-col">
                  <div className="relative aspect-[16/10] rounded-3xl overflow-hidden mb-6">
                    {blog.images?.[0] ? (
                      <img 
                        src={blog.images[0]} 
                        alt={blog.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      />
                    ) : (
                      <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-neutral-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
                       <span className="text-white font-bold flex items-center gap-2">
                          {t('blog.read_more', 'Read Protocol')} <ArrowRight className="w-4 h-4" />
                       </span>
                    </div>
                  </div>
                  
                  <CardContent className="p-0 flex-1 flex flex-col">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-muted-foreground mb-3">
                       <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-semibold text-primary">{categoryLabel(blog.category, t)}</span>
                       <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" /> {formatDateLocale(blog.createdAt, currentLang)}
                       </span>
                       <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> {t('blog.min_read', { count: readMinutes(blog.description) })}
                       </span>
                    </div>
                    
                    <h3 className="text-2xl font-display font-bold text-[#1a1c1e] mb-4 group-hover:text-primary transition-colors leading-tight">
                      {blog.title}
                    </h3>
                    
                    <p className="text-muted-foreground text-sm line-clamp-3 mb-6 flex-1">
                      {blog.summary || stripHtml(blog.description)}
                    </p>
                    
                    <div className="pt-6 border-t border-neutral-100 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                             {blog.author?.charAt(0) || t('blog.author_default', 'S')}
                          </div>
                          <span className="text-xs font-bold text-[#1a1c1e]">{blog.author || t('blog.author_default', 'Shafransa Team')}</span>
                       </div>
                       <ArrowRight className="w-5 h-5 text-neutral-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-16 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#1a1c1e] transition-colors hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" /> {t("blog.prev", "Əvvəlki")}
            </button>
            <span className="text-sm font-semibold text-muted-foreground">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#1a1c1e] transition-colors hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-40"
            >
              {t("blog.next", "Növbəti")} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
