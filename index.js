/* eslint-disable no-param-reassign */
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const _ = require('underscore');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const throttledQueue = require('throttled-queue');
const path = require('path');

const { models } = require('./database');
const {
  getNearbyPlaces,
  getPositions,
  getPlacePhoto,
  getAutocompleteAddress,
  getYelpPhotos,
  getPlaceInfo,
  getDistanceMatrix,
} = require('./API-helpers');
const { getLocationsNearPoints, findPointsByDirections } = require('./API-helpers');

const {
  GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CLIENT_CALLBACK_URL, FRONTEND_BASE_URL,
  SESSION_SECRET, GOOGLE_MAPS_API_KEY,
} = process.env;

const app = express();
app.use(express.static(path.join(__dirname, '../your-next-stop/dist/your-next-stop')));
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

    res.redirect(`${FRONTEND_BASE_URL}/explore?id=${req.user.id}`);
  });

app.get('/', (req, res) => {
  res.status(200);
});
//* ****************************
// TRIPS
//* ****************************

// add a trip to the database
// ALSO WORKS FOR SHARING
app.post('/addTrip', (req, res) => {
  const stringifiedWayPoints = JSON.stringify(req.body.waypoints);
  const milesTraveledNum = Math.round(Number(req.body.milesTraveled.split(' ')[0].replace(/,/g, '')));
  return models.Trips.findOrCreate({
    where: {
      id: req.body.tripId || 0,
    },
    defaults: {
      route: req.body.route,
      dateStart: req.body.dateStart,
      dateEnd: req.body.dateEnd,
      wayPoints: stringifiedWayPoints,
      milesTraveled: milesTraveledNum,
    },
  }).then((trip) => {
    if (trip[1] === false) {
      models.Trips.update(
        {
          route: req.body.route,
          dateStart: req.body.dateStart,
          dateEnd: req.body.dateEnd,
          wayPoints: stringifiedWayPoints,
          milesTraveled: milesTraveledNum,
        },
        { where: { id: trip[0].dataValues.id } },
      );
    }
    const tripData = trip[0].dataValues;
    tripData.wayPoints = stringifiedWayPoints;
    models.UserTrips.findOrCreate({
      where: {
        userId: req.body.userId,
        tripId: tripData.id,
      },
    });
    res.send(tripData);
  })
    .catch((err) => {
      console.error('Err trying to create the trip in the database', err);
      res.status(400).send(err);
    });
});

// remove a trip from the database
app.post('/removeTrip', (req, res) => {
  models.UserTrips.destroy({
    where: {
      tripId: req.body.id,
    },
  }).then(() => {
    models.Trips.destroy({
      where: {
        id: req.body.id,
      },
    })
      .then(() => {
        res.send({ deleted: true });
      });
  }).catch((err) => {
    console.error(err);
    res.status(500).send(err);
  });
});

// gets all users past, current, and previous trips

