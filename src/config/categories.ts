import { Category, CategoryType } from "@/types";

export const defaultCategories: Category[] = [
  // === INCOME ===
  { id: "salary", name: "Salary", nameDA: "Løn", type: "income", icon: "Briefcase", color: "#22c55e", sortOrder: 1 },
  { id: "self_employment", name: "Self-employment", nameDA: "Selvstændig", type: "income", icon: "Stethoscope", color: "#16a34a", sortOrder: 2 },
  { id: "child_benefits", name: "Child Benefits", nameDA: "Børne- og Ungeydelse", type: "income", icon: "Baby", color: "#86efac", sortOrder: 3 },
  { id: "travel_reimbursement", name: "Travel Reimbursement", nameDA: "Rejseafregning", type: "income", icon: "Receipt", color: "#4ade80", sortOrder: 4 },
  { id: "other_income", name: "Other Income", nameDA: "Anden indkomst", type: "income", icon: "PiggyBank", color: "#a3e635", sortOrder: 5 },
  { id: "refund", name: "Refund", nameDA: "Tilbagebetaling", type: "income", icon: "RotateCcw", color: "#bef264", sortOrder: 6 },
  { id: "family_transfer", name: "Family Transfers", nameDA: "Familieoverførsler", type: "income", icon: "Users", color: "#34d399", sortOrder: 7 },

  // === HOUSING ===
  { id: "mortgage", name: "Mortgage / Loan", nameDA: "Boliglån", type: "expense", icon: "Home", color: "#ef4444", sortOrder: 10 },
  { id: "housing_association", name: "Housing Association", nameDA: "Boligforening", type: "expense", icon: "Building2", color: "#dc2626", sortOrder: 11 },
  { id: "rent", name: "Rent", nameDA: "Husleje", type: "expense", icon: "Key", color: "#b91c1c", sortOrder: 12 },
  { id: "home_improvement", name: "Home Improvement", nameDA: "Boligforbedring", type: "expense", icon: "Hammer", color: "#f87171", sortOrder: 13 },

  // === TAX ===
  { id: "tax", name: "Tax", nameDA: "Skat", type: "expense", icon: "Landmark", color: "#6b7280", sortOrder: 20 },

  // === UTILITIES ===
  { id: "electricity", name: "Electricity", nameDA: "El", type: "expense", icon: "Zap", color: "#f59e0b", sortOrder: 30 },
  { id: "water", name: "Water", nameDA: "Vand", type: "expense", icon: "Droplets", color: "#3b82f6", sortOrder: 31 },
  { id: "waste", name: "Waste / Renovation", nameDA: "Affald / Renovation", type: "expense", icon: "Trash2", color: "#78716c", sortOrder: 32 },
  { id: "heating", name: "Heating", nameDA: "Varme", type: "expense", icon: "Flame", color: "#ea580c", sortOrder: 33 },

  // === INSURANCE ===
  { id: "insurance", name: "Insurance", nameDA: "Forsikring", type: "expense", icon: "Shield", color: "#8b5cf6", sortOrder: 40 },
  { id: "health_insurance", name: "Health Insurance", nameDA: "Sygeforsikring", type: "expense", icon: "HeartPulse", color: "#a78bfa", sortOrder: 41 },

  // === CHILDREN ===
  { id: "school", name: "School", nameDA: "Skole", type: "expense", icon: "GraduationCap", color: "#06b6d4", sortOrder: 50 },
  { id: "sfo", name: "SFO / After-school", nameDA: "SFO / Fritidsordning", type: "expense", icon: "School", color: "#22d3ee", sortOrder: 51 },
  { id: "children_activities", name: "Children Activities", nameDA: "Børneaktiviteter", type: "expense", icon: "Trophy", color: "#67e8f9", sortOrder: 52 },
  { id: "children_allowance", name: "Children Allowance", nameDA: "Lommepenge", type: "expense", icon: "Coins", color: "#a5f3fc", sortOrder: 53 },
  { id: "children_savings", name: "Children Savings", nameDA: "Børneopsparing", type: "expense", icon: "PiggyBank", color: "#0891b2", sortOrder: 54 },

  // === PENSION ===
  { id: "pension", name: "Pension", nameDA: "Pension", type: "expense", icon: "Timer", color: "#059669", sortOrder: 60 },

  // === PROFESSIONAL ===
  { id: "union_dues", name: "Union / Professional", nameDA: "Fagforening", type: "expense", icon: "Users", color: "#4f46e5", sortOrder: 70 },

  // === GROCERIES & FOOD ===
  { id: "groceries", name: "Groceries", nameDA: "Dagligvarer", type: "expense", icon: "ShoppingCart", color: "#f97316", sortOrder: 80 },
  { id: "dining", name: "Dining / Restaurants", nameDA: "Restauranter", type: "expense", icon: "UtensilsCrossed", color: "#fb923c", sortOrder: 81 },
  { id: "fast_food", name: "Fast Food / Cafes", nameDA: "Fast food / Caféer", type: "expense", icon: "Coffee", color: "#fdba74", sortOrder: 82 },
  { id: "food_delivery", name: "Food Delivery", nameDA: "Madlevering", type: "expense", icon: "Bike", color: "#fed7aa", sortOrder: 83 },

  // === TRANSPORT ===
  { id: "rideshare", name: "Uber / Rideshare", nameDA: "Uber / Samkørsel", type: "expense", icon: "Car", color: "#0ea5e9", sortOrder: 90 },
  { id: "public_transit", name: "Public Transit", nameDA: "Offentlig transport", type: "expense", icon: "TrainFront", color: "#38bdf8", sortOrder: 91 },
  { id: "car", name: "Car (service, gas)", nameDA: "Bil (service, benzin)", type: "expense", icon: "Wrench", color: "#7dd3fc", sortOrder: 92 },
  { id: "parking", name: "Parking", nameDA: "Parkering", type: "expense", icon: "ParkingCircle", color: "#bae6fd", sortOrder: 93 },

  // === HEALTH & PERSONAL ===
  { id: "pharmacy", name: "Pharmacy / Personal Care", nameDA: "Apotek / Pleje", type: "expense", icon: "Pill", color: "#ec4899", sortOrder: 100 },
  { id: "hairdresser", name: "Hairdresser", nameDA: "Frisør", type: "expense", icon: "Scissors", color: "#f472b6", sortOrder: 101 },
  { id: "medical", name: "Medical / Dental", nameDA: "Læge / Tandlæge", type: "expense", icon: "Stethoscope", color: "#f9a8d4", sortOrder: 102 },
  { id: "vet", name: "Veterinary", nameDA: "Dyrlæge", type: "expense", icon: "Dog", color: "#fbcfe8", sortOrder: 103 },

  // === SHOPPING ===
  { id: "clothing", name: "Clothing / Shoes", nameDA: "Tøj / Sko", type: "expense", icon: "Shirt", color: "#d946ef", sortOrder: 110 },
  { id: "home_diy", name: "Home / DIY", nameDA: "Hjem / Gør-det-selv", type: "expense", icon: "Hammer", color: "#c084fc", sortOrder: 111 },
  { id: "home_furnishing", name: "Home Furnishing", nameDA: "Boligindretning", type: "expense", icon: "Sofa", color: "#e879f9", sortOrder: 112 },
  { id: "electronics", name: "Electronics", nameDA: "Elektronik", type: "expense", icon: "Monitor", color: "#a855f7", sortOrder: 113 },

  // === SUBSCRIPTIONS ===
  { id: "sub_tech", name: "Tech / AI Subscriptions", nameDA: "Tech / AI Abonnementer", type: "expense", icon: "Bot", color: "#14b8a6", sortOrder: 120 },
  { id: "sub_streaming", name: "Streaming", nameDA: "Streaming", type: "expense", icon: "Tv", color: "#2dd4bf", sortOrder: 121 },
  { id: "sub_mobile", name: "Mobile / Telecom", nameDA: "Mobil / Telecom", type: "expense", icon: "Smartphone", color: "#5eead4", sortOrder: 122 },
  { id: "sub_hosting", name: "Hosting / Domains", nameDA: "Hosting / Domæner", type: "expense", icon: "Server", color: "#99f6e4", sortOrder: 123 },

  // === LEISURE ===
  { id: "books", name: "Books / Media", nameDA: "Bøger / Medier", type: "expense", icon: "BookOpen", color: "#a16207", sortOrder: 130 },
  { id: "sports", name: "Sports / Equipment", nameDA: "Sport / Udstyr", type: "expense", icon: "Dumbbell", color: "#ca8a04", sortOrder: 131 },
  { id: "entertainment", name: "Entertainment", nameDA: "Underholdning", type: "expense", icon: "Ticket", color: "#eab308", sortOrder: 132 },

  // === TRAVEL ===
  { id: "travel", name: "Travel / Vacation", nameDA: "Rejser / Ferie", type: "expense", icon: "Plane", color: "#0d9488", sortOrder: 140 },

  // === DONATIONS ===
  { id: "donations", name: "Donations / Charity", nameDA: "Donationer / Velgørenhed", type: "expense", icon: "Heart", color: "#be123c", sortOrder: 150 },

  // === HOUSEHOLD SERVICES ===
  { id: "household_service", name: "Household Services", nameDA: "Husholdningsservice", type: "expense", icon: "SprayCan", color: "#737373", sortOrder: 160 },

  // === CASH ===
  { id: "cash_withdrawal", name: "Cash Withdrawal", nameDA: "Kontanthævning", type: "expense", icon: "Banknote", color: "#a8a29e", sortOrder: 165 },

  // === BANK ===
  { id: "bank_fees", name: "Bank Fees / Interest", nameDA: "Bankgebyrer / Renter", type: "expense", icon: "Landmark", color: "#d6d3d1", sortOrder: 166 },

  // === TRANSFERS ===
  { id: "savings_transfer", name: "Savings Transfer", nameDA: "Opsparingsoverførsel", type: "expense", icon: "ArrowRightLeft", color: "#475569", sortOrder: 170 },

  // === UNCATEGORIZED ===
  { id: "uncategorized", name: "Uncategorized", nameDA: "Ikke kategoriseret", type: "expense", icon: "HelpCircle", color: "#9ca3af", sortOrder: 999 },
];

export function getAllCategories(customCategories?: Category[]): Category[] {
  if (!customCategories || customCategories.length === 0) return defaultCategories;
  return [...defaultCategories, ...customCategories].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getCategoryById(id: string, allCats?: Category[]): Category | undefined {
  const cats = allCats || defaultCategories;
  return cats.find((c) => c.id === id);
}

export function getCategoriesByType(type: CategoryType, allCats?: Category[]): Category[] {
  const cats = allCats || defaultCategories;
  return cats.filter((c) => c.type === type).sort((a, b) => a.sortOrder - b.sortOrder);
}
