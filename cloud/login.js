/*
Function to genrate OTP 
  Input => 
    number: String // 10 digit phone no
  Output => 
    result: Bool // Success or error
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
  }, {
    success: function(temp){
      Parse.Cloud.httpRequest({
        url: 'http://enterprise.smsgupshup.com/GatewayAPI/rest',
        headers: {
          'Content-Type': 'application/json'
        },
        params: {
          method: 'sendMessage',
          send_to: number,
          msg: "Your requested verification code is " + code, 
          msg_type: 'Text',
          userid: '2000133095',
          auth_scheme: 'plain',
          password: 'wdq6tyUzP',
          v: '1.1',
          format: 'text'
        },
        success: function(httpResponse){
          var text = httpResponse.text;
          console.log(text);
          if(text.substr(0,3) == 'err')
            response.success(false);
          else
            response.success(true);
        },
        error: function(httpResponse){
          console.error('Request failed with response code ' + httpResponse.status);
          response.error(httpResponse.text);
        }
      });
    },
    error: function(temp, error){
      response.error(error.code + ": " + error.message);
    }
  }); 
}

/*
Function to verify OTP
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
        sessionToken: String // session Token of user signed in
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
exports.verifyCode = function(request, response) {
  var email = request.params.email;
  if(typeof email != 'undefined'){
    var password = request.params.password;
    Parse.User.logIn(email, password, {
      success: function(user){
      console.log("Login successful !!");        
      var flag = true;
        var result = {
          "flag": flag,
          "sessionToken": user._sessionToken
        };
        response.success(result);
      },
      error: function(user, error){
        console.log(error);
        if(error.code == 101)
          response.error("USER_DOESNOT_EXISTS");
        else
          response.error(error.code + ": " + error.message);
      }
    });
  }
  else{
    var number = request.params.number;
    var code = request.params.code;
    var d = new Date();
    var e = new Date(d.getTime() - 300000);
    var Temp = Parse.Object.extend("Temp");
    var query = new Parse.Query(Temp); 
    query.equalTo("code", code);
    query.equalTo("phoneNumber", number);
    query.greaterThan("createdAt", e);
    query.find({
      success: function(results) {
        if(results.length > 0){
          console.log("Found !!");
          var user = new Parse.User();
          var name = request.params.name;
          if(typeof name == 'undefined'){ 
            Parse.User.logIn(number, number + "qwerty12345", {
              success: function(user){
                console.log("Login successful !!");
                var flag = true;
                var result = {
                  "flag": flag,
                  "sessionToken": user._sessionToken
                };
                response.success(result);
              },
              error: function(user, error){
                console.log('Login failed !!');
                if(error.code == 101)
                  response.error("USER_DOESNOT_EXISTS");
                else
                  response.error(error.code + ": " + error.message);
              }
            });
          }
          else{
            var user = new Parse.User();
            user.set("username", number);
            user.set("password", number + "qwerty12345");
            user.set("name", request.params.name);
            user.set("phone", number);
            user.set("role", request.params.role);
            user.signUp(null,{
              success: function(user) {
                console.log("SignUp successful !!");
                var flag = true;
                var result = {
                  "flag": flag,
                  "sessionToken": user._sessionToken
                };
                response.success(result);
              },
              error: function(user, error){
                console.log('SignUp failed !!');
                if(error.code == 202)
                  response.error("USER_ALREADY_EXISTS");
                else
                  response.error(error.code + ": " + error.message);
              }
            });
          }
        }
        else{
          console.log("Not Found !!");
          var flag = false;
          var result = {
            "flag": flag,
            "sessionToken": ""
          };
          response.success(result);
        }
      },
      error: function(temp, error){
        console.log(error);
        response.error(error.code + ": " + error.message);
      }
    });
  } 
}

function generateRevocableSessionToken(sessionToken){
  return Parse.Cloud.httpRequest({
    method: "POST",
    url: "https://api.parse.com/1/upgradeToRevocableSession",
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
      'X-Parse-Application-Id': 'tTqAhR73SE4NWFhulYX4IjQSDH2TkuTblujAbvOK',
      'X-Parse-REST-API-Key': 'Rlfgv99tWRrpJDr484IkewPiQA7k2DRBQCzWjcC1', 
      'X-Parse-Session-Token': sessionToken
    }
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
exports.verifyCod = function(request, response) {
  var email = request.params.email;
  if(typeof email != 'undefined'){
    var password = request.params.password;
    Parse.User.logIn(email, password).then(function(user){
      console.log("Login successful !!");
      return generateRevocableSessionToken(user.getSessionToken());
    }).then(function(httpResponse){
        var flag = true;
        var result = {
          "flag": flag,
          "sessionToken": JSON.parse(httpResponse.text).sessionToken
        };
        response.success(result);
    }, function(error){
      console.log(error);
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
    var Temp = Parse.Object.extend("Temp");
    var query = new Parse.Query(Temp); 
    query.equalTo("code", code);
    query.equalTo("phoneNumber", number);
    query.greaterThan("createdAt", e);
    query.find().then(function(results){
      if(results.length > 0){
        console.log("Found !!");
        var user = new Parse.User();
        var name = request.params.name;
        if(typeof name == 'undefined'){
          return Parse.User.logIn(number, number + "qwerty12345").then(function(user){
            console.log("Login successful !!");
            return generateRevocableSessionToken(user.getSessionToken());
          }, function(error){
            var promise;
            if(error.code == 101)
                promise = Parse.Promise.error("USER_DOESNOT_EXISTS");
              else
                promise = Parse.Promise.error(error.code + ": " + error.message);
            return promise;
          });
        }
        else{
          user.set("username", number);
          user.set("password", number + "qwerty12345");
          user.set("name", request.params.name);
          user.set("phone", number);
          user.set("role", request.params.role);
          return user.signUp(null).then(function(user){
            console.log("SignUp successful !!");
            return generateRevocableSessionToken(user.getSessionToken());
          }, function(error){
            var promise;
            if(error.code == 202)
                promise = Parse.Promise.error("USER_ALREADY_EXISTS");
              else
                promise = Parse.Promise.error(error.code + ": " + error.message);
            return promise;
          });
        }
      }
      else{
        console.log("Not Found !!");
        var promise = Parse.Promise.as("");
        return promise;
      }
    }).then(function(httpResponse){
        var flag = false;
        var sessionToken = "";
        if(httpResponse != ""){
          flag = true;
          sessionToken = JSON.parse(httpResponse.text).sessionToken
        }
        var result = {
          "flag": flag,
          "sessionToken": sessionToken
        };
        response.success(result);
    }, function(error){
      console.log(error);
      response.error(error.code + ": " + error.message);
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
exports.appInstallation = function(request, response) {
  var username = request.user.get("username");
  var installationId = request.params.installationId;
  var deviceType = request.params.deviceType;
  var clarray1 = request.user.get("joined_groups");
  var clarray = [];
  var i;
  if(typeof clarray1 !='undefined'){
    for (i = 0; i < clarray1.length; i++) {
      clarray[i] = clarray1[i][0];  // Retreiving class codes of the joined groups 
    }
  }
  var query = new Parse.Query(Parse.Installation);
  query.equalTo("installationId", installationId);
  query.find().then(function(results){
    if(results.length > 0){
      inst = results[0];
    }
    else{
      var Inst = Parse.Object.extend("_Installation");
      var inst = new Inst();
    }
    inst.set("username", username);
    inst.set("installationId", installationId);
    inst.set("deviceType", deviceType);
    inst.set("channels", clarray);
    return inst.save(null);
  }).then(function(result){
    response.success(result.id);
  }, function(error){
    console.log(error.message);
    response.error(error);
  });
}

/*
Function to logout from the app
  Input =>
    installationObjectId: String
  Output =>
    flag: Bool // true in case of success
  Description =>
    Procedure simple clear entry of channels on installation table
*/
exports.appLogout = function(request, response) {
  var id = request.params.installationObjectId;
  Parse.Cloud.useMasterKey();
  var query = new Parse.Query(Parse.Installation);
  query.get(id).then(function(obj){
    obj.set("channels", []);
    return obj.save(null);
  }).then(function(result){
    response.success(true);
  }, function(error){
    response.error(error);
  });
}