"use strict";

// TagList join table (Article <-> Tag via belongsToMany).
// tagName references Tags.name (Tag's primary key is its name).
// Added by the Next.js migration cycle (sequelize.sync removed, REQ-F-18).
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("TagList", {
      articleId: {
        type: Sequelize.INTEGER,
        references: { model: "Articles", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      tagName: {
        type: Sequelize.STRING,
        references: { model: "Tags", key: "name" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
    });
    await queryInterface.addConstraint("TagList", {
      fields: ["articleId", "tagName"],
      type: "primary key",
      name: "taglist_pkey",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("TagList");
  },
};
