var _ = require('underscore.js');
var Mandrill = require('mandrill');

/*
Function to output list of school names
    Input =>
    Nothing
  Output =>
    List of school names
*/
exports.schoollist = function(request, response) {
    var FAQs = Parse.Object.extend("SCHOOLS");
    var query = new Parse.Query("SCHOOLS");
    query.select("school_name");
    query.find({
        success: function(results) {
            response.success(results);
        },
        error: function(error) {
            response.error("Error: " + error.code + " " + error.message);
        }
    });
}

/*
Function to give school name corresponding to school id
  Input =>
    schoolId: String
  Output =>
    schoolName: String
  Procedure =>
    Simple query on schools table
*/
exports.getSchoolName = function(request, response) {
    var school = request.params.schoolId;
    var SCHOOLS = Parse.Object.extend("SCHOOLS");
    var query = new Parse.Query(SCHOOLS); 
    query.get(school, {
        success: function(result){
            response.success(result.get('school_name'));
    },
    error: function(temp, error){
      response.error("Error: " + error.code + " " + error.message);
        }
    });
} 

/*
Function to give school id corresponding to school name
  Input =>
    schoolName: String
  Output =>
    schoolId: String
  Procedure =>
    Search query then save if doesn't exists on school
*/
exports.getSchoolId = function(request, response) {
  var schoolName = request.params.school;
    var SCHOOLS = Parse.Object.extend("SCHOOLS");
    var query = new Parse.Query("SCHOOLS");
    query.equalTo("school_name", schoolName);
    query.first({
        success: function(result){
      if(result)
        response.success(result.id);
      else{
        var SCHOOLS = Parse.Object.extend("SCHOOLS");
                var schools = new SCHOOLS();
                schools.set("school_name", schoolName);                    
                schools.save(null, {
                    success: function(school){
            response.success(school.id);
          },
                  error: function(error){
                        response.error("Error: " + error.code + " " + error.message);
                  }
            });
      }
        },
    error: function(error) {
        response.error("Error: " + error.code + " " + error.message);
    }
    });
}

/*
Function to return FAQs
  Input =>
    Date: String // Last date locally updated date available else 1st Nov 2014( some random old date)
  Output =>
    Array of objects of FAQs // Different according to different roles
  Procedure =>
    Simple query on FAQ
*/
exports.faq = function(request, response){
    var role = request.user.get("role");
    var date = request.params.date;
    var FAQs = Parse.Object.extend("FAQs");
    var query = new Parse.Query("FAQs");
    if (role == "parent"){
        query.equalTo("role", "Parent");
    }
  query.select("question", "answer");
  query.greaterThan("updatedAt", date);
    query.find({
        success: function(results){
            response.success(results);
        },
        error: function(error) {
            response.error("Error: " + error.code + " " + error.message);
        }
    });
}

/*
Function to submit feedback 
  Input =>
    feed: String // Feedback content
  Output =>
    flag: Bool // true in case of success otherwise false 
  Procedure =>
    Simple save query on feedback table
*/
exports.feedback = function(request, response) {
    var feed = request.params.feed;
  var Feedbacks = Parse.Object.extend("Feedbacks");
  var feedbacks = new Feedbacks();
    feedbacks.set("content", feed);
    feedbacks.set("emailId", request.user.get("username"));
    feedbacks.save(null,{
        success: function(feedbacks){
      var flag = true;
            response.success(flag);
        },
        error: function(object, error) {
            response.error("Error: " + error.code + " " + error.message);
        }
    });
}

/*
Function to find class
  Input =>
    code: String // class code
  Output =>
    Array of codegroup objects corresponding to class code
  Procedure =>
    Simple find query on codegroup
*/
exports.findClass = function(request, response){
    var classcode = request.params.code;
    var Codegroup = Parse.Object.extend("Codegroup");
    var query = new Parse.Query("Codegroup");
    query.equalTo("code", classcode);
    query.find({
        success: function(results){
            response.success(results);
        },
        error: function(error){
          response.error("Error: " + error.code + " " + error.message);    
        }
    });
}

function smsText(requestObj, response){
  var msg = requestObj.msg;
  var phone = requestObj.phone;
  Parse.Cloud.httpRequest({
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
      v: '1.0',
      format: 'text'
    },
    success: function(httpResponse) {
      console.log(httpResponse.text);
      response.success();
    },
    error: function(httpResponse) {
      console.error("Request failed with response code " + httpResponse.status);
      response.error(httpResponse.text);
    }
  });
}

function mailText(requestObj, response){
  var text = requestObj.text;
  var recipient = requestObj.recipient;
  Mandrill.initialize('GrD1JI_5pNZ6MGUCNBYqUw');
  Mandrill.sendEmail({
    message: {
      from_email: "shubham@trumplab.com",
      from_name: "Knit",
      subject: "Invitation to join Knit",
      text: text,
      to: [
        {
          email: recipient.emailId,
          name: recipient.name 
        }
      ]
    },
    async: true
  },{
    success: function(httpResponse){
      console.log(httpResponse.status);
    },
    error: function(httpResponse){
      console.error("Request failed with response code " + httpResponse.status);
      response.error(httpResponse.text);
    }
  });
} 

/*
Function to invite users
  Input =>
    classCode: String
    type: Number 
    mode: String // phone or email
    data: JSON object{
      name: String
      <Phone Mode>
        phone: String // Phone Mode
      <Email Mode>
        emailId: String
    } 
  Output =>
    flag: Bool
  Procedure =>  
    Calling mailText and smsText function according to mode input 
  TODO =>
    Rectify users that already have Knit App installed
*/
exports.inviteUsers = function(request, response){
  var classCode = request.params.classCode;
  var type = request.params.type;
  var recipients = request.params.data;
  var mode = request.params.mode;
  var text = "Hello I have recently started using a great communication tool, Knit Messaging, and I will be using it to send out reminders and announcements. To join my classroom you can use my classcode " + classCode + ".";
  if(mode == 'phone'){
    var flag = true;
    _.each(recipients, function(recipient){
      smsText({
        "phone": recipient.phone, 
        "msg": text
      },{
        success: function(){
        },
        error: function(error){
          flag = false;
          response.error(error);
        }
      });
    })
    if(flag)
      response.success(flag);
  }
  else if(mode == 'email'){
    _.each(recipients, function(recipient){
      mailText({
        "recipient": recipient, 
        "text": text
      },{
        success: function(){
        },
        error: function(error){
          flag = false;
          response.error(flag);
        }
      });
    })  
    if(flag)
      response.success(flag);
  }
}