// Next.js configuration for the migrated app (Story 1.1, refined in 1.9).
// The App Router lives under src/app.

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 🔴 Sequelize and its native/dynamic dialect drivers (pg) must NOT be bundled by
  // webpack — Sequelize resolves the dialect driver via a dynamic require() that the
  // bundler mangles, producing "Please install pg package manually". Marking them as
  // server-external packages lets Node require them normally at runtime.
  serverExternalPackages: ["sequelize", "pg", "pg-hstore"],
};

export default nextConfig;