app.get('/getAllUsersTrips', (req, res) => {
  models.Users.findAll({ where: { id: req.query.id } })
    .then(user => models.UserTrips.findAll({ where: { userId: user[0].id } }))
    .then(tripId => Promise.all(tripId.map((trip) => {
      return models.Trips.findAll({ where: { id: trip.tripId } });
    })))
    .then((tripArray) => {
      tripArray.map((trip) => {
        const currently = new Date();
        if (trip[0].dataValues.dateStart < currently && trip[0].dataValues.dateEnd > currently) {
          trip[0].dataValues.status = 'current';
        } else if (trip[0].dataValues.dateStart > currently) {
          trip[0].dataValues.status = 'upcoming';
        } else if (trip[0].dataValues.dateEnd < currently) {
          trip[0].dataValues.status = 'previous';
        }
        trip[0].dataValues.wayPoints = JSON.parse(trip[0].dataValues.wayPoints);
      });
      res.status(200).send(tripArray);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});


//* ****************************
// SHARING
//* ****************************

//* ****************************
// STATS
//* ****************************

app.get('/getStats', (req, res) => {
  const statsObj = {};
  statsObj.cities = [];
  statsObj.milesTraveled = 0;
  statsObj.numberOfCities = 0;
  const currently = new Date();
  models.Users.findAll({ where: { id: req.query.id } })
    .then(user => models.UserTrips.findAll({ where: { userId: user[0].id } }))
    .then(tripId => Promise.all(tripId.map(trip => models.Trips.findAll({
      where:
      { id: trip.tripId },
    }))))
    .then((tripArray) => {
      const previousTrips = tripArray.filter(trip => trip[0].dataValues.dateEnd < currently);
      previousTrips.forEach((prevTrip) => {
        const citiesArr = prevTrip[0].route.split(' -> ');
        statsObj.milesTraveled += prevTrip[0].milesTraveled;
        statsObj.cities.push(citiesArr);
      });
      statsObj.cities = _.uniq(_.flatten(statsObj.cities));
      statsObj.numberOfCities = statsObj.cities.length;
      statsObj.numberOfTrips = previousTrips.length;
    })
    .then(() => models.UserInterests.findAll({ where: { userId: req.query.id } }))
    .then((interests) => {
      const interestsObj = interests[0].dataValues;
      const interestsArr = [];
      for (const category in interestsObj) {
        interestsArr.push([category, interestsObj[category]]);
      }
      const sortedInterestsArray = interestsArr.sort((a, b) => b[1] - a[1]);
      const sortedArray = sortedInterestsArray.filter(interestArr => interestArr[0] !== 'id' && interestArr[0] !== 'userId');
      statsObj.top5Interests = sortedArray.map(arr => arr[0]).slice(0, 5);
      // sometimes you need to add .flat() to line 237
    })
    .then(() => {
      res.send(statsObj);
    })
    .catch((err) => {
      res.status(400).send(err);
    });
});


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
      const city = `${req.body.address.split(', ')[1]} ${req.body.address.split(', ')[2]}`;
      return models.Places.findOrCreate({
        where: {
          placeId: req.body.placeId,
          userId: req.body.userId,
        },
        defaults: {
          name: req.body.name,
          coords: JSON.stringify(req.body.coordinates),
          hours: req.body.hours.join() || null,
          city,
          address: req.body.address.split(',')[0],
          placeId: req.body.placeId,
          priceLevel: req.body.priceLevel,
          rating: req.body.rating,
          website: req.body.website,
          phone: req.body.phone,
          // photo: imgUrl,
          photo: req.body.photoRef,
          userId: req.body.userId,
          status: req.body.status,
        },
      });
    })
    .then((result) => {
      if (!result[1]) {
        return models.Places.update({ status: req.body.status }, {
          where: {
            name: req.body.name,
            userId: req.body.userId,
          },
        });
      }
      res.status(200);
    })
    .then(() => {
      res.status(200);
    })
    .catch((err) => {
      console.error(err);
    });
});

