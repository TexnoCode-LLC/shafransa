// Bitki redaktorunun bölmələri və sahələri (backend PlantTranslation sahələri ilə eyni adlar)
export const PLANT_SECTIONS = [
  {
    id: "basic",
    label: "Əsas",
    fields: [
      { key: "name", label: "Ad", type: "input", maxLength: 150, placeholder: "məs. Zəfəran", required: true },
      { key: "localName", label: "Yerli ad", type: "input", maxLength: 150, placeholder: "Xalq arasında işlənən ad" },
      { key: "shortSummary", label: "Qısa xülasə", type: "textarea", rows: 2, maxLength: 500, hint: "Kartlarda və axtarış nəticələrində görünür" },
      { key: "description", label: "Təsvir", type: "textarea", rows: 6 },
      { key: "benefits", label: "Faydaları", type: "textarea", rows: 4 },
    ],
  },
  {
    id: "usage",
    label: "İstifadə",
    list: "usageForms",
    fields: [
      { key: "usage", label: "İstifadə qaydası", type: "textarea", rows: 4 },
      { key: "dosage", label: "Doza", type: "textarea", rows: 3 },
      { key: "usedIn", label: "Harada istifadə olunur", type: "textarea", rows: 2, hint: "məs. çay, məlhəm, kulinariya" },
    ],
  },
  {
    id: "safety",
    label: "Təhlükəsizlik",
    fields: [
      { key: "generalSafety", label: "Ümumi təhlükəsizlik", type: "textarea", rows: 3 },
      { key: "sideEffects", label: "Yan təsirlər", type: "textarea", rows: 3 },
      { key: "contraindications", label: "Əks-göstərişlər", type: "textarea", rows: 3 },
      { key: "drugInteractions", label: "Dərman qarşılıqlı təsirləri", type: "textarea", rows: 3 },
      { key: "pregnancyWarnings", label: "Hamiləlik xəbərdarlıqları", type: "textarea", rows: 2 },
      { key: "pregnancy", label: "Hamiləlik", type: "textarea", rows: 2 },
      { key: "allergy", label: "Allergiya", type: "textarea", rows: 2 },
      { key: "dosageCaution", label: "Doza ilə bağlı ehtiyat", type: "textarea", rows: 2 },
      { key: "medicalConditions", label: "Tibbi vəziyyətlər", type: "textarea", rows: 2 },
    ],
  },
  {
    id: "origin",
    label: "Mənşə",
    fields: [
      { key: "continent", label: "Qitə", type: "input", placeholder: "məs. Asiya" },
      { key: "country", label: "Ölkə", type: "input" },
      { key: "region", label: "Region", type: "input" },
      { key: "terroir", label: "Terruar", type: "input" },
      { key: "wildCultivated", label: "Yabanı / becərilən", type: "input" },
      { key: "climate", label: "İqlim", type: "input" },
    ],
  },
  {
    id: "science",
    label: "Elmi məlumat",
    list: "references",
    fields: [
      { key: "evidenceGrade", label: "Sübut dərəcəsi", type: "input", placeholder: "məs. A, B, C" },
      { key: "activeCompounds", label: "Aktiv birləşmələr", type: "textarea", rows: 3 },
      { key: "chemotype", label: "Xemotip", type: "input" },
      { key: "notes", label: "Qeydlər", type: "textarea", rows: 3 },
    ],
  },
]

export const TEXT_FIELD_KEYS = PLANT_SECTIONS.flatMap((section) => section.fields.map((f) => f.key))
