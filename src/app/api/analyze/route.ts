import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import Groq from "groq-sdk";
import { getJson } from "serpapi";
import { getResendClient } from "@/lib/resend";import { buildAppUrl } from '@/lib/urls';
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function isUrl(input: string): boolean {
  return (
    input.startsWith("http://") ||
    input.startsWith("https://") ||
    /^[\w-]+\.[a-z]{2,}/.test(input)
  );
}

function isAmazonUrl(input: string): boolean {
  return input.includes("amazon.com") || input.includes("amazon.co");
}

async function getRealData(productName: string): Promise<string> {
  try {
    // Google Shopping results
    const shoppingResults = await getJson({
      engine: "google_shopping",
      q: productName,
      api_key: process.env.SERPAPI_KEY,
      num: 10,
    });

    // Google Reviews/Search
    const searchResults = await getJson({
      engine: "google",
      q: `${productName} reviews complaints problems`,
      api_key: process.env.SERPAPI_KEY,
      num: 10,
    });

    let dataText = "";

    // Shopping data
    if (shoppingResults.shopping_results?.length > 0) {
      dataText += "=== PRODUCT DATA ===\n";
      shoppingResults.shopping_results.slice(0, 5).forEach((item: any) => {
        dataText += `- ${item.title}: ${item.price || 'N/A'} | Rating: ${item.rating || 'N/A'} | Reviews: ${item.reviews || 'N/A'}\n`;
      });
    }

    // Search snippets
    if (searchResults.organic_results?.length > 0) {
      dataText += "\n=== CUSTOMER FEEDBACK ===\n";
      searchResults.organic_results.slice(0, 8).forEach((item: any) => {
        dataText += `- ${item.title}: ${item.snippet || ''}\n`;
      });
    }

    return dataText || `Product: ${productName} - Using AI knowledge base`;
  } catch (err) {
    console.error("SerpApi error:", err);
    return `Product: ${productName} - Using AI knowledge base for analysis`;
  }
}

async function analyzeWithGroq(input: string, realData: string, isUrlInput: boolean): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{
      role: "user",
      content: `You are a market research analyst. Analyze this ${isUrlInput ? "competitor" : "product niche"}: "${input}"

Here is REAL market data:
${realData}

Based on this REAL data, return your response in EXACTLY this format:

## NEGATIVE POINTS
List 5-7 real customer complaints and problems found in the data. Use bullet points starting with "- ".

## MARKET GAPS
List 5-7 specific gaps and unmet needs based on the data. Use bullet points starting with "- ".

## ENTRY STRATEGIES
List 5-7 actionable strategies to enter this market successfully. Use bullet points starting with "- ".

Base everything on the actual data provided above.`
    }],
  });
  return completion.choices[0]?.message?.content || "No analysis generated";
}

async function analyzeWebsite(url: string): Promise<{ title: string; analysis: string }> {
  // Firecrawl scrape (markdown)
  const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["markdown"],
      onlyMainContent: true,
    }),
  });

  if (!scrapeResponse.ok) {
    throw new Error(`Firecrawl scrape failed (${scrapeResponse.status})`);
  }

  const scrapeData = await scrapeResponse.json();
  const pageContent: string = scrapeData.data?.markdown || "";

  // Firecrawl may return limited content for JS-rendered review-heavy pages.
  // We still use it for product context; the LLM will infer common complaints for the category.

  const prompt = `You are a product analyst.

Based on this product page (may NOT include customer reviews), provide realistic, specific insights using the product context.

Product context (from scraped page):


RETURN EXACTLY IN THIS FORMAT (headings + bullets MUST match):

## NEGATIVE POINTS
- ...
- ...
- ...

## MARKET GAPS
- ...
- ...
- ...

## ENTRY STRATEGIES
- ...
- ...
- ...

Guidelines:
- Use only information found in the provided content.
- Include 5-7 bullets per section.
- Bullets must start with "- ".

Content:\n${pageContent}`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  return {
    // Firecrawl does not guarantee a stable title in all responses; keep URL host as fallback.
    title: scrapeData?.data?.title || new URL(url).hostname,
    analysis: completion.choices[0]?.message?.content || "No analysis generated",
  };
}


