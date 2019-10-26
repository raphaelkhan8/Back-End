const axios = require('axios');

const { GOOGLE_MAPS_API_KEY } = process.env;
const { YELP_API_KEY } = process.env;

const googleMapsClient = require('@google/maps').createClient({
  key: GOOGLE_MAPS_API_KEY,
  Promise,
});
const { findPoints } = require('./pointsCalculator')
// const decode = (encodedObj) => {

// };

const getNearbyPlaces = (location, interests, snapshotUrl) => {
  // lat: 29.96768435314543,
  // lng: -90.05025405587452
  // console.log(snapshotUrl);
  // console.log(location);
  // console.log(interests);
  let newInterests;
  if (typeof interests === 'string') newInterests = [interests];
  else if (snapshotUrl === '/results') {
    newInterests = interests.slice(0, 5);
  } else {
    newInterests = [interests[0], interests[1], interests[2]];
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
        const filteredLocations = response.json.results.filter(place => place.photos);
        const locations = filteredLocations.map((place) => {
          const cityAndState = `${place.plus_code.compound_code.split(' ')[1]} ${place.plus_code.compound_code.split(' ')[2]} ${place.plus_code.compound_code.split(' ')[3]}`;
          const responseFields = {
            clicked: false,
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
          // console.log(responseFields.interest);
          const interestArr = [];
          responseFields.interest.split('_').forEach(((word) => {
            interestArr.push(word[0].toUpperCase().concat(word.slice(1)));
          }));
          responseFields.interest = interestArr.join(' ');
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
  const { destination, origin, waypoints } = query;
  const newWaypoints = waypoints.trim().split(',').filter(waypoint => waypoint);
  // console.log('wayppppp', newWaypoints);
  if (!newWaypoints.length) {
    return axios.get(`https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${origin}&destinations=${destination}&key=${GOOGLE_MAPS_API_KEY}`)
      .then(response => ({
        distance: response.data.rows[0].elements[0].distance.text,
        duration: response.data.rows[0].elements[0].duration.text,
      }));
  }
  newWaypoints.unshift(origin);
  newWaypoints.push(destination);
  const etaForAllStops = newWaypoints.slice(0, newWaypoints.length - 1).map((waypoint, i) => axios.get(`https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${waypoint}&destinations=${newWaypoints[i + 1]}&key=${GOOGLE_MAPS_API_KEY}`)
    .then(response => ({
      distance: response.data.rows[0].elements[0].distance.text,
      duration: response.data.rows[0].elements[0].duration.text,
    })));
  return Promise.all(etaForAllStops).then((etas) => {
    const etaDurations = etas.map(eta => eta.duration);
    const addAlltheElements = arr => arr.reduce((a, b) => a + b, 0);
    let dayDuration = addAlltheElements(etaDurations.filter(eta => eta.includes('day')).map(eta => Number(eta.split('day')[0].trim())));
    let hourDuration = addAlltheElements(etaDurations.filter(eta => eta.includes('hour')).map((eta) => {
      let hour = eta.split('hour')[0].trim();
      if (isNaN(hour)) {
        hour = hour.split('day')[1].slice(1).trim();
      }
      return Number(hour);
    }));
    let minsDuration = addAlltheElements(etaDurations.filter(eta => eta.includes('min')).map((eta) => {
      let mins = eta.split('min')[0].trim();
      if (isNaN(mins)) {
        mins = mins.split('hour')[1].slice(1).trim();
      }
      return Number(mins);
    }));
    if (hourDuration >= 24) {
      dayDuration += parseInt(hourDuration / 24, 10);
      hourDuration %= 24;
    }
    if (minsDuration >= 60) {
      hourDuration += parseInt(minsDuration / 60, 10);
      minsDuration %= 60;
    }
    dayDuration = dayDuration ? `${dayDuration} ${dayDuration > 1 ? 'days' : 'day'}` : '';
    hourDuration = hourDuration ? `${hourDuration} ${hourDuration > 1 ? 'hours' : 'hour'}` : '';
    minsDuration = minsDuration ? `${minsDuration} ${minsDuration > 1 ? 'mins' : 'min'}` : '';

    const duration = `${dayDuration} ${hourDuration} ${minsDuration}`;
    const distance = `${addAlltheElements(etas.map(eta => Number(eta.distance.slice(0, eta.distance.length - 3).replace(/,/g, ''))))} mi`;
    return { duration, distance };
  }).catch(err => console.log('errrrrrrrcat', err));
};

const getYelpPhotos = (coordinates) => {
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
        const emptyRes = {
          data: {
            img_url: 'http://www.moxmultisport.com/wp-content/uploads/no-image.jpg',
            name: 'Something went wrong',
            phone: 'unknown',
          },
        };
        return Promise.resolve(emptyRes);
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

const getLocationsNearPoints = (loc1Lat, loc1Lng, loc2Lat, loc2Lng, category) => {
  const points = findPoints(loc1Lat, loc1Lng, loc2Lat, loc2Lng);
  

  const promisePoints = points.map(point => {
    const options = {
      // location: `29.96768435314543,-90.05025405587452`,
      key: GOOGLE_MAPS_API_KEY,
      location: `${point.lat},${point.lng}`,
      input: category,
      inputtype: 'textquery',
      opennow: false,
      radius: 50000,
      fields: 'photos,place_id,formatted_address,geometry,name,rating',
      locationbias: `circle:50000@${point.lat},${point.lng}`
    };
  
    return axios.get(`https://maps.googleapis.com/maps/api/place/findplacefromtext/json`, {
      params: options,
    })
      .then(places => {
        console.log(places)
        const place = places.data.candidates[0]
        
          const responseFields = {
            clicked: false,
            name: place.name,
            placeId: place.place_id,
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
            address: place.formatted_address,
            rating: place.rating,
            interest: options.input,
          };
          return Promise.resolve(responseFields);
      })
  })
  return Promise.all(promisePoints);
}
module.exports.getYelpPhotos = getYelpPhotos;
module.exports.getAutocompleteAddress = getAutocompleteAddress;
module.exports.getPositions = getPositions;
module.exports.getNearbyPlaces = getNearbyPlaces;
module.exports.getPlacePhoto = getPlacePhoto;
module.exports.getPlaceInfo = getPlaceInfo;
module.exports.getDistanceMatrix = getDistanceMatrix;
module.exports.getLocationsNearPoints = getLocationsNearPoints;