// Sequelize DB layer for the Next.js app (Story 1.1).
//
// Singleton pattern (REQ-F-03, AC-3): Next.js dev mode hot-reloads the module system
// repeatedly. Without a singleton, each reload creates a new Sequelize connection pool.
// We stash the initialised instance on globalThis so repeated imports reuse it.
//
// 🔴 Schema safety (REQ-F-18 / ARCH-05): this module NEVER auto-alters or force-syncs the
// schema at boot. Schema is owned entirely by the existing Sequelize CLI migrations. The
// only startup call exposed here is authenticate().

import { Sequelize, DataTypes } from "sequelize";
import { resolveDbConfig } from "./config.js";
import defineUser from "./models/User.js";
import defineArticle from "./models/Article.js";
import defineTag from "./models/Tag.js";
import defineComment from "./models/Comment.js";

const modelFactories = {
  User: defineUser,
  Article: defineArticle,
  Tag: defineTag,
  Comment: defineComment,
};

function createDb() {
  const config = resolveDbConfig();

  const sequelize = config.url
    ? new Sequelize(config.url, config)
    : new Sequelize(config.database, config.username, config.password, config);

  const db = { sequelize, Sequelize };

  // Define every model.
  for (const [name, factory] of Object.entries(modelFactories)) {
    const model = factory(sequelize, DataTypes);
    db[name] = model;
  }

  // Wire associations once every model is defined.
  for (const name of Object.keys(modelFactories)) {
    if (typeof db[name].associate === "function") {
      db[name].associate(db);
    }
  }

  return db;
}

const globalForDb = globalThis;

// Reuse the existing instance across hot-reloads (AC-3); only create one in production.
const db = globalForDb.__conduitDb ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__conduitDb = db;
}

/**
 * Authenticate the connection at boot (REQ-F-05, AC-5).
 * 🔴 This is the ONLY startup DB call — no schema-altering sync (ARCH-05).
 * @returns {Promise<void>}
 */
export async function authenticate() {
  await db.sequelize.authenticate();
}

export const { sequelize, User, Article, Tag, Comment } = db;
export { Sequelize };
export default db;
