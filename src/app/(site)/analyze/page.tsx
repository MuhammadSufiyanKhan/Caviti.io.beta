import { Suspense } from "react";
import { AnalyzeClient } from "./AnalyzeClient";

export const metadata = {
  title: "Analyze a product — Caviti",
};

export default function AnalyzePage() {
  return (
    <Suspense fallback={null}>
      <AnalyzeClient />
    </Suspense>
  );
}
