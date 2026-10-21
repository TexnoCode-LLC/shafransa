import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { registerAsTherapist } from "../../services/therapist.service"
import { useAuthStore } from "../../store/useAuthStore"
import { toast } from "../../store/useToastStore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card"
import { Input } from "../../components/ui/Input"
import { Button } from "../../components/ui/Button"
import { Badge } from "../../components/ui/Badge"
import { 
  Loader2, User, Award, FileText, 
  MapPin, CheckCircle2, ShieldCheck, 
  ChevronRight, BrainCircuit, Activity,
  Camera, Upload, Trash2, X
} from "lucide-react"
import SEO from "../../components/common/SEO"

export default function TherapistRegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()

  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    specialization: "",
    bio: "",
    licenseNumber: "",
    phoneNumber: "",
    email: user?.email || "",
    password: "",
  })

  const [cvFile, setCvFile] = useState(null)
  const [profileImageFile, setProfileImageFile] = useState(null)
  const [certificateFiles, setCertificateFiles] = useState([])
  const [previews, setPreviews] = useState({ profile: null, certs: [] })

  const { mutate: register, isPending: registering } = useMutation({
    mutationFn: (data) => {
      // Backend expects JSON for /Therapists/register
      return registerAsTherapist({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        phoneNumber: data.phoneNumber,
        specialization: data.specialization,
        bio: data.bio,
        licenseNumber: data.licenseNumber
      })
    },
    onSuccess: (_, data) => {
      // Qeydiyyatdan sonra email OTP ilə təsdiqlənməlidir
      toast.success(t('auth.otp_sent_msg', "Verification code sent to your email."))
      navigate("/otp", { state: { email: data.email } })
    },
    onError: (err) => toast.error(err.message || t('therapists.registration_error', 'Failed to submit application'))
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    register(formData)
  }

  return (
    <div className="min-h-screen bg-[#fafafa] py-20 px-4">
      <SEO title="Therapist Registration" noindex={true} />
      <div className="max-w-4xl mx-auto grid lg:grid-cols-5 gap-12">
        
        {/* Left Column: Info & Trust */}
        <div className="lg:col-span-2 space-y-8">
           <div className="space-y-4 pt-10">
              <Badge className="bg-primary/10 text-primary border-primary/20 font-bold uppercase tracking-widest text-[10px] px-3">
                 Institutional Program
              </Badge>
              <h1 className="text-4xl font-display font-bold tracking-tight text-[#1a1c1e]">
                 {t('therapists.register_title', 'Join Shafransa Professional Network.')}
              </h1>
              <p className="text-muted-foreground font-medium leading-relaxed">
                 Apply to become a verified phytotherapist on our platform and connect with patients seeking restorative clinical care.
              </p>
           </div>

           <div className="space-y-6 pt-6">
              {[
                { icon: ShieldCheck, title: "Verified Status", desc: "Gain institutional credibility with our 'Verified' clinical badge." },
                { icon: BrainCircuit, title: "Patient Network", desc: "Access a growing ecosystem of patients seeking botanical-integrated recovery." },
                { icon: Activity, title: "Session Management", desc: "Manage your clinical slots and patient sessions through our intuitive dashboard." },
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-white border border-neutral-100 shadow-sm">
                   <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-primary" />
                   </div>
                   <div>
                      <h4 className="text-sm font-bold text-[#1a1c1e]">{item.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Right Column: Registration Form */}
        <div className="lg:col-span-3">
           <Card className="premium-card bg-white p-2">
              <CardHeader className="p-8 border-b border-neutral-100">
                 <CardTitle className="text-xl font-display font-bold">{t('therapists.register_form_title', 'Professional Manifest')}</CardTitle>
                 <CardDescription>{t('therapists.register_form_desc', 'Please provide your clinical credentials for verification.')}</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                 <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-5">
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{t('user.label_fullname', 'Full Name')}</label>
                          <Input 
                             value={formData.fullName} 
                             onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                             placeholder="Dr. Specialist"
                             required
                             className="h-12 bg-neutral-50/50 border-neutral-200"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{t('therapists.label_specialization', 'Specialization')}</label>
                          <Input 
                             value={formData.specialization} 
                             onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                             placeholder={t("therapists.placeholder_specialization", "məs. Klinik fitoterapiya")}
                             required
                             className="h-12 bg-neutral-50/50 border-neutral-200"
                          />
                       </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{t('therapists.label_email', 'Email Address')}</label>
                          <Input 
                             type="email"
                             value={formData.email} 
                             onChange={(e) => setFormData({...formData, email: e.target.value})}
                             placeholder="specialist@shafransa.com"
                             required
                             className="h-12 bg-neutral-50/50 border-neutral-200"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{t('therapists.label_phone', 'Contact Phone')}</label>
                          <Input 
                             value={formData.phoneNumber} 
                             onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                             placeholder="+994 (__) ___ __ __"
                             required
                             className="h-12 bg-neutral-50/50 border-neutral-200"
                          />
                       </div>
                    </div>

                     <div className="grid sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{t('therapists.label_license', 'License Number')}</label>
                           <Input 
                              value={formData.licenseNumber} 
                              onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                              placeholder="e.g. AZ-FZ-0000"
                              required
                              className="h-12 bg-neutral-50/50 border-neutral-200"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{t('therapists.label_password', 'Password (for your account)')}</label>
                           <Input 
                              type="password"
                              value={formData.password} 
                              onChange={(e) => setFormData({...formData, password: e.target.value})}
                              placeholder="••••••••"
                              required
                              className="h-12 bg-neutral-50/50 border-neutral-200"
                           />
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{t('therapists.label_description', 'Professional Bio / Clinical Approach')}</label>
                        <textarea 
                           value={formData.bio} 
                           onChange={(e) => setFormData({...formData, bio: e.target.value})}
                           placeholder={t('therapists.bio_placeholder', 'Detail your clinical experience and therapeutic approach...')}
                           required
                           className="w-full min-h-[100px] p-4 rounded-xl bg-neutral-50/50 border border-neutral-200 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm focus:bg-white"
                        />
                     </div>

                    <div className="pt-4 flex items-center gap-4">
                       <div className="p-3 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                       </div>
                       <p className="text-[10px] font-bold text-muted-foreground leading-tight">
                          By submitting, your profile will undergo a manual review process by our clinical board. Verification typically takes 48-72 hours.
                       </p>
                    </div>

                    <Button 
                       type="submit" 
                       disabled={registering}
                       className="w-full h-14 rounded-2xl bg-primary text-white font-bold shadow-xl shadow-primary/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
                    >
                       {registering ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                          <>
                             {t('therapists.submit_application', 'Submit Clinical Manifest')}
                             <ChevronRight className="w-4 h-4 ml-1" />
                          </>
                       )}
                    </Button>
                 </form>
              </CardContent>
           </Card>
        </div>

      </div>
    </div>
  )
}
