var old = require('cloud/oldVersionSupport/old.js');

//send notification to username given 
//send email to given list 
//send sms to given list
//notify not working
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
    numberList=""
for(var i = 0; i < usernames.length; i++){
                    var a = usernames[i];
                    if (i == 0) 
                        numberList = a;
                    else
                        numberList= numberList + "," + a;
                }
    old.smsText({
        "msg": data,
        "numberList": numberList
      }).then(function(httpResponse){
        var text = httpResponse.text;
        console.log(text);
        if(text.substr(0,3) == 'err')
          response.success(false);
        else
          response.success(true);
      },
      function(httpResponse){
        console.error('Request failed with response code ' + httpResponse.status);
        response.error(httpResponse.text);
      });
}

//email functoin call
exports.SendEmails = function(request, response) {
    var usernames = request.params.usernames;
    var data = request.params.dataa;
   old.smsText({
        "msg": data,
        "numberList": usernames
      }).then(function(httpResponse){
        var text = httpResponse.text;
        console.log(text);
        if(text.substr(0,3) == 'err')
          response.success(false);
        else
          response.success(true);
      },
      function(httpResponse){
        console.error('Request failed with response code ' + httpResponse.status);
        response.error(httpResponse.text);
      });
}