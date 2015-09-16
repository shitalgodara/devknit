/************************************************ FILE INCLUDES *****************************************************/
  /* HELPER FILE */
  var _ = require('cloud/include/underscore.js');
  var run = require('cloud/build/run.js');

  /* JOBS */
  var notifications = require('cloud/jobs/notifications.js');

  /* WEBHOOKS */
  var sms = require('cloud/webhooks/sms.js');

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


/************************************************ JOBS **************************************************************/
/*----------------------------------------------- NOTIFICATIONS.JS -------------------------------------------------*/
  Parse.Cloud.job("sendLikeNotifications", function(request, status){
    notifications.sendLikeNotifications(request, status); 
  });

  Parse.Cloud.job("sendConfusedNotifications", function(request, status){
    notifications.sendConfusedNotifications(request, status);
  });

  Parse.Cloud.job("memberNotifications", function(request, status){
    notifications.memberNotifications(request, status);
  });


/************************************************ WEBHOOKS **********************************************************/
/*----------------------------------------------- SMS.JS -----------------------------------------------------------*/
  Parse.Cloud.afterSave("Messageneeders", function(request){
    sms.sendJoinMessage(request);
  });
      
  Parse.Cloud.afterSave("wrong", function(request){
    sms.sendWrongSubscriptionMessage(request);
  });


/************************************************ CLOUD fUCNTIONS ***************************************************/
  Parse.Cloud.define("getServerTime", function(request, response){
    response.success(new Date());
  });


/************************************************ OLD VERSION *******************************************************/
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


/************************************************ NEW VERSION *******************************************************/
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


/************************************************ EXTRA FILES *******************************************************/
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