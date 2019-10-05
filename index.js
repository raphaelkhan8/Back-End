require('dotenv').config();

const express = require('express');
const { db, models } = require('./database');
const { getNearbyPlaces } = require('./API-helpers');

const app = express();

app.use(express.json());

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
// USERS
//* ****************************

// add a user to the users table
app.post('/users', (req, res) => {
  console.log('req.bodyyyy', req.body);
  models.Users.create(req.body)
    .then((user) => {
      res.send(user);
    }).catch((err) => {
      console.log('Err trying to create the user in the database', err);
      res.status(400).send(err);
    });
});


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

//GET NEARBY PLACES

app.get('/nearbyPlaces', (req, res) => {
  getNearbyPlaces(req.query.location)
    .then((response) => {
      res.status(200).send(response)
    })
    .catch((err) => {
      console.warn(err);
      res.status(500).send(err);
    })
})

const PORT = 4201;

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server listening on port ${PORT}`);
});
