/*----------------------------------------------- FILE INCLUDES ----------------------------------------------------*/
  /* HELPER FILE */
  var _ = require('cloud/include/underscore.js');
  var run = require('cloud/build/run.js');

  /* OLD VERSION */
  var v0 = require('cloud/old/v0.js');
  var v1 = require('cloud/old/v1.js');

  /* LATEST VERSION */  
  var classes = require('cloud/latest/classes.js');
  var invite = require('cloud/latest/invite.js');
  var login = require('cloud/latest/login.js');
  var message = require('cloud/latest/message.js');
  var messagecount = require('cloud/latest/messagecount.js');
  var schools = require('cloud/latest/schools.js');
  var subscriber = require('cloud/latest/subscriber.js');
  var support = require('cloud/latest/support.js');
  var user = require('cloud/latest/user.js');

  /* EXTRA FILES */
  var temp = require('cloud/extra/temp.js');
  var web = require('cloud/extra/web.js');

/*----------------------------------------------- WEBHOOKS ---------------------------------------------------------*/
  Parse.Cloud.afterSave("Messageneeders", function(request){
    var msgnd = request.object;
    var number = msgnd.get("number");
    var code = msgnd.get("cod");
    if((msgnd.get("status") != "LEAVE") && (msgnd.get("status") != "REMOVED")){
      var query = new Parse.Query("Codegroup");
      query.equalTo("code", code);
      query.first().then(function(codegroup){
        if(typeof codegroup != 'undefined'){
          var teacher = codegroup.get("Creator");
          var classname = codegroup.get("name");    
          var msg = "Congratulations you have successfully subscribed to" + " " + teacher + "'s '" + classname + "' " + "classroom. You will start receiving messages as soon as your teacher start using it";
          run.singleSMS({
            "number": number,
            "msg": msg
          });
        }
      });
    }
  });
      
  Parse.Cloud.afterSave("wrong", function(request){
    var wrong = request.object;
    var number = wrong.get("number");
    var code = wrong.get("cod");
    var a = code.toUpperCase();
    var b = a.substr(0,4);
    if(b == "STOP"){
      var cod = a.substr(4);
      cod = cod.trim();
      var Messageneeders = Parse.Object.extend("Messageneeders");
      var query = new Parse.Query(Messageneeders);
      query.equalTo("cod", cod);
      query.equalTo("number", number);
      query.first().then(function(msgnd){
        if(typeof msgnd != 'undefined'){
          msgnd.set("status", "LEAVE");
          msgnd.save().then(function(msgnd){
            var msg = "You have been successfully unsubscribed, now you will not receive any messages from your teacher"; 
            run.singleSMS({
              "number": number,
              "msg": msg
            });
          });  
        }
      });
    } 
    else if(b == "SEND"){
      var msg = "You seems to have forgot to enter student name, general format to subscribe via sms is 'classcode <space> student name'";
      run.singleSMS({
        "number": number,
        "msg": msg
      });
    }
    else{
      var msg = "You seems to have entered a wrong classcode, general format of code is XXXXXXX, you can ask teacher for code";
      run.singleSMS({
        "number": number,
        "msg": msg
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
  });

/*----------------------------------------------- CLOUD fUCNTIONS --------------------------------------------------*/
  Parse.Cloud.define("getServerTime", function(request, response){
    response.success(new Date());
  });

/* OLD VERSION */
/*----------------------------------------------- V0.JS ------------------------------------------------------------*/
  Parse.Cloud.define("appInstallation", function(request, response){
    v0.appInstallation(request, response);
  });

  Parse.Cloud.define("changeAssociateName", function(request, response){
    v0.changeAssociateName(request, response);
  });

  Parse.Cloud.define("createClass", function(request, response){
    v0.createClass(request, response);
  });

  Parse.Cloud.define("joinClass", function(request, response){
    v0.joinClass(request, response);
  });

  Parse.Cloud.define("deleteClass", function(request, response){
    v0.deleteClass(request, response);
  });

  Parse.Cloud.define("leaveClass", function(request, response){
    v0.leaveClass(request, response);
  });

  Parse.Cloud.define("removeChannels", function(request, response){
    v0.removeChannels(request, response);
  });
      
  Parse.Cloud.define("addChannels", function(request, response){
    v0.addChannels(request, response);
  });

  Parse.Cloud.define("suggestClass", function(request, response){
    v0.suggestClass(request, response);
  });

  Parse.Cloud.define("suggestClasses", function(request, response){
    v0.suggestClasses(request, response);
  });

  Parse.Cloud.define("likeCountIncrement", function(request, response){
    v0.likeCountIncrement(request, response);
  });
      
  Parse.Cloud.define("likeCountDecrement", function(request, response){
    v0.likeCountDecrement(request, response);
  });
      
  Parse.Cloud.define("confusedCountIncrement", function(request, response){
    v0.confusedCountIncrement(request, response);
  });
      
  Parse.Cloud.define("confusedCountDecrement", function(request, response){
    v0.confusedCountDecrement(request, response);
  });
      
  Parse.Cloud.define("seenCountIncrement", function(request, response){
    v0.seenCountIncrement(request, response);
  });
      
  Parse.Cloud.define("updateMessageState", function(request, response){
    v0.updateMessageState(request, response);
  });
      
  Parse.Cloud.define("getLikeConfusedCount", function(request, response){
    v0.getLikeConfusedCount(request, response);
  });
      
  Parse.Cloud.define("getOutboxMessages", function(request, response){
    v0.getOutboxMessages(request, response);
  });
     
  Parse.Cloud.define("inviteTeacher", function(request, response){
    v0.inviteTeacher(request, response);
  });

  Parse.Cloud.define("verifyCode", function(request, response){
    v0.verifyCode(request, response);
  });

  Parse.Cloud.define("verifyCod", function(request, response){
    v0.verifyCod(request, response);
  });

  Parse.Cloud.define("appLogout", function(request, response){
    v0.appLogout(request, response);
  });

  Parse.Cloud.define("mailInstructions", function(request, response){
    v0.mailInstructions(request, response);
  });

  Parse.Cloud.define("updateCount", function(request, response){
    v0.updateCount(request, response);
  });

  Parse.Cloud.define("updateCounts", function(request, response){
    v0.updateCounts(request, response);
  });

  Parse.Cloud.define("showLatestMessagesWithLimit", function(request, response){
    v0.showLatestMessagesWithLimit(request, response);
  });

  Parse.Cloud.define("showOldMessages", function(request, response){
    v0.showOldMessages(request, response);
  });

  Parse.Cloud.define("schoollist", function(request, response){
    v0.schoollist(request, response);
  });
     
  Parse.Cloud.define("getSchoolId", function(request, response){
    v0.getSchoolId(request, response);
  }); 

  Parse.Cloud.define("getSchoolName", function(request, response){
    v0.getSchoolName(request, response);
  });

  Parse.Cloud.define("findClass", function(request, response){
    v0.findClass(request, response);
  });

  Parse.Cloud.define("toupdatetimebyclass", function(request, response){
    v0.toupdatetimebyclass(request, response);
  });
      
  Parse.Cloud.define("toupdatetime", function(request, response){
    v0.toupdatetime(request, response);
  });

  Parse.Cloud.define("showclassstrength", function(request, response){
    v0.showclassstrength(request, response);
  });

  Parse.Cloud.define("showSubscribers", function(request, response){
    v0.showSubscribers(request, response);
  });

  Parse.Cloud.define("messagecc", function(request, response){
    v0.messagecc(request, response);
  });

  Parse.Cloud.define("samplemessage", function(request, response){
    v0.samplemessage(request, response);
  });

  Parse.Cloud.define("sendTextMessage", function(request, response){
    v0.sendTextMessage(request, response);
  });
      
  Parse.Cloud.define("sendPhotoTextMessage", function(request, response){
    v0.sendPhotoTextMessage(request, response);
  });

/*----------------------------------------------- V1.JS ------------------------------------------------------------*/
  Parse.Cloud.define("createClass2", function(request, response){
    v1.createClass(request, response);
  });

  Parse.Cloud.define("deleteClass2", function(request, response){
    v1.deleteClass(request, response);
  });

  Parse.Cloud.define("joinClass2", function(request, response){
    v1.joinClass(request, response);
  });

  Parse.Cloud.define("leaveClass2", function(request, response){
    v1.leaveClass(request, response);
  });

  Parse.Cloud.define("changeAssociateName2", function(request, response){
    v1.changeAssociateName(request, response);
  });

  Parse.Cloud.define("sendMultiTextMessage", function(request, response){
    v1.sendMultiTextMessage(request, response);
  });

  Parse.Cloud.define("sendMultiPhotoTextMessage", function(request, response){
    v1.sendMultiPhotoTextMessage(request, response);
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

/*----------------------------------------------- INVITE.JS --------------------------------------------------------*/
  Parse.Cloud.define("inviteUsers", function(request, response){
    invite.inviteUsers(request, response);
  });

  Parse.Cloud.define("mailPdf", function(request, response){
    invite.mailPdf(request, response);
  });

/*----------------------------------------------- LOGIN.JS ---------------------------------------------------------*/
  Parse.Cloud.define("genCode", function(request, response){
    login.genCode(request, response);
  });

  Parse.Cloud.define("genCode2", function(request, response){
    login.genCode(request, response);
  });

  Parse.Cloud.define("appEnter", function(request, response){
    login.appEnter(request, response);
  });

  Parse.Cloud.define("appExit", function(request, response){
    login.appExit(request, response);
  });

/*----------------------------------------------- MESSAGE.JS -------------------------------------------------------*/
  Parse.Cloud.define("sendMultiTextMessage2", function(request, response){
    message.sendMultiTextMessage(request, response);
  });

  Parse.Cloud.define("sendMultiPhotoTextMessage2", function(request, response){
    message.sendMultiPhotoTextMessage(request, response);
  });

  Parse.Cloud.define("showClassMessages", function(request, response){
    message.showClassMessages(request, response);
  });
      
  Parse.Cloud.define("showLatestMessages", function(request, response){
    message.showLatestMessages(request, response);
  });

  Parse.Cloud.define("showLatestMessagesWithLimit2", function(request, response){
    message.showLatestMessagesWithLimit(request, response);
  });

  Parse.Cloud.define("showOldMessages2", function(request, response){
    message.showOldMessages(request, response);
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

/*----------------------------------------------- SCHOOLS.JS -------------------------------------------------------*/
  Parse.Cloud.define("areaAutoComplete", function(request, response){
    schools.areaAutoComplete(request, response);
  });

  Parse.Cloud.define("schoolsNearby", function(request, response){
    schools.schoolsNearby(request, response);
  });

/*----------------------------------------------- SUBSCRIBER.JS ----------------------------------------------------*/
  Parse.Cloud.define("changeAssociateName3", function(request, response){
    subscriber.changeAssociateName(request, response);
  });

  Parse.Cloud.define("showAllSubscribers", function(request, response){
    subscriber.showAllSubscribers(request, response);
  });

  Parse.Cloud.define("smsSubscribe", function(request, response){
    subscriber.smsSubscribe(request, response);
  });

/*----------------------------------------------- SUPPORT.JS -------------------------------------------------------*/
  Parse.Cloud.define("faq", function(request, response){
    support.faq(request, response);
  });
      
  Parse.Cloud.define("feedback", function(request, response){
    support.feedback(request, response);
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

/* EXTRA FILES */
/*----------------------------------------------- TEMP.JS ----------------------------------------------------------*/
  Parse.Cloud.define("cloudpic", function(request, response){
    temp.cloudpic(request, response);
  });

  Parse.Cloud.define("getMailIds", function(request, response){
    temp.getMailIds(request, response);
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