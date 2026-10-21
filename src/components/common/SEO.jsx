import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { BASE_URL, DEFAULT_SEO_CONFIG } from "../../utils/seoTranslations";
import { getOrganizationSchema, getWebSiteSchema, getBreadcrumbSchema } from "../../utils/seoSchemas";

const LOCALE_MAP = {
  az: "az_AZ",
  en: "en_US",
  ru: "ru_RU",
  tr: "tr_TR",
};

/**
 * Advanced Dynamic SEO Head Controller Component
 * Manages titles, meta descriptions, canonical URLs, hreflang tags,
 * OpenGraph, Twitter cards, and Schema.org JSON-LD structured data.
 */
export default function SEO({
  title,
  description,
  keywords,
  image,
  canonical,
  noindex = false,
  type = "website",
  schema = null,
  crumbs = null,
  lang = null,
}) {
  const { i18n } = useTranslation();
  const location = useLocation();

  const currentLang = (lang || i18n.language || "az").toLowerCase().slice(0, 2);
  const activeLang = DEFAULT_SEO_CONFIG.supportedLanguages.includes(currentLang) ? currentLang : "az";

  const path = location.pathname;
  const currentUrl = canonical
    ? (canonical.startsWith("http") ? canonical : `${BASE_URL}${canonical}`)
    : `${BASE_URL}${path}${location.search}`;

  const metaTitle = title ? `${title} | Shafransa` : "Shafransa - Clinical Botanical Marketplace & Encyclopedia";
  const metaDescription = description || "Shafransa - Klinik yönümlü bitki ensiklopediyası, təsdiqlənmiş marketplace və fitoterapevt seansları.";
  const metaKeywords = keywords || "zəfəran, müalicəvi bitkilər, təbii mehsullar, fitoterapiya, shafransa";
  const metaImage = image
    ? (image.startsWith("http") ? image : `${BASE_URL}${image}`)
    : DEFAULT_SEO_CONFIG.defaultImage;

  useEffect(() => {
    // 1. Update Document Title
    document.title = metaTitle;

    // 2. Update HTML Lang Attribute
    document.documentElement.lang = activeLang;

    // Helper function to update or create meta/link tags
    const updateTag = (selector, attributes) => {
      let element = document.head.querySelector(selector);
      if (!element) {
        element = document.createElement(attributes.tag || "meta");
        document.head.appendChild(element);
      }
      Object.entries(attributes.attrs).forEach(([key, val]) => {
        element.setAttribute(key, val);
      });
    };

    // Helper to clear existing meta tags matching selector
    const removeTags = (selector) => {
      const elements = document.head.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    };

    // 3. Primary Meta Tags
    updateTag('meta[name="description"]', { tag: 'meta', attrs: { name: 'description', content: metaDescription } });
    updateTag('meta[name="keywords"]', { tag: 'meta', attrs: { name: 'keywords', content: metaKeywords } });
    updateTag('meta[name="author"]', { tag: 'meta', attrs: { name: 'author', content: 'Shafransa' } });
    updateTag('meta[name="robots"]', {
      tag: 'meta',
      attrs: {
        name: 'robots',
        content: noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
      }
    });

    // 4. Open Graph Tags
    updateTag('meta[property="og:site_name"]', { tag: 'meta', attrs: { property: 'og:site_name', content: DEFAULT_SEO_CONFIG.siteName } });
    updateTag('meta[property="og:title"]', { tag: 'meta', attrs: { property: 'og:title', content: metaTitle } });
    updateTag('meta[property="og:description"]', { tag: 'meta', attrs: { property: 'og:description', content: metaDescription } });
    updateTag('meta[property="og:type"]', { tag: 'meta', attrs: { property: 'og:type', content: type } });
    updateTag('meta[property="og:url"]', { tag: 'meta', attrs: { property: 'og:url', content: currentUrl } });
    updateTag('meta[property="og:image"]', { tag: 'meta', attrs: { property: 'og:image', content: metaImage } });
    updateTag('meta[property="og:locale"]', { tag: 'meta', attrs: { property: 'og:locale', content: LOCALE_MAP[activeLang] || 'az_AZ' } });

    // OpenGraph locale alternates
    removeTags('meta[property="og:locale:alternate"]');
    DEFAULT_SEO_CONFIG.supportedLanguages.forEach(l => {
      if (l !== activeLang) {
        const altMeta = document.createElement('meta');
        altMeta.setAttribute('property', 'og:locale:alternate');
        altMeta.setAttribute('content', LOCALE_MAP[l]);
        document.head.appendChild(altMeta);
      }
    });

    // 5. Twitter Cards
    updateTag('meta[name="twitter:card"]', { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } });
    updateTag('meta[name="twitter:site"]', { tag: 'meta', attrs: { name: 'twitter:site', content: DEFAULT_SEO_CONFIG.twitterHandle } });
    updateTag('meta[name="twitter:title"]', { tag: 'meta', attrs: { name: 'twitter:title', content: metaTitle } });
    updateTag('meta[name="twitter:description"]', { tag: 'meta', attrs: { name: 'twitter:description', content: metaDescription } });
    updateTag('meta[name="twitter:image"]', { tag: 'meta', attrs: { name: 'twitter:image', content: metaImage } });

    // 6. Canonical Link
    updateTag('link[rel="canonical"]', { tag: 'link', attrs: { rel: 'canonical', href: currentUrl } });

    // 7. Multi-language Hreflang Links (az, en, ru, tr + x-default)
    removeTags('link[rel="alternate"][hreflang]');
    DEFAULT_SEO_CONFIG.supportedLanguages.forEach(l => {
      const hrefUrl = new URL(currentUrl);
      hrefUrl.searchParams.set("lng", l);
      
      const linkTag = document.createElement('link');
      linkTag.setAttribute('rel', 'alternate');
      linkTag.setAttribute('hreflang', l);
      linkTag.setAttribute('href', hrefUrl.toString());
      document.head.appendChild(linkTag);
    });

    // x-default hreflang pointing to primary URL
    const defaultLinkTag = document.createElement('link');
    defaultLinkTag.setAttribute('rel', 'alternate');
    defaultLinkTag.setAttribute('hreflang', 'x-default');
    defaultLinkTag.setAttribute('href', currentUrl);
    document.head.appendChild(defaultLinkTag);

    // 8. JSON-LD Structured Data Generation
    removeTags('script[id^="shafransa-jsonld"]');

    const jsonLdPayloads = [];

    // Always include WebSite & Organization schema on homepage or as root graph
    if (path === "/") {
      jsonLdPayloads.push(getWebSiteSchema());
      jsonLdPayloads.push(getOrganizationSchema());
    }

    // Breadcrumbs schema
    if (crumbs && crumbs.length > 0) {
      const breadcrumbSchema = getBreadcrumbSchema(crumbs);
      if (breadcrumbSchema) jsonLdPayloads.push(breadcrumbSchema);
    }

    // Custom Schema (Product, Herb, Therapist, Blog)
    if (schema) {
      if (Array.isArray(schema)) {
        jsonLdPayloads.push(...schema.filter(Boolean));
      } else {
        jsonLdPayloads.push(schema);
      }
    }

    if (jsonLdPayloads.length > 0) {
      const scriptTag = document.createElement('script');
      scriptTag.id = 'shafransa-jsonld';
      scriptTag.type = 'application/ld+json';
      scriptTag.text = JSON.stringify(jsonLdPayloads.length === 1 ? jsonLdPayloads[0] : jsonLdPayloads, null, 2);
      document.head.appendChild(scriptTag);
    }

  }, [metaTitle, metaDescription, metaKeywords, metaImage, currentUrl, activeLang, noindex, type, schema, crumbs, path]);

  return null;
}
