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
exports.bulkMultilingualSMS = function(request, response){
  var msg = request.msg;
  msg = msg.replace(/<>/g,"< >");
  msg = msg.replace(/<(\S)/g,'< $1');
  msg = msg.replace(/(\S)>/g,'$1 >');
  var numbers = request.numbers;
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
      sex: String
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
  var sex = request.sex;
  var password = number + "qwerty12345";
  if(!username){
    username = number;
  }
  user.set("username", username);
  user.set("password", password);
  user.set("name", name);
  user.set("phone", number);
  user.set("role", role);
  user.set("email", email);
  user.set("sex", sex);
  return user.signUp().then(function(user){
    return Parse.Promise.as(user);
  }, function(error){
    if(error.code == 203){
      user.unset("email");
      return user.signUp();
    }
    return Parse.Promise.error(error);  
  });
}

/* 
Function to get facebook user info
  Input =>
    token: String
  Output =>
    user: JSON Object{
      id: String
      name: String
    }
  Procedure =>
    Simple sending a httpRequest on Graph Facebook API
  TODO =>
    Check for appsecret_proof parameter requirement in case of website user
*/
exports.getFacebookUserInfo = function(request){
  var token = request.token;
  return Parse.Cloud.httpRequest({
    url: 'https://graph.facebook.com/me',
    headers: {
      'Content-Type': 'application/json'
    },
    params: {
      'access_token': token,
      'fields': 'id,name,gender,email' 
    }
  }).then(function(httpResponse){
    return Parse.Promise.as(httpResponse.data);
  }, function(httpResponse){
    var error = {
      "code": httpResponse.data.code,
      "message": httpResponse.data.error
    };
    return Parse.Promise.error(error);
  });
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