/*----------------------------------------------- FILE INCLUDES ----------------------------------------------------*/
  /* HELPER FILE */
  var _ = require('cloud/underscore-min.js');
  var run = require('cloud/run.js');

  /* OLD VERSION */
  var old = require('cloud/oldVersionSupport/old.js');
  var partial = require('cloud/oldVersionSupport/partial.js');

  /* LATEST VERSION */  
  var classes = require('cloud/classes.js');
  var external = require('cloud/external.js');
  var login = require('cloud/login.js');
  var message = require('cloud/message.js');
  var messagecount = require('cloud/messagecount.js');
  var rest = require('cloud/rest.js');
  var subscriber = require('cloud/subscriber.js');
  var user = require('cloud/user.js');

  /* TEMPORARY FILES */
  var temp = require('cloud/temp.js');

  /* ANALYTICS FILES */
  var analytics = require('cloud/temp/analytics.js');
  var followup = require('cloud/temp/followup.js');
  var developer = require('cloud/Analytics&All/developer.js');
  var classlist = require('cloud/Analytics&All/classlist.js');
  var CatUser = require('cloud/Analytics&All/CatUser.js');
  var generalSender = require('cloud/Analytics&All/generalSender.js');
  var web = require('cloud/Websupport/web.js');
  var location = require('cloud/Analytics&All/location.js');


/*----------------------------------------------- WEBHOOKS ---------------------------------------------------------*/
  Parse.Cloud.afterSave("Messageneeders", function(request){
    var num = request.object.get("number");
    var code = request.object.get("cod");
    if((request.object.get("status") != "LEAVE") && (request.object.get("status") != "REMOVED")){
      var query = new Parse.Query("Codegroup");
      query.equalTo("code", code);
      query.first().then(function(obj){
        if(obj){
          var teacher = obj.get("Creator");
          var cls = obj.get("name");    
          var numbers = [num];
          var msg = "Congratulations you have successfully subscribed to" + " " + teacher + "'s " + cls + " " + "classroom. You will start receiving messages as soon as your teacher start using it";
          return run.bulkSMS({
            "numbers": numbers,
            "msg": msg
          });
        }
        else{
          return Parse.Promise.as();
        }
      }).then(function(text){
      }, function(error){
      });
    }
  });
      
  Parse.Cloud.afterSave("wrong", function(request){
    var num = request.object.get("number");
    var code = request.object.get("cod");
    var a = code;
    var b = a.substr(0,4);
    if(b == "STOP"){
      var cod = a.substr(4);
      var Messageneeders = Parse.Object.extend("Messageneeders");
      var query = new Parse.Query(Messageneeders);
      query.equalTo("cod", cod);
      query.equalTo("number", num);
      query.first().then(function(myObject){
        if (myObject){
          myObject.set("status", "LEAVE");
          return myObject.save().then(function(myObject){
            var msg = "You have been successfully unsubscribed, now you will not recieve any message from your teacher"; 
            var numbers = [num];
            return run.bulkSMS({
              "numbers": numbers,
              "msg": msg
            });
          });  
        }
        else{
          return Parse.Promise.as();
        }
      }).then(function(text){
      }, function(error){
      });
    } 
    else if(b == "SEND"){
      var msg = "You seems to have forgot to enter student's name, general format to subscribe via sms is '<classCode> <space> <Student Name>'";
      var numbers = [num];
      run.bulkSMS({
        "numbers": numbers,
        "msg": msg
      }).then(function(text){
      }, function(error){
      });
    }
    else{
      var msg = "You seems to have entered a wrong Classcode,General format of code is  7 DIGIT CODE,if you don't know code Ask Teacher for code";
      var numbers = [num];
      run.bulkSMS({
        "numbers": numbers,
        "msg": msg
      }).then(function(text){
      }, function(error){
      });
    }
  });
    

