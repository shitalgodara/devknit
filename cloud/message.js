var run = require('cloud/run.js');
var _ = require('underscore.js');

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
  var clcode = request.params.classcode;
  var classname = request.params.classname;
  var name = request.user.get("name");
  var email = request.user.get("username");
  var message = request.params.message;
  var GroupDetails = Parse.Object.extend("GroupDetails");
  var groupdetails = new GroupDetails();
  groupdetails.save({
      Creator: name,
      name: classname,
      title: message,
      senderId: email,
      code: clcode
  }).then(function(obj){
    return Parse.Push.send({
      channels: [clcode],
      data: {
        msg: message,
		    alert: message,
        badge: "Increment",
        groupName: classname,
		    type: "NORMAL",
		    action: "INBOX"
      }
    });
  }).then(function(){
    var result = {
      messageId: groupdetails.id,
      createdAt: groupdetails.createdAt
    };
    var c = clcode;
    var msg = message;
    msg = classname + ": " + msg;
    var Messageneeders = Parse.Object.extend("Messageneeders");
    var query = new Parse.Query(Messageneeders);
    msg = msg.substr(0, 330);
    query.equalTo("cod", c);
    query.notEqualTo("status", "REMOVED");
    return query.find().then(function(results){
      var numbers = _.map(results, function(res){
        return res.get("number");
      });
      return run.smsText2({
        "numbers": numbers,
        "msg": msg
      });  
    }).then(function(){
      return result;
    });
  }).then(function(result){
    response.success(result);
  },
  function(error){
    console.error(error);
    response.error(error.code + ": " + error.message);
  });
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
  var clcode = request.params.classcode;
  var classname = request.params.classname;
  var name = request.user.get("name");
  var email = request.user.get("username");
  var parsefile = request.params.parsefile;
  var filename = request.params.filename;
  var message = request.params.message;
  var msg;
  var GroupDetails = Parse.Object.extend("GroupDetails");
  var groupdetails = new GroupDetails();
  var url;
  groupdetails.save({
    Creator: name,
    name: classname,
    title: message,
    senderId: email,
    code: clcode,
    attachment: parsefile,
    attachment_name: filename
  }).then(function(obj){
    if (message == "") 
      msg = "You have received an Image";
    else
      msg = message;
    url = obj.get('attachment').url();
    return Parse.Push.send({
      channels: [clcode],
      data: {
        msg: msg,
		    alert: msg,
        badge: "Increment",
        groupName: classname,
		    type: "NORMAL",
		    action: "INBOX"
      }
    });
  }).then(function(){
    var result = {
      messageId: groupdetails.id,
      createdAt: groupdetails.createdAt
    };
    var c = clcode;
    var username = name;
    msg = classname + ": " + msg;
    msg = msg + ", Your Teacher " + username + " has sent you an attachment, we can't send you pics over mobile, so download our android-app http://goo.gl/Ptzhoa";
    msg = msg + " you can view image at ";
    Parse.Cloud.httpRequest({
      url: 'http://tinyurl.com/api-create.php',
      params: {
        url : url
      }
    }).then(function(httpResponse){
      msg = msg + httpResponse.text;
      var Messageneeders = Parse.Object.extend("Messageneeders");
      var query = new Parse.Query(Messageneeders);
      query.equalTo("cod", c);
      query.notEqualTo("status", "REMOVED");
      query.find().then(function(results){
        var numbers = _.map(results, function(res){
          return res.get("number");
        });
        return run.smsText2({
          "numbers": numbers,
          "msg": msg
        });  
      }).then(function(){
        response.success(result);
      }, function(error){
        console.error(error);
        response.error(error.code + ": " + error.message);
      });
    }, function(httpResponse){
      console.error(httpResponse.data);
      response.error(httpResponse.data.code + ": " + httpResponse.data.error);
    });
  },
  function(error){
    console.error(error);
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
  var clcode = request.params.classcode;
  var limit = request.params.limit;
  var query = new Parse.Query("GroupDetails");
  query.equalTo("code", clcode);
  query.descending("createdAt");
  query.limit(limit);
  query.find({
    success: function(results) {
      response.success(results);
    },
    error: function(error) {
      response.error("Error: " + error.code + " " + error.message);
    }
  });
}

/*
Function to get latest messages of all joined classes
  Input => 
    date: String 
  Output =>
    objects of GroupDetails with fields attachment,code,title,
  Procedure =>
    Simple query on groupdetail
*/
exports.showLatestMessages = function(request, response){
  var clarray1 = request.user.get("joined_groups");
  if(typeof clarray1 == 'undefined')
    response.success([]);
  else{
    var clarray=[];
    for(var i = 0; i < clarray1.length; i++){
      clarray[i]=clarray1[i][0];
    }
    var date = request.params.date;
    var query = new Parse.Query("GroupDetails");
    query.greaterThan("createdAt", date);
    query.containedIn("code", clarray);
    query.descending("createdAt");   
    query.find({
      success: function(results){
        response.success(results);
      },
      error: function(error){
        console.log("Error: " + error.code + " " + error.message);
        response.error("Error: " + error.code + " " + error.message);
      }
    });
  }
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
exports.showLatestMessagesWithLimit= function(request, response){
  var type = request.params.classtype;
  var limit = request.params.limit;
  var query = new Parse.Query("GroupDetails");
  query.descending("createdAt");
  query.limit(limit);
  if(type == 'c'){
    var clarray1 = request.user.get("Created_groups");
    var clarray = [];
    if(typeof clarray1 != 'undefined'){
      for(var i = 0; i < clarray1.length; i++)
        clarray[i]=clarray1[i][0];
    }
  }
  else if(type == 'j'){
    var clarray1 = request.user.get("joined_groups");
    var clarray = [];
    if(typeof clarray1 != 'undefined'){
      for(var i = 0; i < clarray1.length; i++)
        clarray[i]=clarray1[i][0];
    }
  }
  console.log(clarray);
  query.containedIn("code", clarray);
  query.find({
    success: function(results){
      if(type == 'c'){
        console.log("1st");
        response.success(results);
      }
      else if(results.length == 0){
        console.log("2nd");
          var result = {
            "message": results,
            "states": results
          };
        response.success(result);
      }
      else{
        console.log("3rd");
        var messageIds = [];
        for(var i = 0; i < results.length; i++){
          messageIds[i] = results[i].id;
        }
        console.log(messageIds);
        var query = new Parse.Query("MessageState");
        query.equalTo("username", request.user.get("username"));
        query.containedIn("message_id", messageIds);
        query.find({
          success: function(result2){
            console.log(result2.length);
	          var result = {
              "message": results,
              "states": result2
            };
            response.success(result);
          },
          error: function(error){
            response.error("Error: " + error.code + " " + error.message);
          }
        });
      }
    },
    error: function(error){
      response.error("Error: " + error.code + " " + error.message);
    }
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
exports.showOldMessages = function(request, response){
  var query = new Parse.Query("GroupDetails");
  var limit = request.params.limit;
  var date = request.params.date;
  query.lessThan("createdAt", date);
  query.limit(limit);
  query.descending("createdAt");
  var type = request.params.classtype;
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
      for(var i = 0; i < clarray1.length; i++)
        clarray[i] = clarray1[i][0];
    }
  }
  query.containedIn("code", clarray);
  query.find({
    success: function(results){
      if(type == 'c')
        response.success(results);
      else if(results.length == 0){
        var result = {
          "message": results,
          "states": results
        };
        response.success(result);
      }
      else{
        var messageIds = [];
        for(var i = 0; i < results.length; i++){
          messageIds[i] = results[i].id;
        }
        var query = new Parse.Query("MessageState");
        query.equalTo("username", request.user.get("username"));
        query.containedIn("message_id", messageIds);
        query.find({
          success: function(result2){
	          var result = {
              "message": results,
              "states": result2
            };
            response.success(result);
          },
          error: function(error){
            response.error("Error: " + error.code + " " + error.message);
          }
        });
      }
    },
    error: function(error){
      response.error("Error: " + error.code + " " + error.message);
    }
  });
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
  var child = request.params.subscriber;
  var phno = request.params.number;
  var Messageneeders = Parse.Object.extend("Messageneeders");
  var msgnd = new Messageneeders();
  msgnd.set("cod", classcode);
  msgnd.set("subscriber", child);
  msgnd.set("number", "91" + phno.substr(phno.length - 10));
  msgnd.save().then(function(msgnd){
    response.success(true);
  }, function(error){
    response.error(error.code + " " + error.message);
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
  var query = new Parse.Query("GroupDetails");
  var limit = request.params.limit;
  var date = request.params.date;
  query.lessThan("createdAt", date);
  query.limit(limit);
  query.descending("createdAt");
  var type = request.params.classtype;
  if(type == 'c'){
    var clarray1 = request.user.get("Created_groups");
    var clarray = [];
    if(typeof clarray1 != 'undefined'){
      for(var i = 0; i < clarray1.length; i++)
      clarray[i]=clarray1[i][0];
    }
  }
  else if(type =='j'){
    var clarray1 = request.user.get("joined_groups");
    var clarray = [];
    if(typeof clarray1 != 'undefined'){
      for (var i = 0; i < clarray1.length; i++)
        clarray[i] = clarray1[i][0];
    }
  }
  query.containedIn("code", clarray);
  query.find({
    success: function(results){
      if(type == 'c')
        response.success(results);
      else if(results.length == 0){
        var result = {
          "message": results,
          "states": results
        };
        response.success(result);
      }
      else{
        var messageIds = [];
        for(var i = 0;i < results.length; i++){
          messageIds[i] = results[i].id;
        }
        var query = new Parse.Query("MessageState");
        query.equalTo("username", request.user.get("username"));
        query.containedIn("message_id", messageIds);
        query.select("message_id");
        query.find({
          success: function(result2){
            var results3 = {};
            if(result2.length > 0){
              for(var i = 0; i < result2.length; i++){
                var temp_array = [0,1];
                if(result2[i].get("like_status") == true)
                  temp_array = [1,0];
                results3[result2[i].get("message_id")] = temp_array;                
              }
            }
            var result = {
              "message": results,
              "states": result3
            };
            response.success(result);
          },
          error: function(error){
            response.error("Error: " + error.code + " " + error.message);
          }
        });
      }
    },
    error: function(error){
      response.error("Error: " + error.code + " " + error.message);
    }
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
  console.log(type);
  console.log(limit);
  var query = new Parse.Query("GroupDetails");  
  query.descending("createdAt");
  query.limit(limit);
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
  query.containedIn("code", clarray);
  query.find({
    success: function(results){
      if(type == 'c'){
        console.log("1st");
        response.success(results);
      }
      else if(results.length == 0){
        console.log("2nd");
        var result = {
          "message": results,
          "states": results
        };
        response.success(result);
      }
      else{
        console.log("3rd");
        var messageIds = [];
        for(var i = 0; i < results.length; i++){
          messageIds[i] = results[i].id;
        }
        console.log(messageIds);
        console.log(request.user.get("username"));
        var query = new Parse.Query("MessageState");
        query.equalTo("username", request.user.get("username"));
        query.containedIn("message_id", messageIds);
        query.find({
          success: function(result2){
            console.log(result2.length);
            var results3 = {};
            if(result2.length > 0){
              for(var i = 0; i < result2.length; i++){
                var temp_array = [0,1];
                if(result2[i].get("like_status") == true)
                  temp_array = [1,0];
                results3[result2[i].get("message_id")] = temp_array;
              }
            }
            var result = {
              "message": results,
              "states": result3
            };
            response.success(result);
          },
          error: function(error){
            response.error("Error: " + error.code + " " + error.message);
          }
        });
      }
    },
    error: function(error){
      response.error("Error: " + error.code + " " + error.message);
    }
  });
}