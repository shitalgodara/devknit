var _ = require('cloud/underscore-min.js');
var run = require('cloud/run.js');

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
  query.find().then(function(faqs){
    response.success(faqs);
  }, function(error) {
    response.error(error.code + ": " + error.message);
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
exports.feedback = function(request, response){
  var feed = request.params.feed;
  var Feedbacks = Parse.Object.extend("Feedbacks");
  var feedback = new Feedbacks();
  feedback.set("content", feed);
  feedback.set("emailId", request.user.get("username"));
  feedback.save().then(function(feedback){
    response.success(true);
  }, function(error){
    response.error(error.code + ": " + error.message);
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
  var classcode = request.params.classCode;
  var user = request.user;
  var type = request.params.type;
  var recipients = request.params.data;
  var mode = request.params.mode;
  var name = user.get("name");
  if(mode == "phone"){
    var msg = "";
    switch(type){
      case 1:
        msg = "Dear teacher, I found an awesome app, 'Knit Messaging', for teachers to communicate with parents and students. You can download the app from http://goo.gl/CKLVD4 --" + name;
        break;
      case 2:
        var created_groups = user.get("Created_groups");
        var classname = _.find(created_groups, function(created_group){
          return created_group[0] === classcode;
        })[1];
        msg = "Hi! I have recently started using 'Knit Messaging' app to send updates for my " + classname + " class. Download the app from http://goo.gl/bnJtyu and use code " + classcode + " to join my class. To join via SMS, send '" + classcode + " <Student's Name>' to 9243000080 --" + name;
        break;
      case 3:
        var teacherName = request.params.teacherName;
        var joined_groups = user.get("joined_groups");
        var classname = _.find(joined_groups, function(joined_group){
          return joined_group[0] === classcode;
        })[1];
        msg = "Hi! I just joined " + classname + " class of " + teacherName + " on 'Knit Messaging' app. Download the app from http://goo.gl/tNRmsb and use " + classcode + " to join this class. To join via SMS, send '" + classcode + " <Student's Name>' to 9243000080 --" + name;
        break;
      case 4:
        msg = "Yo! I just started using 'Knit Messaging' app. Its an awesome app for teachers, parents and students to connect with each other. Download the app from http://goo.gl/bekkLs --" + name;
        break;
      default:
        response.success(true);
        break;
    }
    var numbers = _.map(recipients, function(recipient){
      return recipient[1].replace(/\s+/g, '');    
    });
    run.inviteSMS({
      "numbers": numbers,
      "msg": msg
    }).then(function(){
      response.success(true);
    },
    function(error){
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
        var created_groups = user.get("Created_groups");
        var classname = _.find(created_groups, function(created_group){
          return created_group[0] === classcode;
        })[1];
        template_name = "t2p";
        template_content = [
          {
            name: "link",
            content: "<a href='http://goo.gl/fbneyS' style='text-decoration: none'>Download the app</a>" 
          },
          {
            name: "classCode",
            content: classcode
          },
          {
            name: "className",
            content: classname
          },
          {
            name: "name",
            content: name
          }
        ];
        break;
      case 3:
        var teacherName = request.params.teacherName;
        var joined_groups = user.get("joined_groups");
        var classname = _.find(joined_groups, function(joined_group){
          return joined_group[0] === classcode;
        })[1];
        template_name = "p2p";
        template_content = [
          {
            name: "link",
            content: "<a href='http://goo.gl/qP3dcV' style='text-decoration: none'>Download the app</a>" 
          },
          {
            name: "classCode",
            content: classcode
          },
          {
            name: "className",
            content: classname
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
      response.error(error.code + ": " + error.message);
    });  
  }
}