var run = require('cloud/run.js');
var _ = require('cloud/underscore-min.js');

/*
Function to check whether class contains any member or not
  Input =>
    code: String
  Output =>
    count: Number // Number of users subscribed to a class via app and sms 
  Procedure =>
    A simple query on GroupMembers and MessageNeeders
*/ 
function isClassActivated(request){
  var code = request.code;
  var query = new Parse.Query("GroupMembers");
  query.equalTo("code", code);
  query.doesNotExist("status");
  return query.first().then(function(groupmember){
    if(typeof groupmember != 'undefined'){
      return Parse.Promise.as(true);
    }
    else{
      var query = new Parse.Query("Messageneeders");
      query.equalTo("cod", code);
      query.doesNotExist("status");
      return query.first().then(function(msgnd){
        if(typeof msgnd != 'undefined'){
          return Parse.Promise.as(true);
        }
        else{
          return Parse.Promise.as(false);
        }
      });
    }
  }).then(function(result){
    return Parse.Promise.as(result);
  }, function(error){
    return Parse.Promise.error(error.code + ": " + error.message);
  });
}

/*
Function to get send status of message for each class
  Input =>
    code: String
  Output =>
    count: Number // Number of users subscribed to a class via app and sms 
  Procedure =>
    A simple query on GroupMembers and MessageNeeders
*/ 
exports.getSendStatus = function(request){
  var user = request.user;
  var message = request.message;
  var filename = request.filename;
  var classcodes = request.classcodes;
  var checkmembers = request.checkmembers;
  var created_groups = user.get("Created_groups");
  var username = user.get("username");
  var flag = true;
  var statuses = [];
  var resend = false;
  var promise = Parse.Promise.as(0);
  _.each(classcodes, function(classcode){
    promise = promise.then(function(i){
      var classcode = classcodes[i];
      var checkmember = false;
      if(checkmembers)
        checkmember = checkmembers[i];
      var index = _.findIndex(created_groups, function(created_group){
        return created_group[0] == classcode;
      });
      if(index >= 0){
        if(checkmember){
          return isClassActivated({
            "code": classcode
          }).then(function(result){
            if(result){
              if(resend == false){
                var query = new Parse.Query("GroupDetails");
                query.equalTo("senderId", username);
                query.equalTo("code", classcode);
                return query.first().then(function(groupdetail){
                  if(typeof groupdetail != 'undefined'){
                    if(groupdetail.get("title") == message && groupdetail.get("attachment_name") == filename){
                      statuses.push(2);
                      resend = true;
                    }
                    else{
                      statuses.push(1);
                    }
                  }
                  else{
                    statuses.push(1);
                  }
                  return Parse.Promise.as(i+1);
                });
              }
              else{
                statuses.push(2);
              }
            }
            else{
              statuses.push(0);
            }
            return Parse.Promise.as(i+1);
          });
        }
        else{
          if(resend == false){
            var query = new Parse.Query("GroupDetails");
            query.equalTo("senderId", username);
            query.equalTo("code", classcode);
            return query.first().then(function(groupdetail){
              if(typeof groupdetail != 'undefined'){
                if(groupdetail.get("title") == message && groupdetail.get("attachment_name") == filename){
                  statuses.push(2);
                  resend = true;
                }
                else{
                  statuses.push(1);
                }
              }
              else{
                statuses.push(1);
              }
              return Parse.Promise.as(i+1);
            });
          }
          else{
            statuses.push(2);
          }
        }
      }
      else{
        flag = false;
        statuses.push(0);
      }
      return Parse.Promise.as(i+1);
    });
  });
  return promise.then(function(){
    var output = {
      "flag": flag,
      "statuses": statuses 
    };
    return Parse.Promise.as(output);
  });
}

