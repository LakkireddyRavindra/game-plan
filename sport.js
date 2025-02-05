'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Sport extends Model {
    static associate(models) {
      Sport.hasMany(models.Session, { foreignKey: 'sportId', as: 'sessions' });
    }
  }

  Sport.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Sport',
      tableName: 'Sports',
    }
  );

  return Sport;
};
