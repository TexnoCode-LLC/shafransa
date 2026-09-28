import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useAuthStore } from "../../store/useAuthStore"
import { toast } from "../../store/useToastStore"
import { openExternal, safeExternalUrl } from "../../lib/utils"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getMyOrders } from "../../services/order.service"
import { getWishlist } from "../../services/wishlist.service"
import { getMySessions, cancelSession as cancelSessionService, confirmSessionAsUser, rateSession } from "../../services/therapySession.service"
import { getMyTherapistProfile, updateMyProfile as updateTherapistProfile } from "../../services/therapist.service"
import { updateMe } from "../../services/user.service"
import api from "../../services/api"
import { SESSION_STATUS, getSessionStatusLabel } from "../../constants/enums"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card"
import { Input } from "../../components/ui/Input"
import { Button } from "../../components/ui/Button"
import { Badge } from "../../components/ui/Badge"
import { Package, ShieldCheck, Loader2, User as UserIcon, Heart, Key, Sparkles, Leaf, Eye, EyeOff, Camera, Trash2, Calendar, Clock, Activity, Video, Star } from "lucide-react"
import { Link } from "react-router-dom"

const LOCAL_AVATAR_KEY = "shafransa_local_profile_avatar"
const LOCAL_PROFILE_KEY = "shafransa_local_profile_data"

const getLocalAvatar = (userId) => {
  if (!userId) return ""
  try {
    return localStorage.getItem(`${LOCAL_AVATAR_KEY}_${userId}`) || ""
  } catch {
    return ""
  }
}

const setLocalAvatar = (userId, avatar) => {
  if (!userId || !avatar) return
  try {
    localStorage.setItem(`${LOCAL_AVATAR_KEY}_${userId}`, avatar)
  } catch {
    // localStorage can fail for very large files; backend upload can still succeed.
  }
}

const getLocalProfile = (userId) => {
  if (!userId) return {}
  try {
    return JSON.parse(localStorage.getItem(`${LOCAL_PROFILE_KEY}_${userId}`) || "{}")
  } catch {
    return {}
  }
}

const setLocalProfile = (userId, profile) => {
  if (!userId) return
  try {
    localStorage.setItem(`${LOCAL_PROFILE_KEY}_${userId}`, JSON.stringify(profile))
  } catch {
    // Keep the UI responsive even when storage quota is full.
  }
}

const getInitialProfileData = (user) => {
  const localProfile = getLocalProfile(user?.id)

  return {
    fullName: localProfile.fullName || user?.fullName || "",
    email: localProfile.email || user?.email || "",
    phoneNumber: localProfile.phoneNumber || user?.phoneNumber || user?.phone || "",
    description: localProfile.description || user?.description || "",
    specialization: localProfile.specialization || "",
    licenseNumber: localProfile.licenseNumber || "",
    therapistBio: localProfile.therapistBio || "",
    profileStatus: localProfile.profileStatus || "Təsdiqli mütəxəssis",
  }
}

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

