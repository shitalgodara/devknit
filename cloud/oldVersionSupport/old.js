var run = require('cloud/run.js');

/*
Function for creating class  
  Input =>
    user: Parse User
    classname: String
  Output =>
    codegroup: Parse object
  Procedure =>
    * Username is taken from Parse User 
    * Class code is created and class name is modified
    * Added user in Created_groups
    * check first already created or not in client side also remove space in names of class
    procedure first create code ,then add in user created_groups,then in codegroup entry
*/
exports.createClass = function(request, response){
  var echannel;
  var eplatform = request.user.get("OS");
  var emodal = request.user.get("MODAL");
  var eusr = request.user.get("name");
  if((eplatform == 'IOS') || (eplatform == 'ANDROID') || (eplatform == 'WEB'))
    echannel = eplatform;
  else
    echannel = 'UNKNOWN';
  var classname = request.params.classname;
  classname = classname.toUpperCase();
  
  var name = request.user.get("name");
  name = name.split(" ");
  if(name.length > 1)
    name = name[1];
  else
    name = name[0];
  name = name.substr(0,3);
  name = name.replace(/\W/g, ''); // removing non-alphanumeric characters
  name = name.toUpperCase();
  if(name[0] >= 0) // In case first character of name is number
    name = 'Y' + name.substr(1);
  if(name.length != 3){
    if(name.length == 2)
      name = "Z" + name;
    if(name.length == 1)
      name = "ZY" + name;
    if(name.length == 0)
      name = "ZZZ";
  }
  var num = Math.floor(Math.random() * 10000);
  num = num.toString();
  if(num.length == 3)
    num = "0" + num;
  else if(num.length == 2)
    num = "00" + num;
  else if(num.length == 1)
    num = "000" + num;
  else if(num.length == 5)
    num = num.substr(0,4);

  name = name + num;
  var classcode = name;
  classname = classname.toUpperCase();
  classname = classname.replace(/[''""]/g, ' ');
  var user = request.user;
  var clarray = user.get("Created_groups");
  var currentname = user.get("name");
  var username = user.get("username");
  var pid = user.get("pid");
  var sex = user.get("sex");
  console.log(classname);
  console.log(classcode);
  var array = [classcode, classname];
  user.addUnique("Created_groups", array);
  user.save(null, {
    success: function(user){
      console.log(user.id);
      var Codegroup = Parse.Object.extend("Codegroup");
      var codegroup = new Codegroup();
      codegroup.save({
        name: classname,
        code: classcode,
        Creator: currentname,
        classExist: true,
        senderId: username,
        senderPic: pid,
				sex: sex
      },{
        success: function(codegroup){
          console.log(codegroup.get("senderId"));
          console.log(codegroup.get("Creator"));
          response.success(codegroup);
        },
        error: function(codegroup, error){
          var errormessage = "Error in::" + "codegroup::" + "save::" + error.code + "::" + error.message + "::";
          Notify(eplatform, emodal, eusr, "createClass", echannel, errormessage);
          response.error(errormessage);
        }
      });
		},
		error: function(user, error){
      var errormessage = "Error in::" + "user::" + "save::" + error.code + "::" + error.message + "::";
      Notify(eplatform, emodal, eusr, "createClass", echannel, errormessage);
      response.error(errormessage);
    }
  });
}

