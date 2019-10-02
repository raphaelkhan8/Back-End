const Sequelize = require('sequelize');
const db = require('../db');

const Cities = db.define('cities', {
  id: {
    type: Sequelize.INTEGER(11),
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: true,
  },
}, {
  freezeTableName: true,
  timeStamps: true,
});

module.exports.Cities = Cities;
