import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
