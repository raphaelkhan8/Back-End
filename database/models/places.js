const Sequelize = require('sequelize');
const db = require('../db');

const Places = db.define('places', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  status: {
    type: Sequelize.STRING,
    allowNull: false,
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
  coords: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  hours: {
    type: Sequelize.STRING(1234),
    allowNull: true,
  },
  phone: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  photo: {
    type: Sequelize.STRING(1234),
    allowNull: true,
  },
  priceLevel: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  rating: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  website: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  placeId: {
    type: Sequelize.STRING,
    allowNull: true,
  },
}, {
  freezeTableName: true,
  timeStamps: true,
});

module.exports.Places = Places;
