import { NextResponse } from "next/server";
import { getJson } from "serpapi";
import Groq from "groq-sdk";
import { GROQ_MODEL } from "@/lib/groq-model";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function normalizeReviewText(text: string): string {
  return (text || "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function isLikelyCompleteReviewText(text: string): boolean {
  const normalized = normalizeReviewText(text || "");

  if (!normalized) return false;
  if (normalized.length < 25) return false;
  if (normalized.includes("...") || normalized.includes("…")) return false;
  if (normalized.includes(" -") && normalized.split(" -").length > 2) return false;
  if (/[;:]/.test(normalized) && !/[.!?]/.test(normalized)) return false;

  return true;
}

async function fetchFirecrawlReviews(url: string, source: string = "generic"): Promise<any[]> {
  try {
    console.log("[firecrawl] Scraping reviews from:", source, url);
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        waitFor: 3000,
        timeout: 15000,
      }),
    });

    if (!response.ok) {
      console.log("[firecrawl] Error:", response.statusText);
      return [];
    }

    const data = await response.json();
    const markdown = data.markdown || "";
    
    if (!markdown || markdown.length < 100) {
      console.log("[firecrawl] No content returned");
      return [];
    }

    // Extract reviews based on source-specific patterns
    const reviews: any[] = [];
    
    if (source === "trustpilot") {
      // Trustpilot review pattern: star rating + review text
      const reviewPattern = /⭐{1,5}.*?(?:\n|\r\n)(.{20,800}?)(?=⭐|$)/gs;
      let match;
      while ((match = reviewPattern.exec(markdown)) !== null && reviews.length < 12) {
        const rating = (markdown.substring(match.index, match.index + 10)).match(/⭐/g)?.length || 2;
        const reviewText = normalizeReviewText(match[1] || "");
        if (reviewText && reviewText.length > 30 && isLikelyCompleteReviewText(reviewText)) {
          reviews.push({
            rating: Math.min(5, Math.max(1, rating)),
            reviewText: reviewText,
            reviewer: "Verified Customer",
            date: "Recent",
            source: "Trustpilot",
          });
        }
      }
    } else if (source === "amazon") {
      // Amazon reviews: extract review paragraphs with star ratings
      const lines = markdown.split(/\n/).filter((l: string) => l.trim().length > 20);
      for (let i = 0; i < lines.length - 1; i++) {
        if (reviews.length >= 12) break;
        const line = lines[i];
        const nextLine = lines[i + 1];
        
        // Look for star patterns or short titles followed by longer review text
        if ((line.includes("★") || line.length < 100) && nextLine.length > 50) {
          const ratingMatch = line.match(/⭐|★/g);
          const rating = ratingMatch ? ratingMatch.length : 2;
          const reviewText = normalizeReviewText(`${line} ${nextLine}`);
          
          if (reviewText.length > 50 && !reviewText.toLowerCase().includes("verified purchase") && isLikelyCompleteReviewText(reviewText)) {
            reviews.push({
              rating: Math.min(5, Math.max(1, rating)),
              reviewText: reviewText,
              reviewer: "Verified Customer",
              date: "Recent",
              source: "Amazon",
            });
          }
        }
      }
    } else {
      // Generic: Extract any paragraph that looks like a review
      const paragraphs = markdown.split(/\n\n+/);
      for (const para of paragraphs) {
        if (reviews.length >= 12) break;
        if (para.length < 40 || para.length > 1500) continue;
        
        // Check if looks like customer review (contains personal pronouns or review keywords)
        const reviewPatterns = [
          /(?:i |me |my |we |our |the product|this product).*(?:was|is|are|isn't|doesn't|didn't|won't|can't|couldn't)/i,
          /(?:bad|terrible|awful|poor|disappointed|disappointed|not worth|waste of|overpriced|broke|defective|damaged)/i,
          /(?:didn't|doesn't|don't|wasn't|aren't|isn't|won't|can't|couldn't)/i,
          /★|⭐/,
        ];
        
        if (reviewPatterns.some(p => p.test(para))) {
          const ratingMatch = para.match(/★{1,5}|⭐{1,5}|(\d+)\s*(?:\/|out of)\s*5/);
          const rating = ratingMatch ? (typeof ratingMatch[1] !== 'undefined' ? parseInt(ratingMatch[1]) : ratingMatch[0].length) : 2;
          
          let reviewText = para.replace(/★|⭐/g, "").replace(/\d+\s*(?:\/|out of)\s*5/i, "").trim();
          
          if (reviewText.length > 40 && isLikelyCompleteReviewText(reviewText)) {
            reviews.push({
              rating: Math.min(5, Math.max(1, rating)),
              reviewText: normalizeReviewText(reviewText),
              reviewer: "Verified Customer",
              date: "Recent",
              source: source,
            });
          }
        }
      }
    }

    if (reviews.length > 0) {
      console.log("[firecrawl]", source, "found", reviews.length, "customer reviews");
    }
    return reviews;
  } catch (err) {
    console.log("[firecrawl] Error scraping from", source, ":", err);
    return [];
  }
}

