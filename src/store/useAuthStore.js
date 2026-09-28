import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../services/api";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      // Qəsdən çıxış: qorunan səhifədə AuthGuard /login əvəzinə ana səhifəyə yönləndirir (yaddaşda saxlanmır)
      signedOutToHome: false,

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const data = await api.post("/auth/login", credentials);
          // data should contain: { user: {...}, token: "jwt_token" }
          set({ 
            user: data.user, 
            token: data.token, 
            isAuthenticated: true, signedOutToHome: false, 
            isLoading: false 
          });
          return data;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (credentials) => {
        set({ isLoading: true });
        try {
          // Register sends OTP first
          const data = await api.post("/auth/register", credentials);
          set({ isLoading: false });
          return data;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      verifyOTP: async (email, otp) => {
        set({ isLoading: true });
        try {
          const data = await api.post("/auth/verify-otp", { email, otp });
          // After OTP verification, set user and token
          set({ 
            user: data.user, 
            token: data.token, 
            isAuthenticated: true, signedOutToHome: false, 
            isLoading: false 
          });
          return data;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      forgotPassword: async (email) => {
        set({ isLoading: true });
        try {
          const data = await api.post("/auth/forgot-password", { email });
          set({ isLoading: false });
          return data;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      resetPassword: async ({ email, otp, newPassword, password }) => {
        set({ isLoading: true });
        try {
          const finalPassword = newPassword || password;
          const data = await api.post("/auth/reset-password", { 
            email, 
            otp: String(otp).trim(), 
            newPassword: finalPassword,
            password: finalPassword
          });
          set({ isLoading: false });
          return data;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // ✅ Fixed endpoint path from /users/me to /user/me (singular)
      fetchMe: async () => {
        const token = get().token;
        if (!token) return;
        try {
          const user = await api.get("/user/me");
          set({ user, isAuthenticated: true, signedOutToHome: false });
        } catch (error) {
          set({ user: null, token: null, isAuthenticated: false });
          throw error;
        }
      },

      logout: ({ toHome = false } = {}) => {
        set({ user: null, token: null, isAuthenticated: false, signedOutToHome: toHome });
      },
    }),
    {
      name: "auth-storage",
      partialize: ({ signedOutToHome, isLoading, ...rest }) => rest, // eslint-disable-line no-unused-vars
    }
  )
);
