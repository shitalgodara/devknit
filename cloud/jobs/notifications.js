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
exports.sendLikeNotifications = function(request, status){ 
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
  Parse.Cloud.useMasterKey();
  query1.each(function(groupdetail){
    var query2 = new Parse.Query(Parse.Installation);
    var username = groupdetail.get("senderId");
    var post = groupdetail.get("title");
    var like_count = groupdetail.get("like_count");
    var classname = groupdetail.get("name");
    var id = groupdetail.id;
    if(post.length > 15){
      post = post.substr(0,12);
      post = post + "...";
    }
    if(post.length > 0){
      post = ' "' + post + '"';
    } 
    var msg = like_count + " people like your post" + post;
    query2.equalTo("username", username); 
    return Parse.Push.send({
      where: query2, 
      data: {
        msg: msg,
        alert: msg,
        badge: "Increment",
        groupName: classname,
        type: "TRANSITION",
        action: "LIKE",
        id: id
      }
    });
  }).then(function(){
    status.success("Successfully sent like notifications to all teachers !!");
  }, function(error){
    status.error(error.message);
  });
}

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
exports.sendConfusedNotifications = function(request, status){ 
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
  Parse.Cloud.useMasterKey();
  query1.each(function(groupdetail){
    var query2 = new Parse.Query(Parse.Installation);
    var username = groupdetail.get("senderId");
    var post = groupdetail.get("title");
    var confused_count = groupdetail.get("confused_count");
    var classname = groupdetail.get("name");
    var groupdetailId = groupdetail.id;
    if(post.length > 15){
    post = post.substr(0,12);
    post = post + "...";
    }
    if(post.length > 0){
      post = ' "' + post + '"';
    } 
    var msg = confused_count + " people seems to be confused by your post" + post;
    query2.equalTo("username", username); 
    return Parse.Push.send({
    where: query2, 
    data: {
      msg: msg,
      alert: msg,
      badge: "Increment",
      groupName: classname,
      type: "TRANSITION",
      action: "CONFUSE",
      id: groupdetailId
    }
    });
  }).then(function(){
    status.success("Successfully sent confused notifications to all teachers !!");
  }, function(error){
    status.error(error.message);
  });
}

/*
Job to send new subscriber notifications
  Input => 
    Nothing
  Output =>
    Notitfication to the users
*/
exports.memberNotifications = function(request, status){
  var intervalTime = 14400000;
  var date = new Date();
  var currentTime = date.getTime();
  var dateLowerBound = new Date(currentTime - 6 * intervalTime);
  var newMembers = [];
  var query1 = new Parse.Query("GroupMembers");
  query1.greaterThanOrEqualTo("createdAt", dateLowerBound);
  query1.doesNotExist("status");
  query1.select("code");
  query1.each(function(groupmember){
    var classcode = groupmember.get("code");
    if(newMembers[classcode])
      newMembers[classcode]++;
    else
      newMembers[classcode] = 1;
    return Parse.Promise.as();
  }).then(function(success){
    var query2 = new Parse.Query("Messageneeders");
    query2.doesNotExist("status");
    query2.greaterThanOrEqualTo("createdAt", dateLowerBound); 
    query2.select("cod");
    return query2.each(function(msgnd){
      var classcode = msgnd.get("cod");
      if(newMembers[classcode])
        newMembers[classcode]++;
      else
        newMembers[classcode] = 1;
      return Parse.Promise.as();
    });
  }).then(function(success){
    var classcodes = _.keys(newMembers);
    var query = new Parse.Query("Codegroup");
    query.equalTo("classExist", true);
    query.containedIn("code", classcodes);
    query.select("code", "senderId", "name");
    Parse.Cloud.useMasterKey();
    return query.each(function(codegroup){
      var username = codegroup.get("senderId");
      var classcode = codegroup.get("code");
      var classname = codegroup.get("name");  
      var count = newMembers[classcode];
      if(count > 0){
        var msg = count + " new subscribers added to the class " + classname;
        var query3 = new Parse.Query(Parse.Installation);
        query3.equalTo("username", username);
        return Parse.Push.send({
          where: query3, 
          data: {
            msg: msg,
            alert: msg,
            badge: "Increment",
            groupName: classname,
            groupCode: classcode,
            type: "TRANSITION",
            action: "MEMBER"
          }
        });
      }
      else
        return Parse.Promise.as();
    });  
  }).then(function(){
    status.success("Successfully sent new member notifications to all teachers !!");
  }, function(error){
    status.error(error.message);
  });
}