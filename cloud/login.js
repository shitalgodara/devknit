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
Function to login the app after verifying the code
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
        email: String
    <Optional>
      installationId: String
      deviceType: String
      model: String
      os: String
      lat: Number
      long: Number
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
exports.appEnter = function(request, response){
  var code = request.params.code;
  var role = request.params.role;
  var email = request.params.email;
  var number = request.params.number;
  var name = request.params.name;
  var promise;
  var output = {
    "flag": false,
    "sessionToken": ""
  };
  if(code){
    promise = run.verifyOTP({
      "code": code,
      "number": number
    });
    promise = promise.then(function(temp){
      if(temp){
        if(role){
          return run.createUser({
            "number": number,
            "name": name,
            "role": role,
            "email": email
          });
        }
        else{
          return Parse.User.logIn(number, number + "qwerty12345");
        }
      }
      return Parse.Promise.as();
    });
  }
  else if(email){ 
    var password = request.params.password;
    promise = Parse.User.logIn(email, password);
  }
  else{
    var username = request.params.username;
    var authData = request.params.authData;
    return run.createUser({
      "username": username,
      "authData": authData
    });
  }
  promise = promise.then(function(user){
    if(user){
      role = user.get("role");
      var installationId = request.params.installationId;
      var deviceType = request.params.deviceType;
      if(installationId){
        return run.setInstallation({
          "user": user,
          "installationId": installationId,
          "deviceType": deviceType
        }).then(function(){
          return Parse.Promise.as(user);
        });
      }
    }
    return Parse.Promise.as(user);
  });
  promise = promise.then(function(user){
    if(user){
      return run.removeSessions({
        "user": user
      }).then(function(success){
        return run.createSession({
          "sessionToken": user._sessionToken
        });
      }).then(function(sessionToken){
        output["sessionToken"] = sessionToken;
        output["flag"] = true;
        return Parse.Promise.as(user);
      });
    }
    return Parse.Promise.as(user);
  });
  promise = promise.then(function(user){
    if(user){
      return run.setSession({
        "lat": request.params.lat,
        "long": request.params.long,
        "model": request.params.model,
        "os": request.params.os,
        "role": role,
        "user": user 
      });
    }
    return Parse.Promise.as();
  }).then(function(success){
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