async function searchSnippetCandidates(query: string, source: string, reviewer: string): Promise<any[]> {
  try {
    const results = await getJson({
      engine: "google",
      q: query,
      api_key: process.env.SERPAPI_KEY,
      num: 20,
    });
    const organic = (results as any)?.organic_results || [];
    return organic
      .filter((item: any) => item.snippet && item.snippet.length > 50 && isLikelyCompleteReviewText(item.snippet))
      .map((item: any) => ({
        // Snippets have no real star rating (0 = unknown). Sentiment is decided later by the classifier.
        rating: 0,
        reviewText: normalizeReviewText(item.snippet),
        reviewer,
        date: "Recent",
        source,
        url: item.link,
      }));
  } catch (err) {
    console.log(`[fetch-reviews] ${source} search error:`, err);
    return [];
  }
}

// Collect candidate customer feedback from the web. Candidates are NOT assumed to be negative;
// classifyWithAI / the lexical guard decide that afterwards.
async function fetchCandidateReviews(productName: string): Promise<any[]> {
  const pool: any[] = [];
  const seen = new Set<string>();
  const add = (items: any[]) => {
    for (const r of items) {
      const key = r.reviewText.toLowerCase().slice(0, 80);
      if (!seen.has(key)) {
        seen.add(key);
        pool.push(r);
      }
    }
  };

  const queries: Array<[string, string, string]> = [
    [`site:reddit.com ${productName} terrible awful bad hate complaint problem issue -worth`, "Reddit", "Reddit User"],
    [`site:quora.com "${productName}" problems issues complaints not good bad quality`, "Quora", "Quora User"],
    [`"${productName}" review negative bad quality poor disappointed avoid`, "Search Results", "Customer"],
    [`${productName} reviews customer feedback rating site:amazon.com OR site:trustpilot.com OR site:walmart.com`, "Shopping Sites", "Buyer"],
  ];

  // Sequential with early stop to conserve SerpAPI quota.
  for (const [query, source, reviewer] of queries) {
    add(await searchSnippetCandidates(query, source, reviewer));
    if (pool.length >= 20) break;
  }

  if (pool.length < 6) {
    const urls = [
      `https://www.amazon.com/s?k=${encodeURIComponent(productName)}+reviews`,
      `https://www.reddit.com/search/?q=${encodeURIComponent(productName)}+terrible`,
    ];
    for (const url of urls) {
      add(await fetchFirecrawlReviews(url, "generic"));
      if (pool.length >= 6) break;
    }
  }

  console.log(`[fetch-reviews] ${pool.length} candidate snippets collected`);
  return pool;
}

const NEGATIVE_WORDS =
  /\b(bad|terrible|awful|horrible|poor|worst|disappoint\w*|waste|wasted|broke|broken|defective|damaged|faulty|cheap|flimsy|overpriced|useless|regret\w*|refund|return(ed)?|complain\w*|problem\w*|issue\w*|fail\w*|stopped working|falls? apart|fell apart|doesn'?t work|didn'?t work|not worth|uncomfortable|scam|rip-?off|hate[sd]?|annoying|frustrat\w*|never again|avoid)\b/i;
const POSITIVE_WORDS =
  /\b(love[sd]?|loving|great|excellent|amazing|awesome|fantastic|perfect|best|recommend\w*|worth (it|every|the)|highly rated|five stars?|5 stars?|happy with|satisfied|impressed|comfortable|good quality|well made|works? (great|well|perfectly))\b/i;

// Conservative guard: true only when the text reads as a complaint and is not praise-only.
function isLexicallyNegative(text: string): boolean {
  const t = text || "";
  if (!NEGATIVE_WORDS.test(t)) return false;
  const neg = (t.match(new RegExp(NEGATIVE_WORDS.source, "gi")) || []).length;
  const pos = (t.match(new RegExp(POSITIVE_WORDS.source, "gi")) || []).length;
  return neg >= pos;
}

// Positive-only text must never reach the pain points section, even if the AI mislabels it.
function looksPositiveOnly(text: string): boolean {
  return POSITIVE_WORDS.test(text || "") && !NEGATIVE_WORDS.test(text || "");
}

