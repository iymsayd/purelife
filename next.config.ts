import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // 1. إزالة الكونسول في الإنتاج
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // 2. إخفاء تسريب معلومات السيرفر (X-Powered-By)
  poweredByHeader: false,

  // 3. إعدادات الصور وضبط الدومينات الخارجية لتحويلها لـ WebP
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com', // 👈 أضفنا الدومين بتاع صور جوجل هنا عشان الإيرور يختفي
      },
    ],
  },

  // 4. إعدادات هيدرات الأمان (Security Headers) لمنع الـ Clickjacking والـ XSS
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-system-when-cross-origin",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'; frame-ancestors 'none';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;