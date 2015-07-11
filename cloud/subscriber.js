/*
Function to change assoicate name of joined class
  Input =>
    classCode: String
    childName: String
  Output =>
    user: Parse Object
  Procedure =>
    Changed entry in GroupMembers and in users joined_groups
*/
exports.changeAssociateName = function(request, response){
  var classcode = request.params.classCode;
  var newchild = request.params.childName;
  var child = [newchild];
  var emailId = request.user.get("username");
  classcode = classcode.toUpperCase();
  var query = new Parse.Query("GroupMembers");
  query.equalTo("emailId", emailId);
  query.equalTo("code", classcode);
  query.doesNotExist("status");
  query.first().then(function(object){
    object.set("children_names", child);
    return object.save();
  }).then(function(object){
    var user = request.user;
    var classname = "";
    var clarray = user.get("joined_groups");
    for(var i = 0; i < clarray.length; i++){
      if(clarray[i][0] == classcode){
        classname = clarray[i][1];
        clarray.splice(i, 1);
        break;
      }
    }
    var clelement = [classcode, classname, newchild];
    clarray.push(clelement);
    user.set("joined_groups", clarray);
    return user.save();
  }).then(function(user){
    response.success(user);
  }, function(error){
    response.error(error.code + ": " + error.message);
  });  
}

/*
Function to show all latest subscribers of all created classes (Max. 1000 => 500 via app and 500 via sms each)
  Input =>
    date: String
  Output =>
    JSON object of app and sms which represents entries of parse objects of groupmembers and messageneeders
  Procedure =>
    A simple query on GroupMembers and Messageneeders table 
*/
exports.showAllSubscribers = function(request, response){
  var clarray1 = request.user.get("Created_groups");
  if(typeof clarray1 == 'undefined'){
    response.success({
      "app": [],
      "sms": []
    });
  }
  else{
    var clarray = [];
    for (var i = 0; i < clarray1.length; i++){
      clarray[i] = clarray1[i][0];
	  }
    var limit = 500;
    var date = request.params.date;
    var query = new Parse.Query("GroupMembers");
    query.greaterThan("updatedAt", date);
    query.containedIn("code", clarray);
    query.select("name", "children_names", "code", "status", "emailId");
    query.limit(limit);
    query.find().then(function(results1){
      var query = new Parse.Query("Messageneeders");
      query.containedIn("cod", clarray);
      query.greaterThan("updatedAt", date);
      query.select("subscriber", "number", "cod", "status");
      query.limit(limit);
      return query.find().then(function(results2){
        var result = {
          "app": results1,
          "sms": results2
        };
        return Parse.Promise.as(result);
      });
    }).then(function(result){
      response.success(result);
    }, function(error){
      response.error(error.code + ": " + error.message);
    });
  }
}