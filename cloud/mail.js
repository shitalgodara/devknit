var run = require('cloud/run.js');

/* 
Function to mail instructions to teachers
	Input => 
		emailId: String
	Output =>
		flag: Bool // Success in case of email sent otherwise error
	Procedure =>
		Called mailAttachment function 
*/
exports.mailInstructions = function(request, response){
	var instructions = require('cloud/Attachments/instructions.js');
	var content = instructions.getBase64();
	var name = request.user.get("name");
	var recipients = [
		{
			"name": name,
			"email": request.params.emailId
		}
	];
	var subject = "How to invite parent";
	var text = "Hi " + name + ',\n\n' + "Welcome to KNIT" + '\n' + "To invite parents to your class you have to share your class code with them, you can send this paper to all students in your class. Write your class code in the box provided in the pdf below." + '\n\n' + "Regards" + '\n' + "KNIT Team";
	var attachments = [
    {
      "type": "application/pdf",
      "name": "Instructions to join class.pdf",
      "content": content
  	}
  ];
	run.mailAttachment({
  	"recipients": recipients,
  	"subject": subject,
  	"text": text,
  	"attachments": attachments
  }).then(function(){
  		response.success(true);
  }, function(){
  	response.error("Uh oh, something went wrong");
 	});
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
	var text = "Hi " + name + ',\n' + "Welcome to KNIT" + '\n' + "To invite parents to your class you have to share your class code with them, you can send this paper to all students in your class" + '\n\n' + "Regards" + '\n' + "KNIT Team";
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
  	"text": text,
  	"attachments": attachments
  }).then(function(){
    response.success(true);
  },
  function(){
  	response.error(false);
  });
}