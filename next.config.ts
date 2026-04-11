import type { NextConfig } from "next";

// Content Security Policy.
//
// In development we need 'unsafe-eval' for Next.js HMR and Turbopack. In
// production we drop it along with any other dev-only affordances. All scripts
// still require 'unsafe-inline' because Next.js injects inline bootstrap
// scripts for hydration; moving to nonce-based CSP requires an Edge middleware
// rewrite which is out of scope here.
const isDev = process.env.NODE_ENV !== "production";

const cspDirectives: Record<string, string[]> = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : [])],
  "style-src": ["'self'", "'unsafe-inline'"],
  "connect-src": ["'self'", "https://api.openai.com", ...(isDev ? ["ws:", "wss:"] : [])],
  "img-src": ["'self'", "data:", "blob:", "https://images.unsplash.com"],
  "font-src": ["'self'", "data:"],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
  "frame-src": ["'none'"],
  "worker-src": ["'self'", "blob:"],
  "manifest-src": ["'self'"],
};

const cspValue = Object.entries(cspDirectives)
  .map(([k, v]) => `${k} ${v.join(" ")}`)
  .concat(isDev ? [] : ["upgrade-insecure-requests"])
  .join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: cspValue,
  },
  {
    // HSTS — force HTTPS for the next 2 years on this origin and all
    // subdomains. Safe because Monetos has no plaintext use case.
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    // Opt into cross-origin isolation. Paired with the default SameSite=Lax
    // cookies Next.js emits, this limits the damage from a hypothetical
    // cross-site script inclusion.
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-origin",
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
