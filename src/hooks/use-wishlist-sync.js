import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"

import { getWishlist } from "../services/wishlist.service"
import { useAuthStore } from "../store/useAuthStore"
import { useWishlistStore } from "../store/useWishlistStore"

// Seçilmişlər (ürək işarələri) serverdəki siyahı ilə sinxron saxlanılır — sayt və istifadəçi paneli üçün
export function useWishlistSync() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const setItems = useWishlistStore((state) => state.setItems)
  const { data } = useQuery({ queryKey: ["wishlist"], queryFn: getWishlist, enabled: isAuthenticated })

  useEffect(() => {
    if (!isAuthenticated) {
      setItems([])
      return
    }
    if (!data) return
    const items = Array.isArray(data) ? data : data?.data || []
    setItems(items.map((item) => item.productId || item.product?.id).filter(Boolean))
  }, [data, isAuthenticated, setItems])
}
