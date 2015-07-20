var run = require('cloud/run.js');
var _ = require('cloud/underscore-min.js');

/*
Function to genrate OTP 
  Input => 
    number: String // 10 digit phone no
  Output => 
    <Success>
      <Valid Number>
        flag: true
      <Invalid Number>
        flag: false
    <Error>
      error: String
  Procedure =>
    Process generates random code, save entry in new table and send code via sms
*/
exports.genCode = function(request, response){
  var number = request.params.number;
  var code = Math.floor(Math.random() * 9000 + 1000);
  var Temp = Parse.Object.extend("Temp");
  var temp = new Temp();
  temp.save({
    phoneNumber: number,
    code: code
  }).then(function(temp){
    var msg = code + " is your Knit verification Code";
    return run.singleSMS({
      "msg": msg,
      "number": number
    });
  }).then(function(text){
    response.success(true);
  }, function(error){
    response.error(error.code + ": " + error.message);
  }); 
}

/*
Function to verify OTP by generating revocable session tokens
  Input => 
    < Email Login Users >
      email: String
      password: String
    < Mobile Login Users >
      number: String // 10 digit phone no
      code: Number
      In case of signup extra parameters mentioned below are required too,  
        name: String
        role: String // Parent or Teacher
  Output =>
    < Success >
      JSON object{ 
        flag: Bool // True if atleast one entry found otherwise false 
        sessionToken: String // revocable session Token of user signed in
      }
    < Error >
      < Email Login Users >
        * USER_DOESNOT_EXISTS // In case of invalid credentials
        * error // Otherwise
      < Mobile Login Users >
        * USER_DOESNOT_EXISTS // In case of invalid login 
        * USER_ALREADY_EXISTS // In case of invalid signup
        * error // Otherwise
  Description =>
    Process check entry in new table with time constraint
*/
exports.verifyCod = function(request, response){
  var email = request.params.email;
  if(typeof email != 'undefined'){
    var password = request.params.password;
    Parse.User.logIn(email, password).then(function(user){
      return run.genRevocableSession({
        "sessionToken": user._sessionToken
      });
    }).then(function(sessionToken){
      var output = {
        "flag": true,
        "sessionToken": sessionToken
      };
      response.success(output);
    }, function(error){
      if(error.code == 101)
        response.error("USER_DOESNOT_EXISTS");
      else
        response.error(error.code + ": " + error.message);
    });
  }
  else{
    var number = request.params.number;
    var code = request.params.code;
    var d = new Date();
    var e = new Date(d.getTime() - 300000);
    var query = new Parse.Query("Temp"); 
    query.equalTo("code", code);
    query.equalTo("phoneNumber", number);
    query.greaterThan("createdAt", e);
    query.first().then(function(temp){
      if(temp){
        var user = new Parse.User();
        var name = request.params.name;
        if(typeof name == 'undefined'){
          return Parse.User.logIn(number, number + "qwerty12345").then(function(user){
            return run.genRevocableSession({
              "sessionToken": user._sessionToken
            });
          });
        }
        else{
          var role = request.params.role;
          var emailId = request.params.emailId;
          user.set("username", number);
          user.set("password", number + "qwerty12345");
          user.set("name", name);
          user.set("phone", number);
          user.set("role", role);
          user.set("email", emailId);
          return user.signUp().then(function(user){
            return run.genRevocableSession({
              "sessionToken": user._sessionToken
            });
          });
        }
      }
      else{
        var promise = Parse.Promise.as("");
        return promise;
      }
    }).then(function(sessionToken){
        var flag = false;
        if(sessionToken != ""){
          flag = true;
        }
        var output = {
          "flag": flag,
          "sessionToken": sessionToken
        };
        response.success(output);
    }, function(error){
      if(error.code == 101){
        response.error("USER_DOESNOT_EXISTS");
      }
      else if(error.code == 202){
        response.error("USER_ALREADY_EXISTS");
      }
      else{
        response.error(error.code + ": " + error.message);
      }
    });
  } 
}

