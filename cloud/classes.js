var run = require('cloud/run.js');
var _ = require('cloud/underscore-min.js');

/*
Function for creating class  
  Input =>
    user: Parse User
    classname: String
  Output =>
    JSON Object{
      Created_groups: Array
      codegroup: Parse Object
    }
  Procedure =>
    * Username is taken from Parse User 
    * Class code is created and class name is modified
    * Added new item in Created_groups of user if not present already
    * Check first already created or not in client side also remove space in names of class
*/
exports.createClass = function(request, response){
  var user = request.user;
  var username = user.get("username");

  var classname = request.params.classname;
  classname = classname.trim();
  classname = classname.toUpperCase();
  classname = classname.replace(/[''""]/g, ' ');

  var created_groups = user.get("Created_groups");
  var index = _.findIndex(created_groups, function(created_group){
    return created_group[1] == classname;
  });

  var promise;
  if(index >= 0){
    var query = new Parse.Query("Codegroup");
    query.equalTo("name", classname);
    query.equalTo("senderId", username);
    promise = query.first();
  }
  else{
    var name = user.get("name");
    var classcode = name.split(" ");
    if(classcode.length > 1)
      classcode = classcode[1];
    else
      classcode = classcode[0];
    classcode = classcode.substr(0,3);
    classcode = classcode.replace(/\W/g, ''); // removing non-alphanumeric characters
    classcode = classcode.toUpperCase();
    if(classcode[0] >= 0) // In case first character of classcode is number
      classcode = 'Y' + classcode.substr(1);
    if(classcode.length != 3){
      if(classcode.length == 2)
        classcode = "Z" + classcode;
      if(classcode.length == 1)
        classcode = "ZY" + classcode;
      if(classcode.length == 0)
        classcode = "ZZZ";
    }
    var num = Math.floor(Math.random() * 10000);
    num = num.toString();
    if(num.length == 3)
      num = "0" + num;
    else if(num.length == 2)
      num = "00" + num;
    else if(num.length == 1)
      num = "000" + num;
    else if(num.length == 5)
      num = num.substr(0,4);
    classcode = classcode + num;

    var pid = user.get("pid");
    var sex = user.get("sex");

    var array = [classcode, classname];
    created_groups.push(array);
    user.set("Created_groups", created_groups);
    promise = user.save().then(function(user){
      var Codegroup = Parse.Object.extend("Codegroup");
      var codegroup = new Codegroup();
      return codegroup.save({
        name: name,
        code: classcode,
        Creator: name,
        classExist: true,
        senderId: username,
        senderPic: pid,
			 sex: sex
      });
    });
  };
  promise.then(function(codegroup){
    var output = {
      "Created_groups": created_groups,
      "codegroup": codegroup
    };
    response.success(output);
  }, function(error){
    response.error(error.code + ": " + error.message);
  });
}

/*
Function to delete user's created class
  Input =>
    classcode: String 
  Output =>
    Created_groups: Array
  Procedure =>
    * Deleted class entry in Created_groups 
    * Made classExist entry of Codegroup class false,
    * Entry saved for groupdetail for delete class message 
    * Finally send delete message to all members of group
*/
exports.deleteClass = function(request, response){
  var user = request.user;
  var classcode = request.params.classcode;
  var created_groups = user.get("Created_groups");
  var index = _.findIndex(created_groups, function(created_group){
    return created_group[0] == classcode;
  });

  var promise = Parse.Promise.as();
  if(index >= 0){
    created_groups = _.reject(created_groups, function(created_group){
      return created_group[0] == classcode;
    });
    user.set("Created_groups", created_groups);
    promise = promise.then(function(){
      return user.save();
    }).then(function(user){
      var Codegroup = Parse.Object.extend("Codegroup");
      var query = new Parse.Query(Codegroup);
      query.equalTo("code", classcode);
      return query.first();
    }).then(function(codegroup){
      codegroup.set("classExist", false);
      return codegroup.save();
    }).then(function(codegroup){
      var name = user.get("name");
      var classname = codegroup.get("name");
      var username = user.get("username");
      var message = "Your Teacher " + name + " has deleted his class " + classname;
      var GroupDetails = Parse.Object.extend("GroupDetails");
      var groupdetails = new GroupDetails();
      return groupdetails.save({
        Creator: name, 
        name: classname,
        title: message,
        senderId: username,
        code: classcode
      }).then(function(groupdetails){
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
        });
      });
    });
  }
  promise.then(function(){
    response.success(created_groups);
  }, function(error){
    response.error(error.code + ": " + error.message);
  });
} 


