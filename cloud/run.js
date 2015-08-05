var _ = require('cloud/underscore-min.js');

/*
Function to send single sms
  Input =>
    msg: String
    number: Array of number 
  Output =>
    httpResponse: Parse.Promise
  Procedure =>
    Sending a HTTPRequest to smsgupshup API
*/
exports.singleSMS = function(request){
  var msg = request.msg;
  var number = request.number;
  return Parse.Cloud.httpRequest({
    url: 'http://174.143.34.193/MtSendSMS/SingleSMS.aspx',
    headers: {
      'Content-Type': 'application/json'
    },
    params: {
      'usr': 'knitapp',
      'pass': 'knitapp',
      'msisdn': number,
      'msg': msg,
      'sid': 'myKnit',
      'mt': 9,
      'encoding': 0
    }
  }).then(function(httpResponse){
    return Parse.Promise.as(httpResponse.text);
  }, function(httpResponse){
    var error = {
      "code": httpResponse.data.code,
      "message": httpResponse.data.error
    };
    return Parse.Promise.error(error);
  });
}

/*
Function to send bulk sms
  Input =>
    msg: String
    numbers: Array of numbers 
  Output =>
    httpResponse: Parse.Promise
  Procedure =>
    Sending a HTTPRequest to smsgupshup API
*/
exports.bulkSMS = function(request, response){
  var msg = request.msg;
  var numbers = request.numbers;
  numbers = numbers.join();
  return Parse.Cloud.httpRequest({
    url: 'http://174.143.34.193/MtSendSMS/BulkSMS.aspx',
    headers: {
     'Content-Type': 'application/json'
    },
    params: {
     'usr': 'knittrans',
     'pass': 'knittrans',
     'msisdn': numbers,
     'msg': msg,
     'sid': 'myKnit',
     'mt': 9,
     'encoding': 0
    }
  }).then(function(httpResponse){
    return Parse.Promise.as(httpResponse.text);
  }, function(httpResponse){
    var error = {
      "code": httpResponse.data.code,
      "message": httpResponse.data.error
    };
    return Parse.Promise.error(error);
  });
}

/*
Function to send bulk sms
  Input =>
    msg: String
    numbers: Array of numbers 
  Output =>
    httpResponse: Parse.Promise
  Procedure =>
    Sending a HTTPRequest to smsgupshup API
*/
bulkMultilingualSMS = function(request, response){
  var msg = request.msg;
  msg = msg.replace(/<>/g,"< >");
  msg = msg.replace(/<(\S)/g,'< $1');
  msg = msg.replace(/(\S)>/g,'$1 >');
  var numbers = request.numbers;
  if(numbers.length > 0){
    var groupdetailId = request.groupdetailId;
    numbers = numbers.join();
    return Parse.Cloud.httpRequest({
      url: 'http://174.143.34.193/MtSendSMS/BulkSMS.aspx',
      followRedirects: true,
      headers: {
       'Content-Type': 'application/json'
      },
      params: {
       'usr': 'knittrans',
       'pass': 'knittrans',
       'msisdn': numbers,
       'msg': msg,
       'sid': 'myKnit',
       'mt': 9,
       'encoding': 2
      }
    }).then(function(httpResponse){
      var responses = httpResponse.text.split('|');
      var msgIds = [];
      for(var i in responses){
        msgIds.push(responses[i].split(',')[0]);
      }
      var SMSReport = Parse.Object.extend("SMSReport");
      var promise = Parse.Promise.as();
      _.each(msgIds, function(msgId){
        var smsReport = new SMSReport();
        smsReport.set("msgId", msgId);
        smsReport.set("groupdetailId", groupdetailId);
        promise = promise.then(function(){
          return smsReport.save();
        }); 
      });
      return promise.then(function(){
        return Parse.Promise.as(true);
      }, function(error){
        return Parse.Promise.error(error);
      });
    }, function(httpResponse){
      var error = {
        "code": httpResponse.data.code,
        "message": httpResponse.data.error
      };
      return Parse.Promise.error(error);
    });
  }
  else{
    return Parse.Promise.as(true);
  }
}

/*
Function to mail template 
  Input =>
    recipients: Array of objects{
      email: String  // emailId of recipient
      <Optional>
        name: String // name of recipient 
    }
    subject: String // subject of email
    template_name: String
    template_content: Array of object{
      name: String
      content: String
    }
    images: Array of object{
      type: String
      name: String
      content: String
    }
  Output =>
    httpResponse: Parse.Promise
  Procedure =>
    Calling to sendTemplate function of Mandrill api to send template 
*/
exports.mailTemplate = function(request){
  return Parse.Cloud.httpRequest({
    url: "https://mandrillapp.com/api/1.0/messages/send-template.json",
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8"
    }, 
    body: {
      "key": "GrD1JI_5pNZ6MGUCNBYqUw",
      "template_name": request.template_name,
      "template_content": request.template_content,
      "message": {
        "subject": request.subject,
        "from_email": "knit@trumplab.com",
        "from_name": "Knit",
        "to": request.recipients,
        "images": request.images
      },
      "async": false
    }
  }).then(function(httpResponse){
    return Parse.Promise.as();
  }, function(httpResponse){
    var error = {
      "code": httpResponse.data.code,
      "message": httpResponse.data.error
    };
    return Parse.Promise.error(error);
  });
} 

