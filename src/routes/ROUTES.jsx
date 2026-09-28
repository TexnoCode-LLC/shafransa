import React from "react"
import { Navigate } from "react-router-dom"

import PublicLayout from "../components/layout/PublicLayout"
import UserLayout from "../components/layout/UserLayout"
import SellerLayout from "../components/layout/SellerLayout"
import AdminLayout from "../components/layout/AdminLayout"

import LandingPage from "../pages/public/LandingPage"
import LegalPage from "../pages/public/LegalPage"
import NotFoundPage from "../pages/public/NotFoundPage"
import LoginPage from "../pages/auth/LoginPage"
import RegisterPage from "../pages/auth/RegisterPage"
import OTPPage from "../pages/auth/OTPPage"
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage"

import TherapistListingPage from "../pages/public/TherapistListingPage"
import TherapistDetailPage from "../pages/public/TherapistDetailPage"
import TherapistRegisterPage from "../pages/public/TherapistRegisterPage"

import BlogListingPage from "../pages/public/BlogListingPage"
import BlogDetailPage from "../pages/public/BlogDetailPage"

import GlobalError from "../components/ui/GlobalError"
import GuestGuard from "../components/layout/GuestGuard"
import AuthGuard from "../components/layout/AuthGuard"

// Public Commerce
import Marketplace from "../pages/dashboard/Marketplace"
import AIConsultant from "../pages/dashboard/AIConsultant"
import CartPage from "../pages/public/CartPage"
import CheckoutPage from "../pages/public/CheckoutPage"
import ProductDetailsPage from "../pages/public/ProductDetailsPage"

// Encyclopedia System — separate from marketplace
import EncyclopediaIndexPage from "../pages/public/EncyclopediaIndexPage"
import HerbDetailsPage from "../pages/public/HerbDetailsPage"

// Corporate Pages
import AboutPage from "../pages/public/AboutPage"
import ContactPage from "../pages/public/ContactPage"
import HowItWorksPage from "../pages/public/HowItWorksPage"
import AIConsultantPage from "../pages/dashboard/AIConsultant"

// User Area
import UserProfile from "../pages/dashboard/UserProfile"

// Seller Area
import SellerPanel from "../pages/dashboard/SellerPanel"

// Admin Area
import AdminOverviewPage from "../pages/admin/OverviewPage"
import AdminUsersPage from "../pages/admin/UsersPage"
import AdminProductsPage from "../pages/admin/ProductsPage"
import AdminProductEditorPage from "../pages/admin/ProductEditorPage"
import AdminCategoriesPage from "../pages/admin/CategoriesPage"
import AdminPlantsPage from "../pages/admin/PlantsPage"
import AdminPlantEditorPage from "../pages/admin/PlantEditorPage"
import AdminTherapistsPage from "../pages/admin/TherapistsPage"
import AdminTherapistEditorPage from "../pages/admin/TherapistEditorPage"
import AdminBlogsPage from "../pages/admin/BlogsPage"
import AdminBlogEditorPage from "../pages/admin/BlogEditorPage"
import AdminSessionsPage from "../pages/admin/SessionsPage"
import UserOverviewPage from "../pages/user/OverviewPage"
import UserOrdersPage from "../pages/user/OrdersPage"
import UserWishlistPage from "../pages/user/WishlistPage"

// Expert Area
import ExpertPanel from "../pages/dashboard/ExpertPanel"