/*
Function to get send status of message for each class
  Input =>
    code: String
  Output =>
    count: Number // Number of users subscribed to a class via app and sms 
  Procedure =>
    A simple query on GroupMembers and MessageNeeders
*/ 
exports.getSendStatus2 = function(request){
  var user = request.user;
  var timestamp = request.timestamp;
  var classcodes = request.classcodes;
  var checkmembers = request.checkmembers;
  var created_groups = user.get("Created_groups");
  var username = user.get("username");
  var statuses = [];
  var query = new Parse.Query("MessageDetails");
  var resend = false;
  query.equalTo("timestamp", timestamp);
  return query.first().then(function(msgdetail){
    if(typeof msgdetail != 'undefined'){
      resend = true;
    }
    var flag = true;
    var promise = Parse.Promise.as(0);
    _.each(classcodes, function(classcode){
      promise = promise.then(function(i){
        if(resend){
          statuses.push(2);
          return Parse.Promise.as(i+1);
        }
        else{
          var classcode = classcodes[i];
          var checkmember = false;
          if(checkmembers)
            checkmember = checkmembers[i];
          var index = _.findIndex(created_groups, function(created_group){
            return created_group[0] == classcode;
          });
          if(index >= 0){
            if(checkmember){
              return isClassActivated({
                "code": classcode
              }).then(function(result){
                if(result){
                  statuses.push(1);
                }
                else{
                  statuses.push(0);
                }
                return Parse.Promise.as(i+1);
              });
            }
            else{
              statuses.push(1);
            }
          }
          else{
            flag = false;
            statuses.push(0);
          }
          return Parse.Promise.as(i+1);
        }
      });
    });
    return promise.then(function(){
      var output = {
        "flag": flag,
        "statuses": statuses 
      };
      return Parse.Promise.as(output);
    });
  });
}


/*
Function to send text message to single class
  Input =>
    classcode: String
    classname: String
    name: String
    username: String
    message: String
  Output =>
    JSON Object{
      messageId: String
      createdAt: String
    }
  Procedure =>
    Save entry in groupdetail and send push to app user and send sms to message user
*/
exports.sendTextMessage = function(request){  
  var name = request.name;
  var username = request.username;
  var classcode = request.classcode;
  var classname = request.classname;
  var message = request.message;
  var GroupDetails = Parse.Object.extend("GroupDetails");
  var groupdetail = new GroupDetails();
  return groupdetail.save({
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
      var output = {
        messageId: groupdetailId,
        createdAt: groupdetail.createdAt
      };
      var msg = message;
      msg = classname + ": " + msg;
      var query = new Parse.Query("Messageneeders");
      query.equalTo("cod", classcode);
      query.doesNotExist("status");
      return query.find().then(function(msgnds){
        var numbers = _.map(msgnds, function(msgnd){
          return msgnd.get("number");
        });
        if(/^[\x00-\x7F]+$/.test(msg)){
          return run.bulkSMS({
            "numbers": numbers,
            "msg": msg,
            "groupdetailId": groupdetailId
          });  
        }
        else{
          return run.bulkUnicodeSMS({
            "numbers": numbers,
            "msg": msg,
            "groupdetailId": groupdetailId
          });
        }
      }).then(function(){
        return Parse.Promise.as(output);
      });
    });
  });
}

/*
Function to send photo text message to single class
  Input =>
    classcode: String
    classname: String
    name: String
    username: String
    message: String
    parsefile: String
    filename: String
  Output =>
    JSON Object{
      messageId: String
      createdAt: String
    }
  Procedure =>
    Save entry in groupdetail and send push to app user and send sms to message user
*/
exports.sendPhotoTextMessage = function(request){
  var name = request.name;
  var username = request.username;
  var classcode = request.classcode;
  var classname = request.classname;
  var parsefile = request.parsefile;
  var filename = request.filename;
  var message = request.message;
  var msg;
  var GroupDetails = Parse.Object.extend("GroupDetails");
  var groupdetail = new GroupDetails();
  var url;
  return groupdetail.save({
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
        "msg": msg,
        "alert": msg,
        "badge": "Increment",
        "groupName": classname,
        "type": "NORMAL",
        "action": "INBOX"
      }
    }).then(function(response){
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
          if(/^[\x00-\x7F]+$/.test(msg)){
            return run.bulkSMS({
              "numbers": numbers,
              "msg": msg,
              "groupdetailId": groupdetailId
            });  
          }
          else{
            return run.bulkUnicodeSMS({
              "numbers": numbers,
              "msg": msg,
              "groupdetailId": groupdetailId
            });
          }
        }).then(function(){
          return Parse.Promise.as(output);
        });
      }, function(httpResponse){
        var error = {
          "code": httpResponse.data.code,
          "message": httpResponse.data.error
        };
        return Parse.Promise.error(error);
      });
    });
  });
}
