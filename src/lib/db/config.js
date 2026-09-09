// Database configuration for the Next.js app (Story 1.1, REQ-F-04).
// Reads exclusively from environment variables — NO credentials are hardcoded (SEC-04).
// Supports both a single DATABASE_URL and discrete DB_* variables, and stays
// backward-compatible with the legacy DEV_DB_* / TEST_DB_* / PROD_DB_* names so an
// existing .env keeps working during the migration.

const prefixFor = {
  development: "DEV_DB",
  test: "TEST_DB",
  production: "PROD_DB",
};

/**
 * Read a DB setting by precedence: discrete DB_<suffix>, then legacy <PREFIX>_<suffix>,
 * then an optional fallback. Keeps resolveDbConfig() free of repeated ?? chains.
 * @param {string} legacyPrefix e.g. "DEV_DB"
 * @param {string} suffix e.g. "USERNAME"
 * @param {string|undefined} fallback
 * @returns {string|undefined}
 */
function pickEnv(legacyPrefix, suffix, fallback) {
  return (
    process.env[`DB_${suffix}`] ??
    process.env[`${legacyPrefix}_${suffix}`] ??
    fallback
  );
}

/**
 * Resolve the Sequelize connection options for the current NODE_ENV.
 * Precedence: DATABASE_URL > discrete DB_* > legacy <ENV>_DB_* variables.
 * @returns {{ url?: string } & import('sequelize').Options}
 */
export function resolveDbConfig() {
  if (process.env.DATABASE_URL) {
    return {
      url: process.env.DATABASE_URL,
      dialect: process.env.DB_DIALECT || "postgres",
      logging: parseLogging(process.env.DB_LOGGING),
    };
  }

  const env = process.env.NODE_ENV || "development";
  const legacy = prefixFor[env] || prefixFor.development;

  return {
    username: pickEnv(legacy, "USERNAME"),
    password: pickEnv(legacy, "PASSWORD"),
    database: pickEnv(legacy, "NAME"),
    host: pickEnv(legacy, "HOSTNAME", "localhost"),
    dialect: pickEnv(legacy, "DIALECT", "postgres"),
    logging: parseLogging(pickEnv(legacy, "LOGGING")),
  };
}

/**
 * Normalise the logging env var into a Sequelize logging option.
 * "true"/"1" -> console.log, anything else -> false (disabled).
 * @param {string|undefined} value
 * @returns {boolean | ((sql: string) => void)}
 */
export function parseLogging(value) {
  if (value === "true" || value === "1") return console.log;
  return false;
}

export default resolveDbConfig;
