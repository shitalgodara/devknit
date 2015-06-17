/*
Function to send sms
  Input =>
    msg: String
    phone: String // number of the recipient
  Output =>
    response: Parse.Promise
  Procedure =>
    Sending a HTTPRequest to smsgupshup API
*/
exports.smsText = function(request){
  var msg = request.msg;
  var phone = request.phone;
  var response = new Parse.Promise();
  return Parse.Cloud.httpRequest({
    url: 'http://enterprise.smsgupshup.com/GatewayAPI/rest',
    headers: {
      'Content-Type': 'application/json'
    },
    params: {
      method: 'sendMessage',
      send_to: phone,
      msg: msg,
      msg_type: 'Text',
      userid: '2000133095',
      auth_scheme: 'plain',
      password: 'wdq6tyUzP',
      v: '1.1',
      format: 'text'
    }
  });
}

/*
Function to send template 
  Input =>
    email: String // emailId of the recipient
    name: String // name of the recipient
    subject: String // subject of email
    template_name: String
    template_content: Array of object{
      name: String
      content: String
    }
  Output =>
    response: Parse.Promise
  Procedure =>
    Calling sendEmail function of Mandrill to send mail 
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
          "to": [
              {
                  "email": request.email,
                  "name": request.name
              }
          ]
      },
      "async": false
    }
  });
} 