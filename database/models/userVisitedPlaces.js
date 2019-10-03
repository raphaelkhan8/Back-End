const Sequelize = require('sequelize');
const db = require('../db');

const UserVisitedPlaces = db.define('uservisitedplaces', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  weightEffect: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  userId: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  visitedPlacesId: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
}, {
  freezeTableName: true,
  timeStamps: true,
});

module.exports.UserVisitedPlaces = UserVisitedPlaces;
