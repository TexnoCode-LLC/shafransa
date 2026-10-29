import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/Card"
import { ArrowRight, ShieldCheck, User, Store, Eye, EyeOff } from "lucide-react"
import { useAuthStore } from "../../store/useAuthStore"
import { toast } from "../../store/useToastStore"
import SEO from "../../components/common/SEO"
import { authErrorMessage, rememberOtpEmail } from "@/lib/authErrors"

export default function RegisterPage() {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const role = 3
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { register } = useAuthStore()

  const onSubmit = async (e) => {
    e.preventDefault()
    // Backend ilə eyni qayda (RegisterDto: şifrə 8-128 simvol, ad 2-100)
    if (fullName.trim().length < 2) {
      toast.error(t('auth.name_min_length', "Ad ən azı 2 simvol olmalıdır."))
      return
    }
    if (password.length < 8) {
      toast.error(t('auth.password_min_length_8', "Şifrə ən azı 8 simvol olmalıdır."))
      return
    }
    const cleanEmail = email.trim()
    setIsLoading(true)
    try {
      await register({ fullName: fullName.trim(), email: cleanEmail, password, role })
      toast.success(t('auth.otp_sent_msg', "Verification code sent to your email."))
      rememberOtpEmail(cleanEmail)
      navigate("/otp", { state: { email: cleanEmail } })
    } catch (err) {
      toast.error(authErrorMessage(err, t('auth.register_error', "Registration failed. Please try again.")))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] relative overflow-hidden px-4 py-8">
      <SEO title="Register" noindex={true} />
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] -z-10 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[50%] bg-blue-500/5 rounded-full blur-[100px] -z-10"></div>

      <div className="w-full max-w-xl animate-fade-in-up">
        <div className="text-center mb-10 space-y-4">
          <h1 className="text-4xl font-display font-bold tracking-tight text-[#1a1c1e]">{t('auth.register_title', 'Join the Registry.')}</h1>
          <p className="text-muted-foreground font-medium">{t('auth.register_subtitle', 'Apply for access to the global botanical ecosystem.')}</p>
        </div>

        <Card className="relative premium-card border-neutral-100 shadow-2xl shadow-black/5 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50"></div>
          <form onSubmit={onSubmit}>
            <CardHeader className="space-y-1 p-10 pb-6">
              <CardTitle className="text-2xl font-display font-bold">{t('auth.new_membership', 'New Membership')}</CardTitle>
              <CardDescription className="text-sm font-medium">{t('auth.new_membership_desc', 'Select your portal and provide your identification.')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 p-10 pt-0">

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground" htmlFor="fullName">{t('auth.label_fullname', 'Full Legal Name')}</label>
                  <Input 
                    id="fullName" 
                    placeholder={t('auth.placeholder_fullname', "Dr. John Smith")} 
                    required 
                    className="h-12 rounded-xl bg-neutral-50/50 border-neutral-200"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground" htmlFor="email">{t('auth.label_institutional_email', 'Institutional Email')}</label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder={t('auth.placeholder_institutional_email', "jsmith@helix.org")} 
                    required 
                    className="h-12 rounded-xl bg-neutral-50/50 border-neutral-200"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground" htmlFor="password">{t('auth.label_security_key', 'Security Key')}</label>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      required 
                      className="h-12 rounded-xl bg-neutral-50/50 border-neutral-200 pr-12"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#1a1c1e] transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-xl border border-neutral-100 italic text-[11px] text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                {t('auth.agreement', 'By applying, you agree to our Clinical Verification Protocols.')}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-6 p-10 pt-0">
              <Button className="w-full h-14 rounded-full text-lg font-bold shadow-xl shadow-primary/20 btn-hover" type="submit" disabled={isLoading}>
                {isLoading ? t('auth.provisioning', "Provisioning access...") : (
                  <>{t('auth.submit_application', 'Submit Application')} <ArrowRight className="ml-2 h-5 w-5" /></>
                )}
              </Button>
              <div className="text-center font-medium text-sm text-muted-foreground">
                {t('auth.already_registered', 'Already registered?')}{" "}
                <Link to="/login" className="font-bold text-primary hover:underline underline-offset-4">
                  {t('auth.sign_in_vault', 'Sign in to Vault')}
                </Link>
              </div>
              <div className="text-center font-medium text-sm text-muted-foreground border-t border-neutral-100 pt-4">
                {t('auth.are_therapist', 'Are you a therapist?')}{" "}
                <Link to="/register-therapist" className="font-bold text-emerald-600 hover:underline underline-offset-4">
                  {t('auth.apply_as_therapist', 'Apply as a Specialist →')}
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
