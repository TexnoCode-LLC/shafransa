import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"

import logo from "../../assets/logo.png"
import LanguageSwitcher from "../LanguageSwitcher"
import { SOCIAL_LINKS } from "../../constants/social"

const COLUMNS = [
  {
    title: "layout.col_platform",
    links: [
      { label: "nav_marketplace", to: "/marketplace" },
      { label: "nav_encyclopedia", to: "/herbs" },
      { label: "nav_therapists", to: "/therapists" },
      { label: "nav_ai_consultant", to: "/ai-consultant" },
      { label: "layout.blog", to: "/blogs" },
    ],
  },
  {
    title: "layout.col_company",
    links: [
      { label: "footer.links.about", to: "/about" },
      { label: "nav_how_it_works", to: "/how-it-works" },
      { label: "footer.links.help", to: "/contact" },
    ],
  },
  {
    title: "layout.col_specialists",
    links: [
      { label: "layout.join_therapist", to: "/register-therapist" },
      { label: "layout.find_therapist", to: "/therapists" },
    ],
  },
  {
    title: "layout.col_legal",
    links: [
      { label: "footer.legal.privacy", to: "/privacy" },
      { label: "footer.legal.terms", to: "/terms" },
    ],
  },
]

export default function SiteFooter() {
  const { t } = useTranslation()

  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-14">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-4">
            <Link to="/" className="inline-block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" aria-label="Shafransa">
              <img src={logo} alt="Shafransa" className="h-10 w-auto" />
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-neutral-600">{t("footer.bio")}</p>
            <ul className="flex flex-wrap items-center gap-2" aria-label={t("footer.socials", "Sosial şəbəkələr")}>
              {SOCIAL_LINKS.map(({ key, label, icon: Icon, url }) => (
                <li key={key}>
                  <a
                    href={url}
                    target={key === "email" ? undefined : "_blank"}
                    rel={key === "email" ? undefined : "noopener noreferrer"}
                    aria-label={label}
                    title={label}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition-colors hover:border-primary hover:text-primary"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <nav className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8" aria-label={t("layout.menu")}>
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">{t(column.title)}</h2>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.to + link.label}>
                      <Link to={link.to} className="text-sm text-neutral-600 transition-colors hover:text-primary">
                        {t(link.label)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <p className="mt-10 rounded-lg bg-neutral-50 px-4 py-3 text-xs leading-relaxed text-neutral-500">{t("landing.disclaimer")}</p>

        <div className="mt-8 flex flex-col-reverse gap-4 border-t border-neutral-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-neutral-500">
            © {new Date().getFullYear()} Shafransa · {t("rights_reserved")}
          </p>
          <LanguageSwitcher variant="list" className="w-full sm:w-56" />
        </div>
      </div>
    </footer>
  )
}