/* 
Function to return all details related to joined or created classes through codegroup table
  Input => 
    Nothing
  Output =>
    Codegroup entries
  Procedure =>
    Simple query on user created and joined group then on codegroup table
*/
exports.giveClassesDetails = function(request, response){
  var joined_groups = request.user.get("joined_groups");
  var created_groups = request.user.get("Created_groups");
  var classcodes = [];
  if(typeof joined_groups != 'undefined'){
    _.each(joined_groups, function(joined_group){
        classcodes.push(joined_group[0]);
    });
  }
  if(typeof created_groups != 'undefined'){
    _.each(created_groups, function(created_group){
        classcodes.push(created_group[0]);
    });
  }
  var promise = Parse.Promise.as([]);
  if(classcodes.length > 0){
    var query = new Parse.Query("Codegroup");
    query.containedIn("code", classcodes);
    promise = promise.then(function(){
      return query.find();
    });
  }
  promise.then(function(results){
    response.success(results);
  }, function(error){
    response.error(error.code + ": " + error.message);    
  });
}

/*
Function to remove member from any joined class and send him notification regarding that
  Input =>
    classname: String
    classcode: String
    usertype: String // App user or sms user
    <App user>   
      emailId: String  
    <SMS user> 
      number: String
  Output =>
    flag: Bool //true in case of successful removal
  Procedure =>
    <App user>
      * Made status entry to REMOVED in Groupmember class using emailId and classcode
      * Changed entry in joined group
      * Clear all the installations and send push notificaions at all the installations(using target push)
    <SMS user>
      * Made status entry to REMOVED in Messageneeders class using classcode and number 
      * Send message saying removed
*/
exports.removeMember = function(request, response){
  var classname = request.params.classname;
  var classcode = request.params.classcode;
  var usertype = request.params.usertype;
  var promise = Parse.Promise.as();
  if(usertype == 'app'){
    var username = request.params.emailId;
    promise = promise.then(function(){
      var query = new Parse.Query("GroupMembers");
      query.equalTo("code", classcode);
      query.equalTo("emailId", username);
      return query.first();
    }).then(function(groupmember){
      var status = groupmember.get("status");  
      if(typeof status == 'undefined'){
        groupmember.set("status", "REMOVED");
        return groupmember.save().then(function(groupmember){
          var query = new Parse.Query(Parse.User);
          query.equalTo("username", username);
          return query.first();
        }).then(function(user){
          var joined_groups = user.get("joined_groups");
          joined_groups = _.reject(joined_groups, function(joined_group){
            return joined_group[0] == classcode;
          });
          user.set("joined_groups", joined_groups);
          return user.save();
        }).then(function(user){
          Parse.Cloud.useMasterKey();
          var query = new Parse.Query(Parse.Installation);
          query.equalTo("username", username);
          return query.each(function(installation){  
            installation.remove("channels", classcode);
            return installation.save();
          });
        }).then(function(){
          var query = new Parse.Query(Parse.Installation);
          var message = "You have been removed from " + classname + " class, you won't receive any notification from this class from now onwards";
          query.equalTo("username", username);
          return Parse.Push.send({
            where: query,
            data: {                        
              msg: message,
              alert: message,
              badge: "Increment",
              groupName: classname,
              groupCode: classcode,
              type: "REMOVE",
              action: "INBOX"        
            }
          });
        });
      }
      else{
        return Parse.Promise.as();
      }
    });
  }
  else{
    var number = request.params.number;
    var query = new Parse.Query("Messageneeders");
    query.equalTo("cod", classcode);
    query.equalTo("number", number);
    promise = promise.then(function(){
      return query.first();
    }).then(function(msgnd){
      if(msgnd.get("status") == "REMOVED"){
        return Parse.Promise.as();
      }
      else{
        msgnd.set("status", "REMOVED");
        return msgnd.save().then(function(msgnd){
          var numbers = [number];
          return run.bulkSMS({
            "numbers": numbers,
            "msg": "You have been removed from your teachers " +  classname + " class, now you will not recieve any message from your Teacher"
          });
        });
      }
    });
  }
  promise.then(function(){
    response.success(true);
  }, function(error){
    response.error(error.code + ": " + error.message);
  });                        
}

