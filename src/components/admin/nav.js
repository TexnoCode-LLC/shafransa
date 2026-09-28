import {
  CalendarDays,
  LayoutDashboard,
  LayoutGrid,
  Leaf,
  Newspaper,
  Package,
  Stethoscope,
  Users,
} from "lucide-react"

// Admin paneli naviqasiyası — sidebar, breadcrumb və səhifə başlığı (document.title) bu siyahıdan qurulur.
// superAdminOnly: backend həmin endpointləri yalnız SuperAdmin-ə açır, Admin-ə menyuda göstərilmir.
export const ADMIN_NAV = [
  {
    label: "Ümumi",
    items: [{ title: "Ümumi baxış", to: "/admin", icon: LayoutDashboard, end: true }],
  },
  {
    label: "Kontent",
    items: [
      { title: "Məhsullar", to: "/admin/products", icon: Package },
      { title: "Ensiklopediya", to: "/admin/plants", icon: Leaf },
      { title: "Kateqoriyalar", to: "/admin/categories", icon: LayoutGrid },
      { title: "Bloglar", to: "/admin/blogs", icon: Newspaper },
    ],
  },
  {
    label: "İnsanlar",
    items: [
      { title: "İstifadəçilər", to: "/admin/users", icon: Users, superAdminOnly: true },
      { title: "Terapevtlər", to: "/admin/therapists", icon: Stethoscope, badge: "pendingTherapists" },
    ],
  },
  {
    label: "Əməliyyatlar",
    items: [{ title: "Seanslar", to: "/admin/sessions", icon: CalendarDays }],
  },
]

const ALL_ITEMS = ADMIN_NAV.flatMap((group) => group.items)

export function isNavItemActive(item, pathname) {
  return item.end ? pathname === item.to || pathname === `${item.to}/` : pathname.startsWith(item.to)
}

export function findNavItem(pathname) {
  // Ən uzun uyğun gələn yol (məs. /admin/products → Məhsullar, /admin → Ümumi baxış)
  return [...ALL_ITEMS]
    .sort((a, b) => b.to.length - a.to.length)
    .find((item) => isNavItemActive(item, pathname))
}
