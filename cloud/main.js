/*---------------------------------------file includes--------------------------------------------*/
var phonemessage = require('cloud/phonemessage.js');
var subscriber = require('cloud/subscriber.js');
var time = require('cloud/time.js');
var message = require('cloud/message.js');
var messagecount = require('cloud/messagecount.js');
var classes = require('cloud/classes.js');
var channel= require('cloud/channel.js');
var user= require('cloud/user.js');
var rest= require('cloud/rest.js');
var temp= require('cloud/temp.js');
var schoolapi= require('cloud/schoolapi.js');
var inbox = require('cloud/inbox.js');
var login = require('cloud/login.js');
var mail = require('cloud/mail.js');
var analytics = require('cloud/analytics.js');
var followup = require('cloud/followup.js');
var _ = require('underscore.js');

/*------------------------------------------------after/before functions---------------------------*/
Parse.Cloud.afterSave("Messageneeders", function(request){
  var num = request.object.get("number");
  var code = request.object.get("cod");
  console.log(request.object.get("status"));
  if((request.object.get("status")!="LEAVE") && (request.object.get("status") != "REMOVED")){
    console.log("in");
    var a = code;
    a = a.replace(/\s+/g, '');
    a = a.toUpperCase();
    var Codegroup = Parse.Object.extend("Codegroup");
    var query = new Parse.Query("Codegroup");
    query.equalTo("code", a);
    query.first({
      success: function(obj){
        if(obj){
          var cls = obj.get("Creator");
          var nam = obj.get("name");    
          Parse.Cloud.httpRequest({
            url: 'http://enterprise.smsgupshup.com/GatewayAPI/rest',
            headers: {
              'Content-Type': 'application/json'
            },
            params: {
              method: 'sendMessage',
              send_to: num,
              msg: "Congratulations you have successfully subscribed to" + " " + cls + "'s " + nam + " " + "classroom You will start receieving messages as soon as your Teacher start using it",
              msg_type: 'Text',
              userid: '2000133095',
              auth_scheme: 'plain',
              password: 'wdq6tyUzP',
              v: '1.0',
              format: 'text'
            },
            success: function(httpResponse){
              console.log(httpResponse.text);
            },
            error: function(httpResponse){
              console.error('Request failed with response code ' + httpResponse.status);
            }
          });
        } 
        else{
    
            }
        },
        error: function(error){
        }
      });
  }
});
    
Parse.Cloud.afterSave("wrong", function(request){
  var num = request.object.get("number");
  var code = request.object.get("cod");
  var a = code;
  b = a.substr(0, 4);
  if (b == "STOP"){
    c = a.substr(4); 
    var Messageneeders = Parse.Object.extend("Messageneeders");
    var query = new Parse.Query(Messageneeders);
    query.equalTo("cod", c);
    query.equalTo("number", num);
    query.first({
          success: function(myObject){
            if (myObject){
              myObject.set("status","LEAVE");
              myObject.save({
                success: function(myObject){    
                  Parse.Cloud.httpRequest({
                    url: 'http://enterprise.smsgupshup.com/GatewayAPI/rest',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    params: {
                      method: 'sendMessage',
                      send_to: num,
                      msg: "You have been successfully unsubscribed,Now you will not recieve any message from your Teacher",
                      msg_type: 'Text',
                      userid: '2000133095',
                      auth_scheme: 'plain',
                      password: 'wdq6tyUzP',
                      v: '1.0',
                      format: 'text'
                    },
                    success: function(httpResponse){
                      console.log(httpResponse.text);  
                    },
                    error: function(httpResponse){
                      console.error('Request failed with response code ' + httpResponse.status);                                    
                    }
                  });
                },
                error: function(myObject, error){
                }
              });
            } 
            else{
            }
          },
          error: function(error){
          }
    });
  } 
  else{
    Parse.Cloud.httpRequest({
        url: 'http://enterprise.smsgupshup.com/GatewayAPI/rest',
        headers: {
          'Content-Type': 'application/json'
        },
        params: {
          method: 'sendMessage',
          send_to: num,
          msg: "You seems to hav entered a wrong Classcode,Genral format of code is  7 DIGIT CODE,if you dont know code Ask Teacher for code",
          msg_type: 'Text',
          userid: '2000133095',
          auth_scheme: 'plain',
          password: 'wdq6tyUzP',
          v: '1.0',
          format: 'text'
        },
        success: function(httpResponse){
          console.log(httpResponse.text);
          response.success(httpResponse.text);
        },
        error: function(httpResponse){
          console.error('Request failed with response code ' + httpResponse.status);
          response.error(httpResponse.text);
        }
    });
  }
});
    
