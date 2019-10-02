const Sequelize = require('sequelize');
const db = require('../db');

const VisitedPlaces = db.define('visitedplaces', {
  id: {
    type: Sequelize.INTEGER(11),
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  description: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  city: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  address: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  hours: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  phone: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  photo: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  interestsId: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
}, {
  freezeTableName: true,
  timeStamps: true,
});

module.exports.VisitedPlaces = VisitedPlaces;
