const Sequelize = require('sequelize');
const db = require('../db');

const Trips = db.define('trips', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  dateStart: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  dateEnd: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  route: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  wayPoints: {
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
