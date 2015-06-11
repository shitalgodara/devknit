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
  query.get(objectid, {
    success: function(object) {
      var likesCount = object.get("like_count");
      object.increment("like_count");
      object.save();
      if (typeof likesCount != 'undefined')
        response.success(likesCount + 1);
      else
        response.success(1);
    },
    error: function(object, error) {
      console.error(error.code);
      response.error(-1);
    }
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
  query.get(objectid, {
    success: function(object) {
      var likesCount = object.get("like_count");
      if (typeof likesCount != 'undefined'){
        if (likesCount > 0) {
          object.increment("like_count", -1);
          object.save();
          response.success(likesCount - 1);
        } 
        else
          response.success(0);
      } 
      else
        response.success(0);
    },
    error: function(object, error) {
      console.error(error.code);
      response.error(-1);
    }
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
  query.get(objectid, {
    success: function(object) {
      var confusedCount = object.get("confused_count");
      object.increment("confused_count");
      object.save();
      if (typeof confusedCount != 'undefined')
        response.success(confusedCount + 1);
      else
        response.success(1);
    },
    error: function(object, error) {
      console.error(error.code);
      response.error(-1);
    }
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
  query.get(objectid, {
    success: function(object) {
      var confusedCount = object.get("confused_count");
      if (typeof confusedCount != 'undefined'){
        if (confusedCount > 0) {
          object.increment("confused_count", -1);
          object.save();
          response.success(confusedCount - 1);
        } 
        else
          response.success(0);
      } 
      else
        response.success(0);
    },
    error: function(object, error) {
      console.error(error.code);
      response.error(-1);
    }
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
  query.get(objectid, {
    success: function(object) {
      var seenCount = object.get("seen_count");
      object.increment("seen_count");
      object.save();
      if (typeof seenCount != 'undefined')
        response.success(seenCount + 1);
      else
        response.success(1);
    },
    error: function(object, error) {
      console.error(error.code);
      response.error(-1);
    }
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
    *Now use new state to figure out change in like/confused count and update the corresponding objects
  in GroupDetails and MessageState tables
  */
exports.updateMessageState = function(request, response){
  var objectId = request.params.objectId;
  var username = request.params.username;
  var newLikeStatus = (request.params.likeStatus == 'true');
  var newConfusedStatus = (request.params.confusedStatus == 'true');
  var query = new Parse.Query("GroupDetails");
  query.get(objectId, {
    success: function(object){
      var likeCount = object.get("like_count");
      var confusedCount = object.get("confused_count");
      if (typeof likeCount == 'undefined' || likeCount == null){
        likeCount = 0;
      }
      if (typeof confusedCount == 'undefined' || confusedCount == null){
        confusedCount = 0;
      }
      var stateQuery = new Parse.Query("MessageState");
      stateQuery.equalTo("username", username);
      stateQuery.equalTo("message_id", objectId);
      stateQuery.find({
        success: function(results){
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
            var msgState = results[0];
            oldLikeStatus = msgState.get("like_status");
            oldConfusedStatus = msgState.get("confused_status");
          }
 
          likeCount = likeCount + (+newLikeStatus) - (+oldLikeStatus);
          confusedCount = confusedCount + (+newConfusedStatus) - (+oldConfusedStatus);
 
          object.set("like_count", likeCount);
          object.set("confused_count", confusedCount);
          object.save();
 
          msgState.set("like_status", newLikeStatus);
          msgState.set("confused_status", newConfusedStatus);
          msgState.save();

          response.success(1);
        },
        error: function(object, error){
          console.error(error.code);
          response.error(-1);
        }
      });
    },
    error: function(object, error) {
      console.error(error.code);
      response.error(-1);
    }
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
exports.getLikeConfusedCount = function(request, response) {
  var objectid = request.params.objectId;
  var query = new Parse.Query("GroupDetails");
  query.select("like_count", "confused_count", "seen_count");
  query.get(objectid, {
    success: function(object){
      var likeCount = object.get("like_count");
      var confusedCount = object.get("confused_count");
      var seenCount = object.get("seen_count");
      if (typeof likeCount == 'undefined' || likeCount == null){
        likeCount = 0;
      }
      if (typeof confusedCount == 'undefined' || confusedCount == null){
        confusedCount = 0;
      }
      if (typeof seenCount == 'undefined' || seenCount == null){
        seenCount = 0;
      }
      var jsonObject = {
        "like_count": likeCount,
        "confused_count": confusedCount,
        "seen_count" : seenCount
      };
      response.success(jsonObject)
    },
    error: function(object, error) {
      console.error(error.code);
      response.error(-1);
    }
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
exports.getOutboxMessages = function(request, response) {
  var senderId = request.params.senderId;
  var limit = request.params.limit;
  var query = new Parse.Query("GroupDetails");
  query.limit(+limit);
  query.equalTo("senderId", senderId);
  query.find({
    success: function(results) {
      response.success(results);
    },
    error: function(object, error) {
      console.error(error.code);
      response.error(-1);
    }
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
exports.inviteTeacher = function(request, response) {
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
  })
}