import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { ChevronDown, Loader2, Package, PackageOpen, RotateCcw } from "lucide-react"

import { Button } from "@/components/admin/ui/button"
import { EmptyState } from "@/components/account/EmptyState"
import { Card } from "@/components/admin/ui/card"
import { Skeleton } from "@/components/admin/ui/skeleton"
import { ProductImage } from "@/components/shop/ProductCard"
import { formatDateTime, formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"
import { addToCart } from "../../services/cart.service"
import { getMyOrders } from "../../services/order.service"
import { accountKeys } from "./queries"

const asList = (value) => (Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : [])
const orderTotal = (order) => (order.items || []).reduce((sum, item) => sum + item.price * item.quantity, 0)

function OrderCard({ order }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [reordering, setReordering] = useState(false)
  const items = order.items || []
  const count = items.reduce((sum, item) => sum + item.quantity, 0)

  // Hər məhsul ayrıca əlavə olunur; stok bitmiş olanlar üçün ümumi xəbərdarlıq
  const reorder = async () => {
    setReordering(true)
    const results = await Promise.allSettled(items.filter((i) => i.product).map((i) => addToCart(i.product.id, i.quantity)))
    setReordering(false)
    queryClient.invalidateQueries({ queryKey: ["cart"] })
    const failed = results.filter((r) => r.status === "rejected").length
    const action = { label: t("account.orders.view_cart"), onClick: () => navigate("/cart") }
    if (failed === results.length) toast.error(t("account.orders.reorder_partial"))
    else if (failed > 0) toast.warning(t("account.orders.reorder_partial"), { action })
    else toast.success(t("account.orders.reordered"), { action })
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4 sm:p-5">
        <div>
          <p className="font-semibold">{t("account.orders.order_number", { id: order.id.slice(0, 8).toUpperCase() })}</p>
          <p className="text-sm text-muted-foreground">
            {formatDateTime(order.createdAt)} · {t("account.orders.items_count", { count })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">{t("account.orders.total")}</p>
          <p className="text-lg font-semibold tabular-nums">{formatPrice(orderTotal(order))}</p>
        </div>
      </div>

      <ul className="divide-y">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
            <Link to={item.product ? `/product/${item.product.id}` : "#"} className="shrink-0 overflow-hidden rounded-lg border" tabIndex={-1} aria-hidden>
              <ProductImage src={item.product?.image} alt="" className="size-14" />
            </Link>
            <div className="min-w-0 flex-1">
              {item.product ? (
                <Link to={`/product/${item.product.id}`} className="line-clamp-2 text-sm font-medium hover:text-primary">
                  {item.product.title}
                </Link>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
              <p className="text-xs tabular-nums text-muted-foreground">
                {item.quantity} × {formatPrice(item.price)}
              </p>
            </div>
            <p className="shrink-0 text-sm font-medium tabular-nums">{formatPrice(item.price * item.quantity)}</p>
          </li>
        ))}
      </ul>

      <div className="border-t">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/40 sm:px-5"
        >
          {t("account.orders.show_details")}
          <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>
        {open && (
          <dl className="grid gap-x-6 gap-y-3 px-4 pb-4 text-sm sm:grid-cols-2 sm:px-5">
            {[
              ["recipient", order.fullName],
              ["phone", order.phone],
              ["address", order.address],
              ["payment", t("account.orders.payment_cod")],
              ["note", order.note],
            ]
              .filter(([, value]) => value)
              .map(([key, value]) => (
                <div key={key} className={cn(key === "address" || key === "note" ? "sm:col-span-2" : "")}>
                  <dt className="text-xs text-muted-foreground">{t(`account.orders.${key}`)}</dt>
                  <dd className="mt-0.5 whitespace-pre-line">{value}</dd>
                </div>
              ))}
          </dl>
        )}
      </div>

      <div className="flex justify-end border-t p-3 sm:px-5">
        <Button variant="outline" size="sm" onClick={reorder} disabled={reordering || items.length === 0}>
          {reordering ? <Loader2 className="animate-spin" /> : <RotateCcw />}
          {t("account.orders.reorder")}
        </Button>
      </div>
    </Card>
  )
}

export default function OrdersPage() {
  const { t } = useTranslation()
  const orders = useQuery({ queryKey: accountKeys.orders, queryFn: getMyOrders })
  const list = asList(orders.data)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("account.orders.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("account.orders.description")}</p>
      </div>

      {orders.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      ) : orders.isError ? (
        <EmptyState
          icon={Package}
          title={t("account.errors.load")}
          action={
            <Button variant="outline" size="sm" onClick={() => orders.refetch()}>
              {t("account.errors.retry")}
            </Button>
          }
        />
      ) : list.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title={t("account.orders.empty_title")}
          text={t("account.orders.empty_text")}
          action={
            <Button asChild>
              <Link to="/marketplace">{t("account.orders.go_shop")}</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {list.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}
