import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/admin/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/admin/ui/select"

const PAGE_SIZES = [10, 20, 50]

// Cədvəl altı: "1–10 / 43", səhifə ölçüsü və əvvəlki/növbəti düymələri
export function TablePagination({ page, pageSize, total, onPageChange, onPageSizeChange }) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-col-reverse gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground tabular-nums">
        {total === 0 ? "Nəticə yoxdur" : `${total} nəticədən ${from}–${to}`}
      </p>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-muted-foreground sm:inline">Səhifədə</span>
          <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
            <SelectTrigger className="h-8 w-[70px]" aria-label="Səhifədəki sətir sayı">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="min-w-[88px] text-center text-sm tabular-nums">
          {page} / {pageCount}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Əvvəlki səhifə"
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          aria-label="Növbəti səhifə"
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}
