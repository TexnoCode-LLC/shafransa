import { Check, ChevronDown, Globe } from "lucide-react"
import { useTranslation } from "react-i18next"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/admin/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useLanguage } from "../context/LanguageContext"

const LANGUAGES = [
  { code: "az", name: "Azərbaycanca" },
  { code: "en", name: "English" },
  { code: "ru", name: "Русский" },
  { code: "tr", name: "Türkçe" },
]

// variant="menu": header üçün açılan menyu; variant="list": mobil menyu və footer üçün düymələr sırası
export default function LanguageSwitcher({ variant = "menu", isTransparent = false, className }) {
  const { t } = useTranslation()
  const { language, changeLanguage } = useLanguage()
  const current = LANGUAGES.find((lang) => lang.code === language) || LANGUAGES[0]

  if (variant === "list") {
    return (
      <div className={cn("grid grid-cols-4 gap-1 rounded-[10px] border bg-neutral-50 p-1", className)} role="group" aria-label={t("layout.language")}>
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            type="button"
            lang={lang.code}
            title={lang.name}
            aria-pressed={language === lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={cn(
              "h-8 rounded-[8px] text-xs font-semibold uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              language === lang.code ? "bg-white text-[#1a1c1e] shadow-sm" : "text-neutral-500 hover:text-[#1a1c1e]"
            )}
          >
            {lang.code}
          </button>
        ))}
      </div>
    )
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-[10px] px-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          isTransparent ? "text-white/85 hover:bg-white/10 hover:text-white" : "text-neutral-600 hover:bg-neutral-100 hover:text-[#1a1c1e]",
          className
        )}
        aria-label={`${t("layout.language")}: ${current.name}`}
      >
        <Globe className="h-4 w-4" />
        <span className="uppercase">{current.code}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem key={lang.code} lang={lang.code} onSelect={() => changeLanguage(lang.code)} className="justify-between">
            {lang.name}
            {language === lang.code && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