/*
Function for user to leave a class 
  Input =>
    classcode: String
    <Old>
      installationObjectId: String 
    <New>
      installationId: String
  Output =>
    joined_groups: Array
  Procedure =>
    * Changed entry in joined group
    * Clear classcode from channels entry in Installation class 
    * Set status entry to LEAVE in Groupmember class
*/
exports.leaveClass = function(request, response){
  var user = request.user;
  var classcode = request.params.classcode;
  var joined_groups = user.get("joined_groups");
  var index = _.findIndex(joined_groups, function(joined_group){
    return joined_group[0] == classcode;
  });

  var promise = Parse.Promise.as();
  if(index >= 0){
    joined_groups = _.reject(joined_groups, function(joined_group){
      return joined_group[0] == classcode;
    });
    var username = user.get("username");
    user.set("joined_groups", joined_groups);
    promise = promise.then(function(){
      return user.save();
    }).then(function(user){
      var query = new Parse.Query("GroupMembers");
      query.equalTo("code", classcode);
	    query.equalTo("emailId", username);
		  return query.first();
    }).then(function(groupmember){
      groupmember.set("status", "LEAVE");
      return groupmember.save();
    }).then(function(groupmember){
      Parse.Cloud.useMasterKey();
      var query = new Parse.Query(Parse.Installation);
      var installationObjectId = request.params.installationObjectId;
      if(installationObjectId){
        query.equalTo("objectId", installationObjectId);
      }
      else{
        var installationId = request.params.installationId;
        query.equalTo("installationId", installationId);
      }
      return query.first().then(function(installation){
        installation.remove("channels", classcode);
        return installation.save();
      });
    });
  }
  promise.then(function(){
    response.success(joined_groups);
  }, function(error){
    response.error(error.code + ": " + error.message);
  });
}

/*
Function to join a class 
  Input =>
    classCode: String
    associateName: String
    <Old>
      installationObjectId: String 
    <New>
      installationId: String
  Output =>
    JSON Object{ 
      joined_groups: Array
      codegroup: Parse Object
		  messages: Array // 5 atmost
	  }
  Procedure =>
    * Checked the existence of class code 
    * Added in user joined_groups 
    * Added entry in GroupMembers  
    * Added installation of currentuser 
    * Finally showing atmost 5 messages from the last 5 days 
*/
exports.joinClass = function(request, response){
  var user = request.user;
  var username = user.get("username");
  var classcode = request.params.classCode;
  classcode = classcode.trim();
  classcode = classcode.toUpperCase();
  var query = new Parse.Query("Codegroup");
  query.equalTo("code", classcode);  
  query.first().then(function(codegroup){
    if(codegroup.length > 0){
      var joined_groups = user.get("joined_groups");
      var index = _.findIndex(joined_groups, function(joined_group){
        return joined_group[0] == classcode;
      });
      var promise = Parse.Promise.as();
      if(index < 0){
        var child = request.params.associateName;
        var children_names = [child];
        var classname = codegroup.get('name');
        var array = [classcode, classname, child];
        joined_groups.push(array);
        promise = promise.then(function(){
          user.set("joined_groups", joined_groups);
          return user.save();
        }).then(function(user){
          var GroupMembers = Parse.Object.extend("GroupMembers");
          var groupmembers = new GroupMembers();
          groupmembers.set("name", user.get("name"));
          groupmembers.set("code", classcode);
          groupmembers.set("children_names", children_names);
          groupmembers.set("emailId", username);
          return groupmembers.save();
        }).then(function(groupmembers){
          Parse.Cloud.useMasterKey();
          var query = new Parse.Query(Parse.Installation);
          var installationObjectId = request.params.installationObjectId;
          if(installationObjectId){
            query.equalTo("objectId", installationObjectId);
          } 
          else{
            var installationId = request.params.installationId;
            query.equalTo("installationId", installationId);
          }          
          return query.first().then(function(installation){
            installation.addUnique("channels", classcode);
            return installation.save();
          });
        });
      }
      promise.then(function(){
        var query = new Parse.Query("GroupDetails");
        query.equalTo("code", classcode);
        var d = new Date();
        var e = new Date(d.getTime() - 432000000);
        query.greaterThan("createdAt", e);
        query.descending("createdAt");
        query.limit(5);
        return query.find();
      }).then(function(results){
        var output = {
          "joined_groups": joined_groups,
          "messages": results,
          "codegroup": codegroup
        };
        response.success(output);
      }, function(error){
        response.error(error.code + ": " + error.message);
      });
    }
    else{
      response.error("No such class exits");
    }
  }, function(error){
    response.error(error.code + ": " + error.message);
  });
}