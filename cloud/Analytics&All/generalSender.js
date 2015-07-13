var run = require('cloud/run.js');

//send notification to username given 
//send email to given list 
//send sms to given list
//mail make it
exports.SendNotifications = function(request, response) {
    var usernames = request.params.usernames;
    var data = request.params.dataa;
    var query = new Parse.Query(Parse.Installation);
    query.containedIn('username', usernames);
    Parse.Push.send({
      where: query, 
      data: data
    }, {
      success: function() {
          response.success();
      },
      error: function(error) {
        response.error(error);
      }
    });
}
  
exports.SendSms = function(request, response) {
    var usernames = request.params.usernames;
    var data = request.params.dataa;   
    run.bulkSMS({
        "msg": data,
        "numbers": usernames
      }).then(function(httpResponse){
          response.success(true);
      },
      function(httpResponse){
        response.error(httpResponse);
      });
}

//email functoin call
exports.SendEmails = function(request, response) {
    var usernames = request.params.usernames;
    var data = request.params.dataa;
    old.smsText({
        "msg": data,
        "numbers": usernames
      }).then(function(httpResponse){
          response.success(true);
      },
      function(httpResponse){
        response.error(httpResponse);
      });
}