var run = require('cloud/run.js');

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