/*
Function to mail text
  Input =>
    recipients: Array of objects{
      email: String  // emailId of recipient
      <Optional>
        name: String // name of recipient  
    }
    subject: String // subject of email
    text: String
  Output =>
    Empty
  Procedure =>
    Calling to sendEmail function to send mail
*/
exports.mailText = function(request){
  var promise = new Parse.Promise();
  var Mandrill = require('mandrill');
  Mandrill.initialize('GrD1JI_5pNZ6MGUCNBYqUw');
  Mandrill.sendEmail({
    message: {
      text: request.text,
      subject: request.subject,
      from_email: "knit@trumplab.com",
      from_name: "Knit",
      to: request.recipients
    },
    async: false
  }, {
    success: function(httpResponse){
      promise.resolve();
    },
    error: function(httpResponse){
      var error = {
        "code": httpResponse.data.code,
        "message": httpResponse.data.error
      };
      promise.reject(error);
    }
  });
  return promise;
}

/*
Function to mail attachment
  Input =>
    recipients: Array of objects{
      email: String  // emailId of recipient
      <Optional>
        name: String // name of recipient  
    }
    attachments: Array of attachment{
      type: String // type of the attachment
      name: String
      content: String // base64 encoded content of the attachment
    }
    subject: String // subject of email
    text: String
  Output =>
    Empty
  Procedure =>
    Calling to sendEmail function to send attachment
*/
exports.mailAttachment = function(request){
  var promise = new Parse.Promise();
  var Mandrill = require('mandrill');
  Mandrill.initialize('GrD1JI_5pNZ6MGUCNBYqUw');
  Mandrill.sendEmail({
    message: {
      text: request.text,
      subject: request.subject,
      from_email: "knit@trumplab.com",
      from_name: "Knit",
      to: request.recipients,
      attachments: request.attachments
    },
    async: false
  }, {
    success: function(httpResponse){
      promise.resolve();
    },
    error: function(httpResponse){
      var error = {
        "code": httpResponse.data.code,
        "message": httpResponse.data.error
      };
      promise.reject(error);
    }
  });
  return promise;
}

/*
Function to verify OTP
  Input => 
    code: Number
    number: String
  Output =>
    flag: Bool // true in case of success
*/
exports.verifyCode = function(request){
  var code = request.code;
  var number = request.number;
  var query = new Parse.Query("Temp");
  var currentDate = new Date();
  var genCodeDate = new Date(currentDate.getTime() - 300000);
  var query = new Parse.Query("Temp"); 
  query.equalTo("code", code);
  query.equalTo("phoneNumber", number);
  query.greaterThan("createdAt", genCodeDate);
  return query.first();
}

/* 
Function to set user 
  Input => 
    role: String
    name: String
    email: String
    < OTP Login >
      number: String
    < Social Login >
      username: String
  Output =>
    user: Parse User Object
  Procedure =>
    A simple signUp query on user table
*/
exports.createUser = function(request){
  var user = new Parse.User();
  var role = request.role;
  var email = request.email;
  var number = request.number;
  var name = request.name;
  var username = request.username;
  if(!username){
    username = number;
  }
  var password = username + "qwerty12345";
  user.set("username", username);
  user.set("password", password);
  user.set("name", name);
  user.set("phone", number);
  user.set("role", role);
  user.set("email", email);
  return user.signUp();
}

/* 
Function to get facebook user info
  Input =>
    accessToken: String
  Output =>
    user: JSON Object{
      id: String
      name: String
      gender: String
      email: String
    }
  Procedure =>
    Simple sending a httpRequest on Graph Facebook API
  TODO =>
    Check for appsecret_proof parameter requirement in case of website user
*/
exports.getFacebookUserInfo = function(request){
  var accessToken = request.accessToken;
  return Parse.Cloud.httpRequest({
    url: 'https://graph.facebook.com/me',
    headers: {
      'Content-Type': 'application/json'
    },
    params: {
      'access_token': accessToken,
      'fields': 'id,name,email' 
    }
  }).then(function(httpResponse){
    var data = httpResponse.data;
    var user = {
      "username": data.id,
      "name": data.name,
      "email": data.email
    }
    return Parse.Promise.as(user);
  }, function(httpResponse){
    var error = {
      "code": httpResponse.data.code,
      "message": httpResponse.data.error
    };
    return Parse.Promise.error(error);
  });
}

