// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    domains: ["lh3.googleusercontent.com", "flagcdn.com"],
  },
};

export default nextConfig;
