const Sequelize = require('sequelize');
const db = require('../db');

const UserTrips = db.define('usertrips', {
  id: {
    type: Sequelize.INTEGER(11),
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: Sequelize.INTEGER(11),
    allowNull: false,
  },
  tripId: {
    type: Sequelize.INTEGER(11),
    allowNull: true,
  },
}, {
  freezeTableName: true,
  timeStamps: true,
});

module.exports.UserTrips = UserTrips;