/*---------------------------------------------JOBS----------------------*/

/*
Job to send like notifications
  Input => 
    Nothing
  Output =>
    Notitfication to the users
  Schedule =>
    8:00 am IST <=> 2:30 am UTC     
    12:00 pm IST <=> 6:30 am UTC
    4:00 pm IST <=> 10:30 am UTC
    8:00 pm IST <=> 2:30 pm UTC
*/
Parse.Cloud.job("sendLikeNotifications", function(request, status){ 
  var intervalTime = 14400000;
  var date = new Date();
  var currentTime = date.getTime();
  var currentHours = date.getHours();
  var dateLowerBound = new Date(currentTime - 6 * intervalTime);
  var dateUpperBound;
  switch(currentHours){
    case 2:
    case 6:
    case 10: 
      dateUpperBound = new Date(currentTime - 5 * intervalTime);
      break;
    case 14:
      dateUpperBound = new Date(currentTime - 3 * intervalTime);
      break;
    default:
      status.success("Not sending any like notifications at this time");
      break;
  }
  var query1 = new Parse.Query("GroupDetails");
  query1.greaterThanOrEqualTo("createdAt", dateLowerBound);
  query1.lessThan("createdAt", dateUpperBound);
  query1.greaterThan("like_count", 0);
  query1.select("objectId", "name", "title", "like_count", "senderId");
  query1.find().then(function(results){
    var promise = Parse.Promise.as();
    _.each(results, function(result){
      Parse.Cloud.useMasterKey();
      var query2 = new Parse.Query(Parse.Installation);
      var username = result.get("senderId");
      var post = result.get('title');
      if(post.length > 15){
        post = post.substr(0,12);
        post = post + "...";
      }
      if(post.length > 0){
        post = ' "' + post + '"';
      } 
      var msg = result.get("like_count") + " people like your post" + post;
      console.log(username + ": " + msg);
      query2.equalTo("username", username); 
      promise = promise.then(function(){
        return Parse.Push.send({
          where: query2, 
          data: {
            msg: msg,
            alert: msg,
            badge: "Increment",
            groupName: result.get("name"),
            type: "TRANSITION",
            action: "LIKE",
            id: result.id
          }
        });
      });
    });
    return promise;
  }).then(function(){
    status.success("Successful sent like notifications to all teachers !!");
  }, function(error){
    status.error(error);
  });
});

/*
Job to send confused notifications
  Input => 
    Nothing
  Output =>
    Notitfication to the users
  Schedule =>
    8:20 am IST <=> 2:50 am UTC     
    12:20 pm IST <=> 6:50 am UTC
    4:20 pm IST <=> 10:50 am UTC
    8:20 pm IST <=> 2:50 pm UTC
*/
Parse.Cloud.job("sendConfusedNotifications", function(request, status){ 
  var intervalTime = 14400000;
  var date = new Date();
  var currentTime = date.getTime();
  var currentHours = date.getHours();
  var dateLowerBound = new Date(currentTime - 6 * intervalTime);
  var dateUpperBound;
  switch(currentHours){
    case 2:
    case 6:
    case 10: 
      dateUpperBound = new Date(currentTime - 5 * intervalTime);
      break;
    case 14:
      dateUpperBound = new Date(currentTime - 3 * intervalTime);
      break;
    default:
      status.success("Not sending any confused notifications at this time");
      break;
  }
  var query1 = new Parse.Query("GroupDetails");
  query1.greaterThanOrEqualTo("createdAt", dateLowerBound);
  query1.lessThan("createdAt", dateUpperBound);
  query1.greaterThan("confused_count", 0);
  query1.select("objectId", "name", "title", "confused_count", "senderId");
    query1.find().then(function(results){
      var promise = Parse.Promise.as();
      _.each(results, function(result){
        Parse.Cloud.useMasterKey();
        var query2 = new Parse.Query(Parse.Installation);
        var username = result.get("senderId");
        var post = result.get('title');
        if(post.length > 15){
          post = post.substr(0,12);
          post = post + "...";
        }
        if(post.length > 0){
          post = ' "' + post + '"';
        } 
        var msg = result.get("confused_count") + " people seems to be confused by your post" + post;
        console.log(username + ": " + msg);
        query2.equalTo("username", username); 
        promise = promise.then(function(){
          return Parse.Push.send({
            where: query2, 
            data: {
              msg: msg,
              alert: msg,
              badge: "Increment",
              groupName: result.get("name"),
              type: "TRANSITION",
              action: "CONFUSE",
              id: result.id
            }
          });
        });
      });
      return promise;
    }).then(function(){
      status.success("Successful sent confused notifications to all teachers !!");
    }, function(error){
      status.error(error);
    });
});
/*----------------------------------------------------  CLOUD fUCNTIONs   -----------------------------------------------------*/
Parse.Cloud.define("getServerTime", function(request, response){
  response.success(new Date());
});
/*----------------------------------------------------  PHONEMESSAGE.JS   -----------------------------------------------------*/  
Parse.Cloud.define("messagecc", function(request, response){
    phonemessage.messagecc(request, response);
});

