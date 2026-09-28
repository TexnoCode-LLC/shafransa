import { useEffect, useState } from "react"
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  Activity,
  BookOpen,
  BrainCircuit,
  ChevronDown,
  Heart,
  HelpCircle,
  Info,
  Leaf,
  LogOut,
  Menu,
  Package,
  Search,
  ShieldCheck,
  ShoppingCart,
  Stethoscope,
  User,
} from "lucide-react"

import { Button } from "@/components/admin/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/admin/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/admin/ui/dropdown-menu"
import { Input } from "@/components/admin/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/admin/ui/sheet"
import { getInitials } from "@/lib/admin"
import { cn } from "@/lib/utils"
import { getRoleName } from "../../constants/roles"
import logo from "../../assets/logo.png"
import LanguageSwitcher from "../LanguageSwitcher"

const PRIMARY_NAV = [
  { label: "nav_marketplace", to: "/marketplace", icon: Package },
  { label: "nav_encyclopedia", to: "/herbs", icon: Leaf },
  { label: "nav_therapists", to: "/therapists", icon: Stethoscope },
  { label: "nav_blogs", to: "/blogs", icon: BookOpen },
]

const MORE_NAV = [
  { label: "nav_ai_consultant", to: "/ai-consultant", icon: BrainCircuit },
  { label: "nav_about", to: "/about", icon: Info },
  { label: "nav_how_it_works", to: "/how-it-works", icon: Activity },
  { label: "nav_help_center", to: "/contact", icon: HelpCircle },
]

const ROLE_LABEL_KEYS = {
  MEMBER: "layout.role_member",
  THERAPIST: "layout.role_therapist",
  ADMIN: "layout.role_admin",
  SUPERADMIN: "layout.role_superadmin",
}

// Qısayol işarəsi: Mac-da ⌘K, digərlərində Ctrl K
const SHORTCUT = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? "⌘K" : "Ctrl K"

const isActivePath = (pathname, to) => pathname === to || pathname.startsWith(`${to}/`)

// Ensiklopediya və market ?search= parametrini qəbul edir — axtarış birbaşa nəticəyə aparır
function SearchDialog({ open, onOpenChange }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [query, setQuery] = useState("")

  const go = (base) => {
    const q = query.trim()
    onOpenChange(false)
    navigate(q ? `${base}?search=${encodeURIComponent(q)}` : base)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) setQuery("")
      }}
    >
      <DialogContent className="top-[20%] translate-y-0 gap-5 rounded-2xl p-5 sm:max-w-xl sm:rounded-2xl data-[state=closed]:slide-out-to-top-[18%] data-[state=open]:slide-in-from-top-[18%]">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="text-base">{t("layout.search_title")}</DialogTitle>
          <DialogDescription>{t("layout.search_hint")}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            go("/herbs")
          }}
          className="space-y-3"
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("layout.search_placeholder")}
              className="h-11 rounded-[10px] pl-9 text-base"
              aria-label={t("layout.search_placeholder")}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button type="submit" className="h-10 rounded-[10px]">
              <Leaf />
              {t("layout.search_in_herbs")}
            </Button>
            <Button type="button" variant="outline" className="h-10 rounded-[10px]" onClick={() => go("/marketplace")}>
              <Package />
              {t("layout.search_in_market")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function IconLink({ to, label, transparent, children, badge }) {
  return (
    <Link
      to={to}
      aria-label={badge ? `${label} (${badge})` : label}
      title={label}
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        transparent ? "text-white/85 hover:bg-white/10 hover:text-white" : "text-neutral-600 hover:bg-neutral-100 hover:text-[#1a1c1e]"
      )}
    >
      {children}
      {badge > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-[8px] bg-primary px-1 text-[10px] font-semibold leading-none text-white">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </Link>
  )
}

