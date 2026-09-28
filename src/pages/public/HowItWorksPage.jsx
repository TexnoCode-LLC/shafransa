import React from "react"
import { useTranslation } from "react-i18next"
import { 
  FaUserEdit, FaMicroscope, FaShoppingBag, FaNotesMedical, 
  FaCheckCircle, FaTruck, FaShieldAlt, FaLeaf 
} from "react-icons/fa"
import logo from "../../assets/logo.png"

import SEO from "../../components/common/SEO"
import { STATIC_PAGE_SEO } from "../../utils/seoTranslations"

const HowItWorksPage = () => {
  const { t, i18n } = useTranslation()
  const currentLang = (i18n.language || 'az').toLowerCase().slice(0, 2)
  const seoData = STATIC_PAGE_SEO.howItWorks[currentLang] || STATIC_PAGE_SEO.howItWorks.az

  const steps = [
    {
      icon: <FaUserEdit className="w-8 h-8" />,
      title: t('how_it_works.step1_title', 'Share Your Story'),
      desc: t('how_it_works.step1_desc', 'Tell us about your health goals, current supplements, and wellness history. We listen to the details that matter.'),
      color: "bg-blue-50 text-blue-600"
    },
    {
      icon: <FaMicroscope className="w-8 h-8" />,
      title: t('how_it_works.step2_title', 'Smart Matching'),
      desc: t('how_it_works.step2_desc', 'Our system cross-references your profile with clinical research to find the safest, most effective botanical matches.'),
      color: "bg-primary/10 text-primary"
    },
    {
      icon: <FaShoppingBag className="w-8 h-8" />,
      title: t('how_it_works.step3_title', 'Secure Sourcing'),
      desc: t('how_it_works.step3_desc', 'Order directly from our verified growers. Every product is lab-tested and certified before it ever reaches you.'),
      color: "bg-amber-50 text-amber-600"
    },
    {
      icon: <FaNotesMedical className="w-8 h-8" />,
      title: t('how_it_works.step4_title', 'Personal Protocol'),
      desc: t('how_it_works.step4_desc', 'Receive clear dosages and timing instructions. Your journey is monitored and adjusted as your health evolves.'),
      color: "bg-green-50 text-green-600"
    }
  ]

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <SEO 
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        canonical="/how-it-works"
        crumbs={[{ name: "Home", url: "/" }, { name: "How It Works", url: "/how-it-works" }]}
      />
      {/* ── HERO SECTION ── */}
      <section className="relative pt-12 pb-12 bg-white border-b border-neutral-100 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-[0.02] pointer-events-none">
          <FaLeaf className="w-[800px] h-[800px] -rotate-45 translate-x-1/2" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-widest mb-6 border border-primary/10">
              <FaCheckCircle className="w-3 h-3" />
              {t('how_it_works.badge', 'Verified Process')}
            </div>
            <h1 className="text-5xl md:text-6xl font-display font-bold text-[#1a1c1e] tracking-tight mb-8 leading-[0.9]">
              {t('how_it_works.hero_title', 'A Simple Path to Personalized Wellness.')}
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
              {t('how_it_works.hero_subtitle', 'We’ve removed the guesswork from herbal medicine. Our four-step process ensures every botanical you take is safe, effective, and tailored exactly to your body.')}
            </p>
          </div>
        </div>
      </section>

      {/* ── STEPS SECTION ── */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="relative group p-10 rounded-[40px] bg-white border border-neutral-100 shadow-sm hover:shadow-2xl hover:shadow-black/5 transition-all duration-500">
                <div className="absolute top-10 right-10 text-6xl font-display font-bold text-neutral-50 group-hover:text-primary/5 transition-colors">
                  0{idx + 1}
                </div>
                <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mb-8 relative z-10`}>
                  {step.icon}
                </div>
                <h3 className="text-2xl font-display font-bold text-[#1a1c1e] mb-4 relative z-10">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed relative z-10 italic">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DETAILED EXPLANATION ── */}
      <section className="py-24 bg-white border-y border-neutral-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-12">
              <div className="p-10 rounded-[48px] bg-neutral-50 space-y-8">
                <div className="flex gap-6">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-primary shrink-0">
                    <FaShieldAlt className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-display font-bold text-xl text-[#1a1c1e]">{t('how_it_works.safety_title', 'Clinical-Grade Safety')}</h4>
                    <p className="text-muted-foreground">{t('how_it_works.safety_desc', 'We don’t just match herbs to symptoms. We cross-reference your entire health profile against known drug-herb interactions.')}</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-primary shrink-0">
                    <FaTruck className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-display font-bold text-xl text-[#1a1c1e]">{t('how_it_works.logistics_title', 'Transparent Supply Chain')}</h4>
                    <p className="text-muted-foreground">{t('how_it_works.logistics_desc', 'Track your herbs from the exact farm in the Caucasus to your doorstep. Full transparency on drying and extraction methods.')}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-10">
              <h2 className="text-4xl font-display font-bold text-[#1a1c1e] tracking-tight">
                {t('how_it_works.human_title', 'Science Driven, Human Centered.')}
              </h2>
              <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                <p>
                  {t('how_it_works.human_p1', 'Generic wellness advice can be risky. We believe that botanical medicine should be as rigorous as anything you’d find in a clinic, but accessible from your home.')}
                </p>
                <p>
                  {t('how_it_works.human_p2', 'Our team of researchers and pharmacists constantly update our database to ensure you are receiving the most current, science-backed guidance available.')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-32 px-4 text-center">
        <div className="max-w-xl mx-auto">
          <img src={logo} className="w-16 h-auto mx-auto mb-10 opacity-20" alt="" />
          <h2 className="text-4xl font-display font-bold text-[#1a1c1e] mb-8">{t('how_it_works.cta_title', 'Ready to start your verified journey?')}</h2>
          <button className="px-10 py-5 rounded-full bg-primary text-white font-bold shadow-2xl shadow-primary/20 hover:bg-primary/90 transition-all">
            {t('get_started')}
          </button>
        </div>
      </section>
    </div>
  )
}

export default HowItWorksPage
