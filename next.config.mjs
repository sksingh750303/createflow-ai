/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // firebase-admin (and its @grpc/@google-cloud/firestore dependencies)
  // should run as real server-side Node modules rather than be bundled
  // into the Edge/serverless function bundle — this avoids bundler
  // errors on native/optional dependencies. All routes that import it
  // also explicitly set `export const runtime = "nodejs"`.
  experimental: {
    serverComponentsExternalPackages: ["firebase-admin", "stripe"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};

export default nextConfig;
