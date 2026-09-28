import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { addToCart } from "../services/cart.service"
import { toggleWishlist } from "../services/wishlist.service"
import { useAuthStore } from "../store/useAuthStore"
import { useWishlistStore } from "../store/useWishlistStore"

// Market, məhsul səhifəsi və istifadəçi panelində eyni "səbətə at / seçilmişlər" davranışı
export function useShopActions() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  // items-ə abunə: siyahı dəyişəndə kartdakı ürək də yenilənir
  const savedIds = useWishlistStore((state) => state.items)
  const setSavedIds = useWishlistStore((state) => state.setItems)
  const setSaved = (productId, saved) => {
    const current = useWishlistStore.getState().items
    setSavedIds(saved ? [...new Set([...current, productId])] : current.filter((id) => id !== productId))
  }
  const [pendingCartId, setPendingCartId] = useState(null)

  // Giriş tələb olunanda: bildiriş + "Daxil ol" (girişdən sonra bu səhifəyə qayıdılır)
  const requireAuth = (messageKey) => {
    if (isAuthenticated) return true
    const redirect = encodeURIComponent(location.pathname + location.search)
    toast.info(t(messageKey), {
      action: { label: t("shop.product.login"), onClick: () => navigate(`/login?redirect=${redirect}`) },
    })
    return false
  }

  const cart = useMutation({
    mutationFn: ({ product, quantity }) => addToCart(product.id, quantity),
    onMutate: ({ product }) => setPendingCartId(product.id),
    onSuccess: (_data, { product, onDone }) => {
      queryClient.invalidateQueries({ queryKey: ["cart"] })
      if (onDone) onDone()
      else
        toast.success(t("shop.added_to_cart", { title: product.title }), {
          action: { label: t("shop.view_cart"), onClick: () => navigate("/cart") },
        })
    },
    onError: () => toast.error(t("shop.action_failed")),
    onSettled: () => setPendingCartId(null),
  })

  const wishlist = useMutation({
    mutationFn: (productId) => toggleWishlist(productId),
    // Optimistik: ürək dərhal dolur/boşalır; sonra serverin cavabı ilə dəqiqləşdirilir, xəta olsa geri qaytarılır
    onMutate: (productId) => {
      const wasSaved = useWishlistStore.getState().items.includes(productId)
      setSaved(productId, !wasSaved)
      return { wasSaved }
    },
    onSuccess: (result, productId) => {
      const saved = result?.action !== "removed"
      setSaved(productId, saved)
      queryClient.invalidateQueries({ queryKey: ["wishlist"] })
      toast.success(saved ? t("shop.saved") : t("shop.unsaved"))
    },
    onError: (_error, productId, context) => {
      setSaved(productId, !!context?.wasSaved)
      toast.error(t("shop.action_failed"))
    },
  })

  return {
    isSaved: (productId) => savedIds.includes(productId),
    isAddingToCart: (productId) => pendingCartId === productId,
    addToCart: (product, quantity = 1, onDone) => {
      if (!requireAuth("shop.login_to_buy")) return
      cart.mutate({ product, quantity, onDone })
    },
    toggleSave: (product) => {
      if (!requireAuth("shop.login_to_save")) return
      wishlist.mutate(product.id)
    },
  }
}
