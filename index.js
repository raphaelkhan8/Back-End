require('dotenv').config();

const express = require('express');
const cors = require('cors');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { models } = require('./database');
const { getNearbyPlaces, getPositions } = require('./API-helpers');

const app = express();

app.use(express.json());
app.use(cors());
app.use(passport.initialize());
app.use(passport.session());

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CLIENT_CALLBACK_URL } = process.env;

passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: GOOGLE_CLIENT_CALLBACK_URL,
},
((accessToken, refreshToken, profile, cb) => {
  console.log('!!!!!THISISPROFILE!!!!', profile);
  models.Users.findOrCreate({
    where: { googleId: profile.id },
    defaults: { username: profile.displayName },
  })
    .then(([user]) => {
      console.log(user);
      console.log('dsfloskldkgslkjldslkjkdjkfgkfjdklgdklgjkhdfg');
      cb(null, user);
    })
    .catch(error => cb(null, error));
})));

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser((id, done) => {
  models.Users.findById(id, (err, user) => {
    done(err, user);
  });
});

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Contorl-Allow-Methods', 'OPTIONS, GET, POST, PUT, DELETE');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    console.log(`${req.ip} ${req.method} ${req.url}`);
    next();
  }
});

app.get('/', (req, res) => {
  res.send({ message: 'HELLO WORLD' });
});


//* ****************************
// AUTH
//* ****************************

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: 'http://localhost:4200/' }),
  (req, res) => {
    res.redirect('http://localhost:4200/explore');
  });


//* ****************************
// USERS
//* ****************************

// add a user to the users table
// app.post('/users', (req, res) => {
//   console.log('req.bodyyyy', req.body);
//   models.Users.create(req.body)
//     .then((user) => {
//       res.send(user);
//     }).catch((err) => {
//       console.log('Err trying to create the user in the database', err);
//       res.status(400).send(err);
//     });
// });


//* ****************************
// TRIPS
//* ****************************

// get all trips from the database
app.get('/getAllTrips', (req, res) => {
  console.log('req.bodyyyy', req.body);
  models.Trips.findAll()
    .then((trips) => {
      const tripsArray = trips;
      // console.log(tripsArray);
      res.send(tripsArray);
    }).catch((err) => {
      console.log('Err trying to create the trip in the database', err);
      res.status(400).send(err);
    });
});


// add a trip to the database
app.post('/addTrip', (req, res) => {
  console.log('req.bodyyyy', req.body);
  models.Trips.create(req.body)
    .then((trip) => {
      const tripData = trip.dataValues;
      console.log(tripData);
      res.send(tripData);
    }).catch((err) => {
      console.log('Err trying to create the trip in the database', err);
      res.status(400).send(err);
    });
});


//* ****************************
// CITIES
//* ****************************

//* ****************************
// INTERESTS
//* ****************************

//* ****************************
// VISTITED PLACES
//* ****************************

// GET NEARBY PLACES

app.get('/nearbyPlaces', (req, res) => {
  getNearbyPlaces(req.query.location)
    .then((response) => {
      const locations = response.json.results.map(place => ({
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
      }));
      res.status(200).send(locations);
    })
    .catch((err) => {
      console.warn(err);
      res.status(500).send(err);
    });
});

app.get('/getRoutePositions', (req, res) => {
  getPositions(req.query)
    .then((coords) => {
      console.log(coords);
      res.status(200).send(coords);
    })
    .catch(err => console.error(err));
});
const PORT = 4201;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
