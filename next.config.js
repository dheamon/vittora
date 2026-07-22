/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Produces a self-contained .next/standalone build (only the files needed
  // to run, with a minimal node_modules) — what the Dockerfile copies into
  // the runtime image. Vercel ignores this and uses its own build output.
  output: "standalone",
};

module.exports = nextConfig;
