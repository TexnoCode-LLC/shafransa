import React, { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { checkout } from "../../services/order.service"
import { getCart } from "../../services/cart.service"
import { useNavigate, Link } from "react-router-dom"
import { useAuthStore } from "../../store/useAuthStore"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { 
  CheckCircle2, Loader2, ChevronLeft, CreditCard, 
  Truck, ShieldCheck, MapPin, Phone, User, 
  Info, ShoppingBag
} from "lucide-react"
import SEO from "../../components/common/SEO"
import { formatPrice, formatPriceUsd } from "../../lib/format"

export default function CheckoutPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()
  const [success, setSuccess] = useState(false)
  const [orderId, setOrderId] = useState("")
  
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    note: ""
  })

  const [paymentMethod, setPaymentMethod] = useState("cod") // cod = cash on delivery

  const { data: cart, isLoading: isCartLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
    enabled: isAuthenticated
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => checkout(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(["cart"])
      queryClient.invalidateQueries(["orders"])
      setOrderId(res.id)
      setSuccess(true)
      window.scrollTo(0, 0)
    },
    onError: (err) => {
      alert(t('checkout.error', "Checkout failed: ") + (err.message || "Unknown error"))
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const cartData = cart?.data || cart
    const cartItems = cartData?.items || []
    if (cartItems.length === 0) return
    mutate(formData)
  }

  const cartData = cart?.data || cart
  const cartItems = cartData?.items || []
  const subtotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0)

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-24 px-4 text-center space-y-8 animate-fade-in">
        <div className="bg-emerald-50 w-24 h-24 rounded-[32px] flex items-center justify-center mx-auto mb-10 border border-emerald-100 shadow-xl shadow-emerald-500/10">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-[#1a1c1e] mb-4">{t('checkout.success_title', 'Order Confirmed!')}</h1>
          <p className="text-muted-foreground text-lg font-medium leading-relaxed max-w-lg mx-auto">
            {t('checkout.success_desc', 'Your botanical acquisition has been registered successfully. Our specialists are preparing your order.')}
          </p>
        </div>
        
        <div className="bg-white p-8 rounded-[40px] border border-neutral-100 shadow-2xl shadow-black/5 max-w-md mx-auto">
           <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">{t('checkout.order_id', 'Order Identification')}</div>
           <div className="text-xl font-mono font-bold text-[#1a1c1e]">#{orderId?.slice(0, 8).toUpperCase()}</div>
           <div className="mt-8 flex flex-col gap-3">
              <Button size="lg" className="w-full rounded-xl h-14 font-bold shadow-xl shadow-primary/20" onClick={() => navigate("/user/orders")}>
                {t('checkout.track_order', 'Track Order Status')}
              </Button>
              <Button variant="ghost" className="w-full rounded-xl h-12 text-sm font-bold text-muted-foreground" onClick={() => navigate("/marketplace")}>
                {t('checkout.back_marketplace', 'Return to Marketplace')}
              </Button>
           </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 lg:px-8">
      <SEO title="Checkout" noindex={true} />
      {/* Progress / Back */}
      <div className="mb-10">
        <button onClick={() => navigate("/cart")} className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-[#1a1c1e] mb-4 transition-colors">
          <ChevronLeft className="w-4 h-4" /> {t('checkout.back_cart', 'Back to Shopping Bag')}
        </button>
        <h1 className="text-4xl font-display font-bold tracking-tight text-[#1a1c1e]">{t('checkout.title', 'Secure Checkout')}</h1>
      </div>
      
      <div className="grid lg:grid-cols-[1fr_400px] gap-12">
        {/* Form Sections */}
        <div className="space-y-8">
          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-8">
            {/* Information */}
            <div className="p-8 md:p-10 rounded-[40px] border border-neutral-100 bg-white shadow-xl shadow-black/5 space-y-8">
               <div className="flex items-center gap-4 border-b border-neutral-50 pb-6">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center"><User className="w-5 h-5 text-primary" /></div>
                  <h2 className="text-xl font-display font-bold text-[#1a1c1e]">{t('checkout.header_info', 'Delivery Recipient')}</h2>
               </div>

               <div className="grid md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">{t('checkout.label_fullname', 'Full Name')}</label>
                    <div className="relative">
                      <Input required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} placeholder="e.g. Zakir Aliyev" className="h-14 rounded-2xl bg-[#fafafa] border-transparent focus:bg-white focus:ring-primary/20 transition-all font-medium pl-10" />
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">{t('checkout.label_phone', 'Contact Number')}</label>
                    <div className="relative">
                      <Input required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+994 50 000 00 00" className="h-14 rounded-2xl bg-[#fafafa] border-transparent focus:bg-white focus:ring-primary/20 transition-all font-medium pl-10" />
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                    </div>
                 </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">{t('checkout.label_address', 'Logistics Destination')}</label>
                  <div className="relative">
                    <Input required value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder={t('checkout.placeholder_address', "Street, building, apartment...")} className="h-14 rounded-2xl bg-[#fafafa] border-transparent focus:bg-white focus:ring-primary/20 transition-all font-medium pl-10" />
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">{t('checkout.label_note', 'Delivery Directives (Optional)')}</label>
                  <Input value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})} placeholder={t('checkout.placeholder_note', "e.g. Specialist handling required")} className="h-14 rounded-2xl bg-[#fafafa] border-transparent focus:bg-white focus:ring-primary/20 transition-all font-medium" />
               </div>
            </div>

            {/* Payment */}
            <div className="p-8 md:p-10 rounded-[40px] border border-neutral-100 bg-white shadow-xl shadow-black/5 space-y-8">
               <div className="flex items-center gap-4 border-b border-neutral-50 pb-6">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center"><CreditCard className="w-5 h-5 text-amber-500" /></div>
                  <h2 className="text-xl font-display font-bold text-[#1a1c1e]">{t('checkout.header_payment', 'Financial Settlement')}</h2>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    onClick={() => setPaymentMethod("cod")}
                    className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex flex-col gap-4 ${paymentMethod === "cod" ? "border-primary bg-primary/5 shadow-lg shadow-primary/5" : "border-neutral-100 hover:border-neutral-300"}`}
                  >
                     <div className="flex items-center justify-between">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === "cod" ? "border-primary" : "border-neutral-300"}`}>
                           {paymentMethod === "cod" && <div className="w-3 h-3 rounded-full bg-primary" />}
                        </div>
                        <Truck className={`w-6 h-6 ${paymentMethod === "cod" ? "text-primary" : "text-muted-foreground/40"}`} />
                     </div>
                     <div>
                        <div className="font-bold text-[#1a1c1e]">{t('checkout.payment_cod', 'Cash on Delivery')}</div>
                        <div className="text-xs text-muted-foreground font-medium mt-1">{t('checkout.payment_cod_desc', 'Pay securely at your doorstep')}</div>
                     </div>
                  </div>

                  <div 
                    className="p-6 rounded-3xl border-2 border-neutral-100 opacity-50 cursor-not-allowed flex flex-col gap-4 grayscale"
                  >
                     <div className="flex items-center justify-between">
                        <div className="w-6 h-6 rounded-full border-2 border-neutral-300" />
                        <CreditCard className="w-6 h-6 text-muted-foreground/40" />
                     </div>
                     <div>
                        <div className="font-bold text-[#1a1c1e]">{t('checkout.payment_card', 'Digital Assets')}</div>
                        <div className="text-xs text-muted-foreground font-medium mt-1">{t('checkout.payment_card_coming', 'Activation scheduled soon')}</div>
                     </div>
                  </div>
               </div>
            </div>
          </form>
        </div>

        {/* Sticky Summary */}
        <div className="relative">
          <div className="lg:sticky lg:top-24 space-y-6">
            <div className="p-8 rounded-[40px] border border-neutral-100 bg-white shadow-2xl shadow-black/5 overflow-hidden">
               <h3 className="text-xl font-display font-bold mb-6 text-[#1a1c1e]">{t('checkout.summary_title', 'Final Summary')}</h3>
               
               <div className="max-h-[220px] overflow-y-auto pr-2 space-y-4 mb-8 thin-scrollbar">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex gap-4 items-center">
                       <div className="w-14 h-14 bg-neutral-50 rounded-xl flex-shrink-0 flex items-center justify-center border border-neutral-50 overflow-hidden">
                          {(item.product.image || item.product.images?.[0]) ? (
                            <img src={item.product.image || item.product.images[0]} className="w-full h-full object-cover p-1" alt="" />
                          ) : (
                            <ShoppingBag className="w-6 h-6 text-neutral-200" />
                          )}
                       </div>
                       <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-[#1a1c1e] truncate">{item.product.title}</div>
                          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">x{item.quantity} • {formatPrice(item.product.price * item.quantity)}</div>
                       </div>
                    </div>
                  ))}
               </div>

               <div className="space-y-4 pt-6 border-t border-neutral-50 mb-8">
                  <div className="flex justify-between text-sm font-medium text-muted-foreground">
                    <span>{t('cart.subtotal', 'Subtotal')}</span>
                    <span className="text-[#1a1c1e] font-bold">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium text-muted-foreground">
                    <span>{t('cart.shipping', 'Shipping')}</span>
                    <span className="text-emerald-500 font-bold uppercase text-[9px] tracking-widest font-sans inline-flex items-center gap-1">
                       <Truck className="w-3 h-3" /> {t('cart.shipping_free', 'FREE')}
                    </span>
                  </div>
                  <div className="pt-4 flex justify-between font-display font-bold text-3xl text-[#1a1c1e]">
                    <span>{t('cart.total', 'Total')}</span>
                    <span className="text-right text-primary">{formatPrice(subtotal)}<span className="block text-sm font-medium text-muted-foreground">≈ {formatPriceUsd(subtotal)}</span></span>
                  </div>
               </div>

               <Button 
                 form="checkout-form"
                 type="submit" 
                 disabled={isPending || cartItems.length === 0}
                 className="w-full h-16 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 transition-all group overflow-hidden relative"
               >
                 {isPending ? (
                   <Loader2 className="h-6 w-6 animate-spin" />
                 ) : (
                   <>
                     <span className="relative z-10">{t('checkout.finalize_order', 'Finalize Acquisition')}</span>
                     <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                   </>
                 )}
               </Button>
               
               <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> {t('checkout.secure_label', 'Encrypted Transaction Security')}
               </div>
            </div>

            {/* Assistance Card */}
            <div className="p-6 rounded-3xl bg-neutral-900 text-white shadow-xl shadow-black/10 flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <Info className="w-5 h-5 text-white/60" />
               </div>
               <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-white/40">{t('checkout.need_help', 'Support')}</div>
                  <div className="text-sm font-medium mt-0.5">{t('checkout.support_text', 'Our botanical specialists are online.')}</div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
