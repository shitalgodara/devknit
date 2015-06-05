//place1 input location as string 
/*
function to get suggestion of location
input partialAreaName
output array of suggestions
httprequest on place api
*/
exports.areaAutoComplete = function(request, response) {
    var place = request.params.partialAreaName;
//#*#console.log(place);
Parse.Cloud.httpRequest({
  url: 'https://maps.googleapis.com/maps/api/place/autocomplete/json',
  params: {
    input : place,
    key:'AIzaSyCZ5_QxsDDJMaiCUCHDZp2A-OA_AnTYm74',
    types:'geocode'
  },
  success: function(httpResponse) {
var result=[];
for(var i=0;i<httpResponse.data.predictions.length;i++){
result[i]=httpResponse.data.predictions[i].description;
}
/*##
for(var i=0;i<result.length;i++){
console.log(result[i]);
}
##*/
 response.success(result);
  },
  error: function(httpResponse) {
 response.success(httpResponse);
  }
});
}
/*
function to get list of 40 (at max)schools by giving location
input areaName
output array of array of school name  and vicinity
query to find lat and lng ,then query to get first 20 schools,then next 20 after 2 seconds
*/
exports.schoolsNearby = function(request, response) {
    var place = request.params.areaName;
//#*#console.log(place);
Parse.Cloud.httpRequest({
  url: 'http://maps.google.com/maps/api/geocode/json',
  params: {
    address : place,
    sensor:'false'
  },
  success: function(httpResponse) {
var cord1=httpResponse.data.results[0].geometry.location.lat;
var cord2=httpResponse.data.results[0].geometry.location.lng;
var cord=cord1+","+cord2;
//#*#console.log(cord);
Parse.Cloud.httpRequest({
  url: 'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
  params: {
      types : 'school',
    key:'AIzaSyCZ5_QxsDDJMaiCUCHDZp2A-OA_AnTYm74',
    location:cord,
    radius:'10000' 
  },
  success: function(httpResponse1) {
var result=[];
for(var i=0;i<httpResponse1.data.results.length;i++){
result[i]=new Array(2);
result[i][0]=httpResponse1.data.results[i].name;
result[i][1]=httpResponse1.data.results[i].vicinity;
}

var nextpagetoken=httpResponse1.data.next_page_token;
//#*#console.log(nextpagetoken);
if(nextpagetoken=='undefined'){
/*##
for(var i=0;i<result.length;i++){
console.log(result[i][0]+"$$"+result[i][1]);
}
##*/
response.success(result);}
else{
 var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > 2000){
      break;
    }
  }
Parse.Cloud.httpRequest({
  url: 'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
  params: {
      types : 'school',
    key:'AIzaSyCZ5_QxsDDJMaiCUCHDZp2A-OA_AnTYm74',
    pagetoken:nextpagetoken
  },
  success: function(httpResponse2) {
for(var i=0;i<httpResponse2.data.results.length;i++){
result[i+20]=new Array(2);
result[i+20][0]=httpResponse2.data.results[i].name;
result[i+20][1]=httpResponse2.data.results[i].vicinity;
}
/*##
for(var i=0;i<result.length;i++){
console.log(result[i][0]+"$$"+result[i][1]);
}
##*/
response.success(result);
  },
  error: function(httpResponse2) {
 response.error(httpResponse2);
  }
});
}
  },
  error: function(httpResponse1) {
    console.error('Request failed with response code ' + httpResponse1.status);
 response.error(httpResponse1);
  }
});
  },
  error: function(httpResponse) {
    console.error('Request failed with response code ' + httpResponse.status);
 response.error(httpResponse);
  }
});
}