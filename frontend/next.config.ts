import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async redirects() {
      return [
        {
          source: '/',
          destination: '/standings',
          permanent: true
        },
        {
          source: '/admin',
          destination: '/admin/addmatch',
          permanent: true
        }
      ]
  },
  env: {
    API_ROOT: 'https://regent-league-api.poopdealer.lol'
  }
};

export default nextConfig;
