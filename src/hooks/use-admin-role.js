import { useAuthStore } from "@/store/useAuthStore"
import { getRoleName } from "@/constants/roles"

// Backend ilə eyni qayda: kontenti (məhsul, kateqoriya, bitki, blog) SuperAdmin və Admin idarə edir,
// istifadəçi idarəetməsi yalnız SuperAdmin-ə açıqdır — UI buna görə düymələri gizlədir
export function useAdminRole() {
  const user = useAuthStore((state) => state.user)
  const role = getRoleName(user?.role)
  return {
    user,
    role,
    isSuperAdmin: role === "SUPERADMIN",
    canEditContent: role === "SUPERADMIN" || role === "ADMIN",
    roleLabel: role === "SUPERADMIN" ? "Super admin" : "Admin",
  }
}
