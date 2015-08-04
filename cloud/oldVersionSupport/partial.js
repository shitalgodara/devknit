var run = require('cloud/run.js');

/*
Function for creating class
  Input =>
    user: Parse User
    classname: String
  Output =>
    JSON Object{
      user : Parse Object
      codegroup: Parse Object
    }
  Procedure =>
    * Username is taken from Parse User 
    * Class code is created and class name is modified
    * Added new item in Created_groups of user if not present already
    * Check first already created or not in client side also remove space in names of class
*/
exports.createClass = function(request, response){
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
      senderPic: pid
    });
  }).then(function(codegroup){
    var output = {
      "user": user,
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
    user: Parse Object
  Procedure =>
    * Deleted class entry in Created_groups 
    * Made classExist entry of Codegroup class false,
    * Entry saved for groupdetail for delete class message 
    * Finally send delete message to all members of group
*/
exports.deleteClass = function(request, response){
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
    response.success(user);
  }, function(error){
    response.error(error.code + ": " + error.message);
  });
} 

/*
Function for user to leave a class 
  Input =>
    classcode: String
    installationObjectId: String
  Output =>
    user: Parse Object
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
    query.doesNotExist("status");
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
    response.success(user);
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
		user: Parse Object
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
          "user": user,
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

/*
Function to change assoicate name of joined class
  Input =>
    classCode: String
    childName: String
  Output =>
    user: Parse Object
  Procedure =>
    Changed entry in GroupMembers and in users joined_groups
*/
exports.changeAssociateName = function(request, response){
  var classcode = request.params.classCode;
  var newchild = request.params.childName;
  var child = [newchild];
  var emailId = request.user.get("username");
  classcode = classcode.toUpperCase();
  var query = new Parse.Query("GroupMembers");
  query.equalTo("emailId", emailId);
  query.equalTo("code", classcode);
  query.doesNotExist("status");
  query.first().then(function(object){
    object.set("children_names", child);
    return object.save();
  }).then(function(object){
    var user = request.user;
    var classname = "";
    var clarray = user.get("joined_groups");
    for(var i = 0; i < clarray.length; i++){
      if(clarray[i][0] == classcode){
        classname = clarray[i][1];
        clarray.splice(i, 1);
        break;
      }
    }
    var clelement = [classcode, classname, newchild];
    clarray.push(clelement);
    user.set("joined_groups", clarray);
    return user.save();
  }).then(function(user){
    response.success(user);
  }, function(error){
    response.error(error.code + ": " + error.message);
  });  
}