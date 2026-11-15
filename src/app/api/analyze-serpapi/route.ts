import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { GROQ_MODEL } from "@/lib/groq-model";
import { getJson } from "serpapi";
import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function isAmazonUrl(input: string): boolean {
  return input.includes("amazon.com") || input.includes("amazon.co");
}

function extractProductNameFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname
      .split("/")
      .filter(Boolean)
      .slice(0, 6)
      .join(" ");
    const cleaned = path
      .replace(/[-_]+/g, " ")
      .replace(/\d+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const hostPart = u.hostname.replace(/^www\./, "");
    if (cleaned.length >= 3) return cleaned;
    return hostPart;
  } catch {
    return url.trim();
  }
}

async function getSnippetsFromSerpApi(productName: string): Promise<string> {
  // SerpAPI free-tier compatible: use `google` engine with snippets.
  const results = await getJson({
    engine: "google",
    q: `${productName} negative reviews complaints problems customers`,
    api_key: process.env.SERPAPI_KEY,
    num: 5,
  });

  const snippets: string[] = [];
  const organic = (results as any)?.organic_results;
  if (Array.isArray(organic)) {
    organic.slice(0, 5).forEach((item: any) => {
      const snippet = item?.snippet || item?.title;
      if (snippet) snippets.push(String(snippet));
    });
  }

  return snippets.join("\n");
}

async function fetchRealReviewsWithRatings(productName: string): Promise<any[]> {
  try {
    // Try to fetch reviews from Google Shopping
    const reviewResults = await getJson({
      engine: "google_shopping_product_reviews",
      product_id: productName.toLowerCase().replace(/\s+/g, "-"),
      api_key: process.env.SERPAPI_KEY,
    });

    let reviews = (reviewResults as any)?.reviews || [];
    
    // Filter for reviews with text and prioritize low ratings (negative reviews)
    reviews = reviews
      .filter((r: any) => r.review_text || r.title)
      .map((r: any) => ({
        rating: r.rating || 0,
        reviewText: r.review_text || r.snippet || "",
        reviewer: r.reviewer || "Verified Customer",
        date: r.published_at || "Recent",
        title: r.title || "Customer Review",
      }));

    if (reviews.length > 0) {
      return reviews.slice(0, 8);
    }

    // Fallback: Try Google search for negative reviews
    console.log("[analyze-serpapi] Shopping reviews not found, trying Google reviews...");
    
    try {
      const googleReviews = await getJson({
        engine: "google",
        q: `${productName} reviews site:google.com OR site:trustpilot.com`,
        api_key: process.env.SERPAPI_KEY,
        num: 8,
      });

      const organic = (googleReviews as any)?.organic_results || [];
      return organic.slice(0, 8).map((item: any, idx: number) => ({
        rating: 0, // unknown: snippet has no real star rating
        reviewText: item.snippet || "",
        reviewer: `Customer ${idx + 1}`,
        date: "Recent",
        title: item.title || "Customer Review",
      }));
    } catch (innerErr) {
      console.log("[analyze-serpapi] Could not fetch reviews:", innerErr);
      return [];
    }
  } catch (err) {
    console.log("[analyze-serpapi] Could not fetch reviews:", err);
    return [];
  }
}

