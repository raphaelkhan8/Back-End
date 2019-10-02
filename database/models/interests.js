const Sequelize = require('sequelize');
const db = require('../db');

const Interests = db.define('interests', {
  id: {
    type: Sequelize.INTEGER(11),
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
}, {
  freezeTableName: true,
  timeStamps: true,
});

module.exports.Interests = Interests;
