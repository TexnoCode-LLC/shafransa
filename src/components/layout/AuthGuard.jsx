import { Navigate, useLocation } from "react-router-dom"
import { useAuthStore } from "../../store/useAuthStore"
import { getRoleName } from "../../constants/roles"
import { homePathForRole } from "@/lib/utils"

export default function AuthGuard({ children, allowedRoles }) {
  const { isAuthenticated, user, signedOutToHome } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated || !user) {
    // Qəsdən çıxışdan sonra ana səhifə; əks halda girişdən sonra bu səhifəyə qayıtmaq üçün ?redirect
    if (signedOutToHome) return <Navigate to="/" replace />
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?redirect=${redirect}`} replace />
  }

  if (allowedRoles) {
    const userRole = getRoleName(user.role)
    if (!allowedRoles.includes(userRole)) return <Navigate to={homePathForRole(userRole)} replace />
  }

  return children
}