/* 
Function to get google user info
  Input =>
    idToken: String
    accessToken: String
  Output =>
    user: JSON Object{
      id: String
      name: String
      gender: String
      email: String
    }
  Procedure =>
    * First verify Id Token
    * Simple sending a httpRequest on Google API to get User Info
*/
exports.getGoogleUserInfo = function(request, response){
  var Buffer = require('buffer').Buffer;
  var idToken = request.idToken;
  var accessToken = request.accessToken;
  var parts = idToken.split('.');
  var bodyBuf = new Buffer(parts[1], 'base64');  
  var body = JSON.parse(bodyBuf.toString());
  if (body.aud !== '838906570879-nujge366mj36s29elltobjnehh9e1a5j.apps.googleusercontent.com' || body.iss !== 'accounts.google.com'){
    var error = {
      "code": 1001,
      "message": "INVALID_ID_TOKEN" 
    }
    return Parse.Promise.error(error);
  }
  else{
    return Parse.Cloud.httpRequest({
      url: 'https://www.googleapis.com/oauth2/v3/userinfo',
      headers: {
        'Content-Type': 'application/json'
      },
      params: {
        'access_token': accessToken
      }
    }).then(function(httpResponse){
      var data = httpResponse.data;
      var user = {
        "username": data.sub,
        "name": data.name,
        "email": data.email
      }
      return Parse.Promise.as(user);
    }, function(httpResponse){
      var error = {
        "code": httpResponse.data.code,
        "message": httpResponse.data.error
      };
      return Parse.Promise.error(error);    
    });
  } 
}

/*
Function to save installation id in cloud
  Input =>
    installationId: String
    deviceType: String
    user: Parse User Object
  Output =>
    installation: Parse Installation Object
  Description =>
    Procedure simply save query on installation table
*/
exports.setInstallation = function(request){
  var user = request.user;
  var username = user.get("username");
  var installationId = request.installationId;
  var deviceType = request.deviceType;
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
  return query.first().then(function(installation){
    if(!installation){
      var Installation = Parse.Object.extend("_Installation");
      installation = new Installation();
    }
    installation.set("username", username);
    installation.set("installationId", installationId);
    installation.set("deviceType", deviceType);
    installation.set("channels", classcodes);
    return installation.save();
  });
}

/*
Function to destroy old sessions of user
  Input =>
    user: Parse User Object
  Output =>
    flag: Bool // true in case of success
  Procedure =>
    Simple query on session table
*/
exports.removeSessions = function(request){
  var user = request.user;
  Parse.Cloud.useMasterKey();
  var query = new Parse.Query(Parse.Session);
  query.equalTo("user", user);
  query.equalTo("isRevocable", true);
  return query.each(function(session){
    return session.destroy();
  }).then(function(){
    return Parse.Promise.as(true);
  });
}

/* 
Function to generate Revocable Session Token 
  Input =>
    sessionToken: String // Legacy session Token
  Output =>
    sessionToken: String // Revocable Session Token 
  Procedure =>
    Post request on upgradeToRevocableSession
*/
exports.createSession = function(request){
  return Parse.Cloud.httpRequest({
    method: "POST",
    url: "https://api.parse.com/1/upgradeToRevocableSession",
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
      'X-Parse-Application-Id': 'tTqAhR73SE4NWFhulYX4IjQSDH2TkuTblujAbvOK',
      'X-Parse-REST-API-Key': 'Rlfgv99tWRrpJDr484IkewPiQA7k2DRBQCzWjcC1', 
      'X-Parse-Session-Token': request.sessionToken
    }
  }).then(function(httpResponse){
    return Parse.Promise.as(httpResponse.data.sessionToken);
  }, function(httpResponse){
    var error = {
      "code": httpResponse.data.code,
      "message": httpResponse.data.error
    };
    return Parse.Promise.error(error);
  });
}

/*
Function to save session extra parameters in cloud
  Input =>
    model: String
    os: String
    lat: Number
    long: Number
    role: String
    user: Parse User Object
  Output =>
    session: Parse Session Object
  Description =>
    Procedure simply save query on session table
*/
exports.setSession = function(request){
  var model = request.model;
  var os = request.os;
  var lat = request.lat;
  var long = request.long;
  var role = request.role;
  var user = request.user;
  Parse.Cloud.useMasterKey();
  var query = new Parse.Query(Parse.Session);
  query.equalTo("user", user);
  return query.first().then(function(session){
    session.set("model", model);
    session.set("os", os);
    session.set("lat", lat);
    session.set("long", long);
    session.set("role", role);
    session.set("isRevocable", true);
    return session.save();
  });
}

