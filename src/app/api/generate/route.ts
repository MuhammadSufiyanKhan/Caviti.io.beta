import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';
import { GROQ_MODEL } from '@/lib/groq-model';
import { scrapeWebsite } from '@/lib/scraper';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function isUrl(input: string): boolean {
  return input.includes('.') && (input.startsWith('http') || input.includes('://') || /^[\w-]+\.[a-z]{2,}/.test(input));
}

async function analyzeProductName(product: string, market: string): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{
      role: "user",
      content: `You are a market research analyst. Analyze the product "${product}" in the "${market}" market.

Return your response in EXACTLY this format:

## NEGATIVE POINTS
List 5-7 common customer complaints and negative reviews about existing products in this niche. Use bullet points starting with "- ".

## MARKET GAPS
List 5-7 specific gaps and unmet needs in the market. Use bullet points starting with "- ".

## ENTRY STRATEGIES
List 5-7 actionable strategies to enter this market successfully. Use bullet points starting with "- ".

Be specific, data-driven, and actionable.`
    }],
  });
  return completion.choices[0]?.message?.content || "No analysis generated";
}

async function analyzeUrl(url: string, market: string): Promise<{ title: string; analysis: string }> {
  const scraped = await scrapeWebsite(url);
  
  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{
      role: "user",
      content: `You are a market research analyst. Analyze this competitor website content for the "${market}" market.

Website: ${scraped.url}
Content: ${scraped.text.slice(0, 8000)}

Return your response in EXACTLY this format:

## NEGATIVE POINTS
List 5-7 weaknesses and customer complaints about this competitor. Use bullet points starting with "- ".

## MARKET GAPS
List 5-7 gaps and opportunities this competitor is missing. Use bullet points starting with "- ".

## ENTRY STRATEGIES
List 5-7 actionable strategies to beat this competitor. Use bullet points starting with "- ".

Be specific and grounded in the actual website content.`
    }],
  });

  return {
    title: scraped.title,
    analysis: completion.choices[0]?.message?.content || "No analysis generated"
  };
}

export async function POST(request: Request) {
  try {
    const { product, market, userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let productName = product;
    let analysisText = '';

    if (isUrl(product)) {
      // URL mode — scrape and analyze
      const result = await analyzeUrl(product, market);
      productName = result.title;
      analysisText = result.analysis;
    } else {
      // Product name mode
      analysisText = await analyzeProductName(product, market);
    }

    const { data: newReport, error: insertError } = await supabaseAdmin
      .from('reports')
      .insert([{
        user_id: userId,
        product_name: productName,
        market_data: { market, analysis: analysisText }
      }])
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json(newReport);

  } catch (err: any) {
    console.error("ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}