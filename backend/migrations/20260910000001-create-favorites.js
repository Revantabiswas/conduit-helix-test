"use strict";

// Favorites join table (Article <-> User via belongsToMany).
// Added by the Next.js migration cycle: the legacy app created this implicitly via
// sequelize.sync({ alter: true }), which was removed (REQ-F-18). The schema is now fully
// defined by migrations.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Favorites", {
      articleId: {
        type: Sequelize.INTEGER,
        references: { model: "Articles", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      userId: {
        type: Sequelize.INTEGER,
        references: { model: "Users", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
    });
    await queryInterface.addConstraint("Favorites", {
      fields: ["articleId", "userId"],
      type: "primary key",
      name: "favorites_pkey",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("Favorites");
  },
};
