const Sequelize = require('sequelize');
const db = require('../db');

const Trips = db.define('trips', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  status: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  route: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  milesTraveled: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
}, {
  freezeTableName: true,
  timeStamps: true,
});

module.exports.Trips = Trips;