// Ask the AI to keep ONLY genuine negative customer feedback about this product and categorize it.
// Returns null if the AI call fails so the caller can fall back to the lexical filter.
async function classifyWithAI(
  reviews: any[],
  productName: string
): Promise<{ negatives: any[]; clusters: any[] } | null> {
  if (reviews.length === 0) return { negatives: [], clusters: [] };
  if (!process.env.GROQ_API_KEY) return null;

  const batch = reviews.slice(0, 40);
  const numbered = batch.map((r, i) => `[${i}] ${r.reviewText.slice(0, 500)}`).join("\n");

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You filter and categorize customer feedback. Be strict: only genuine negative feedback about the named product may pass. Respond with JSON only.",
        },
        {
          role: "user",
          content: `Product: "${productName}"

For each numbered text decide if it is a NEGATIVE customer complaint about THIS product (the author expresses a problem, defect, disappointment, regret or dissatisfaction with the product itself).

Mark negative=false for: positive reviews, praise, mixed reviews whose overall sentiment is positive, neutral descriptions, marketing copy, news or listicles, questions, advice, and text about other products.

For negative=true items give "theme": a short 2-4 word complaint category (e.g. "Battery Life", "Build Quality", "Price & Value", "Customer Support", "Sizing & Fit"). Reuse the exact same theme name for the same kind of issue and use at most 6 themes overall.

Return: {"items":[{"id":0,"negative":true,"theme":"Battery Life"}]}

Texts:
${numbered}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content || "";
    const jsonText = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed?.items)) return null;

    const byTheme = new Map<string, any[]>();
    const negatives: any[] = [];
    for (const item of parsed.items) {
      const review = batch[Number(item?.id)];
      if (!review || item?.negative !== true) continue;
      if (looksPositiveOnly(review.reviewText)) continue; // safety net against mislabels
      const theme = String(item?.theme || "Other Complaints").trim().slice(0, 40) || "Other Complaints";
      negatives.push(review);
      if (!byTheme.has(theme)) byTheme.set(theme, []);
      byTheme.get(theme)!.push(review);
    }

    const clusters = Array.from(byTheme.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .map(([theme, items]) => ({
        theme: theme.toUpperCase(),
        description: `Customers complain about ${theme.toLowerCase()}.`,
        emoji: "🔴",
        mentions: items.length,
        // Quotes are the original text, never AI-written.
        quotes: items.slice(0, 5).map((r) => r.reviewText),
      }));

    return { negatives, clusters };
  } catch (err) {
    console.log("[classify] AI classification failed, using lexical fallback:", err);
    return null;
  }
}

// Cluster reviews by theme and extract verbatim quotes
async function clusterReviewsByTheme(reviews: any[]): Promise<any[]> {
  if (reviews.length === 0) return [];

  // Filter for negative reviews (1-2 stars, or lack rating altogether)
  // If no rating is set, treat as potentially negative for clustering purposes
  const negativeReviews = reviews.filter((r: any) => {
    const rating = r.rating || 2; // Default to 2 if no rating
    const reviewText = (r.reviewText || r.title || "").trim();
    return rating <= 2 && isLikelyCompleteReviewText(reviewText);
  });
  if (negativeReviews.length === 0) {
    console.log("[cluster] No negative reviews to cluster");
    return [];
  }

  console.log(`[cluster] Processing ${negativeReviews.length} negative reviews...`);

  // Function to extract complete sentences from text
  function extractSentences(text: string, maxLength: number = 150): string[] {
    const sentences = text.match(/[^.!?]*[.!?]+/g) || [];
    const result: string[] = [];
    
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.length > 15 && trimmed.length < maxLength) {
        result.push(trimmed);
      }
      if (result.length >= 3) break;
    }
    
    return result.length > 0 ? result : [text.substring(0, maxLength).trim()];
  }

  // Keyword-based clustering with improved quote extraction
  const themes: any[] = [];
  const processedReviews: Set<number> = new Set();

  // Helper function to extract quotes - use verbatim review text
  function extractQuotesFromReviews(reviews: any[]): string[] {
    if (reviews.length === 0) return [];
    
    // Return verbatim review text (up to 5 quotes)
    const quotes = reviews
      .slice(0, 5)
      .map(r => (r.reviewText || r.title || "").trim())
      .filter(q => q.length > 15 && isLikelyCompleteReviewText(q))
      .slice(0, 5);
    
    return quotes;
  }

  // Track which reviews have been assigned to prevent duplicates
  const usedReviewIndices = new Set<number>();

  const reviewTextByIndex = new Map<number, string>();
  negativeReviews.forEach((r: any, idx: number) => {
    const text = (r.reviewText || "").trim();
    if (text) reviewTextByIndex.set(idx, text);
  });

  const themeBuilders = [
    {
      name: "Application & Blend",
      keywords: ["blend", "blending", "patchy", "streaky", "cakey", "application", "applies", "uneven", "spread", "unevenly", "difficult apply", "hard to apply", "doesn't blend", "blotchy", "unblended"],
      label: (reviewText: string) => `Customers say ${reviewText.toLowerCase()}`,
    },
    {
      name: "Staying Power & Durability",
      keywords: ["staying", "power", "lasts", "wore off", "fades", "seconds", "durable", "long-lasting", "wears off", "doesn't last", "came off", "rubbed off", "faded", "washed off", "flaked off", "transfer", "smudge", "lasted", "wear time"],
      label: (reviewText: string) => `Customers report that ${reviewText.toLowerCase()}`,
    },
    {
      name: "Formula & Texture",
      keywords: ["formula", "taste", "irritation", "irritate", "bad taste", "quality", "flimsy", "drying", "dry", "uncomfortable", "texture", "sticky", "thick", "thin", "watery", "hard", "crumbly", "color fade", "discolor", "stain", "peel", "flake"],
      label: (reviewText: string) => `Customers describe ${reviewText.toLowerCase()}`,
    },
    {
      name: "Support & Service",
      keywords: ["customer service", "unresponsive", "support", "refund", "return", "shipping", "response", "help", "email", "contacted", "rude", "unhelpful", "slow", "no reply", "never heard", "terrible service", "waste", "broke", "damaged", "defective"],
      label: (reviewText: string) => `Customers mention ${reviewText.toLowerCase()}`,
    },
    {
      name: "Price & Value",
      keywords: ["expensive", "overpriced", "price", "cost", "value", "worth", "money", "too much", "not worth", "waste of money", "overcharge", "markup", "dollar", "ripoff", "scam", "not worth it"],
      label: (reviewText: string) => `Customers feel ${reviewText.toLowerCase()}`,
    },
  ];

  for (const builder of themeBuilders) {
    const matchingReviews = negativeReviews
      .map((r: any, idx: number) => ({ ...r, idx }))
      .filter((r: any) => !usedReviewIndices.has(r.idx) && builder.keywords.some((kw: string) => (r.reviewText || "").toLowerCase().includes(kw)));

    if (matchingReviews.length > 0) {
      matchingReviews.forEach((r: any) => usedReviewIndices.add(r.idx));
      const quotes = extractQuotesFromReviews(matchingReviews);
      const primaryQuote = quotes[0] || reviewTextByIndex.get(matchingReviews[0].idx) || "Customers report a recurring problem";
      themes.push({
        theme: builder.name.toUpperCase(),
        description: builder.label(primaryQuote),
        emoji: "🔴",
        mentions: matchingReviews.length,
        quotes,
      });
    }
  }

  const unmatchedReviews = negativeReviews
    .map((r: any, idx: number) => ({ ...r, idx }))
    .filter((r: any) => !usedReviewIndices.has(r.idx));

  if (unmatchedReviews.length > 0) {
    const quotes = extractQuotesFromReviews(unmatchedReviews.map((r: any) => r));
    if (quotes.length > 0) {
      themes.push({
        theme: "OTHER CUSTOMER COMPLAINTS",
        description: quotes[0],
        emoji: "🔴",
        mentions: unmatchedReviews.length,
        quotes,
      });
    }
  }

  console.log(`[cluster] Created ${themes.length} themes with complete quotes`);
  return themes;
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const productName = payload?.productName || payload?.keyword;

    console.log(`[fetch] POST received for product: ${productName}`);

    if (!productName) {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 }
      );
    }

    const fetched = await fetchCandidateReviews(productName);
    // Drop anything with a real positive star rating up front.
    const candidates = fetched.filter((r: any) => !(r.rating >= 3));
    console.log(`[fetch] ${candidates.length} candidates, classifying sentiment...`);

    let negatives: any[];
    let clusters: any[];
    const ai = await classifyWithAI(candidates, productName);
    if (ai) {
      negatives = ai.negatives;
      clusters = ai.clusters;
    } else {
      negatives = candidates.filter((r: any) => isLexicallyNegative(r.reviewText));
      clusters = await clusterReviewsByTheme(negatives);
    }
    console.log(`[fetch] ${negatives.length} negative reviews, ${clusters.length} themes`);

    return NextResponse.json({
      success: true,
      complaint_themes: clusters,
      total_reviews: fetched.length,
      negative_reviews: negatives.length,
    });
  } catch (err: any) {
    console.log(`[fetch] Error in POST:`, err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
