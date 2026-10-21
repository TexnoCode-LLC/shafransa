import { BASE_URL } from "./seoTranslations";

/**
 * Clean text from HTML tags for JSON-LD schema descriptions
 */
export function stripHtml(html) {
  if (!html) return "";
  return String(html)
    .replace(/<[^>]*>?/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Organization Schema for Shafransa
 */
export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BASE_URL}/#organization`,
    name: "Shafransa",
    legalName: "Shafransa LLC",
    url: BASE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${BASE_URL}/assets/favicon.png`,
      width: 512,
      height: 512,
    },
    description: "Klinik yönümlü bitki ensiklopediyası, təsdiqlənmiş zəfəran marketplace-i və fitoterapevt seansları platforması.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Baku",
      addressCountry: "AZ",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+994-50-806-00-93",
      email: "shafranssa@gmail.com",
      contactType: "customer service",
      availableLanguage: ["Azerbaijani", "English", "Russian", "Turkish"],
    },
  };
}

/**
 * WebSite Schema with Sitelinks Search Box
 */
export function getWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE_URL}/#website`,
    url: BASE_URL,
    name: "Shafransa",
    publisher: {
      "@id": `${BASE_URL}/#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/marketplace?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Product Schema for Products / Medicines / Saffron Items
 */
export function getProductSchema(product, currentUrl) {
  if (!product) return null;

  const title = product.title || product.name || "Shafransa Product";
  const rawDesc = product.description || product.shortSummary || title;
  const description = stripHtml(rawDesc);
  const image = product.image || (Array.isArray(product.images) && product.images[0]) || `${BASE_URL}/assets/favicon.png`;
  const price = product.price ? Number(product.price) : 0;
  // Yalnız real rəylər (əvvəl rəysiz məhsula "5 ulduz, 10 rəy" yazılırdı — Google qaydalarını pozur)
  const ratingValue = Number(product.avgRating) || 0;
  const reviewCount = Number(product.reviewsCount) || 0;
  const brandName = "Shafransa";

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${currentUrl || BASE_URL}/#product`,
    name: title,
    image: Array.isArray(product.images) && product.images.length > 0 ? product.images : [image],
    description: description,
    sku: String(product.id || "sku-0"),
    mpn: String(product.id || "mpn-0"),
    brand: {
      "@type": "Brand",
      name: brandName,
    },
    category: product.category?.name || product.form || "Herbal Product",
    offers: {
      "@type": "Offer",
      url: currentUrl || BASE_URL,
      priceCurrency: "AZN", // qiymətlər manatla saxlanılır
      price: price.toFixed(2),
      priceValidUntil: "2027-12-31",
      itemCondition: "https://schema.org/NewCondition",
      availability: (product.stock ?? 1) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: brandName,
      },
    },
  };

  if (ratingValue > 0 && reviewCount > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: ratingValue.toFixed(1),
      reviewCount: reviewCount,
      bestRating: "5",
      worstRating: "1",
    };
  }

  if (product.activeCompounds) {
    schema.additionalProperty = [
      {
        "@type": "PropertyValue",
        name: "Active Compounds",
        value: product.activeCompounds,
      },
    ];
  }

  return schema;
}

/**
 * Botanical / Herb / Medical Web Page Schema for Plant/Herb/Medicine Encyclopedia items
 */
export function getHerbSchema(herb, currentUrl) {
  if (!herb) return null;

  const name = herb.name || herb.localName || "Botanical Plant";
  const scientificName = herb.scientificName || "";
  const rawDesc = herb.description || herb.shortSummary || name;
  const description = stripHtml(rawDesc);
  const image = herb.image || `${BASE_URL}/assets/favicon.png`;

  return [
    {
      "@context": "https://schema.org",
      "@type": "MedicalWebPage",
      "@id": `${currentUrl || BASE_URL}/#medicalpage`,
      name: `${name} (${scientificName}) - Botanical & Medicinal Guide`,
      description: description,
      url: currentUrl || BASE_URL,
      aspect: ["Overview", "Benefits", "Dosage", "Safety", "Contraindications"],
      medicalSpecialty: "Phytotherapy",
    },
    {
      "@context": "https://schema.org",
      "@type": "DefinedTerm",
      "@id": `${currentUrl || BASE_URL}/#herbterm`,
      name: name,
      termCode: herb.id || "herb-0",
      description: description,
      inDefinedTermSet: `${BASE_URL}/herbs`,
    },
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": `${currentUrl || BASE_URL}/#herbproduct`,
      name: `${name} (${scientificName})`,
      image: [image],
      description: herb.shortSummary || description,
      category: "Therapeutic Botanicals",
      brand: {
        "@type": "Brand",
        name: "Shafransa Encyclopedia",
      },
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "AZN",
        lowPrice: "10.00",
        highPrice: "100.00",
        offerCount: (herb.products || []).length || 1,
      },
    },
  ];
}

/**
 * Physician / Therapist / Person Schema
 */
export function getTherapistSchema(therapist, currentUrl) {
  if (!therapist) return null;

  const name = therapist.fullName || "Licensed Therapist";
  const title = therapist.specialization || "Physical Therapist";
  const rawDesc = therapist.bio || therapist.description || `${name} - ${title}`;
  const description = stripHtml(rawDesc);
  const image = therapist.avatar || "https://i.pravatar.cc/150?img=1";
  const ratingValue = therapist.rating ? Number(therapist.rating) : 5;
  const reviewCount = therapist.reviewsCount || therapist.reviewCount || 10;

  return {
    "@context": "https://schema.org",
    "@type": "Physician",
    "@id": `${currentUrl || BASE_URL}/#therapist`,
    name: name,
    jobTitle: title,
    medicalSpecialty: title,
    description: description,
    image: image,
    url: currentUrl || BASE_URL,
    address: {
      "@type": "PostalAddress",
      addressLocality: therapist.location || "Baku",
      addressCountry: "AZ",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: ratingValue.toFixed(1),
      reviewCount: reviewCount,
      bestRating: "5",
      worstRating: "1",
    },
  };
}

/**
 * Article / BlogPosting Schema
 */
export function getBlogSchema(blog, currentUrl) {
  if (!blog) return null;

  const title = blog.title || "Shafransa Article";
  const rawDesc = blog.summary || blog.description || title;
  const description = stripHtml(rawDesc).slice(0, 250);
  const image = (Array.isArray(blog.images) && blog.images[0]) || blog.image || `${BASE_URL}/assets/favicon.png`;
  const authorName = blog.author || "Shafransa Editorial";
  const datePublished = blog.createdAt || new Date().toISOString();

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${currentUrl || BASE_URL}/#blogpost`,
    headline: title,
    description: description,
    image: [image.startsWith("http") ? image : `${BASE_URL}${image}`],
    datePublished: datePublished,
    dateModified: datePublished,
    author: {
      "@type": "Person",
      name: authorName,
    },
    publisher: {
      "@type": "Organization",
      name: "Shafransa",
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/assets/favicon.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": currentUrl || BASE_URL,
    },
  };
}

/**
 * BreadcrumbList Schema
 */
export function getBreadcrumbSchema(items = []) {
  if (!items || items.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${BASE_URL}${item.url.startsWith("/") ? "" : "/"}${item.url}`,
    })),
  };
}
