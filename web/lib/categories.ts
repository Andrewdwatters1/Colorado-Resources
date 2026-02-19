export interface Category {
  slug: string;
  label: string;
  emoji: string;
  description: string;
  /** CSV tag name to filter by, or "all" for everything, or "mental-health" for keyword search */
  tag: string;
}

export const CATEGORIES: Category[] = [
  {
    slug: "housing",
    label: "Housing",
    emoji: "🏠",
    description: "Shelters, rental assistance, transitional and permanent housing",
    tag: "Housing",
  },
  {
    slug: "employment",
    label: "Employment",
    emoji: "💼",
    description: "Job placement, workforce development, and career support",
    tag: "Employment",
  },
  {
    slug: "food",
    label: "Food",
    emoji: "🍎",
    description: "Food banks, pantries, meal programs, WIC, and SNAP",
    tag: "Food",
  },
  {
    slug: "mental-health",
    label: "Mental Health",
    emoji: "🧠",
    description: "Counseling, crisis support, behavioral health, and therapy",
    tag: "mental-health", // special keyword filter
  },
  {
    slug: "healthcare",
    label: "Healthcare",
    emoji: "🏥",
    description: "Medical clinics, dental, vision, substance use treatment",
    tag: "Medical",
  },
  {
    slug: "legal",
    label: "Legal Aid",
    emoji: "⚖️",
    description: "Legal services, eviction defense, court help, and advocacy",
    tag: "Legal",
  },
  {
    slug: "transportation",
    label: "Transportation",
    emoji: "🚌",
    description: "Transit programs, ride assistance, and vehicle help",
    tag: "Transportation",
  },
  {
    slug: "veterans",
    label: "Veterans",
    emoji: "🎖️",
    description: "VA benefits, military support, and veteran-specific services",
    tag: "Veterans",
  },
  {
    slug: "benefits",
    label: "Benefits",
    emoji: "📋",
    description: "Government assistance, Medicaid, disability, and utility help",
    tag: "Benefits",
  },
  {
    slug: "youth-family",
    label: "Youth & Family",
    emoji: "👨‍👩‍👧‍👦",
    description: "Child services, family support, foster care, and youth programs",
    tag: "Youth-and-Family",
  },
  {
    slug: "education",
    label: "Education",
    emoji: "📚",
    description: "GED, literacy, vocational training, and continuing education",
    tag: "Education",
  },
  {
    slug: "elderly",
    label: "Elderly & Seniors",
    emoji: "🧓",
    description: "Senior services, aging support, meals, and in-home care",
    tag: "Elderly",
  },
  {
    slug: "lgbtq",
    label: "LGBTQ+",
    emoji: "🌈",
    description: "LGBTQ+-affirming health, legal, housing, and community services",
    tag: "LGBTQ",
  },
  {
    slug: "native-indigenous",
    label: "Native & Indigenous",
    emoji: "🦅",
    description: "Tribally specific and culturally centered services",
    tag: "Native-Indigenous",
  },
  {
    slug: "rural",
    label: "Rural Resources",
    emoji: "🌄",
    description: "Services specifically available in rural and frontier Colorado",
    tag: "Rural",
  },
  {
    slug: "felon-housing",
    label: "Felon-Friendly Housing",
    emoji: "🏘️",
    description: "Housing accepting applicants with a criminal background",
    tag: "Housing-Felon-Friendly",
  },
  {
    slug: "felon-jobs",
    label: "Felon-Friendly Jobs",
    emoji: "🤝",
    description: "Employers known to hire people with felony records",
    tag: "Jobs-Felon-Friendly",
  },
  {
    slug: "weather-shelter",
    label: "Weather Shelter",
    emoji: "🌡️",
    description: "Emergency warming and cooling shelters (temperature-activated)",
    tag: "Weather-Shelter",
  },
  {
    slug: "sex-offender-resources",
    label: "Sex Offender Registry",
    emoji: "📝",
    description: "Housing, employment, and support for those on the registry",
    tag: "SO",
  },
  {
    slug: "all",
    label: "View All Resources",
    emoji: "📂",
    description: "Browse all 1,600+ Colorado resources sorted by community rank",
    tag: "all",
  },
];

export const MENTAL_HEALTH_KEYWORDS = [
  "mental health",
  "behavioral health",
  "counseling",
  "therapy",
  "therapist",
  "psychiatric",
  "psychology",
  "depression",
  "anxiety",
  "crisis",
  "suicide",
  "grief",
  "trauma",
  "ptsd",
  "substance",
  "addiction",
  "recovery",
  "rehab",
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
