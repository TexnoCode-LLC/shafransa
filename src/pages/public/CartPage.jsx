import React, { useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getCart, removeFromCart, updateCartItem } from "../../services/cart.service"
import { useAuthStore } from "../../store/useAuthStore"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "../../components/ui/Button"
import { Trash2, ArrowRight, Loader2, Minus, Plus, ShoppingBag, ChevronLeft } from "lucide-react"
import SEO from "../../components/common/SEO"
import { formatPrice, formatPriceUsd } from "../../lib/format"

export default function CartPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: cart, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
    enabled: isAuthenticated
  })

  const { mutate: removeItem } = useMutation({
    mutationFn: (itemId) => removeFromCart(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries(["cart"])
    }
  })

  const { mutate: updateQty } = useMutation({
    mutationFn: ({ id, quantity }) => updateCartItem(id, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries(["cart"])
    }
  })

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login")
    }
  }, [isAuthenticated, navigate])

  if (!isAuthenticated) return null;

  const cartData = cart?.data || cart
  const cartItems = cartData?.items || []
  const subtotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0)
  const shipping = 0 // For now, could be dynamic

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary opacity-30" />
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">{t('cart.loading', 'Loading your selection...')}</p>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 lg:px-8">
      <SEO title="Shopping Cart" noindex={true} />
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-[#1a1c1e] mb-3 transition-colors">
            <ChevronLeft className="w-4 h-4" /> {t('common.back', 'Back')}
          </button>
          <h1 className="text-4xl font-display font-bold tracking-tight text-[#1a1c1e]">{t('cart.title', 'Shopping Cart')}</h1>
        </div>
        <div className="text-sm font-medium text-muted-foreground bg-neutral-100 px-4 py-2 rounded-full inline-flex items-center gap-2">
          <ShoppingBag className="w-4 h-4" /> {cartItems.length} {t('cart.items_label', 'Items')}
        </div>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-32 bg-white rounded-[40px] border border-neutral-100 shadow-2xl shadow-black/5">
          <div className="w-24 h-24 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-neutral-100">
            <ShoppingBag className="h-10 w-10 text-neutral-300 stroke-1" />
          </div>
          <h2 className="text-2xl font-display font-bold text-[#1a1c1e] mb-2">{t('cart.empty_title', 'Your cart is empty')}</h2>
          <p className="text-muted-foreground mb-10 max-w-sm mx-auto">{t('cart.empty_desc', 'Explore our botanical repository to find the perfect specimens for your protocol.')}</p>
          <Button size="lg" className="rounded-full px-10 h-14 font-bold shadow-xl shadow-primary/20" onClick={() => navigate("/marketplace")}>
            {t('cart.start_browsing', 'Start Browsing')}
          </Button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_380px] gap-12">
          {/* Items List */}
          <div className="space-y-6">
            {cartItems.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row gap-6 p-6 rounded-[32px] border border-neutral-100 bg-white hover:border-primary/20 transition-all duration-500 group shadow-sm hover:shadow-xl hover:shadow-black/5 items-center sm:items-start text-center sm:text-left">
                {/* Image */}
                <Link to={`/product/${item.product.id}`} className="w-40 h-40 sm:w-32 sm:h-32 bg-[#f5f5f7] rounded-3xl overflow-hidden flex-shrink-0 border border-neutral-50 flex items-center justify-center transition-transform group-hover:scale-[1.02] shadow-inner">
                  {(item.product.image || (item.product.images?.length > 0)) ? (
                    <img
                      src={item.product.image || item.product.images[0]}
                      className="w-full h-full object-cover"
                      alt={item.product.title}
                    />
                  ) : (
                    <ShoppingBag className="w-10 h-10 text-neutral-200 stroke-1" />
                  )}
                </Link>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between py-1 w-full">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="max-w-md">
                      <Link to={`/product/${item.product.id}`} className="font-display font-bold text-lg text-[#1a1c1e] hover:text-primary transition-colors line-clamp-1 leading-tight mb-1">
                        {item.product.title}
                      </Link>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-100">
                          {item.product.category?.name || t('common.botanical', 'BOTANICAL')}
                        </span>
                      </div>
                    </div>
                    <div className="text-xl font-display font-bold text-[#1a1c1e]">
                      {formatPrice(item.product.price * item.quantity)}
                      <div className="text-[10px] font-bold text-muted-foreground/50 text-right mt-0.5">{formatPrice(item.product.price)} / unit</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-6">
                    {/* Qty Controls */}
                    <div className="flex items-center bg-neutral-50 rounded-xl p-1 border border-neutral-100 shadow-inner">
                      <button
                        onClick={() => item.quantity > 1 && updateQty({ id: item.id, quantity: item.quantity - 1 })}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition-all text-muted-foreground hover:text-[#1a1c1e] disabled:opacity-30"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-10 text-center text-sm font-bold text-[#1a1c1e]">{item.quantity}</span>
                      <button
                        onClick={() => updateQty({ id: item.id, quantity: item.quantity + 1 })}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition-all text-muted-foreground hover:text-[#1a1c1e]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground/60 hover:text-rose-500 hover:bg-rose-50 h-10 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> {t('common.remove', 'Remove')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="relative">
            <div className="p-8 md:p-10 rounded-[40px] border border-neutral-100 bg-white shadow-2xl shadow-black/5 lg:sticky lg:top-24 overflow-hidden group">
              {/* Decorative accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-primary/10 transition-colors duration-700"></div>

              <h3 className="text-xl font-display font-bold mb-8 text-[#1a1c1e] relative z-10">{t('cart.order_summary', 'Order Summary')}</h3>

              <div className="space-y-4 mb-10 relative z-10">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-muted-foreground">{t('cart.subtotal', 'Subtotal')}</span>
                  <span className="text-[#1a1c1e] font-bold">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-muted-foreground">{t('cart.shipping', 'Shipping')}</span>
                  <span className="text-emerald-500 font-bold uppercase text-[9px] tracking-widest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    {t('cart.shipping_free', 'Calculated at checkout')}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-muted-foreground">{t('cart.tax', 'Estimated Tax')}</span>
                  <span className="text-[#1a1c1e] font-bold">$0.00</span>
                </div>
                <div className="h-px bg-neutral-50 my-6"></div>
                <div className="flex justify-between font-display font-bold text-2xl text-[#1a1c1e]">
                  <span>{t('cart.total', 'Total')}</span>
                  <span className="text-right text-primary">{formatPrice(subtotal)}<span className="block text-sm font-medium text-muted-foreground">≈ {formatPriceUsd(subtotal)}</span></span>
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                <Button size="lg" className="w-full h-14 rounded-full text-lg font-bold shadow-xl shadow-primary/20 transition-all hover:shadow-primary/30 active:scale-[0.98]" onClick={() => navigate("/checkout")}>
                  {t('cart.proceed_to_checkout', 'Proceed to Checkout')} <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <button onClick={() => navigate("/marketplace")} className="w-full text-center text-xs font-bold uppercase tracking-widest text-muted-foreground/60 hover:text-[#1a1c1e] transition-colors py-2">
                  {t('cart.continue_shopping', 'Continue Shopping')}
                </button>
              </div>

              {/* Guarantees */}
              <div className="mt-8 pt-8 border-t border-neutral-50 flex flex-col gap-3">
                <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center"><Plus className="w-3 h-3 text-emerald-500" /></div>
                  {t('cart.guarantee_purity', '100% Botanical Purity')}
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center"><Plus className="w-3 h-3 text-blue-500" /></div>
                  {t('cart.guarantee_lab', 'Lab Verified Specimens')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
