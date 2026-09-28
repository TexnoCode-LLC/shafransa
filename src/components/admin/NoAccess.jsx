import { Link } from "react-router-dom"
import { ShieldAlert } from "lucide-react"

import { Button } from "@/components/admin/ui/button"
import { Card, CardContent } from "@/components/admin/ui/card"

// Rolu kifayət etməyən admin üçün (API 403 xətası əvəzinə aydın izah)
export function NoAccess({ description = "Bu bölmə yalnız super admin üçündür." }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <ShieldAlert className="size-6 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="font-medium">Giriş icazəniz yoxdur</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin">Ümumi baxışa qayıt</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
