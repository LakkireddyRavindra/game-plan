'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Session extends Model {
    static associate(models) {
      Session.belongsTo(models.Sport, { foreignKey: 'sportId', as: 'sport' });
      Session.belongsTo(models.User, { foreignKey: 'creatorId', as: 'creator' });
      Session.belongsToMany(models.User, {
        through: models.PlayerSession,
        foreignKey: 'sessionId',
        as: 'players',
      });
    }
  }

  Session.init(
    {
      sportId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Sports',
          key: 'id',
        },
      },
      creatorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      location: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      startTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      endTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      availableSpots: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      maxPlayers: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10, 
      },
    },
    {
      sequelize,
      modelName: 'Session',
      tableName: 'Sessions',
    }
  );

  return Session;
};
