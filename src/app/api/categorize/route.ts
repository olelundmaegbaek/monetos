import { NextRequest, NextResponse } from "next/server";

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

    console.log(`[categorize] Starting: ${patterns.length} patterns, ${categories.length} categories`);

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

    const patternsForPrompt = patterns.map((p, i) => ({
      i: i + 1,
      key: p.key,
      name: p.name,
      desc: p.description,
      type: p.isIncome ? "INCOME" : "EXPENSE",
      amount: p.sampleAmount,
      count: p.count,
    }));

    const userContent = `Categorize these ${patterns.length} Danish bank transactions. Each object has a "key" field — return a JSON object mapping each key to a category ID.\n\n${JSON.stringify(patternsForPrompt)}`;
    console.log(`[categorize] Sending ${patterns.length} patterns via direct fetch (${userContent.length} chars)...`);
    const startTime = Date.now();

    // Use fetch directly instead of OpenAI SDK to avoid potential SDK hanging issues
    const requestBody = JSON.stringify({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
      reasoning: { effort: "none" },
    });
    console.log(`[categorize] Request body size: ${requestBody.length} bytes`);

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resolvedKey}`,
      },
      body: requestBody,
    });

    const elapsed = Date.now() - startTime;
    console.log(`[categorize] OpenAI HTTP status: ${openaiResponse.status} in ${elapsed}ms`);

    const responseText = await openaiResponse.text();
    console.log(`[categorize] Response body length: ${responseText.length} chars`);

    if (!openaiResponse.ok) {
      console.error(`[categorize] OpenAI error: ${responseText.substring(0, 500)}`);
      return NextResponse.json(
        { mapping: {}, tokensUsed: 0, error: `OpenAI error (${openaiResponse.status}): ${responseText.substring(0, 200)}` },
        { status: 502 }
      );
    }

    const completion = JSON.parse(responseText);
    const totalTokens = completion.usage?.total_tokens || 0;
    console.log(`[categorize] Parsed OK, ${totalTokens} tokens`);

    const content = completion.choices?.[0]?.message?.content;
    if (!content) {
      console.warn("[categorize] Empty response from OpenAI");
      return NextResponse.json({ mapping: {}, tokensUsed: totalTokens });
    }

    let mapping: Record<string, string>;
    try {
      mapping = JSON.parse(content) as Record<string, string>;
      console.log(`[categorize] Complete: ${Object.keys(mapping).length} mappings, ${totalTokens} tokens, ${elapsed}ms`);
    } catch {
      console.error("[categorize] Failed to parse JSON response:", content.substring(0, 500));
      return NextResponse.json(
        { mapping: {}, tokensUsed: totalTokens, error: "Failed to parse AI response as JSON" },
        { status: 502 }
      );
    }

    return NextResponse.json({ mapping, tokensUsed: totalTokens });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[categorize] API error:", message);
    return NextResponse.json(
      { mapping: {}, tokensUsed: 0, error: message },
      { status: 500 }
    );
  }
}
