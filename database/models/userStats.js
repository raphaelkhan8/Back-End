const Sequelize = require('sequelize');
const db = require('../db');

const UserStats = db.define('userstats', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  milesTraveled: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  visitedCities: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  topInterests: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
}, {
  freezeTableName: true,
  timeStamps: true,
});

module.exports.UserStats = UserStats;
