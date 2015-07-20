var _ = require('cloud/underscore-min.js');

/*
Function to change assoicate name of joined class
  Input =>
    classCode: String
    childName: String
  Output =>
    joined_groups: Array
  Procedure =>
    Changed entry in GroupMembers and in users joined_groups
*/
exports.changeAssociateName = function(request, response){
  var classcode = request.params.classCode;
  var childName = request.params.childName;
  var children_names = [childName];
  var emailId = request.user.get("username");
  var query = new Parse.Query("GroupMembers");
  query.equalTo("emailId", emailId);
  query.equalTo("code", classcode);
  query.doesNotExist("status");
  query.first().then(function(groupmember){
    groupmember.set("children_names", children_names);
    return groupmember.save();
  }).then(function(groupmember){
    var user = request.user;
    var joined_groups = user.get("joined_groups");
    var index = _.findIndex(joined_groups, function(joined_group){
      return joined_group[0] == classcode;
    });
    joined_groups[index][2] = childName;
    user.set("joined_groups", joined_groups);
    return user.save();
  }).then(function(user){
    response.success(user.get("joined_groups"));
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
  var user = request.user;
  var created_groups = user.get("Created_groups");
  if(typeof created_groups == 'undefined'){
    response.success({
      "app": [],
      "sms": []
    });
  }
  else{
    var classcodes = _.map(created_groups, function(created_group){
      return created_group[0];
    });
    var limit = 500;
    var date = request.params.date;
    var query = new Parse.Query("GroupMembers");
    query.greaterThan("updatedAt", date);
    query.containedIn("code", classcodes);
    query.select("name", "children_names", "code", "status", "emailId");
    query.limit(limit);
    query.ascending("updatedAt");
    query.find().then(function(groupmembers){
      var query = new Parse.Query("Messageneeders");
      query.containedIn("cod", classcodes);
      query.greaterThan("updatedAt", date);
      query.select("subscriber", "number", "cod", "status");
      query.ascending("updatedAt");
      query.limit(limit);
      return query.find().then(function(msgnds){
        var output = {
          "app": groupmembers,
          "sms": msgnds
        };
        return Parse.Promise.as(output);
      });
    }).then(function(result){
      response.success(result);
    }, function(error){
      response.error(error.code + ": " + error.message);
    });
  }
}