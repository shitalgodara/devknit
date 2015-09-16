/*
Function to get list of members subscribed to that class via app
  Input =>
    classcode: String
  Output =>
    Array of GroupMembers Object{
      name: String
      children_name: String
    }
  Procedure =>
     A simple query on GroupMembers 
*/
  exports.showappsubscribers = function(request, response){
  var clcode = request.params.classcode;
  var GroupMembers = Parse.Object.extend("GroupMembers");
  var query = new Parse.Query(GroupMembers);
  query.equalTo("code", clcode);
  query.select("name", "children_names");
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
Function to get list of members subscribed to that class via sms
  Input =>
    classcode: String
  Output =>
    MessageNeeders Object{
      subscriber: String
      number: String
    }
  Procedure =>
     A simple query on MessageNeeders
*/
  exports.showsmssubscribers = function(request, response){
  var clcode = request.params.classcode;
  var Messageneeders = Parse.Object.extend("Messageneeders");
  var query = new Parse.Query(Messageneeders);
  query.equalTo("cod", clcode);
  query.select("subscriber", "number");
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
Function to show details of message of a particular class
  Input =>
    classcode: String
    limit: Number
  Output =>
    Array of GroupDetails object{
      title: String
      code: String
      Creator: String
      name: String
    }
  Procedure =>
    A simple query on GroupDetails 
*/
  exports.showclassmessages = function(request, response){
  var clcode = request.params.classcode;
  var limit = request.params.limit;
  var GroupDetails = Parse.Object.extend("GroupDetails");
  var query = new Parse.Query("GroupDetails");
  query.equalTo("code", clcode);
  query.descending("createdAt");
  query.select("title", "code", "Creator", "name");
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
Function to show details of message of all classes
  Input =>
    limit: Number
  Output =>
    Array of GroupDetails object{
      title: String
      code: String
      Creator: String
      name: String
    }
  Procedure =>
    A simple query on GroupDetails 
*/
  exports.showallclassesmessages = function(request, response){
  var user = request.user;
  var clarray = [];
  var clarray1 = user.get("Created_groups");
  for (var i = 0; i < clarray1.length; i++){
    clarray[i]=clarray1[i][0];
  }
  var GroupDetails = Parse.Object.extend("GroupDetails");
  var query = new Parse.Query("GroupDetails");
  query.containedIn("code", clarray);
  query.descending("createdAt");
  var limit = request.params.limit;
  query.select("title", "code", "Creator", "name");
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