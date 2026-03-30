import { CategoryGroup } from "@/types";

export const categoryGroups: CategoryGroup[] = [
  {
    id: "group_income",
    name: "Income",
    nameDA: "Indkomst",
    icon: "Briefcase",
    color: "#22c55e",
    categoryIds: [
      "salary",
      "self_employment",
      "child_benefits",
      "travel_reimbursement",
      "other_income",
      "refund",
      "family_transfer",
    ],
    sortOrder: 1,
  },
  {
    id: "group_housing",
    name: "Housing",
    nameDA: "Bolig",
    icon: "Home",
    color: "#ef4444",
    categoryIds: ["mortgage", "housing_association", "rent", "home_improvement"],
    sortOrder: 10,
  },
  {
    id: "group_utilities",
    name: "Utilities",
    nameDA: "Forsyning",
    icon: "Zap",
    color: "#f59e0b",
    categoryIds: ["electricity", "water", "waste", "heating"],
    sortOrder: 20,
  },
  {
    id: "group_insurance_pension",
    name: "Insurance & Pension",
    nameDA: "Forsikring & Pension",
    icon: "Shield",
    color: "#8b5cf6",
    categoryIds: ["insurance", "health_insurance", "pension"],
    sortOrder: 30,
  },
  {
    id: "group_children",
    name: "Children",
    nameDA: "Børn",
    icon: "Baby",
    color: "#06b6d4",
    categoryIds: [
      "school",
      "sfo",
      "children_activities",
      "children_allowance",
      "children_savings",
    ],
    sortOrder: 40,
  },
  {
    id: "group_food",
    name: "Food & Drink",
    nameDA: "Mad & Drikke",
    icon: "ShoppingCart",
    color: "#f97316",
    categoryIds: ["groceries", "dining", "fast_food", "food_delivery"],
    sortOrder: 50,
  },
  {
    id: "group_transport",
    name: "Transport",
    nameDA: "Transport",
    icon: "Car",
    color: "#0ea5e9",
    categoryIds: ["rideshare", "public_transit", "car", "parking"],
    sortOrder: 60,
  },
  {
    id: "group_health",
    name: "Health & Personal",
    nameDA: "Sundhed & Pleje",
    icon: "HeartPulse",
    color: "#ec4899",
    categoryIds: ["pharmacy", "hairdresser", "medical", "vet"],
    sortOrder: 70,
  },
  {
    id: "group_shopping",
    name: "Shopping",
    nameDA: "Shopping",
    icon: "Shirt",
    color: "#d946ef",
    categoryIds: ["clothing", "home_diy", "home_furnishing", "electronics"],
    sortOrder: 80,
  },
  {
    id: "group_subscriptions",
    name: "Subscriptions",
    nameDA: "Abonnementer",
    icon: "Tv",
    color: "#14b8a6",
    categoryIds: ["sub_tech", "sub_streaming", "sub_mobile", "sub_hosting"],
    sortOrder: 90,
  },
  {
    id: "group_leisure",
    name: "Leisure & Travel",
    nameDA: "Fritid & Rejser",
    icon: "Plane",
    color: "#eab308",
    categoryIds: ["books", "sports", "entertainment", "travel"],
    sortOrder: 100,
  },
  {
    id: "group_other",
    name: "Other",
    nameDA: "Andet",
    icon: "HelpCircle",
    color: "#9ca3af",
    categoryIds: [
      "tax",
      "union_dues",
      "donations",
      "household_service",
      "cash_withdrawal",
      "bank_fees",
      "savings_transfer",
      "uncategorized",
    ],
    sortOrder: 110,
  },
];

/** Look up which group a category belongs to. Custom/unknown categories fall into "Andet". */
export function getGroupForCategory(categoryId: string): CategoryGroup {
  return (
    categoryGroups.find((g) => g.categoryIds.includes(categoryId)) ||
    categoryGroups.find((g) => g.id === "group_other")!
  );
}

/** All expense groups (everything except income). */
export function getExpenseGroups(): CategoryGroup[] {
  return categoryGroups
    .filter((g) => g.id !== "group_income")
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** The income group. */
export function getIncomeGroup(): CategoryGroup {
  return categoryGroups.find((g) => g.id === "group_income")!;
}
