var _ = require('cloud/underscore-min.js'); 

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
  var query = new Parse.Query("GroupDetails");
  query.containedIn("objectId", array);
  query.select("seen_count");
  query.find().then(function(results){
    var allObjects = [];
    for(var i = 0; i < results.length; i++){ 
      results[i].increment("seen_count");
      allObjects.push(results[i]);
    }
    return Parse.Object.saveAll(allObjects); 
  }).then(function(objs){
    response.success(true);
  }, function(error){
    response.error(error.code + ": " + error.message);
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
  var input = request.params.input;
  var msgarray = request.params.array;
  var query = new Parse.Query("GroupDetails");
  query.containedIn("objectId", msgarray);
  query.select("confused_count", "like_count");
  query.find().then(function(results){
    var allObjects = [];
    for(var i = 0; i <results.length; i++){ 
      var temp = input[results[i].id];
      results[i].increment("like_count", temp[0]);
      results[i].increment("confused_count", temp[1]);
      allObjects.push(results[i]);
    }
    return Parse.Object.saveAll(allObjects);
  }).then(function(results){
    var promises = [];
    _.each(results, function(result){
      if((input[result.id][0] + input[result.id][1]) == -1){
        var query_destroy = new Parse.Query('MessageState');
        query_destroy.equalTo("message_id", result.id);
        query_destroy.equalTo("username", request.user.get("username"));
        promises.push(
          query_destroy.first().then(function(object){
            return object.destroy();
          })
        );
      }
      else if((input[result.id][0] + input[result.id][1]) == 0){
        var flag2 = false;
        var flag1 = true;
        if(input[result.id][0] == -1){
          flag1 = false;
          flag2 = true;
        }
        var query_update = new Parse.Query('MessageState');
        query_update.equalTo("message_id",result.id);
        query_update.equalTo("username",request.user.get("username"));
        promises.push(
          query_update.first().then(function(object){
            object.set('like_status', flag1 );
            object.set('confused_status', flag2);
            return object.save();  
          })
        );
      }
      else if((input[result.id][0] + input[result.id][1]) == 1){
        var flag1 = false;
        var flag2 = true;
        if(input[result.id][0] == 1){
          flag1 = true;
          flag2 = false;
        }
        var messagestates = Parse.Object.extend("MessageState");
        var query_create = new messagestates();
        promises.push(
          query_create.save({
            "username": request.user.get("username"),
            "message_id": result.id,
            "like_status": flag1,
            "confused_status": flag2
          })
        );
      }
    });
    return Parse.Promise.when(promises);
  }).then(function(){
    response.success(true);
  }, function(error){
    response.error(error.code + ": " + error.message);
  });
}

/*
Function to get counts of like, confusion and seen count
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
exports.updateCount2 = function(request, response){
  var query = new Parse.Query("GroupDetails");
  var array = request.params.array;
  query.select("seen_count", "like_count","confused_count");
  query.containedIn("objectId", array);
  query.find().then(function(results){
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
  }, function(error){
    response.error(error.code + ": " + error.message);
  });
}