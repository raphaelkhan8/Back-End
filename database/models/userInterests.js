const Sequelize = require('sequelize');
const db = require('../db');

const UserInterests = db.define('userinterests', {
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
  interestId: {
    type: Sequelize.INTEGER(11),
    allowNull: true,
  },
}, {
  freezeTableName: true,
  timeStamps: true,
});

module.exports.UserInterests = UserInterests;
