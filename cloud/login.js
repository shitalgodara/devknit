/*
Function to genrate OTP 
  Input => 
    number: String // 10 digit phone no
  Output => 
    result: Bool // Success or error
  Description =>
    Process generates random code, save entry in new table and send code via sms
*/
exports.genCode = function(request, response) {
  var number = request.params.number;
  var code = Math.floor(Math.random() * 9000 + 1000);
  var Temp = Parse.Object.extend("Temp");
  var temp = new Temp();
  temp.save({
    phoneNumber: number,
    code: code
  }, {
    success: function(temp) {
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
          v: '1.0',
          format: 'text'
        },
        success: function(httpResponse) {
          console.log(httpResponse.text);
          response.success(true);
        },
        error: function(httpResponse) {
          console.error('Request failed with response code ' + httpResponse.status);
          response.error(httpResponse.text);
        }
      });
    },
    error: function(temp, error) {
      errormessage="Error: " + error.code + " " + error.message;
      response.error(errormessage);
    }
  }); 
}

/*
Function to verify OTP
  Input => 
    < Mobile Login Users >
      number: String // 10 digit phone no
      code: Number
    < Email Login Users >
      email: String
      password: String
      In case of signup extra parameters mentioned below are required too  
        Model: String // Model No. of mobile 
        OS: String // iOS, Android or any other
        name: String
        role: String // Parent or Teacher
  Output =>
    JSON object{ 
      flag: Bool // True if successfully signed in else false 
      sessionToken: String // session Token of user signed in
  Description =>
    Process check entry in new table with time constraint
*/
exports.verifyCode = function(request, response) {
  var email = request.params.email;
  if(typeof email != 'undefined'){
    var password = request.params.password;
    Parse.User.logIn(email,password ,{
      success: function(user) {
        console.log('loggedIn');
        var flag = true;
        var result = {
          "flag": flag,
          "sessionToken": user._sessionToken
        };
        response.success(result);
      },
      error: function(user, error) {
        console.log('failed loginp');
        errormessage = "Error: " + error.code + " " + error.message;
        console.log(errormessage);
        response.error("USER_DOES_NOT_EXISTS");
      }
    });
  }
  else{
    var number = request.params.number;
    var code = request.params.code;
    var d = new Date();
    var e = new Date(d.getTime()-300000);
    var Temp = Parse.Object.extend("Temp");
    var query = new Parse.Query(Temp); 
    query.equalTo("code", code);
    query.equalTo("phoneNumber", number);
    query.greaterThan("createdAt", e);
    query.find({
      success: function(results) {
        if(results.length > 0){
          console.log("found");
          var user = new Parse.User();
          var name = request.params.name;
          if(typeof name =='undefined'){
            console.log("login");
            Parse.User.logIn(number,number+"qwerty12345" ,{
              success: function(user) {
                console.log('loggedIn');
                var flag = true;
                var result = {
                  "flag": flag,
                  "sessionToken": user._sessionToken
                };
                response.success(result);
              },
              error: function(user, error) {
                console.log('failed login');
                errormessage="Error: " + error.code + " " + error.message;
                console.log(errormessage);
                response.error("USER_DOESNOT_EXISTS");
              }
            });
          }
          else{
            var user = new Parse.User();
            console.log("signup");

            user.set("username", number);
            user.set("password", number + "qwerty12345");
            user.set("MODEL", request.params.model );
            user.set("OS", request.params.os);
            user.set("name", request.params.name);
            user.set("phone", number);
            user.set("role", request.params.role);
            user.signUp(null,{
              success: function(user) {
                console.log("signed up");
                var flag = true;
                var result = {
                  "flag": flag,
                  "sessionToken": user._sessionToken
                };
                response.success(result);
              },
              error: function(user, error) {
                console.log('failed signup');
                errormessage = "Error: " + error.code + " " + error.message;
                response.error("USER_ALREADY_EXISTS");
              }
            });
          }
        }
        else{
          console.log("not found");
          var flag = false;
          var result = {
            "flag": flag,
            "sessionToken": ""
          };
          response.success(result);
        }
      },
      error: function(temp, error) {
        errormessage = "Error: " + error.code + " " + error.message;
        response.error(error);
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
    < Mobile Login Users >
      number: String // 10 digit phone no
      code: Number
    < Email Login Users >
      email: String
      password: String
      In case of signup extra parameters mentioned below are required too  
        Model: String // Model No. of mobile 
        OS: String // iOS, Android or any other
        name: String
        role: String // Parent or Teacher
  Output =>
    JSON object{ 
      flag: Bool // True if successfully signed in else false 
      sessionToken: String // session Token of user signed in
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
      response.error(error);
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
          });
        }
        else{
          user.set("username", number);
          user.set("password", number + "qwerty12345");
          user.set("MODEL", request.params.model);
          user.set("OS", request.params.os);
          user.set("name", request.params.name);
          user.set("phone", number);
          user.set("role", request.params.role);
          return user.signUp(null).then(function(user){
            console.log("SignUp successful !!");
            return generateRevocableSessionToken(user.getSessionToken());
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
    }, function(httpResponse){
      console.log(httpResponse.text);
      response.error(httpResponse.text);
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
  var deviceToken = request.params.deviceToken;
  var clarray1 = request.user.get("joined_groups");
  var clarray = [];
  var i;
  if(typeof clarray1 !='undefined'){
    for (i = 0; i < clarray1.length; i++) {
      clarray[i] = clarray1[i][0];  // Retreiving class codes of the joined groups 
    }
  }
  var Inst = Parse.Object.extend("_Installation");
  var inst = new Inst();
  inst.set("username",username);
  inst.set("installationId",installationId);
  inst.set("deviceType",deviceType);
  inst.set("deviceToken",deviceToken);
  inst.set("channels",clarray);

  console.log(clarray);
  inst.save(null, {
    success: function(result) {
      response.success(result.id);
    },
    error: function(result,error) {
      console.error(error.code + error.message);
      response.error(error.message+error.code);
    }
  });
}

/*
Function to logout from the app
  Input =>
    installationObjectId: String
  Output =>
    flag: Bool // true in case of success
  Description =>
    Procedure simple destroy query on installation table
*/
exports.appLogout = function(request, response) {
  var id = request.params.installationObjectId;
  var query = new Parse.Query(Parse.Installation);

  Parse.Cloud.useMasterKey();
  query.get(id, {
    success: function(result) {
      result.destroy({
        success: function(result) {
          var flag = true;
          response.success(flag);
        },
        error: function(result, error) {
          var errormessage =  "Error in::" + "installation::" + "destroy::" + error.code + "::" + error.message + "::";
          // Notify( eplatform , emodal , eusr , "giving Classes details" , echannel , errormessage);
          response.error(errormessage);
        }
      });
    },
    error: function(model, error) {
      if (error.code === Parse.Error.OBJECT_NOT_FOUND) { 
        var flag=true;
        response.success(flag);
      }
      else{
        var errormessage ="Error in::"+"installation::"+ "get::" + error.code + "::" + error.message+"::";
        //Notify( eplatform , emodal , eusr , "giving Classes details" , echannel , errormessage);
        response.error(errormessage);
      }
    }
  });
}