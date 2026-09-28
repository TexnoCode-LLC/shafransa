import { Input } from "@/components/admin/ui/input"
import { Label } from "@/components/admin/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/admin/ui/tabs"
import { Textarea } from "@/components/admin/ui/textarea"
import { CONTENT_LANGUAGES } from "@/lib/admin"
import { cn } from "@/lib/utils"

// Çoxdilli sahələr: hər dil ayrıca tabda, doldurulmuş dillər nöqtə ilə işarələnir.
// values: { az: { name: "", description: "" }, en: {...}, ... }
// fields: [{ key, label, type: "input" | "textarea", maxLength, placeholder, rows }]
export function TranslationFields({ values, onChange, fields, primaryKey = "name", idPrefix = "tr", error }) {
  const update = (lang, key, value) => onChange({ ...values, [lang]: { ...values[lang], [key]: value } })

  return (
    <Tabs defaultValue={CONTENT_LANGUAGES[0].code} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        {CONTENT_LANGUAGES.map(({ code }) => {
          const filled = !!values[code]?.[primaryKey]?.trim()
          return (
            <TabsTrigger
              key={code}
              value={code}
              className="gap-1.5 uppercase"
              aria-label={`${CONTENT_LANGUAGES.find((l) => l.code === code)?.label}${filled ? ", doldurulub" : ", boşdur"}`}
            >
              {code}
              <span
                className={cn("size-1.5 rounded-full", filled ? "bg-primary" : "bg-muted-foreground/30")}
                aria-label={filled ? "doldurulub" : "boşdur"}
              />
            </TabsTrigger>
          )
        })}
      </TabsList>
      {CONTENT_LANGUAGES.map(({ code, label }) => (
        <TabsContent key={code} value={code} className="mt-4 space-y-4">
          <p className="text-xs text-muted-foreground">{label} dilində məzmun</p>
          {fields.map((field) => {
            const id = `${idPrefix}-${code}-${field.key}`
            const value = values[code]?.[field.key] ?? ""
            const Control = field.type === "textarea" ? Textarea : Input
            return (
              <div key={field.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={id}>{field.label}</Label>
                  {field.maxLength && (
                    <span
                      className={cn(
                        "text-xs tabular-nums text-muted-foreground",
                        value.length > field.maxLength && "text-destructive"
                      )}
                    >
                      {value.length}/{field.maxLength}
                    </span>
                  )}
                </div>
                <Control
                  id={id}
                  value={value}
                  rows={field.rows}
                  placeholder={field.placeholder}
                  onChange={(e) => update(code, field.key, e.target.value)}
                  aria-invalid={!!error && field.key === primaryKey}
                />
              </div>
            )
          })}
        </TabsContent>
      ))}
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </Tabs>
  )
}
