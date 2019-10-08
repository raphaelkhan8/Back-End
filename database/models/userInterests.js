const Sequelize = require('sequelize');
const db = require('../db');

const UserInterests = db.define('userinterests', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  amusement_park: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  aquariam: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  art_gallery: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  bakery: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  bar: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  book_store: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  cafe: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  campground: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  clothing_store: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  gym: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  lodging: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  movie_theater: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  museum: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  night_club: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  park: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  restaurant: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  shopping_mall: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  spa: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  tourist_attraction: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  zoo: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  defaultValue: 0,
  freezeTableName: true,
  timestamps: false,
});

module.exports.UserInterests = UserInterests;
