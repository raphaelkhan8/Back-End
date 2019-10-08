const axios = require('axios');

const { GOOGLE_MAPS_API_KEY } = process.env;
const googleMapsClient = require('@google/maps').createClient({
  key: GOOGLE_MAPS_API_KEY,
  Promise,
});

const decode = (encodedObj) => {

};
const getNearbyPlaces = (location) => {
  // lat: 29.96768435314543,
  // lng: -90.05025405587452

  const options = {
    // location: `29.96768435314543,-90.05025405587452`,
    location,
    keyword: 'coffee',
    opennow: true,
    rankby: 'distance',
  };
  const test = {
    placeid: 'EisxMyBNYXJrZXQgU3RyZWV0LCBXaWxtaW5ndG9uLCBOQyAyODQwMSwgVVNB',
  };
  return googleMapsClient.placesNearby(options).asPromise();
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
    maxwidth: 200,
  };

  return axios.get('https://maps.googleapis.com/maps/api/place/photo', { responseType: 'arraybuffer', params: options });

  // return googleMapsClient.placesPhoto(options).asPromise();
};

const throttle = function (callback, limit) {
  let wait = false; // Initially, we're not waiting
  return function (arg) { // We return a throttled function
    if (!wait) { // If we're not waiting
      callback.call(null, arg); // Execute users function
      wait = true; // Prevent future invocations
      setTimeout(() => {   // After a period of time
              wait = false;          // And allow future invocations
          }, limit);
    }
  };
};

module.exports.throttle = throttle;
module.exports.getPositions = getPositions;
module.exports.getNearbyPlaces = getNearbyPlaces;
module.exports.getPlacePhoto = getPlacePhoto;
