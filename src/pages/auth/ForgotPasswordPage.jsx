import React, { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/Card"
import { KeyRound, ArrowRight, ShieldCheck, ArrowLeft, Eye, EyeOff, Mail, RefreshCw } from "lucide-react"
import { useAuthStore } from "../../store/useAuthStore"
import { toast } from "../../store/useToastStore"
import SEO from "../../components/common/SEO"
import { authErrorMessage } from "@/lib/authErrors"

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { forgotPassword, resetPassword } = useAuthStore()

  // Steps: 'request' (enter email) | 'reset' (enter OTP + new password)
  const [step, setStep] = useState("request")
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  // Handle Step 1: Request OTP
  const handleRequestCode = async (e) => {
    e.preventDefault()
    if (!email) {
      toast.error(t('auth.email_required', "Email is required."))
      return
    }
    setIsLoading(true)
    try {
      await forgotPassword(email.trim())
      // Hesab olmasa da eyni cavab gəlir (email siyahısı yığılmasın)
      toast.success(t('auth.reset_code_sent', "Bu email ilə hesab varsa, ona kod göndərdik."))
      setStep("reset")
      setResendCooldown(60) // 60s cooldown for resend
    } catch (err) {
      toast.error(authErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Step 2: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault()

    if (!otp) {
      toast.error(t('auth.invalid_otp', "Please enter the verification code."))
      return
    }

    if (newPassword.length < 8) {
      toast.error(t('auth.password_min_length_8', "Şifrə ən azı 8 simvol olmalıdır."))
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('auth.password_mismatch', "Passwords do not match."))
      return
    }

    setIsLoading(true)
    try {
      await resetPassword({
        email: email.trim(),
        otp,
        newPassword,
        password: newPassword
      })
      toast.success(t('auth.reset_success', "Security key updated successfully! Please sign in."))
      navigate("/login")
    } catch (err) {
      toast.error(authErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  // Resend Code handler
  const handleResendCode = async () => {
    if (resendCooldown > 0 || !email) return
    setIsLoading(true)
    try {
      await forgotPassword(email.trim())
      toast.success(t('auth.otp_sent', "Verification code resent to your email."))
      setResendCooldown(60)
    } catch (err) {
      toast.error(authErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] relative overflow-hidden px-4 py-8">
      <SEO title={step === "request" ? "Recover Security Key" : "Reset Security Key"} noindex={true} />
      
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] -z-10 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[50%] bg-amber-500/5 rounded-full blur-[100px] -z-10"></div>

      <div className="w-full max-w-xl animate-fade-in-up">
        <div className="text-center mb-10 space-y-4">
          <h1 className="text-4xl font-display font-bold tracking-tight text-[#1a1c1e]">
            {step === "request" 
              ? t('auth.forgot_password_title', 'Recover Security Key.') 
              : t('auth.reset_password_title', 'Set New Security Key.')}
          </h1>
          <p className="text-muted-foreground font-medium">
            {step === "request"
              ? t('auth.forgot_password_subtitle', 'Enter your registered identity to receive an authentication token.')
              : t('auth.reset_password_subtitle', 'Provide the verification token and define your new security credential.')}
          </p>
        </div>

        <Card className="relative premium-card border-neutral-100 shadow-2xl shadow-black/5 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50"></div>

          {step === "request" ? (
            /* ──────────────── STEP 1: REQUEST CODE ──────────────── */
            <form onSubmit={handleRequestCode}>
              <CardHeader className="space-y-1 p-10 pb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <KeyRound className="w-6 h-6" />
                </div>
                <CardTitle className="text-2xl font-display font-bold">
                  {t('auth.recover_access', 'Access Recovery')}
                </CardTitle>
                <CardDescription className="text-sm font-medium">
                  {t('auth.recover_access_desc', 'A secure reset token will be dispatched to your email.')}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 p-10 pt-0">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground" htmlFor="email">
                    {t('auth.label_email', 'Identification (Email)')}
                  </label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder={t('auth.placeholder_email', "name@institution.com")}
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 rounded-xl bg-neutral-50/50 border-neutral-200 focus:bg-white transition-all pl-11"
                    />
                    <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-xl border border-neutral-100 italic text-[11px] text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  {t('auth.secure_session', 'Secure end-to-end encrypted session active.')}
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-6 p-10 pt-0">
                <Button 
                  className="w-full h-14 rounded-full text-lg font-bold shadow-xl shadow-primary/20 btn-hover" 
                  type="submit" 
                  disabled={isLoading}
                >
                  {isLoading ? t('auth.sending_code', "Dispatching token...") : (
                    <>{t('auth.send_reset_code', 'Send Verification Code')} <ArrowRight className="ml-2 h-5 w-5" /></>
                  )}
                </Button>

                <div className="text-center pt-2">
                  <Link 
                    to="/login" 
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline underline-offset-4"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {t('auth.back_to_login', 'Return to Portal Sign In')}
                  </Link>
                </div>
              </CardFooter>
            </form>
          ) : (
            /* ──────────────── STEP 2: RESET PASSWORD ──────────────── */
            <form onSubmit={handleResetPassword}>
              <CardHeader className="space-y-1 p-10 pb-6">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-2">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep("request")}
                    className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    {t('auth.change_email', 'Change Email')}
                  </button>
                </div>

                <CardTitle className="text-2xl font-display font-bold">
                  {t('auth.verify_and_update', 'Verify & Reset Key')}
                </CardTitle>
                <CardDescription className="text-sm font-medium">
                  {t('auth.otp_sent_to', 'We sent a verification code to')}{" "}
                  <span className="font-bold text-[#1a1c1e]">{email}</span>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5 p-10 pt-0">
                {/* OTP Code */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground" htmlFor="otp">
                      {t('auth.label_reset_code', 'Verification Code (OTP)')}
                    </label>
                    {resendCooldown > 0 ? (
                      <span className="text-[11px] font-mono font-medium text-muted-foreground">
                        {t('auth.resend_in', 'Resend code in')} {resendCooldown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendCode}
                        className="text-[11px] font-bold text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        {t('auth.resend_code', 'Resend Code')}
                      </button>
                    )}
                  </div>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="12345"
                    required
                    maxLength={8}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="h-12 rounded-xl bg-neutral-50/50 border-neutral-200 focus:bg-white text-center font-mono text-lg tracking-widest transition-all"
                  />
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground" htmlFor="newPassword">
                    {t('auth.label_new_password', 'New Security Key (Password)')}
                  </label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
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

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground" htmlFor="confirmPassword">
                    {t('auth.label_confirm_password', 'Confirm Security Key')}
                  </label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-12 rounded-xl bg-neutral-50/50 border-neutral-200 focus:bg-white transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#1a1c1e] transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-6 p-10 pt-0">
                <Button 
                  className="w-full h-14 rounded-full text-lg font-bold shadow-xl shadow-primary/20 btn-hover" 
                  type="submit" 
                  disabled={isLoading}
                >
                  {isLoading ? t('auth.updating_password', "Updating key...") : (
                    <>{t('auth.reset_password_btn', 'Update Security Key')} <ArrowRight className="ml-2 h-5 w-5" /></>
                  )}
                </Button>

                <div className="text-center pt-2">
                  <Link 
                    to="/login" 
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline underline-offset-4"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {t('auth.back_to_login', 'Return to Portal Sign In')}
                  </Link>
                </div>
              </CardFooter>
            </form>
          )}
        </Card>

        <p className="text-center text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/30 mt-12">
          © 2026 SHAFRANSA GLOBAL • {t('rights_reserved', 'All Rights Reserved')}
        </p>
      </div>
    </div>
  )
}
