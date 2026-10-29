import i18next from "i18next"

// Backend auth xəta kodları → istifadəçiyə göstərilən mətn (tərcümə yoxdursa az mətni)
const DEFAULTS = {
  INVALID_CREDENTIALS: "Email və ya şifrə yanlışdır.",
  ACCOUNT_DISABLED: "Hesabınız bloklanıb. Dəstək xidməti ilə əlaqə saxlayın.",
  EMAIL_NOT_VERIFIED: "Email təsdiqlənməyib. Emailinizə yeni kod göndərdik.",
  EMAIL_ALREADY_EXISTS: "Bu email ilə hesab artıq mövcuddur. Daxil olun və ya şifrəni bərpa edin.",
  EMAIL_ALREADY_VERIFIED: "Email artıq təsdiqlənib. Daxil ola bilərsiniz.",
  REGISTRATION_NOT_FOUND: "Qeydiyyat tapılmadı. Yenidən qeydiyyatdan keçin.",
  INVALID_OTP: "Kod yanlışdır.",
  OTP_EXPIRED: "Kodun vaxtı bitib. Yeni kod istəyin.",
  OTP_SEND_FAILED: "Kodu emailə göndərmək alınmadı. Bir az sonra yenidən cəhd edin.",
  OTP_RECENTLY_SENT: "Kod bir az əvvəl göndərilib. Yenisini istəməzdən əvvəl 1 dəqiqə gözləyin.",
  TOO_MANY_ATTEMPTS: "Çox sayda uğursuz cəhd. Bir neçə dəqiqə sonra yenidən cəhd edin.",
  VALIDATION_ERROR: "Daxil edilən məlumatlar düzgün deyil.",
}

export function authErrorMessage(err, fallback) {
  const code = err?.code
  if (code && DEFAULTS[code]) return i18next.t(`auth.errors.${code}`, DEFAULTS[code])
  if (err?.status === 429) return i18next.t("auth.errors.TOO_MANY_ATTEMPTS", DEFAULTS.TOO_MANY_ATTEMPTS)
  if (err?.status === 0) return i18next.t("auth.errors.NETWORK", "Serverə qoşulmaq alınmadı. İnternet bağlantısını yoxlayın.")
  return fallback || i18next.t("auth.errors.GENERIC", "Xəta baş verdi. Yenidən cəhd edin.")
}

// OTP səhifəsi yenilənəndə email itməsin (router state yenilənmədə qalmır)
const OTP_EMAIL_KEY = "otp_email"

export function rememberOtpEmail(email) {
  try {
    sessionStorage.setItem(OTP_EMAIL_KEY, email)
  } catch {
    // sessionStorage əlçatan deyil (məs. məxfi rejim) — router state kifayətdir
  }
}

export function recallOtpEmail() {
  try {
    return sessionStorage.getItem(OTP_EMAIL_KEY) || ""
  } catch {
    return ""
  }
}

export function forgetOtpEmail() {
  try {
    sessionStorage.removeItem(OTP_EMAIL_KEY)
  } catch {
    // yoxdur
  }
}
