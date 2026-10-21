/**
 * SEO metadata translations for static pages in all 4 supported languages:
 * az (Azerbaijani), en (English), ru (Russian), tr (Turkish).
 */

export const BASE_URL = import.meta.env.VITE_SITE_URL || "https://shafransa.com";

export const DEFAULT_SEO_CONFIG = {
  siteName: "Shafransa",
  defaultImage: "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?auto=format&fit=crop&w=1200&q=80",
  twitterHandle: "@shafransa",
  supportedLanguages: ["az", "en", "ru", "tr"],
};

export const STATIC_PAGE_SEO = {
  home: {
    az: {
      title: "Shafransa - Klinik Botanika Ensiklopediyası & Təbii Mehsullar Marketplace",
      description: "Shafransa - Elmi təsdiqli zəfəran, müalicəvi bitkilər, təbii dərmanlar marketplace-i və peşəkar fitoterapevt seansları platforması.",
      keywords: "zəfəran, müalicəvi bitkilər, təbii mehsullar, fitoterapiya, fitoterapevt, zəfəran çayı, abşeron zəfəranı, shafransa, botanical marketplace",
    },
    en: {
      title: "Shafransa - Clinical Botanical Encyclopedia & Natural Products Marketplace",
      description: "Shafransa - Science-backed premium saffron, medicinal plants, natural remedies marketplace, and licensed physical therapy sessions.",
      keywords: "saffron, medicinal plants, botanical marketplace, phytotherapy, herbal remedies, physical therapy, saffron tea, shafransa",
    },
    ru: {
      title: "Shafransa - Клиническая Ботаническая Энциклопедия и Маркетплейс",
      description: "Shafransa - Маркетплейс сертифицированного шафрана, лекарственных растений и сеансов квалифицированных фитотерапевтов.",
      keywords: "шафран, лекарственные растения, фитотерапия, натуральные продукты, фитотерапевт, чай с шафраном, shafransa",
    },
    tr: {
      title: "Shafransa - Klinik Botanik Ansiklopedi & Doğal Ürünler Pazaryeri",
      description: "Shafransa - Bilimsel onaylı safran, tıbbi bitkiler, doğal takviyeler pazaryeri ve uzman fitoterapist seansları platformu.",
      keywords: "safran, tıbbi bitkiler, botanik pazaryeri, fitoterapi, fitoterapist, safran çayı, doğal ürünler, shafransa",
    },
  },
  marketplace: {
    az: {
      title: "Botanika və Təbii Məhsullar Marketplace | Shafransa",
      description: "Sertifikatlı zəfəran, təbii bitki çayları, efir yağları və fitoterapiya kapsulları. Laboratoriya analizindən keçmiş yüksək keyfiyyətli məhsullar.",
      keywords: "zəfəran al, təbii bitki çayları, efir yağları, bitki kapsulları, təbii dərmanlar, shafransa marketplace",
    },
    en: {
      title: "Botanical & Natural Products Marketplace | Shafransa",
      description: "Browse lab-certified organic saffron, herbal teas, essential oils, and standardized phytotherapy capsules with worldwide delivery.",
      keywords: "buy saffron, organic herbal tea, essential oils, herbal supplements, natural medicine, shafransa marketplace",
    },
    ru: {
      title: "Маркетплейс Ботанических и Натуральных Продуктов | Shafransa",
      description: "Каталог сертифицированного шафрана, травяных чаев, эфирных масел и органических фитокапсул с гарантиями качества.",
      keywords: "купить шафран, травяной чай, эфирные масла, фитопрепараты, органические продукты, shafransa",
    },
    tr: {
      title: "Botanik ve Doğal Ürünler Pazaryeri | Shafransa",
      description: "Laboratuvar testli organik safran, bitki çayları, uçucu yağlar ve standartlaştırılmış bitkisel takviyeler.",
      keywords: "safran satın al, organik bitki çayı, uçucu yağlar, bitkisel kapsül, doğal ürün pazarı, shafransa",
    },
  },
  herbs: {
    az: {
      title: "Klinik Bitki Ensiklopediyası - Müalicəvi Bitkilər və Dərmanlar | Shafransa",
      description: "Zəfəran, lavanda, sarıkök, zəncəfil və yüzlərlə müalicəvi bitkinin kimyəvi tərkibi, doza qaydaları, əks-göstərişləri və kliniki faydaları.",
      keywords: "bitki ensiklopediyası, müalicəvi bitkilər, dərman bitkiləri, zəfəran tərkibi, fitokimyəvi maddələr, bitki dərmanları, shafransa",
    },
    en: {
      title: "Clinical Botanical Encyclopedia - Medicinal Plants & Herbs | Shafransa",
      description: "Comprehensive scientific encyclopedia for saffron, lavender, turmeric, ginger, and therapeutic flora. Active compounds, dosage, safety & contraindications.",
      keywords: "botanical encyclopedia, medicinal plants, herbal medicine guide, active compounds, saffron science, herbal interactions, shafransa",
    },
    ru: {
      title: "Клиническая Ботаническая Энциклопедия Лекарственных Растений | Shafransa",
      description: "Научная база данных о шафране, лаванде, куркуме, имбире и целебных травах. Дозировки, показания, биоактивные вещества и противопоказания.",
      keywords: "энциклопедия растений, лекарственные травы, свойства шафрана, фитотерапия, фармакогнозия, shafransa",
    },
    tr: {
      title: "Klinik Botanik Ansiklopedi - Tıbbi Bitkiler ve Şifalı Otlar | Shafransa",
      description: "Safran, lavanta, zerdeçal, zencefil ve tıbbi bitkilerin aktif bileşenleri, kullanım dozajı, yan etkileri ve bilimsel kanıt dereceleri.",
      keywords: "botanik ansiklopedi, tıbbi bitkiler, şifalı otlar, safran faydaları, etken maddeler, fitoterapi rehberi, shafransa",
    },
  },
  therapists: {
    az: {
      title: "Sertifikatlı Fitoterapevtlər və Reabilitasiya Mütəxəssisləri | Shafransa",
      description: "Ortopedik, nöroloji və kardiyak fitoterapiya üzrə peşəkar fitoterapevtləri tapın və onlayn seans təyin edin.",
      keywords: "fitoterapist baki, reabilitasiya mütəxəssisi, fitoterapiya seansı, ortopedik fitoterapiya, shafransa",
    },
    en: {
      title: "Licensed Physical Therapists & Rehabilitation Experts | Shafransa",
      description: "Find qualified orthopedic, neurological, and cardiac physical therapy specialists. Book direct video consultations and therapy sessions.",
      keywords: "physical therapist, rehabilitation expert, physical therapy booking, orthopedic specialist, shafransa",
    },
    ru: {
      title: "Сертифицированные Фитотерапевты и Специалисты Реабилитации | Shafransa",
      description: "Запись на консультацию к опытноым фитотерапевтам. Ортопедическая, неврологическая и кардио-реабилитация.",
      keywords: "фитотерапевт баку, реабилитолог, сеанс фитотерапии, записи к врачу, shafransa",
    },
    tr: {
      title: "Lisanslı Fitoterapistler ve Rehabilitasyon Uzmanları | Shafransa",
      description: "Ortopedik, nörolojik ve kardiyak rehabilitasyon alanında uzman fitoterapistlerden online randevu alın.",
      keywords: "fitoterapist randevu, rehabilitasyon uzmanı, online fitoterapi, ortopedik fitoterapi, shafransa",
    },
  },
  blogs: {
    az: {
      title: "Botanika, Fitoterapiya və Sağlamlıq Bloqu | Shafransa",
      description: "Zəfəranın kliniki faydaları, bitki təbabəti, fitoterapevtik tədqiqatlar və təbii müalicə üsulları haqqında elmi məqalələr.",
      keywords: "zəfəran bloqu, bitki təbabəti məqalələri, fitoterapiya bloq, sağlamlıq haqqında, shafransa bloq",
    },
    en: {
      title: "Botanical Science, Phytotherapy & Health Journal | Shafransa",
      description: "Scientific articles on saffron research, evidence-based herbal medicine, neuroprotection, and botanical wellness practices.",
      keywords: "saffron journal, phytotherapy blog, botanical medicine articles, natural health journal, shafransa blog",
    },
    ru: {
      title: "Журнал Ботанической Науки и Фитотерапии | Shafransa",
      description: "Научно-популярные статьи о свойствах шафрана, клинической фитотерапии и методах естественного оздоровления.",
      keywords: "блог о фитотерапии, статьи о шафране, травяная медицина, фитофармакология, shafransa",
    },
    tr: {
      title: "Botanik Bilim, Fitoterapi ve Sağlık Blogu | Shafransa",
      description: "Safran araştırmaları, kanıta dayalı bitkisel tıp, nörokoruma ve doğal yaşam üzerine bilimsel makaleler.",
      keywords: "safran blog, fitoterapi makaleleri, şifalı bitkiler blog, doğal sağlık dergisi, shafransa",
    },
  },
  about: {
    az: {
      title: "Haqqımızda - Shafransa Botanika və Sağlamlıq Platforması",
      description: "Shafransa missiyası, Abşeron zəfəranı ənənələri, elmi tədqiqatlarımız və klinik keyfiyyət standartlarımız haqqında ətraflı məlumat.",
      keywords: "shafransa haqqında, abşeron zəfəranı, botanika tədqiqatı, təbii dərman standartları",
    },
    en: {
      title: "About Us - Shafransa Botanical & Wellness Platform",
      description: "Discover Shafransa's mission, centuries-old Absheron saffron heritage, scientific standards, and sustainable botanical sourcing.",
      keywords: "about shafransa, saffron heritage, clinical botanicals, sustainable herbal sourcing",
    },
    ru: {
      title: "О Нас - Ботаническая Платформа Shafransa",
      description: "История Shafransa, традиции абшеронского шафрана, научные стандарты и философия контроля качества.",
      keywords: "о shafransa, абшеронский шафран, стандарты качества, фитоплатформа",
    },
    tr: {
      title: "Hakkımızda - Shafransa Botanik ve Sağlık Platformu",
      description: "Shafransa'nın misyonu, Abşeron safranı mirası, bilimsel standartlarımız ve sürdürülebilir üretim vizyonumuz.",
      keywords: "shafransa hakkında, abşeron safranı, botanik kalitesi, sürdürülebilir bitki üretimi",
    },
  },
  contact: {
    az: {
      title: "Əlaqə - Shafransa Dəstək və Məsləhət Mərkəzi",
      description: "Shafransa komandası ilə əlaqə saxlayın. Sual, təklif, məhsul sorğusu və peşəkar məsləhətlər üçün bizə yazın.",
      keywords: "shafransa əlaqə, zəfəran dəstək, fitoterapiya məsləhət, müştəri xidməti",
    },
    en: {
      title: "Contact Us - Shafransa Support & Inquiries",
      description: "Get in touch with the Shafransa team for customer support, product inquiries, partnership opportunities, and botanical advice.",
      keywords: "contact shafransa, botanical support, saffron inquiries, customer service",
    },
    ru: {
      title: "Контакты - Служба Поддержки Shafransa",
      description: "Свяжитесь с командой Shafransa по вопросам продуктов, консультаций или партнерства.",
      keywords: "контакты shafransa, поддержка клиентам, вопросы по шафрану",
    },
    tr: {
      title: "İletişim - Shafransa Destek ve Danışma Merkezi",
      description: "Shafransa ekibiyle iletişime geçin. Müşteri desteği, ürün soruları ve iş birliği talepleriniz için bize ulaşın.",
      keywords: "shafransa iletişim, destek hattı, safran soruları, botanik danışmanlık",
    },
  },
  howItWorks: {
    az: {
      title: "Necə İşləyir? - Shafransa Platformasından İstifadə Qaydası",
      description: "Məhsul sifarişi, bitki ensiklopediyasında axtarış, AI məsləhətçi istifadəsi və fitoterapist seansı təyini prosesi.",
      keywords: "shafransa necə işləyir, zəfəran sifarişi, fitoterapist randevusu, ai məsləhətçi",
    },
    en: {
      title: "How It Works - Navigating the Shafransa Platform",
      description: "Learn how to order clinical-grade botanicals, search the encyclopedia, consult our AI assistant, and book licensed therapists.",
      keywords: "how shafransa works, order saffron online, book physical therapy, botanical AI guide",
    },
    ru: {
      title: "Как Это Работает - Руководство по Платформе Shafransa",
      description: "Инструкция по заказу продукции, поиску в энциклопедии растений, AI-консультациям и записи к реабилитологу.",
      keywords: "как работает shafransa, заказ шафрана, ai консультант по растениям",
    },
    tr: {
      title: "Nasıl Çalışır? - Shafransa Platformu Kullanım Rehberi",
      description: "Ürün siparişi, bitki ansiklopedisi araması, AI danışmanı kullanımı ve fitoterapist randevusu oluşturma adımları.",
      keywords: "shafransa nasıl çalışır, safran siparişi, online fitoterapi randevu",
    },
  },
  aiConsultant: {
    az: {
      title: "AI Botanika & Fitoterapiya Məsləhətçisi | Shafransa",
      description: "Süni intellekt dəstəkli bitki və sağlamlıq məsləhətçiniz. Simptomlarınıza uyğun müalicəvi bitki və zəfəran reseptləri tapın.",
      keywords: "ai bitki məsləhətçisi, fitoterapiya ai, süni intellekt zəfəran, təbii müalicə məsləhətçisi",
    },
    en: {
      title: "AI Botanical & Phytotherapy Consultant | Shafransa",
      description: "AI-powered botanical assistant. Get evidence-backed herb recommendations, dosage guidance, and personalized wellness insights.",
      keywords: "botanical AI assistant, phytotherapy AI, herbal recommendation engine, saffron AI consultant",
    },
    ru: {
      title: "AI Консультант по Ботанике и Фитотерапии | Shafransa",
      description: "Искусственный интеллект для подбора целебных растений, проверенных дозировок и рецептов с шафраном.",
      keywords: "ai консультант по растениям, фитотерапия ии, искусственный интеллект травы",
    },
    tr: {
      title: "AI Botanik ve Fitoterapi Danışmanı | Shafransa",
      description: "Yapay zeka destekli botanik asistanınız. İhtiyaçlarınıza özel tıbbi bitki ve safran önerileri alın.",
      keywords: "ai botanik danışmanı, fitoterapi yapay zeka, safran asistanı",
    },
  },
};
