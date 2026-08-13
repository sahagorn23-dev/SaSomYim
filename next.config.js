/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["rephrase-motivator-wincing.ngrok-free.dev"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "profile.line-scdn.net",
      },
      {
        protocol: "https",
        hostname: "media.discordapp.net",
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
      },
      {
        protocol: "https",
        hostname: "wvkyuiozlnwyyrtlhiza.supabase.co",
      },
    ],
  },
};

module.exports = nextConfig;
