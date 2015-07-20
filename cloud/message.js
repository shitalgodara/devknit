var run = require('cloud/run.js');
var _ = require('cloud/underscore-min.js');

/*
Function to send text messages
  Input =>
    classcode: String
    classname: String
    message: String
  Output =>
    messageId: String
    createdAt: String // groupDetail entry
  Procedure =>
    Save entry in groupdetail and send push to app user and send sms to message user
*/
exports.sendTextMessage = function(request, response){
  var classcode = request.params.classcode;
  var user = request.user;
  var created_groups = user.get("Created_groups");
  var index = _.findIndex(created_groups, function(created_group){
    return created_group[0] == classcode;
  });
  if(index >= 0){
    var classname = request.params.classname;
    var name = user.get("name");
    var username = user.get("username");
    var message = request.params.message;
    var GroupDetails = Parse.Object.extend("GroupDetails");
    var groupdetail = new GroupDetails();
    groupdetail.save({
      Creator: name,
      name: classname,
      title: message,
      senderId: username,
      code: classcode
    }).then(function(groupdetail){
      return Parse.Push.send({
        channels: [classcode],
        data: {
          msg: message,
  		    alert: message,
          badge: "Increment",
          groupName: classname,
  		    type: "NORMAL",
  		    action: "INBOX"
        }
      }).then(function(){
        var groupdetailId = groupdetail.id;
        var result = {
          messageId: groupdetailId,
          createdAt: groupdetail.createdAt
        };
        var msg = message;
        msg = classname + ": " + msg;
        var query = new Parse.Query("Messageneeders");
        msg = msg.substr(0, 330);
        query.equalTo("cod", classcode);
        query.doesNotExist("status");
        return query.find().then(function(msgnds){
          var numbers = _.map(msgnds, function(msgnd){
            return msgnd.get("number");
          });
          return run.bulkMultilingualSMS({
            "numbers": numbers,
            "msg": msg,
            "groupdetailId": groupdetailId
          });  
        }).then(function(){
          return Parse.Promise.as(result);
        });
      });
    }).then(function(result){
      response.success(result);
    },
    function(error){
      response.error(error.code + ": " + error.message);
    });
  }
  else{
    response.error("CLASS_DOESNOT_EXISTS");
  }
}

/*
Function to send photo text messages
  Input =>
    classcode: String
    classname: String
    parsefile: File pointer
    filename: String
    message: String
  Output =>
    messageId: String
    createdAt: String // groupdetail entry
  Procedure =>
    Save entry in groupdetail and send push to app user and send sms to message user
*/
exports.sendPhotoTextMessage = function(request, response){
  var classcode = request.params.classcode;
  var user = request.user;
  var created_groups = user.get("Created_groups");
  var index = _.findIndex(created_groups, function(created_group){
    return created_group[0] == classcode;
  });
  if(index >= 0){
    var classname = request.params.classname;
    var name = user.get("name");
    var username = user.get("username");
    var parsefile = request.params.parsefile;
    var filename = request.params.filename;
    var message = request.params.message;
    var msg;
    var GroupDetails = Parse.Object.extend("GroupDetails");
    var groupdetail = new GroupDetails();
    var url;
    groupdetail.save({
      Creator: name,
      name: classname,
      title: message,
      senderId: username,
      code: classcode,
      attachment: parsefile,
      attachment_name: filename
    }).then(function(groupdetail){
      if (message == "") 
        msg = "You have received an Image";
      else
        msg = message;
      url = groupdetail.get('attachment').url();
      return Parse.Push.send({
        channels: [classcode],
        data: {
          msg: msg,
  		    alert: msg,
          badge: "Increment",
          groupName: classname,
  		    type: "NORMAL",
  		    action: "INBOX"
        }
      }).then(function(){
        var groupdetailId = groupdetail.id;
        var output = {
          messageId: groupdetailId,
          createdAt: groupdetail.createdAt
        };
        msg = classname + ": " + msg;
        msg = msg + ", Your Teacher " + name + " has sent you an attachment, we can't send you pics over mobile, so download our android-app http://goo.gl/Ptzhoa";
        msg = msg + " you can view image at ";
        return Parse.Cloud.httpRequest({
          url: 'http://tinyurl.com/api-create.php',
          params: {
            url : url
          }
        }).then(function(httpResponse){
          msg = msg + httpResponse.text;
          var query = new Parse.Query("Messageneeders");
          query.equalTo("cod", classcode);
          query.doesNotExist("status");
          return query.find().then(function(msgnds){
            var numbers = _.map(msgnds, function(msgnd){
              return msgnd.get("number");
            });
            return run.bulkMultilingualSMS({
              "numbers": numbers,
              "msg": msg,
              "groupdetailId": groupdetailId
            });  
          }).then(function(){
            return Parse.Promise.as(output);
          }, function(error){
            return Parse.Promise.error(error);
          });
        }, function(httpResponse){
          var error = {
            "code": httpResponse.data.code,
            "message": httpResponse.data.error
          };
          return Parse.Promise.error(error);
        });
      });
    }).then(function(result){
      response.success(result);
    }, function(error){
      response.error(error.code + ": " + error.message);
    });
  }
  else{
    response.error("CLASS_DOESNOT_EXISTS");
  }
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
Function to subscribe from web for sms subscription
  Input =>
    classcode: String
    subscriber: String
    number: String // phone number
  Output =>
    flag : Bool // true in case of success otherwise error
  Procedure =>
    Simple save query on Messageneeders table
*/
exports.smsSubscribe = function(request, response){
  var classcode = request.params.classcode;
  var subscriber = request.params.subscriber;
  var number = request.params.number;
  var Messageneeders = Parse.Object.extend("Messageneeders");
  var msgnd = new Messageneeders();
  msgnd.set("cod", classcode);
  msgnd.set("subscriber", subscriber);
  msgnd.set("number", "91" + number.substr(number.length - 10));
  msgnd.save().then(function(msgnd){
    response.success(true);
  }, function(error){
    response.error(error.code + ": " + error.message);
  });
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
exports.showOldMessages2 = function(request, response){
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
exports.showLatestMessagesWithLimit2 = function(request, response){
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