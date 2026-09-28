import { Link } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Heart } from "lucide-react"

import { EmptyState } from "@/components/account/EmptyState"
import { Button } from "@/components/admin/ui/button"
import { Skeleton } from "@/components/admin/ui/skeleton"
import { ProductCard } from "@/components/shop/ProductCard"
import { useShopActions } from "@/hooks/use-shop-actions"
import { getWishlist } from "../../services/wishlist.service"
import { accountKeys } from "./queries"

const asList = (value) => (Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : [])

export default function WishlistPage() {
  const { t, i18n } = useTranslation()
  const shop = useShopActions()
  const queryClient = useQueryClient()
  const key = [...accountKeys.wishlist, i18n.language]
  const wishlist = useQuery({ queryKey: key, queryFn: getWishlist })
  const items = asList(wishlist.data).filter((item) => item.product)

  // Ürəyə basılan məhsul server cavabını gözləmədən siyahıdan çıxır; xəta olsa siyahı yenidən yüklənir
  const remove = (product) => {
    queryClient.setQueryData(key, (old) => {
      const list = asList(old).filter((item) => item.product?.id !== product.id)
      return Array.isArray(old) ? list : { ...old, data: list }
    })
    shop.toggleSave(product)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("account.wishlist.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("account.wishlist.description")}</p>
        </div>
        {items.length > 0 && <p className="text-sm text-muted-foreground">{t("account.wishlist.count", { count: items.length })}</p>}
      </div>

      {wishlist.isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4]" />
          ))}
        </div>
      ) : wishlist.isError ? (
        <EmptyState
          icon={Heart}
          title={t("account.errors.load")}
          action={
            <Button variant="outline" size="sm" onClick={() => wishlist.refetch()}>
              {t("account.errors.retry")}
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title={t("account.wishlist.empty_title")}
          text={t("account.wishlist.empty_text")}
          action={
            <Button asChild>
              <Link to="/marketplace">{t("account.wishlist.go_shop")}</Link>
            </Button>
          }
        />
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <li key={item.id}>
              <ProductCard
                product={item.product}
                saved
                onToggleSave={remove}
                onAddToCart={(p) => shop.addToCart(p)}
                adding={shop.isAddingToCart(item.product.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
