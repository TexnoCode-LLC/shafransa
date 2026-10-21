import React, { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getSellerOrders } from "../../services/order.service"
import { getMyProducts, createProduct, updateProduct, deleteProduct } from "../../services/product.service"
import { useAuthStore } from "../../store/useAuthStore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card"
import { Badge } from "../../components/ui/Badge"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Package, Trash2, DollarSign, Activity, UploadCloud, Loader2, ShieldCheck, ShoppingBag, ArrowRight, Settings, Leaf, Store, Globe, Star, X } from "lucide-react"
import { toast } from "../../store/useToastStore"
import TranslationTabs from "../../components/shared/TranslationTabs"
import api from "../../services/api"
import { formatPrice } from "../../lib/format"

export default function SellerPanel({ tab = "overview" }) {
  const { t, i18n } = useTranslation()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState(tab)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || "",
    avatar: user?.avatar || "",
    description: user?.description || ""
  })

  // Sync with route-provided tab prop
  useEffect(() => setActiveTab(tab), [tab])

  const { data: orders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ["sellerOrders"],
    queryFn: getSellerOrders,
    enabled: activeTab === "orders" || activeTab === "overview"
  })

  const { data: myProductsResponse, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["myProducts"],
    queryFn: getMyProducts,
    enabled: activeTab === "products" || activeTab === "overview"
  })

  // getMyProducts now returns { success: true, data: [...] } OR directly [...] 
  // depending on service implementation. service.js says res.data, which is [...]
  const myProductsRaw = myProductsResponse || []
  const myProducts = Array.isArray(myProductsRaw) ? myProductsRaw : 
                     Array.isArray(myProductsRaw?.data) ? myProductsRaw.data : []

  const orderItems = orders?.data || (Array.isArray(orders) ? orders : [])
  const revenue = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const tabs = [
    { id: "overview", label: t('seller.tabs.overview', 'Overview'), icon: Activity },
    { id: "products", label: t('seller.tabs.inventory', 'Inventory'), icon: Package },
    { id: "orders", label: t('seller.tabs.orders', 'Orders'), icon: ShoppingBag },
    { id: "settings", label: t('seller.tabs.settings', 'Settings'), icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-neutral-100 pb-12">
        <div className="space-y-3">
           <Badge className="bg-primary/10 text-primary border-primary/20 font-bold uppercase tracking-widest text-[10px] px-3">{t('seller.badge', 'Seller Institutional')}</Badge>
           <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-[#1a1c1e]">{t('seller.title', 'Store Command.')}</h1>
           <p className="text-lg text-muted-foreground font-medium">{t('seller.subtitle', 'Global botanical exchange management for {{name}}.', { name: user?.fullName })}</p>
        </div>
        
        <div className="flex items-center gap-2 p-1.5 bg-neutral-200/50 rounded-2xl w-fit">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                  isActive 
                    ? "bg-white text-primary shadow-sm shadow-black/5" 
                    : "text-muted-foreground hover:text-[#1a1c1e]"
                }`}
              >
                <tab.icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'opacity-60'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {activeTab === "overview" && (
        <div className="space-y-12">
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="premium-card p-4">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('seller.stats.revenue', 'Certified Revenue')}</CardTitle>
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                   <DollarSign className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-4xl font-display font-bold text-[#1a1c1e]">{formatPrice(revenue)}</div>
                <div className="flex items-center gap-1.5 mt-2 text-green-600 font-bold text-xs uppercase tracking-tight">
                   <Activity className="w-3 h-3" />
                   {t('seller.stats.growth', 'Growth Trending Up')}
                </div>
              </CardContent>
            </Card>
            
            <Card className="premium-card p-4">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('seller.stats.units', 'Active Units')}</CardTitle>
                <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center">
                   <Package className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-4xl font-display font-bold text-[#1a1c1e]">{myProducts.length}</div>
                <p className="text-xs font-bold text-muted-foreground/60 mt-2 uppercase tracking-widest">{t('seller.stats.verified_cats', 'Across Verified Categories')}</p>
              </CardContent>
            </Card>

            <Card className="premium-card p-4">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('seller.stats.pending', 'Pending Fulfillment')}</CardTitle>
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                   <UploadCloud className="h-4 w-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-4xl font-display font-bold text-[#1a1c1e]">{orderItems.length}</div>
                <p className="text-xs font-bold text-muted-foreground/60 mt-2 uppercase tracking-widest">{t('seller.stats.lab_checked', 'Requires Lab-Checked Shipping')}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
             <Card className="premium-card bg-[#1a1c1e] text-white border-none lg:col-span-2">
                <CardHeader className="p-8 border-b border-white/5">
                   <CardTitle className="text-xl font-display font-bold">{t('seller.verification.title', 'Seller Verification Score')}</CardTitle>
                   <CardDescription className="text-white/40">{t('seller.verification.subtitle', 'Your clinical grade standing.')}</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                   <div className="flex items-center justify-between">
                      <span className="text-sm font-bold uppercase tracking-widest text-white/60">{t('seller.verification.purity', 'Purity Rating')}</span>
                      <span className="text-primary font-bold">99.8%</span>
                   </div>
                   <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[98%]"></div>
                   </div>
                   <p className="text-sm text-white/50 leading-relaxed pt-4 border-t border-white/5">{t('seller.verification.text', 'You are currently in the top 1% of botanical sellers. Your \'Clinically Verified\' badge is active on all listings.')}</p>
                </CardContent>
             </Card>
          </div>
        </div>
      )}

      {activeTab === "products" && <ProductManager myProducts={myProducts} isLoading={isLoadingProducts} client={queryClient} />}

      {activeTab === "orders" && (
        <Card className="premium-card">
          <CardHeader className="p-8 border-b border-neutral-100/50">
            <CardTitle className="text-2xl font-display font-bold">{t('seller.orders.title', 'Global Transactions')}</CardTitle>
            <CardDescription className="text-sm font-medium">{t('seller.orders.subtitle', 'Real-time ledger of inbound molecular orders.')}</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            {isLoadingOrders ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                 <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                 <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">{t('seller.syncing', 'Syncing with blockchain ledger...')}</p>
              </div>
            ) : orderItems.length === 0 ? (
              <div className="text-center py-24 premium-card border-dashed bg-neutral-50/50 border-2">
                 <Package className="mx-auto h-12 w-12 mb-4 opacity-10" />
                 <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">{t('seller.no_orders', 'No transaction data found.')}</p>
              </div>
            ) : (
               <div className="overflow-x-auto rounded-2xl border border-neutral-100">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-[#f5f5f7] text-[#1a1c1e] font-bold uppercase tracking-widest text-[10px] border-b border-neutral-100">
                    <tr>
                      <th className="px-6 py-4">{t('seller.orders.id', 'Manifest ID')}</th>
                      <th className="px-6 py-4">{t('seller.orders.title', 'Specimen Title')}</th>
                      <th className="px-6 py-4 text-center">{t('seller.orders.qty', 'Qty')}</th>
                      <th className="px-6 py-4">{t('seller.orders.value', 'Order Value')}</th>
                      <th className="px-6 py-4">{t('seller.orders.timestamp', 'Timestamp')}</th>
                      <th className="px-6 py-4 text-right">{t('seller.orders.fulfillment', 'Fulfillment')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50 bg-white">
                    {orderItems.map((item) => (
                      <tr key={item.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="px-6 py-5 font-bold text-[#1a1c1e]">#{(item.order.id || '').substring(0,8).toUpperCase()}</td>
                        <td className="px-6 py-5 text-muted-foreground font-medium">{item.product.translations?.find(tr => tr.language === i18n.language)?.title || item.product.translations?.[0]?.title || "Product"}</td>
                        <td className="px-6 py-5 text-center font-bold">{item.quantity}</td>
                        <td className="px-6 py-5 font-bold text-[#1a1c1e]">{formatPrice(item.price * item.quantity)}</td>
                        <td className="px-6 py-5 text-muted-foreground font-medium whitespace-nowrap">{new Date(item.order.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-5 text-right">
                           <Badge className="bg-orange-50 text-orange-600 border-orange-100 font-bold text-[9px] px-3 uppercase tracking-widest">PENDING LAB LOG</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "settings" && (
        <div className="max-w-3xl">
          <Card className="premium-card">
            <CardHeader className="p-8 border-b border-neutral-100/50">
              <CardTitle className="text-2xl font-display font-bold">{t('seller.settings.title', 'Storefront Identity')}</CardTitle>
              <CardDescription className="text-sm font-medium">{t('seller.settings.subtitle', 'Manage how your institution appears.')}</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={async (e) => {
                e.preventDefault()
                setIsUpdatingProfile(true)
                try {
                  await api.put("/user/me", profileData)
                  toast.success(t('seller.settings.success', 'Storefront identity updated!'))
                  window.location.reload()
                } catch (err) {
                  toast.error(t('seller.settings.error', 'Failed to update storefront profile'))
                } finally {
                  setIsUpdatingProfile(false)
                }
              }} className="space-y-8">
                
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-3xl bg-[#f5f5f7] border border-neutral-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {profileData.avatar ? (
                      <img src={profileData.avatar} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-8 h-8 text-neutral-400" />
                    )}
                  </div>
                  <div className="space-y-2 flex-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('seller.settings.label_logo', 'Institution Logo (URL)')}</label>
                    <Input 
                      placeholder="https://example.com/logo.png" 
                      value={profileData.avatar}
                      onChange={e => setProfileData({...profileData, avatar: e.target.value})}
                      className="h-12 rounded-xl bg-neutral-50 border-neutral-200"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-neutral-100">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('seller.settings.label_name', 'Institution Legal Name')}</label>
                    <Input 
                      placeholder="e.g. Helix Botanical Labs" 
                      value={profileData.fullName}
                      onChange={e => setProfileData({...profileData, fullName: e.target.value})}
                      className="h-12 rounded-xl bg-neutral-50 border-neutral-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('seller.settings.label_bio', 'Clinical Abstract / Bio')}</label>
                    <textarea 
                      placeholder="..." 
                      value={profileData.description}
                      onChange={e => setProfileData({...profileData, description: e.target.value})}
                      className="w-full min-h-[120px] p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <Button type="submit" className="h-12 px-8 rounded-xl font-bold shadow-lg shadow-primary/20 btn-hover" disabled={isUpdatingProfile}>
                    {isUpdatingProfile ? <Loader2 className="animate-spin h-5 w-5" /> : t('common.save_changes', 'Save Changes')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function ProductManager({ myProducts, isLoading, client }) {
  const { t, i18n } = useTranslation()
  const [editingId, setEditingId] = useState(null)
  const [activeLang, setActiveLang] = useState('az')
  
  const { data: plantsResponse } = useQuery({
    queryKey: ["plants", {}],
    queryFn: () => api.get("/plants")
  })
  const plants = Array.isArray(plantsResponse) ? plantsResponse : (plantsResponse?.data || [])
  
  const initialTranslations = {
    az: { title: "", description: "", region: "", form: "", activeCompounds: "", qualityTracking: "" },
    en: { title: "", description: "", region: "", form: "", activeCompounds: "", qualityTracking: "" },
    ru: { title: "", description: "", region: "", form: "", activeCompounds: "", qualityTracking: "" },
    tr: { title: "", description: "", region: "", form: "", activeCompounds: "", qualityTracking: "" }
  }

  const [translations, setTranslations] = useState(initialTranslations)
  const [formData, setFormData] = useState({ 
    price: "", 
    originalPrice: "", 
    stock: "", 
    verified: true, 
    featured: false,
    scientificName: "",
    batchNumber: "",
    heavyMetalTest: false,
    pesticideTest: false,
    activeCompoundPercent: "",
    plantId: ""
  })
  const [imageFile, setImageFile] = useState(null)
  const [galleryFiles, setGalleryFiles] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [deleteGalleryUrls, setDeleteGalleryUrls] = useState([])
  const [previews, setPreviews] = useState({ main: null, gallery: [] })
  
  const resetForm = () => {
    setEditingId(null)
    setTranslations(initialTranslations)
    setFormData({ 
      price: "", 
      originalPrice: "", 
      stock: "", 
      verified: true, 
      featured: false,
      scientificName: "",
      batchNumber: "",
      heavyMetalTest: false,
      pesticideTest: false,
      activeCompoundPercent: "",
      plantId: ""
    })
    setImageFile(null)
    setGalleryFiles([])
    setExistingImages([])
    setDeleteGalleryUrls([])
    setPreviews({ main: null, gallery: [] })
  }

  const handleEdit = (product) => {
    setEditingId(product.id)
    setFormData({
      price: product.price,
      originalPrice: product.originalPrice || "",
      stock: product.stock,
      verified: product.verified || true,
      featured: product.featured || false,
      scientificName: product.scientificName || "",
      batchNumber: product.batchNumber || "",
      heavyMetalTest: product.heavyMetalTest || false,
      pesticideTest: product.pesticideTest || false,
      activeCompoundPercent: product.activeCompoundPercent || "",
      plantId: product.plantId || ""
    })
    
    // Map all translations
    const newTrans = { ...initialTranslations }
    product.translations?.forEach(item => {
      if (newTrans[item.language]) {
        newTrans[item.language] = { 
          title: item.title || "", 
          description: item.description || "", 
          region: item.region || "", 
          form: item.form || "",
          activeCompounds: item.activeCompounds || "",
          qualityTracking: item.qualityTracking || ""
        }
      }
    })
    setTranslations(newTrans)

    setExistingImages(product.images || [])
    setPreviews({ main: product.image, gallery: [] })
    
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const { mutate: saveProduct, isPending: saving } = useMutation({
    mutationFn: (data) => {
      const form = new FormData()
      form.append("price", data.price)
      if (data.originalPrice) form.append("originalPrice", data.originalPrice)
      form.append("stock", data.stock)
      form.append("featured", data.featured)
      if (data.scientificName) form.append("scientificName", data.scientificName)
      if (data.batchNumber) form.append("batchNumber", data.batchNumber)
      form.append("heavyMetalTest", data.heavyMetalTest)
      form.append("pesticideTest", data.pesticideTest)
      if (data.activeCompoundPercent) form.append("activeCompoundPercent", data.activeCompoundPercent)
      if (data.plantId) form.append("plantId", data.plantId)

      if (imageFile) form.append("ImageFile", imageFile)
      if (imageFile) form.append("NewImageFile", imageFile) // For UpdateDto compatibility
      
      galleryFiles.forEach(file => {
        form.append("GalleryFiles", file)
        form.append("NewGalleryFiles", file) // For UpdateDto compatibility
      })

      if (editingId && deleteGalleryUrls.length > 0) {
        deleteGalleryUrls.forEach(url => form.append("DeleteGalleryUrls", url))
      }

      const transArray = Object.entries(translations)
        .map(([lang, fields]) => ({ language: lang, ...fields }))
        .filter(tr => tr.title.trim())
      
      transArray.forEach(tr => {
        form.append("translationJson", JSON.stringify(tr))
      })

      return editingId ? updateProduct(editingId, form) : createProduct(form)
    },
    onSuccess: () => {
      client.invalidateQueries(["myProducts"])
      client.invalidateQueries(["products"])
      resetForm()
      toast.success(editingId ? t('seller.products.updated', 'Product updated!') : t('seller.products.created', 'Product listed!'))
    }
  })

  const { mutate: del } = useMutation({
    mutationFn: (id) => deleteProduct(id),
    onSuccess: () => {
      client.invalidateQueries(["myProducts"])
      client.invalidateQueries(["products"])
      toast.success(t('seller.products.deleted', 'Product removed.'))
    }
  })

  const handleFileChange = (e, type) => {
    const files = Array.from(e.target.files)
    if (!files.length) return

    if (type === 'main') {
      const file = files[0]
      setImageFile(file)
      setPreviews(prev => ({ ...prev, main: URL.createObjectURL(file) }))
    } else {
      setGalleryFiles(prev => [...prev, ...files])
      const newPreviews = files.map(f => URL.createObjectURL(f))
      setPreviews(prev => ({ ...prev, gallery: [...prev.gallery, ...newPreviews] }))
    }
  }

  const getDisplayTitle = (product) => {
    if (!product.translations || product.translations.length === 0) return "No Title"
    const currentLang = product.translations.find(tr => tr.language === i18n.language)
    if (currentLang) return currentLang.title
    const azLang = product.translations.find(tr => tr.language === 'az')
    if (azLang) return azLang.title
    return product.translations[0].title
  }

  return (
    <div className="grid lg:grid-cols-3 gap-12">
      <Card className="lg:col-span-1 h-fit premium-card border-neutral-100">
        <CardHeader className="p-8 border-b border-neutral-100/50">
          <CardTitle className="text-xl font-display font-bold text-[#1a1c1e]">{editingId ? t('common.edit', 'Edit') : t('seller.products.intake', 'Molecular Intake')}</CardTitle>
          <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">{editingId ? t('seller.products.editing_desc', 'Update specimen data.') : t('seller.products.intake_sub', 'Register new clinical specimens.')}</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={(e) => { e.preventDefault(); saveProduct(formData); }} className="space-y-6">
            
            <TranslationTabs activeLang={activeLang} onLangChange={setActiveLang}>
              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {t('seller.products.label_title', 'Scientific Title')} ({activeLang.toUpperCase()})
                   </label>
                   <Input 
                    placeholder="e.g. Bio-Saffron" 
                    required={activeLang === 'az'} 
                    value={translations[activeLang].title} 
                    onChange={e => setTranslations({...translations, [activeLang]: {...translations[activeLang], title: e.target.value}})} 
                    className="h-12 rounded-xl bg-neutral-50 border-neutral-200" 
                   />
                </div>
                
                <div className="space-y-1">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {t('seller.products.label_description', 'Abstract / Description')} ({activeLang.toUpperCase()})
                   </label>
                   <textarea 
                      placeholder="..." 
                      required={activeLang === 'az'} 
                      value={translations[activeLang].description} 
                      onChange={e => setTranslations({...translations, [activeLang]: {...translations[activeLang], description: e.target.value}})} 
                      className="w-full min-h-[100px] p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                   />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('seller.products.label_region', 'Region')}</label>
                    <Input 
                      value={translations[activeLang].region} 
                      onChange={e => setTranslations({...translations, [activeLang]: {...translations[activeLang], region: e.target.value}})} 
                      className="h-10 rounded-xl bg-neutral-50 border-neutral-200 text-xs" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('seller.products.label_form', 'Form')}</label>
                    <Input 
                      placeholder="e.g. Powder"
                      value={translations[activeLang].form} 
                      onChange={e => setTranslations({...translations, [activeLang]: {...translations[activeLang], form: e.target.value}})} 
                      className="h-10 rounded-xl bg-neutral-50 border-neutral-200 text-xs" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {t('seller.products.label_active_compounds', 'Active Compounds')} ({activeLang.toUpperCase()})
                   </label>
                   <Input 
                    placeholder="..." 
                    value={translations[activeLang].activeCompounds} 
                    onChange={e => setTranslations({...translations, [activeLang]: {...translations[activeLang], activeCompounds: e.target.value}})} 
                    className="h-11 rounded-xl bg-neutral-50 border-neutral-200 text-xs" 
                   />
                </div>
                
                <div className="space-y-1">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {t('seller.products.label_quality', 'Quality Tracking')} ({activeLang.toUpperCase()})
                   </label>
                   <textarea 
                      placeholder="..." 
                      value={translations[activeLang].qualityTracking} 
                      onChange={e => setTranslations({...translations, [activeLang]: {...translations[activeLang], qualityTracking: e.target.value}})} 
                      className="w-full min-h-[60px] p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                   />
                </div>
              </div>
            </TranslationTabs>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-50">
               <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('seller.products.label_price', 'Market Price ($)')}</label>
                  <Input type="number" step="0.01" placeholder="99.00" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="h-12 rounded-xl bg-neutral-50 border-neutral-200" />
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('seller.products.label_original_price', 'Retail MSRP ($)')}</label>
                  <Input type="number" step="0.01" placeholder="120.00" value={formData.originalPrice} onChange={e => setFormData({...formData, originalPrice: e.target.value})} className="h-12 rounded-xl bg-neutral-50 border-neutral-200" />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('seller.products.label_stock', 'Inventory Level')}</label>
                  <Input type="number" placeholder="500" required value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="h-12 rounded-xl bg-neutral-50 border-neutral-200" />
               </div>
               <div className="space-y-1 flex flex-col justify-end">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, featured: !formData.featured})}
                    className={`h-12 rounded-xl border flex items-center justify-center gap-2 transition-colors ${formData.featured ? 'bg-amber-500/10 border-amber-500 text-amber-600' : 'bg-neutral-50 border-neutral-200 text-muted-foreground'}`}
                  >
                    <Star className={`w-4 h-4 ${formData.featured ? 'fill-current' : ''}`} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{t('seller.products.featured', 'Featured')}</span>
                  </button>
               </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-neutral-50">
               <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">{t('seller.products.sections.clinical', 'Clinical & Laboratory')}</h3>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('seller.products.label_batch', 'Batch Number')}</label>
                    <Input placeholder="BN-2026-X" value={formData.batchNumber} onChange={e => setFormData({...formData, batchNumber: e.target.value})} className="h-11 rounded-xl bg-neutral-50 border-neutral-200" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('seller.products.label_scientific', 'Scientific Name')}</label>
                    <Input placeholder="Crocus sativus" value={formData.scientificName} onChange={e => setFormData({...formData, scientificName: e.target.value})} className="h-11 rounded-xl bg-neutral-50 border-neutral-200" />
                  </div>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('seller.products.label_link_plant', 'Link to Encyclopedia')}</label>
                 <select 
                    value={formData.plantId} 
                    onChange={e => setFormData({...formData, plantId: e.target.value})}
                    className="w-full h-11 rounded-xl bg-neutral-50 border border-neutral-200 text-sm px-3 outline-none"
                 >
                    <option value="">{t('seller.products.select_plant', 'None (Manual Registry)')}</option>
                    {plants.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.scientificName})</option>
                    ))}
                 </select>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, heavyMetalTest: !formData.heavyMetalTest})}
                    className={`h-11 rounded-xl border flex items-center justify-center gap-2 transition-colors ${formData.heavyMetalTest ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600' : 'bg-neutral-50 border-neutral-200 text-muted-foreground'}`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Heavy Metals</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, pesticideTest: !formData.pesticideTest})}
                    className={`h-11 rounded-xl border flex items-center justify-center gap-2 transition-colors ${formData.pesticideTest ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600' : 'bg-neutral-50 border-neutral-200 text-muted-foreground'}`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Pesticides</span>
                  </button>
               </div>

               <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('seller.products.label_purity', 'Active Compound %')}</label>
                  <Input type="number" placeholder="- %" value={formData.activeCompoundPercent} onChange={e => setFormData({...formData, activeCompoundPercent: e.target.value})} className="h-11 rounded-xl bg-neutral-50 border-neutral-200" />
               </div>
            </div>

            <div className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('seller.products.label_main_image', 'Main Specimen Media')}</label>
                  <div className="flex items-center gap-4">
                     <div className="w-20 h-20 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-center overflow-hidden">
                        {previews.main ? <img src={previews.main} className="w-full h-full object-cover" /> : <UploadCloud className="w-6 h-6 text-neutral-300" />}
                     </div>
                     <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'main')} className="flex-1 rounded-xl cursor-pointer" />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('seller.products.label_gallery', 'Auxiliary Gallery')}</label>
                  <Input type="file" multiple accept="image/*" onChange={(e) => handleFileChange(e, 'gallery')} className="rounded-xl cursor-pointer" />
                  
                  {(previews.gallery.length > 0 || existingImages.length > 0) && (
                    <div className="grid grid-cols-4 gap-2 p-3 bg-neutral-50 rounded-xl border border-neutral-100 mt-2">
                       {existingImages.map((url, idx) => (
                         <div key={`existing-${idx}`} className="relative group aspect-square rounded-lg overflow-hidden border border-neutral-200">
                            <img src={url} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <button type="button" onClick={() => {
                                 setDeleteGalleryUrls(prev => [...prev, url])
                                 setExistingImages(prev => prev.filter(u => u !== url))
                               }} className="p-1.5 rounded-md bg-white text-red-500"><X className="w-3.5 h-3.5" /></button>
                            </div>
                         </div>
                       ))}
                       {previews.gallery.map((url, idx) => (
                         <div key={`new-${idx}`} className="relative group aspect-square rounded-lg overflow-hidden border border-primary/20">
                            <img src={url} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <button type="button" onClick={() => {
                                 setPreviews(prev => ({ ...prev, gallery: prev.gallery.filter((_, i) => i !== idx) }))
                                 setGalleryFiles(prev => prev.filter((_, i) => i !== idx))
                               }} className="p-1.5 rounded-md bg-white text-red-500"><X className="w-3.5 h-3.5" /></button>
                            </div>
                         </div>
                       ))}
                    </div>
                  )}
               </div>
            </div>

            <div className="pt-4 flex gap-3">
               {editingId && (
                 <Button type="button" variant="outline" onClick={resetForm} className="h-14 px-6 rounded-xl font-bold border-neutral-200" disabled={saving}>
                   {t('common.cancel', 'Cancel')}
                 </Button>
               )}
               <Button type="submit" className="flex-1 h-14 rounded-xl font-bold shadow-lg shadow-primary/20 btn-hover" disabled={saving}>
                  {saving ? <Loader2 className="animate-spin h-5 w-5" /> : (
                    <>{editingId ? t('common.save', 'Save') : t('seller.products.deploy', 'Deploy')} <ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
               </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 premium-card">
        <CardHeader className="p-8 border-b border-neutral-100/50">
          <CardTitle className="text-xl font-display font-bold text-[#1a1c1e]">{t('seller.products.ledger', 'Verified Inventory Ledger')}</CardTitle>
          <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">{t('seller.products.ledger_sub', 'Real-time status of your clinical grade products.')}</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          {isLoading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">{t('seller.products.loading', 'Scanning...')}</p>
             </div>
          ) : myProducts.length === 0 ? (
             <div className="text-center py-24 premium-card border-dashed bg-neutral-50/50 border-2">
                <Leaf className="mx-auto h-12 w-12 mb-4 opacity-10" />
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">{t('seller.products.empty', 'Vault is empty.')}</p>
             </div>
          ) : (
             <div className="grid gap-6">
                {myProducts.map(p => (
                   <div key={p.id} className="premium-card p-4 lg:p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white border-neutral-100 hover:border-primary/20 transition-all duration-300">
                      <div className="flex gap-4 lg:gap-6 items-center flex-1 w-full min-w-0">
                         <div className="h-16 w-16 bg-[#f5f5f7] rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden border border-neutral-100 aspect-square">
                            {(p.image || (p.images && p.images[0])) ? (
                               <img src={p.image || p.images[0]} className="h-full w-full object-cover" alt="" />
                            ) : (
                               <Leaf className="w-6 h-6 text-muted-foreground/20" />
                            )}
                         </div>
                         <div className="flex-1 min-w-0">
                            <div className="font-display font-bold text-lg text-[#1a1c1e] flex items-center gap-2 truncate">
                               {getDisplayTitle(p)} 
                               {p.verified && <Badge className="bg-green-50 text-green-600 border-green-100 font-bold text-[9px] px-2 py-0">CERTIFIED</Badge>}
                            </div>
                            <div className="flex items-center gap-4 mt-1">
                               <span className="text-lg font-bold text-[#1a1c1e]">{formatPrice(p.price)}</span>
                               <div className="h-4 w-[1px] bg-neutral-100"></div>
                               <span className={`text-xs font-bold uppercase tracking-widest ${p.stock < 10 ? 'text-orange-500' : 'text-muted-foreground/60'}`}>
                                  {p.stock} units
                               </span>
                            </div>
                         </div>
                      </div>
                      <div className="flex items-center gap-2 pt-4 lg:pt-0 lg:pl-6 w-full lg:w-auto justify-end border-t border-neutral-100 lg:border-none mt-2 lg:mt-0">
                         <Button variant="ghost" size="sm" className="h-9 px-4 rounded-xl font-bold text-primary hover:bg-primary/5 border border-primary/20" onClick={() => handleEdit(p)}>
                           {t('common.edit', 'Edit')}
                         </Button>
                         <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-red-50 text-red-500 border border-transparent hover:border-red-100" onClick={() => del(p.id)}>
                           <Trash2 className="w-4 h-4" />
                         </Button>
                      </div>
                   </div>
                ))}
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
