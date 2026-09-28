import { useEffect } from "react"
import { Link, Outlet, useLocation } from "react-router-dom"
import { ExternalLink } from "lucide-react"

import "@/styles/admin.css"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { findNavItem } from "@/components/admin/nav"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/admin/ui/breadcrumb"
import { Button } from "@/components/admin/ui/button"
import { Separator } from "@/components/admin/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/admin/ui/sidebar"
import { TooltipProvider } from "@/components/admin/ui/tooltip"

export default function AdminLayout() {
  const { pathname } = useLocation()
  const current = findNavItem(pathname)
  const isOverview = current?.to === "/admin"

  // Tema class-ı body-yə də verilir ki, Radix portalları (dialog, dropdown, select) admin temasında açılsın
  useEffect(() => {
    document.body.classList.add("admin-theme")
    return () => document.body.classList.remove("admin-theme")
  }, [])

  useEffect(() => {
    document.title = current ? `${current.title} · Shafransa Admin` : "Shafransa Admin"
  }, [current])

  return (
    <div className="admin-theme">
      <TooltipProvider delayDuration={200}>
        <SidebarProvider>
          <AdminSidebar />
          {/* min-w-0: geniş cədvəl flex elementini itələyib səhifədə üfüqi scroll yaratmasın */}
          <SidebarInset className="min-w-0">
            <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <SidebarTrigger className="-ml-1" aria-label="Menyunu aç/bağla" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className={isOverview ? undefined : "hidden md:block"}>
                    {isOverview ? (
                      <BreadcrumbPage>İdarəetmə paneli</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link to="/admin">İdarəetmə paneli</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isOverview && current && (
                    <>
                      <BreadcrumbSeparator className="hidden md:block" />
                      <BreadcrumbItem>
                        <BreadcrumbPage>{current.title}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  )}
                </BreadcrumbList>
              </Breadcrumb>
              <div className="ml-auto">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/" target="_blank" rel="noopener noreferrer">
                    <ExternalLink />
                    <span className="hidden sm:inline">Sayta bax</span>
                  </Link>
                </Button>
              </div>
            </header>

            <main className="flex-1 p-4 md:p-6 lg:p-8">
              <div className="mx-auto w-full max-w-7xl">
                <Outlet />
              </div>
            </main>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </div>
  )
}