/*
Function to verify OTP by generating revocable session tokens
  Input => 
    < Email Login Users >
      email: String
      password: String
    < Mobile Login Users >
      number: String // 10 digit phone no
      code: Number
      In case of signup extra parameters mentioned below are required too,  
        name: String
        role: String // Parent or Teacher
  Output =>
    < Success >
      JSON object{ 
        flag: Bool // True if atleast one entry found otherwise false 
        sessionToken: String // revocable session Token of user signed in
      }
    < Error >
      < Email Login Users >
        * USER_DOESNOT_EXISTS // In case of invalid credentials
        * error // Otherwise
      < Mobile Login Users >
        * USER_DOESNOT_EXISTS // In case of invalid login 
        * USER_ALREADY_EXISTS // In case of invalid signup
        * error // Otherwise
  Description =>
    Process check entry in new table with time constraint
*/
exports.verifyCode = function(request, response){
  var email = request.params.email;
  if(typeof email != 'undefined'){
    var password = request.params.password;
    Parse.User.logIn(email, password).then(function(user){
      Parse.Cloud.useMasterKey();
      var query = Parse.Query(Parse.Session);
      query.equalTo("user", user);
      return query.each(function(session){
        return session.destroy();
      }).then(function(){
        return run.genRevocableSession({
          "sessionToken": user._sessionToken
        });
      });
    }).then(function(sessionToken){
      var output = {
        "flag": true,
        "sessionToken": sessionToken
      };
      response.success(output);
    }, function(error){
      if(error.code == 101)
        response.error("USER_DOESNOT_EXISTS");
      else
        response.error(error.code + ": " + error.message);
    });
  }
  else{
    var number = request.params.number;
    var code = request.params.code;
    var d = new Date();
    var e = new Date(d.getTime() - 300000);
    var query = new Parse.Query("Temp"); 
    query.equalTo("code", code);
    query.equalTo("phoneNumber", number);
    query.greaterThan("createdAt", e);
    query.first().then(function(temp){
      if(temp){
        var user = new Parse.User();
        var name = request.params.name;
        if(typeof name == 'undefined'){
          return Parse.User.logIn(number, number + "qwerty12345").then(function(user){
            var query = Parse.Query(Parse.Session);
            query.equalTo("user", user);
            return query.each(function(session){
              return session.destroy();
            }).then(function(){
              return run.genRevocableSession({
                "sessionToken": user._sessionToken
              });
            });
          });
        }
        else{
          var role = request.params.role;
          var emailId = request.params.emailId;
          user.set("username", number);
          user.set("password", number + "qwerty12345");
          user.set("name", name);
          user.set("phone", number);
          user.set("role", role);
          user.set("email", emailId);
          return user.signUp().then(function(user){
            return run.genRevocableSession({
              "sessionToken": user._sessionToken
            });
          });
        }
      }
      else{
        var promise = Parse.Promise.as("");
        return promise;
      }
    }).then(function(sessionToken){
        var flag = false;
        if(sessionToken != ""){
          flag = true;
        }
        var output = {
          "flag": flag,
          "sessionToken": sessionToken
        };
        response.success(output);
    }, function(error){
      if(error.code == 101){
        response.error("USER_DOESNOT_EXISTS");
      }
      else if(error.code == 202){
        response.error("USER_ALREADY_EXISTS");
      }
      else{
        response.error(error.code + ": " + error.message);
      }
    });
  } 
}

/*
Function to save installation id in cloud
  Input =>
    installationId: String
    deviceType: String
  Output =>
    objectid: String // object id of installation id created
  Description =>
    Procedure simply save query on installation table
*/
exports.appInstallation = function(request, response){
  var user = request.user;
  var username = user.get("username");
  var installationId = request.params.installationId;
  var deviceType = request.params.deviceType;
  var joined_groups = user.get("joined_groups");
  var classcodes = [];
  if(typeof joined_groups !='undefined'){
    classcodes = _.map(joined_groups, function(joined_group){
      return joined_group[0];
    });
  }
  Parse.Cloud.useMasterKey();
  var query = new Parse.Query(Parse.Installation);
  query.equalTo("installationId", installationId);
  query.first().then(function(installation){
    if(!installation){
      var Installation = Parse.Object.extend("_Installation");
      installation = new Installation();
    }
    installation.set("username", username);
    installation.set("installationId", installationId);
    installation.set("deviceType", deviceType);
    installation.set("channels", classcodes);
    return installation.save();
  }).then(function(installation){
    response.success(installation.id);
  }, function(error){
    response.error(error.code + ": " + error.message);
  });
}

/*
Function to logout from the app given installationId
  Input =>
    installationId: String
  Output =>
    flag: Bool // true in case of success
  Description =>
    Procedure simple clear entry of channels on installation table
*/
exports.appExit = function(request, response){
  var installationId = request.params.installationId;
  Parse.Cloud.useMasterKey();
  var query = new Parse.Query(Parse.Installation);
  query.equalTo("installationId", installationId);
  query.first().then(function(installation){
    installation.set("channels", []);
    return installation.save();
  }).then(function(installation){
    response.success(true);
  }, function(error){
    response.error(error.code + ": " + error.message);
  }); 
}