const Sequelize = require('sequelize');
const db = require('../db');

const UserPlaces = db.define('userplaces', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  status: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  userId: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  userPlacesId: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
}, {
  freezeTableName: true,
  timeStamps: true,
});

module.exports.UserPlaces = UserPlaces;
