var run = require('cloud/run.js');
var _ = require('cloud/underscore-min.js');
var helper = require('cloud/message-helper.js');

/*
Function to save installation id in cloud
  Input =>
    installationId: String
    deviceType: String
  Output =>
    objectid: String // object id of installation id created
  Description =>
    Procedure simply save query on installation table
*/
exports.appInstallation = function(request, response){
  var user = request.user;
  var username = user.get("username");
  var installationId = request.params.installationId;
  var deviceType = request.params.deviceType;
  var joined_groups = user.get("joined_groups");
  var classcodes = [];
  if(typeof joined_groups !='undefined'){
    classcodes = _.map(joined_groups, function(joined_group){
      return joined_group[0];
    });
  }
  Parse.Cloud.useMasterKey();
  var query = new Parse.Query(Parse.Installation);
  query.equalTo("installationId", installationId);
  query.first().then(function(installation){
    if(installation == 'undefined'){
      var error = {
        "code": "1003",
        "message": "Installation object not found"
      };
      return Parse.Promise.error(error);
    }
    else{
      installation.set("username", username);
      installation.set("installationId", installationId);
      installation.set("deviceType", deviceType);
      installation.set("channels", classcodes);
      return installation.save();
    }
  }).then(function(installation){
    response.success(installation.id);
  }, function(error){
    response.error(error.code + ": " + error.message);
  });
}

