var _ = require('cloud/include/underscore.js');
var run = require('cloud/build/run.js');

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
    run.bulkSMS({
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

/* 
Function to mail instructions to teachers along with class code on pdf
  Input => 
    email: String
  Output =>
    flag: Bool // Success in case of email sent otherwise error
  Procedure =>
    Called mailAttachment function 
*/
exports.mailPdf = function(request, response){
  var name = request.params.name;
  var recipients = [
    {
      "name": name, 
      "email": request.params.email
    }
  ];
  var subject = "How to invite parent";
  var html = "<div dir='ltr'><span style='font-size:12.8px'>Hello";
  if(name){
    html = html + " " + name;
  }
  html = html + ",&nbsp;</span><div style='font-size:12.8px'><br></div><div style='font-size:12.8px'><span>Thank you for using Knit!<br><div><br></div><div>To invite parents to join your class, you must share your class code.&nbsp;<a href='https://knitapp.co.in/blog/2015/09/08/why-knit-emphasises-on-class-code/' target='_blank'>Read why class code is important &nbsp;</a><br></div><div><br></div></span><div>We have attached a document in this email that will come in handy when you're sharing your class code. Simply print it out and circulate it amongst your students.&nbsp;</div><span><div><br></div><div>We hope you continue being associated with Knit</div><div><br></div><div>Regards</div><div>Knit team</div></span></div></div>";
  var attachments = [
    {
      "type": "application/pdf",
      "name": "Instructions to join class.pdf",
      "content": request.params.content
    }
  ];
  run.mailAttachment({
    "recipients": recipients,
    "subject": subject,
    "html": html,
    "attachments": attachments
  }).then(function(){
    response.success(true);
  },
  function(error){
    response.error(error.code + ": " + error.message);
  });
}