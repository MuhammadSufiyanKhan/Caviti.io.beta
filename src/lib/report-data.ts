export interface ComplaintTheme {
  theme: string;
  description?: string;
  mentions?: number;
  quotes?: string[];
}

export interface AdAngle {
  name: string;
  customerPain: string;
  hiddenFrustration: string;
  marketGap: string;
  whyItWorks: string;
}

export interface Hook {
  hookType?: string;
  hook: string;
  visualDirection?: string;
  customerPainUsed?: string;
}

export interface ScriptScene {
  sceneNumber: number;
  visual: string;
  voice: string;
}

export interface AdScript {
  format?: string;
  targetEmotion?: string;
  duration?: string;
  scenes?: ScriptScene[];
}

/** Everything a report contains; this is what gets stored in `reports.market_data`. */
export interface ReportData {
  url?: string;
  analysis: string;
  reviews_count?: number;
  average_rating?: string | null;
  gaps_found?: number;
  complaint_themes?: ComplaintTheme[];
  ad_angles?: AdAngle[];
  hooks?: Hook[];
  scripts?: AdScript[];
}

export interface GuestReport {
  product_name: string;
  market_data: ReportData;
}

export function asReportData(value: unknown): ReportData {
  const v = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  return {
    ...(v as object),
    analysis: typeof v.analysis === "string" ? v.analysis : "",
  } as ReportData;
}
