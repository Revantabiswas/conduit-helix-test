"use strict";

// Add the foreign-key columns the associations need but the original migrations omitted
// (the legacy app created them implicitly via sequelize.sync({ alter: true }), removed in
// this cycle — REQ-F-18). Articles.userId (author) and Comments.articleId/userId.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Articles", "userId", {
      type: Sequelize.INTEGER,
      references: { model: "Users", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    await queryInterface.addColumn("Comments", "articleId", {
      type: Sequelize.INTEGER,
      references: { model: "Articles", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    await queryInterface.addColumn("Comments", "userId", {
      type: Sequelize.INTEGER,
      references: { model: "Users", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("Articles", "userId");
    await queryInterface.removeColumn("Comments", "articleId");
    await queryInterface.removeColumn("Comments", "userId");
  },
};
