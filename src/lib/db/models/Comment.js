import { Model } from "sequelize";

// Ported verbatim (logic) from backend/models/Comment.js — associations and toJSON
// redaction unchanged. Only the module wrapper is adapted to an ES module factory.
export default (sequelize, DataTypes) => {
  class Comment extends Model {
    static associate({ User, Article }) {
      this.belongsTo(Article, { foreignKey: "articleId" });
      this.belongsTo(User, { as: "author", foreignKey: "userId" });
    }

    toJSON() {
      return {
        ...this.get(),
        articleId: undefined,
        userId: undefined,
      };
    }
  }

  Comment.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      body: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "Comment",
    },
  );

  return Comment;
};
