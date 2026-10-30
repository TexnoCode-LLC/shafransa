import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import { 
  FaEnvelope, FaPhone, FaMapMarkerAlt, FaPaperPlane, 
  FaWhatsapp, FaInstagram, FaFacebook, FaTwitter, 
  FaShieldAlt, FaClock, FaGlobe 
} from "react-icons/fa"
import { Button } from "../../components/ui/Button"

import SEO from "../../components/common/SEO"
import { STATIC_PAGE_SEO } from "../../utils/seoTranslations"
import { SOCIAL_LINKS } from "../../constants/social"

const ContactPage = () => {
  const { t, i18n } = useTranslation()
  const currentLang = (i18n.language || 'az').toLowerCase().slice(0, 2)
  const seoData = STATIC_PAGE_SEO.contact[currentLang] || STATIC_PAGE_SEO.contact.az
  const [formState, setFormState] = useState({ name: "", email: "", message: "" })

  const handleSubmit = (e) => {
    e.preventDefault()
    // Mock submit
    alert(t('contact.form_success', 'Message sent! We will contact you soon.'))
    setFormState({ name: "", email: "", message: "" })
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <SEO 
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        canonical="/contact"
        crumbs={[{ name: "Home", url: "/" }, { name: "Contact", url: "/contact" }]}
      />
      {/* ── HERO ── */}
      <section className="pt-4 pb-4 bg-white border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-widest mb-6 border border-primary/10">
            <FaEnvelope className="w-3 h-3" />
            {t('contact.badge', 'Global Support')}
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-bold text-[#1a1c1e] tracking-tight mb-8">
            {t('contact.hero_title', 'Connect with our Specialists.')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
            {t('contact.hero_subtitle', 'Have a question about a botanical protocol or an order? Our team of specialists is here to provide clinical-grade support.')}
          </p>
        </div>
      </section>

      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[1fr_400px] gap-20">
            
            {/* ── CONTACT FORM ── */}
            <div className="space-y-12">
              <div className="bg-white p-10 rounded-[48px] border border-neutral-100 shadow-2xl shadow-black/[0.03]">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-[#1a1c1e] ml-1">{t('contact.label_name', 'Full Name')}</label>
                      <input 
                        required
                        type="text" 
                        value={formState.name}
                        onChange={(e) => setFormState({...formState, name: e.target.value})}
                        placeholder="John Smith"
                        className="w-full px-6 py-4 rounded-2xl bg-neutral-50 border border-neutral-100 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none font-medium" 
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-[#1a1c1e] ml-1">{t('contact.label_email', 'Institutional Email')}</label>
                      <input 
                        required
                        type="email" 
                        value={formState.email}
                        onChange={(e) => setFormState({...formState, email: e.target.value})}
                        placeholder="john@example.com"
                        className="w-full px-6 py-4 rounded-2xl bg-neutral-50 border border-neutral-100 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none font-medium" 
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-[#1a1c1e] ml-1">{t('contact.label_message', 'Message')}</label>
                    <textarea 
                      required
                      rows={6}
                      value={formState.message}
                      onChange={(e) => setFormState({...formState, message: e.target.value})}
                      placeholder={t('contact.placeholder_message', 'How can we assist you?')}
                      className="w-full px-6 py-4 rounded-2xl bg-neutral-50 border border-neutral-100 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none font-medium resize-none" 
                    />
                  </div>
                  <Button type="submit" size="lg" className="w-full h-16 rounded-2xl font-bold shadow-xl shadow-primary/20 gap-2">
                    <FaPaperPlane className="w-4 h-4" />
                    {t('contact.submit', 'Dispatch Message')}
                  </Button>
                </form>
              </div>

              {/* Trust badges */}
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="flex items-center gap-4 p-6 rounded-3xl bg-white border border-neutral-100">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                    <FaShieldAlt className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold uppercase tracking-widest text-neutral-400">Encrypted</div>
                </div>
                <div className="flex items-center gap-4 p-6 rounded-3xl bg-white border border-neutral-100">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <FaClock className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold uppercase tracking-widest text-neutral-400">24h Response</div>
                </div>
              </div>
            </div>

            {/* ── SIDEBAR INFO ── */}
            <div className="space-y-10">
              {/* WhatsApp CTA */}
              <div className="p-8 rounded-[40px] bg-primary text-white shadow-2xl shadow-primary/30 relative overflow-hidden group">
                <div className="relative z-10">
                  <h3 className="text-2xl font-display font-bold mb-2">{t('contact.wa_title', 'Instant Support')}</h3>
                  <p className="text-white/80 text-sm mb-6 leading-relaxed">{t('contact.wa_desc', 'Chat directly with our botanical specialists via WhatsApp for real-time guidance.')}</p>
                  <a 
                    href="https://wa.me/994000000000" // Replace with actual number if provided
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 px-6 py-4 bg-white text-primary rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
                  >
                    <FaWhatsapp className="w-5 h-5" />
                    {t('contact.wa_btn', 'Open WhatsApp')}
                  </a>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-8 px-4">
                <div className="flex gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-100 shadow-sm flex items-center justify-center text-primary shrink-0">
                    <FaMapMarkerAlt className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1a1c1e] mb-1">{t('contact.address_title', 'Botanical Hub')}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t('contact.address', '123 Saffron Ave, Baku, Azerbaijan')}
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-100 shadow-sm flex items-center justify-center text-primary shrink-0">
                    <FaEnvelope className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1a1c1e] mb-1">{t('contact.email_title', 'Email')}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">shafranssa@gmail.com</p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-100 shadow-sm flex items-center justify-center text-primary shrink-0">
                    <FaPhone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1a1c1e] mb-1">{t('contact.phone_title', 'Phone')}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">+994 50 806 00 93</p>
                  </div>
                </div>

                {/* Socials */}
                <div className="pt-8 border-t border-neutral-100 flex flex-wrap gap-4">
                  {SOCIAL_LINKS.map(({ key, label, icon: Icon, url }) => (
                    <a
                      key={key}
                      href={url}
                      target={key === "email" ? undefined : "_blank"}
                      rel={key === "email" ? undefined : "noopener noreferrer"}
                      aria-label={label}
                      title={label}
                      className="w-12 h-12 rounded-full border border-neutral-200 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all"
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ContactPage
