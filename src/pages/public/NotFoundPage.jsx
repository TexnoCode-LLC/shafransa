import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ArrowRight } from "lucide-react"

import SEO from "../../components/common/SEO"

export default function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <div className="bg-white">
      <SEO title={t("not_found.title")} description={t("not_found.text")} />
      <div className="mx-auto flex min-h-[60vh] max-w-6xl flex-col items-center justify-center px-5 py-20 text-center sm:px-8">
        <p className="text-sm font-semibold tabular-nums text-primary">{t("not_found.code")}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#1a1c1e] md:text-4xl">{t("not_found.title")}</h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-neutral-600">{t("not_found.text")}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/" className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white hover:bg-primary/90">
            {t("not_found.home")}
          </Link>
          <Link to="/marketplace" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-neutral-200 px-6 text-sm font-semibold hover:bg-neutral-50">
            {t("not_found.market")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
