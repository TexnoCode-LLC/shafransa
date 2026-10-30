// Admin panelinin ortaq helperləri

// Backend rolu string kimi qaytarır (JsonStringEnumConverter)
export const USER_ROLE_LABELS = {
  SuperAdmin: "Super admin",
  Admin: "Admin",
  Therapist: "Terapevt",
  Member: "İstifadəçi",
}

// "Zakir Aliyev" → "ZA"
export function getInitials(name) {
  return (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

// Backend xəta kodlarının admin üçün Azərbaycan dilində izahı (api.js xətada "code" ötürür)
const ERROR_MESSAGES = {
  PRODUCT_HAS_ORDERS: "Bu məhsulun sifarişləri var, ona görə silinə bilməz. Satışdan çıxarmaq üçün stoku 0 edin.",
  PRODUCT_NOT_FOUND: "Məhsul tapılmadı — ola bilsin artıq silinib.",
  FORBIDDEN: "Bu əməliyyat üçün icazəniz yoxdur.",
  VALIDATION_ERROR: "Daxil edilən məlumatlar düzgün deyil.",
  SLUG_TAKEN: "Bu URL ünvanı başqa yazıda istifadə olunub. Başqa ünvan yazın.",
  INVALID_CATEGORY: "Kateqoriya tanınmadı.",
  INVALID_SOURCE_URL: "Mənbə linki düzgün deyil — https://… link və ya DOI (10.xxxx/…) yazın.",
  CANNOT_MODIFY_SELF: "Öz hesabınızı dəyişə bilməzsiniz.",
  ROLE_CHANGE_NOT_ALLOWED: "Bu hesabın rolu dəyişdirilə bilməz.",
  CATEGORY_HAS_PRODUCTS: "Bu kateqoriyada məhsullar var, əvvəlcə onları başqa kateqoriyaya köçürün.",
  CATEGORY_HAS_CHILDREN: "Bu kateqoriyanın alt kateqoriyaları var, əvvəlcə onları silin.",
  SLUG_ALREADY_EXISTS: "Bu slug artıq istifadə olunur.",
  INVALID_TRANSLATIONS_JSON: "Tərcümə məlumatları düzgün deyil.",
  FILE_TOO_LARGE: "Fayl çox böyükdür (maksimum 10 MB).",
  FILE_TYPE_NOT_ALLOWED: "Bu fayl növü qəbul olunmur. Şəkil üçün JPG, PNG, WEBP və ya GIF seçin.",
  CATEGORY_NOT_FOUND: "Kateqoriya tapılmadı — ola bilsin artıq silinib.",
  PARENT_CATEGORY_NOT_FOUND: "Seçilən ana kateqoriya tapılmadı.",
  INVALID_PARENT: "Bu ana kateqoriya seçilə bilməz: yalnız 2 səviyyə (əsas və alt) dəstəklənir.",
  TRANSLATION_REQUIRED: "Ən azı bir dildə ad (başlıq) yazın.",
  DUPLICATE_LANGUAGE: "Eyni dil iki dəfə göndərilib.",
  TRANSLATION_TOO_LONG: "Mətn sahələrindən biri icazə verilən uzunluğu keçir.",
  INVALID_SLUG: "Slug yalnız kiçik latın hərfləri, rəqəmlər və tire (-) ola bilər.",
  PLANT_NOT_FOUND: "Bitki tapılmadı — ola bilsin artıq silinib.",
  INVALID_REFERENCE_LINK: "Mənbə linki http:// və ya https:// ilə başlayan düzgün ünvan olmalıdır.",
  INVALID_USAGE_FORM: "İstifadə formasının adı boş ola bilməz.",
  GALLERY_LIMIT: "Qalereyada ən çox 12 şəkil ola bilər.",
  REQUEST_NOT_FOUND: "Müraciət tapılmadı — ola bilsin artıq silinib.",
  REQUEST_ALREADY_PROCESSED: "Bu müraciət artıq emal olunub. Siyahı yeniləndi.",
  THERAPIST_NOT_VERIFIED: "Təsdiqlənməmiş terapevt saytda göstərilə bilməz.",
  THERAPIST_NOT_FOUND: "Terapevt tapılmadı.",
  BLOG_NOT_FOUND: "Yazı tapılmadı — ola bilsin artıq silinib.",
  INVALID_VIDEO_URL: "Video linki YouTube ünvanı olmalıdır (youtube.com və ya youtu.be).",
  SESSION_NOT_FOUND: "Seans tapılmadı.",
  INVALID_PRICE: "Qiymət 0-dan böyük olmalıdır.",
  INVALID_ORIGINAL_PRICE: "Köhnə qiymət yeni qiymətdən böyük olmalıdır (və ya boş qalmalıdır).",
  VALUE_TOO_LONG: "Sahələrdən biri icazə verilən uzunluğu keçir.",
  INVALID_LANGUAGE: "Dəstəklənməyən dil göndərilib.",
  INVALID_HOUR_FORMAT: "İş saatları SS:dd formatında olmalıdır (ən çox 24 saat).",
  CERTIFICATE_LIMIT: "Terapevtin ən çox 20 sertifikatı ola bilər.",
  USER_NOT_FOUND: "İstifadəçi tapılmadı — ola bilsin artıq silinib.",
  EMAIL_ALREADY_EXISTS: "Bu email artıq başqa hesabda istifadə olunur.",
  USER_HAS_ORDERS: "Bu istifadəçinin sifarişləri var, ona görə hesab silinə bilməz. Əvəzinə bloklayın.",
  USER_HAS_PRODUCTS: "Bu istifadəçi məhsul əlavə edib, ona görə hesab silinə bilməz. Əvəzinə bloklayın.",
  USER_HAS_SESSIONS: "Bu terapevtin seans tarixçəsi var, ona görə hesab silinə bilməz. Əvəzinə bloklayın.",
  INVALID_SESSION_STATUS: "Bu seans artıq ləğv edilib və ya tamamlanıb. Siyahı yeniləndi.",
}

export function apiErrorMessage(error, fallback = "Əməliyyat alınmadı. Yenidən cəhd edin.") {
  if (error?.code && ERROR_MESSAGES[error.code]) return ERROR_MESSAGES[error.code]
  if (error?.status === 403) return ERROR_MESSAGES.FORBIDDEN
  if (error?.status === 0) return "Serverə qoşulmaq alınmadı. İnternet bağlantısını yoxlayın."
  return error?.message || fallback
}

// Backend SlugHelper ilə eyni qayda: "Bitki çayları" → "bitki-caylari"
const SLUG_MAP = {
  ə: "e", ı: "i", ö: "o", ü: "u", ğ: "g", ş: "s", ç: "c",
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l",
  м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh",
  щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
}

export function slugify(input) {
  return (input || "")
    .trim()
    .toLocaleLowerCase("az")
    .split("")
    .map((ch) => SLUG_MAP[ch] ?? ch)
    .join("")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "")
}

export const isValidSlug = (slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 80

export const CONTENT_LANGUAGES = [
  { code: "az", label: "Azərbaycan" },
  { code: "en", label: "English" },
  { code: "ru", label: "Русский" },
  { code: "tr", label: "Türkçe" },
]

export const therapistName = (therapist) => therapist?.user?.fullName || therapist?.email || "Adsız"
