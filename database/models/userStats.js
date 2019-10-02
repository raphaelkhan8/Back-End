const Sequelize = require('sequelize');
const db = require('../db');

const UserStats = db.define('userstats', {
  id: {
    type: Sequelize.INTEGER(11),
    autoIncrement: true,
    primaryKey: true,
  },
  milesTraveled: {
    type: Sequelize.INTEGER(11),
    allowNull: true,
  },
  visitedCities: {
    type: Sequelize.INTEGER(11),
    allowNull: true,
  },
  topInterests: {
    type: Sequelize.INTEGER(11),
    allowNull: true,
  },
}, {
  freezeTableName: true,
  timeStamps: true,
});

module.exports.UserStats = UserStats;
