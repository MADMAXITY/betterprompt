export const CATEGORIES = {
  WRITING: "Writing",
  CODING: "Coding", 
  MARKETING: "Marketing",
  BUSINESS: "Business",
  EDUCATION: "Education"
} as const;

export const CATEGORY_COLORS = {
  [CATEGORIES.WRITING]: "primary",
  [CATEGORIES.CODING]: "green-500",
  [CATEGORIES.MARKETING]: "blue-500", 
  [CATEGORIES.BUSINESS]: "orange-500",
  [CATEGORIES.EDUCATION]: "purple-500"
} as const;

export const CATEGORY_ICONS = {
  [CATEGORIES.WRITING]: "fas fa-pen-nib",
  [CATEGORIES.CODING]: "fas fa-code",
  [CATEGORIES.MARKETING]: "fas fa-bullhorn",
  [CATEGORIES.BUSINESS]: "fas fa-briefcase", 
  [CATEGORIES.EDUCATION]: "fas fa-graduation-cap"
} as const;

export const TONES = [
  "Professional",
  "Conversational", 
  "Authoritative",
  "Friendly",
  "Casual",
  "Academic",
  "Creative",
  "Technical"
] as const;

export const AUDIENCES = [
  "General",
  "Beginners",
  "Professionals", 
  "Students",
  "Developers",
  "Marketers",
  "Business Leaders",
  "Educators"
] as const;
