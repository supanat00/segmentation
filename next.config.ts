import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    experimental: {
        turbopack: false,
    } as any,
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "https://www.w3schools.com/html", // ✅ เปลี่ยนเป็นโดเมนของคุณ
            },
            {
                protocol: "https",
                hostname: "cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/", // ✅ รองรับ CDN
            },
        ],
    },
};

export default nextConfig;
