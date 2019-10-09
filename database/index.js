const { Users } = require('./models/users');
const { Cities } = require('./models/cities');
const { Trips } = require('./models/trips');
const { Interests } = require('./models/interests');
const { Places } = require('./models/places');
const { UserCities } = require('./models/userCities');
const { UserTrips } = require('./models/userTrips');
const { UserStats } = require('./models/userStats');
const { UserInterests } = require('./models/userInterests');
const { UserVisitedPlaces } = require('./models/userVisitedPlaces');

const db = require('./db');

const models = {
  Users,
  Cities,
  Trips,
  Interests,
  Places,
  UserCities,
  UserStats,
  UserTrips,
  UserInterests,
  UserVisitedPlaces,
};

models.Users.sync();
models.UserStats.sync();
models.Cities.sync();
models.Trips.sync();
models.Interests.sync();
models.Places.sync();
models.UserCities.sync();
models.UserStats.sync();
models.UserTrips.sync();
models.UserInterests.sync();
models.UserVisitedPlaces.sync();

db.authenticate()
  .then(() => {
    console.log('Connected to the database.');
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });


module.exports = { db, models };
