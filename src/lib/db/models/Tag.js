import { Model } from "sequelize";

// Ported verbatim (logic) from backend/models/Tag.js — association and toJSON
// redaction unchanged. Only the module wrapper is adapted to an ES module factory.
export default (sequelize, DataTypes) => {
  class Tag extends Model {
    static associate({ Article }) {
      // Tag list
      this.belongsToMany(Article, {
        through: "TagList",
        foreignKey: "tagName",
        timestamps: false,
      });
    }

    toJSON() {
      return {
        ...this.get(),
        id: undefined,
        userId: undefined,
        TagList: undefined,
      };
    }
  }

  Tag.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
      },
    },
    {
      sequelize,
      modelName: "Tag",
      timestamps: false,
    },
  );

  return Tag;
};
