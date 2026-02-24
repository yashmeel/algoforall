/**
 * Central API URL config.
 * NEXT_PUBLIC_API_URL is baked at build time by Next.js from .env.production.
 * Falls back to the production Render URL so the site works even if the env
 * var is missing from the Vercel build environment.
 */
export const API_URL =
    process.env.NEXT_PUBLIC_API_URL ?? 'https://algoforall-api.onrender.com';