/*
Function to delete user's created class
  Input =>
    classcode: String 
  Output =>
    flag: Bool // true in case of successful deletion otherwise error 
  Procedure =>
    * Deleted class entry in Created_groups 
    * Made classExist entry of Codegroup class false,
    * Entry saved for groupdetail for delete class message 
    * Finally send delete message to all members of group
*/
exports.deleteClass = function(request, response){
  var echannel;
  var eplatform = request.user.get("OS");
  var emodal = request.user.get("MODAL");
  var eusr = request.user.get("name");
  if((eplatform == 'IOS') || (eplatform == 'ANDROID') || (eplatform == 'WEB'))
    echannel = eplatform;
  else
    echannel = 'UNKNOWN';
  var clcode = request.params.classcode;
  var user = request.user;
  var classname;
  var clarray = user.get("Created_groups");
  for (var i = 0; i < clarray.length; i++){
    if (clarray[i][0] == clcode){
      classname = clarray[i][1];
      clarray.splice(i, 1);
      break;
    }
  }
  console.log(clarray);
  console.log(clcode);
  user.set("Created_groups", clarray);
  user.save(null, {
    success: function(user){
      console.log(user.id);
      console.log(user.get("Created_groups"));
      var Codegroup = Parse.Object.extend("Codegroup");
      var query = new Parse.Query(Codegroup);
      query.equalTo("code", clcode);
      query.first({
        success: function(object){
          console.log(object.id);
          object.set("classExist", false);
          object.save({
            success: function(object){
              console.log(object.id);
              var name = request.user.get("name");
              var username = request.user.get("username");
              var message = "Your Teacher " + name + " has deleted his " + classname;
              var GroupDetails = Parse.Object.extend("GroupDetails");
              var groupdetails = new GroupDetails();
              groupdetails.save({
                Creator: name, 
                name: classname,
                title: message,
                senderId: username,
                code: clcode
              },{
                success: function(obj){
                  console.log(obj.id);
                  console.log(obj.get("title"));
                  Parse.Push.send({
                    channels: [clcode],
                    data: {
                      msg: message,
  			              alert: message,
  			              badge: "Increment",
                      groupName: classname,
  			              type: "NORMAL",
  			              action: "INBOX"
                    }
                  },{
                    success: function(){
    			            var flag = true;
                      console.log(flag);
    	                response.success(flag);
                    },
                    error: function(error){
                      var errormessage = "Error in::" + "push::" + "send::" + error.code + "::" + error.message + "::";
                      Notify(eplatform, emodal, eusr, "deleteClass", echannel, errormessage);
                      response.error(errormessage);
                    }
                  });
                },
                error: function(obj,error){
                  var errormessage = "Error in::" + "groupdetail::" + "save::" + error.code + "::" + error.message + "::";
                  Notify(eplatform, emodal, eusr, "deleteClass", echannel, errormessage);
                  response.error(errormessage);
                }
              });
            },
            error: function(object, error){
              var errormessage = "Error in::" + "codegroup::" + "save::" + error.code + "::" + error.message + "::";
              Notify(eplatform, emodal, eusr, "deleteClass", echannel, errormessage);
              response.error(errormessage);
            }
          });
        },
        error: function(error){
          var errormessage = "Error in::" + "codegroup::" + "first::" + error.code + "::" + error.message + "::";
          Notify(eplatform, emodal, eusr, "deleteClass", echannel, errormessage);
          response.error(errormessage);
        }
      });
    },
    error: function(user, error){
      var errormessage = "Error in::" + "user::" + "save::" + error.code + "::" + error.message + "::";
      Notify(eplatform, emodal, eusr, "deleteClass", echannel, errormessage);
      response.error(errormessage);    
    }
  });
}

