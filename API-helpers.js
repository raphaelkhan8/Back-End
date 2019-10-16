const axios = require('axios');
const throttledQueue = require('throttled-queue');

const { GOOGLE_MAPS_API_KEY } = process.env;
const { YELP_API_KEY } = process.env;

const googleMapsClient = require('@google/maps').createClient({
  key: GOOGLE_MAPS_API_KEY,
  Promise,
});

// const decode = (encodedObj) => {

// };

const getNearbyPlaces = (location, interests, snapshotUrl) => {
  // lat: 29.96768435314543,
  // lng: -90.05025405587452
  // console.log(snapshotUrl);
  // console.log(location);
  // console.log(interests);
  let newInterests;
  if (snapshotUrl === '/results') {
    newInterests = interests.slice(0, 5);
  } else {
    newInterests = [interests[0], interests[12]];
  }
  // console.log(newInterests);
  const usersNearbyPlaces = newInterests.map((interest) => {
    const options = {
      // location: `29.96768435314543,-90.05025405587452`,
      location,
      keyword: `${interest}`,
      opennow: false,
      rankby: 'distance',
    };
    return googleMapsClient
      .placesNearby(options)
      .asPromise()
      .then((response) => {
        console.log(response);
        const filteredLocations = response.json.results.filter(place => place.photos);
        const locations = filteredLocations.map((place) => {
          const cityAndState = `${place.plus_code.compound_code.split(' ')[1]} ${place.plus_code.compound_code.split(' ')[2]} ${place.plus_code.compound_code.split(' ')[3]}`;
          const responseFields = {
            name: place.name,
            placeId: place.place_id,
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
            city: cityAndState,
            address: place.vicinity,
            icon: place.icon,
            priceLevel: place.price_level,
            rating: place.rating,
            interest: options.keyword,
            photos: place.photos[0].photo_reference,
          };
          return responseFields;
        });
        return locations;
        // res.status(200).send(locations.slice(0, 5));
      })
      .catch((err) => {
        console.warn(err);
        // res.status(500).send(err);
      });
  });
  console.log(usersNearbyPlaces);
  return usersNearbyPlaces;
};

const getPositions = (addresses) => {
  const allPromises = [];
  allPromises.push(googleMapsClient.geocode({ address: addresses.origin }).asPromise());
  allPromises.push(googleMapsClient.geocode({ address: addresses.destination }).asPromise());

  if (addresses.waypoints) {
    const waypoints = addresses.waypoints.split(';');
    waypoints
      .filter(waypoint => !!waypoint)
      .forEach(waypoint => allPromises.push(googleMapsClient.geocode({ address: waypoint }).asPromise()));
  }
  return Promise.all(allPromises);
};

const getPlacePhoto = (photoRef) => {
  const options = {
    key: GOOGLE_MAPS_API_KEY,
    photoreference: photoRef.ref,
    maxheight: 200,
  };

  return axios.get('https://maps.googleapis.com/maps/api/place/photo', {
    responseType: 'arraybuffer',
    params: options,
  });

  // return googleMapsClient.placesPhoto(options).asPromise();
};

const getAutocompleteAddress = (query) => {
  const options = {
    input: query.input,
    components: { country: 'us' },
  };
  if (query.location.length) {
    options.location = query.location;
    options.radius = 10000;
  }
  return googleMapsClient.placesAutoComplete(options).asPromise();
};

const getDistanceMatrix = (query) => {
  console.log(query);
  const { destination, origin } = query;
  return axios.get(`https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${origin}&destinations=${destination}&key=${GOOGLE_MAPS_API_KEY}`);
};

const getYelpPhotos = (coordinates) => {
  const throttle = throttledQueue(1, 200);
  const options = {
    latitude: coordinates.lat,
    longitude: coordinates.lng,
    term: coordinates.term,
    radius: 500,
  };
  const headers = {
    Authorization: `Bearer ${YELP_API_KEY}`,
  };
  return axios.get('https://api.yelp.com/v3/businesses/search', { params: options, headers })
    .then((response) => {
      if (response.data.businesses[0] === undefined) {
        console.log(response);
      }
      const { id } = response.data.businesses[0];
      return axios.get(`https://api.yelp.com/v3/businesses/${id}`, { headers });
    });
};

const getPlaceInfo = (placeId) => {
  const options = {
    key: GOOGLE_MAPS_API_KEY,
    place_id: placeId,
  };
  return axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
    params: options,
  });
};

module.exports.getYelpPhotos = getYelpPhotos;
module.exports.getAutocompleteAddress = getAutocompleteAddress;
module.exports.getPositions = getPositions;
module.exports.getNearbyPlaces = getNearbyPlaces;
module.exports.getPlacePhoto = getPlacePhoto;
module.exports.getPlaceInfo = getPlaceInfo;

// const throttle = function(callback, limit) {
//   var wait = false;                  // Initially, we're not waiting
//   return function (arg) {               // We return a throttled function
//       if (!wait) {                   // If we're not waiting
//           callback.call(null, arg);           // Execute users function
//           wait = true;               // Prevent future invocations
//           setTimeout(function () {   // After a period of time
//               wait = false;          // And allow future invocations
//           }, limit);
//       }
//   }
// }
