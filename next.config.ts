import type { NextConfig } from 'next';

// Keep the development overlay from covering the mobile study tabs.
const nextConfig: NextConfig = { devIndicators: false };

export default nextConfig;
