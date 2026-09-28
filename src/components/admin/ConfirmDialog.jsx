import { Loader2 } from "lucide-react"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/admin/ui/alert-dialog"
import { Button } from "@/components/admin/ui/button"

// Təhlükəli/geri dönməyən əməliyyatlar üçün təsdiq pəncərəsi.
// Əməliyyat gedərkən (pending) pəncərə bağlanmır və düymə deaktivdir — ikiqat klik olmasın.
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Təsdiqlə",
  cancelLabel = "Ləğv et",
  destructive = false,
  pending = false,
  onConfirm,
}) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{cancelLabel}</AlertDialogCancel>
          {/* AlertDialogAction avtomatik bağlayır — biz nəticəni gözləyirik, ona görə adi Button */}
          <Button variant={destructive ? "destructive" : "default"} onClick={onConfirm} disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