/*
Function to get count of members subscribed to that class via app and sms
  Input =>
    code: String
  Output =>
    count: Number // Number of users subscribed to a class via app and sms 
  Procedure =>
    A simple query on GroupMembers and MessageNeeders
*/ 
exports.getClassStrength = function(request){
  var code = request.code;
  var query = new Parse.Query("GroupMembers");
  query.equalTo("code", code);
  query.doesNotExist("status");
  return query.count().then(function(count1){
    var query = new Parse.Query("Messageneeders");
    query.equalTo("cod", code);
    query.doesNotExist("status");
    return query.count().then(function(count2){
      return Parse.Promise.as(count1 + count2);
    });
  }, function(error){
    return Parse.Promise.error(error.code + ": " + error.message);
  });
}

/*
Function to send text message to single class
  Input =>
    classcode: String
    classname: String
    name: String
    username: String
    message: String
  Output =>
    JSON Object{
      messageId: String
      createdAt: String
    }
  Procedure =>
    Save entry in groupdetail and send push to app user and send sms to message user
*/
exports.sendTextMessage = function(request){  
  var name = request.name;
  var username = request.username;
  var classcode = request.classcode;
  var classname = request.classname;
  var message = request.message;
  var GroupDetails = Parse.Object.extend("GroupDetails");
  var groupdetail = new GroupDetails();
  return groupdetail.save({
    Creator: name,
    name: classname,
    title: message,
    senderId: username,
    code: classcode
  }).then(function(groupdetail){
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
    }).then(function(){
      var groupdetailId = groupdetail.id;
      var output = {
        messageId: groupdetailId,
        createdAt: groupdetail.createdAt
      };
      var msg = message;
      msg = classname + ": " + msg;
      var query = new Parse.Query("Messageneeders");
      msg = msg.substr(0, 330);
      query.equalTo("cod", classcode);
      query.doesNotExist("status");
      return query.find().then(function(msgnds){
        var numbers = _.map(msgnds, function(msgnd){
          return msgnd.get("number");
        });
        return bulkMultilingualSMS({
          "numbers": numbers,
          "msg": msg,
          "groupdetailId": groupdetailId
        });  
      }).then(function(){
        return Parse.Promise.as(output);
      });
    });
  });
}

/*
Function to send photo text message to single class
  Input =>
    classcode: String
    classname: String
    name: String
    username: String
    message: String
    parsefile: String
    filename: String
  Output =>
    JSON Object{
      messageId: String
      createdAt: String
    }
  Procedure =>
    Save entry in groupdetail and send push to app user and send sms to message user
*/
exports.sendPhotoTextMessage = function(request){
  var name = request.name;
  var username = request.username;
  var classcode = request.classcode;
  var classname = request.classname;
  var parsefile = request.parsefile;
  var filename = request.filename;
  var message = request.message;
  var msg;
  var GroupDetails = Parse.Object.extend("GroupDetails");
  var groupdetail = new GroupDetails();
  var url;
  return groupdetail.save({
    Creator: name,
    name: classname,
    title: message,
    senderId: username,
    code: classcode,
    attachment: parsefile,
    attachment_name: filename
  }).then(function(groupdetail){
    if (message == "") 
      msg = "You have received an Image";
    else
      msg = message;
    url = groupdetail.get('attachment').url();
    return Parse.Push.send({
      channels: [classcode],
      data: {
        msg: msg,
        alert: msg,
        badge: "Increment",
        groupName: classname,
        type: "NORMAL",
        action: "INBOX"
      }
    }).then(function(){
      var groupdetailId = groupdetail.id;
      var output = {
        messageId: groupdetailId,
        createdAt: groupdetail.createdAt
      };
      msg = classname + ": " + msg;
      msg = msg + ", Your Teacher " + name + " has sent you an attachment, we can't send you pics over mobile, so download our android-app http://goo.gl/Ptzhoa";
      msg = msg + " you can view image at ";
      return Parse.Cloud.httpRequest({
        url: 'http://tinyurl.com/api-create.php',
        params: {
          url : url
        }
      }).then(function(httpResponse){
        msg = msg + httpResponse.text;
        var query = new Parse.Query("Messageneeders");
        query.equalTo("cod", classcode);
        query.doesNotExist("status");
        return query.find().then(function(msgnds){
          var numbers = _.map(msgnds, function(msgnd){
            return msgnd.get("number");
          });
          return bulkMultilingualSMS({
            "numbers": numbers,
            "msg": msg,
            "groupdetailId": groupdetailId
          });  
        }).then(function(){
          return Parse.Promise.as(output);
        });
      }, function(httpResponse){
        var error = {
          "code": httpResponse.data.code,
          "message": httpResponse.data.error
        };
        return Parse.Promise.error(error);
      });
    });
  });
}