export default function SiteHeader({ user, isAuthenticated, cartCount, onLogout, transparent }) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const role = getRoleName(user?.role)
  const isStaff = role === "ADMIN" || role === "SUPERADMIN"
  const isTherapist = role === "THERAPIST"
  // Sifariş və seçilmişlər həmişə /user altındadır (terapevt panelində bu bölmələr yoxdur)
  const accountLinks = [
    { label: "my_profile", to: isTherapist ? "/expert" : "/user", icon: User },
    { label: "my_orders", to: "/user/orders", icon: Package },
    { label: "my_wishlist", to: "/user/wishlist", icon: Heart },
  ]
  const moreActive = MORE_NAV.some((link) => isActivePath(pathname, link.to))

  useEffect(() => setMenuOpen(false), [pathname])

  // Ctrl/⌘ + K — axtarış
  useEffect(() => {
    const handler = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const navItemClass = (active) =>
    cn(
      "relative inline-flex h-9 items-center rounded-[10px] px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
      transparent
        ? active
          ? "text-white"
          : "text-white/80 hover:bg-white/10 hover:text-white"
        : active
          ? "text-primary"
          : "text-neutral-600 hover:bg-neutral-100 hover:text-[#1a1c1e]"
    )
  const activeBar = (active) =>
    active && <span className={cn("absolute inset-x-3 -bottom-[13px] h-0.5", transparent ? "bg-white" : "bg-primary")} aria-hidden />

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 transition-colors duration-300",
          transparent ? "bg-gradient-to-b from-black/35 to-transparent" : "border-b border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80"
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6">
          <Link to="/" className="mr-2 shrink-0 rounded-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" aria-label="Shafransa">
            <img src={logo} alt="Shafransa" className="h-9 w-auto" />
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label={t("layout.menu")}>
            {PRIMARY_NAV.map((link) => {
              const active = isActivePath(pathname, link.to)
              return (
                <NavLink key={link.to} to={link.to} className={navItemClass(active)}>
                  {t(link.label)}
                  {activeBar(active)}
                </NavLink>
              )
            })}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger className={cn(navItemClass(moreActive), "gap-1")}>
                {t("more")}
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                {activeBar(moreActive)}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {MORE_NAV.map((link) => (
                  <DropdownMenuItem key={link.to} asChild>
                    <Link to={link.to} className={cn(isActivePath(pathname, link.to) && "text-primary")}>
                      <link.icon />
                      {t(link.label)}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className={cn(
                "hidden h-9 items-center gap-2 rounded-[10px] border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:inline-flex",
                transparent
                  ? "border-white/25 text-white/85 hover:bg-white/10 hover:text-white"
                  : "border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:text-[#1a1c1e]"
              )}
            >
              <Search className="h-4 w-4" />
              <span className="hidden xl:inline">{t("layout.search")}</span>
              <kbd className={cn("hidden rounded border px-1.5 text-[10px] font-medium xl:inline", transparent ? "border-white/25" : "border-neutral-200")}>{SHORTCUT}</kbd>
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label={t("layout.search")}
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-[10px] md:hidden",
                transparent ? "text-white/85 hover:bg-white/10" : "text-neutral-600 hover:bg-neutral-100"
              )}
            >
              <Search className="h-5 w-5" />
            </button>

            <div className="hidden lg:block">
              <LanguageSwitcher isTransparent={transparent} />
            </div>

            <IconLink to={isAuthenticated ? "/user/wishlist" : "/login"} label={t("layout.wishlist")} transparent={transparent}>
              <Heart className="h-5 w-5" />
            </IconLink>
            <IconLink to="/cart" label={t("layout.cart")} transparent={transparent} badge={cartCount}>
              <ShoppingCart className="h-5 w-5" />
            </IconLink>

            {isAuthenticated ? (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger
                  className={cn(
                    "ml-1 hidden h-9 items-center gap-1.5 rounded-[10px] pl-1 pr-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:inline-flex",
                    transparent ? "hover:bg-white/10" : "hover:bg-neutral-100"
                  )}
                  aria-label={t("layout.account")}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-primary text-[11px] font-semibold text-white">
                    {getInitials(user?.fullName)}
                  </span>
                  <ChevronDown className={cn("h-3.5 w-3.5", transparent ? "text-white/80" : "text-neutral-500")} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel className="font-normal">
                    <p className="truncate text-sm font-semibold">{user?.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                    {ROLE_LABEL_KEYS[role] && <p className="mt-1 text-xs font-medium text-primary">{t(ROLE_LABEL_KEYS[role])}</p>}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {accountLinks.map((item) => (
                    <DropdownMenuItem key={item.to} asChild>
                      <Link to={item.to}>
                        <item.icon />
                        {t(item.label)}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  {(isStaff || isTherapist) && <DropdownMenuSeparator />}
                  {isStaff && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin">
                        <ShieldCheck />
                        {t("admin_panel")}
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {isTherapist && (
                    <DropdownMenuItem asChild>
                      <Link to="/expert">
                        <Stethoscope />
                        {t("expert_panel")}
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={onLogout} className="text-destructive focus:text-destructive">
                    <LogOut />
                    {t("sign_out")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="ml-1 hidden items-center gap-1 sm:flex">
                <Link
                  to="/login"
                  className={cn(
                    "inline-flex h-9 items-center rounded-[10px] px-3 text-sm font-medium transition-colors",
                    transparent ? "text-white/85 hover:bg-white/10 hover:text-white" : "text-neutral-600 hover:bg-neutral-100 hover:text-[#1a1c1e]"
                  )}
                >
                  {t("sign_in")}
                </Link>
                <Link
                  to="/register"
                  className="inline-flex h-9 items-center rounded-[10px] bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                >
                  {t("layout.register")}
                </Link>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={t("layout.menu")}
              className={cn(
                "ml-0.5 inline-flex h-9 w-9 items-center justify-center rounded-[10px] lg:hidden",
                transparent ? "text-white/85 hover:bg-white/10" : "text-neutral-600 hover:bg-neutral-100"
              )}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobil menyu: fokus içində qalır, Escape ilə bağlanır */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right" className="flex w-[320px] max-w-[88vw] flex-col gap-0 p-0 font-sans">
          <SheetHeader className="border-b px-5 py-4 text-left">
            <SheetTitle className="flex items-center">
              <img src={logo} alt="Shafransa" className="h-8 w-auto" />
            </SheetTitle>
            <SheetDescription className="sr-only">{t("layout.menu")}</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            {isAuthenticated ? (
              <div className="flex items-center gap-3 border-b px-5 py-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-primary text-sm font-semibold text-white">
                  {getInitials(user?.fullName)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{user?.fullName}</p>
                  <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 border-b px-5 py-4">
                <Link to="/login" className="inline-flex h-10 items-center justify-center rounded-[10px] border text-sm font-medium hover:bg-neutral-50">
                  {t("sign_in")}
                </Link>
                <Link to="/register" className="inline-flex h-10 items-center justify-center rounded-[10px] bg-primary text-sm font-semibold text-white hover:bg-primary/90">
                  {t("layout.register")}
                </Link>
              </div>
            )}

            <nav className="space-y-0.5 p-3" aria-label={t("layout.menu")}>
              {[...PRIMARY_NAV, ...MORE_NAV].map((link) => {
                const active = isActivePath(pathname, link.to)
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={cn(
                      "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors",
                      active ? "bg-primary/10 text-primary" : "text-neutral-700 hover:bg-neutral-100"
                    )}
                  >
                    <link.icon className="h-4 w-4 shrink-0" />
                    {t(link.label)}
                  </Link>
                )
              })}
            </nav>

            {isAuthenticated && (
              <div className="space-y-0.5 border-t p-3">
                {accountLinks.map((item) => (
                  <Link key={item.to} to={item.to} className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100">
                    <item.icon className="h-4 w-4 shrink-0" />
                    {t(item.label)}
                  </Link>
                ))}
                {isStaff && (
                  <Link to="/admin" className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100">
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    {t("admin_panel")}
                  </Link>
                )}
                {isTherapist && (
                  <Link to="/expert" className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100">
                    <Stethoscope className="h-4 w-4 shrink-0" />
                    {t("expert_panel")}
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3 border-t p-4">
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">{t("layout.language")}</p>
              <LanguageSwitcher variant="list" />
            </div>
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  onLogout()
                }}
                className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/5"
              >
                <LogOut className="h-4 w-4" />
                {t("sign_out")}
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}