/*
Function for user to leave a class 
  Input =>
    classcode: String
    installationObjectId: String
  Output =>
    flag: Bool true or error
  Procedure =>
    * Changed entry in joined group
    * Clear classcode from channels entry in Installation class 
    * Set status entry to LEAVE in Groupmember class
*/
exports.leaveClass = function(request, response){
  var echannel;
  var eplatform = request.user.get("OS");
  var emodal = request.user.get("MODAL");
  var eusr = request.user.get("name");
  if((eplatform == 'IOS') || (eplatform == 'ANDROID') || (eplatform == 'WEB'))
    echannel = eplatform;
  else
    echannel = 'UNKNOWN';

  Parse.Cloud.useMasterKey();
  var clcode = request.params.classcode;
  var ID = request.params.installationObjectId;
  console.log(clcode);
  console.log(ID);
  var user = request.user;
  var clarray = request.user.get("joined_groups");
  console.log(clarray);
  for (var i = 0; i < clarray.length; i++){
    if (clarray[i][0] == clcode){
      clarray.splice(i, 1);
      break;
    }
  }
  console.log(clarray);
  user.set("joined_groups", clarray);
  user.save(null, {
    success: function(user){
      console.log(user.id);
      var GroupMembers = Parse.Object.extend("GroupMembers");
      var query = new Parse.Query(GroupMembers);
      query.equalTo("code", clcode);
      query.equalTo("emailId", user.get("username"));
      query.notEqualTo("status", "LEAVE");
      query.notEqualTo("status", "REMOVED");
      query.first({
        success: function(object){
          console.log(object.id);
          object.set("status", "LEAVE");
          object.save({
            success: function(object){
              console.log(object.id);
              var query = new Parse.Query(Parse.Installation);
              console.log(ID);
              query.get(ID, {
                success: function(object){
                  console.log(object.id);
                  object.remove("channels", clcode);  
                  object.save(null, {
                    success: function(object){
                      console.log(object.id);
                      var flag = true;
                      console.log(flag);
                      response.success(flag);
                    },
                    error: function(object, error){
                      var errormessage = "Error in::" + "installation::" + "save::" + error.code + "::" + error.message + "::";
                      Notify(eplatform, emodal, eusr, "leaveClass", echannel, errormessage);
                      response.error(errormessage);
                    }
                  });          
                },
                error: function(object, error){    
                  var errormessage = "Error in::" + "installation::" + "get::" + error.code + "::" + error.message + "::";
                  Notify(eplatform, emodal, eusr, "leaveClass", echannel, errormessage);
                  response.error(errormessage);
                }
              });
            },
            error: function(object,error){
              var errormessage = "Error in::" + "groupmembers::" + "save::" + error.code + "::" + error.message + "::";
              Notify(eplatform, emodal, eusr, "leaveClass", echannel, errormessage);
              response.error(errormessage);
            }
          });
        },
        error: function(error){
          var errormessage = "Error in::" + "groupmembers::" + "first::" + error.code + "::" + error.message + "::";
          Notify(eplatform, emodal, eusr, "leaveClass", echannel, errormessage);
          response.error(errormessage);
        }
      });
    },
    error: function(object,error){
      var errormessage = "Error in::" + "user::" + "save::" + error.code + "::" + error.message + "::";
      Notify(eplatform, emodal, eusr, "leaveClass", echannel, errormessage);
      response.error(errormessage); 
    }
  });
}

/*
Function to join a class 
  Input =>
    classCode: String
    associateName: String
    installationObjectId: String
  Output =>
    json object codegroup(as codegroup) entry related to that user and 5 message (as messages) of groupdetail table
  Procedure =>
    * Checked the existence of class code 
    * Added in user joined_groups 
    * Added entry in GroupMembers  
    * Added installation of currentuser 
    * Finally showing atmost 5 messages from the last 5 days 
*/
exports.joinClass = function(request, response){
  var echannel;
  var eplatform = request.user.get("OS");
  var emodal = request.user.get("MODAL");
  var eusr = request.user.get("name");
  if((eplatform == 'IOS') || (eplatform == 'ANDROID') || (eplatform == 'WEB'))
    echannel = eplatform;
  else
    echannel = 'UNKNOWN';
  var classcode = request.params.classCode;
  var child = request.params.associateName;
  var childnam = [child];
  classcode = classcode.toUpperCase();
  var Codegroup = Parse.Object.extend("Codegroup");
  var query = new Parse.Query("Codegroup");
  query.equalTo("code", classcode);
  query.first({
    success: function(result){
      if (result){
        var classname = result.get('name');
        var clarray = request.user.get("Created_groups");
        var currentname = request.user.get("name");
        var email = request.user.get("email");
        var array = [classcode, classname, child];
        request.user.addUnique("joined_groups", array);
        request.user.save(null, {
          success: function(user){
            var GroupMembers = Parse.Object.extend("GroupMembers");
            var groupmembers = new GroupMembers();
            groupmembers.set("name", user.get("name"));
            groupmembers.set("code", classcode);
            groupmembers.set("children_names", childnam);
            groupmembers.set("emailId", user.get("username"));
            groupmembers.save(null, {
              success: function(groupmembers){
                var installId = request.params.installationObjectId;
                var query = new Parse.Query(Parse.Installation);
                query.get(installId, {
                  success: function(object){
                    object.addUnique("channels", classcode);
                    object.save({
                      success: function(object){
                        var GroupDetails = Parse.Object.extend("GroupDetails");
                        var query = new Parse.Query("GroupDetails");
                        query.equalTo("code", classcode);
                        var d = new Date();
                        var e = new Date(d.getTime() - 432000000);
                        query.greaterThan("createdAt", e);
                        query.descending("createdAt");
                        query.limit(5);
                        query.find({
                          success: function(results){
                            var output = {
                              "codegroup": result,
                              "messages": results
                            };
                            response.success(output);
                          },
                          error: function(error){
                            response.error("Error: " + error.code + " " + error.message);
                          }
                        });
                      },
                      error: function(object, error){
                        response.error("Error: " + error.code + " " + error.message);
                      }
                    });
                  },
                  error: function(object,error){
                    if(error.code == 101)
                      response.error("INSTALLATION_NOT_CREATED");
                    else
                      response.error("Error: " + error.code + " " + error.message);
                  }
                });
              },
              error: function(groupmembers, error){
                response.error("Error: " + error.code + " " + error.message);
              }
            });
          },
          error: function(error){
            response.error("interputed in user save");
          }
        });
      } 
      else{
        response.error("No such class exits");
      }
    },
    error: function(error){
      response.error("Error: " + error.code + " " + error.message);
    }
  });  
}

