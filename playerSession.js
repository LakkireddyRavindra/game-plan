
'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class PlayerSession extends Model {
    static associate(models) {
      // Correct the associations
      PlayerSession.belongsTo(models.User, { foreignKey: 'userId', as: 'player' });
      PlayerSession.belongsTo(models.Session, { foreignKey: 'sessionId', as: 'session' });
    }
  }

  PlayerSession.init(
    {
      userId: {  
        type: DataTypes.INTEGER,
        allowNull: false,  
        references: {
          model: 'Users',
          key: 'id',
        },
        field: 'userId',
      },
      sessionId: { 
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Sessions',
          key: 'id',
        },
      },
      SportId: {  
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Sports',
          key: 'id',
        },
      },
    },
    {
      sequelize,
      modelName: 'PlayerSession',
      tableName: 'PlayerSessions',
    }
  );

  return PlayerSession;
};
