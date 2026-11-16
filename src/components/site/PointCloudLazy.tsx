"use client";

import dynamic from "next/dynamic";

/** Three.js is loaded only in the browser, after the page is interactive. */
export const PointCloudLazy = dynamic(() => import("@/components/site/PointCloud"), {
  ssr: false,
});
