import { useEffect, useState } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { useAuthStore } from "../../store/useAuthStore"
import { getCart } from "../../services/cart.service"
import { useWishlistSync } from "../../hooks/use-wishlist-sync"
import ScrollToTop from "../shared/ScrollToTop"
import SiteFooter from "./SiteFooter"
import SiteHeader from "./SiteHeader"

export default function PublicLayout() {
  const { t } = useTranslation()
  const { isAuthenticated, logout, user } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: cartData } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
    enabled: isAuthenticated,
  })
  const cartCount = cartData?.items?.length || 0

  useWishlistSync()

  // Ana səhifədə header video üzərində şəffafdır, aşağı sürüşdürüləndə ağ fona keçir
  const isHomepage = location.pathname === "/"
  const [isScrolled, setIsScrolled] = useState(false)
  useEffect(() => {
    if (!isHomepage) return
    const handleScroll = () => setIsScrolled(window.scrollY > 40)
    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [isHomepage])

  const handleLogout = () => {
    logout({ toHome: true })
    queryClient.clear()
    navigate("/")
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa] font-sans text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow"
      >
        {t("layout.skip")}
      </a>

      <SiteHeader
        user={user}
        isAuthenticated={isAuthenticated}
        cartCount={cartCount}
        onLogout={handleLogout}
        transparent={isHomepage && !isScrolled}
      />

      <main id="main-content" className={isHomepage ? "flex-1" : "flex-1 pb-12 pt-16"}>
        <ScrollToTop />
        <Outlet />
      </main>

      <SiteFooter />
    </div>
  )
}
