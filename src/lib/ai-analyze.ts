import Groq from "groq-sdk";
import { GROQ_MODEL } from "@/lib/groq-model";
import OpenAI from "openai";
import type { AnalysisResult } from "@/types/analysis";

const SYSTEM_PROMPT = `You are a market intelligence analyst. Analyze scraped website content and return ONLY valid JSON with no markdown fences or extra text.

The JSON must match this EXACT schema:
{
  "data_points": <number of distinct data signals extracted, integer 50-5000>,
  "gaps_found": <number of market gaps identified, integer 1-20>,
  "confidence_score": <AI confidence in analysis 0-100, integer>,
  "market_signal_strength": <overall market signal strength 0-100, integer>,
  "insights": [<string insight 1>, <string insight 2>, <string insight 3>]
}

Base all numbers on the actual content provided. Insights must be specific, actionable, and grounded in the scraped text.`;

function parseAnalysisJson(raw: string): AnalysisResult {
  const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
  const parsed = JSON.parse(cleaned) as AnalysisResult;

  if (
    typeof parsed.data_points !== "number" ||
    typeof parsed.gaps_found !== "number" ||
    typeof parsed.confidence_score !== "number" ||
    typeof parsed.market_signal_strength !== "number" ||
    !Array.isArray(parsed.insights) ||
    parsed.insights.length < 3
  ) {
    throw new Error("AI response missing required fields");
  }

  return {
    data_points: Math.round(parsed.data_points),
    gaps_found: Math.round(parsed.gaps_found),
    confidence_score: Math.min(100, Math.max(0, Math.round(parsed.confidence_score))),
    market_signal_strength: Math.min(
      100,
      Math.max(0, Math.round(parsed.market_signal_strength))
    ),
    insights: [
      String(parsed.insights[0]),
      String(parsed.insights[1]),
      String(parsed.insights[2]),
    ],
  };
}

async function analyzeWithOpenAI(scrapedText: string, url: string): Promise<AnalysisResult> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Analyze this website (${url}):\n\n${scrapedText}`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("Empty AI response");
  return parseAnalysisJson(content);
}

async function analyzeWithGroq(scrapedText: string, url: string): Promise<AnalysisResult> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Analyze this website (${url}):\n\n${scrapedText}`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("Empty AI response");
  return parseAnalysisJson(content);
}

export async function runAiAnalysis(scrapedText: string, url: string): Promise<AnalysisResult> {
  if (process.env.OPENAI_API_KEY) {
    try {
      return await analyzeWithOpenAI(scrapedText, url);
    } catch (err) {
      console.error("OpenAI analysis failed, falling back to Groq:", err);
    }
  }

  if (!process.env.GROQ_API_KEY) {
    throw new Error("No AI API key configured (OPENAI_API_KEY or GROQ_API_KEY)");
  }

  return analyzeWithGroq(scrapedText, url);
}