app.delete('/likedInterest', (req, res) => {
  models.Places.destroy({
    where: {
      userId: req.query.userId,
      placeId: req.query.placeId,
    },
  })
    .then(() => {
      res.status(202);
    })
    .catch(err => console.error(err));
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

// Get info for a place
app.get('/getPlaceInfo', (req, res) => {
  const placeInfo = {};

  models.Places.findOne({
    where: { placeId: req.query.placeId, userId: req.query.userId },
  })
    .then((result) => {
      if (result) placeInfo.status = result.status;
      else placeInfo.status = false;
    })
    .then(() => getPlaceInfo(req.query.placeId))
    .then((response) => {
      const {
        // eslint-disable-next-line camelcase
        formatted_address, formatted_phone_number, icon, name, opening_hours, place_id, price_level,
        rating, url, website, photos, types, geometry,
      } = response.data.result;
      Object.assign(placeInfo, {
        address: formatted_address,
        coordinates: geometry.location,
        phone: formatted_phone_number,
        icon,
        name,
        hours: opening_hours.weekday_text,
        open: opening_hours.open_now,
        category: types[0],
        placeId: place_id,
        // eslint-disable-next-line camelcase
        priceLevel: price_level || Math.floor(Math.random() * 5),
        rating: Math.round(100 * rating) / 100,
        GoogleMapsUrl: url || photos[0].html_attributions[0],
        website: website || 'No website available',
        // photo: photos[0].photo_reference || icon,
      });

      const photoRef = photos[0].photo_reference;
      return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${GOOGLE_MAPS_API_KEY}`;
    })
    .then((imgUrl) => {
      placeInfo.photo = imgUrl;
      res.send(placeInfo);
    })
    .catch(err => console.error(err));
});

//  POST /saveForLater
// when something is saved for later - save to places
// under user places set status to 'saved'
app.post('/saveForLater', (req, res) => models.Places.findOrCreate({
  where: {
    name: req.body.name,
    userId: req.body.userId,
    status: 'saved',
  },
}).then(response => res.send(response))
  .catch((err) => {
    console.error('Err trying to save this place in the database', err);
    res.status(400).send(err);
  }));

//  GET a user's places for Places page
app.get('/getLikedAndSavedForLater', (req, res) => {
  const placesObj = {};
  placesObj.savedPlaces = [];
  placesObj.likedPlaces = [];
  models.Places.findAll({ where: { userId: req.query.id } })
    .then((response) => {
      response.forEach((place) => {
        if (place.status === 'saved') {
          placesObj.savedPlaces.push(place);
        } else {
          placesObj.likedPlaces.push(place);
        }
      });
      res.send(placesObj);
    })
    .catch((err) => {
      console.error('Err trying to get user places from the database', err);
      res.status(400).send(err);
    });
});

//* ****************************
// VISTITED PLACES
//* ****************************

// GET ALL NEARBY PLACES
// this endpoint should hit when SHOW ALL RESULTS button is clicked in the Explore page
// returns an array of arrays where each array contains a bunch of objects: [[{}, {}, ...], ...]
// each inner array represets an interest while each object is a nearby place
app.get('/nearbyPlaces', (req, res) => {
  models.Users.findAll({ where: { id: req.query.id } })
    .then(user => models.UserInterests.findOrCreate({ where: { userId: user[0].id } }))
    .then((interests) => {
      const interestsObj = interests[0].dataValues;
      const interestsArr = [];
      for (const category in interestsObj) {
        interestsArr.push([category, interestsObj[category]]);
      }
      const sortedInterestsArray = interestsArr.sort((a, b) => b[1] - a[1]);
      const sortedArray = sortedInterestsArray.filter(interestArr => interestArr[0] !== 'id' && interestArr[0] !== 'userId');
      return sortedArray.map(arr => arr[0]);
      // sometimes you need to add .flat() to line 344
    })
    .then(sortedInterestsArr => Promise.all(getNearbyPlaces(req.query.location, sortedInterestsArr, req.query.snapshotUrl)))
    .then((response) => {
      let filteredRes = [];
      if (req.query.snapshotUrl === '/results') {
        const filteredArr = response.filter(arr => arr.length > 1);
        filteredArr.forEach((interestArr) => {
          interestArr.forEach((placeObj) => {
            const imageRef = placeObj.photos;
            const imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${imageRef}&key=${GOOGLE_MAPS_API_KEY}`;
            placeObj.photoUrl = imageUrl;
          });
        });
        filteredRes = filteredArr;
      } else {
        response.forEach((interestArr) => {
          for (let i = 0; i < interestArr.length; i += 1) {
            if (i > 4) break;
            filteredRes.push(interestArr[i]);
          }
        });
      }
      res.status(200).send(filteredRes);
    })
    .catch((err) => {
      console.error(err);
    });
});