Parse.Cloud.define("samplemessage", function(request, response){
    phonemessage.samplemessage(request, response);
});

/*----------------------------------------------------  SUBSCRIBERS.JS   -----------------------------------------------------*/    
Parse.Cloud.define("showclassstrength", function(request, response){
    subscriber.showclassstrength(request, response);
});

Parse.Cloud.define("changeAssociateName", function(request, response){
    subscriber.changeAssociateName(request, response);
});

Parse.Cloud.define("showAllSubscribers", function(request, response){
    subscriber.showAllSubscribers(request, response);
});

Parse.Cloud.define("showSubscribers", function(request, response){
    subscriber.showSubscribers(request, response);
});
/*----------------------------------------------------  TIME.JS   -----------------------------------------------------*/
Parse.Cloud.define("toupdatetimebyclass", function(request, response){
    time.toupdatetimebyclass(request, response);
});
    
Parse.Cloud.define("toupdatetime", function(request, response){
    stime.toupdatetime(request, response);
});

/*----------------------------------------------------  MESSAGE.JS   -----------------------------------------------------*/   
Parse.Cloud.define("sendTextMessage", function(request, response){
    message.sendTextMessage(request, response);
});
    
Parse.Cloud.define("sendPhotoTextMessage", function(request, response){
    message.sendPhotoTextMessage(request, response);
});

Parse.Cloud.define("showClassMessages", function(request, response){
    message.showClassMessages(request, response);
});
    
Parse.Cloud.define("showLatestMessages", function(request, response){
    message.showLatestMessages(request, response);
});

Parse.Cloud.define("showLatestMessagesWithLimit", function(request, response){
    message.showLatestMessagesWithLimit(request, response);
});

Parse.Cloud.define("showOldMessages", function(request, response){
    message.showOldMessages(request, response);
});

Parse.Cloud.define("showLatestMessagesWithLimit2", function(request, response){
    message.showLatestMessagesWithLimit2(request, response);
});

Parse.Cloud.define("showOldMessages2", function(request, response){
    message.showOldMessages2(request, response);
});

Parse.Cloud.define("smsSubscribe", function(request, response){
    message.smsSubscribe(request, response);
});
/*----------------------------------------------------  MESSAGECOUNT.JS   -----------------------------------------------------*/   
Parse.Cloud.define("updateSeenCount", function(request, response){
    messagecount.updateSeenCount(request, response);
});

Parse.Cloud.define("updateCount", function(request, response){
    messagecount.updateCount(request, response);
});

Parse.Cloud.define("updateCount2", function(request, response){
    messagecount.updateCount2(request, response);
});

Parse.Cloud.define("updateLikeAndConfusionCount", function(request, response){
    messagecount.updateLikeAndConfusionCount(request, response);
});

