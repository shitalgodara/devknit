var run = require('cloud/run.js');
var _ = require('cloud/underscore-min.js');
var helper = require('cloud/message-helper.js');

/*
Function to send text messages
  Input =>
    classcode: Array
    classname: Array
    message: String
  Output =>
    <Valid class code>
      messageId: Array
      createdAt: Array // groupDetail entry
     <Any invalid class code>
       Created_Groups: Array
  Procedure =>
    Save unique entry in groupdetail and send push to app user and send sms to message user
*/
exports.sendMultiTextMessage = function(request, response){
  var classcodes = request.params.classcode;
  var classnames = request.params.classname;
  var checkmembers = request.params.checkmember;
  var message = request.params.message;
  var timestamp = request.params.timestamp;
  var user = request.user;
  var username = user.get("username");
  var name = user.get("name");
  var created_groups = user.get("Created_groups");
  var messageIds = [];
  var createdAts = [];
  var flag = true;
  var statuses = [];
  var promise = helper.getSendStatus2({
    "user": user,
    "message": message,
    "classcodes": classcodes,
    "checkmembers": checkmembers,
    "timestamp": timestamp
  }).then(function(result){
    flag = result.flag;
    statuses = result.statuses;
    return Parse.Promise.as(0);
  });
  _.each(classcodes, function(classcode){
    promise = promise.then(function(i){
      var classcode = classcodes[i];
      var classname = classnames[i];
      var status = statuses[i];
      if(status == 1){
        return helper.sendTextMessage({
          "classcode": classcode,
          "classname": classname,
          "message": message,
          "username": username,
          "name": name
        }).then(function(result){
          messageIds.push(result.messageId);
          createdAts.push(result.createdAt);
          var Messages = Parse.Object.extend("Messages");
          var message = new Messages();
          message.set("timestamp", timestamp);
          message.set("groupdetailId", result.messageId);
          message.set("groupdetailCreatedAt", result.createdAt);
          message.set("send", flag);
          return message.save();
        }).then(function(message){
          return Parse.Promise.as(i+1);
        });
      }
      else if(status == 2){
        var query = new Parse.Query("Messages");
        query.equalTo("timestamp", timestamp);
        query.limit(1);
        query.skip(i);
        return query.first().then(function(message){
          messageIds.push(message.get("groupdetailId"));
          createdAts.push(message.get("groupdetailCreatedAt"));
          if(message.get("send") == false){
            flag = false;
          }
          return Parse.Promise.as(i+1);
        });
      }
      else{
        var date = new Date();
        messageIds.push("");
        createdAts.push(date);
        var Messages = Parse.Object.extend("Messages");
        var message = new Messages();
        message.set("timestamp", timestamp);
        message.set("groupdetailId", "");
        message.set("groupdetailCreatedAt", date);
        message.set("send", flag);
        return message.save().then(function(message){
          return Parse.Promise.as(i+1);
        });
      }
    });
  });
  promise.then(function(){
    var output = {
      "messageId": messageIds,
      "createdAt": createdAts
    };
    if(flag == false){
      output["Created_groups"] = created_groups;
    }
    response.success(output);
  }, function(error){
    response.error(error.code + ": " + error.message);
  });
}

