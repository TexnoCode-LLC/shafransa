import React, { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/Card"
import { ShieldCheck } from "lucide-react"
import { useAuthStore } from "../../store/useAuthStore"
import { toast } from "../../store/useToastStore"
import { getRoleName } from "../../constants/roles"
import { homePathForRole, safeRedirectPath } from "@/lib/utils"
import { authErrorMessage, forgetOtpEmail, recallOtpEmail } from "@/lib/authErrors"
import api from "../../services/api"

const RESEND_COOLDOWN = 60

export default function OTPPage() {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes
  const [otp, setOtp] = useState("")
  const navigate = useNavigate()
  const location = useLocation()
  const { verifyOTP, user, isAuthenticated } = useAuthStore()
  
  // Səhifə yenilənəndə router state itir — email sessionStorage-dan götürülür
  const email = location.state?.email || recallOtpEmail()
  const [resendIn, setResendIn] = useState(RESEND_COOLDOWN)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (!email) {
      toast.error(t('auth.email_required', "Email is required for verification."))
      navigate("/register")
    }
  }, [email, navigate, t])

  // Redirect when authentication state changes after OTP verification
  useEffect(() => {
    if (isAuthenticated && user) {
      forgetOtpEmail()
      navigate(safeRedirectPath(location.state?.redirect) || homePathForRole(getRoleName(user?.role)), { replace: true })
    }
  }, [isAuthenticated, user, navigate, location.state])

  useEffect(() => {
    if (timeLeft <= 0) return
    const timerId = setInterval(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearInterval(timerId)
  }, [timeLeft])

  useEffect(() => {
    if (resendIn <= 0) return
    const timerId = setInterval(() => setResendIn((s) => s - 1), 1000)
    return () => clearInterval(timerId)
  }, [resendIn])

  // Yeni kod birbaşa göndərilir (əvvəl login səhifəsinə atırdı və şifrəni yenidən yazmaq lazım idi)
  const resendCode = async () => {
    if (resendIn > 0 || resending) return
    setResending(true)
    try {
      await api.post("/auth/resend-otp", { email })
      toast.success(t('auth.otp_sent_msg', "Verification code sent to your email."))
      setOtp("")
      setTimeLeft(600)
      setResendIn(RESEND_COOLDOWN)
    } catch (err) {
      toast.error(authErrorMessage(err))
      if (err?.code === "OTP_RECENTLY_SENT") setResendIn(RESEND_COOLDOWN)
    } finally {
      setResending(false)
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await verifyOTP(email, otp)
      toast.success(t('auth.verify_success', "Verification successful!"))
    } catch (err) {
      toast.error(authErrorMessage(err, t('auth.invalid_otp', "Invalid verification code")))
      // Email artıq təsdiqlənibsə OTP-də qalmağın mənası yoxdur
      if (err?.code === "EMAIL_ALREADY_VERIFIED") {
        forgetOtpEmail()
        navigate("/login")
      }
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center border-t bg-muted/40 px-4 py-12">
      <Card className="w-full max-w-sm text-center">
        <CardHeader className="space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">{t('auth.verify_email', 'Verify Email')}</CardTitle>
          <CardDescription>
            {t('auth.otp_sent_to', 'We sent a verification code to')} <br/>
            <span className="font-bold text-foreground">{email}</span>
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            <Input 
              id="otp" 
              type="text" 
              placeholder="0 0 0 0 0 0" 
              className="text-center text-2xl tracking-[0.5em]" 
              maxLength={6}
              inputMode="numeric"
              autoComplete="one-time-code" 
              required 
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              pattern="\d{6}"
            />
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? t('auth.verifying', "Verifying...") : t('auth.verify_code', "Verify Code")}
            </Button>
            <div className="w-full space-y-2 text-sm text-muted-foreground">
              {timeLeft > 0 ? (
                <p className="tabular-nums">
                  {t('auth.expires_in', 'Code expires in')} {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </p>
              ) : (
                <p>{t('auth.code_expired', 'Kodun vaxtı bitib.')}</p>
              )}
              {resendIn > 0 ? (
                <p className="tabular-nums">{t('auth.resend_in', 'Resend code in')} {resendIn}s</p>
              ) : (
                <button
                  type="button"
                  onClick={resendCode}
                  disabled={resending}
                  className="font-medium text-primary hover:underline focus:outline-none disabled:opacity-50"
                >
                  {t('auth.request_new_code', 'Request a new code')}
                </button>
              )}
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
