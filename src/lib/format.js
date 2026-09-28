// Admin paneli üçün tarix/rəqəm formatları (Bakı vaxtı, Azərbaycan dili)
// Bəzi brauzerlərdə (Chrome) az-AZ üçün ay adları yoxdur və "2026 M09 28" çıxır — adları özümüz veririk
const MONTHS_AZ = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avq", "sen", "okt", "noy", "dek"]

const datePartsFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "numeric",
  year: "numeric",
  timeZone: "Asia/Baku",
})

const timeFormatter = new Intl.DateTimeFormat("az-AZ", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  timeZone: "Asia/Baku",
})

const numberFormatter = new Intl.NumberFormat("az-AZ")

function toDate(value) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDate(value) {
  const date = toDate(value)
  if (!date) return "—"
  const parts = Object.fromEntries(datePartsFormatter.formatToParts(date).map((p) => [p.type, p.value]))
  return `${Number(parts.day)} ${MONTHS_AZ[Number(parts.month) - 1]} ${parts.year}`
}

export function formatTime(value) {
  const date = toDate(value)
  return date ? timeFormatter.format(date) : "—"
}

export function formatNumber(value) {
  return typeof value === "number" ? numberFormatter.format(value) : "—"
}

// "3 gün əvvəl" kimi nisbi vaxt
export function formatRelative(value) {
  const date = toDate(value)
  if (!date) return "—"
  const seconds = Math.round((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return "indicə"
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} dəq əvvəl`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} saat əvvəl`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days} gün əvvəl`
  return formatDate(date)
}

// Sayt qiymətləri dollarla göstərir ($24, $12.50)
const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

// Tam məbləğ qəpiksiz ($24), kəsr həmişə iki rəqəmlə ($8.90 — "$8.9" yox)
const centsFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function formatPrice(value) {
  if (typeof value !== "number") return "—"
  return Number.isInteger(value) ? priceFormatter.format(value) : centsFormatter.format(value)
}

// "4 okt 2026, 10:00" — seans vaxtları həmişə Bakı vaxtı ilə
const hourMinuteFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Baku",
})

export function formatDateTime(value) {
  const date = toDate(value)
  return date ? `${formatDate(date)}, ${hourMinuteFormatter.format(date)}` : "—"
}

export function formatHourMinute(value) {
  const date = toDate(value)
  return date ? hourMinuteFormatter.format(date) : "—"
}

// Gələcək/keçmiş üçün nisbi: "3 gün sonra", "2 saat əvvəl"
export function formatRelativeFuture(value) {
  const date = toDate(value)
  if (!date) return "—"
  const diff = date.getTime() - Date.now()
  if (diff < 0) return formatRelative(date)
  const minutes = Math.round(diff / 60000)
  if (minutes < 60) return `${minutes} dəq sonra`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} saat sonra`
  return `${Math.round(hours / 24)} gün sonra`
}
