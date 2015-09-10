var _ = require('cloud/underscore-min.js');

/*
Function to send OTP
  Input =>
    msg: String
    number: Array of number 
  Output =>
    httpResponse: Parse.Promise
  Procedure =>
    Sending a HTTPRequest to smsgupshup API
*/
exports.codeSMS = function(request){
  var msg = request.msg;
  var number = request.number;
  return Parse.Cloud.httpRequest({
    url: 'http://enterprise.smsgupshup.com/GatewayAPI/rest',
    headers: {
      'Content-Type': 'application/json'
    },
    params: {
      method: 'sendMessage',
      send_to: number,
      msg: msg,
      msg_type: 'Text',
      userid: '2000149020',
      auth_scheme: 'plain',
      password: '2000149020',
      v: '1.1',
      format: 'text',
      mask: 'myKnit'
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
    url: 'http://enterprise.smsgupshup.com/GatewayAPI/rest',
    headers: {
      'Content-Type': 'application/json'
    },
    params: {
      method: 'sendMessage',
      send_to: number,
      msg: msg,
      msg_type: 'Text',
      userid: '2000133095',
      auth_scheme: 'plain',
      password: 'wdq6tyUzP',
      v: '1.1',
      format: 'text',
      mask: 'myKnit'
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
exports.bulkSMS = function(request){
  var msg = request.msg;
  var numbers = request.numbers;
  numbers = numbers.join();
  if(numbers.length > 0){
    var groupdetailId = request.groupdetailId;
    return Parse.Cloud.httpRequest({
      url: 'http://enterprise.smsgupshup.com/GatewayAPI/rest',
      headers: {
        'Content-Type': 'application/json'
      },
      params: {
        method: 'sendMessage',
        send_to: numbers,
        msg: msg,
        msg_type: 'Text',
        userid: '2000133095',
        auth_scheme: 'plain',
        password: 'wdq6tyUzP',
        v: '1.1',
        format: 'text',
        mask: 'myKnit'
      }
    }).then(function(httpResponse){      
      var responses = httpResponse.text.split('\n');
      var SMSReport = Parse.Object.extend("SMSReport");
      var promise = Parse.Promise.as();
      _.each(responses, function(response){
        var status = response.split('|');
        if(status[0].trim() == 'success'){
          var smsReport = new SMSReport();
          smsReport.set("msgId", status[2].trim());
          smsReport.set("phoneNo", status[1].trim());
          smsReport.set("msgType", "Text");
          smsReport.set("groupdetailId", groupdetailId);
          promise = promise.then(function(){
            return smsReport.save();
          });
        }
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
Function to send bulk unicode sms
  Input =>
    msg: String
    numbers: Array of numbers 
  Output =>
    httpResponse: Parse.Promise
  Procedure =>
    Sending a HTTPRequest to smsgupshup API
*/
exports.bulkUnicodeSMS = function(request){
  var msg = request.msg;
  var numbers = request.numbers;
  numbers = numbers.join();
  if(numbers.length > 0){
    var groupdetailId = request.groupdetailId;
    return Parse.Cloud.httpRequest({
      url: 'http://enterprise.smsgupshup.com/GatewayAPI/rest',
      headers: {
        'Content-Type': 'application/json'
      },
      params: {
        method: 'sendMessage',
        send_to: numbers,
        msg: msg,
        msg_type: 'Unicode_text',
        userid: '2000133095',
        auth_scheme: 'plain',
        password: 'wdq6tyUzP',
        v: '1.1',
        format: 'text',
        mask: 'myKnit'
      }
    }).then(function(httpResponse){      
      var responses = httpResponse.text.split('\n');
      var SMSReport = Parse.Object.extend("SMSReport");
      var promise = Parse.Promise.as();
      _.each(responses, function(response){
        var status = response.split('|');
        if(status[0].trim() == 'success'){
          var smsReport = new SMSReport();
          smsReport.set("msgId", status[2].trim());
          smsReport.set("phoneNo", status[1].trim());
          smsReport.set("msgType", "Unicode_text");
          smsReport.set("groupdetailId", groupdetailId);
          promise = promise.then(function(){
            return smsReport.save();
          });
        }
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
      "async": true
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
    async: true
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
    html: String
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
      html: request.html,
      subject: request.subject,
      from_email: "knit@trumplab.com",
      from_name: "Knit",
      to: request.recipients,
      attachments: request.attachments
    },
    async: true
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
  var name = request.name;
  var parts = idToken.split('.');
  var bodyBuf = new Buffer(parts[1], 'base64');  
  var body = JSON.parse(bodyBuf.toString());
  if((body.aud !== '838906570879-nujge366mj36s29elltobjnehh9e1a5j.apps.googleusercontent.com' && body.aud !== '838906570879-1ovtvi844jjc52aopgdm7jrgqvh2m1rn.apps.googleusercontent.com') || body.iss !== 'accounts.google.com'){
    var error = {
      "code": 1001,
      "message": "INVALID_ID_TOKEN" 
    }
    return Parse.Promise.error(error);
  }
  else{
    if(!name){
      name = body.name;
    }
    var user = {
      "username": body.sub,
      "name": name,
      "email": body.email
    }
    return Parse.Promise.as(user);
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
    if(typeof installation != 'undefined'){
      var error = {
        "code": "1003",
        "message": "Installation object not found"
      };
      return Parse.Promise.error(error);
    }
    installation.set("username", username);
    installation.set("installationId", installationId);
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