export default function UserProfile({ tab = "profile", embedded = false }) {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState(tab)
  const [formData, setFormData] = useState(getInitialProfileData(user))
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(getLocalAvatar(user?.id) || user?.avatar || "")
  const [showPassword, setShowPassword] = useState(false)
  const [ratingSessionId, setRatingSessionId] = useState(null)
  const [ratingValue, setRatingValue] = useState(5)
  const [reviewText, setReviewText] = useState("")

  // Sync tab prop with the route
  useEffect(() => setActiveTab(tab), [tab])

  const { data: ordersRaw, isLoading: loadingOrders } = useQuery({
    queryKey: ["orders", "my"],
    queryFn: getMyOrders,
    enabled: activeTab === "orders"
  })

  const { data: wishlistRaw, isLoading: loadingWishlist } = useQuery({
    queryKey: ["wishlist"],
    queryFn: getWishlist,
    enabled: activeTab === "wishlist"
  })

  const { data: sessionsRaw, isLoading: loadingSessions } = useQuery({
    queryKey: ["sessions", "my"],
    queryFn: getMySessions,
    enabled: activeTab === "sessions"
  })

  const { data: therapistProfile } = useQuery({
    queryKey: ["therapist", "me"],
    queryFn: getMyTherapistProfile,
    enabled: activeTab === "profile",
    retry: false,
  })

  useEffect(() => {
    const therapist = therapistProfile?.data || therapistProfile || {}
    const localProfile = getLocalProfile(user?.id)

    setAvatarPreview(getLocalAvatar(user?.id) || user?.avatar || "")
    setFormData({
      fullName:
        localProfile.fullName ||
        user?.fullName ||
        therapist?.user?.fullName ||
        therapist?.User?.FullName ||
        "",
      email:
        localProfile.email ||
        user?.email ||
        therapist?.email ||
        therapist?.Email ||
        therapist?.user?.email ||
        therapist?.User?.Email ||
        "",
      phoneNumber:
        localProfile.phoneNumber ||
        therapist?.phoneNumber ||
        therapist?.PhoneNumber ||
        user?.phoneNumber ||
        user?.phone ||
        "",
      description:
        localProfile.description ||
        user?.description ||
        "",
      specialization:
        localProfile.specialization ||
        therapist?.specialization ||
        therapist?.Specialization ||
        "",
      licenseNumber:
        localProfile.licenseNumber ||
        therapist?.licenseNumber ||
        therapist?.LicenseNumber ||
        "",
      therapistBio:
        localProfile.therapistBio ||
        therapist?.bio ||
        therapist?.Bio ||
        "",
      profileStatus:
        localProfile.profileStatus ||
        "Təsdiqli mütəxəssis",
    })
  }, [user, therapistProfile])

  const { mutate: updateProfile, isPending: updating } = useMutation({
    mutationFn: async (data) => {
      let localAvatar = avatarPreview

      if (avatarFile) {
        localAvatar = await fileToDataUrl(avatarFile)
      }

      const localProfile = {
        ...data,
        avatar: localAvatar,
      }

      if (avatarFile || data.phoneNumber || data.specialization || data.therapistBio || data.licenseNumber) {
        const therapistForm = new FormData()
        therapistForm.append("FullName", data.fullName || "")
        therapistForm.append("PhoneNumber", data.phoneNumber || "")
        therapistForm.append("Specialization", data.specialization || "")
        therapistForm.append("LicenseNumber", data.licenseNumber || "")
        therapistForm.append("Bio", data.therapistBio || data.description || "")
        if (avatarFile) therapistForm.append("ProfileImageFile", avatarFile)

        try {
          const updatedTherapist = await updateTherapistProfile(therapistForm)
          return {
            ...updatedTherapist?.user,
            ...updatedTherapist?.User,
            ...updatedTherapist,
            avatar:
              updatedTherapist?.user?.avatar ||
              updatedTherapist?.User?.Avatar ||
              updatedTherapist?.avatar ||
              localAvatar,
            fullName: data.fullName,
            email: data.email,
            phoneNumber: data.phoneNumber,
            description: data.description,
            specialization: data.specialization,
            licenseNumber: data.licenseNumber,
            therapistBio: data.therapistBio,
            localProfile,
            localAvatar,
          }
        } catch (error) {
          console.warn("⚠️ Therapist profile update failed, using local profile data", error?.message)
        }
      }

      try {
        const updatedUser = await updateMe({
          fullName: data.fullName,
          description: data.description,
          email: data.email,
          avatar: localAvatar,
        })

        return {
          ...updatedUser,
          phoneNumber: data.phoneNumber,
          specialization: data.specialization,
          licenseNumber: data.licenseNumber,
          therapistBio: data.therapistBio,
          avatar: updatedUser?.avatar || localAvatar,
          localProfile,
          localAvatar,
        }
      } catch (error) {
        console.warn("⚠️ User profile update failed, using local profile data", error?.message)
        return {
          ...user,
          ...localProfile,
          avatar: localAvatar,
          localProfile,
          localAvatar,
          isLocalOnly: true,
        }
      }
    },
    onSuccess: (updatedUser) => {
      const nextAvatar = updatedUser?.avatar || updatedUser?.localAvatar || avatarPreview

      setAvatarPreview(nextAvatar)
      setAvatarFile(null)
      setLocalAvatar(user?.id, nextAvatar)
      setLocalProfile(user?.id, {
        ...formData,
        ...(updatedUser?.localProfile || {}),
        avatar: nextAvatar,
      })
      useAuthStore.setState({
        user: {
          ...user,
          ...updatedUser,
          avatar: nextAvatar,
          fullName: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          description: formData.description,
        },
      })

      toast.success(t('user.profile_updated', "Profile updated!"))
    }
  })

  const { mutate: submitRating, isPending: submittingRating } = useMutation({
    mutationFn: ({ sessionId, rating, review }) => rateSession(sessionId, rating, review),
    onSuccess: () => {
      queryClient.invalidateQueries(["sessions", "my"])
      setRatingSessionId(null)
      setRatingValue(5)
      setReviewText("")
      toast.success(t('user.rating_submitted', 'Thank you for your feedback!'))
    }
  })

  const handleSave = (e) => {
    e.preventDefault()
    updateProfile(formData)
  }

  // Fix data access — service returns API wrapper already resolved by interceptor
  const orders = Array.isArray(ordersRaw) ? ordersRaw : (ordersRaw?.data || [])
  const wishlist = Array.isArray(wishlistRaw) ? wishlistRaw : (wishlistRaw?.data || [])
  const sessions = Array.isArray(sessionsRaw) ? sessionsRaw : (sessionsRaw?.data || [])

  const tabs = [
    { id: "profile", label: t('user.tab_profile', "Profile"), icon: UserIcon, href: "/user" },
    { id: "orders",  label: t('user.tab_orders', "Orders"),  icon: Package,  href: "/user/orders" },
    { id: "wishlist",label: t('user.tab_wishlist', "Wishlist"), icon: Heart,    href: "/user/wishlist" },
    { id: "sessions",label: t('user.tab_sessions', "Sessions"), icon: Activity, href: "/user/sessions" },
    { id: "settings",label: t('user.tab_settings', "Settings"), icon: Key,      href: "/user/settings" },
  ]

  return (
    <div className={embedded ? "space-y-6" : "max-w-6xl mx-auto p-6 md:p-10 space-y-10"}>
      
      {/* Yeni panel layout-unda başlıq və tablar sidebar-dadır */}
      {!embedded && (<>
      <header className="border-b border-neutral-100 pb-8">
        <Badge className="bg-primary/10 text-primary border-primary/20 font-bold uppercase tracking-widest text-[10px] px-3 mb-3">
          {t('user.member_badge', 'Member')}
        </Badge>
        <h1 className="text-4xl font-display font-bold tracking-tight text-[#1a1c1e]">
          {t('user.my_account', 'My Account')}
        </h1>
        <p className="text-muted-foreground font-medium mt-1">
          {t('user.welcome_back', 'Welcome back')}, {user?.fullName}
        </p>
      </header>

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto border-b border-neutral-100 pb-0">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            to={tab.href}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-[#1a1c1e]"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </Link>
        ))}
      </div>
      </>)}

      {/* ── PROFILE ── */}
      {activeTab === "profile" && (
        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 premium-card">
            <CardHeader className="p-8 border-b border-neutral-100/50">
              <CardTitle className="text-xl font-display font-bold">{t('user.personal_details', 'Personal Details')}</CardTitle>
              <CardDescription>Ad, əlaqə, profil şəkli və terapevt məlumatlarını yenilə.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-10">
                {/* Avatar Section */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-neutral-100 bg-neutral-50 flex items-center justify-center relative">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-12 h-12 text-neutral-300" />
                      )}
                      <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Camera className="w-6 h-6 text-white" />
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0]
                            if (file) {
                              setAvatarFile(file)
                              setAvatarPreview(URL.createObjectURL(file))
                            }
                          }}
                        />
                      </label>
                    </div>
                    {avatarFile && (
                      <button 
                        onClick={() => {
                          setAvatarFile(null)
                          setAvatarPreview(getLocalAvatar(user?.id) || user?.avatar || "")
                        }}
                        className="absolute -top-2 -right-2 bg-rose-500 text-white p-1.5 rounded-full shadow-lg hover:bg-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('user.avatar_label', 'Profile Photo')}</p>
                    <p className="text-[9px] text-muted-foreground/60 mt-1 max-w-[120px]">{t('user.avatar_hint', 'JPG, PNG or GIF. Max 2MB.')}</p>
                  </div>
                </div>

                {/* Form Section */}
                <form onSubmit={handleSave} className="flex-1 space-y-6">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('user.label_fullname', 'Full Name')}</label>
                      <Input
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="h-12 rounded-xl bg-neutral-50/50 border-neutral-200 shadow-sm focus:bg-white transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('user.label_email', 'Email')}</label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="h-12 rounded-xl bg-neutral-50/50 border-neutral-200 shadow-sm focus:bg-white transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('therapists.label_phone', 'Phone')}</label>
                      <Input
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        placeholder="+994 (__) ___ __ __"
                        className="h-12 rounded-xl bg-neutral-50/50 border-neutral-200 shadow-sm focus:bg-white transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Lisenziya nömrəsi</label>
                      <Input
                        value={formData.licenseNumber}
                        onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                        placeholder="AZ-FZ-0000"
                        className="h-12 rounded-xl bg-neutral-50/50 border-neutral-200 shadow-sm focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('user.label_description', 'Bio / Description')}</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder={t('user.bio_placeholder', 'Tell us about yourself...')}
                      className="w-full min-h-[100px] p-4 rounded-xl bg-neutral-50/50 border border-neutral-200 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm focus:bg-white"
                    />
                  </div>

                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 space-y-5">
                    <div>
                      <h3 className="text-sm font-bold text-[#1a1c1e]">Terapevt məlumatları</h3>
                      <p className="text-xs text-muted-foreground mt-1">Profil kartında və seanslarda görünən peşəkar məlumatlar.</p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('therapists.label_specialization', 'Specialization')}</label>
                        <Input
                          value={formData.specialization}
                          onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                          placeholder="Fizioterapevt"
                          className="h-12 rounded-xl bg-white border-emerald-100 shadow-sm focus:bg-white transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Profil statusu</label>
                        <Input
                          value={formData.profileStatus || "Təsdiqli mütəxəssis"}
                          onChange={(e) => setFormData({ ...formData, profileStatus: e.target.value })}
                          placeholder="Təsdiqli mütəxəssis"
                          className="h-12 rounded-xl bg-white border-emerald-100 shadow-sm focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Terapevt bio</label>
                      <textarea
                        value={formData.therapistBio}
                        onChange={(e) => setFormData({ ...formData, therapistBio: e.target.value })}
                        placeholder="Pasiyentlər üçün peşəkar yanaşmanızı yazın..."
                        className="w-full min-h-[110px] p-4 rounded-xl bg-white border border-emerald-100 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm focus:bg-white"
                      />
                    </div>
                  </div>

                  
                  <div className="pt-2">
                    <Button type="submit" disabled={updating} className="rounded-full px-10 h-12 font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                      {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : t('user.save_changes', "Save Changes")}
                    </Button>
                  </div>
                </form>
              </div>
            </CardContent>
          </Card>

          <div className="premium-card p-8 bg-[#1a1c1e] text-white space-y-4 relative overflow-hidden h-fit">
            <div className="absolute right-[-10%] bottom-[-10%] w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
            <ShieldCheck className="w-8 h-8 text-primary" />
            <div className="relative z-10">
              <h3 className="text-lg font-display font-bold">{t('user.privacy_guard', 'Privacy Guard')}</h3>
              <p className="text-white/50 text-sm mt-1 leading-relaxed">{t('user.privacy_desc', 'Your data is encrypted with AES-256 standards.')}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── ORDERS ── */}
      {activeTab === "orders" && (
        <Card className="premium-card">
          <CardHeader className="p-8 border-b border-neutral-100/50">
            <CardTitle className="text-xl font-display font-bold">{t('user.order_history', 'Order History')}</CardTitle>
            <CardDescription>{t('user.order_history_desc', 'Track all your purchases.')}</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            {loadingOrders ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary opacity-30" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-24 rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50">
                <Package className="mx-auto h-10 w-10 mb-3 text-muted-foreground/20" />
                <p className="font-bold text-[#1a1c1e]">{t('user.no_orders', 'No orders yet')}</p>
                <Link to="/marketplace" className="mt-3 inline-block text-sm font-bold text-primary hover:underline">
                  {t('user.browse_marketplace', 'Browse Marketplace')} →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="p-6 rounded-2xl border border-neutral-100 bg-white hover:border-primary/20 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="font-bold text-[#1a1c1e]">{t('user.label_order', 'Order')} #{(order.id || "").substring(0, 8).toUpperCase()}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg text-[#1a1c1e]">
                          ${order.items?.reduce((acc, i) => acc + (i.price * i.quantity), 0).toFixed(2)}
                        </div>
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-bold uppercase mt-1">
                          {t('user.order_confirmed', 'Confirmed')}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2 pl-0">
                      {order.items?.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 text-sm">
                          <span className="font-bold text-primary">{item.quantity}×</span>
                          <span className="text-muted-foreground truncate">{item.product?.title}</span>
                          <span className="ml-auto font-bold text-[#1a1c1e]">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── WISHLIST ── */}
      {activeTab === "wishlist" && (
        <div>
          <h2 className="text-xl font-display font-bold text-[#1a1c1e] mb-6">{t('user.saved_items', 'Saved Items')}</h2>
          {loadingWishlist ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary opacity-30" />
            </div>
          ) : wishlist.length === 0 ? (
            <div className="text-center py-24 rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50">
              <Heart className="mx-auto h-10 w-10 mb-3 text-muted-foreground/20" />
              <p className="font-bold text-[#1a1c1e]">{t('user.no_wishlist', 'No saved items')}</p>
              <Link to="/marketplace" className="mt-3 inline-block text-sm font-bold text-primary hover:underline">
                {t('user.browse_marketplace', 'Browse Marketplace')} →
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {wishlist.map((item) => (
                <Link
                  key={item.id}
                  to={`/product/${item.productId || item.product?.id}`}
                  className="block rounded-2xl border border-neutral-100 bg-white overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all"
                >
                  <div className="aspect-square bg-neutral-50 flex items-center justify-center">
                    {item.product?.image ? (
                      <img src={item.product.image} alt={item.product.title} className="w-full h-full object-cover" />
                    ) : (
                      <Leaf className="w-10 h-10 text-muted-foreground/20" />
                    )}
                  </div>
                  <div className="p-4">
                    <div className="font-bold text-sm text-[#1a1c1e] line-clamp-2">{item.product?.title}</div>
                    <div className="font-bold text-primary mt-1">${item.product?.price}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SESSIONS ── */}
      {activeTab === "sessions" && (
        <Card className="premium-card">
          <CardHeader className="p-8 border-b border-neutral-100/50">
            <CardTitle className="text-xl font-display font-bold">{t('user.my_sessions', 'Therapy Sessions')}</CardTitle>
            <CardDescription>{t('user.sessions_desc', 'Track and manage your appointments with specialists.')}</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            {loadingSessions ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary opacity-30" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-24 rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50">
                <Activity className="mx-auto h-10 w-10 mb-3 text-muted-foreground/20" />
                <p className="font-bold text-[#1a1c1e]">{t('user.no_sessions', 'No sessions booked yet')}</p>
                <Link to="/therapists" className="mt-3 inline-block text-sm font-bold text-primary hover:underline">
                  {t('user.find_specialist', 'Find a Specialist')} →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div key={session.id} className="p-6 rounded-2xl border border-neutral-100 bg-white hover:border-emerald-200 transition-colors flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex gap-4">
                      <div className="w-14 h-14 rounded-xl bg-[#f5f5f7] flex items-center justify-center overflow-hidden border border-neutral-100">
                        {session.therapist?.avatar ? (
                          <img src={session.therapist.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-6 h-6 text-muted-foreground/20" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-[#1a1c1e] text-lg">{session.therapist?.fullName}</div>
                        <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest">{session.therapist?.specialization}</div>
                        <div className="flex flex-wrap gap-4 mt-2">
                           <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                              <Calendar className="w-3.5 h-3.5" /> {new Date(session.startTime).toLocaleDateString([], { timeZone: 'Asia/Baku' })}
                           </div>
                           <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                              <Clock className="w-3.5 h-3.5" /> {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Baku' })}
                           </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end justify-between gap-4">
                       <Badge className={`${
                          session.status === SESSION_STATUS.CONFIRMED ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                          session.status === SESSION_STATUS.PENDING ? "bg-amber-50 text-amber-600 border-amber-100" :
                          session.status === SESSION_STATUS.THERAPIST_CONFIRMED ? "bg-blue-50 text-blue-600 border-blue-100" :
                          session.status === SESSION_STATUS.COMPLETED ? "bg-purple-50 text-purple-600 border-purple-100" :
                          "bg-neutral-50 text-neutral-400 border-neutral-100"
                        } font-bold text-[9px] px-3 uppercase tracking-widest`}>
                          {getSessionStatusLabel(session.status)}
                       </Badge>

                       {session.status === SESSION_STATUS.PENDING && (
                         <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-9 px-4 rounded-xl font-bold text-rose-500 hover:bg-rose-50"
                            onClick={() => {
                               if (window.confirm(t('common.confirm_cancel', 'Are you sure you want to cancel this session?'))) {
                                  cancelSessionService(session.id).then(() => queryClient.invalidateQueries(["sessions", "my"]))
                               }
                            }}
                         >
                            {t('common.cancel', 'Cancel')}
                         </Button>
                       )}

                       {session.status === SESSION_STATUS.THERAPIST_CONFIRMED && (
                          <div className="flex gap-2">
                            <Button 
                               variant="ghost" 
                               size="sm" 
                               className="h-9 px-4 rounded-xl font-bold text-rose-500 hover:bg-rose-50"
                               onClick={() => {
                                  if (window.confirm(t('common.confirm_cancel', 'Are you sure you want to cancel this session?'))) {
                                     cancelSessionService(session.id).then(() => {
                                        queryClient.invalidateQueries(["sessions", "my"])
                                        toast.info(t('session.cancelled', 'Session cancelled.'))
                                     })
                                   }
                               }}
                            >
                               {t('common.cancel', 'Cancel')}
                            </Button>
                            <Button 
                               size="sm" 
                               className="h-9 px-4 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                               onClick={() => {
                                  confirmSessionAsUser(session.id).then(() => {
                                     queryClient.invalidateQueries(["sessions", "my"])
                                     toast.success(t('session.confirmed', 'Session confirmed successfully!'))
                                  }).catch(err => {
                                     toast.error(err?.message || 'Failed to confirm session')
                                  })
                               }}
                            >
                               {t('common.confirm', 'Confirm')}
                            </Button>
                          </div>
                       )}

                       {session.status === SESSION_STATUS.CONFIRMED && safeExternalUrl(session.meetingLink) && (
                          <Button 
                             size="sm" 
                             className="h-9 px-4 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                             onClick={() => openExternal(session.meetingLink)}
                          >
                             <Video className="w-4 h-4 mr-2" /> {t('session.join', 'Join')}
                          </Button>
                       )}

                        {session.status === SESSION_STATUS.COMPLETED && (
                          <div className="flex flex-col items-end gap-2">
                            {session.rating ? (
                              <div className="flex items-center gap-1 text-amber-500">
                                <Star className="w-4 h-4 fill-current" />
                                <span className="text-sm font-bold text-stone-900">{session.rating}</span>
                              </div>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="h-9 px-4 rounded-xl font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                onClick={() => setRatingSessionId(session.id)}
                              >
                                <Sparkles className="w-4 h-4 mr-2" /> {t('user.rate_session', 'Rate Session')}
                              </Button>
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── RATING MODAL ── */}
      {ratingSessionId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
           <Card className="w-full max-w-md shadow-2xl animate-scale-up border-none overflow-hidden">
              <CardHeader className="p-8 bg-[#1a1c1e] text-white">
                 <CardTitle className="text-xl font-display font-bold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" /> {t('user.rate_title', 'Share Your Experience')}
                 </CardTitle>
                 <CardDescription className="text-white/60">
                    {t('user.rate_desc', 'How was your session with the specialist?')}
                 </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                 {/* Star Rating */}
                 <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                       <button 
                          key={star} 
                          onClick={() => setRatingValue(star)}
                          className={`p-1 transition-all hover:scale-110 ${ratingValue >= star ? "text-primary" : "text-neutral-200"}`}
                       >
                          <svg className="w-10 h-10 fill-current" viewBox="0 0 24 24">
                             <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                          </svg>
                       </button>
                    ))}
                 </div>

                 <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('user.review_label', 'Your Review')}</label>
                    <textarea 
                       value={reviewText}
                       onChange={(e) => setReviewText(e.target.value)}
                       placeholder={t('user.review_placeholder', 'Write your feedback here...')}
                       className="w-full min-h-[120px] p-4 rounded-2xl bg-neutral-50 border border-neutral-100 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-inner"
                    />
                 </div>

                 <div className="flex gap-3 pt-2">
                    <Button 
                       variant="ghost" 
                       className="flex-1 rounded-xl h-12 font-bold"
                       onClick={() => setRatingSessionId(null)}
                    >
                       {t('common.cancel', 'Cancel')}
                    </Button>
                    <Button 
                       className="flex-1 rounded-xl h-12 font-bold shadow-lg shadow-primary/20"
                       disabled={submittingRating}
                       onClick={() => submitRating({ sessionId: ratingSessionId, rating: ratingValue, review: reviewText })}
                    >
                       {submittingRating ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.submit', 'Submit')}
                    </Button>
                 </div>
              </CardContent>
           </Card>
        </div>
      )}

      {/* ── SETTINGS ── */}
      {activeTab === "settings" && (
        <Card className="premium-card max-w-lg">
          <CardHeader className="p-8 border-b border-neutral-100/50">
            <CardTitle className="text-xl font-display font-bold">{t('user.account_settings', 'Account Settings')}</CardTitle>
            <CardDescription>{t('user.account_settings_desc', 'Manage your password and account preferences.')}</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('user.new_password', 'New Password')}</label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} placeholder="••••••••" className="h-12 rounded-xl bg-neutral-50 border-neutral-200 pr-12" />
                <button type="button" onClick={() => setShowPassword((v) => !v)} tabIndex={-1} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#1a1c1e] transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('user.confirm_password', 'Confirm Password')}</label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} placeholder="••••••••" className="h-12 rounded-xl bg-neutral-50 border-neutral-200 pr-12" />
                <button type="button" onClick={() => setShowPassword((v) => !v)} tabIndex={-1} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#1a1c1e] transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button className="rounded-full px-8 h-12 font-bold">{t('user.update_password', 'Update Password')}</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
