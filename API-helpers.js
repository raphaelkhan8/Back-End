const axios = require("axios");
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const googleMapsClient = require('@google/maps').createClient({
    key: GOOGLE_MAPS_API_KEY,
    Promise: Promise
  });
const decode = (encodedObj) => {

}
const getNearbyPlaces = (location) => {
  //lat: 29.96768435314543,
  // lng: -90.05025405587452
    
    const options = {
      location: `29.96768435314543,-90.05025405587452`,
      keyword: 'bar',
      opennow: true,
      rankby: 'distance'
    }
    const test = {
      placeid: 'EisxMyBNYXJrZXQgU3RyZWV0LCBXaWxtaW5ndG9uLCBOQyAyODQwMSwgVVNB'
    }
    return googleMapsClient.placesNearby(options).asPromise();
}

const getPositions = (addresses) => {
  
  const results = [];
  return googleMapsClient.geocode({address: addresses.origin}).asPromise()
          .then(result => {          
            const filteredResult = {
              location: result.json.results[0].geometry.location, 
              placeId: result.json.results[0].place_id
            }
            results.push(filteredResult);

            return googleMapsClient.geocode({address: addresses.destination}).asPromise()
          })
          .then(result => {
            const filteredResult = {
              location: result.json.results[0].geometry.location, 
              placeId: result.json.results[0].place_id
            }
            results.push(filteredResult);

            return new Promise((resolve, reject) => {
              resolve(results);
              reject(result);
            })
          })
}

const getPlacePhoto = (photoRef) => {
  const options = {
    photoreference: photoRef.ref,
    maxwidth: 150,
  }
  return googleMapsClient.placesPhoto(options).asPromise();
}

module.exports.getPositions = getPositions;
module.exports.getNearbyPlaces = getNearbyPlaces;
module.exports.getPlacePhoto = getPlacePhoto;