/*----------------------------------------------- JOBS -------------------------------------------------------------*/
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
      status.success("Successfully sent like notifications to all teachers !!");
    }, function(error){
      status.error(error.message);
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
        status.success("Successfully sent confused notifications to all teachers !!");
      }, function(error){
        status.error(error.message);
      });
  });

  /*
  Job to send new subscriber notifications
    Input => 
      Nothing
    Output =>
      Notitfication to the users
  */
  Parse.Cloud.job("memberNotifications", function(request, status){ 
    var intervalTime = 14400000;
    var date = new Date();
    var currentTime = date.getTime();
    var dateLowerBound = new Date(currentTime - 6 * intervalTime);
    var newMembers = [];
    var query1 = new Parse.Query("GroupMembers");
    query1.greaterThanOrEqualTo("createdAt", dateLowerBound);
    query1.doesNotExist("status");
    query1.select("code");
    query1.each(function(result){
      var classCode = result.get("code");
      if(newMembers[classCode])
        newMembers[classCode]++;
      else
        newMembers[classCode] = 1;
      return Parse.Promise.as();
    }).then(function(success){
      var query2 = new Parse.Query("Messageneeders");
      query2.doesNotExist("status");
      query2.greaterThanOrEqualTo("createdAt", dateLowerBound); 
      query2.select("cod");
      return query2.each(function(result){
        var classCode = result.get("cod");
        if(newMembers[classCode])
          newMembers[classCode]++;
        else
          newMembers[classCode] = 1;
        return Parse.Promise.as();
      });
    }).then(function(success){
      var codes = _.keys(newMembers);
      var query = new Parse.Query("Codegroup");
      query.equalTo("classExist", true);
      query.containedIn("code", codes);
      query.select("code", "senderId", "name");
      return query.each(function(group){
        var username = group.get("senderId");
        var classCode = group.get("code");
        var className = group.get("name");  
        var count = newMembers[classCode];
        if(count > 0){
          var msg = count + " new subscribers added to the class " + className;
          var query3 = new Parse.Query(Parse.Installation);
          query3.equalTo("username", username);
          return Parse.Push.send({
            where: query3, 
            data: {
              msg: msg,
              alert: msg,
              badge: "Increment",
              groupName: className,
              groupCode: classCode,
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
  });

  /*
  Job to delete KIO class from joined groups
    Input => 
      Nothing
    Output =>
      Nothing
  */
  Parse.Cloud.job("deleteKioClassFromUserJoinedGroups", function(request, status){ 
    var result = [];
    var toupdate = [];
    var processCallback = function(res){
      result = result.concat(res);
      if (res.length == 1000){
        process(res[res.length-1].id);
        return;
      }
      var len = result.length;
      for(var i = 0; i < len; i++){
        var joinedGroups = result[i].get('joined_groups');
        if(typeof joinedGroups != 'undefined'){
          for(var i = 0; i < joinedGroups.length; i++){
            if(joinedGroups[i][1] == "MR. KIO"){
              joinedGroups.splice(i, 1);
              result[i].set("joined_groups",joinedGroups);
              break;
            }
          }
        }
      }
      Parse.Object.saveAll(result).then(function(objs){
        status.success("deleted the messages");
      }, function(error) { 
        status.error(error.code + ": " + error.message);
      });
    }
    var process = function(skip){
      var query = new Parse.Query("User");
      query.select("joined_groups");
      if(skip){
        query.greaterThan("objectId", skip);
      }
      query.limit(1000);
      query.ascending("objectId");
      query.find().then(function querySuccess(res) {
        processCallback(res);
      }, function queryFailed(reason) {
        status.error("query unsuccessful, length of result " + result.length + ", error:" + error.code + " " + error.message);
      });
    }
    process(false);
  });

  /*
  Job to remove KIO class from joined groups
    Input => 
      Nothing
    Output =>
      Nothing
  */
  Parse.Cloud.job("removeKIO", function(request, status){
    Parse.Cloud.useMasterKey();
    var query = new Parse.Query(Parse.User);
    query.select("joined_groups");
    query.each(function(user){
      var groups = user.get("joined_groups");
      var promise = Parse.Promise.as();
      if(groups){
        for(var i = 0; i < groups.length; i++){
          if(groups[i][1] == "MR. KIO"){
            groups.splice(i,1);
            user.set("joined_groups", groups);
            promise = promise.then(function(){
              return user.save();
            });
            break;
          }
        }
      }
    }).then(function(){
      status.success("Successfully removed KIO from joined groups");
    }, function(error){
      status.error(error.code + ": " + error.message);
    });
  });


/*----------------------------------------------- CLOUD fUCNTIONS --------------------------------------------------*/
  Parse.Cloud.define("getServerTime", function(request, response){
    response.success(new Date());
  });

/* OLD VERSION */
/*----------------------------------------------- OLD.JS -----------------------------------------------------------*/
  Parse.Cloud.define("changeAssociateName", function(request, response){
    old.changeAssociateName(request, response);
  });

  Parse.Cloud.define("createClass", function(request, response){
    old.createClass(request, response);
  });

  Parse.Cloud.define("joinClass", function(request, response){
    old.joinClass(request, response);
  });

  Parse.Cloud.define("deleteClass", function(request, response){
    old.deleteClass(request, response);
  });

  Parse.Cloud.define("leaveClass", function(request, response){
    old.leaveClass(request, response);
  });

  Parse.Cloud.define("genCode", function(request, response){
    old.genCode(request, response);
  });

  Parse.Cloud.define("removeChannels", function(request, response){
    old.removeChannels(request, response);
  });
      
  Parse.Cloud.define("addChannels", function(request, response){
    old.addChannels(request, response);
  });

  Parse.Cloud.define("suggestClass", function(request, response){
    old.suggestClass(request, response);
  });

  Parse.Cloud.define("suggestClasses", function(request, response){
    old.suggestClasses(request, response);
  });

  Parse.Cloud.define("likeCountIncrement", function(request, response){
    old.likeCountIncrement(request, response);
  });
      
  Parse.Cloud.define("likeCountDecrement", function(request, response){
    old.likeCountDecrement(request, response);
  });
      
  Parse.Cloud.define("confusedCountIncrement", function(request, response){
    old.confusedCountIncrement(request, response);
  });
      
  Parse.Cloud.define("confusedCountDecrement", function(request, response){
    old.confusedCountDecrement(request, response);
  });
      
  Parse.Cloud.define("seenCountIncrement", function(request, response){
    old.seenCountIncrement(request, response);
  });
      
  Parse.Cloud.define("updateMessageState", function(request, response){
    old.updateMessageState(request, response);
  });
      
  Parse.Cloud.define("getLikeConfusedCount", function(request, response){
    old.getLikeConfusedCount(request, response);
  });
      
  Parse.Cloud.define("getOutboxMessages", function(request, response){
    old.getOutboxMessages(request, response);
  });
     
  Parse.Cloud.define("inviteTeacher", function(request, response){
    old.inviteTeacher(request, response);
  });

  Parse.Cloud.define("verifyCode", function(request, response){
    old.verifyCode(request, response);
  });

  Parse.Cloud.define("appLogout", function(request, response){
    old.appLogout(request, response);
  });

  Parse.Cloud.define("mailInstructions", function(request, response){
    old.mailInstructions(request, response);
  });

  Parse.Cloud.define("updateCount", function(request, response){
    old.updateCount(request, response);
  });

  Parse.Cloud.define("updateCounts", function(request, response){
    old.updateCounts(request, response);
  });

  Parse.Cloud.define("showLatestMessagesWithLimit", function(request, response){
    old.showLatestMessagesWithLimit(request, response);
  });

  Parse.Cloud.define("showOldMessages", function(request, response){
    old.showOldMessages(request, response);
  });

  Parse.Cloud.define("schoollist", function(request, response){
    old.schoollist(request, response);
  });
     
  Parse.Cloud.define("getSchoolId", function(request, response){
    old.getSchoolId(request, response);
  }); 

  Parse.Cloud.define("getSchoolName", function(request, response){
    old.getSchoolName(request, response);
  });

  Parse.Cloud.define("findClass", function(request, response){
    old.findClass(request, response);
  });

  Parse.Cloud.define("areaAutoComplete", function(request, response){
    old.areaAutoComplete(request, response);
  });

  Parse.Cloud.define("schoolsNearby", function(request, response){
    old.schoolsNearby(request, response);
  });

  Parse.Cloud.define("toupdatetimebyclass", function(request, response){
    old.toupdatetimebyclass(request, response);
  });
      
  Parse.Cloud.define("toupdatetime", function(request, response){
    old.toupdatetime(request, response);
  });

  Parse.Cloud.define("showclassstrength", function(request, response){
    old.showclassstrength(request, response);
  });

  Parse.Cloud.define("showSubscribers", function(request, response){
    old.showSubscribers(request, response);
  });

  Parse.Cloud.define("messagecc", function(request, response){
    old.messagecc(request, response);
  });

  Parse.Cloud.define("samplemessage", function(request, response){
    old.samplemessage(request, response);
  });

/*----------------------------------------------- PARTIAL.JS -------------------------------------------------------*/
  Parse.Cloud.define("createClass2", function(request, response){
    partial.createClass(request, response);
  });

  Parse.Cloud.define("deleteClass2", function(request, response){
    partial.deleteClass(request, response);
  });

  Parse.Cloud.define("joinClass2", function(request, response){
    partial.joinClass(request, response);
  });

  Parse.Cloud.define("leaveClass2", function(request, response){
    partial.leaveClass(request, response);
  });

  Parse.Cloud.define("changeAssociateName2", function(request, response){
    partial.changeAssociateName(request, response);
  });

/* NEW VERSION */
/*----------------------------------------------- CLASSES.JS -------------------------------------------------------*/
  Parse.Cloud.define("createClass3", function(request, response){
    classes.createClass(request, response);
  });

  Parse.Cloud.define("joinClass3", function(request, response){
    classes.joinClass(request, response);
  });

  Parse.Cloud.define("deleteClass3", function(request, response){
    classes.deleteClass(request, response);
  });

  Parse.Cloud.define("leaveClass3", function(request, response){
    classes.leaveClass(request, response);
  });

  Parse.Cloud.define("removeMember", function(request, response){
    classes.removeMember(request, response);
  });

  Parse.Cloud.define("giveClassesDetails", function(request, response){
    classes.giveClassesDetails(request, response);
  });

/*----------------------------------------------- EXTERNAL.JS ----------------------------------------------------------*/
  Parse.Cloud.define("mailPdf", function(request, response){
    external.mailPdf(request, response);
  });

  Parse.Cloud.define("getDeliveryReport", function(request, response){
    external.getDeliveryReport(request, response);
  });  

/*----------------------------------------------- LOGIN.JS ---------------------------------------------------------*/
  Parse.Cloud.define("genCode2", function(request, response){
    login.genCode(request, response);
  });

  Parse.Cloud.define("verifyCod", function(request, response){
    login.verifyCod(request, response);
  });

  Parse.Cloud.define("verifyCode2", function(request, response){
    login.verifyCode(request, response);
  });

  Parse.Cloud.define("appInstallation", function(request, response){
    login.appInstallation(request, response);
  });

  Parse.Cloud.define("appExit", function(request, response){
    login.appExit(request, response);
  });

/*----------------------------------------------- MESSAGE.JS -------------------------------------------------------*/
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

  Parse.Cloud.define("showLatestMessagesWithLimit2", function(request, response){
    message.showLatestMessagesWithLimit2(request, response);
  });

  Parse.Cloud.define("showOldMessages2", function(request, response){
    message.showOldMessages2(request, response);
  });

  Parse.Cloud.define("smsSubscribe", function(request, response){
    message.smsSubscribe(request, response);
  });

/*----------------------------------------------- MESSAGECOUNT.JS --------------------------------------------------*/
  Parse.Cloud.define("updateSeenCount", function(request, response){
    messagecount.updateSeenCount(request, response);
  });

  Parse.Cloud.define("updateCount2", function(request, response){
    messagecount.updateCount2(request, response);
  });

  Parse.Cloud.define("updateLikeAndConfusionCount", function(request, response){
    messagecount.updateLikeAndConfusionCount(request, response);
  });

/*----------------------------------------------- SUBSCRIBERS.JS ---------------------------------------------------*/
  Parse.Cloud.define("changeAssociateName3", function(request, response){
    subscriber.changeAssociateName(request, response);
  });

  Parse.Cloud.define("showAllSubscribers", function(request, response){
    subscriber.showAllSubscribers(request, response);
  });

/*----------------------------------------------- REST.JS ----------------------------------------------------------*/
  Parse.Cloud.define("faq", function(request, response){
    rest.faq(request, response);
  });
      
  Parse.Cloud.define("feedback", function(request, response){
    rest.feedback(request, response);
  });

  Parse.Cloud.define("inviteUsers", function(request, response){
    rest.inviteUsers(request, response);
  });

/*----------------------------------------------- TEMP.JS ----------------------------------------------------------*/
  Parse.Cloud.define("cloudpic", function(request, response){
    temp.cloudpic(request, response);
  });

  Parse.Cloud.define("getMailIds", function(request, response){
    temp.getMailIds(request, response);
  });

  Parse.Cloud.define("bulkSMS", function(request, response){
    temp.bulkSMS(request, response);
  }); 

/*----------------------------------------------- USER.JS ----------------------------------------------------------*/
  Parse.Cloud.define("getUpdatesUserDetail", function(request, response){
    user.getUpdatesUserDetail(request, response);
  });   

  Parse.Cloud.define("getUserDetails", function(request, response){
    user.getUserDetails(request, response);
  });  

  Parse.Cloud.define("updateProfilePic", function(request, response){
    user.updateProfilePic(request, response);
  }); 

  Parse.Cloud.define("updateProfileName", function(request, response){
    user.updateProfileName(request, response);
  }); 

/*----------------------------------------------- ANALYTICS.JS -----------------------------------------------------*/
  Parse.Cloud.define("newSignUps", function(request, response){
    analytics.newSignUps(request, response);
  });

  Parse.Cloud.define("newMessageSent", function(request, response){
    analytics.newMessageSent(request, response);
  });

  Parse.Cloud.define("activeMessenger", function(request, response){
    analytics.activeMessenger(request, response);
  });

/*----------------------------------------------- FOLLOWUP.JS ------------------------------------------------------*/
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

/*----------------------------------------------- DEVELOPER.JS -----------------------------------------------------*/
  /*
    Parse.Cloud.define("deleteKioClassFromUserJoinedGroups", function(request, response){
      developer.deleteKioClassFromUserJoinedGroups(request, response);
    });
  */

/*----------------------------------------------- CLASSLIST.JS -----------------------------------------------------*/
  Parse.Cloud.define("giveCLassesInCodegroup", function(request, response){
    classlist.giveCLassesInCodegroup(request, response);
  });

  Parse.Cloud.define("giveCLassesInGroupDetails", function(request, response){
    classlist.giveCLassesInGroupDetails(request, response);
  });

  Parse.Cloud.define("giveCLassesInUser", function(request, response){
    classlist.giveCLassesInUser(request, response);
  });

  Parse.Cloud.define("giveCLassesInGroupmembers", function(request, response){
    classlist.giveCLassesInGroupmembers(request, response);
  });

  Parse.Cloud.define("giveCLassesInMessageneeders", function(request, response){
    classlist.giveCLassesInMessageneeders(request, response);
  });

/*----------------------------------------------- CATUSER.JS -------------------------------------------------------*/
  Parse.Cloud.define("allUsers", function(request, response) {
    CatUser.allUsers(request, response);
  });

  Parse.Cloud.define("usersActiveInLastnMonths", function(request, response) {
    CatUser.usersActiveInLastnMonths(request, response);
  });

  Parse.Cloud.define("ClassesActiveInLastnMonths", function(request, response) {
    CatUser.ClassesActiveInLastnMonths(request, response);
  });

  Parse.Cloud.define("usersWhoJoinedActiveClassOnSms", function(request, response) {
    CatUser.usersWhoJoinedActiveClassOnSms(request, response);
  });

  Parse.Cloud.define("usersWhoJoinedActiveClassOnApp", function(request, response) {
    CatUser.usersWhoJoinedActiveClassOnApp(request, response);
  });

  Parse.Cloud.define("usernames00000", function(request, response) {
    CatUser.usernames00000(request, response);
  });

  Parse.Cloud.define("getNamesAndEmails", function(request, response) {
    CatUser.getNamesAndEmails(request, response);
  });

/*----------------------------------------------- GENERALSENDER.JS -------------------------------------------------*/
  Parse.Cloud.define("SendNotifications", function(request, response) {
    generalSender.SendNotifications(request, response);
  });
  
  Parse.Cloud.define("SendSms", function(request, response) {
    generalSender.SendSms(request, response);
  });

  Parse.Cloud.define("SendEmails", function(request, response) {
    generalSender.SendEmails(request, response);
  });
  
/*----------------------------------------------- WEB.JS -----------------------------------------------------------*/
  Parse.Cloud.define("showappsubscribers", function(request, response){
    web.showappsubscribers(request, response);
  });
  
  Parse.Cloud.define("showsmssubscribers", function(request, response){
    web.showsmssubscribers(request, response);
  });

  Parse.Cloud.define("showclassmessages", function(request, response){
    web.showclassmessages(request, response);
  });
  
  Parse.Cloud.define("showallclassesmessages", function(request, response){
    web.showallclassesmessages(request, response);
  });

/*----------------------------------------------- LOCATION.JS ------------------------------------------------------*/
  Parse.Cloud.define("getGeoPointsForPlotting",function(request,response){
    location.getGeoPointsForPlotting(request, response);
  });