Parse.Cloud.define("updateCounts", function(request, response){
    messagecount.updateCounts(request, response);
});
/*----------------------------------------------------  CLASSES.JS   -----------------------------------------------------*/
Parse.Cloud.define("createClass", function(request, response){
    classes.createClass(request, response);
});

Parse.Cloud.define("joinClass", function(request, response){
    classes.joinClass(request, response);
});

Parse.Cloud.define("deleteClass", function(request, response){
    classes.deleteClass(request, response);
});


Parse.Cloud.define("leaveClass", function(request, response){
    classes.leaveClass(request, response);
});

Parse.Cloud.define("removeMember", function(request, response){
    classes.removeMember(request, response);
});

Parse.Cloud.define("suggestClass", function(request, response){
    classes.suggestClass(request, response);
});

Parse.Cloud.define("suggestClasses", function(request, response){
    classes.suggestClasses(request, response);
});

Parse.Cloud.define("giveClassesDetails", function(request, response){
    classes.giveClassesDetails(request, response);
});
/*----------------------------------------------------  CHANNEL.JS   -----------------------------------------------------*/    
Parse.Cloud.define("removeChannels", function(request, response){
    channel.removeChannels(request, response);
});
    
Parse.Cloud.define("addChannels", function(request, response){
    channel.addChannels(request, response);
});
/*----------------------------------------------------  USER.JS   -----------------------------------------------------*/
Parse.Cloud.define("getUpdatesUserDetail", function(request, response){
    user.getUpdatesUserDetail(request, response);
});   
/*----------------------------------------------------  REST.JS   -----------------------------------------------------*/
Parse.Cloud.define("schoollist", function(request, response){
    rest.schoollist(request, response);
});
   
Parse.Cloud.define("getSchoolId", function(request, response){
    rest.getSchoolId(request, response);
}); 
Parse.Cloud.define("faq", function(request, response){
    rest.faq(request, response);
});
    
Parse.Cloud.define("feedback", function(request, response){
    rest.feedback(request, response);
});


Parse.Cloud.define("getSchoolName", function(request, response){
    rest.getSchoolName(request, response);
});


Parse.Cloud.define("findClass", function(request, response){
    rest.findClass(request, response);
});
/*----------------------------------------------------  INBOX.JS   -----------------------------------------------------*/ 
// increment like count
Parse.Cloud.define("likeCountIncrement", function(request, response){
    inbox.likeCountIncrement(request, response);
});
    
// decrement like count
Parse.Cloud.define("likeCountDecrement", function(request, response){
    inbox.likeCountDecrement(request, response);
});
    
// increment confused count
Parse.Cloud.define("confusedCountIncrement", function(request, response){
    inbox.confusedCountIncrement(request, response);
});
    
//decrement confused count
Parse.Cloud.define("confusedCountDecrement", function(request, response){
    inbox.confusedCountDecrement(request, response);
});
    
//increment seen count
Parse.Cloud.define("seenCountIncrement", function(request, response){
    inbox.seenCountIncrement(request, response);
});
    
//update message State(none, like, confused) and counts accordingly
Parse.Cloud.define("updateMessageState", function(request, response){
    inbox.updateMessageState(request, response);
});
    
//get like/confused/seen count
Parse.Cloud.define("getLikeConfusedCount", function(request, response){
    inbox.getLikeConfusedCount(request, response);
});
    
//get outbox messages for user(teacher)
Parse.Cloud.define("getOutboxMessages", function(request, response){
    inbox.getOutboxMessages(request, response);
});
   
//invite teacher from parent side
Parse.Cloud.define("inviteTeacher", function(request, response){
    inbox.inviteTeacher(request, response);
});

Parse.Cloud.define("inviteUsers", function(request, response){
    rest.inviteUsers(request, response);
});
/*----------------------------------------------------  TEMP.JS   -----------------------------------------------------*/
Parse.Cloud.define("cloudpic", function(request, response){
    temp.cloudpic(request, response);
});
/*---------------------------------------------------- SCHOOLAPI.JS   -------------------------------------------------*/
// areaAutoComplete(partialAreaName) - returns list of possible areas containing the given partialAreaName
Parse.Cloud.define("areaAutoComplete", function(request, response){
    schoolapi.areaAutoComplete(request, response);
});
// schoolsNearby(areaName) - returns list of schools in/around the given area.
Parse.Cloud.define("schoolsNearby", function(request, response){
    schoolapi.schoolsNearby(request, response);
});
/*---------------------------------------------------- LOGIN.JS   -------------------------------------------------*/
Parse.Cloud.define("genCode", function(request, response){
    login.genCode(request, response);
});

