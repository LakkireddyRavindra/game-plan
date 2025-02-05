'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define associations here

      // A User can create multiple Sessions
      this.belongsToMany(models.Session, {
        through: models.PlayerSession,
        foreignKey: 'userId',
        as: 'sessions',
      });

      // Example: If Users can also belong to Sports
      this.belongsToMany(models.Sport, { 
        through: models.PlayerSession, 
        foreignKey: 'userId', 
        as: 'sports' 
      });
    }
  }

  // Initialize the User model
  User.init(
    {
      Name: {
        type: DataTypes.STRING,
        allowNull: false, 
        validate: {
          notEmpty: true,
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false, 
        unique: true, 
        validate: {
          isEmail: true, 
        },
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false, 
        validate: {
          isIn: [['admin', 'player', 'coach']], 
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false, 
        validate: {
          len: [6, 100],
        },
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'Users', 
      timestamps: true, 
    }
  );

  return User;
};
