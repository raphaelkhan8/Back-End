const axios = require('axios');

const { GOOGLE_MAPS_API_KEY } = process.env;
const googleMapsClient = require('@google/maps').createClient({
  key: GOOGLE_MAPS_API_KEY,
  Promise,
});

const decode = (encodedObj) => {

};
const getNearbyPlaces = (location) => {
  const options = {
    query: 'new orleans bar',
    location,
    radius: 1,
    type: 'bar',
  };
  const test = {
    placeid: 'EisxMyBNYXJrZXQgU3RyZWV0LCBXaWxtaW5ndG9uLCBOQyAyODQwMSwgVVNB',
  };
  return googleMapsClient.places(options).asPromise();
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

module.exports.getPositions = getPositions;
module.exports.getNearbyPlaces = getNearbyPlaces;
