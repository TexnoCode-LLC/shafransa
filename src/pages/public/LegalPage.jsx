import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ArrowRight, Mail } from "lucide-react"

import SEO from "../../components/common/SEO"

const OTHER = { privacy: "terms", terms: "privacy" }

// Məxfilik siyasəti və istifadə şərtləri: mətn tərcümə fayllarındadır (legal.*), quruluş eynidir
export default function LegalPage({ doc }) {
  const { t } = useTranslation()
  const sections = t(`legal.${doc}.sections`, { returnObjects: true })
  const list = Array.isArray(sections) ? sections : []
  const email = t("legal.email")
  const other = OTHER[doc]

  return (
    <div className="bg-white">
      <SEO title={t(`legal.${doc}.title`)} description={t(`legal.${doc}.description`)} canonical={`/${doc}`} />

      <header className="border-b border-neutral-200 bg-[#fafafa]">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 md:py-16">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">{t("legal.label")}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#1a1c1e] md:text-4xl">{t(`legal.${doc}.title`)}</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-600">{t(`legal.${doc}.intro`)}</p>
          <p className="mt-4 text-sm text-neutral-500">{t("legal.updated", { date: t("legal.date") })}</p>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 md:py-16 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16">
        <nav aria-label={t("legal.contents")} className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">{t("legal.contents")}</p>
          <ol className="mt-4 space-y-1 border-l border-neutral-200">
            {list.map((section, index) => (
              <li key={section.title}>
                <a
                  href={`#section-${index + 1}`}
                  className="-ml-px block border-l border-transparent py-1.5 pl-4 text-sm text-neutral-600 transition-colors hover:border-primary hover:text-[#1a1c1e]"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="min-w-0 max-w-3xl">
          {list.map((section, index) => (
            <section key={section.title} id={`section-${index + 1}`} className="scroll-mt-24 border-b border-neutral-200 py-8 first:pt-0 last:border-b-0">
              <h2 className="flex items-baseline gap-3 text-xl font-semibold tracking-tight text-[#1a1c1e]">
                <span className="text-sm font-medium tabular-nums text-neutral-400">{String(index + 1).padStart(2, "0")}</span>
                {section.title}
              </h2>
              {section.items && (
                <ul className="mt-4 space-y-2.5">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-3 text-[0.95rem] leading-relaxed text-neutral-700">
                      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-sm bg-primary" aria-hidden />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="mt-4 text-[0.95rem] leading-relaxed text-neutral-700">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-neutral-200 bg-[#fafafa] p-5">
              <p className="text-sm text-neutral-600">{t("legal.contact_note")}</p>
              <a href={`mailto:${email}`} className="mt-2 inline-flex items-center gap-2 font-medium text-primary hover:underline">
                <Mail className="h-4 w-4" />
                {email}
              </a>
            </div>
            <Link
              to={`/${other}`}
              className="group flex items-center justify-between gap-4 rounded-2xl border border-neutral-200 p-5 transition-colors hover:border-primary/40"
            >
              <span>
                <span className="block text-sm text-neutral-500">{t("legal.see_also")}</span>
                <span className="mt-1 block font-medium text-[#1a1c1e]">{t(`legal.${other}.title`)}</span>
              </span>
              <ArrowRight className="h-5 w-5 text-neutral-400 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          </div>
        </article>
      </div>
    </div>
  )
}
