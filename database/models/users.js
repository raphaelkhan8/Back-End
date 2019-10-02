const Sequelize = require('sequelize');
const db = require('../db');

const Users = db.define('users', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  statsId: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  username: {
    type: Sequelize.STRING,
    allowNull: true,
  },
}, {
  freezeTableName: true,
  timeStamps: true,
});

module.exports.Users = Users;