/*
Function to change assoicate name of joined class
  Input =>
    classCode: String
    childName: String
  Output =>
    flag: bool //true in case of success
  Procedure =>
    Changed entry in GroupMembers and in users joined_groups
*/
exports.changeAssociateName = function(request, response){
  var classcode = request.params.classCode;
  var newchild = request.params.childName;
  var child = [newchild];
  var emailId = request.user.get("username");
  classcode = classcode.toUpperCase();
  var GroupMembers = Parse.Object.extend("GroupMembers");
  var query = new Parse.Query("GroupMembers");
  query.equalTo("emailId", emailId);
  query.equalTo("code", classcode);
  query.notEqualTo("status", "REMOVED");
  query.notEqualTo("status", "LEAVE");
  query.first({
    success: function(object){
      object.set("children_names",child);
      object.save({
        success: function(object){
          var user = request.user;
          var classname = "";
          var clarray = user.get("joined_groups");
          for(var i = 0; i < clarray.length; i++){
            if(clarray[i][0] == classcode){
              classname = clarray[i][1];
              clarray.splice(i, 1);
              break;
            }
          }
          var clelement = [classcode,classname,newchild];
          clarray.push(clelement);
          user.set("joined_groups", clarray);
          user.save(null, {
            success: function(user){
              var flag = true;
              response.success(flag);
            },
            error: function(object, error){
              response.error("Error: " + error.code + " " + error.message);
            }
          });
        },
        error: function(object, error){
          response.error("Error: " + error.code + " " + error.message);
        }
      });
    },
    error: function(error){
      response.error("Error: " + error.code + " " + error.message);
    }
  });  
}
/*
Function to send sms
  Input =>
    msg: String
    numberList: String // numbers of the recipient separated by commas
  Output =>
    httpResponse: Parse.Promise
  Procedure =>
    Sending a HTTPRequest to smsgupshup API
*/
smsText = function(request){
  var msg = request.msg;
  var numberList = request.numberList;
  numberList = numberList.join();
  var response = new Parse.Promise();
  return Parse.Cloud.httpRequest({
    url: 'http://enterprise.smsgupshup.com/GatewayAPI/rest',
    headers: {
      'Content-Type': 'application/json'
    },
    params: {
      method: 'sendMessage',
      send_to: numberList,
      msg: msg,
      msg_type: 'Text',
      userid: '2000133095',
      auth_scheme: 'plain',
      password: 'wdq6tyUzP',
      v: '1.1',
      format: 'text'
    }
  }).then(function(httpResponse){
    return Parse.Promise.as(httpResponse.text);
  }, function(httpResponse){
    console.error(httpResponse.data);
    var error = {
      "code": httpResponse.data.code,
      "message": httpResponse.data.error
    };
    return Parse.Promise.error(error);
  });
}

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
  }, {
    success: function(temp){
      var msg = "Your requested verification code is " + code;
      var numbers=[number];
      smsText({
        "msg": msg,
        "numberList": numbers
      }).then(function(text){
        if(text.substr(0,3) == 'err')
          response.success(false);
        else
          response.success(true);
      },
      function(httpResponse){
        response.error(httpResponse.code+":"+httpResponse.message);
      });
    },
    error: function(temp, error){
      response.error(error.code + ": " + error.message);
    }
  }); 
}