var _ = require('cloud/underscore-min.js');

/*
Function to get suggestion of location
  Input =>
    partialAreaName: String
  Output =>
    Array of suggestions
  Description =>
    Process simply retrieves results by sending a httprequest on google place api
*/
exports.areaAutoComplete = function(request, response) {
  var place = request.params.partialAreaName;
  Parse.Cloud.httpRequest({
    url: 'https://maps.googleapis.com/maps/api/place/autocomplete/json',
    params: {
      input: place,
      key: 'AIzaSyCZ5_QxsDDJMaiCUCHDZp2A-OA_AnTYm74',
      types: 'geocode',
      components: 'country:in'    
    }
  }).then(function(httpResponse){
    var result = _.map(httpResponse.data.predictions, function(prediction){
      return prediction.description;
    })
    response.success(result);
  }, function(httpResponse){
    response.error(httpResponse.data.code + ": " + httpResponse.data.error);
  });
}

/*
Function to get list of 40(max.) schools nearby at giving location
  Input =>
    areaName: String
  Output =>
    Array of array of school name  and vicinity
  Description =>
    Procedure first query to find lat and lng of the given location and then query to get first 20 schools nearby ,then next 20 after 2 seconds
*/
exports.schoolsNearby = function(request, response) {
  Parse.Cloud.httpRequest({
    url: 'http://maps.google.com/maps/api/geocode/json',
    params: {
      address: request.params.areaName,
    }
  }).then(function(httpResponse){
    var location = httpResponse.data.results[0].geometry.location;
    var cord = location.lat + "," + location.lng;
    return Parse.Cloud.httpRequest({
      url: 'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
      params: {
        types: 'school',
        key: 'AIzaSyCZ5_QxsDDJMaiCUCHDZp2A-OA_AnTYm74',
        location: cord,
        rankby: 'distance',
      }
    }).then(function(httpResponse1){
      var result1 = _.map(httpResponse1.data.results, function(result){
        var array = new Array(3);
        array[0] = result.name;
        array[1] = result.vicinity;
        array[2] = result.place_id;
        return array;
      });
      var nextpagetoken = httpResponse1.data.next_page_token;
      if(nextpagetoken == 'undefined'){
        return Parse.Promise.as(result1);
      }
      else{
        var start = new Date().getTime();
        for(var i = 0; i < 1e7; i++){
          if((new Date().getTime() - start) > 2000){
            break;
          }
        }
        return Parse.Cloud.httpRequest({
          url: 'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
          params: {
            types: 'school',
            key: 'AIzaSyCZ5_QxsDDJMaiCUCHDZp2A-OA_AnTYm74',
            pagetoken: nextpagetoken
          }
        }).then(function(httpResponse2){
          var result2 = _.map(httpResponse2.data.results, function(result){
            var array = new Array(3);
            array[0] = result.name;
            array[1] = result.vicinity;
            array[2] = result.place_id;
            return array;
          });
          return Parse.Promise.as(result1.concat(result2));
        });
      }
    });
  }).then(function(result){
    response.success(result);
  }, function(httpResponse){
    response.error(httpResponse.data.code + ": " + httpResponse.data.error);
  });
}