/*
Function to send photo text messages
  Input =>
    classcode: Array
    classname: Array
    parsefile: File pointer
    filename: String
    message: String
  Output =>
    <Valid class code>
      messageId: Array
      createdAt: Array // groupDetail entry
    <Any invalid class code>
      Created_Groups: Array
  Procedure =>
    Save entry in groupdetail and send push to app user and send sms to message user
*/
exports.sendMultiPhotoTextMessage = function(request, response){
  var classcodes = request.params.classcode;
  var classnames = request.params.classname;
  var checkmembers = request.params.checkmember;
  var message = request.params.message;
  var parsefile = request.params.parsefile;
  var filename = request.params.filename;
  var timestamp = request.params.timestamp;
  var user = request.user;
  var username = user.get("username");
  var name = user.get("name");
  var created_groups = user.get("Created_groups");
  var messageIds = [];
  var createdAts = [];
  var flag = true;
  var statuses = [];
  var promise = helper.getSendStatus2({
    "user": user,
    "message": message,
    "classcodes": classcodes,
    "checkmembers": checkmembers,
    "timestamp": timestamp
  }).then(function(result){
    flag = result.flag;
    statuses = result.statuses;
    return Parse.Promise.as(0);
  });
  _.each(classcodes, function(classcode){
    promise = promise.then(function(i){
      console.log(i + "I" + statuses[i]);
      var classcode = classcodes[i];
      var classname = classnames[i];
      var status = statuses[i];
      if(status == 1){
        return helper.sendPhotoTextMessage({
          "classcode": classcode,
          "classname": classname,
          "parsefile": parsefile,
          "filename": filename,
          "message": message,
          "username": username,
          "name": name
        }).then(function(result){
          messageIds.push(result.messageId);
          createdAts.push(result.createdAt);
          var Messages = Parse.Object.extend("Messages");
          var message = new Messages();
          message.set("timestamp", timestamp);
          message.set("groupdetailId", result.messageId);
          message.set("groupdetailCreatedAt", result.createdAt);
          message.set("send", flag);
          return message.save();
        }).then(function(message){
          return Parse.Promise.as(i+1);
        });
      }
      else if(status == 2){
        var query = new Parse.Query("Messages");
        query.equalTo("timestamp", timestamp);
        query.limit(1);
        query.skip(i);
        return query.first().then(function(message){
          messageIds.push(message.get("groupdetailId"));
          createdAts.push(message.get("groupdetailCreatedAt"));
          if(message.get("send") == false){
            flag = false;
          }
          return Parse.Promise.as(i+1);
        });
      }
      else{
        var date = new Date();
        messageIds.push("");
        createdAts.push(date);
        var Messages = Parse.Object.extend("Messages");
        var message = new Messages();
        message.set("timestamp", timestamp);
        message.set("groupdetailId", "");
        message.set("groupdetailCreatedAt", date);
        message.set("send", flag);
        return message.save().then(function(message){
          return Parse.Promise.as(i+1);
        });
      }
    });
  });
  promise.then(function(){
    var output = {
      "messageId": messageIds,
      "createdAt": createdAts
    };
    if(flag == false){
      output["Created_groups"] = created_groups;
    }
    response.success(output);
  }, function(error){
    response.error(error.code + ": " + error.message);
  });
}


/*
Function to show class messages within a limit in webbrowser
  Input =>
    classcode: String
    limit: String
  Output =>
    objects of GroupDetails 
  Procedure =>
    Simple query on groupdetail
*/
exports.showClassMessages = function(request, response){
  var classcode = request.params.classcode;
  var limit = request.params.limit;
  var query = new Parse.Query("GroupDetails");
  query.equalTo("code", classcode);
  query.descending("createdAt");
  query.limit(limit);
  query.find().then(function(groupdetails){
    response.success(groupdetails);
  }, function(error) {
    response.error(error.code + ": " + error.message);
  });
}

/*
Function to get latest messages of all joined classes
  Input => 
    date: String 
  Output =>
    objects of GroupDetails with fields attachment, code, title,
  Procedure =>
    Simple query on groupdetail
*/
exports.showLatestMessages = function(request, response){
  var joined_groups = request.user.get("joined_groups");
  if(typeof joined_groups == 'undefined')
    response.success([]);
  else{
    var classcodes = _.map(joined_groups, function(joined_group){
      return joined_group[0];
    });
    var date = request.params.date;
    var query = new Parse.Query("GroupDetails");
    query.greaterThan("createdAt", date);
    query.containedIn("code", classcodes);
    query.descending("createdAt");   
    query.find().then(function(groupdetails){
      response.success(groupdetails);
    }, function(error){
      response.error(error.code + ": " + error.message);
    });
  }
}

