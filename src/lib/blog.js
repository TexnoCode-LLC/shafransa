// Bloq kateqoriyaları: bazada açar (məs. "phytotherapy") saxlanılır, ad hər dildə tərcümədən gəlir.
// Backend BlogCategories ilə eyni siyahı olmalıdır.
export const BLOG_CATEGORIES = ["phytotherapy", "herbs", "health", "nutrition", "research", "news"]

export function categoryLabel(category, t) {
  if (category && BLOG_CATEGORIES.includes(category)) return t(`blog.categories.${category}`)
  return t("blog.wellness", "Sağlamlıq")
}

// Oxuma müddəti: dəqiqədə ~200 söz, ən azı 1 dəqiqə
export function readMinutes(html) {
  const words = (html || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

// URL üçün: əgər slug varsa onu, yoxsa id-ni işlət
export const blogPath = (blog) => `/blog/${blog?.slug || blog?.id}`