Parse.Cloud.define("verifyCode", function(request, response){
    login.verifyCode(request, response);
});

Parse.Cloud.define("verifyCod", function(request, response){
    login.verifyCod(request, response);
});

Parse.Cloud.define("appInstallation", function(request, response){
    login.appInstallation(request, response);
});

Parse.Cloud.define("appLogout", function(request, response){
    login.appLogout(request, response);
});
/*---------------------------------------------------- MAIL.JS   -------------------------------------------------*/
Parse.Cloud.define("mailInstructions", function(request, response){
    mail.mailInstructions(request, response);
});

Parse.Cloud.define("mailPdf", function(request, response){
  mail.mailPdf(request, response);
});
/*---------------------------------------------------- ANALYTICS.JS   -------------------------------------------------*/
Parse.Cloud.define("newSignUps", function(request, response){
    analytics.newSignUps(request, response);
});

Parse.Cloud.define("newMessageSent", function(request, response){
    analytics.newMessageSent(request, response);
});

Parse.Cloud.define("activeMessenger", function(request, response){
    analytics.activeMessenger(request, response);
});
/*---------------------------------------------------- FOLLOWUP.JS   -------------------------------------------------*/
Parse.Cloud.define("yesterdayNewSignUpDetails", function(request, response){
    followup.yesterdayNewSignUpDetails(request, response);
});

Parse.Cloud.define("getTodaysFollowUpDetails", function(request, response){
    followup.getTodaysFollowUpDetails(request, response);
});

Parse.Cloud.define("updateFollowUpDetails", function(request, response){
    followup.updateFollowUpDetails(request, response);
});

Parse.Cloud.define("expectedSignups", function(request, response){
    followup.expectedSignups(request, response);
});

Parse.Cloud.define("statusOfAllUsers", function(request, response){
    followup.statusOfAllUsers(request, response);
});

Parse.Cloud.define("KnitDiagram", function(request, response){
    followup.KnitDiagram(request, response);
});

Parse.Cloud.define("getEmailId", function(request, response){
    followup.KnitDiagram(request, response);
});

/*-------------------------- CLOUD FUNCTIONS ---------------------*/

function HashTable(obj){
    this.length = 0;
    this.items = {};
    for (var p in obj){
        if (obj.hasOwnProperty(p)){
            this.items[p] = obj[p];
            this.length++;
        }
    }

    this.setItem = function(key, value){
        var previous = undefined;
        if (this.hasItem(key)){
            previous = this.items[key];
        }
        else {
            this.length++;
        }
        this.items[key] = value;
        return previous;
    }

    this.getItem = function(key){
        return this.hasItem(key) ? this.items[key] : undefined;
    }

    this.hasItem = function(key){
        return this.items.hasOwnProperty(key);
    }
   
    this.removeItem = function(key){
        if (this.hasItem(key)){
            previous = this.items[key];
            this.length--;
            delete this.items[key];
            return previous;
        }
        else {
            return undefined;
        }
    }

    this.keys = function(){
        var keys = [];
        for (var k in this.items){
            if (this.hasItem(k)){
                keys.push(k);
            }
        }
        return keys;
    }

    this.values = function(){
        var values = [];
        for (var k in this.items){
            if (this.hasItem(k)){
                values.push(this.items[k]);
            }
        }
        return values;
    }

    this.each = function(fn){
        for (var k in this.items){
            if (this.hasItem(k)){
                fn(k, this.items[k]);
            }
        }
    }

    this.clear = function(){
        this.items = {}
        this.length = 0;
    }
}

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
Parse.Cloud.define("showappsubscribers", function(request, response){
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
});

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
Parse.Cloud.define("showsmssubscribers", function(request, response){
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
});

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
Parse.Cloud.define("showclassmessages", function(request, response){
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
});

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
Parse.Cloud.define("showallclassesmessages", function(request, response){
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
});