/*
Function for getting old message of all joined classes after a given time
  Input =>
    date: String
    limit: Number 
    classtype: String // 'c' for created class and 'j' for joined class
  Output =>
    <Created Class Type>
      Objects of GroupDetails
    <Else>
      {
        message: GroupDetails objects
        states: Messagestate objects
      }
  Procedure =>
    * Simple query on GroupDetails 
    * if message > 0 and type = 'j' then query on MessageState too 
*/
exports.showOldMessages = function(request, response){
  var user = request.user;
  var limit = request.params.limit;
  var date = request.params.date;
  var query = new Parse.Query("GroupDetails");
  query.lessThan("createdAt", date);
  query.limit(limit);
  query.descending("createdAt");
  var type = request.params.classtype;
  var classcodes = [];
  if(type == 'c'){
    var created_groups = user.get("Created_groups");
    if(typeof created_groups != 'undefined'){
      classcodes = _.map(created_groups, function(created_group){
        return created_group[0];
      });
    }
  }
  else if(type =='j'){
    var joined_groups = user.get("joined_groups");
    if(typeof joined_groups != 'undefined'){
      classcodes = _.map(joined_groups, function(joined_group){
        return joined_group[0];
      });
    }
  }
  query.containedIn("code", classcodes);
  query.find().then(function(groupdetails){
    if(type == 'c')
      return Parse.Promise.as(groupdetails);
    else if(groupdetails.length == 0){
      var output = {
        "message": groupdetails,
        "states": {}
      };
      return Parse.Promise.as(output);
    }
    else{
      var messageIds = _.map(groupdetails, function(groupdetail){
        return groupdetail.id;
      });
      var query = new Parse.Query("MessageState");
      query.equalTo("username", request.user.get("username"));
      query.containedIn("message_id", messageIds);
      return query.find().then(function(msgstates){
        var states = {};
        _.each(msgstates, function(msgstate){
          var temp_array = [msgstate.get("like_status"), msgstate.get("confused_status")];
          states[msgstate.get("message_id")] = temp_array;  
        });
        var output = {
          "message": groupdetails,
          "states": states
        };
        return Parse.Promise.as(output);
      });
    }
  }).then(function(result){
    response.success(result);
  }, function(error){
    response.error(error.code + ": " + error.message);
  });
}

/*
Function for getting latest message of all joined classes but with limit in case of local data delete
  Input =>
    limit: Number
    classtype: String // 'c' for created class and 'j' for joined class 
  Output =>
    <Created Class Type>
      Objects of GroupDetails
    <Else>
      {
        message: GroupDetails objects
        states: Messagestate objects
      }
  Procedure =>
    * Simple query on GroupDetails 
    * if message > 0 and type = 'j' then query on MessageState too 
*/
exports.showLatestMessagesWithLimit = function(request, response){
  var type = request.params.classtype;
  var limit = request.params.limit;
  var query = new Parse.Query("GroupDetails");
  query.descending("createdAt");
  query.limit(limit);
  var classcodes = [];
  if(type == 'c'){
    var created_groups = request.user.get("Created_groups");
    if(typeof created_groups != 'undefined'){
      classcodes = _.map(created_groups, function(created_group){
        return created_group[0];
      });
    }
  }
  else if(type == 'j'){
    var joined_groups = request.user.get("joined_groups");
    if(typeof joined_groups != 'undefined'){
      classcodes = _.map(joined_groups, function(joined_group){
        return joined_group[0];
      })
    }
  }
  query.containedIn("code", classcodes);
  query.find().then(function(groupdetails){
    if(type == 'c'){
      return Parse.Promise.as(groupdetails);
    }
    else if(groupdetails.length == 0){
      var output = {
        "message": groupdetails,
        "states": {}
      };
      return Parse.Promise.as(output);
    }
    else{
      var messageIds = _.map(groupdetails, function(groupdetail){
        return groupdetail.id;
      });      
      var query = new Parse.Query("MessageState");
      query.equalTo("username", request.user.get("username"));
      query.containedIn("message_id", messageIds);
      return query.find().then(function(msgstates){
        var states = {};
        _.each(msgstates, function(msgstate){
          var temp_array = [msgstate.get("like_status"), msgstate.get("confused_status")];
          states[msgstate.get("message_id")] = temp_array;  
        });
        var output = {
          "message": groupdetails,
          "states": states
        };
        return Parse.Promise.as(output);
      });
    }
  }).then(function(result){
    response.success(result);
  }, function(error){
    response.error(error.code + ": " + error.message);
  });
}