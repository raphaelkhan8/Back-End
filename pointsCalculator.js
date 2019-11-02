  
  //-- Define middle point function
  function middlePoint(lat1, lng1, lat2, lng2) {
    if (typeof (Number.prototype.toRad) === "undefined") {
      Number.prototype.toRad = function () {
          return this * Math.PI / 180;
      }
    }
  
    //-- Define degrees function
    if (typeof (Number.prototype.toDeg) === "undefined") {
      Number.prototype.toDeg = function () {
          return this * (180 / Math.PI);
      }
    }

    //-- Longitude difference
    var dLng = (lng2 - lng1).toRad();

    //-- Convert to radians
    lat1 = lat1.toRad();
    lat2 = lat2.toRad();
    lng1 = lng1.toRad();

    var bX = Math.cos(lat2) * Math.cos(dLng);
    var bY = Math.cos(lat2) * Math.sin(dLng);
    var lat3 = Math.atan2(Math.sin(lat1) + Math.sin(lat2), Math.sqrt((Math.cos(lat1) + bX) * (Math.cos(lat1) + bX) + bY * bY));
    var lng3 = lng1 + Math.atan2(bY, Math.cos(lat1) + bX);

    //-- Return result
    return { lng: lng3.toDeg(), lat: lat3.toDeg() };
  }

  const findPoints = (loc1Lat, loc1Lng, loc2Lat, loc2Lng, divisions = 0, locations = []) => {
    if (divisions === 3) return;
    const mid = middlePoint(loc1Lat, loc1Lng, loc2Lat, loc2Lng)
    locations.push(mid)
    findPoints(mid.lat, mid.lng, loc1Lat, loc1Lng, divisions + 1, locations)
    findPoints(mid.lat, mid.lng, loc2Lat, loc2Lng, divisions + 1, locations)
    return locations;
  }

 
  module.exports.middlePoint = middlePoint;
  module.exports.findPoints = findPoints;