import { FaEnvelope, FaFacebook, FaInstagram, FaLinkedin, FaYoutube } from "react-icons/fa"

// Shafransa-nın rəsmi kanalları. Linki boş olan şəbəkə saytda göstərilmir —
// link veriləndə yalnız buradakı "url" doldurulur.
export const CONTACT_EMAIL = "shafranssa@gmail.com"

export const SOCIAL_LINKS = [
  { key: "instagram", label: "Instagram", icon: FaInstagram, url: "" },
  { key: "facebook", label: "Facebook", icon: FaFacebook, url: "" },
  { key: "linkedin", label: "LinkedIn", icon: FaLinkedin, url: "" },
  { key: "youtube", label: "YouTube", icon: FaYoutube, url: "" },
  { key: "email", label: CONTACT_EMAIL, icon: FaEnvelope, url: `mailto:${CONTACT_EMAIL}` },
].filter((s) => s.url)