/*
Function for creating class  
  Input =>
    user: Parse User
    classname: String
  Output =>
    codegroup: Parse object
  Procedure =>
    * Username is taken from Parse User 
    * Class code is created and class name is modified
    * Added user in Created_groups
    * check first already created or not in client side also remove space in names of class
    procedure first create code ,then add in user created_groups,then in codegroup entry
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
    response.success(codegroup);
  }, function(error){
    response.error(error.code + ": " + error.message);
  });
}

/*
Function to delete user's created class
  Input =>
    classcode: String 
  Output =>
    flag: Bool // true in case of successful deletion otherwise error 
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
  for (var i = 0; i < clarray.length; i++){
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
    var flag = true;
    response.success(flag);
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
    flag: Bool true or error
  Procedure =>
    * Changed entry in joined group
    * Clear classcode from channels entry in Installation class 
    * Set status entry to LEAVE in Groupmember class
*/
exports.leaveClass = function(request, response){
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
    response.success(true);
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
    json object codegroup(as codegroup) entry related to that user and 5 message (as messages) of groupdetail table
  Procedure =>
    * Checked the existence of class code 
    * Added in user joined_groups 
    * Added entry in GroupMembers  
    * Added installation of currentuser 
    * Finally showing atmost 5 messages from the last 5 days 
*/
exports.joinClass = function(request, response){
  Parse.Cloud.useMasterKey();
  var classcode = request.params.classCode;
  var child = request.params.associateName;
  var childnam = [child];
  classcode = classcode.toUpperCase();
  var query = new Parse.Query("Codegroup");
  query.equalTo("code", classcode);
  query.first().then(function(result){
    if(typeof result != 'undefined'){
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
    flag: bool //true in case of success
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
    response.success(true);
  }, function(error){
    response.error(error.code + " " + error.message);
  });  
}

/*
Function to empty channels in case of app logout to stop sending notifications
  Input =>
    installationObjectId: String // object id of installation table
  Output =>
    flag: bool // true in case of successful deletion
  Description => 
    Process to empty channels field of installation object corresponding to install Id
*/
exports.removeChannels = function(request, response){
  var installId = request.params.installationObjectId;
  var query = new Parse.Query("_Installation");
  query.get(installId).then(function(object){
    object.set("channels", []);
    return object.save();
  }).then(function(object){
    response.success(true);
  }, function(error){
    response.error(error.code + ": " + error.message);
  });    
}

/*
Function to restart sending notification in case of login
  Input =>
    installationObjectId: String // objectId of installation table 
  Output => 
    flag: Bool // True in case of success else error message
  Description =>
    Process to empty channels field of installation object corresponding to install Id
*/
exports.addChannels = function(request, response){
  var installId = request.params.installationObjectId;
  var clarray = request.user.get("joined_groups");
  if(typeof clarray == 'undefined'){
    response.success(true);
  }
  else{
    var channels = [];
    for (var i = 0; i < clarray.length; i++) {
     channels[i] = clarray[i][0];
    }
    var query = new Parse.Query("_Installation");
    query.get(installId).then(function(object){
      object.set("channels", channels);
      return object.save();
    }).then(function(object){
      response.success(true);
    }, function(error) {
      response.error(error.code + ": " + error.message);
    });
  }
}

/*
Function for returning list of classes as a suggestion for parent to join
  Input =>
    input: Array of json object{
      school: String,
      standard: Sting,
      division: String
    }
    date: String // latest date of suggested codegroup created date
  Output =>
    Codegroup entries of suggested classes 
  Procedure =>
    Use of compound query on codegroup to compute suggestion whose class exits and removed groups that are already joined, created and removed
*/
exports.suggestClasses = function(request, response){
  var groups = request.params.input;
  var date = request.params.date;
  if(groups.length == 0)
    response.success([]);
  else{
    var data = groups[0];
    var query1 = new Parse.Query("Codegroup");
    query1.equalTo("school", data.school);
    query1.equalTo("standard", data.standard);
    if(data.division != 'NA')
      query1.equalTo("divison", data.division);
    for(var i = 1; i < groups.length; i++){
      data = groups[i];
      var query2 = new Parse.Query("Codegroup");
      query2.equalTo("school", data.school);
      query2.equalTo("standard", data.standard);
      if(data.division != 'NA')
        query2.equalTo("divison", data.division);
      query1 = Parse.Query.or(query1, query2);
    }
    var clarray1 = request.user.get("joined_groups");
    var clarray2 = request.user.get("Created_groups");
    var clarray3 = request.user.get("removed_groups");
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
    if(typeof clarray3 != 'undefined'){
      for (var k = 0; k < clarray3.length; k++){
        clarray[i] = clarray3[k][0];
        i++;
      }
    }
    query1.greaterThan("updatedAt", date);
    query1.notContainedIn("code", clarray);
    query1.find().then(function(results){
      response.success(results);
    }, function(error){
      response.error(error.code + ": " + error.message);    
    });
  }
}

/*
Function for returning list of classes as a suggest for parent to join
  Input => 
    school: String 
    standard: String
    divison: String
  Output =>
    codegroup entries of suggested classes 
  Procedure =>
    Use of compound query on codegroup to compute suggestion whose class exits and removed groups that are already joined/created or removed
*/
exports.suggestClass = function(request, response){
  var school = request.params.school;
  var standard = request.params.standard;
  var division = request.params.division;
  var clarray1 = request.user.get("joined_groups");
  var clarray2 = request.user.get("Created_groups");
  var clarray3 = request.user.get("removed_groups");
  var clarray =[];
  var i;
  if(typeof clarray1 != 'undefined'){
    for (i = 0; i < clarray1.length; i++){
      clarray[i]= clarray1[i][0];
    }
  }
  if(typeof clarray2 != 'undefined'){
    for (var j = 0; j < clarray2.length; j++){
      clarray[i]= clarray2[j][0];
      i++;
    }
  }
  if(typeof clarray3 != 'undefined'){
    for (var k = 0; k < clarray3.length; k++){
      clarray[i] = clarray3[k][0];
      i++;
    }
  }
  var query1 = new Parse.Query("Codegroup");
  query1.equalTo("school", school);
  query1.equalTo("standard", standard);
  if(division != 'NA'){
    query1.equalTo("divison", division);
  }
  query1.notContainedIn("code", clarray);
  query1.find().then(function(results){
    response.success(results);
  }, function(error){
    response.error(error.code + ": " + error.message);    
  });
}

/* 
Function to incremet like count of given message
  Input =>
    objectId: String // objectId of message
  Output => 
    like_count: Number // like counts of given message
  Procedure =>
    * Query on groupDetails table using objectId to retrieve & increment current like_count
    * Finally save updated count back to server and return this count to user. 
*/
exports.likeCountIncrement = function(request, response){
  var objectid = request.params.objectId;
  var query = new Parse.Query("GroupDetails");
  query.get(objectid).then(function(object){
    var likesCount = object.get("like_count");
    object.increment("like_count");
    return object.save().then(function(object){
      if (typeof likesCount != 'undefined')
      return Parse.Promise.as(likesCount + 1);
    else
      return Parse.Promise.as(1);
    });
  }).then(function(likesCount){
    response.success(likesCount);
  }, function(error){
    response.error(error.code + ": " + error.message);
  });
}
 
/* 
Function to decrement like count of given message
  Input =>
    objectId: String // objectId of message
  Output => 
    like_count: Number // like counts of given message
  Procedure =>
    * Query on groupDetails table using objectId to retrieve & decrement current like_count
    * Finally save updated count back to server and return this count to user. 
*/
exports.likeCountDecrement = function(request, response){
  var objectid = request.params.objectId;
  var query = new Parse.Query("GroupDetails");
  query.get(objectid).then(function(object){
    var likesCount = object.get("like_count");
    if(typeof likesCount != 'undefined'){
      if (likesCount > 0){
        object.increment("like_count", -1);
        return object.save().then(function(object){
          return Parse.Promise.as(likesCount - 1);  
        }); 
      } 
      else
        return Parse.Promise.as(0);
    } 
    else
      return Parse.Promise.as(0);
  }).then(function(likesCount){
    response.success(likesCount);
  }, function(error){
    response.error(error.code + ": " + error.message);
  });
}
 
/* 
Function to incremet confused count of given message
  Input =>
    objectId: String // objectId of message
  Output => 
    confused_count: Number // confused counts of given message
  Procedure =>
    * Query on groupDetails table using objectId to retrieve & increment current confused_count
    * Finally save updated count back to server and return this count to user. 
*/
exports.confusedCountIncrement = function(request, response){
  var objectid = request.params.objectId;
  var query = new Parse.Query("GroupDetails");
  query.get(objectid).then(function(object){
    var confusedCount = object.get("confused_count");
    object.increment("confused_count");
    return object.save().then(function(object){
      if (typeof confusedCount != 'undefined')
      return Parse.Promise.as(confusedCount + 1);
    else
      return Parse.Promise.as(1);
    });
  }).then(function(confusedCount){
    response.success(confusedCount);
  }, function(error){
    response.error(error.code + ": " + error.message);
  });
}
 
/* 
Function to decrement confused count of given message
  Input =>
    objectId: String // objectId of message
  Output => 
    confused_count: Number // confused counts of given message
  Procedure =>
    * Query on groupDetails table using objectId to retrieve & decrement current confused_count
    * Finally save updated count back to server and return this count to user. 
*/
exports.confusedCountDecrement = function(request, response){
  var objectid = request.params.objectId;
  var query = new Parse.Query("GroupDetails");
  query.get(objectid).then(function(object){
    var confusedCount = object.get("confused_count");
    if(typeof confusedCount != 'undefined'){
      if (confusedCount > 0){
        object.increment("confused_count", -1);
        return object.save().then(function(object){
          return Parse.Promise.as(confusedCount - 1);  
        }); 
      } 
      else
        return Parse.Promise.as(0);
    } 
    else
      return Parse.Promise.as(0);
  }).then(function(confusedCount){
    response.success(confusedCount);
  }, function(error){
    response.error(error.code + ": " + error.message);
  });
}
 
/*
Function to increment seen count of given message
  Input =>
    objectId: String // objectId of message
  Output => 
    seen_count: Number // seen counts of given message
  Procedure =>
    * Query on groupDetails table using objectId to retrieve & increment current seen_count
    * Finally save updated count back to server and return this count to user. 
*/
exports.seenCountIncrement = function(request, response){
  var objectid = request.params.objectId;
  var query = new Parse.Query("GroupDetails");
  query.get(objectid).then(function(object){
    var seenCount = object.get("seen_count");
    object.increment("seen_count");
    return object.save().then(function(object){
      if (typeof seenCount != 'undefined')
      return Parse.Promise.as(seenCount + 1);
    else
      return Parse.Promise.as(1);
    });
  }).then(function(seenCount){
    response.success(seenCount);
  }, function(error){
    response.error(error.code + ": " + error.message);
  });
}
 
/*
Function update message state comprising of likeStatus and confusedStatus ordered pair - 00(nothing), 10(liked), 01(confusing)
  Input =>
    objectId: String // objectId of message
    username: String/
    likeStatus: Bool
    confusedStatus: Bool
  Output =>
    flag: Number // 1 in case of success otherwise -1
  Procedure =>
    * Used old state info by querying MessageState table(if not present create new with 00 state). 
    * Now use new state to figure out change in like/confused count and update the corresponding objects
  in GroupDetails and MessageState tables
  */
exports.updateMessageState = function(request, response){
  var objectId = request.params.objectId;
  var username = request.params.username;
  var newLikeStatus = (request.params.likeStatus == 'true');
  var newConfusedStatus = (request.params.confusedStatus == 'true');
  var query = new Parse.Query("GroupDetails");
  query.get(objectId).then(function(object){
    var likeCount = object.get("like_count");
    var confusedCount = object.get("confused_count");
    if(typeof likeCount == 'undefined' || likeCount == null){
      likeCount = 0;
    }
    if(typeof confusedCount == 'undefined' || confusedCount == null){
      confusedCount = 0;
    }
    var stateQuery = new Parse.Query("MessageState");
    stateQuery.equalTo("username", username);
    stateQuery.equalTo("message_id", objectId);
    return stateQuery.find().then(function(results){
      var msgState;
      var oldLikeStatus = false;
      var oldConfusedStatus = false;
      if(results.length == 0){
        var MessageState = Parse.Object.extend("MessageState");
        msgState = new MessageState();
        msgState.set("username", username);
        msgState.set("message_id", objectId);
      }
      else{
        msgState = results[0];
        oldLikeStatus = msgState.get("like_status");
        oldConfusedStatus = msgState.get("confused_status");
      }
      likeCount = likeCount + (+newLikeStatus) - (+oldLikeStatus);
      confusedCount = confusedCount + (+newConfusedStatus) - (+oldConfusedStatus);
      object.set("like_count", likeCount);
      object.set("confused_count", confusedCount);
      return object.save().then(function(object){
        msgState.set("like_status", newLikeStatus);
        msgState.set("confused_status", newConfusedStatus);
        return msgState.save().then(function(){
          return Parse.Promise.as(1);  
        })
      });
    });
  }).then(function(result){
    response.success(result);
  }, function(error){
    response.error(error.code + ": " + error.message);
  });
}
 
/*
Function to get the like, confused and seen count of message
  Input =>
    objectId: String // objectId of message
  Output =>
    Object{
      like_count: Number
      confused_count: Number
      seen_count: Number
    }
  Procedure =>
    A simple query on groupDetails table using objectId to retrieve like, confused and seen counts
*/
exports.getLikeConfusedCount = function(request, response){
  var objectid = request.params.objectId;
  var query = new Parse.Query("GroupDetails");
  query.select("like_count", "confused_count", "seen_count");
  query.get(objectid).then(function(object){
    var likeCount = object.get("like_count");
    var confusedCount = object.get("confused_count");
    var seenCount = object.get("seen_count");
    if(typeof likeCount == 'undefined' || likeCount == null){
      likeCount = 0;
    }
    if(typeof confusedCount == 'undefined' || confusedCount == null){
      confusedCount = 0;
    }
    if(typeof seenCount == 'undefined' || seenCount == null){
      seenCount = 0;
    }
    var jsonObject = {
      "like_count": likeCount,
      "confused_count": confusedCount,
      "seen_count" : seenCount
    };
    response.success(jsonObject)
  }, function(error) {
    response.error(error.code + ": " + error.message);
  });
}
 
/*
Function to get outbox messages for teacher
  Input =>
    senderId: String
    limit: Number
  Output =>
    List of Object of GroupDetails
  Procedure =>  
    A simple query on GroupDetails table using senderId and return max 100 messages
*/
exports.getOutboxMessages = function(request, response){
  var senderId = request.params.senderId;
  var query = new Parse.Query("GroupDetails");
  query.limit(100);
  query.equalTo("senderId", senderId);
  query.find().then(function(results){
    response.success(results);
  }, function(error){
    response.error(error.code + ": " + error.message);
  });
}

/*
Function to invite teacher
  Input =>
    senderId: String
    schoolName: String
    teacherName: String
    email: String
    childName: String
    phoneNo: String
  Output =>
    flag : Number // 1 on success otherwise -1
  Procedure =>
    Create a new TeacherInvitation object and save using the parameter details
*/
exports.inviteTeacher = function(request, response){
  var senderId = request.params.senderId;
  var schoolName = request.params.schoolName;
  var teacherName = request.params.teacherName;
  var childName = request.params.childName;
  var email = request.params.email;
  var phoneNo = request.params.phoneNo;
 
  var TeacherInvitation = Parse.Object.extend("TeacherInvitation");
  var invitation = new TeacherInvitation();
 
  invitation.set("senderId", senderId);
  invitation.set("schoolName", schoolName);
  invitation.set("teacherName", teacherName);
  invitation.set("email", email);
  invitation.set("phoneNo", phoneNo);
  invitation.set("childName", childName);
 
  invitation.save().then(function(){
    response.success(1);
  }, function(error){
    response.error(-1);
  });
}

/*
Function to verify OTP
  Input => 
    < Email Login Users >
      email: String
      password: String
    < Mobile Login Users >
      number: String // 10 digit phone no
      code: Number
      In case of signup extra parameters mentioned below are required too,  
        name: String
        role: String // Parent or Teacher
  Output =>
    < Success >
      JSON object{ 
        flag: Bool // True if atleast one entry found otherwise false 
        sessionToken: String // session Token of user signed in
      }
    < Error >
      < Email Login Users >
        * USER_DOESNOT_EXISTS // In case of invalid credentials
        * error // Otherwise
      < Mobile Login Users >
        * USER_DOESNOT_EXISTS // In case of invalid login 
        * USER_ALREADY_EXISTS // In case of invalid signup
        * error // Otherwise
  Description =>
    Process check entry in new table with time constraint
*/
exports.verifyCode = function(request, response){
  var email = request.params.email;
  if(typeof email != 'undefined'){
    var password = request.params.password;
    Parse.User.logIn(email, password).then(function(user){
      var result = {
        "flag": true,
        "sessionToken": user._sessionToken
      };
      response.success(result);
    }, function(error){
      if(error.code == 101)
        response.error("USER_DOESNOT_EXISTS");
      else
        response.error(error.code + ": " + error.message);
    });
  }
  else{
    var number = request.params.number;
    var code = request.params.code;
    var d = new Date();
    var e = new Date(d.getTime() - 300000);
    var Temp = Parse.Object.extend("Temp");
    var query = new Parse.Query(Temp); 
    query.equalTo("code", code);
    query.equalTo("phoneNumber", number);
    query.greaterThan("createdAt", e);
    query.find().then(function(results){
      if(results.length > 0){
        var name = request.params.name;
        if(typeof name == 'undefined'){ 
          Parse.User.logIn(number, number + "qwerty12345").then(function(user){
            var result = {
              "flag": true,
              "sessionToken": user._sessionToken
            };
            response.success(result);
          }, function(error){
            if(error.code == 101)
              response.error("USER_DOESNOT_EXISTS");
            else
              response.error(error.code + ": " + error.message);
          });
        }
        else{
          var user = new Parse.User();
          user.set("username", number);
          user.set("password", number + "qwerty12345");
          user.set("name", request.params.name);
          user.set("phone", number);
          user.set("role", request.params.role);
          user.signUp().then(function(user){
            var result = {
              "flag": true,
              "sessionToken": user._sessionToken
            };
            response.success(result);
          }, function(error){
            if(error.code == 202)
              response.error("USER_ALREADY_EXISTS");
            else
              response.error(error.code + ": " + error.message);
          });
        }
      }
      else{
        var result = {
          "flag": false,
          "sessionToken": ""
        };
        response.success(result);
      }
    }, function(error){
      response.error(error.code + ": " + error.message);
    });
  } 
}

/*
Function to verify OTP by generating revocable session tokens
  Input => 
    < Email Login Users >
      email: String
      password: String
    < Mobile Login Users >
      number: String // 10 digit phone no
      code: Number
      In case of signup extra parameters mentioned below are required too,  
        name: String
        role: String // Parent or Teacher
  Output =>
    < Success >
      JSON object{ 
        flag: Bool // True if atleast one entry found otherwise false 
        sessionToken: String // revocable session Token of user signed in
      }
    < Error >
      < Email Login Users >
        * USER_DOESNOT_EXISTS // In case of invalid credentials
        * error // Otherwise
      < Mobile Login Users >
        * USER_DOESNOT_EXISTS // In case of invalid login 
        * USER_ALREADY_EXISTS // In case of invalid signup
        * error // Otherwise
  Description =>
    Process check entry in new table with time constraint
*/
exports.verifyCod = function(request, response){
  var email = request.params.email;
  if(typeof email != 'undefined'){
    var password = request.params.password;
    Parse.User.logIn(email, password).then(function(user){
      return run.createSession({
        "sessionToken": user._sessionToken
      });
    }).then(function(sessionToken){
      var output = {
        "flag": true,
        "sessionToken": sessionToken
      };
      response.success(output);
    }, function(error){
      if(error.code == 101)
        response.error("USER_DOESNOT_EXISTS");
      else
        response.error(error.code + ": " + error.message);
    });
  }
  else{
    var number = request.params.number;
    var code = request.params.code;
    var d = new Date();
    var e = new Date(d.getTime() - 300000);
    var query = new Parse.Query("Temp"); 
    query.equalTo("code", code);
    query.equalTo("phoneNumber", number);
    query.greaterThan("createdAt", e);
    query.first().then(function(temp){
      if(typeof temp != 'undefined'){
        var user = new Parse.User();
        var name = request.params.name;
        if(typeof name == 'undefined'){
          return Parse.User.logIn(number, number + "qwerty12345").then(function(user){
            return run.createSession({
              "sessionToken": user._sessionToken
            });
          });
        }
        else{
          var role = request.params.role;
          var emailId = request.params.emailId;
          user.set("username", number);
          user.set("password", number + "qwerty12345");
          user.set("name", name);
          user.set("phone", number);
          user.set("role", role);
          return user.signUp().then(function(user){
            return run.createSession({
              "sessionToken": user._sessionToken
            });
          });
        }
      }
      else{
        var promise = Parse.Promise.as("");
        return promise;
      }
    }).then(function(sessionToken){
        var flag = false;
        if(sessionToken != ""){
          flag = true;
        }
        var output = {
          "flag": flag,
          "sessionToken": sessionToken
        };
        response.success(output);
    }, function(error){
      if(error.code == 101){
        response.error("USER_DOESNOT_EXISTS");
      }
      else if(error.code == 202){
        response.error("USER_ALREADY_EXISTS");
      }
      else{
        response.error(error.code + ": " + error.message);
      }
    });
  } 
}

/*
Function to logout from the app
  Input =>
    installationObjectId: String
  Output =>
    flag: Bool // true in case of success
  Description =>
    Procedure simple clear entry of channels on installation table
*/
exports.appLogout = function(request, response){
  var id = request.params.installationObjectId;
  Parse.Cloud.useMasterKey();
  var query = new Parse.Query(Parse.Installation);
  query.get(id).then(function(obj){
    obj.set("channels", []);
    return obj.save(null);
  }).then(function(result){
    response.success(true);
  }, function(error){
    response.error(error.code + ": " + error.message);
  });
}

/* 
Function to mail instructions to teachers
  Input => 
    emailId: String
  Output =>
    flag: Bool // Success in case of email sent otherwise error
  Procedure =>
    Called mailAttachment function 
*/
exports.mailInstructions = function(request, response){
  var instructions = require('cloud/Attachments/instructions.js');
  var content = instructions.getBase64();
  var name = request.user.get("name");
  var recipients = [
    {
      "name": name,
      "email": request.params.emailId
    }
  ];
  var subject = "How to invite parent";
  var html = "<div dir='ltr'><span style='font-size:12.8px'>Hello";
  if(name){
    html = html + " " + name;
  }
  html = html + ",&nbsp;</span><div style='font-size:12.8px'><br></div><div style='font-size:12.8px'><span>Thank you for using Knit!<br><div><br></div><div>To invite parents to join your class, you must share your class code.&nbsp;<a href='https://knitapp.co.in/blog/2015/09/08/why-knit-emphasises-on-class-code/' target='_blank'>Read why class code is important &nbsp;</a><br></div><div><br></div></span><div>We have attached a document in this email that will come in handy when you're sharing your class code. Simply print it out and circulate it amongst your students.&nbsp;</div><span><div><br></div><div>We hope you continue being associated with Knit</div><div><br></div><div>Regards</div><div>Knit team</div></span></div></div>";
  var attachments = [
    {
      "type": "application/pdf",
      "name": "Instructions to join class.pdf",
      "content": content
    }
  ];
  run.mailAttachment({
    "recipients": recipients,
    "subject": subject,
    "html": html,
    "attachments": attachments
  }).then(function(){
    response.success(true);
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
  var clarray = [];
  if(type == 'c'){
    var clarray1 = request.user.get("Created_groups");
    if(typeof clarray1 != 'undefined'){
      for(var i = 0; i < clarray1.length; i++)
        clarray[i] = clarray1[i][0];
    }
  }
  else if(type == 'j'){
    var clarray1 = request.user.get("joined_groups");
    if(typeof clarray1 != 'undefined'){
      for(var i = 0; i < clarray1.length; i++)
        clarray[i] = clarray1[i][0];
    }
  }
  query.containedIn("code", clarray);
  query.find().then(function(results){
    if(type == 'c'){
      return Parse.Promise.as(results);
    }
    else if(results.length == 0){
      var result = {
        "message": results,
        "states": results
      };
      return Parse.Promise.as(result);
    }
    else{
      var messageIds = [];
      for(var i = 0; i < results.length; i++){
        messageIds[i] = results[i].id;
      }
      var query = new Parse.Query("MessageState");
      query.equalTo("username", request.user.get("username"));
      query.containedIn("message_id", messageIds);
      return query.find().then(function(result2){
        var result = {
          "message": results,
          "states": result2
        };
        return Parse.Promise.as(result);
      });
    }
  }).then(function(result){
    response.success(result);
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
      for(var i = 0; i < clarray1.length; i++)
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
  query.find().then(function(results){
    if(type == 'c')
      return Parse.Promise.as(results);
    else if(results.length == 0){
      var result = {
        "message": results,
        "states": results
      };
      return Parse.Promise.as(result);
    }
    else{
      var messageIds = [];
      for(var i = 0; i < results.length; i++){
        messageIds[i] = results[i].id;
      }
      var query = new Parse.Query("MessageState");
      query.equalTo("username", request.user.get("username"));
      query.containedIn("message_id", messageIds);
      return query.find().then(function(result2){
        var result = {
          "message": results,
          "states": result2
        };
        return Parse.Promise.as(result);
      });
    }
  }).then(function(result){
    response.success(result);
  }, function(error){
    response.error(error.code + ": " + error.message);
  });
}

/*
Function to get like_count, confused_count and seen_count after a given time
  Input =>
    Array of objectId of messages
  Output =>
    Objects of GroupDetails
  Procedure =>
    A simple query on GroupDetails 
*/
exports.updateCount = function(request, response){
  var query = new Parse.Query("GroupDetails");
  var array = request.params.array;
  query.containedIn("objectId", array);
  query.find().then(function(results){
    response.success(results);
  }, function(error){
    response.error(error.code + ": " + error.message);
  });
}

/*
Function to get like_count, confused_count and seen_count after a given time
  Input =>
    date: String
    limit: Number
    classtype: String // 'c' for created groups and 'j' for joined groups
  Output =>
    Objects of GroupDetails
  Procedure =>
    A simple query on groupdetail 
*/
exports.updateCounts = function(request, response){
  var query = new Parse.Query("GroupDetails");
  var limit = request.params.limit;
  var date = request.params.date;
  query.lessThan("createdAt",date);
  query.limit(limit);
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
      for (var i = 0; i < clarray1.length; i++)
        clarray[i] = clarray1[i][0];
    }
  }
  query.select("seen_count", "like_count", "confused_count");
  query.containedIn("code", clarray);
  query.find().then(function(results){
    response.success(results);
  }, function(error){
    response.error(error.code + ": " + error.message);
  });
}


/*
Function to output list of school names
  Input =>
    Nothing
  Output =>
    List of school names
*/
exports.schoollist = function(request, response) {
  var query = new Parse.Query("SCHOOLS");
  query.select("school_name");
  query.find().then(function(results){
    response.success(results);
  }, function(error) {
    response.error(error.code + ": " + error.message);
  });
}

/*
Function to give school name corresponding to school id
  Input =>
    schoolId: String
  Output =>
    schoolName: String
  Procedure =>
    Simple query on schools table
*/
exports.getSchoolName = function(request, response) {
  var schoolId = request.params.schoolId;
  var SCHOOLS = Parse.Object.extend("SCHOOLS");
  var query = new Parse.Query(SCHOOLS); 
  query.get(schoolId).then(function(result){
    response.success(result.get('school_name'));
  }, function(error){
    response.error(error.code + ": " + error.message);
  });
} 

/*
Function to give school id corresponding to school name
  Input =>
    schoolName: String
  Output =>
    schoolId: String
  Procedure =>
    Search query then save if doesn't exists on school
*/
exports.getSchoolId = function(request, response){
  var schoolName = request.params.school;
  var query = new Parse.Query("SCHOOLS");
  query.equalTo("school_name", schoolName);
  query.first().then(function(result){
    if (typeof result != 'undefined')
      return Parse.Promise.as(result.id);
    else{
      var SCHOOLS = Parse.Object.extend("SCHOOLS");
      var schools = new SCHOOLS();
      schools.set("school_name", schoolName);
      return schools.save().then(function(school){
        return Parse.Promise.as(school.id);
      });
    }
  }).then(function(schoolId){
    response.success(schoolId);
  }, function(error){
    response.error(error.code + ": " + error.message);
  });
}

/*
Function to find class
  Input =>
    code: String // class code
  Output =>
    Array of codegroup objects corresponding to class code
  Procedure =>
    Simple find query on codegroup
*/
exports.findClass = function(request, response){
  var classcode = request.params.code;
  var query = new Parse.Query("Codegroup");
  query.equalTo("code", classcode);
  query.find().then(function(results){
    response.success(results);
  }, function(error){
    response.error(error.code + ": " + error.message); 
  });
}

/*
Function to get timedetails of the class corresponding to classcode
  Input =>
    classcode: String
    limit: Number
  Output =>
    Created Timedetails of messages of that class
  Procedure =>
    A simple query on GroupDetails 
*/
exports.toupdatetimebyclass = function(request, response){
  var clcode = request.params.classcode;
  var limit = request.params.limit;
  var query = new Parse.Query("GroupDetails");
  query.equalTo("code", clcode);
  query.select("createdAt");
  query.descending("createdAt");
  query.limit(limit);
  query.find().then(function(results){
    response.success(results);
  }, function(error){
    response.error(error.code + ": " + error.message);
  });
}

/*
Function to get timedetails of the classes
  Input =>
    classarray: Array of class codes
    limit: Number
  Output =>
    Created Timedetails of messages of that class
  Procedure =>
    A simple query on GroupDetails 
*/
exports.toupdatetime = function(request, response){
  var clarray = request.params.classarray;
  var limit = request.params.limit;
  var query = new Parse.Query("GroupDetails");
  query.containedIn("code", clarray);
  query.select("createdAt");
  query.descending("createdAt");
  query.limit(limit);
  query.find().then(function(results){
    response.success(results);
  }, function(error){
    response.error(error.code + ": " + error.message);
  });
}

/*
Function to get count of members subscribed to that class via app and sms
  Input =>
    classcode: String
  Output =>
    count: Number // Number of users subscribed to a class via app and sms 
  Procedure =>
    A simple query on GroupMembers and MessageNeeders
*/ 
exports.showclassstrength = function(request, response){
  var clcode = request.params.classcode;
  var query = new Parse.Query("GroupMembers");
  query.equalTo("code", clcode);
  query.count().then(function(count1){
    var query = new Parse.Query("Messageneeders");
    query.equalTo("cod", clcode);
    return query.count().then(function(count2){
      return Parse.Promise.as(count1 + count2);
    });
  }).then(function(count){
    response.success(count);
  }, function(error){
    response.error(error.code + ": " + error.message);
  });
}

/*
Function to show all latest subscribers of a class (Max. 1000 => 500 via app and 500 via sms each)
  Input =>
    classcode: String
    date: String
  Output =>
    JSON object{
      app: Parse Object of GroupMembers
      sms: Parse Object of Messageneeders 
    }
  Procedure =>
    A simple query on GroupMembers and Messageneeders table
*/
exports.showSubscribers = function(request, response){
  var limit = 500;
  var clcode = request.params.classcode;
  var Date = request.params.date;
  var query = new Parse.Query("GroupMembers");
  query.greaterThan("updatedAt", Date);
  query.equalTo("code", clcode);
  query.select("name", "children_names", "code", "status", "emailId");
  query.limit(limit);
  query.find().then(function(results1){
    var query = new Parse.Query("Messageneeders");
    query.greaterThan("updatedAt", Date);
    query.equalTo("cod", clcode);
    query.select("subscriber", "number", "cod", "status");
    query.limit(limit);
    return query.find().then(function(results2){
      var result = {
        "app": results1,
        "sms": results2
      };
      return Parse.Promise.as(result);
    });
  }).then(function(result){
    response.success(result);
  }, function(error){
    response.error(error.code + ": " + error.message);
  });
}

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
  var query = new Parse.Query("Messageneeders");
  query.equalTo("cod", c);
  query.find().then(function(results){
    if(results){
      var numbers = _.map(results, function(result){
        return result.get('number');
      });
      return run.bulkSMS({
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
exports.samplemessage = function(request, response){
  var c = request.params.classcode;
  var name = request.user.get("name");
  var query = new Parse.Query("Messageneeders");
  var msg = "Your Teacher " + name + " has sent you an attachment, we can't send you pics over mobile, so download our android-app http://goo.gl/Ptzhoa";
  query.equalTo("cod", c);
  query.find().then(function(results){
    if(results){
      var numbers = _.map(results, function(result){
        return result.get('number');
      });
      return run.bulkSMS({
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
    response.error(error.code + ": " + error.message);
  });
}

/*
Function to send text messages
  Input =>
    classcode: String
    classname: String
    message: String
  Output =>
    <Valid class code>
      messageId: String
      createdAt: String // groupDetail entry
    <Invalid class code>
      Created_groups: Array 
  Procedure =>
    Save entry in groupdetail and send push to app user and send sms to message user
*/
exports.sendTextMessage = function(request, response){
  var classcode = request.params.classcode;
  var classname = request.params.classname;
  var message = request.params.message;
  var user = request.user;
  var name = user.get("name");
  var username = user.get("username");  
  helper.sendTextMessage({
    "classcode": classcode,
    "classname": classname,
    "message": message,
    "username": username,
    "name": name
  }).then(function(result){
    response.success(result);
  },
  function(error){
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
    <Valid class code>
      messageId: String
      createdAt: String // groupdetail entry
    <Invalid class code>
      Created_groups: Array
  Procedure =>
    Save entry in groupdetail and send push to app user and send sms to message user
*/
exports.sendPhotoTextMessage = function(request, response){
  var classcode = request.params.classcode;
  var classname = request.params.classname;
  var parsefile = request.params.parsefile;
  var filename = request.params.filename;
  var message = request.params.message;
  var user = request.user;
  var name = user.get("name");
  var username = user.get("username");
  helper.sendPhotoTextMessage({
    "classcode": classcode,
    "classname": classname,
    "parsefile": parsefile,
    "filename": filename,
    "message": message,
    "name": name,
    "username": username
  }).then(function(result){
    response.success(result);
  }, function(error){
    response.error(error.code + ": " + error.message);
  });
}