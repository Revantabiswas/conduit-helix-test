"use strict";

// Followers join table (User <-> User via self-referential belongsToMany).
// userId = the user being followed; followerId = the follower.
// Added by the Next.js migration cycle (sequelize.sync removed, REQ-F-18).
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Followers", {
      userId: {
        type: Sequelize.INTEGER,
        references: { model: "Users", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      followerId: {
        type: Sequelize.INTEGER,
        references: { model: "Users", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
    });
    await queryInterface.addConstraint("Followers", {
      fields: ["userId", "followerId"],
      type: "primary key",
      name: "followers_pkey",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("Followers");
  },
};
