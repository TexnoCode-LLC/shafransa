import React, { useState, useEffect } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/Card"
import { Leaf, ArrowRight, ShieldCheck, Zap, Globe, Eye, EyeOff } from "lucide-react"
import { useAuthStore } from "../../store/useAuthStore"
import { toast } from "../../store/useToastStore"
import { getRoleName } from "../../constants/roles"
import { homePathForRole, safeRedirectPath } from "@/lib/utils"
import SEO from "../../components/common/SEO"

export default function LoginPage() {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  // Məs. məhsulda "Səbətə at" → giriş → həmin məhsula qayıt
  const redirect = safeRedirectPath(searchParams.get("redirect"))
  const { login, user, isAuthenticated } = useAuthStore()

  // Redirect when authentication state changes
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(redirect || homePathForRole(getRoleName(user?.role)), { replace: true })
    }
  }, [isAuthenticated, user, navigate, redirect])

  const onSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await login({ email, password })
      toast.success(t('auth.login_success', "Welcome back! Redirecting..."))
    } catch (err) {
      // Təsdiqlənməmiş email: backend yeni kod göndərib — OTP səhifəsinə keçirik
      if (err?.code === "EMAIL_NOT_VERIFIED") {
        toast.success(t('auth.otp_sent_msg', "Verification code sent to your email."))
        navigate("/otp", { state: { email, redirect } })
        return
      }
      // 429 — çox səhv cəhd (bloklanma) mesajını göstər, qalanında ümumi tərcümə olunmuş mətn
      toast.error(err?.status === 429 ? err.message : t('auth.login_error', "Invalid credentials. Please try again."))
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] relative overflow-hidden px-4 py-8">
      <SEO title="Sign In" noindex={true} />
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] -z-10 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[50%] bg-blue-500/5 rounded-full blur-[100px] -z-10"></div>

      <div className="w-full max-w-xl animate-fade-in-up">
        <div className="text-center mb-10 space-y-4">
          <h1 className="text-4xl font-display font-bold tracking-tight text-[#1a1c1e]">{t('auth.login_title', 'Welcome back.')}</h1>
          <p className="text-muted-foreground font-medium">{t('auth.login_subtitle', 'Access your personalized botanical intelligence vault.')}</p>
        </div>

        <Card className="relative premium-card border-neutral-100 shadow-2xl shadow-black/5 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50"></div>
          <CardHeader className="space-y-1 p-10 pb-2">
            <CardTitle className="text-2xl font-display font-bold">{t('auth.sign_in', 'Sign In')}</CardTitle>
            <CardDescription className="text-sm font-medium">{t('auth.sign_in_desc', 'Please enter your authorized credentials.')}</CardDescription>
          </CardHeader>
          <form onSubmit={onSubmit}>
            <CardContent className="space-y-6 p-10 pt-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground" htmlFor="email">{t('auth.label_email', 'Identification (Email)')}</label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('auth.placeholder_email', "name@institution.com")}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl bg-neutral-50/50 border-neutral-200 focus:bg-white transition-all"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground" htmlFor="password">{t('auth.label_password', 'Security Key (Password)')}</label>
                  <Link to="/forgot-password" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors">{t('auth.forgot_password', 'Recover Key?')}</Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-xl bg-neutral-50/50 border-neutral-200 focus:bg-white transition-all pr-12"
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

              <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-xl border border-neutral-100 italic text-[11px] text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                {t('auth.secure_session', 'Secure end-to-end encrypted session active.')}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-6 p-10 pt-0">
              <Button className="w-full h-14 rounded-full text-lg font-bold shadow-xl shadow-primary/20 btn-hover" type="submit" disabled={isLoading}>
                {isLoading ? t('auth.authenticating', "Authenticating node...") : (
                  <>{t('auth.access_portal', 'Access Portal')} <ArrowRight className="ml-2 h-5 w-5" /></>
                )}
              </Button>

              <div className="grid grid-cols-2 gap-8 py-4 border-t border-neutral-100">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{t('auth.fast_access', 'Fast Access')}</span>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <Globe className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{t('auth.global_node', 'Global Node')}</span>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">
                  {t('auth.new_user', 'New to the ecosystem?')}{" "}
                  <Link to="/register" className="font-bold text-primary hover:underline underline-offset-4">
                    {t('auth.apply_membership', 'Apply for Membership')}
                  </Link>
                </p>
              </div>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/30 mt-12">
          © 2026 SHAFRANSA GLOBAL • {t('rights_reserved')}
        </p>
      </div>
    </div>
  )
}
