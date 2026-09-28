import { Card, CardContent } from "@/components/admin/ui/card"

// İstifadəçi panelində boş vəziyyət / xəta kartı
export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-muted">
          <Icon className="size-6 text-muted-foreground" />
        </span>
        <p className="mt-4 font-semibold">{title}</p>
        {text && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>}
        {action && <div className="mt-6">{action}</div>}
      </CardContent>
    </Card>
  )
}
