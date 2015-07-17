var run = require('cloud/run.js');

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
  var echannel;
  var eplatform = request.user.get("OS");
  var emodal = request.user.get("MODAL");
  var eusr = request.user.get("name");
  if((eplatform == 'IOS') || (eplatform == 'ANDROID') || (eplatform == 'WEB'))
    echannel = eplatform;
  else
    echannel = 'UNKNOWN';
  var classname = request.params.classname;
  classname = classname.toUpperCase();
  
  var name = request.user.get("name");
  name = name.split(" ");
  if(name.length > 1)
    name = name[1];
  else
    name = name[0];
  name = name.substr(0,3);
  name = name.replace(/\W/g, ''); // removing non-alphanumeric characters
  name = name.toUpperCase();
  if(name[0] >= 0) // In case first character of name is number
    name = 'Y' + name.substr(1);
  if(name.length != 3){
    if(name.length == 2)
      name = "Z" + name;
    if(name.length == 1)
      name = "ZY" + name;
    if(name.length == 0)
      name = "ZZZ";
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

  name = name + num;
  var classcode = name;
  classname = classname.toUpperCase();
  classname = classname.replace(/[''""]/g, ' ');
  var user = request.user;
  var currentname = user.get("name");
  var username = user.get("username");
  var pid = user.get("pid");
  var sex = user.get("sex");
  var array = [classcode, classname];
  user.addUnique("Created_groups", array);
  user.save().then(function(user){
    var Codegroup = Parse.Object.extend("Codegroup");
    var codegroup = new Codegroup();
    return codegroup.save({
      name: classname,
      code: classcode,
      Creator: currentname,
      classExist: true,
      senderId: username,
      senderPic: pid,
			sex: sex
    });
  }).then(function(codegroup){
    var output = {
      "Created_groups": user.get("Created_groups"),
      "codegroup": codegroup
    };
    return Parse.Promise.as(output);
  }).then(function(output){
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
  var echannel;
  var eplatform = request.user.get("OS");
  var emodal = request.user.get("MODAL");
  var eusr = request.user.get("name");
  if((eplatform == 'IOS') || (eplatform == 'ANDROID') || (eplatform == 'WEB'))
    echannel = eplatform;
  else
    echannel = 'UNKNOWN';
  var clcode = request.params.classcode;
  var user = request.user;
  var classname;
  var clarray = user.get("Created_groups");
  for(var i = 0; i < clarray.length; i++){
    if (clarray[i][0] == clcode){
      classname = clarray[i][1];
      clarray.splice(i, 1);
      break;
    }
  }
  user.set("Created_groups", clarray);
  user.save().then(function(user){
    var Codegroup = Parse.Object.extend("Codegroup");
    var query = new Parse.Query(Codegroup);
    query.equalTo("code", clcode);
    return query.first();
  }).then(function(object){
    object.set("classExist", false);
    return object.save();
  }).then(function(object){
    var name = request.user.get("name");
    var username = request.user.get("username");
    var message = "Your Teacher " + name + " has deleted his class " + classname;
    var GroupDetails = Parse.Object.extend("GroupDetails");
    var groupdetails = new GroupDetails();
    return groupdetails.save({
      Creator: name, 
      name: classname,
      title: message,
      senderId: username,
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
    });
  }).then(function(){
    response.success(user.get("Created_groups"));
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
  var echannel;
  var eplatform = request.user.get("OS");
  var emodal = request.user.get("MODAL");
  var eusr = request.user.get("name");
  if((eplatform == 'IOS') || (eplatform == 'ANDROID') || (eplatform == 'WEB'))
    echannel = eplatform;
  else
    echannel = 'UNKNOWN';
  var clarray1 = request.user.get("joined_groups");
  var clarray2 = request.user.get("Created_groups");
  if((typeof clarray1 == 'undefined') && (typeof clarray2 == 'undefined'))
    response.success([]);
  else{
    var clarray = [];
    var i;
    if(typeof clarray1 != 'undefined'){
      for (i = 0; i < clarray1.length; i++){
        clarray[i] = clarray1[i][0];
      }
    }
    if(typeof clarray2 != 'undefined'){
      for (var j = 0; j < clarray2.length; j++){
        clarray[i] = clarray2[j][0];
        i++;
      }
    }
    var query = new Parse.Query("Codegroup");
    query.containedIn("code", clarray);
    query.find().then(function(results){
      response.success(results);
    }, function(error){
      response.error(error.code + ": " + error.message);    
    });
  }
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
  var echannel;
  var eplatform = request.user.get("OS");
  if((eplatform == 'IOS') || (eplatform == 'ANDROID') || (eplatform == 'WEB'))
    echannel = eplatform;
  else
    echannel = 'UNKNOWN';
  Parse.Cloud.useMasterKey();
  var classname = request.params.classname;
  var clcode = request.params.classcode;
  var usertype = request.params.usertype;
  if(usertype == 'app'){
    var username = request.params.emailId;
    var query = new Parse.Query("GroupMembers");
    query.equalTo("code", clcode);
    query.equalTo("emailId", username);
    query.doesNotExist("status");
    query.first().then(function(object){
      object.set("status", "REMOVED");
      return object.save();
    }).then(function(object){
      var query = new Parse.Query(Parse.User);
      query.equalTo("username", username);
      return query.first();
    }).then(function(object){
      var clarray = object.get("joined_groups");
      for(var i = 0; i < clarray.length; i++){
        if(clarray[i][0] == clcode){
          clarray.splice(i, 1);
          break;
        }
      }
      object.set("joined_groups", clarray);
      return object.save();
    }).then(function(user){
      var query = new Parse.Query(Parse.Installation);
      query.equalTo("username", username);
      return query.find();
    }).then(function(results){        
        var allObjects = [];
        for (var i = 0; i < results.length; i++){ 
          results[i].remove("channels", clcode);
          allObjects.push(results[i]);
        }
        return Parse.Object.saveAll(allObjects);
    }).then(function(objs){
      var query = new Parse.Query(Parse.Installation);
      query.equalTo('username', username);
      query.ascending("updatedAt");
      query.limit(1);
      var message = "You have been removed from " + classname + " class, you won't receive any notification from this class from now onwards";
      return Parse.Push.send({
        where: query,
        data: {                        
          msg: message,
          alert: message,
          badge: "Increment",
          groupName: classname,
          groupCode: clcode,
          type: "REMOVE",
          action: "INBOX"        
        }
      });
    }).then(function(success){
      response.success(true);
    }, function(error){
      response.error(error.code + ": " + error.message);
    });         
  }
  else{
    var number = request.params.number;
    var query = new Parse.Query("Messageneeders");
    query.equalTo("cod", clcode);
    query.equalTo("number", number);
    query.first().then(function(myObject){
      myObject.set("status","REMOVED");
      return myObject.save(); 
    }).then(function(myObject){
      var numbers = [number];
      return run.bulkSMS({
        "numbers": numbers,
        "msg": "You have been removed from your teachers " +  classname + " class, now you will not recieve any message from your Teacher"
      });
    }).then(function(){
      response.success(true);
    }, function(error){
      response.error(error.code + ": " + error.message);
    });
  }                        
}

/*
Function for user to leave a class 
  Input =>
    classcode: String
    installationObjectId: String
  Output =>
    joined_groups: Array
  Procedure =>
    * Changed entry in joined group
    * Clear classcode from channels entry in Installation class 
    * Set status entry to LEAVE in Groupmember class
*/
exports.leaveClass = function(request, response){
  var echannel;
  var eplatform = request.user.get("OS");
  var emodal = request.user.get("MODAL");
  var eusr = request.user.get("name");
  if((eplatform == 'IOS') || (eplatform == 'ANDROID') || (eplatform == 'WEB'))
    echannel = eplatform;
  else
    echannel = 'UNKNOWN';
  Parse.Cloud.useMasterKey();
  var clcode = request.params.classcode;
  var ID = request.params.installationObjectId;
  var user = request.user;
  var clarray = request.user.get("joined_groups");
  for (var i = 0; i < clarray.length; i++){
    if (clarray[i][0] == clcode){
      clarray.splice(i, 1);
      break;
    }
  }
  user.set("joined_groups", clarray);
  user.save().then(function(user){
    var query = new Parse.Query("GroupMembers");
	  query.equalTo("code", clcode);
	  query.equalTo("emailId", user.get("username"));
		return query.first();
  }).then(function(object){
    object.set("status", "LEAVE");
    return object.save();
  }).then(function(object){
    var query = new Parse.Query(Parse.Installation);
    return query.get(ID);
  }).then(function(object){
    object.remove("channels", clcode);  
    return object.save();
  }).then(function(object){
    response.success(user.get("joined_groups"));
  }, function(error){
    response.error(error.code + ": " + error.message);
  });
}

/*
Function to join a class 
  Input =>
    classCode: String
    associateName: String
    installationObjectId: String
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
  var echannel;
  var eplatform = request.user.get("OS");
  if((eplatform == 'IOS') || (eplatform == 'ANDROID') || (eplatform == 'WEB'))
    echannel = eplatform;
  else
    echannel = 'UNKNOWN';
  var classcode = request.params.classCode;
  var child = request.params.associateName;
  var childnam = [child];
  classcode = classcode.toUpperCase();
  var query = new Parse.Query("Codegroup");
  query.equalTo("code", classcode);
  query.first().then(function(result){
    if (result){
      var classname = result.get('name');
      var array = [classcode, classname, child];
      var user = request.user;
      user.addUnique("joined_groups", array);
      user.save().then(function(user){
        var GroupMembers = Parse.Object.extend("GroupMembers");
        var groupmembers = new GroupMembers();
        groupmembers.set("name", user.get("name"));
        groupmembers.set("code", classcode);
        groupmembers.set("children_names", childnam);
        groupmembers.set("emailId", user.get("username"));
        return groupmembers.save();
      }).then(function(groupmembers){
        var installId = request.params.installationObjectId;
        var query = new Parse.Query(Parse.Installation);
	      return query.get(installId);
      }).then(function(object){
        object.addUnique("channels", classcode);
        return object.save();
      }).then(function(object){
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
          "joined_groups": user.get("joined_groups"),
          "messages": results,
          "codegroup": result
        };
        return Parse.Promise.as(output);
      }).then(function(output){
        response.success(output);
      }, function(error){
        response.error(error.code + ": " + error.message);
      });
    }
    else
      response.error("No such class exits");
  }, function(error){
    response.error(error.code + ": " + error.message);
  });  
}