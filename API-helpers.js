const axios = require('axios');

const { GOOGLE_MAPS_API_KEY } = process.env;
const googleMapsClient = require('@google/maps').createClient({
  key: GOOGLE_MAPS_API_KEY,
  Promise,
});

const decode = (encodedObj) => {

};

const getNearbyPlaces = (location, interests) => {
// lat: 29.96768435314543,
// lng: -90.05025405587452
  const usersNearbyPlaces = interests.map((interest) => {
    const options = {
      // location: `29.96768435314543,-90.05025405587452`,
      location,
      keyword: `${interest}`,
      opennow: true,
      rankby: 'distance',
    };
    return googleMapsClient.placesNearby(options).asPromise()
      .then((response) => {
        console.log(response);
        const locations = response.json.results.map((place) => {
          const responseFields = {
            name: place.name,
            placeId: place.place_id,
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
            address: place.vicinity,
            icon: place.icon,
            priceLevel: place.price_level,
            rating: place.rating,
            interest: options.keyword,
          };
          if (place.photos) { responseFields.photos = place.photos[0].photo_reference; }
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
  const results = [];
  return googleMapsClient.geocode({ address: addresses.origin }).asPromise()
    .then((result) => {
      const filteredResult = {
        location: result.json.results[0].geometry.location,
        placeId: result.json.results[0].place_id,
      };
      results.push(filteredResult);

      return googleMapsClient.geocode({ address: addresses.destination }).asPromise();
    })
    .then((result) => {
      const filteredResult = {
        location: result.json.results[0].geometry.location,
        placeId: result.json.results[0].place_id,
      };
      results.push(filteredResult);

      return new Promise((resolve, reject) => {
        resolve(results);
        reject(result);
      });
    });
};

const getPlacePhoto = (photoRef) => {
  const options = {
    key: GOOGLE_MAPS_API_KEY,
    photoreference: photoRef.ref,
    maxwidth: 100,
  };

  return axios.get('https://maps.googleapis.com/maps/api/place/photo', { responseType: 'arraybuffer', params: options });

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

module.exports.getAutocompleteAddress = getAutocompleteAddress;
module.exports.getPositions = getPositions;
module.exports.getNearbyPlaces = getNearbyPlaces;
module.exports.getPlacePhoto = getPlacePhoto;

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