app.get('/nearbyPlacesByCategory', (req, res) => {
  Promise.all(getNearbyPlaces(req.query.location, req.query.category))
    .then((result) => {
      const filteredRes = result[0].slice(0, 3);
      res.status(200).send(filteredRes);
    })
    .catch(err => console.error(err));
});

app.get('/routePositions', (req, res) => {
  getPositions(req.query)
    .then((coords) => {
      const filtered = coords.map((location, index) => {
        if (index < 2) {
          return {
            lat: location.json.results[0].geometry.location.lat,
            lng: location.json.results[0].geometry.location.lng,
            placeId: location.json.results[0].place_id || 'no id',
          };
        }
        return {
          location: {
            lat: location.json.results[0].geometry.location.lat,
            lng: location.json.results[0].geometry.location.lng,
            placeId: location.json.results[0].place_id || 'no id',
          },
        };
      });

      res.status(200).send(filtered);
    })
    .catch(err => console.error(err));
});

app.get('/placePhoto', (req, res) => {
  getPlacePhoto(req.query)
    .then((photo) => {
      res.set('Content-Type', photo.headers['content-type']);
      res.status(200).send(Buffer.from(photo.data, 'base64'));
    })
    .catch(err => console.error(err));
});

app.get('/autocompleteAddress', (req, res) => {
  getAutocompleteAddress(req.query)
    .then((suggestion) => {
      const filterSuggestions = suggestion.json.predictions.map(place => place.description);
      res.status(200).send(filterSuggestions);
    })
    .catch(err => console.error(err));
});

const throttle = throttledQueue(1, 300);
app.get('/yelpAPI', (req, res) => {
  const coordinates = {
    lat: req.query.latitude,
    lng: req.query.longitude,
    term: req.query.name,
  };
  throttle(() => {
    getYelpPhotos(coordinates)
      .then((response) => {
        const filteredRes = {
          photos: [response.data.image_url].concat(response.data.photos),
          name: response.data.name,
          phone: response.data.phone,
        };
        res.status(200).send(filteredRes);
      })
      .catch(err => console.error(err));
  });
});

app.get('/eta', (req, res) => {
  const query = {
    origin: req.query.origin_addresses,
    destination: req.query.destination_addresses,
    waypoints: req.query.waypoints,
  };
  getDistanceMatrix(query)
    .then((response) => {
      res.status(200).send(response);
    })
    .catch(err => console.error(err));
});

app.get('/routeSuggestions', (req, res) => {
  const { loc1, loc2, category } = req.query;
  const [loc1Lat, loc1Lng, loc2Lat, loc2Lng] = [...loc1.split(','), ...loc2.split(',')].map(num => Number(num));
  getLocationsNearPoints(loc1Lat, loc1Lng, loc2Lat, loc2Lng, category)
    .then((result) => {
      res.status(200).send(result);
    })
    .catch((err) => {
      console.error(err);
      res.status(500);
    });
});

app.get('/routeDirectionsSuggestions', (req, res) => {
  const {
    loc1, loc2, waypoints, category,
  } = req.query;
  findPointsByDirections(loc1, loc2, waypoints, category)
    .then((suggestions) => {
      const formattedSuggestions = [];
      suggestions.forEach(locations => locations.forEach((location, index) => {
        switch (index) {
          case 0: location.zoomLevel = 1; break;
          case 1: location.zoomLevel = 6; break;
          case 2: location.zoomLevel = 6; break;
          case 3: location.zoomLevel = 7; break;
          case 4: location.zoomLevel = 7; break;
          case 5: location.zoomLevel = 8; break;
          case 6: location.zoomLevel = 8; break;
          case 7: location.zoomLevel = 9; break;
          case 8: location.zoomLevel = 9; break;
          default: location.zoomLevel = 10; break;
        }
        formattedSuggestions.push(location);
      }));
      res.status(200).send(formattedSuggestions);
    })
    .catch((err) => {
      console.error(err);
      res.status(500);
    });
});
const PORT = 4201;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
