/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-src 'self' https://www.youtube.com https://player.vimeo.com https://www.dailymotion.com https://geo.dailymotion.com https://player.twitch.tv https://clips.twitch.tv;"
          },
        ],
      },
    ]
  },
}

export default nextConfig
