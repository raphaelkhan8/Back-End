require('dotenv').config();

const express = require('express');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { db, models } = require('./database');
const {
  getNearbyPlaces,
  getPositions,
  getPlacePhoto,
  getAutocompleteAddress,
} = require('./API-helpers');


const {
  GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
  GOOGLE_CLIENT_CALLBACK_URL, FRONTEND_BASE_URL, SESSION_SECRET,
} = process.env;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true },
}));
app.use(passport.initialize());
app.use(passport.session());


//* ****************************
// GOOGLE SIGN IN
//* ****************************
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


//* ****************************
// CORS HEADERS
//* ****************************
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


//* ****************************
// AUTH
//* ****************************

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: `${FRONTEND_BASE_URL}` }),
  (req, res) => {
    // Successful authentication, redirect to explore page.
    console.log('REQ.USER!!!!!', req.user);
    res.redirect(`${FRONTEND_BASE_URL}/explore?id=${req.user.id}`);
  });


//* ****************************
// TRIPS
//* ****************************

// add a trip to the database
// ALSO WORKS FOR SHARING
app.post('/addTrip', (req, res) => {
  console.log('req.bodyyyy', req.body);
  return models.Trips.findOrCreate({
    where: { route: req.body.route },
  })
    .then((trip) => {
      const tripData = trip[0].dataValues;
      console.log(tripData);
      models.UserTrips.findOrCreate({
        where: {
          userId: req.body.userId,
          tripId: tripData.id,
        },
      });
      res.send(tripData);
    })
    .catch((err) => {
      console.log('Err trying to create the trip in the database', err);
      res.status(400).send(err);
    });
});

// remove a trip from the database
app.post('/removeTrip', (req, res) => {
  console.log('REQBODDY', req.body);
  console.log('REQBODDY', req.body.id);
  models.UserTrips.destroy({
    where: {
      tripId: req.body.id,
    },
  }).then(() => {
    models.Trips.destroy({
      where: {
        route: req.body.route,
      },
    })
      .then(() => {
        res.send(201);
      });
  }).catch((err) => {
    console.error(err);
  });
});

// gets all users past, current, and previous trips
app.get('/getAllUsersTrips', (req, res) => {
  console.log('req.parammmmm', req.query);
  models.Users.findAll({ where: { id: req.query.id } })
    .then((user) => {
      console.log(user);
      return models.UserTrips.findAll({ where: { userId: user[0].id } });
    })
    .then(tripId => Promise.all(tripId.map((trip) => {
      console.log('DISDATRIPIDDD', trip);
      return models.Trips.findAll({ where: { id: trip.tripId } });
    })))
    .then((response) => {
      console.log(response);
      res.send(response);
    })
    .catch((err) => {
      console.log('Err trying to get user trips from the database', err);
      res.status(400).send(err);
    });
});

//* ****************************
// CITIES
//* ****************************

//* ****************************
// SHARING
//* ****************************

//* ****************************
// STATS
//* ****************************

// app.get('/getStats', (req, res) => {

// });


//* ****************************
// INTERESTS
//* ****************************

// likes an interest
app.post('/likedInterest', (req, res) => {
  const field = req.body.interest;
  models.UserInterests.findOne({
    where: { userId: req.body.userId },
  })
    .then((instance) => {
      instance.increment(field);
      return models.Places.findOrCreate({
        where: {
          name: req.body.name,
          userId: req.body.userId,
          status: 'liked',
        },
      });
    });
});

// dislikes an interest
app.post('/dislikedInterest', (req, res) => {
  const field = req.body.interest;
  models.UserInterests.findOne({
    where: { userId: req.body.id },
  })
    .then(instance => instance.decrement(field))
    .then((response) => {
      res.send(response);
    })
    .catch((err) => {
      console.error(err);
    });
});

// deletes interest
app.post('/deleteInterest', (req, res) => {
  // const field = req.body.interest;
  models.UserInterests.findOne({
    where: { userId: req.body.id },
  })
    .then((instance) => {
      const field = req.body.interest;
      instance.decrement([field], { by: 50 });
    })
    .then((response) => {
      res.send(response);
    })
    .catch((err) => {
      console.error(err);
    });
});


//* ****************************
// YOUR PLACES
//* ****************************

//  POST /saveForLater
// when something is saved for later - save to places
// under user places set status to 'saved'
app.post('/saveForLater', (req, res) => {
  console.log('req.bodyyyy', req.body);
  return models.Places.findOrCreate({
    where: {
      name: req.body.name,
      userId: req.body.userId,
      status: 'saved',
    },
  }).then(response => res.send(response))
    .catch((err) => {
      console.log('Err trying to save this place in the database', err);
      res.status(400).send(err);
    });
});


//  GET /getLikedAndSavedForLater
app.get('/getLikedAndSavedForLater', (req, res) => {
  console.log('req.parammmmm', req.query);
  models.Places.findAll({ where: { userId: req.query.userId } })
    .then((response) => {
      console.log(response);
      res.send(response);
    })
    .catch((err) => {
      console.log('Err trying to get user places from the database', err);
      res.status(400).send(err);
    });
});


//* ****************************
// VISTITED PLACES
//* ****************************

// GET ALL NEARBY PLACES
// this endpoint should hit when SHOW ALL RESULTS button is clicked in the Explore page
app.get('/nearbyPlaces', (req, res) => {
  models.Users.findAll({ where: { id: req.query.id } })
    .then((user) => {
      console.log(user);
      return models.UserInterests.findAll({ where: { userId: user[0].id } });
    })
    .then((interests) => {
      const interestsObj = interests[0].dataValues;
      const interestsArr = [];
      for (const category in interestsObj) {
        interestsArr.push([category, interestsObj[category]]);
      }
      const sortedInterestsArray = interestsArr.sort((a, b) => b[1] - a[1]);
      const sortedArray = sortedInterestsArray.filter(interestArr => interestArr[0] !== 'id' && interestArr[0] !== 'userId');
      return sortedArray.map(arr => arr[0]).flat();
    })
    .then((sortedInterestsArr) => {
      Promise.all(getNearbyPlaces(req.query.location, sortedInterestsArr))
        .then((response) => {
          res.send(response.filter(array => array !== []));
        });
    })
    .catch((err) => {
      console.error(err);
    });
});

app.get('/routePositions', (req, res) => {
  getPositions(req.query)
    .then((coords) => {
      // console.log(coords)
      res.status(200).send(coords);
    })
    .catch(err => console.error(err));
});

app.get('/placePhoto', (req, res) => {
  getPlacePhoto(req.query)
    .then((photo) => {
      console.log(photo);
      res.set('Content-Type', photo.headers['content-type']);
      res.status(200).send(Buffer.from(photo.data, 'base64'));
    })
    .catch(err => console.error(err));
});


app.get('/autocompleteAddress', (req, res) => {
  getAutocompleteAddress(req.query)
    .then((suggestion) => {
      console.log(suggestion);
      const filterSuggestions = suggestion.json.predictions.map(place => place.description);
      res.status(200).send(filterSuggestions);
    })
    .catch(err => console.error(err));
});


const PORT = 4201;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
