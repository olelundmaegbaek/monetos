import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

interface UniquePattern {
  key: string;
  name: string;
  description: string;
  isIncome: boolean;
  sampleAmount: number;
  count: number;
}

interface CategoryOption {
  id: string;
  name: string;
  nameDA: string;
  type: "income" | "expense";
}

interface CategorizeRequest {
  patterns: UniquePattern[];
  categories: CategoryOption[];
  apiKey?: string;
}

const BATCH_SIZE = 60;

export async function POST(req: NextRequest) {
  try {
    const body: CategorizeRequest = await req.json();
    const { patterns, categories, apiKey } = body;

    const resolvedKey = apiKey || process.env.OPENAI_API_KEY;
    if (!resolvedKey) {
      return NextResponse.json(
        { mapping: {}, tokensUsed: 0, error: "No OpenAI API key configured. Add it in Settings or set OPENAI_API_KEY in .env.local" },
        { status: 401 }
      );
    }

    const openai = new OpenAI({ apiKey: resolvedKey });

    const batches: UniquePattern[][] = [];
    for (let i = 0; i < patterns.length; i += BATCH_SIZE) {
      batches.push(patterns.slice(i, i + BATCH_SIZE));
    }

    const fullMapping: Record<string, string> = {};
    let totalTokens = 0;

    const incomeCats = categories
      .filter((c) => c.type === "income")
      .map((c) => `  "${c.id}": ${c.nameDA} (${c.name})`)
      .join("\n");
    const expenseCats = categories
      .filter((c) => c.type === "expense")
      .map((c) => `  "${c.id}": ${c.nameDA} (${c.name})`)
      .join("\n");

    const systemPrompt = `You are a Danish household expense categorization engine. You categorize bank transactions from a Nordea CSV export for a Danish family.

INCOME CATEGORIES:
${incomeCats}

EXPENSE CATEGORIES:
${expenseCats}

RULES:
1. Match each transaction to exactly ONE category ID from the lists above.
2. Income transactions (positive amounts) MUST use an income category.
3. Expense transactions (negative amounts) MUST use an expense category.
4. Danish supermarkets (REMA1000, KVICKLY, FOETEX, NETTO, COOP365, LIDL, BILKA, MENY, LOEVBJERG, SPAR, DAGLIBRUGSEN, SUPERBRUGSEN) -> "groceries"
5. UBER without "EATS" -> "rideshare". UBER *EATS -> "food_delivery"
6. MobilePay from family members -> "family_transfer" or "other_income"
7. B-SKAT -> "tax"
8. CLAUDE.AI, ANTHROPIC, SONIOX, OPENROUTER, OPENAI -> "sub_tech"
9. HETZNER, HOSTINGER -> "sub_hosting"
10. If truly uncertain, use "uncategorized" for expenses or "other_income" for income.

Respond ONLY with a valid JSON object mapping each transaction's "key" to the chosen category ID. No other text.
Example: {"name1|||desc1": "groceries", "name2|||desc2": "rideshare"}`;

    for (const batch of batches) {
      const transactionLines = batch
        .map(
          (p, i) =>
            `${i + 1}. key="${p.key}" | name="${p.name}" | desc="${p.description}" | ${p.isIncome ? "INCOME" : "EXPENSE"} | amount=${p.sampleAmount} DKK | count=${p.count}`
        )
        .join("\n");

      const completion = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Categorize these ${batch.length} Danish bank transactions:\n\n${transactionLines}` },
        ],
        temperature: 0.1,
        max_tokens: 4000,
        response_format: { type: "json_object" },
      });

      totalTokens += completion.usage?.total_tokens || 0;

      const content = completion.choices[0]?.message?.content;
      if (content) {
        try {
          const batchMapping = JSON.parse(content) as Record<string, string>;
          Object.assign(fullMapping, batchMapping);
        } catch {
          console.error("Failed to parse OpenAI response:", content);
        }
      }
    }

    return NextResponse.json({ mapping: fullMapping, tokensUsed: totalTokens });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Categorize API error:", message);
    return NextResponse.json(
      { mapping: {}, tokensUsed: 0, error: message },
      { status: 500 }
    );
  }
}
