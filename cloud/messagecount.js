/*
Function to get like_count, confused_count and seen_count after a given time
  Input =>
    Array of objectId of messages
  Output =>
    Objects of GroupDetails
  Procedure =>
    A simple query on GroupDetails 
*/
exports.updateCount = function(request, response){
  var GroupDetails = Parse.Object.extend("GroupDetails");
  var query = new Parse.Query("GroupDetails");
  var array = request.params.array;
  query.containedIn("objectId", array);
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
Function to update seen_count of messages
  Input =>
    Array of objectId of messages
  Output =>
    flag: Bool // true in case of success
  Procedure =>
    A simple query on GroupDetails 
*/
exports.updateSeenCount = function(request, response){
  var array = request.params.array;
  var GroupDetails = Parse.Object.extend("GroupDetails");
  var query = new Parse.Query("GroupDetails");
  query.containedIn("objectId", array);
  query.select("seen_count");
  query.find({
    success: function(results){
      console.log(results.length);
      var allObjects = [];
      for(var i = 0; i < results.length; i++){ 
        results[i].increment("seen_count");
        allObjects.push(results[i]);
      }
      Parse.Object.saveAll(allObjects, {
        success: function(objs){
          response.success(true);
        },
        error: function(error){
          response.error("Error: " + error.code + " " + error.message);
        }
      });
    },
    error: function(error){
      response.error("Error: " + error.code + " " + error.message);
    }
  });
}

/*
Function to update like and confused count of messages
  Input => 
    JSON Object{
      array: Array of message ids
      input: {
        msg_id: Array of 2 elements with like and confused counts change,
        ...
      }    
    }
  Output =>
    flag: Bool // true in case of success
  Procedure =>
    A simple query on GroupDetails and MessageState
*/
exports.updateLikeAndConfusionCount = function(request, response){
  var _ = require('underscore.js');
  var input = request.params.input;
  var msg_array = Object.keys(input);
  console.log(msg_array);
  var msgarray = request.params.array;
  var GroupDetails = Parse.Object.extend("GroupDetails");
  var query = new Parse.Query("GroupDetails");
  query.containedIn("objectId", msgarray);
  query.select("confused_count", "like_count");
  query.find({
    success: function(results){
      console.log(results.length);
      var allObjects = [];
      for(var i = 0; i <results.length; i++){ 
        console.log(results[i].id);
        var temp = input[results[i].id];
        console.log(temp);
        results[i].increment("like_count", temp[0]);
        results[i].increment("confused_count", temp[1]);
        allObjects.push(results[i]);
      }
      Parse.Object.saveAll(allObjects).then(function(results){
        var promises = [];
        _.each(results, function(result){
          if((input[result.id][0] + input[result.id][1]) == -1){
            console.log("destroy");
            promises.push((function(){
              var promise = new Parse.Promise();
              var query_destroy = new Parse.Query('MessageState');
              query_destroy.equalTo("message_id", result.id);
              query_destroy.equalTo("username", request.user.get("username"));
              console.log(request.user.id);
              console.log(result.id);
              query_destroy.first({  
                success: function(object){
                  console.log(object);
                  object.destroy({
                    success: function(object){
                      promise.resolve();
                    }
                  });
                },
                error: function(error){
                  response.error(error);
                }
              });
              return promise;
            })());
          }
          else if((input[result.id][0] + input[result.id][1]) == 0){
            var flag2 = false;
            var flag1 = true;
            if(input[result.id][0] == -1){
              flag1 = false;
              flag2 = true;
            }
            console.log("update");
            promises.push((function(){
              var promise = new Parse.Promise();
              var query_update = new Parse.Query('MessageState');
              query_update.equalTo("message_id",result.id);
              query_update.equalTo("username",request.user.get("username"));
              console.log(request.user.id);
              console.log(result.id);
              query_update.first({  
                success: function(object){
                  console.log(object);
                  object.set('like_status', flag1 );
                  object.set('confused_status', flag2);
                  object.save({
                    success: function(object){
                      promise.resolve();
                    }
                  });
                },
                error: function(error){
                  response.error(error);
                }
              });
              return promise;
            })());
          }
          else if((input[result.id][0] + input[result.id][1]) == 1){
            var flag1 = false;
            var flag2 = true;
            if(input[result.id][0] == 1){
              flag1 = true;
              flag2 = false;
            }
            console.log(result.id);
            var messagestates = Parse.Object.extend("MessageState");
            var query_create = new messagestates();
            promises.push(query_create.save({
              "username": request.user.get("username"),
              "message_id": result.id,
              "like_status": flag1,
              "confused_status": flag2
            }));
          }
        });
        return Parse.Promise.when(promises);
      }).then(function(){
        response.success(true);
      });
    },
    error: function(error){
      response.error("Error: " + error.code + " " + error.message);
    }
  });
}

/*
Function to get counts of like,confusion and seen after a given time
  Input =>
    Array of messageIds 
  Output =>
    JSON object{
      msgid: 1D Array of 3 elements seen , like, confused counts,
      ...  
    } 
  Procedure =>
    A simple query on GroupDetails 
*/
exports.updateCount2= function(request, response){
  var GroupDetails = Parse.Object.extend("GroupDetails");
  var query = new Parse.Query("GroupDetails");
  var array = request.params.array;
  query.select("seen_count", "like_count","confused_count");
  query.containedIn("objectId", array);
  query.find({
    success: function(results){
      var result = {};
      for(var i = 0; i < results.length; i++){
        var x = 0;
        var y = 0;
        var z = 0;
        if(typeof results[i].get("seen_count") != 'undefined')
          x = results[i].get("seen_count");
        if(typeof results[i].get("like_count") != 'undefined')
          y = results[i].get("like_count");
        if(typeof results[i].get("confused_count") != 'undefined')
          z = results[i].get("confused_count");
        var temp_array = [x, y, z];
        result[results[i].id] = temp_array;
      }
      response.success(result);
    },
    error: function(error){
      response.error("Error: " + error.code + " " + error.message);
    }
  });
}

/*
Function to get like_count, confused_count and seen_count after a given time
  Input =>
    date: String
    limit: Number
    classtype: String // 'c' for created groups and 'j' for joined groups
  Output =>
    Objects of GroupDetails
  Procedure =>
    A simple query on groupdetail 
*/
exports.updateCounts= function(request, response){
  var GroupDetails = Parse.Object.extend("GroupDetails");
  var query = new Parse.Query("GroupDetails");
  var limit = request.params.limit;
  var date = request.params.date;
  console.log(limit);
  console.log(date);
  query.lessThan("createdAt",date);
  query.limit(limit);
  var type = request.params.classtype;
  console.log(type);
  if(type == 'c'){
    var clarray1 = request.user.get("Created_groups");
    var clarray = [];
    if(typeof clarray1 != 'undefined'){
      for (var i = 0; i < clarray1.length; i++)
        clarray[i] = clarray1[i][0];
    }
  }
  else if(type == 'j'){
    var clarray1 = request.user.get("joined_groups");
    var clarray = [];
    if(typeof clarray1 != 'undefined'){
      for (var i = 0; i < clarray1.length; i++)
        clarray[i] = clarray1[i][0];
    }
  }
  console.log(clarray);
  query.select("seen_count", "like_count", "confused_count");
  query.containedIn("code", clarray);
  query.find({
    success: function(results){
      response.success(results);
    },
    error: function(error){
      response.error("Error: " + error.code + " " + error.message);
    }
  });
}
