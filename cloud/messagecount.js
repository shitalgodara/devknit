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
  query.find().then(function(groupdetails){
    groupdetails = _.map(groupdetails, function(groupdetail){ 
      groupdetail.increment("seen_count");
      return groupdetail;
    });
    return Parse.Object.saveAll(groupdetails); 
  }).then(function(groupdetails){
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
  query.find().then(function(groupdetails){
    groupdetails = _.map(groupdetails, function(groupdetail){
      var temp = input[groupdetail.id];
      groupdetail.increment("like_count", temp[0]);
      groupdetail.increment("confused_count", temp[1]);
      return groupdetail;
    });
    return Parse.Object.saveAll(groupdetails);
  }).then(function(groupdetails){
    var promises = [];
    _.each(groupdetails, function(groupdetail){
      if((input[groupdetail.id][0] + input[groupdetail.id][1]) == -1){
        var query_destroy = new Parse.Query('MessageState');
        query_destroy.equalTo("message_id", groupdetail.id);
        query_destroy.equalTo("username", request.user.get("username"));
        promises.push(
          query_destroy.first().then(function(msgstate){
            if(msgstate){
              return msgstate.destroy();
            }
            else{
              return Parse.Promise.as();
            }
          })
        );
      }
      else if((input[groupdetail.id][0] + input[groupdetail.id][1]) == 0){
        var flag2 = false;
        var flag1 = true;
        if(input[groupdetail.id][0] == -1){
          flag1 = false;
          flag2 = true;
        }
        var query_update = new Parse.Query('MessageState');
        query_update.equalTo("message_id",groupdetail.id);
        query_update.equalTo("username",request.user.get("username"));
        promises.push(
          query_update.first().then(function(msgstate){
            msgstate.set('like_status', flag1 );
            msgstate.set('confused_status', flag2);
            return msgstate.save();  
          })
        );
      }
      else if((input[groupdetail.id][0] + input[groupdetail.id][1]) == 1){
        var flag1 = false;
        var flag2 = true;
        if(input[groupdetail.id][0] == 1){
          flag1 = true;
          flag2 = false;
        }
        var MessageState = Parse.Object.extend("MessageState");
        var msgstate = new MessageState();
        promises.push(
          msgstate.save({
            "username": request.user.get("username"),
            "message_id": groupdetail.id,
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
  query.find().then(function(groupdetails){
    var output = {};
    _.each(groupdetails, function(groupdetail){
      var x = 0;
      var y = 0;
      var z = 0;
      if(typeof groupdetail.get("seen_count") != 'undefined')
        x = groupdetail.get("seen_count");
      if(typeof groupdetail.get("like_count") != 'undefined')
        y = groupdetail.get("like_count");
      if(typeof groupdetail.get("confused_count") != 'undefined')
        z = groupdetail.get("confused_count");
      var temp = [x, y, z];
      output[groupdetail.id] = temp;
    });
    response.success(output);
  }, function(error){
    response.error(error.code + ": " + error.message);
  });
}