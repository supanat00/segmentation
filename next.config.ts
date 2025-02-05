import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    experimental: {
        // @ts-ignore: Disable type checking for turbopack setting
        turbopack: false, // Disable Turbopack; use Webpack instead
    },
    reactStrictMode: true,
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "w3schools.com", // ✅ เปลี่ยนเป็นโดเมนของคุณ
            },
            {
                protocol: "https",
                hostname: "cdn.jsdelivr.net", // ✅ รองรับ CDN
            },
        ],
    },
};

export default nextConfig;
