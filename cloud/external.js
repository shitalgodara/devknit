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
  function(error){
    response.error(error.code + ": " + error.message);
  });
}

/*
Function to get Delivery Report of sms and increase seen count of corresponding message
  Input =>
    msgId: String
    errorCode: String
    status: String
    deliveryDate: String
    submitDate: String
    msisdn: String
  Output =>
    flag: Bool // true in case of success
  Procedure =>
    * First get smsReport corresponding to msgId
    * Retrieve groupDetailId from smsReport and correspondingly increement its seen_count 
*/
exports.getDeliveryReport = function(request, response){
  var errorCode = request.params.errorCode;
  if(errorCode == "000"){
    var msgId = request.params.msgId;
    var query = new Parse.Query("SMSReport");
    query.equalTo("msgId", msgId);
    query.first().then(function(smsReport){
      if(smsReport){
        var groupDetailsId = smsReport.get("groupDetailsId");
        var query1 = new Parse.Query("GroupDetails");
        query1.equalTo("objectId", groupDetailsId);
        return query1.first().then(function(groupdetail){
          groupdetail.increment("seen_count");
          return groupdetail.save();
        });
      }
      else{
        return Parse.Promise.as();
      }
    }).then(function(){
      response.success(true);
    }, function(error){
      response.error(error.code + ": " + error.message);
    });  
  }
  else{
    var status = request.params.status;
    response.error(errorCode + ": " + status);
  }
}