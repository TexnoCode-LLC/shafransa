import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Button } from "../../ui/Button"
import { Input } from "../../ui/Input"
import { useAuthStore } from "../../../store/useAuthStore"
import { toast } from "../../../store/useToastStore"
import { getRoleName } from "../../../constants/roles"
import { Eye, EyeOff } from "lucide-react"

export default function LoginForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { login, isLoading } = useAuthStore()

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.email.trim()) {
      newErrors.email = t("auth.email_required", "Email is required")
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("auth.invalid_email", "Invalid email format")
    }

    if (!formData.password.trim()) {
      newErrors.password = t("auth.password_required", "Password is required")
    } else if (formData.password.length < 6) {
      newErrors.password = t("auth.password_min", "Password must be at least 6 characters")
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      await login(formData)
      toast.success(t("auth.login_success", "Welcome back!"))
      
      const user = useAuthStore.getState().user
      const role = getRoleName(user?.role)
      
      if (role === "ADMIN" || role === "EDITOR") {
        navigate("/admin")
      } else if (role === "SELLER") {
        navigate("/seller")
      } else {
        navigate("/user")
      }
    } catch (err) {
      const errorMessage = err?.message || t("auth.login_error", "Invalid credentials")
      toast.error(errorMessage)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full">
      {/* Email Input */}
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-gray-700">
          {t("auth.email_label", "Email Address")}
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder={t("auth.email_placeholder", "you@example.com")}
          value={formData.email}
          onChange={handleChange}
          disabled={isLoading}
          className={errors.email ? "border-red-500" : ""}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email}</p>
        )}
      </div>

      {/* Password Input */}
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-gray-700">
          {t("auth.password_label", "Password")}
        </label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder={t("auth.password_placeholder", "Enter your password")}
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
            className={errors.password ? "border-red-500 pr-10" : "pr-10"}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            {showPassword ? (
              <EyeOff size={18} />
            ) : (
              <Eye size={18} />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password}</p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition"
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <span className="animate-spin mr-2">⏳</span>
            {t("auth.logging_in", "Logging in...")}
          </span>
        ) : (
          t("auth.login_button", "Sign in")
        )}
      </Button>
    </form>
  )
}