export const ROUTES = [
  {
    path: "/",
    element: <PublicLayout />,
    errorElement: <GlobalError />,
    children: [
      { index: true, element: <LandingPage /> },

      // Auth — no guard, freely accessible
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "otp", element: <OTPPage /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },

      // ── MARKETPLACE (commerce-first) ──
      { path: "marketplace", element: <Marketplace /> },
      { path: "product/:id", element: <ProductDetailsPage /> },
      // Ayrıca satıcı rolu yoxdur — köhnə mağaza linkləri Market-ə yönləndirilir
      { path: "seller/:id", element: <Navigate to="/marketplace" replace /> },
      { path: "cart", element: <AuthGuard><CartPage /></AuthGuard> },
      { path: "checkout", element: <AuthGuard><CheckoutPage /></AuthGuard> },

      // ── ENCYCLOPEDIA (knowledge-first — distinct from marketplace) ──
      { path: "herbs", element: <EncyclopediaIndexPage /> },
      { path: "herb/:id", element: <HerbDetailsPage /> },

      // ── Corporate Pages ──
      { path: "about", element: <AboutPage /> },
      { path: "contact", element: <ContactPage /> },
      { path: "how-it-works", element: <HowItWorksPage /> },
      { path: "ai-consultant", element: <AIConsultant /> },
      
      // ── THERAPISTS ──
      { path: "therapists", element: <TherapistListingPage /> },
      { path: "therapist/:id", element: <TherapistDetailPage /> },
      { path: "register-therapist", element: <TherapistRegisterPage /> },

      // ── BLOG ──
      { path: "blogs", element: <BlogListingPage /> },
      { path: "blog/:id", element: <BlogDetailPage /> },

      // ── LEGAL ──
      { path: "privacy", element: <LegalPage key="privacy" doc="privacy" /> },
      { path: "terms", element: <LegalPage key="terms" doc="terms" /> },

      { path: "*", element: <NotFoundPage /> },
    ]
  },

  // ── USER AREA ── /user/*
  {
    path: "/user",
    element: <AuthGuard allowedRoles={["MEMBER", "THERAPIST", "ADMIN", "SUPERADMIN"]}><UserLayout /></AuthGuard>,
    errorElement: <GlobalError />,
    children: [
      { index: true, element: <UserOverviewPage /> },
      { path: "orders",   element: <UserOrdersPage /> },
      { path: "wishlist", element: <UserWishlistPage /> },
      { path: "sessions", element: <UserProfile tab="sessions" embedded /> },
      { path: "settings", element: <UserProfile tab="settings" embedded /> },
      { path: "*", element: <Navigate to="/user" replace /> },
    ]
  },

  // ── SELLER AREA ── /seller/*
  {
    path: "/seller",
    element: <AuthGuard allowedRoles={["ADMIN", "SUPERADMIN"]}><SellerLayout /></AuthGuard>,
    errorElement: <GlobalError />,
    children: [
      { index: true,          element: <SellerPanel tab="overview" /> },
      { path: "products",     element: <SellerPanel tab="products" /> },
      { path: "orders",       element: <SellerPanel tab="orders" /> },
      { path: "settings",     element: <SellerPanel tab="settings" /> },
    ]
  },

  // ── EXPERT AREA ── /expert/*
  {
    path: "/expert",
    element: <AuthGuard allowedRoles={["THERAPIST"]}><UserLayout /></AuthGuard>, 
    errorElement: <GlobalError />,
    children: [
      { index: true, element: <ExpertPanel /> },
    ]
  },

  // ── ADMIN AREA ── /admin/*
  {
    path: "/admin",
    element: <AuthGuard allowedRoles={["ADMIN", "SUPERADMIN"]}><AdminLayout /></AuthGuard>,
    errorElement: <GlobalError />,
    children: [
      { index: true,       element: <AdminOverviewPage /> },
      // Aşağıdakılar yeni dizayna keçənə qədər köhnə paneli (embedded) göstərir
      { path: "users",     element: <AdminUsersPage /> },
      { path: "products",  element: <AdminProductsPage /> },
      { path: "products/new", element: <AdminProductEditorPage /> },
      { path: "products/:id", element: <AdminProductEditorPage /> },
      { path: "plants",    element: <AdminPlantsPage /> },
      { path: "plants/new", element: <AdminPlantEditorPage /> },
      { path: "plants/:id", element: <AdminPlantEditorPage /> },
      { path: "categories",element: <AdminCategoriesPage /> },
      { path: "therapists",element: <AdminTherapistsPage /> },
      { path: "therapists/:id", element: <AdminTherapistEditorPage /> },
      { path: "sessions",  element: <AdminSessionsPage /> },
      { path: "blogs",     element: <AdminBlogsPage /> },
      { path: "blogs/new", element: <AdminBlogEditorPage /> },
      { path: "blogs/:id", element: <AdminBlogEditorPage /> },
      { path: "*",         element: <Navigate to="/admin" replace /> },
    ]
  },

  // ── REDIRECTS & COMPATIBILITY ──
  { path: "/cp/home", element: <Navigate to="/user" replace /> },
  { path: "/cp/*", element: <Navigate to="/" replace /> },
  { path: "/user/me", element: <Navigate to="/user" replace /> },
  { path: "/me", element: <Navigate to="/user" replace /> },
  { path: "/auth/login", element: <Navigate to="/login" replace /> },
  { path: "/auth/forgot-password", element: <Navigate to="/forgot-password" replace /> },
  { path: "/reset-password", element: <Navigate to="/forgot-password" replace /> }
]