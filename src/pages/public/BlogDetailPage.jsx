import React from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useParams, Link } from "react-router-dom"
import DOMPurify from "dompurify"
import { toYouTubeEmbedUrl } from "../../lib/utils"
import { getBlog } from "../../services/blog.service"
import { Badge } from "../../components/ui/Badge"
import { Calendar, Clock, ArrowLeft, Loader2, BookOpen, Play } from "lucide-react"
import { blogPath, categoryLabel, readMinutes } from "../../lib/blog"
import { formatDateLocale } from "../../lib/format"
import SEO from "../../components/common/SEO"
import { getBlogSchema, stripHtml } from "../../utils/seoSchemas"
import { BASE_URL } from "../../utils/seoTranslations"

export default function BlogDetailPage() {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const { data: blogResponse, isLoading } = useQuery({
    queryKey: ["blog", id],
    queryFn: () => getBlog(id),
    enabled: Boolean(id),
  })

  const currentLang = (i18n.language || "az").toLowerCase().slice(0, 2)

  const blog = React.useMemo(() => {
    const rawBlog = blogResponse?.data || blogResponse
    if (!rawBlog) return null

    // Backend başlığı artıq saytın dilində qaytarır; tərcümə yoxdursa ona toxunmuruq (başqa dilə keçmirik)
    const trans = rawBlog.translations?.find(t => t.language === currentLang)
    return {
      ...rawBlog,
      title: trans?.title || rawBlog.title,
      description: trans?.description || rawBlog.description,
      summary: trans ? trans.summary : rawBlog.summary,
      // Etiketlər saytın dilində (hər dilin öz etiketləri)
      tags: trans ? trans.tags || [] : rawBlog.tags || [],
      seoTitle: trans ? trans.seoTitle : rawBlog.seoTitle,
      seoDescription: trans ? trans.seoDescription : rawBlog.seoDescription,
    }
  }, [blogResponse, currentLang])

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">{t('blog.loading_article', 'Loading article...')}</p>
      </div>
    )
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center">
           <BookOpen className="w-10 h-10 text-rose-500" />
        </div>
        <h2 className="text-3xl font-display font-bold text-[#1a1c1e]">{t('blog.not_found', 'Article not found')}</h2>
        <Link to="/blogs" className="text-primary font-bold hover:underline flex items-center gap-2">
           <ArrowLeft className="w-4 h-4" /> {t('blog.back_to_listing', 'Back to Blog')}
        </Link>
      </div>
    )
  }

  return (
    <article className="min-h-screen bg-white pb-24">
      <SEO
        title={blog.seoTitle || blog.title}
        description={blog.seoDescription || blog.summary || stripHtml(blog.description).slice(0, 160) || blog.title}
        keywords={[blog.title, ...(blog.tags || []), "fitoterapiya", "shafransa"].filter(Boolean).join(", ")}
        image={(Array.isArray(blog.images) && blog.images[0]) || blog.image}
        canonical={blogPath(blog)}
        type="article"
        schema={getBlogSchema(blog, `${BASE_URL}${blogPath(blog)}`)}
        crumbs={[
          { name: "Home", url: "/" },
          { name: "Blogs", url: "/blogs" },
          { name: blog.title, url: blogPath(blog) }
        ]}
      />
      {/* Header Section */}
      <header className="relative pt-4 pb-4 overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <Link to="/blogs" className="inline-flex items-center gap-2 text-primary font-bold text-sm mb-12 hover:-translate-x-1 transition-transform">
             <ArrowLeft className="w-4 h-4" /> {t('blog.back', 'Back to Hub')}
          </Link>
          
          <div className="max-w-3xl mx-auto">
             <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-3">
               <Badge className="bg-primary/10 text-primary border-primary/20 font-semibold text-sm px-3.5 py-1">
                  {categoryLabel(blog.category, t)}
               </Badge>
               <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-muted-foreground">
                  <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {formatDateLocale(blog.createdAt, currentLang)}</span>
                  <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> {t('blog.min_read', { count: readMinutes(blog.description) })}</span>
               </div>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-display font-bold text-[#1a1c1e] tracking-tight leading-[1.2] md:leading-[1.15] mb-6">
              {blog.title}
            </h1>
            {blog.summary && (
              <p className="text-lg md:text-xl leading-relaxed text-neutral-600 mb-2">{blog.summary}</p>
            )}
          </div>
        </div>
      </header>

      {/* Featured Image or Gallery */}
      <div className={`container mx-auto px-6 ${blog.images?.length ? "mb-16" : "mb-8"}`}>
        <div className="grid grid-cols-1 gap-6">
          {blog.images?.[0] && (
            <div className="aspect-[21/9] rounded-[40px] overflow-hidden shadow-2xl shadow-neutral-200">
               <img src={blog.images[0]} alt={blog.title} className="w-full h-full object-cover" />
            </div>
          )}
          
          {/* Gallery Grid if multiple images */}
          {blog.images?.length > 1 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {blog.images.slice(1).map((img, idx) => (
                <div key={idx} className="aspect-square rounded-3xl overflow-hidden shadow-lg">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto">
          {/* Video Section if available */}
          {toYouTubeEmbedUrl(blog.videoUrl) && (
            <div className="mb-16 aspect-video rounded-[40px] overflow-hidden bg-black shadow-2xl relative group">
              <iframe
                src={toYouTubeEmbedUrl(blog.videoUrl)}
                className="w-full h-full"
                allowFullScreen
                loading="lazy"
                sandbox="allow-scripts allow-same-origin allow-presentation"
                referrerPolicy="strict-origin-when-cross-origin"
                title={blog.title || "Video"}
              />
            </div>
          )}

          <div
            className="rich-content"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(blog.description || "", { USE_PROFILES: { html: true } }) }}
          />

          {blog.tags?.length > 0 && (
            <div className="mt-12 flex flex-wrap items-center gap-2" aria-label={t('blog.tags', 'Etiketlər')}>
              {blog.tags.map((tag) => (
                <Link
                  key={tag}
                  to={`/blogs?tag=${encodeURIComponent(tag)}`}
                  className="rounded-full bg-neutral-100 px-3.5 py-1.5 text-sm text-neutral-600 transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {blog.sources?.length > 0 && (
            <section className="mt-12 border-t border-neutral-100 pt-8">
              <h2 className="mb-4 text-xl font-display font-bold text-[#1a1c1e]">{t('blog.sources', 'Elmi mənbələr')}</h2>
              <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-neutral-600 marker:text-neutral-400">
                {blog.sources.map((source, index) => (
                  <li key={index}>
                    <a href={source.url} target="_blank" rel="noopener noreferrer nofollow" className="break-words text-primary underline-offset-2 hover:underline">
                      {source.title || source.url}
                    </a>
                  </li>
                ))}
              </ol>
            </section>
          )}
          
        </div>
      </div>
    </article>
  )
}
