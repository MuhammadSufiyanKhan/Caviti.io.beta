const DEFAULT_LOCAL_URL = "http://localhost:3000";

function normalizeBaseUrl(value: string | null | undefined) {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  const withoutTrailingSlash = trimmed.replace(/\/+$/, "");

  if (/^https?:\/\//i.test(withoutTrailingSlash)) {
    return withoutTrailingSlash;
  }

  if (withoutTrailingSlash.startsWith("localhost") || withoutTrailingSlash.startsWith("127.0.0.1")) {
    return `http://${withoutTrailingSlash}`;
  }

  return `https://${withoutTrailingSlash}`;
}

export function buildAppUrl(pathname = "/") {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  const fromVercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL;
  const browserOrigin = typeof window !== "undefined" ? window.location.origin : undefined;
  const baseUrl = normalizeBaseUrl(fromEnv || fromVercel || browserOrigin || DEFAULT_LOCAL_URL);

  if (!baseUrl) {
    return `${DEFAULT_LOCAL_URL}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
  }

  return new URL(pathname.startsWith("/") ? pathname : `/${pathname}`, baseUrl).toString();
}