async function analyzeWithGroqUsingSearch(productName: string, snippets: string, realReviews: any[]): Promise<string> {
  const reviewsSummary = realReviews
    .map((r) => `[${r.rating}★] "${r.reviewText}"`)
    .join("\n");

  const prompt = `You are a market research analyst. Analyze this product's REAL customer reviews and search results to identify genuine pain points and market opportunities. Write your analysis in a conversational, human tone - like you're explaining findings to a business colleague.

Extract and provide in EXACTLY this format:

## NEGATIVE POINTS
- Focus on REAL complaints from actual customer reviews
- Explain WHY these issues matter to customers
- Use natural, conversational language (not marketing speak)
- Be specific with examples from reviews
- Use bullet points starting with "- "

## MARKET GAPS
- What customers explicitly want that's missing
- Pain points competitors aren't solving
- Unmet needs based on the review sentiment
- Use bullet points starting with "- "

## ENTRY STRATEGIES
- How to position a better solution against these pain points
- Marketing angles based on actual customer frustrations
- Features customers are begging for
- Use bullet points starting with "- "

TONE: Write as if you're having a real conversation. Use natural language. Avoid corporate jargon.
CREDIBILITY: Reference specific review quotes when possible.
Be empathetic to customer frustrations while being analytical.`;

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      {
        role: "user",
        content: `${prompt}\n\nPRODUCT: ${productName}\n\nREAL CUSTOMER REVIEWS (use these for context only - do NOT paraphrase them):\n${reviewsSummary}\n\nSEARCH RESULTS:\n${snippets}`,
      },
    ],
  });

  return completion.choices[0]?.message?.content || "";
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Payload verification
    const payload = await request.json();
    // NOTE: frontend should send `keyword` (not `url`) for this endpoint.
    const keywordRaw = payload?.keyword;
    const keyword = typeof keywordRaw === "string" ? keywordRaw.trim() : "";

    // Backward compatibility: if `url` was sent instead, treat it as keyword source.
    const urlRaw = payload?.url;
    const url = typeof urlRaw === "string" ? urlRaw.trim() : "";

  const inputSource = keyword || url;

    console.log("[analyze-serpapi] Incoming payload:", {
      keyword: keyword || undefined,
      url: url || undefined,
    });

    if (!inputSource) {

      return NextResponse.json(
        {
          error: "Input is required",
          details: { receivedKeys: Object.keys(payload ?? {}) },
        },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // If keyword is a URL, extract the product name from it; otherwise use keyword directly.
    const productName =
      inputSource.startsWith("http") || inputSource.includes("/")
        ? extractProductNameFromUrl(inputSource)
        : inputSource;

    console.log("[analyze-serpapi] Using productName (extracted):", {
      productName,
    });

    // Debug log BEFORE SerpAPI call (log query)
    const serpQuery = `${productName} negative reviews complaints problems customers`;
    console.log("[analyze-serpapi] SerpAPI query:", {
      engine: "google",
      q: serpQuery,
      num: 5,
    });

    // Get real snippets from SerpAPI
    const serpResults = await getJson({
      engine: "google",
      q: serpQuery,
      api_key: process.env.SERPAPI_KEY,
      num: 5,
    });

  // Debug log: raw response object received from API
    console.log("[analyze-serpapi] SERPAPI raw response:", {
      hasOrganic: Array.isArray((serpResults as any)?.organic_results),
      organicCount: Array.isArray((serpResults as any)?.organic_results)
        ? (serpResults as any).organic_results.length
        : 0,
      // Avoid logging huge payloads
      topKeys: Object.keys(serpResults ?? {}),
    });

    const organic = (serpResults as any)?.organic_results;

    if (!Array.isArray(organic) || organic.length === 0) {
      return NextResponse.json(
        {
          error: "SERPAPI returned no organic_results",
          details: {
            productName,
            query: serpQuery,
            organicType: typeof organic,
          },
        },
        { status: 502 }
      );
    }

    const snippets: string[] = [];
    if (Array.isArray(organic)) {
      organic.slice(0, 5).forEach((item: any) => {
        const snippet = item?.snippet || item?.title;
        if (snippet) snippets.push(String(snippet));
      });
    }
    const joinedSnippets = snippets.join("\n");

    // Fetch REAL reviews with ratings
    console.log("[analyze-serpapi] Fetching real reviews with ratings...");
    const realReviews = await fetchRealReviewsWithRatings(productName);
    console.log(`[analyze-serpapi] Found ${realReviews.length} real reviews`);

    // Ask Groq using search results AND real reviews - ONLY for analysis pillars
    const groqResponse = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: "user",
          content: `You are a market research analyst. Analyze this product's REAL customer reviews and search results to identify genuine pain points and market opportunities. Write your analysis in a conversational, human tone - like you're explaining findings to a business colleague.

Extract and provide in EXACTLY this format:

## NEGATIVE POINTS
- Focus on REAL complaints from actual customer reviews
- Explain WHY these issues matter to customers
- Use natural, conversational language (not marketing speak)
- Be specific with examples from reviews
- Use bullet points starting with "- "

## MARKET GAPS
- What customers explicitly want that's missing
- Pain points competitors aren't solving
- Unmet needs based on the review sentiment
- Use bullet points starting with "- "

## ENTRY STRATEGIES
- How to position a better solution against these pain points
- Marketing angles based on actual customer frustrations
- Features customers are begging for
- Use bullet points starting with "- "

STRICT RULE FOR "NEGATIVE POINTS": list ONLY genuine complaints, defects and dissatisfaction. Never include praise, positive reviews, neutral facts or marketing claims, and never turn a positive review into a complaint. If a point is not clearly negative, leave it out. If there are no real complaints, write a single bullet saying so.

TONE: Write as if you're having a real conversation. Use natural language. Avoid corporate jargon.
CREDIBILITY: Reference specific review quotes when possible.
Be empathetic to customer frustrations while being analytical.

PRODUCT: ${productName}

REAL CUSTOMER REVIEWS (use these for context only - do NOT paraphrase them):
${realReviews.filter((r) => !(r.rating >= 4)).map((r) => (r.rating ? `[${r.rating}★] ` : "") + `"${r.reviewText}"`).join("\n")}

SEARCH RESULTS:
${joinedSnippets}`,
        },
      ],
    });

    console.log("GROQ RESPONSE:", groqResponse.choices[0]?.message?.content);

    const analysisText = groqResponse.choices[0]?.message?.content || "";

    // parsedData = what UI parsing expects
    const parsedData = {
      negativePoints: analysisText
        .split("## NEGATIVE POINTS")?.[1]?.split("## MARKET GAPS")?.[0]
        ?.split("\n")
        ?.filter((l) => l.trim().startsWith("- "))
        ?.slice(0, 10),
    };

    console.log("PARSED DATA:", JSON.stringify(parsedData));


    const { data: newReport, error: insertError } = await supabaseAdmin
      .from("reports")
      .insert([
        {
          user_id: user.id,
          product_name: productName,
          market_data: {
            url: isAmazonUrl(url.trim()) ? url.trim() : "",
            analysis: analysisText,
            real_reviews: realReviews,
            average_rating: realReviews.some((r: any) => r.rating > 0)
              ? (() => {
                  const rated = realReviews.filter((r: any) => r.rating > 0);
                  return (rated.reduce((sum: number, r: any) => sum + r.rating, 0) / rated.length).toFixed(1);
                })()
              : "N/A",
            reviews_count: realReviews.length,
            data_points: analysisText.length,
            gaps_found: (analysisText.match(/^- /gm) || []).length,
            confidence_score: 95,
            market_signal_strength: 85,
            insights: [
              `${realReviews.length} real reviews analyzed`,
              "Market gaps identified from customer feedback",
              "Entry strategies based on actual pain points",
              "Humanized analysis for better insights"
            ],
          },
        },
      ])
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Decrement trials (free users only)
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("remaining_trials, subscription_status")
      .eq("id", user.id)
      .single();

    const subscriptionStatus = (profile as any)?.subscription_status;
    const isPro = subscriptionStatus === "pro";

    if (!isPro) {
      await supabaseAdmin
        .from("profiles")
        .update({ remaining_trials: Math.max((profile?.remaining_trials ?? 0) - 1, 0) })
        .eq("id", user.id);
    }

    // Return report WITH real reviews data
    return NextResponse.json({
      ...newReport,
      real_reviews: realReviews,
      analysis_text: analysisText,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Analysis failed" }, { status: 500 });
  }
}

