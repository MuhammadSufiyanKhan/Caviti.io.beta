import { NextResponse } from "next/server";

interface ComplaintTheme {
  theme: string;
  description: string;
  quotes: string[];
  mentions: number;
}

interface AdAngle {
  name: string;
  customerPain: string;
  hiddenFrustration: string;
  oldMarketPromise: string;
  marketGap: string;
  newBrandPosition: string;
  whyItWorks: string;
}

interface Hook {
  hookType: string;
  customerPainUsed: string;
  pattern: string;
  hook: string;
  visualDirection: string;
}

interface Script {
  format: string;
  targetEmotion: string;
  duration: string;
  scenes: {
    sceneNumber: number;
    visual: string;
    voice: string;
  }[];
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { complaintThemes, productName } = payload;

    if (!complaintThemes || complaintThemes.length === 0) {
      return NextResponse.json(
        { error: "Complaint themes are required" },
        { status: 400 }
      );
    }

    const normalizedProductName = productName?.trim() || "this product";
    const productLabel = normalizedProductName.length > 60 ? `${normalizedProductName.slice(0, 57)}...` : normalizedProductName;
    const productSignature = normalizedProductName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
    const productWords = normalizedProductName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean);
    const productProfile = {
      firstWord: productWords[0] || "this",
      secondWord: productWords[1] || "product",
      lastWord: productWords[productWords.length - 1] || "solution",
      categoryHint: productWords.slice(0, Math.min(2, productWords.length)).join(" ") || "product",
    };

    console.log(`[ad-content] Generating for ${productLabel} with ${complaintThemes.length} themes`);

    // Helper: Local deterministic generator that produces distinct content per complaint theme and product
    function localGenerateAdAngles(themes: ComplaintTheme[]): AdAngle[] {
      return themes.map((t, index) => {
        const quoteSample = (t.quotes && t.quotes[0]) || t.description || t.theme;
        const themeLabel = t.theme || `pain point ${index + 1}`;
        const painText = (t.description || quoteSample || themeLabel).trim();
        const themeKey = themeLabel.toLowerCase();
        const angleName = [
          `${productLabel} • ${themeLabel}`,
          `${productLabel} vs. ${themeLabel}`,
          `${productLabel} for ${themeLabel}`,
          `${productLabel}: The ${themeLabel} Fix`,
        ][index % 4];
        const productSpecificFraming = productSignature ? `for ${productSignature}` : "for this product";

        return {
          name: angleName,
          customerPain: painText,
          hiddenFrustration: `Customers are frustrated because ${painText.toLowerCase()} ${productSpecificFraming}. They feel let down when the experience does not match the promise around ${productLabel}.`,
          oldMarketPromise: `The market keeps selling ${productLabel} as the easy answer, even though ${painText.toLowerCase()} remains a major problem ${productSpecificFraming}.`,
          marketGap: `Shoppers want ${productLabel} that directly addresses ${painText.toLowerCase()} without extra hassle, confusion, or disappointment ${productSpecificFraming}.`,
          newBrandPosition: `Position ${productLabel} as the product that solves ${painText.toLowerCase()} clearly and honestly, instead of pretending the problem does not exist.`,
          whyItWorks: `This resonates because it names the exact complaint customers already feel and connects it directly to why ${productLabel} should be considered.`,
        } as AdAngle;
      });
    }

    function localGenerateHooks(angles: AdAngle[]): Hook[] {
      const hooks: Hook[] = [];
      angles.forEach((a, idx) => {
        const painLabel = a.customerPain || "this problem";
        const painText = painLabel.toLowerCase();
        const hookVariants = [
          {
            hookType: "Problem",
            pattern: "Pain-first opener",
            hook: `If ${painText} is what you are dealing with, ${productLabel} is probably not the solution you expected.`,
            visualDirection: `Open with the customer saying the issue out loud, then cut to ${productLabel}.`,
          },
          {
            hookType: "Contrarian",
            pattern: "Challenge the assumption",
            hook: `Most people think ${productLabel} should solve ${painText}, but that is exactly where it falls short.`,
            visualDirection: `Show the product looking polished, then reveal the actual frustration.`,
          },
          {
            hookType: "Story",
            pattern: "Personal reveal",
            hook: `I kept hoping ${productLabel} would fix ${painText}, but it kept making the experience worse.`,
            visualDirection: `Use a quick before-and-after sequence with a candid reaction shot.`,
          },
          {
            hookType: "Curiosity",
            pattern: "Question the status quo",
            hook: `What if the reason ${productLabel} feels wrong is that ${painText} was never really addressed?`,
            visualDirection: `Overlay a bold question over a close-up of the product and the pain point.`,
          },
        ];

        hookVariants.forEach((variant) => {
          hooks.push({
            hookType: variant.hookType,
            customerPainUsed: painLabel,
            pattern: variant.pattern,
            hook: variant.hook.replace(/\s+/g, " ").trim(),
            visualDirection: variant.visualDirection,
          });
        });

        if (idx === 0) {
          hooks.push({
            hookType: "Comparison",
            customerPainUsed: painLabel,
            pattern: "Expectation vs reality",
            hook: `The version of ${productLabel} people see online is not the version that handles ${painText} in real life.`,
            visualDirection: `Split-screen the idealized ad vs. the real-use experience.`,
          });
        }
      });
      return hooks;
    }

    function localGenerateScripts(angles: AdAngle[]): Script[] {
      return angles.map((a, index) => {
        const formatOptions = [
          "UGC / Problem-Solution",
          "Founder Story",
          "Comparison",
          "Demonstration",
        ];
        const emotionOptions = ["Frustration", "Desire", "Trust", "Curiosity"];
        const format = formatOptions[index % formatOptions.length];
        const emotion = emotionOptions[index % emotionOptions.length];
        const painReference = a.customerPain || "the problem";
        const painText = painReference.toLowerCase();
        const openerHook = [
          `I expected ${productLabel} to handle ${painText} better than this.`,
          `I bought ${productLabel} because I wanted it to solve ${painText}, not make it worse.`,
          `When ${productLabel} was supposed to fix ${painText}, the experience felt completely off.`,
          `I wanted ${productLabel} to be the answer for ${painText}, but it was not.`,
        ][index % 4];

        return {
          format,
          targetEmotion: emotion,
          duration: "30 seconds",
          scenes: [
            {
              sceneNumber: 1,
              visual: `Open with a customer reacting to ${painText} while holding ${productLabel}`,
              voice: openerHook,
            },
            {
              sceneNumber: 2,
              visual: `Show the exact issue described by the pain point with ${productLabel}`,
              voice: `${painReference} is what made me stop trusting the promise around ${productLabel}.`,
            },
            {
              sceneNumber: 3,
              visual: `Reveal ${productLabel} addressing the issue in a more direct and believable way`,
              voice: `Then I discovered a version of ${productLabel} that actually dealt with ${painText}.`,
            },
            {
              sceneNumber: 4,
              visual: `Show a proof point or result that makes the improvement clear`,
              voice: `That is why this felt like the first time ${productLabel} actually matched the expectation.`,
            },
            {
              sceneNumber: 5,
              visual: `End on a confident product shot with a CTA tied to the pain point`,
              voice: `If you want ${productLabel} that handles ${painText}, this is the version to try.`,
            },
          ],
        };
      });
    }

    const localAdAngles = localGenerateAdAngles(complaintThemes);
    const localHooks = localGenerateHooks(localAdAngles);
    const localScripts = localGenerateScripts(localAdAngles);

    const adAngles: AdAngle[] = localAdAngles;
    const hooks: Hook[] = localHooks;
    const scripts: Script[] = localScripts;

    console.log(
      `[ad-content] Generated ${adAngles.length} angles, ${hooks.length} hooks, ${scripts.length} scripts (source: unique-local)`
    );

    return NextResponse.json(
      {
        success: true,
        ad_angles: adAngles,
        hooks: hooks,
        scripts: scripts,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (err: any) {
    console.log(`[ad-content] Error:`, err);
    return NextResponse.json(
      { error: err?.message || "Failed to generate ad content" },
      { status: 500 }
    );
  }
}