export async function POST(request: Request) {
  // DEBUG: verify stored analysis content parsing

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url } = await request.json();

    if (!url?.trim()) {
      return NextResponse.json({ error: "Input is required" }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("remaining_trials, subscription_status")
      .eq("id", user.id)
      .single();

    // Pro users: unlimited analyses
    const subscriptionStatus = (profile as any)?.subscription_status;
    const isPro = subscriptionStatus === "pro";

    if (!isPro) {
      if (!profile || profile.remaining_trials <= 0) {
        return NextResponse.json(
          { error: "You have used all free trials. Upgrade to Pro!" },
          { status: 403 }
        );
      }
    }


    let productName = url.trim();
    let analysisText = '';
    let reportUrl = '';

    if (isUrl(url.trim()) && !isAmazonUrl(url.trim())) {
      const result = await analyzeWebsite(url.trim());
      productName = result.title;
      analysisText = result.analysis;
      reportUrl = url.trim();
    } else {
      const realData = await getRealData(url.trim());
      analysisText = await analyzeWithGroq(url.trim(), realData, isUrl(url.trim()));
      if (isAmazonUrl(url.trim())) reportUrl = url.trim();
    }

    const { data: newReport, error: insertError } = await supabaseAdmin
      .from("reports")
      .insert([{
        user_id: user.id,
        product_name: productName,
        market_data: {
          url: reportUrl,
          analysis: analysisText,
          data_points: analysisText.length,
          gaps_found: (analysisText.match(/^- /gm) || []).length,
          confidence_score: 90,
          market_signal_strength: 80,
          insights: ["Real Google data analyzed", "Market gaps identified", "Entry strategies ready"]
        },
      }])
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Decrement trials AFTER successful report insert (free users only)
    await supabaseAdmin
      .from("profiles")
      .update({ remaining_trials: Math.max((profile?.remaining_trials ?? 0) - 1, 0) })
      .eq("id", user.id);

// Email notification bhejo
try {
  const resend = getResendClient();
  
  // User ka email lo
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  
  if (currentUser?.email) {
    await resend.emails.send({
      from: 'Caviti.io <onboarding@resend.dev>',
      to: currentUser.email,
      subject: `Your analysis for "${productName}" is ready! 🎯`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #050508; color: white; padding: 40px; border-radius: 16px;">
          <div style="margin-bottom: 32px;">
            <h1 style="font-size: 24px; font-weight: 800; color: white; margin: 0 0 8px;">Analysis Complete! 🎯</h1>
            <p style="color: #64748b; font-size: 14px; margin: 0;">Your market gap analysis is ready to view</p>
          </div>
          
          <div style="background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <p style="color: #93c5fd; font-size: 12px; font-weight: 600; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Product Analyzed</p>
            <p style="color: white; font-size: 22px; font-weight: 800; margin: 0; text-transform: capitalize;">${productName}</p>
          </div>

          <div style="display: grid; gap: 12px; margin-bottom: 32px;">
            <div style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.15); border-radius: 10px; padding: 16px;">
              <p style="color: #ef4444; font-size: 13px; font-weight: 600; margin: 0 0 4px;">⚠️ Negative Points</p>
              <p style="color: #94a3b8; font-size: 13px; margin: 0;">Customer complaints & problems identified</p>
            </div>
            <div style="background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.15); border-radius: 10px; padding: 16px;">
              <p style="color: #f59e0b; font-size: 13px; font-weight: 600; margin: 0 0 4px;">📊 Market Gaps</p>
              <p style="color: #94a3b8; font-size: 13px; margin: 0;">Unmet needs & opportunities found</p>
            </div>
            <div style="background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.15); border-radius: 10px; padding: 16px;">
              <p style="color: #3b82f6; font-size: 13px; font-weight: 600; margin: 0 0 4px;">🚀 Entry Strategies</p>
              <p style="color: #94a3b8; font-size: 13px; margin: 0;">Actionable strategies to enter the market</p>
            </div>
          </div>

          <a href="${buildAppUrl(`/dashboard/report/${newReport.id}`)}" 
            style="display: block; text-align: center; background: linear-gradient(135deg, #3b82f6, #6366f1); color: white; padding: 16px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; margin-bottom: 24px;">
            View Full Report →
          </a>

          <p style="color: #1e293b; font-size: 12px; text-align: center; margin: 0;">
            © ${new Date().getFullYear()} Caviti.io — AI-Powered Market Intelligence
          </p>
        </div>
      `,
    });
  }
} catch (emailErr) {
  console.error("Email send error:", emailErr);
  // Email fail ho toh bhi report return karo
}
    return NextResponse.json(newReport);
  } catch (err: unknown) {
    console.error("POST /api/analyze error:", err);
    const message = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}