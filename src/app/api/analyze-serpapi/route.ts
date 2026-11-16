import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { getJson } from "serpapi";
import { GROQ_MODEL } from "@/lib/groq-model";
import { createClient } from "@/utils/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import type { GuestReport } from "@/lib/report-data";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MAX_INPUT_LENGTH = 300;
const GUEST_LIMIT_PER_HOUR = 6;
const MEMBER_LIMIT_PER_HOUR = 30;

interface ReviewSample {
  rating: number | null;
  reviewText: string;
}

function isAmazonUrl(input: string): boolean {
  return input.includes("amazon.com") || input.includes("amazon.co");
}

function extractProductNameFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname.split("/").filter(Boolean).slice(0, 6).join(" ");
    const cleaned = path.replace(/[-_]+/g, " ").replace(/\d+/g, " ").replace(/\s+/g, " ").trim();
    return cleaned.length >= 3 ? cleaned : u.hostname.replace(/^www\./, "");
  } catch {
    return url.trim();
  }
}

async function fetchReviewSamples(productName: string): Promise<ReviewSample[]> {
  try {
    const results = (await getJson({
      engine: "google_shopping_product_reviews",
      product_id: productName.toLowerCase().replace(/\s+/g, "-"),
      api_key: process.env.SERPAPI_KEY,
    })) as { reviews?: Array<Record<string, unknown>> };

    const reviews = (results.reviews ?? [])
      .filter((r) => r.review_text || r.title)
      .map((r) => ({
        rating: typeof r.rating === "number" ? r.rating : null,
        reviewText: String(r.review_text || r.snippet || ""),
      }));
    if (reviews.length > 0) return reviews.slice(0, 8);
  } catch (err) {
    console.log("[analyze] shopping reviews unavailable:", err);
  }

  try {
    const google = (await getJson({
      engine: "google",
      q: `${productName} reviews site:trustpilot.com OR site:reddit.com`,
      api_key: process.env.SERPAPI_KEY,
      num: 8,
    })) as { organic_results?: Array<Record<string, unknown>> };

    // These are search snippets, not star-rated reviews, so no rating is invented.
    return (google.organic_results ?? [])
      .slice(0, 8)
      .map((item) => ({ rating: null, reviewText: String(item.snippet || "") }))
      .filter((r) => r.reviewText);
  } catch (err) {
    console.log("[analyze] could not fetch review snippets:", err);
    return [];
  }
}

const PROMPT = `You are a market research analyst. Analyze this product's customer reviews and search results to find genuine pain points and market opportunities. Write like you are explaining findings to a business colleague.

Respond in EXACTLY this format:

## NEGATIVE POINTS
- Real complaints from customers, and why each one matters to them
- Be specific, quote reviews where you can

## MARKET GAPS
- What customers explicitly want that is missing
- Pain points competitors are not solving

## ENTRY STRATEGIES
- How to position a better product against these pain points
- Features customers are asking for

Rules: 5-7 bullets per section, every bullet starts with "- ", plain natural language, no corporate jargon. Only use what the data supports.`;

export async function POST(request: Request) {
  try {
    // Anyone can run an analysis. Signed-in users just get a higher limit.
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const limited = rateLimit(
      request,
      user ? "analyze-member" : "analyze-guest",
      user ? MEMBER_LIMIT_PER_HOUR : GUEST_LIMIT_PER_HOUR
    );
    if (!limited.ok) {
      return NextResponse.json(
        {
          error: user
            ? "You have run a lot of analyses recently. Try again in a little while."
            : "You have reached the free limit for now. Create an account or try again later.",
        },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
      );
    }

    const payload = await request.json().catch(() => ({}));
    const input = String(payload?.keyword ?? payload?.url ?? "").trim();

    if (!input) {
      return NextResponse.json({ error: "Enter a product name or link to analyze." }, { status: 400 });
    }
    if (input.length > MAX_INPUT_LENGTH) {
      return NextResponse.json({ error: "That input is too long. Use a product name or a single link." }, { status: 400 });
    }

    const isLink = input.startsWith("http") || input.includes("/");
    const productName = isLink ? extractProductNameFromUrl(input) : input;

    const search = (await getJson({
      engine: "google",
      q: `${productName} negative reviews complaints problems customers`,
      api_key: process.env.SERPAPI_KEY,
      num: 5,
    })) as { organic_results?: Array<Record<string, unknown>> };

    const organic = search.organic_results;
    if (!Array.isArray(organic) || organic.length === 0) {
      return NextResponse.json(
        { error: `No search data found for "${productName}". Try a more specific product name.` },
        { status: 502 }
      );
    }

    const snippets = organic
      .slice(0, 5)
      .map((item) => String(item.snippet || item.title || ""))
      .filter(Boolean)
      .join("\n");

    const reviews = await fetchReviewSamples(productName);

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: "user",
          content: `${PROMPT}\n\nPRODUCT: ${productName}\n\nCUSTOMER REVIEWS (context only, do not paraphrase line by line):\n${reviews
            .map((r) => `${r.rating ? `[${r.rating}★] ` : ""}"${r.reviewText}"`)
            .join("\n")}\n\nSEARCH RESULTS:\n${snippets}`,
        },
      ],
    });

    const analysis = completion.choices[0]?.message?.content || "";
    if (!analysis.trim()) {
      return NextResponse.json({ error: "The analysis came back empty. Please try again." }, { status: 502 });
    }

    const rated = reviews.filter((r) => r.rating !== null) as Array<{ rating: number }>;
    const report: GuestReport = {
      product_name: productName,
      market_data: {
        url: isAmazonUrl(input) ? input : "",
        analysis,
        reviews_count: reviews.length,
        average_rating: rated.length
          ? (rated.reduce((sum, r) => sum + r.rating, 0) / rated.length).toFixed(1)
          : null,
        gaps_found: (analysis.match(/^- /gm) || []).length,
      },
    };

    // Nothing is stored here. The visitor decides whether to save it.
    return NextResponse.json(report);
  } catch (err: unknown) {
    console.error("POST /api/analyze-serpapi error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
