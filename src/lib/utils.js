import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Returns the URL only if it is an absolute http(s) link; blocks javascript:, data:, etc.
export function safeExternalUrl(url) {
  if (typeof url !== "string" || !url.trim()) return null;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : null;
  } catch {
    return null;
  }
}

export function openExternal(url) {
  const safe = safeExternalUrl(url);
  if (safe) window.open(safe, "_blank", "noopener,noreferrer");
}

// Converts any YouTube watch/short/embed URL into a privacy-friendly embed URL; null for other hosts.
export function toYouTubeEmbedUrl(url) {
  const safe = safeExternalUrl(url);
  if (!safe) return null;
  const { hostname, pathname, searchParams } = new URL(safe);
  const host = hostname.replace(/^www\.|^m\./, "");
  let videoId = null;

  if (host === "youtu.be") {
    videoId = pathname.slice(1);
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (pathname === "/watch") videoId = searchParams.get("v");
    else videoId = pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];
  }

  return videoId && /^[\w-]{6,20}$/.test(videoId)
    ? `https://www.youtube-nocookie.com/embed/${videoId}`
    : null;
}

// Girişdən sonra qayıdılacaq ünvan: yalnız saytın daxili yolu ("/..."); "//host" və tam URL qəbul edilmir (open redirect olmasın)
export function safeRedirectPath(value) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null
  return value
}

// Rola görə standart panel
export function homePathForRole(role) {
  if (role === "SUPERADMIN" || role === "ADMIN") return "/admin"
  if (role === "THERAPIST") return "/expert"
  return "/user"
}
