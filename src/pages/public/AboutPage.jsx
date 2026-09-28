import React from "react"
import { useTranslation } from "react-i18next"
import {
  FaLeaf, FaShieldAlt, FaBrain, FaGlobe, FaHeart, FaQuoteLeft
} from "react-icons/fa"
import logo from "../../assets/logo.png"

import SEO from "../../components/common/SEO"
import { STATIC_PAGE_SEO } from "../../utils/seoTranslations"

const AboutPage = () => {
  const { t, i18n } = useTranslation()
  const currentLang = (i18n.language || 'az').toLowerCase().slice(0, 2)
  const seoData = STATIC_PAGE_SEO.about[currentLang] || STATIC_PAGE_SEO.about.az

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <SEO 
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        canonical="/about"
        crumbs={[{ name: "Home", url: "/" }, { name: "About Us", url: "/about" }]}
      />
      {/* ── HERO SECTION ── */}
      <section className="relative pt-4 pb-4 overflow-hidden bg-white border-b border-neutral-100">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-[0.03]">
          <img src={logo} className="w-[600px] h-auto grayscale opacity-10 absolute -top-40 -left-60" alt="" />
        </div>

        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-widest mb-6 border border-primary/10">
              <img src={logo} className="w-4 h-auto" alt="" />
              {t('about.badge', 'Our Botanical Legacy')}
            </div>
            <h1 className="text-5xl md:text-6xl font-display font-bold text-[#1a1c1e] tracking-tight mb-8 leading-[0.9]">
              {t('about.hero_title', 'Botanical Science Reimagined.')}
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
              {t('about.hero_subtitle', 'Shafransa is the world’s first clinical-grade botanical ecosystem, merging ancient Caucasian wisdom with advanced neural analytics.')}
            </p>
          </div>
        </div>
      </section>

      {/* ── MISSION & VISION ── */}
      <section className="py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-12">
              <div className="space-y-4">
                <h2 className="text-4xl font-display font-bold text-[#1a1c1e]">{t('about.story_title', 'Our Story')}</h2>
                <div className="w-20 h-1 bg-primary rounded-full" />
              </div>

              <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                <p>
                  {t('about.story_p1', 'Founded in the heart of the Caucasus, Shafransa was born from a simple observation: the world of herbal medicine lacked the transparency and scientific rigor of modern pharmaceuticals.')}
                </p>
                <p>
                  {t('about.story_p2', 'We set out to change that by building a platform that doesn’t just sell herbs, but provides a verified, data-driven path to wellness.')}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-8 pt-8">
                <div className="p-8 rounded-3xl bg-white border border-neutral-100 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
                    <FaGlobe className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-bold text-xl mb-3 text-[#1a1c1e]">{t('about.mission_title', 'Our Mission')}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t('about.mission_desc', 'To democratize access to lab-verified botanical medicine through artificial intelligence.')}
                  </p>
                </div>
                <div className="p-8 rounded-3xl bg-white border border-neutral-100 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
                    <FaBrain className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-bold text-xl mb-3 text-[#1a1c1e]">{t('about.vision_title', 'Our Vision')}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t('about.vision_desc', 'A world where every botanical intervention is as precise and safe as molecular medicine.')}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-[4/5] rounded-[48px] overflow-hidden shadow-2xl shadow-black/10">
                <img
                  src="https://images.stockcake.com/public/d/e/6/de6a85ac-6b54-4e1a-a289-987d0f705225_large/botanical-research-study-stockcake.jpg"
                  className="w-full h-full object-cover"
                  alt="Botanical Research"
                />
              </div>
              <div className="absolute -bottom-10 -left-10 p-10 bg-white rounded-[40px] shadow-2xl border border-neutral-100 max-w-[320px] hidden md:block">
                <FaQuoteLeft className="w-10 h-10 text-primary/20 mb-4" />
                <p className="text-lg font-display font-medium text-[#1a1c1e] italic mb-4">
                  "Purity is not a slogan, it's a certificate of analysis."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-100" />
                  <div>
                    <div className="text-sm font-bold text-[#1a1c1e]">Dr. Elnur Aliyev</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Chief Scientist</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CORE PILLARS ── */}
      <section className="py-32 bg-[#1a1c1e] text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-4xl font-display font-bold mb-6">{t('about.pillars_title', 'The Three Pillars of Shafransa')}</h2>
            <p className="text-neutral-400">{t('about.pillars_subtitle', 'Our methodology is built on a foundation of trust, science, and absolute transparency.')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-10 rounded-[40px] bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <FaShieldAlt className="w-12 h-12 text-primary mb-8" />
              <h3 className="text-2xl font-display font-bold mb-4">{t('about.pillar1_title', 'Purity First')}</h3>
              <p className="text-neutral-400 leading-relaxed">
                {t('about.pillar1_desc', 'Every batch of herbs on our marketplace undergoes 3rd party lab testing for heavy metals, pesticides, and microbial contamination.')}
              </p>
            </div>
            <div className="p-10 rounded-[40px] bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <FaBrain className="w-12 h-12 text-primary mb-8" />
              <h3 className="text-2xl font-display font-bold mb-4">{t('about.pillar2_title', 'Neural Analytics')}</h3>
              <p className="text-neutral-400 leading-relaxed">
                {t('about.pillar2_desc', 'Our proprietary Shafransa AI Core™ analyzes thousands of clinical trials to provide evidence-based interaction checks and dosages.')}
              </p>
            </div>
            <div className="p-10 rounded-[40px] bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <FaHeart className="w-12 h-12 text-primary mb-8" />
              <h3 className="text-2xl font-display font-bold mb-4">{t('about.pillar3_title', 'Ethical Sourcing')}</h3>
              <p className="text-neutral-400 leading-relaxed">
                {t('about.pillar3_desc', 'We work directly with traditional Caucasian harvesters, ensuring fair wages and sustainable wild-crafting practices.')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-32 px-4 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-4xl font-display font-bold text-[#1a1c1e] mb-8">{t('about.cta_title', 'Experience Clinical Botanical Intelligence.')}</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-10 py-5 rounded-full bg-primary text-white font-bold shadow-2xl shadow-primary/20 hover:bg-primary/90 transition-all">
              {t('get_started')}
            </button>
            <button className="px-10 py-5 rounded-full bg-white border border-neutral-200 text-[#1a1c1e] font-bold hover:bg-neutral-50 transition-all">
              {t('about.view_research', 'View Our Research')}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AboutPage
