const Sequelize = require('sequelize');
const db = require('../db');

const UserInterests = db.define('userinterests', {
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
  interestId: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
}, {
  freezeTableName: true,
  timeStamps: true,
});

module.exports.UserInterests = UserInterests;
