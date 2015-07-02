var _ = require('underscore.js');
var run = require('cloud/run.js');

/*
Function to output list of school names
  Input =>
    Nothing
  Output =>
    List of school names
*/
exports.schoollist = function(request, response) {
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
exports.getSchoolId = function(request, response){
  var schoolName = request.params.school;
  var query = new Parse.Query("SCHOOLS");
  query.equalTo("school_name", schoolName);
  query.first({
    success: function (result){
      if (result)
        response.success(result.id);
      else {
        var SCHOOLS = Parse.Object.extend("SCHOOLS");
        var schools = new SCHOOLS();
        schools.set("school_name", schoolName);
        schools.save(null, {
          success: function (school) {
            response.success(school.id);
          },
          error: function (error) {
            response.error("Error: " + error.code + " " + error.message);
          }
        });
      }
    },
    error: function (error){
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

/*
Function to invite users
  Input =>
    classCode: String
    type: Number 
    mode: String // phone or email
    data: 2D Array
      <Phone Mode>
        Array of [
          name:String,   
          phone: String
        ]
      <Email Mode>  
        Array of [
          name:String,   
          email: String
        ]
      ]
  Output =>
    flag: Bool // true in case of a success
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
  var name = request.user.get("name");
  if(mode == "phone"){
    var text = "";
    switch(type){
      case 1:
        text = "Dear teacher, I found an awesome app, 'Knit Messaging', for teachers to communicate with parents and students. You can download the app from http://goo.gl/CKLVD4\n-- " + name;
        break;
      case 2:
        var groups = request.user.get("Created_groups");
        var groupDetails = _.filter(groups, function(group){
          return group[0] === classCode;
        })[0];
        var className = groupDetails[1];
        text = "Hi! I have recently started using 'Knit Messaging' app to send updates for my " + className + " class. Download the app from http://goo.gl/bnJtyu and use code " + classCode + " to join my class. To join via SMS, send '" + classCode + " <Student's Name>' to 9243000080\n-- " + name;
        break;
      case 3:
        var teacherName = request.params.teacherName;
        var groups = request.user.get("joined_groups");
        var groupDetails = _.filter(groups, function(group){
          return group[0] === classCode;
        })[0];
        var className = groupDetails[1];
        text = "Hi! I just joined " + className + " class of " + teacherName + " on 'Knit Messaging' app. Download the app from http://goo.gl/tNRmsb and use " + classCode + " to join this class. To join via SMS, send '" + classCode + " <Student's Name>' to 9243000080\n-- " + name;
        break;
      case 4:
        text = "Yo! I just started using 'Knit Messaging' app. Its an awesome app for teachers, parents and students to connect with each other. Download the app from http://goo.gl/bekkLs\n-- " + name;
        break;
      default:
        response.success(true);
        break;
    }
    var numbers = _.map(recipients, function(recipient){
      return recipient[1].replace(/\s+/g, '');    
    });
    run.smsText({
      "numbers": numbers,
      "msg": text
    }).then(function(){
      response.success(true);
    },
    function(error){
      console.error(error);
      response.error(error.code + ": " + error.message);
    });  
  }
  else if(mode == "email"){
    var android = require('cloud/Attachments/android.js');
    var ios = require('cloud/Attachments/ios.js');
    var logo = require('cloud/Attachments/logo.js');
    var web = require('cloud/Attachments/web.js');
    var template_name;
    var template_content;
    var images = [
      {
        type: "image/png",
        name: "android",
        content: android.getBase64()
      },
      {
        type: "image/png",
        name: "ios",
        content: ios.getBase64()
      },
      {
        type: "image/png",
        name: "logo",
        content: logo.getBase64()
      },
      {
        type: "image/png",
        name: "web",
        content: web.getBase64()
      }
    ];
    switch(type){
      case 1:
        template_name = "p2t";
        template_content = [
          {
            name: "link",
            content: "<a href='http://goo.gl/jDrU5x' style='text-decoration: none'>download the app</a>" 
          },
          {
            name: "name",
            content: name
          }
        ];  
        break;
      case 2:
        var groups = request.user.get("Created_groups");
        var groupDetails = _.filter(groups, function(group){
          return group[0] === classCode;
        })[0];
        var className = groupDetails[1];
        template_name = "t2p";
        template_content = [
          {
            name: "link",
            content: "<a href='http://goo.gl/fbneyS' style='text-decoration: none'>Download the app</a>" 
          },
          {
            name: "classCode",
            content: classCode
          },
          {
            name: "className",
            content: className
          },
          {
            name: "name",
            content: name
          }
        ];
        break;
      case 3:
        var teacherName = request.params.teacherName;
        var groups = request.user.get("joined_groups");
        var groupDetails = _.filter(groups, function(group){
          return group[0] === classCode;
        })[0];
        var className = groupDetails[1];
        template_name = "p2p";
        template_content = [
          {
            name: "link",
            content: "<a href='http://goo.gl/qP3dcV' style='text-decoration: none'>Download the app</a>" 
          },
          {
            name: "classCode",
            content: classCode
          },
          {
            name: "className",
            content: className
          },
          {
            name: "teacherName",
            content: teacherName
          },
          {
            name: "name",
            content: name
          }
        ];
        break;
      case 4:
        template_name = "spread-the-word";
        template_content = [
          {
            name: "link",
            content: "<a href='http://goo.gl/xiXMpq' style='text-decoration: none'>download the app</a>" 
          },
          {
            name: "name",
            content: name
          }
        ];
        break;
      default:
        response.success(true);
        break;
    }
    recipients = _.map(recipients, function(recipient){
      var name = recipient[0].trim();
      var email = recipient[1];
      email = email.replace(/\s+/g, '');
      return {
        "name": name,
        "email": email
      };
    });
    run.mailTemplate({
      "recipients": recipients,
      "subject": "Invitation to join Knit",
      "images": images,
      "template_name": template_name,
      "template_content": template_content
    }).then(function(){
      response.success(true);
    },
    function(error){
      console.error(error);
      response.error(error.code + ": " + error.message);
    });  
  }
}