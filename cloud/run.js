/*
Function to send sms
  Input =>
    msg: String
    numbers: Array of numbers 
  Output =>
    httpResponse: Parse.Promise
  Procedure =>
    Sending a HTTPRequest to smsgupshup API
*/
exports.smsText2 = function(request){
  var msg = request.msg;
  var numbers = request.numbers;
  numbers = numbers.join();

   //<startenterprise api>
   return Parse.Cloud.httpRequest({
     url: 'http://174.143.34.193/MtSendSMS/BulkSMS.aspx',
     headers: {
       'Content-Type': 'application/json'
     },
     params: {
       'usr': 'knitapp',
       'pass': 'knitapp',
       'msisdn': numbers,
       'msg': msg,
       'sid': 'myKnit',
       'mt': 0
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
    console.error(httpResponse.data);
    var error = {
      "code": httpResponse.data.code,
      "message": httpResponse.data.error
    };
    return Parse.Promise.error(error);
  });
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
      console.error(httpResponse.data);
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
Function to generate Revocable Session Token 
  Input =>
    sessionToken: String // Legacy session Token
  Output =>
    sessionToken: String // Revocable Session Token 
  Procedure =>
    Post request on upgradeToRevocableSession
*/
exports.genRevocableSession = function(request){
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
    console.error(httpResponse.data);
    var error = {
      "code": httpResponse.data.code,
      "message": httpResponse.data.error
    };
    return Parse.Promise.error(error);
  });
}

var delayUntil;
var delayPromise;

var _delay = function (){
  if (Date.now() >= delayUntil){
    delayPromise.resolve();
    return;
  } 
  else{
    process.nextTick(_delay);
  }
} 

/*
Function to delay 
  Input =>
    millis: Number
*/
exports.delay = function(request) {
  var millis = request.millis;
  delayUntil = Date.now() + millis;
  delayPromise = new Parse.Promise();
  _delay();
  return delayPromise;
};
