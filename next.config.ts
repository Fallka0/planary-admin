import type { NextConfig } from "next";

/** The Casino pages moved under /casino when the admin became the Planary Console. */
const MOVED = ["games", "rounds", "transactions", "players", "moderation", "announcements", "bank", "economy"];

const nextConfig: NextConfig = {
  devIndicators: false,
  async redirects() {
    return MOVED.flatMap((p) => [
      { source: `/${p}`, destination: `/casino/${p}`, permanent: true },
      { source: `/${p}/:rest*`, destination: `/casino/${p}/:rest*`, permanent: true },
    ]);
  },
};

export default nextConfig;
