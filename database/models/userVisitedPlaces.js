const Sequelize = require('sequelize');
const db = require('../db');

const UserVisitedPlaces = db.define('uservisitedplaces', {
  id: {
    type: Sequelize.INTEGER(11),
    autoIncrement: true,
    primaryKey: true,
  },
  weightEffect: {
    type: Sequelize.INTEGER(11),
    allowNull: true,
  },
  userId: {
    type: Sequelize.INTEGER(11),
    allowNull: false,
  },
  visitedPlacesId: {
    type: Sequelize.INTEGER(11),
    allowNull: true,
  },
}, {
  freezeTableName: true,
  timeStamps: true,
});

module.exports.UserVisitedPlaces = UserVisitedPlaces;
