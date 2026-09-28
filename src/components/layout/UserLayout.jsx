import { useEffect } from "react"
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import {
  ArrowLeft,
  CalendarClock,
  ChevronsUpDown,
  Heart,
  LayoutDashboard,
  Leaf,
  LogOut,
  Package,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Stethoscope,
} from "lucide-react"

import "@/styles/admin.css"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/admin/ui/breadcrumb"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/admin/ui/avatar"
import { Button } from "@/components/admin/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/admin/ui/dropdown-menu"
import { Separator } from "@/components/admin/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/admin/ui/sidebar"
import { TooltipProvider } from "@/components/admin/ui/tooltip"
import { getInitials } from "@/lib/admin"
import { getRoleName } from "../../constants/roles"
import { useAuthStore } from "../../store/useAuthStore"
import LanguageSwitcher from "../LanguageSwitcher"
import { useWishlistSync } from "../../hooks/use-wishlist-sync"

const ACCOUNT_NAV = [
  { key: "account.nav_overview", to: "/user", icon: LayoutDashboard, exact: true },
  { key: "account.nav_orders", to: "/user/orders", icon: Package },
  { key: "account.nav_wishlist", to: "/user/wishlist", icon: Heart },
  { key: "account.nav_sessions", to: "/user/sessions", icon: CalendarClock },
  { key: "account.nav_settings", to: "/user/settings", icon: Settings },
]

const isActive = (item, pathname) => (item.exact ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`))

const ROLE_LABEL_KEYS = {
  MEMBER: "layout.role_member",
  THERAPIST: "layout.role_therapist",
  ADMIN: "layout.role_admin",
  SUPERADMIN: "layout.role_superadmin",
}

function NavUser() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { isMobile } = useSidebar()
  const role = getRoleName(user?.role)

  const handleLogout = () => {
    logout({ toHome: true })
    queryClient.clear()
    navigate("/", { replace: true })
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user?.avatar || undefined} alt={user?.fullName} />
                <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-semibold text-primary">{getInitials(user?.fullName)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user?.fullName}</span>
                <span className="truncate text-xs text-muted-foreground">{t(ROLE_LABEL_KEYS[role] || "layout.role_member")}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg" side={isMobile ? "bottom" : "right"} align="end" sideOffset={4}>
            <DropdownMenuLabel className="font-normal">
              <div className="grid text-sm leading-tight">
                <span className="truncate font-semibold">{user?.fullName}</span>
                <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/user/settings">
                <Settings />
                {t("account.nav_settings")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut />
              {t("sign_out")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function AccountSidebar() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()
  const role = getRoleName(useAuthStore((state) => state.user)?.role)
  const closeOnMobile = () => isMobile && setOpenMobile(false)

  const links = [
    { key: "account.back_to_site", to: "/", icon: ArrowLeft },
    { key: "account.go_shop", to: "/marketplace", icon: ShoppingBag },
    ...(role === "THERAPIST" ? [{ key: "expert_panel", to: "/expert", icon: Stethoscope }] : []),
    ...(role === "ADMIN" || role === "SUPERADMIN" ? [{ key: "admin_panel", to: "/admin", icon: ShieldCheck }] : []),
  ]

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/user" onClick={closeOnMobile}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Leaf className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Shafransa</span>
                  <span className="truncate text-xs text-muted-foreground">{t("account.panel")}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("account.nav_group")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ACCOUNT_NAV.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild isActive={isActive(item, pathname)} tooltip={t(item.key)}>
                    <Link to={item.to} onClick={closeOnMobile}>
                      <item.icon />
                      <span>{t(item.key)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>{t("account.nav_links")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {links.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild tooltip={t(item.key)}>
                    <Link to={item.to} onClick={closeOnMobile}>
                      <item.icon />
                      <span>{t(item.key)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

export default function UserLayout() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const current = ACCOUNT_NAV.find((item) => isActive(item, pathname))
  const isOverview = current?.to === "/user"
  useWishlistSync()

  // Tema class-ı body-yə də verilir ki, Radix portalları (dialog, dropdown, select) eyni temada açılsın
  useEffect(() => {
    document.body.classList.add("admin-theme")
    return () => document.body.classList.remove("admin-theme")
  }, [])

  useEffect(() => {
    document.title = current ? `${t(current.key)} · Shafransa` : "Shafransa"
  }, [current, t])

  return (
    <div className="admin-theme">
      <TooltipProvider delayDuration={200}>
        <SidebarProvider>
          <AccountSidebar />
          <SidebarInset className="min-w-0">
            <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <SidebarTrigger className="-ml-1" aria-label={t("account.toggle_menu")} />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className={isOverview ? undefined : "hidden md:block"}>
                    {isOverview ? (
                      <BreadcrumbPage>{t("account.panel")}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link to="/user">{t("account.panel")}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isOverview && current && (
                    <>
                      <BreadcrumbSeparator className="hidden md:block" />
                      <BreadcrumbItem>
                        <BreadcrumbPage>{t(current.key)}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  )}
                </BreadcrumbList>
              </Breadcrumb>
              <div className="ml-auto flex items-center gap-1">
                <LanguageSwitcher />
                <Button variant="outline" size="sm" asChild>
                  <Link to="/">
                    <ArrowLeft />
                    <span className="hidden sm:inline">{t("account.back_to_site")}</span>
                  </Link>
                </Button>
              </div>
            </header>

            <main className="flex-1 p-4 md:p-6 lg:p-8">
              <div className="mx-auto w-full max-w-6xl">
                <Outlet />
              </div>
            </main>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </div>
  )
}
