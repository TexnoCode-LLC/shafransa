import React, { useState, useMemo, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getMyTherapistSessions, confirmSessionAsTherapist, rejectSessionAsTherapist, completeSession, setWorkingHours } from "../../services/therapySession.service"
import { getMyTherapistProfile, updateMyProfile } from "../../services/therapist.service"
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from "../../components/ui/Modal"
import { SESSION_STATUS, getSessionStatusLabel } from "../../constants/enums"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card"
import { Button } from "../../components/ui/Button"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/Avatar"
import { Badge } from "../../components/ui/Badge"
import { Input } from "../../components/ui/Input"
import { Calendar, Video, Clock, DollarSign, Loader2, CheckCircle2, XCircle, PlayCircle, Settings, ShieldCheck, CheckCircle, Star } from "lucide-react"
import { toast } from "../../store/useToastStore"
import { openExternal, safeExternalUrl } from "../../lib/utils"
import { formatPrice } from "../../lib/format"

export default function ExpertPanel() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState("sessions")
  const [isConfiguringHours, setIsConfiguringHours] = useState(false)
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    specialization: "",
    shortBio: "",
    bio: "",
    phoneNumber: "",
    onlinePrice: 0,
    offlinePrice: 0,
    sessionDurationInMinutes: 60
  })

  const [files, setFiles] = useState({
    cv: null,
    avatar: null,
    certificates: []
  })

  const [selectedHours, setSelectedHours] = useState([])
  const [sessionActionModal, setSessionActionModal] = useState({
    isOpen: false,
    type: null, // 'confirm' | 'reject'
    session: null,
    link: ""
  })

  const duration = Math.max(15, Number(profileForm.sessionDurationInMinutes) || 60);
  const HOURS_OPTIONS = useMemo(() => {
    const slots = [];
    const startHour = 8;
    const endHour = 22;
    let current = new Date();
    current.setHours(startHour, 0, 0, 0);
    
    const end = new Date();
    end.setHours(endHour, 0, 0, 0);
    
    while (current <= end) {
      const hh = current.getHours().toString().padStart(2, '0');
      const mm = current.getMinutes().toString().padStart(2, '0');
      slots.push(`${hh}:${mm}`);
      current = new Date(current.getTime() + duration * 60000);
    }
    return slots;
  }, [duration]);

  const { data: sessionsResponse, isLoading, refetch: refetchSessions } = useQuery({
    queryKey: ["therapistSessions"],
    queryFn: getMyTherapistSessions
  })

  // api.js unwraps response.data.data directly
  const sessions = Array.isArray(sessionsResponse) ? sessionsResponse : sessionsResponse?.data || []
  
  const { mutate: confirmMutation } = useMutation({
    mutationFn: ({ id, meetingLink }) => confirmSessionAsTherapist(id, { meetingLink }),
    onSuccess: () => {
      refetchSessions()
      toast.success(t('expert.session_confirmed', 'Session confirmed!'))
    }
  })

  const { mutate: rejectMutation } = useMutation({
    mutationFn: (id) => rejectSessionAsTherapist(id),
    onSuccess: () => {
      refetchSessions()
      toast.info(t('expert.session_rejected', 'Session rejected.'))
    }
  })

  const { mutate: completeMutation } = useMutation({
    mutationFn: (id) => completeSession(id),
    onSuccess: () => {
      refetchSessions()
      toast.success(t('expert.session_completed', 'Session marked as completed!'))
    }
  })

  const { mutate: saveHours, isPending: savingHours } = useMutation({
    mutationFn: () => setWorkingHours({ 
      Hours: selectedHours
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["therapist", "me"] })
      queryClient.invalidateQueries({ queryKey: ["availability"] })
      toast.success(t('expert.hours_updated', 'Working hours updated!'))
      setIsConfiguringHours(false)
    },
    onError: (err) => toast.error(err?.message || t('expert.hours_update_failed', 'İş saatları yadda saxlanmadı')),
  })

  const { data: therapistProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ["therapist", "me"],
    queryFn: getMyTherapistProfile
  })

  const therapist = therapistProfile?.data || therapistProfile || {}

  useEffect(() => {
    if (therapist) {
      setProfileForm({
        fullName: therapist.user?.fullName || therapist.fullName || "",
        specialization: therapist.specialization || "",
        shortBio: therapist.shortBio || "",
        bio: therapist.bio || "",
        phoneNumber: therapist.phoneNumber || "",
        onlinePrice: therapist.onlinePrice ?? 0,
        offlinePrice: therapist.offlinePrice ?? 0,
        sessionDurationInMinutes: therapist.sessionDurationInMinutes || 60
      })
      
      // İş saatları serverdən (backend "HH:mm" sətirləri qaytarır)
      if (Array.isArray(therapist.workingHours)) {
        setSelectedHours(therapist.workingHours.map(wh => (typeof wh === "string" ? wh : wh?.hour)).filter(Boolean))
      }
    }
  }, [therapistProfile])

  const { mutate: updateProfile, isPending: updatingProfile } = useMutation({
    mutationFn: (formData) => updateMyProfile(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["therapist", "me"] })
      // Saytdakı siyahı və profil yeni qiymətləri dərhal göstərsin
      queryClient.invalidateQueries({ queryKey: ["therapists", "verified"] })
      queryClient.invalidateQueries({ queryKey: ["landing", "therapists"] })
      queryClient.invalidateQueries({ queryKey: ["therapist", therapist.id] })
      toast.success(t('expert.profile_updated', 'Profile updated successfully!'))
    },
    // Əvvəl xəta səssiz qalırdı — fitoterapevt qiymətin saxlanmadığını bilmirdi
    onError: (err) => toast.error(err?.message || t('expert.profile_update_failed', 'Profil yadda saxlanmadı')),
  })

  const handleProfileSubmit = (e) => {
    e.preventDefault()
    const prices = {}
    for (const key of ["onlinePrice", "offlinePrice"]) {
      const value = profileForm[key] === "" ? 0 : Number(profileForm[key])
      if (!Number.isFinite(value) || value < 0 || value > 100000) {
        toast.error(t('expert.price_invalid', 'Qiymət 0 ilə 100000 arasında olmalıdır'))
        return
      }
      prices[key] = value
    }
    const duration = Number(profileForm.sessionDurationInMinutes)
    if (!Number.isInteger(duration) || duration < 15 || duration > 480) {
      toast.error(t('expert.duration_invalid', 'Seans müddəti 15-480 dəqiqə olmalıdır'))
      return
    }
    const form = new FormData()
    Object.entries({ ...profileForm, ...prices, sessionDurationInMinutes: duration }).forEach(([key, value]) => {
      form.append(key.charAt(0).toUpperCase() + key.slice(1), value ?? "")
    })
    if (files.cv) form.append("CvFile", files.cv)
    if (files.avatar) form.append("ProfileImageFile", files.avatar)
    files.certificates.forEach(file => form.append("CertificateFiles", file))
    
    updateProfile(form)
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case SESSION_STATUS.PENDING: return <Badge className="bg-orange-50 text-orange-600 border-orange-200">{t('session.status.pending', 'PENDING')}</Badge>
      case SESSION_STATUS.THERAPIST_CONFIRMED: return <Badge className="bg-blue-50 text-blue-600 border-blue-200">{t('session.status.therapist_confirmed', 'WAITING FOR USER')}</Badge>
      case SESSION_STATUS.CONFIRMED: return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200">{t('session.status.confirmed', 'CONFIRMED')}</Badge>
      case SESSION_STATUS.COMPLETED: return <Badge className="bg-purple-50 text-purple-600 border-purple-200">{t('session.status.completed', 'COMPLETED')}</Badge>
      case SESSION_STATUS.CANCELLED: return <Badge className="bg-rose-50 text-rose-600 border-rose-200">{t('session.status.cancelled', 'CANCELLED')}</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight text-[#1a1c1e]">{t('expert.title', 'Expert Command.')}</h1>
          <p className="text-muted-foreground font-medium">{t('expert.subtitle', 'Manage clinical sessions and patient protocols.')}</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant={activeTab === "settings" ? "default" : "outline"} 
            className="rounded-xl font-bold h-11" 
            onClick={() => {
              setActiveTab(activeTab === "settings" ? "sessions" : "settings");
              setIsConfiguringHours(false);
            }}
          >
            <Settings className="mr-2 h-4 w-4" /> {t('expert.profile_settings', 'Profile Settings')}
          </Button>
          <Button 
            variant={isConfiguringHours ? "default" : "outline"} 
            className="rounded-xl font-bold h-11" 
            onClick={() => setIsConfiguringHours(!isConfiguringHours)}
          >
            <Clock className="mr-2 h-4 w-4" /> {t('expert.configure_hours', 'Work Schema')}
          </Button>
        </div>
      </div>



      {isConfiguringHours && (
         <Card className="border-primary/20 bg-primary/[0.02] animate-in fade-in zoom-in duration-300">
            <CardHeader className="pb-4">
               <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" /> {t('expert.hours_title', 'Clinical Working Hours')}
               </CardTitle>
               <CardDescription>{t('expert.hours_desc', 'Select the time slots when you are available for clinical consultations.')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="flex gap-2 mb-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 text-[10px] font-bold uppercase tracking-widest rounded-lg"
                    onClick={() => setSelectedHours(HOURS_OPTIONS)}
                  >
                    {t('expert.select_all', 'Select All')}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 text-[10px] font-bold uppercase tracking-widest rounded-lg text-rose-500 hover:text-rose-600"
                    onClick={() => setSelectedHours([])}
                  >
                    {t('expert.clear_all', 'Clear All')}
                  </Button>
               </div>

               <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-3">
                  {HOURS_OPTIONS.map((hour) => {
                     const isSelected = selectedHours.includes(hour);
                     return (
                        <button
                           key={hour}
                           type="button"
                           onClick={() => {
                              if (isSelected) setSelectedHours(selectedHours.filter(h => h !== hour))
                              else setSelectedHours([...selectedHours, hour])
                           }}
                           className={`h-12 rounded-xl border font-bold text-sm transition-all flex items-center justify-center ${
                              isSelected 
                                 ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.02]" 
                                 : "bg-white text-muted-foreground border-neutral-200 hover:border-primary/40 hover:bg-neutral-50"
                           }`}
                        >
                           {hour}
                        </button>
                     )
                  })}
               </div>
               
               <div className="flex justify-end gap-3 pt-6 border-t border-neutral-100">
                  <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setIsConfiguringHours(false)}>{t('common.cancel', 'Cancel')}</Button>
                  <Button disabled={savingHours} className="rounded-xl font-bold px-8 shadow-xl shadow-primary/20" onClick={() => saveHours()}>
                     {savingHours ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : t('common.save', 'Save Schema')}
                  </Button>
               </div>
            </CardContent>
         </Card>
      )}

      {activeTab === "settings" && (
        <div className="grid lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="lg:col-span-2 space-y-8">
              <Card className="premium-card">
                 <CardHeader className="p-8 border-b border-neutral-100">
                    <CardTitle className="text-xl font-display font-bold">{t('expert.profile.title', 'Professional Profile')}</CardTitle>
                    <CardDescription>{t('expert.profile.desc', 'Update your clinical identity, specialization, and session details.')}</CardDescription>
                 </CardHeader>
                 <CardContent className="p-8">
                    <form onSubmit={handleProfileSubmit} className="space-y-6">
                       <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('expert.field.fullname', 'Full Name')}</label>
                             <Input 
                                value={profileForm.fullName}
                                onChange={e => setProfileForm({...profileForm, fullName: e.target.value})}
                                className="h-12 rounded-xl bg-neutral-50/50"
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('expert.field.specialization', 'Specialization')}</label>
                             <Input 
                                value={profileForm.specialization}
                                onChange={e => setProfileForm({...profileForm, specialization: e.target.value})}
                                className="h-12 rounded-xl bg-neutral-50/50"
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('expert.field.phone', 'Contact Number')}</label>
                             <Input 
                                value={profileForm.phoneNumber}
                                onChange={e => setProfileForm({...profileForm, phoneNumber: e.target.value})}
                                className="h-12 rounded-xl bg-neutral-50/50"
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('expert.field.duration', 'Session Duration (Min)')}</label>
                             <Input 
                                type="number"
                                min="15"
                                value={profileForm.sessionDurationInMinutes}
                                onChange={e => setProfileForm({...profileForm, sessionDurationInMinutes: e.target.value})}
                                className="h-12 rounded-xl bg-neutral-50/50"
                             />
                          </div>
                       </div>

                       <div className="grid md:grid-cols-2 gap-6 p-6 rounded-2xl bg-emerald-50/30 border border-emerald-100">
                          <div className="space-y-2">
                             <label className="text-xs font-bold uppercase tracking-widest text-emerald-600">{t('expert.field.online_price', 'Online Session Price')}</label>
                             <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-emerald-500">₼</span>
                                <Input 
                                   type="number"
                                   min="0"
                                   step="0.01"
                                   inputMode="decimal"
                                   onWheel={e => e.currentTarget.blur()}
                                   value={profileForm.onlinePrice}
                                   onChange={e => setProfileForm({...profileForm, onlinePrice: e.target.value})}
                                   className="h-12 rounded-xl bg-white pl-10 border-emerald-100"
                                />
                             </div>
                          </div>
                          <div className="space-y-2">
                             <label className="text-xs font-bold uppercase tracking-widest text-emerald-600">{t('expert.field.offline_price', 'In-Person Session Price')}</label>
                             <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-emerald-500">₼</span>
                                <Input 
                                   type="number"
                                   min="0"
                                   step="0.01"
                                   inputMode="decimal"
                                   onWheel={e => e.currentTarget.blur()}
                                   value={profileForm.offlinePrice}
                                   onChange={e => setProfileForm({...profileForm, offlinePrice: e.target.value})}
                                   className="h-12 rounded-xl bg-white pl-10 border-emerald-100"
                                />
                             </div>
                          </div>
                       </div>

                       <div className="space-y-2">
                          <div className="flex items-baseline justify-between">
                             <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('therapists.short_bio_title', 'Qısa məlumat')}</label>
                             <span className="text-[11px] tabular-nums text-muted-foreground">{profileForm.shortBio.length}/500</span>
                          </div>
                          <textarea
                             value={profileForm.shortBio}
                             onChange={e => setProfileForm({...profileForm, shortBio: e.target.value.slice(0, 500)})}
                             maxLength={500}
                             className="w-full min-h-[80px] p-4 rounded-xl bg-neutral-50/50 border border-neutral-100 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                             placeholder={t('therapists.short_bio_hint', 'Özünüz haqqında 1-3 cümlə. Profilinizin yuxarısında, adınızın altında göstəriləcək.')}
                          />
                       </div>

                       <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('therapists.label_about', 'Haqqında')}</label>
                          <textarea 
                             value={profileForm.bio}
                             onChange={e => setProfileForm({...profileForm, bio: e.target.value})}
                             className="w-full min-h-[150px] p-4 rounded-xl bg-neutral-50/50 border border-neutral-100 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                             placeholder={t('expert.bio_placeholder', 'Detail your clinical experience and therapeutic approach...')}
                          />
                       </div>

                       <div className="flex justify-end pt-4">
                          <Button type="submit" disabled={updatingProfile} className="rounded-full px-12 h-12 font-bold shadow-xl shadow-primary/20">
                             {updatingProfile ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : t('common.save_profile', 'Deploy Updates')}
                          </Button>
                       </div>
                    </form>
                 </CardContent>
              </Card>
           </div>

           <div className="space-y-8">
              <Card className="premium-card bg-[#1a1c1e] text-white overflow-hidden border-none shadow-2xl">
                 <div className="absolute top-0 right-0 p-8 opacity-10">
                    <ShieldCheck className="w-24 h-24" />
                 </div>
                 <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-lg font-bold">{t('expert.docs.title', 'Clinical Documentation')}</CardTitle>
                    <CardDescription className="text-white/40">{t('expert.docs.desc', 'Verification assets and credentials.')}</CardDescription>
                 </CardHeader>
                 <CardContent className="p-8 pt-4 space-y-6">
                    <div className="space-y-4">
                       <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group relative">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">{t('expert.docs.cv', 'Curriculum Vitae')}</p>
                          <p className="text-xs font-medium text-white/60">{files.cv ? files.cv.name : (therapist.cv ? 'CV_Document.pdf' : 'Not uploaded')}</p>
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setFiles({...files, cv: e.target.files[0]})} />
                       </div>
                       <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group relative">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">{t('expert.docs.avatar', 'Profile Media')}</p>
                          <p className="text-xs font-medium text-white/60">{files.avatar ? files.avatar.name : (therapist.user?.avatar ? 'Avatar_Media.jpg' : 'Not uploaded')}</p>
                          <input type="file" accept=".jpg,.jpeg,.png,.webp,.gif" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setFiles({...files, avatar: e.target.files[0]})} />
                       </div>
                       <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group relative">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">{t('expert.docs.certs', 'Clinical Certificates')}</p>
                          <p className="text-xs font-medium text-white/60">{files.certificates.length > 0 ? `${files.certificates.length} files staged` : `${therapist.certificates?.length || 0} verified assets`}</p>
                          <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setFiles({...files, certificates: Array.from(e.target.files)})} />
                       </div>
                    </div>
                    <p className="text-[9px] text-white/30 italic leading-relaxed">
                       {t('expert.docs.privacy', '* All medical credentials are encrypted and stored in high-security botanical vaults.')}
                    </p>
                 </CardContent>
              </Card>

              <Card className="premium-card border-emerald-100 bg-emerald-50/30">
                 <CardHeader className="p-6">
                    <CardTitle className="text-sm font-bold text-emerald-900">{t('expert.revenue.title', 'Clinical Settlements')}</CardTitle>
                 </CardHeader>
                 <CardContent className="p-6 pt-0">
                    <div className="space-y-4">
                       <div className="flex justify-between items-end border-b border-emerald-100 pb-4">
                          <span className="text-xs font-bold text-emerald-600/60 uppercase tracking-widest">{t('expert.revenue.total', 'Gross Total')}</span>
                          <span className="text-2xl font-display font-bold text-emerald-900">{formatPrice(sessions.filter(s => s.status === SESSION_STATUS.COMPLETED).reduce((sum, s) => sum + (s.price || 0), 0))}</span>
                       </div>
                       <Button variant="ghost" className="w-full rounded-xl text-emerald-600 hover:bg-emerald-100/50 font-bold text-xs h-10">
                          {t('expert.revenue.view_history', 'Transaction Ledger')}
                       </Button>
                    </div>
                 </CardContent>
              </Card>
           </div>
        </div>
      )}

      {activeTab === "sessions" && (
        <>


      <div className="grid gap-6 md:grid-cols-3">
        <Card className="premium-card p-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('expert.stats.pending', 'Manifest Requests')}</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-[#1a1c1e]">
              {sessions.filter(s => s.status === SESSION_STATUS.PENDING).length}
            </div>
            <p className="text-xs font-medium text-muted-foreground/60 mt-1">{t('expert.stats.pending_desc', 'Awaiting clinical confirmation')}</p>
          </CardContent>
        </Card>
        <Card className="premium-card p-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('expert.stats.active', 'Active Protocol')}</CardTitle>
            <Video className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-[#1a1c1e]">
              {sessions.filter(s => s.status === SESSION_STATUS.CONFIRMED || s.status === SESSION_STATUS.THERAPIST_CONFIRMED).length}
            </div>
            <p className="text-xs font-medium text-muted-foreground/60 mt-1">{t('expert.stats.active_desc', 'Scheduled clinical encounters')}</p>
          </CardContent>
        </Card>
        <Card className="premium-card p-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('expert.stats.revenue', 'Settled Earnings')}</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-[#1a1c1e]">
              {formatPrice(sessions
                .filter(s => s.status === SESSION_STATUS.COMPLETED)
                .reduce((sum, s) => sum + (s.price || 0), 0))}
            </div>
            <p className="text-xs font-medium text-muted-foreground/60 mt-1">{t('expert.stats.revenue_desc', 'Verified session settlements')}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="premium-card">
        <CardHeader className="p-8 border-b border-neutral-100/50">
          <CardTitle className="text-xl font-display font-bold">{t('expert.sessions.title', 'Clinical Encounters')}</CardTitle>
          <CardDescription className="font-medium">{t('expert.sessions.subtitle', 'Real-time synchronization with the patient manifest.')}</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          {isLoading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">{t('expert.syncing', 'Syncing manifest...')}</p>
             </div>
          ) : sessions.length === 0 ? (
             <div className="text-center py-24 border-2 border-dashed border-neutral-100 rounded-3xl bg-neutral-50/50">
                <Calendar className="mx-auto h-12 w-12 mb-4 opacity-10" />
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">{t('expert.no_sessions', 'No active encounters found.')}</p>
             </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((s) => (
                <div key={s.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-6 rounded-2xl border border-neutral-100 bg-white hover:border-primary/20 transition-all duration-300 gap-6">
                  <div className="flex items-center gap-6">
                    <Avatar className="h-14 w-14 rounded-2xl border border-neutral-100">
                      <AvatarImage src={s.user?.avatar} />
                      <AvatarFallback className="bg-primary/5 text-primary text-xl font-bold">{s.user?.fullName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-display font-bold text-lg text-[#1a1c1e]">{s.user?.fullName}</p>
                        {getStatusBadge(s.status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground font-medium">
                        <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {new Date(s.startTime).toLocaleDateString([], { timeZone: 'Asia/Baku' })} {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Baku' })}</div>
                        <div className="flex items-center gap-1.5"><Video className="h-3.5 w-3.5" /> {s.meetingLink || t('expert.link_pending', 'Link Pending')}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-4 lg:pt-0 border-t lg:border-none border-neutral-50">
                    {s.status === SESSION_STATUS.PENDING && (
                      <>
                        <Button 
                          variant="outline" 
                          className="rounded-xl h-10 px-6 font-bold border-red-100 text-red-500 hover:bg-red-50" 
                          onClick={() => setSessionActionModal({ isOpen: true, type: 'reject', session: s, link: "" })}
                        >
                          <XCircle className="w-4 h-4 mr-2" /> {t('common.reject', 'Reject')}
                        </Button>
                        <Button className="rounded-xl h-10 px-6 font-bold" onClick={() => setSessionActionModal({ isOpen: true, type: 'confirm', session: s, link: "" })}>
                          <CheckCircle2 className="w-4 h-4 mr-2" /> {t('common.confirm', 'Confirm')}
                        </Button>
                      </>
                    )}
                    {s.status === SESSION_STATUS.THERAPIST_CONFIRMED && (
                       <p className="text-[10px] font-bold text-blue-500/60 uppercase tracking-widest bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-100">
                          {t('expert.waiting_user', 'Waiting for patient confirmation')}
                       </p>
                    )}
                    {s.status === SESSION_STATUS.CONFIRMED && (
                      <>
                        {safeExternalUrl(s.meetingLink) && (
                          <Button variant="outline" className="rounded-xl h-10 px-6 font-bold border-emerald-100 text-emerald-600 hover:bg-emerald-50" onClick={() => openExternal(s.meetingLink)}>
                            <Video className="w-4 h-4 mr-2" /> {t('expert.join', 'Join Session')}
                          </Button>
                        )}
                        <Button className="rounded-xl h-10 px-6 font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20" onClick={() => completeMutation(s.id)}>
                          <CheckCircle className="w-4 h-4 mr-2" /> {t('expert.mark_complete', 'Complete Session')}
                        </Button>
                      </>
                    )}
                    {s.status === SESSION_STATUS.COMPLETED && s.rating && (
                       <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1 text-amber-500">
                             <Star className="h-3.5 w-3.5 fill-current" />
                             <span className="text-sm font-bold text-stone-900">{s.rating}</span>
                          </div>
                          {s.review && (
                             <p className="text-[11px] text-stone-500 italic max-w-[200px] text-right" title={s.review}>
                                "{s.review}"
                             </p>
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
      </>
      )}

      {/* Session Action Modal */}
      <Modal 
        isOpen={sessionActionModal.isOpen} 
        onClose={() => setSessionActionModal({ ...sessionActionModal, isOpen: false })}
      >
        <ModalHeader>
          <ModalTitle>
            {sessionActionModal.type === 'confirm' ? t('expert.confirm_session_title', 'Confirm Session') : t('expert.reject_session_title', 'Reject Session')}
          </ModalTitle>
          <ModalDescription>
            {sessionActionModal.type === 'confirm' 
              ? t('expert.confirm_session_desc', 'Are you sure you want to confirm this session?') 
              : t('expert.reject_session_desc', 'Are you sure you want to reject this session? This action cannot be undone.')}
          </ModalDescription>
        </ModalHeader>

        {sessionActionModal.type === 'confirm' && sessionActionModal.session?.isOnline && (
          <div className="py-4 space-y-2">
            <label className="text-sm font-medium text-stone-700">
              {t('expert.meeting_link_label', 'Meeting Link (Optional)')}
            </label>
            <Input 
              placeholder="https://zoom.us/j/..." 
              value={sessionActionModal.link}
              onChange={(e) => setSessionActionModal({ ...sessionActionModal, link: e.target.value })}
            />
            <p className="text-[11px] text-stone-500">
              {t('expert.link_hint', 'Leave empty to use auto-generated Jitsi link.')}
            </p>
          </div>
        )}

        <ModalFooter className="mt-6">
          <Button variant="outline" onClick={() => setSessionActionModal({ ...sessionActionModal, isOpen: false })}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button 
            className={sessionActionModal.type === 'reject' ? "bg-red-600 hover:bg-red-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}
            onClick={() => {
              if (sessionActionModal.type === 'confirm') {
                const link = sessionActionModal.link?.trim();
                if (link && !safeExternalUrl(link)?.startsWith("https:")) {
                  toast.error(t('expert.invalid_meeting_link', 'Meeting link must be a valid https:// URL'));
                  return;
                }
                confirmMutation({ 
                  id: sessionActionModal.session.id, 
                  meetingLink: link || null 
                });
              } else {
                rejectMutation(sessionActionModal.session.id);
              }
              setSessionActionModal({ ...sessionActionModal, isOpen: false });
            }}
          >
            {sessionActionModal.type === 'confirm' ? t('common.confirm', 'Confirm') : t('common.reject', 'Reject')}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
