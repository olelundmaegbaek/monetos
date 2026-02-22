import { HouseholdConfig } from "@/types";

export const mereteOleConfig: HouseholdConfig = {
  id: "merete-ole",
  name: "merete+ole",
  displayName: "Merete & Ole",
  locale: "da",
  currency: "DKK",

  members: [
    {
      name: "Ole",
      role: "primary",
      employer: "Aarhus Universitet",
      selfEmployed: true,
      monthlyNetSalary: 18800,
      selfEmploymentMonthlyIncome: 40000,
      kommune: "Aarhus",
    },
    {
      name: "Merete",
      role: "secondary",
      employer: "Aarhus Universitet",
      selfEmployed: false,
      monthlyNetSalary: 28300,
      selfEmploymentMonthlyIncome: 0,
      kommune: "Aarhus",
    },
  ],

  children: [
    {
      name: "Elias",
      birthYear: 2013,
      schoolType: "private",
      monthlyEducationCost: 2650,
      monthlyAllowance: 100,
      hasBoerneopsparing: true,
      boerneopsparingAnnual: 6000,
      activities: [
        { name: "VSK Fodbold", monthlyCost: 225 },
      ],
    },
    {
      name: "Mads",
      birthYear: 2015,
      schoolType: "sfo",
      monthlyEducationCost: 1675,
      monthlyAllowance: 100,
      hasBoerneopsparing: false,
      boerneopsparingAnnual: 0,
      activities: [
        { name: "VRI Fodbold", monthlyCost: 300 },
      ],
    },
    {
      name: "David",
      birthYear: 2017,
      schoolType: "sfo",
      monthlyEducationCost: 1675,
      monthlyAllowance: 85,
      hasBoerneopsparing: false,
      boerneopsparingAnnual: 0,
      activities: [
        { name: "VRI Fodbold", monthlyCost: 300 },
      ],
    },
  ],

  budgetEntries: [
    // === INCOME ===
    { categoryId: "salary", monthlyAmount: 47100, frequency: "monthly", notes: "Ole AU 18.800 + Merete AU 28.300" },
    { categoryId: "self_employment", monthlyAmount: 40000, frequency: "monthly", notes: "Læge OLM" },
    { categoryId: "child_benefits", monthlyAmount: 3333, frequency: "quarterly", notes: "Børne- og Ungeydelse ~10.000/kvartal" },
    { categoryId: "travel_reimbursement", monthlyAmount: 1500, frequency: "irregular", notes: "REJSUD afregning" },

    // === HOUSING ===
    { categoryId: "mortgage", monthlyAmount: -33500, frequency: "monthly", notes: "Boliglån konto 9032 815 143" },
    { categoryId: "housing_association", monthlyAmount: -20000, frequency: "monthly", notes: "OVF + Skødshoved" },
    { categoryId: "home_improvement", monthlyAmount: -1500, frequency: "irregular", notes: "justwood, Gulv og Flise, ventilation" },

    // === TAX ===
    { categoryId: "tax", monthlyAmount: -20000, frequency: "monthly", notes: "B-skat (varierer 16.700-24.237)" },

    // === UTILITIES ===
    { categoryId: "electricity", monthlyAmount: -1500, frequency: "quarterly", notes: "Vindstød A/S" },
    { categoryId: "water", monthlyAmount: -1400, frequency: "quarterly", notes: "Aarhus Vand" },
    { categoryId: "waste", monthlyAmount: -950, frequency: "quarterly", notes: "Kredsløb + dagrenovation" },

    // === INSURANCE ===
    { categoryId: "insurance", monthlyAmount: -2200, frequency: "monthly", notes: "Topdanmark ~2.055+118+212" },
    { categoryId: "health_insurance", monthlyAmount: -435, frequency: "monthly", notes: "Sygeforsikringen Danmark" },

    // === CHILDREN ===
    { categoryId: "school", monthlyAmount: -2650, frequency: "monthly", notes: "N. Kochs Skole (Elias)" },
    { categoryId: "sfo", monthlyAmount: -3350, frequency: "monthly", notes: "Aarhus Kommune SFO (Mads + David)" },
    { categoryId: "children_activities", monthlyAmount: -1500, frequency: "monthly", notes: "VRI, VSK, padel, basketball" },
    { categoryId: "children_allowance", monthlyAmount: -285, frequency: "monthly", notes: "Mads 100 + Elias 100 + David 85" },
    { categoryId: "children_savings", monthlyAmount: -500, frequency: "yearly", notes: "Børneopsparing 6.000/år" },

    // === PENSION ===
    { categoryId: "pension", monthlyAmount: -12500, frequency: "irregular", notes: "Ratepension (varierer 5.000-30.000)" },

    // === PROFESSIONAL ===
    { categoryId: "union_dues", monthlyAmount: -5662, frequency: "monthly", notes: "Lægeforeningen" },

    // === FOOD ===
    { categoryId: "groceries", monthlyAmount: -8000, frequency: "monthly" },
    { categoryId: "dining", monthlyAmount: -2000, frequency: "monthly" },
    { categoryId: "fast_food", monthlyAmount: -800, frequency: "monthly" },
    { categoryId: "food_delivery", monthlyAmount: -1000, frequency: "monthly", notes: "Mealo m.fl." },

    // === TRANSPORT ===
    { categoryId: "rideshare", monthlyAmount: -800, frequency: "monthly", notes: "Uber" },
    { categoryId: "public_transit", monthlyAmount: -500, frequency: "monthly", notes: "DSB, Rejsekort, Molslinjen" },
    { categoryId: "car", monthlyAmount: -900, frequency: "irregular", notes: "Hinnerup Auto, benzin, vask" },
    { categoryId: "parking", monthlyAmount: -300, frequency: "monthly", notes: "EasyPark, CPO, ParkZone" },

    // === HEALTH ===
    { categoryId: "pharmacy", monthlyAmount: -400, frequency: "monthly", notes: "Matas, Normal, Apotek" },
    { categoryId: "hairdresser", monthlyAmount: -250, frequency: "monthly", notes: "Frisør Ino" },
    { categoryId: "medical", monthlyAmount: -100, frequency: "irregular", notes: "Tandlæge, Regionshospitalet" },
    { categoryId: "vet", monthlyAmount: -400, frequency: "irregular", notes: "Skæring Dyreklinik" },

    // === SHOPPING ===
    { categoryId: "clothing", monthlyAmount: -2000, frequency: "monthly" },
    { categoryId: "home_diy", monthlyAmount: -1000, frequency: "monthly", notes: "Silvan, Jem&Fix, Harald Nyborg, Thansen" },
    { categoryId: "home_furnishing", monthlyAmount: -500, frequency: "irregular", notes: "JYSK, IKEA" },
    { categoryId: "electronics", monthlyAmount: -500, frequency: "irregular", notes: "Proshop" },

    // === SUBSCRIPTIONS ===
    { categoryId: "sub_tech", monthlyAmount: -700, frequency: "monthly", notes: "Claude.AI, Anthropic, Soniox, OpenRouter, OpenAI" },
    { categoryId: "sub_streaming", monthlyAmount: -200, frequency: "monthly", notes: "Google TV, Microsoft Store" },
    { categoryId: "sub_mobile", monthlyAmount: -180, frequency: "monthly", notes: "Flexii" },
    { categoryId: "sub_hosting", monthlyAmount: -170, frequency: "monthly", notes: "Hetzner, Hostinger" },

    // === LEISURE ===
    { categoryId: "books", monthlyAmount: -200, frequency: "monthly" },
    { categoryId: "entertainment", monthlyAmount: -400, frequency: "monthly", notes: "AGF, biograf, legetøj" },

    // === OTHER ===
    { categoryId: "travel", monthlyAmount: -2000, frequency: "irregular" },
    { categoryId: "donations", monthlyAmount: -200, frequency: "monthly" },
    { categoryId: "household_service", monthlyAmount: -350, frequency: "monthly", notes: "Serwiz rengøring" },
  ],

  categorizationRules: [
    // === INCOME (positive amounts) ===
    { pattern: "Aarhus Universitet", field: "description", categoryId: "salary", priority: 100 },
    { pattern: "Læge OLM", field: "description", categoryId: "self_employment", priority: 100 },
    { pattern: "Fra LÆGE OLM", field: "description", categoryId: "self_employment", priority: 100 },
    { pattern: "Børne- og Ungeydelse", field: "description", categoryId: "child_benefits", priority: 100 },
    { pattern: "REJSUD", field: "description", categoryId: "travel_reimbursement", priority: 90 },
    { pattern: "Lønoverførsel", field: "description", categoryId: "salary", priority: 80 },
    { pattern: "MobilePay.*Kirsten", field: "description", categoryId: "family_transfer", priority: 80 },
    { pattern: "MobilePay.*Morten", field: "description", categoryId: "family_transfer", priority: 80 },
    { pattern: "MobilePay.*Peter", field: "description", categoryId: "family_transfer", priority: 80 },

    // === TAX ===
    { pattern: "B-SKAT", field: "description", categoryId: "tax", priority: 100 },
    { pattern: "skat", field: "name", categoryId: "tax", priority: 50 },
    { pattern: "Skattestyrelse", field: "description", categoryId: "tax", priority: 90 },
    { pattern: "SKATTESTYRELSEN MOTO", field: "description", categoryId: "car", priority: 95 },

    // === HOUSING ===
    { pattern: "KONTO NR. 9032 815 143", field: "description", categoryId: "mortgage", priority: 100 },
    { pattern: "OVF. 9025953506", field: "description", categoryId: "housing_association", priority: 100 },
    { pattern: "ANDELSSEL. SKØDSHOVE", field: "description", categoryId: "housing_association", priority: 100 },
    { pattern: "justwood", field: "description", categoryId: "home_improvement", priority: 80 },
    { pattern: "GULV OG FLISEEKSPERT", field: "description", categoryId: "home_improvement", priority: 80 },
    { pattern: "ventilation", field: "description", categoryId: "home_improvement", priority: 80 },

    // === UTILITIES ===
    { pattern: "VINDSTØD", field: "description", categoryId: "electricity", priority: 100 },
    { pattern: "AARHUS VAND", field: "description", categoryId: "water", priority: 100 },
    { pattern: "KREDSLøB", field: "description", categoryId: "waste", priority: 100 },
    { pattern: "KREDSLØB", field: "description", categoryId: "waste", priority: 100 },
    { pattern: "DAGRENOVATION", field: "description", categoryId: "waste", priority: 100 },

    // === INSURANCE ===
    { pattern: "TOPDANMARK", field: "description", categoryId: "insurance", priority: 90 },
    { pattern: "SYGEFORSIKRINGEN", field: "description", categoryId: "health_insurance", priority: 90 },

    // === CHILDREN ===
    { pattern: "N. KOCHS SKOLE", field: "description", categoryId: "school", priority: 100 },
    { pattern: "AARHUS KOMMUNE,DAGIN", field: "description", categoryId: "sfo", priority: 100 },
    { pattern: "VRI.DK", field: "description", categoryId: "children_activities", priority: 80 },
    { pattern: "vskaarhus", field: "description", categoryId: "children_activities", priority: 80 },
    { pattern: "matchpadel", field: "description", categoryId: "children_activities", priority: 80 },
    { pattern: "Match Padel", field: "description", categoryId: "children_activities", priority: 80 },
    { pattern: "MATCHi", field: "description", categoryId: "children_activities", priority: 80 },
    { pattern: "Nordic Basketb", field: "description", categoryId: "children_activities", priority: 80 },
    { pattern: "IK SKOVBAKKEN", field: "description", categoryId: "children_activities", priority: 80 },
    { pattern: "HOG Fodbold", field: "description", categoryId: "children_activities", priority: 80 },
    { pattern: "VRI fodbold", field: "description", categoryId: "children_activities", priority: 80 },
    { pattern: "Fodboldklubben GFG", field: "description", categoryId: "children_activities", priority: 80 },
    { pattern: "Juniorkonto", field: "description", categoryId: "children_allowance", priority: 90 },
    { pattern: "Mads lommepenge", field: "description", categoryId: "children_allowance", priority: 90 },
    { pattern: "^Mads$", field: "name", categoryId: "children_allowance", priority: 95 },
    { pattern: "^David$", field: "name", categoryId: "children_allowance", priority: 95 },
    { pattern: "^Elias$", field: "name", categoryId: "children_allowance", priority: 95 },
    { pattern: "Risskov Skak", field: "description", categoryId: "children_activities", priority: 80 },
    { pattern: "Børneopsparing", field: "description", categoryId: "children_savings", priority: 90 },

    // === PENSION ===
    { pattern: "Ratepension", field: "description", categoryId: "pension", priority: 100 },

    // === PROFESSIONAL ===
    { pattern: "LÆGEFORENINGEN", field: "description", categoryId: "union_dues", priority: 100 },

    // === GROCERIES ===
    { pattern: "KVICKLY", field: "description", categoryId: "groceries", priority: 70 },
    { pattern: "REMA1000", field: "description", categoryId: "groceries", priority: 70 },
    { pattern: "NETTO", field: "description", categoryId: "groceries", priority: 70 },
    { pattern: "COOP365", field: "description", categoryId: "groceries", priority: 70 },
    { pattern: "MENY", field: "description", categoryId: "groceries", priority: 70 },
    { pattern: "LIDL", field: "description", categoryId: "groceries", priority: 70 },
    { pattern: "BilkaToGo", field: "description", categoryId: "groceries", priority: 70 },
    { pattern: "BILKA", field: "description", categoryId: "groceries", priority: 65 },
    { pattern: "FOETEX", field: "description", categoryId: "groceries", priority: 70 },
    { pattern: "SPAR ", field: "description", categoryId: "groceries", priority: 70 },
    { pattern: "LOEVBJERG", field: "description", categoryId: "groceries", priority: 70 },
    { pattern: "DAGLIBRUGSEN", field: "description", categoryId: "groceries", priority: 70 },
    { pattern: "SUPERBRUGSEN", field: "description", categoryId: "groceries", priority: 70 },
    { pattern: "COOP KVICKLY", field: "description", categoryId: "groceries", priority: 70 },
    { pattern: "CLAUSENS FISKEHANDEL", field: "description", categoryId: "groceries", priority: 70 },
    { pattern: "BORGS FISKEHANDEL", field: "description", categoryId: "groceries", priority: 70 },
    { pattern: "HAVNENS FISKEHUS", field: "description", categoryId: "groceries", priority: 70 },
    { pattern: "GARTNERGARDEN", field: "description", categoryId: "groceries", priority: 70 },

    // === FOOD DELIVERY ===
    { pattern: "Mealo", field: "description", categoryId: "food_delivery", priority: 80 },
    { pattern: "UBER *EATS", field: "description", categoryId: "food_delivery", priority: 85 },

    // === DINING ===
    { pattern: "RESTAURANT", field: "description", categoryId: "dining", priority: 60 },
    { pattern: "THALI", field: "description", categoryId: "dining", priority: 70 },
    { pattern: "BOUILLON", field: "description", categoryId: "dining", priority: 70 },
    { pattern: "ZIGGY CAFE", field: "description", categoryId: "dining", priority: 70 },
    { pattern: "KOREAN BBQ", field: "description", categoryId: "dining", priority: 70 },
    { pattern: "SHAWARMA BAR", field: "description", categoryId: "dining", priority: 70 },
    { pattern: "CERVEJARIA", field: "description", categoryId: "dining", priority: 70 },
    { pattern: "CAFE JORDEN", field: "description", categoryId: "dining", priority: 70 },
    { pattern: "DET GYLDNE BROED", field: "description", categoryId: "fast_food", priority: 70 },

    // === FAST FOOD / CAFES ===
    { pattern: "McDonalds", field: "description", categoryId: "fast_food", priority: 80 },
    { pattern: "MCD", field: "description", categoryId: "fast_food", priority: 75 },
    { pattern: "SUNSET BLVD", field: "description", categoryId: "fast_food", priority: 80 },
    { pattern: "JOE THE JUICE", field: "description", categoryId: "fast_food", priority: 80 },
    { pattern: "LAGKAGEHUSET", field: "description", categoryId: "fast_food", priority: 70 },
    { pattern: "Starbuck", field: "description", categoryId: "fast_food", priority: 80 },
    { pattern: "7-ELEVEN", field: "description", categoryId: "fast_food", priority: 60 },

    // === TRANSPORT ===
    { pattern: "UBER", field: "description", categoryId: "rideshare", priority: 70 },
    { pattern: "GREENMOBILITY", field: "description", categoryId: "rideshare", priority: 80 },
    { pattern: "DSB", field: "description", categoryId: "public_transit", priority: 70 },
    { pattern: "Rejsekort", field: "description", categoryId: "public_transit", priority: 80 },
    { pattern: "Molslinjen", field: "description", categoryId: "public_transit", priority: 80 },
    { pattern: "Hinnerup Auto", field: "description", categoryId: "car", priority: 90 },
    { pattern: "WASH WORLD", field: "description", categoryId: "car", priority: 80 },
    { pattern: "IMO BILVASK", field: "description", categoryId: "car", priority: 80 },
    { pattern: "CIRCLE K", field: "description", categoryId: "car", priority: 70 },
    { pattern: "KOSAN GAS", field: "description", categoryId: "car", priority: 70 },
    { pattern: "EASY PARK", field: "description", categoryId: "parking", priority: 90 },
    { pattern: "ParkZone", field: "description", categoryId: "parking", priority: 90 },
    { pattern: "CPOSONLINE", field: "description", categoryId: "parking", priority: 90 },
    { pattern: "cposonlin", field: "description", categoryId: "parking", priority: 90 },
    { pattern: "PARKVIA", field: "description", categoryId: "parking", priority: 90 },
    { pattern: "Monta ", field: "description", categoryId: "car", priority: 70 },

    // === HEALTH ===
    { pattern: "MATAS", field: "description", categoryId: "pharmacy", priority: 80 },
    { pattern: "NORMAL", field: "description", categoryId: "pharmacy", priority: 60 },
    { pattern: "Apotek", field: "description", categoryId: "pharmacy", priority: 85 },
    { pattern: "TANDLAEGERNE", field: "description", categoryId: "medical", priority: 90 },
    { pattern: "REGIONSHOSPITALET", field: "description", categoryId: "medical", priority: 90 },
    { pattern: "Frisoer Ino", field: "description", categoryId: "hairdresser", priority: 90 },
    { pattern: "Frisør Ino", field: "description", categoryId: "hairdresser", priority: 90 },
    { pattern: "SKAERING DYREKLINIK", field: "description", categoryId: "vet", priority: 90 },

    // === SUBSCRIPTIONS ===
    { pattern: "CLAUDE.AI", field: "description", categoryId: "sub_tech", priority: 90 },
    { pattern: "ANTHROPIC", field: "description", categoryId: "sub_tech", priority: 90 },
    { pattern: "SONIOX", field: "description", categoryId: "sub_tech", priority: 90 },
    { pattern: "OPENROUTER", field: "description", categoryId: "sub_tech", priority: 90 },
    { pattern: "OPENAI", field: "description", categoryId: "sub_tech", priority: 90 },
    { pattern: "GOOGLE.*TV", field: "description", categoryId: "sub_streaming", priority: 80 },
    { pattern: "Google Play", field: "description", categoryId: "sub_streaming", priority: 80 },
    { pattern: "Microsoft.*Store", field: "description", categoryId: "sub_streaming", priority: 80 },
    { pattern: "FLEXII", field: "description", categoryId: "sub_mobile", priority: 90 },
    { pattern: "flexii", field: "description", categoryId: "sub_mobile", priority: 90 },
    { pattern: "HETZNER", field: "description", categoryId: "sub_hosting", priority: 90 },
    { pattern: "HOSTINGER", field: "description", categoryId: "sub_hosting", priority: 90 },
    { pattern: "hostinger", field: "description", categoryId: "sub_hosting", priority: 90 },
    { pattern: "LinkedIn", field: "description", categoryId: "sub_tech", priority: 80 },

    // === CLOTHING ===
    { pattern: "HM ", field: "description", categoryId: "clothing", priority: 65 },
    { pattern: "H&M", field: "description", categoryId: "clothing", priority: 65 },
    { pattern: "Jack Jones", field: "description", categoryId: "clothing", priority: 80 },
    { pattern: "Weekday", field: "description", categoryId: "clothing", priority: 80 },
    { pattern: "Zalando", field: "description", categoryId: "clothing", priority: 80 },
    { pattern: "SPORT 24", field: "description", categoryId: "clothing", priority: 70 },
    { pattern: "SPORT24", field: "description", categoryId: "clothing", priority: 70 },
    { pattern: "Arket", field: "description", categoryId: "clothing", priority: 80 },
    { pattern: "GINA TRICOT", field: "description", categoryId: "clothing", priority: 80 },
    { pattern: "DEICHMANN", field: "description", categoryId: "clothing", priority: 80 },
    { pattern: "Magasin", field: "description", categoryId: "clothing", priority: 70 },
    { pattern: "KINGS & QUEENS", field: "description", categoryId: "clothing", priority: 80 },
    { pattern: "Unisport", field: "description", categoryId: "clothing", priority: 70 },

    // === HOME/DIY ===
    { pattern: "SILVAN", field: "description", categoryId: "home_diy", priority: 80 },
    { pattern: "JEM & FIX", field: "description", categoryId: "home_diy", priority: 80 },
    { pattern: "HARALD NYBORG", field: "description", categoryId: "home_diy", priority: 80 },
    { pattern: "BAUHAUS", field: "description", categoryId: "home_diy", priority: 80 },
    { pattern: "THANSEN", field: "description", categoryId: "home_diy", priority: 80 },
    { pattern: "JYSK", field: "description", categoryId: "home_furnishing", priority: 80 },
    { pattern: "IKEA", field: "description", categoryId: "home_furnishing", priority: 80 },

    // === ELECTRONICS ===
    { pattern: "proshop", field: "description", categoryId: "electronics", priority: 80 },
    { pattern: "PROSHOP", field: "description", categoryId: "electronics", priority: 80 },

    // === BOOKS ===
    { pattern: "BOG & IDE", field: "description", categoryId: "books", priority: 80 },
    { pattern: "BOG-IDE", field: "description", categoryId: "books", priority: 80 },
    { pattern: "bog-ide", field: "description", categoryId: "books", priority: 80 },
    { pattern: "Din Boghandel", field: "description", categoryId: "books", priority: 80 },

    // === ENTERTAINMENT ===
    { pattern: "AGF", field: "description", categoryId: "entertainment", priority: 60 },
    { pattern: "CinemaxX", field: "description", categoryId: "entertainment", priority: 80 },
    { pattern: "KIDS COOLSHOP", field: "description", categoryId: "entertainment", priority: 70 },
    { pattern: "legeakademiet", field: "description", categoryId: "entertainment", priority: 70 },
    { pattern: "STEAMGAMES", field: "description", categoryId: "entertainment", priority: 80 },
    { pattern: "FORTNITE", field: "description", categoryId: "entertainment", priority: 80 },

    // === DONATIONS ===
    { pattern: "KIRKENS KORSHAER", field: "description", categoryId: "donations", priority: 80 },
    { pattern: "Hus forbi", field: "description", categoryId: "donations", priority: 80 },
    { pattern: "Beder Kirke", field: "description", categoryId: "donations", priority: 80 },

    // === HOUSEHOLD SERVICES ===
    { pattern: "Serwiz", field: "description", categoryId: "household_service", priority: 90 },

    // === TRAVEL ===
    { pattern: "Feriehus", field: "description", categoryId: "travel", priority: 70 },
    { pattern: "AGGER", field: "description", categoryId: "travel", priority: 50 },

    // === SPORTS ===
    { pattern: "Eventyrsport", field: "description", categoryId: "sports", priority: 80 },
    { pattern: "Jacobs Cykler", field: "description", categoryId: "sports", priority: 80 },
    { pattern: "cykelpartner", field: "description", categoryId: "sports", priority: 80 },
    { pattern: "Sportstiming", field: "description", categoryId: "sports", priority: 80 },
    { pattern: "CYKELGEAR", field: "description", categoryId: "sports", priority: 80 },
    { pattern: "INTERSPORT", field: "description", categoryId: "sports", priority: 70 },
    { pattern: "Sportmaster", field: "description", categoryId: "sports", priority: 70 },

    // === ENTERTAINMENT (additional) ===
    { pattern: "SCIENCE MUSEERNE", field: "description", categoryId: "entertainment", priority: 70 },

    // === TRAVEL (additional) ===
    { pattern: "BOUNCE", field: "description", categoryId: "travel", priority: 60 },
    { pattern: "SJ Feriehus", field: "description", categoryId: "travel", priority: 80 },

    // === CASH ===
    { pattern: "Pengeautomat", field: "description", categoryId: "cash_withdrawal", priority: 90 },

    // === BANK FEES ===
    { pattern: "overtræksrente", field: "description", categoryId: "bank_fees", priority: 90 },
    { pattern: "Ubevilget", field: "description", categoryId: "bank_fees", priority: 90 },
  ],
};
