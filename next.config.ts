/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true, // ✅ ทำให้ Next.js สร้าง Static Files ที่โหลดได้ถูกต้อง
  output: "export", // ✅ ให้ Build ออกมาเป็น Static
};

module.exports = nextConfig;
