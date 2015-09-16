exports.sendJoinMessage = function(request){
  var msgnd = request.object;
  var number = msgnd.get("number");
  var code = msgnd.get("cod");
  if((msgnd.get("status") != "LEAVE") && (msgnd.get("status") != "REMOVED")){
    var query = new Parse.Query("Codegroup");
    query.equalTo("code", code);
    query.first().then(function(codegroup){
      if(typeof codegroup != 'undefined'){
        var teacher = codegroup.get("Creator");
        var classname = codegroup.get("name");    
        var msg = "Congratulations you have successfully subscribed to" + " " + teacher + "'s '" + classname + "' " + "classroom. You will start receiving messages as soon as your teacher start using it";
        run.singleSMS({
          "number": number,
          "msg": msg
        });
      }
    });
  }
}

exports.sendWrongSubscriptionMessage = function(request){  
  var wrong = request.object;
  var number = wrong.get("number");
  var code = wrong.get("cod");
  var a = code.toUpperCase();
  var b = a.substr(0,4);
  if(b == "STOP"){
    var cod = a.substr(4);
    cod = cod.trim();
    var Messageneeders = Parse.Object.extend("Messageneeders");
    var query = new Parse.Query(Messageneeders);
    query.equalTo("cod", cod);
    query.equalTo("number", number);
    query.first().then(function(msgnd){
      if(typeof msgnd != 'undefined'){
        msgnd.set("status", "LEAVE");
        msgnd.save().then(function(msgnd){
          var msg = "You have been successfully unsubscribed, now you will not receive any messages from your teacher"; 
          run.singleSMS({
            "number": number,
            "msg": msg
          });
        });  
      }
    });
  } 
  else if(b == "SEND"){
    var msg = "You seems to have forgot to enter student name, general format to subscribe via sms is 'classcode <space> student name'";
    run.singleSMS({
      "number": number,
      "msg": msg
    });
  }
  else{
    var msg = "You seems to have entered a wrong classcode, general format of code is XXXXXXX, you can ask teacher for code";
    run.singleSMS({
      "number": number,
      "msg": msg
    });
  }
}