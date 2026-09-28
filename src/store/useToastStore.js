import { toast as sonner } from "sonner"

// Köhnə toast API-si saxlanılır, göstərmə isə sonner-dədir (admin və sayt eyni bildirişlərdən istifadə edir).
// İkinci arqument (başlıq) verilibsə başlıq kimi, mesaj isə açıqlama kimi göstərilir.
const show = (kind) => (message, title) =>
  title ? sonner[kind](title, { description: message }) : sonner[kind](message)

export const toast = {
  success: show("success"),
  error: show("error"),
  warning: show("warning"),
  info: show("info"),
}
