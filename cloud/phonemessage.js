var run = require('cloud/oldVersionSupport/old.js');
var _ = require('underscore.js');

/*
Function to send message to sms subscriber in case of text message
pattern of message is sender name: message
  Input =>
    classcode: String 
    messsage: String // max. upto 300 characters
  Output =>
    response: String // In case of success return message send successfully or no number to send (in case there is no member is via sms) or otherwise error 
  Description =>
    Process retrieves sms subscribers from Messageneeders class and then send subscription message to each one 
*/
exports.messagecc = function(request, response){
  var c = request.params.classcode;
  var msg = request.params.message;
  var name = request.user.get("name");
  msg = name + ": " + msg;
  var Messageneeders = Parse.Object.extend("Messageneeders");
  var query = new Parse.Query(Messageneeders);
  msg = msg.substr(0, 330);
  query.equalTo("cod", c);
  query.find().then(function(results){
    if(results){
      var numbers = _.map(results, function(result){
        return result.get('number');
      });
      return run.smsText({
        "numbers": numbers,
        "msg": msg
      }).then(function(text){
        return Parse.Promise.as("Message send successfully");
      });
    }
    else{
      return Parse.Promise.as("No number to send");
    }
  }).then(function(text){
    response.success(text);
  },function(error){
    console.log(error);
    response.error(error.code + ": " + error.message);
  });
}

/*
Function to send message to phone user in case of their teacher has sent an image attached in that subscribers get a message having applink to download
  Input =>
    classcode: String 
  Output => 
    response: String // In case of success return Done or no number to send (in case there is no member is via sms) or otherwise error
  Description =>
    Process retrieves sms subscribers from Messageneeders class and then send sample message to each one
  TODO =>   
    ios app link has to be added latter
*/
exports.samplemessage = function(request, response) {
  var c = request.params.classcode;
  var name = request.user.get("name");
  var Messageneeders = Parse.Object.extend("Messageneeders");
  var query = new Parse.Query(Messageneeders);
  var msg = "Your Teacher " + name + " has sent you an attachment, we can't send you pics over mobile, so download our android-app http://goo.gl/Ptzhoa";
  query.equalTo("cod", c);
  query.find().then(function(results){
    if(results){
      var numbers = _.map(results, function(result){
        return result.get('number');
      });
      return run.smsText({
        "numbers": numbers,
        "msg": msg
      }).then(function(text){
        return Parse.Promise.as("Done");
      });
    }
    else{
      return Parse.Promise.as("No number to send");
    }
  }).then(function(text){
    response.success(text);
  },function(error){
    console.log(error);
    response.error(error.code + ": " + error.message);
  });
}