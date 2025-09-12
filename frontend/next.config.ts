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
    // API_ROOT: 'http://127.0.0.1:8000'
  }
};

export default nextConfig;
