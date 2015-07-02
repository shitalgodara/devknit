/*
Function to get timedetails of the class corresponding to classcode
  Input =>
    classcode: String
    limit: Number
  Output =>
    Created Timedetails of messages of that class
  Procedure =>
    A simple query on GroupDetails 
*/
exports.toupdatetimebyclass = function(request, response){
  var clcode = request.params.classcode;
  var limit = request.params.limit;
  var query = new Parse.Query("GroupDetails");
  query.equalTo("code", clcode);
  query.select("createdAt");
  query.descending("createdAt");
  query.limit(limit);
  query.find({
    success: function(results){
      response.success(results);
    },
    error: function(error){
      response.error("Error: " + error.code + " " + error.message);
    }
  });
}

/*
Function to get timedetails of the classes
  Input =>
    classarray: Array of class codes
    limit: Number
  Output =>
    Created Timedetails of messages of that class
  Procedure =>
    A simple query on GroupDetails 
*/
exports.toupdatetime = function(request, response){
  var clarray = request.params.classarray;
  var limit = request.params.limit;
  var query = new Parse.Query("GroupDetails");
  query.containedIn("code", clarray);
  query.select("createdAt");
  query.descending("createdAt");
  query.limit(limit);
  query.find({
    success: function(results){
      response.success(results);
    },
    error: function(error){
      response.error("Error: " + error.code + " " + error.message);
    }
  });
}