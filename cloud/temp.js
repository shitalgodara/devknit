var run = require('cloud/run.js');

/* 
Function to set user profile 
  Input =>
    pname: String // Profile name
    pfile: File Pointer // Profile photo
  Output =>
    response: String // ok in case of success
  Procedure => 
    Simple query on Codegroup
*/
exports.cloudpic = function(request, response){
  var Codegroup = Parse.Object.extend("Codegroup");
  var query = new Parse.Query(Codegroup);
  query.select("Creator", "senderId", "classExist", "picName", "senderPic", "userId");
  query.equalTo("Creator", request.params.name);
  var pname = request.params.pname;
  var pfile = request.params.pfile;
  query.each(function(codegroup){
    codegroup.set("senderPic", pfile);
    codegroup.set("picName", pname);
    return codegroup.save();
  }).then(function(codegroup){
    response.success('ok');
  }, function(error) {
    response.error(error.code + ": " + error.message);
  });
}

/* 
Function to get list of all mail ids of users
*/
exports.getMailIds = function(request, response){
  Parse.Cloud.useMasterKey();
  var query = new Parse.Query(Parse.User);
  query.exists("email");
  query.select("email");
  var mailIds = [];
  query.each(function(user){
    mailIds.push(user.get("email"));
  }).then(function(){
    var recipients = [{
      "name": "Shubham",
      "email": "shubham@trumplab.com"
    }];
    return run.mailText({
      "recipients": recipients,
      "text": mailIds.join("\n"),
      "subject": "Mail Ids of the Knit Users"
    });
  }).then(function(success){
    response.success(true);
  }, function(error){
    response.error(error.code + ": " + error.message);
  });
}