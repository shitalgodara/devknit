
function Notify(a,b,c,d,f,g){
var operationinfo=" For operation "+ d +"step with error message ";
var message="Operation failed in "+a+" "+b+" for user "+c+operationinfo+g;
Parse.Push.send({
  channels:["ios"],
  data: {                        msg: message,
			alert:message,
                        groupName: f,
			type:"NORMAL",
			action:"INBOX"        
}, 
                success: function() {
console.log('Notified the error');
//callback.success(true);
                },
                error: function(error) {
console.warn("Failed to Notified");
//callback.error(false);
                }
            });
}

/*
function for class creating 
input classname
output codegroup parse object
taking username from user itself no need to provide that
check first already created or not in client side also remove space in names of class
procedure first create code ,then add in user created_groups,then in codegroup entry
*/
exports.createClass = function(request, response) {
var echannel;
var eplatform=request.user.get("OS");var emodal=request.user.get("MODAL");var eusr=request.user.get("name");
if((eplatform=='IOS')||(eplatform=='ANDROID')||(eplatform=='WEB')){echannel=eplatform;}
else{echannel='UNKNOWN';}


    var classname = request.params.classname;
    classname=classname.toUpperCase();
var name=request.user.get("name");
name =name.split(" ");
if(name.length>1){name=name[1];
}
else{name=name[0];}
name=name.substr(0,3);
name=name.toUpperCase();
if(name[0]>=0){name="Y"+name;}
if(name.length!=3){
if(name.length==2){name="Z"+name;}
if(name.length==1){name="ZY"+name;}
if(name.length==0){name="ZZZ";}
}
var num = Math.floor(Math.random() * 10000);
num=num.toString();
if(num.length==3){num="0"+num;}
else if(num.length==2){num="00"+num;}
else if(num.length==1){num="000"+num;}
else if(num.length==5){num=num.substr(0,4);}
name=name+num;
                    var classcode = name;
                    classname = classname.toUpperCase();
                    classname = classname.replace(/[''""]/g, ' ');
                    var user = request.user;
                    var clarray = user.get("Created_groups");
                    var currentname = user.get("name");
                    var email = user.get("username");
                    var pid = user.get("pid");
console.log(classname);
console.log(classcode);
                    var array = [classcode, classname];
                    user.addUnique("Created_groups", array);
                    user.save(null, {
                        success: function(user) {
console.log(user.id);
                            var Codegroup = Parse.Object.extend("Codegroup");
                            var codegroup = new Codegroup();
                            codegroup.save({
                                name: classname,
                                code: classcode,
                                Creator: currentname,
                                classExist: true,
                                senderId: email,
                                senderPic: pid,
				sex:user.get("sex")
                            }, {
                                success: function(codegroup) {
console.log(codegroup.get("senderId"));
console.log(codegroup.get("Creator"));
                                    response.success(codegroup);
                                },
                                error: function(codegroup, error) {
  var errormessage ="Error in::"+"codegroup::" + "save::"+error.code + "::" + error.message+"::";
 Notify( eplatform , emodal , eusr , "createClass" , echannel , errormessage);
response.error(errormessage);
                                }
                            });
				},
				error: function(user, error) {
  var errormessage="Error in::" +"user::"+ "save::"+ error.code + "::" + error.message+"::";
 Notify( eplatform , emodal , eusr , "createClass" , echannel , errormessage);
response.error(errormessage);
                                }
                            });
}
/*
function to delete user's created class
input classcode of class
output bool true or error 
users created group entry change and save ,then codegroup class exist false,enry saved for groupdetail for del class message ,then send psuh to all
*/
exports.deleteClass = function(request, response) {
var echannel;
var eplatform=request.user.get("OS");var emodal=request.user.get("MODAL");var eusr=request.user.get("name");
if((eplatform=='IOS')||(eplatform=='ANDROID')||(eplatform=='WEB')){echannel=eplatform;}
else{echannel='UNKNOWN';}
    var clcode = request.params.classcode;
    var user = request.user;
    var classname;
  var clarray = user.get("Created_groups");
    for (var i = 0; i < clarray.length; i++) {
        if (clarray[i][0] == clcode) {
classname=clarray[i][1];
            clarray.splice(i, 1);
        break;
        }
    }
console.log(clarray);
console.log(clcode);
            user.set("Created_groups", clarray);
            user.save(null, {
                success: function(user) {
console.log(user.id);
console.log(user.get("Created_groups"));
                    var Codegroup = Parse.Object.extend("Codegroup");
                    var query = new Parse.Query(Codegroup);
                    query.equalTo("code", clcode);
                    query.first({
                        success: function(object) {
console.log(object.id);
                            object.set("classExist", false);
                            object.save({
                                success: function(object) {
console.log(object.id);
    var name = request.user.get("name");
    var username = request.user.get("username");
    var message = "Your Teacher "+name+" has deleted his "+classname;
   var GroupDetails = Parse.Object.extend("GroupDetails");
    var groupdetails = new GroupDetails();
    groupdetails.save({Creator: name,name: classname,title: message,senderId: username,code: clcode}, {
        success: function(obj) {
console.log(obj.id);
console.log(obj.get("title"));
            Parse.Push.send({
                channels: [clcode],
                data: {
                        msg: message,
			alert:message,
			badge: "Increment",
                        groupName: classname,
			type:"NORMAL",
			action:"INBOX"
                }
            }, {
                success: function() {
			var flag=true;
console.log(flag);
	                    response.success(flag);
                },
                error: function(error) {
var errormessage ="Error in::"+"push::"+ "send::" + error.code + "::" + error.message+"::";
 Notify( eplatform , emodal , eusr , "deleteClass" , echannel , errormessage);
response.error(errormessage);
                }
            });
 },
                error: function(obj,error) {
var errormessage ="Error in::"+"groupdetail::"+ "save::" + error.code + "::" + error.message+"::";
 Notify( eplatform , emodal , eusr , "deleteClass" , echannel , errormessage);
response.error(errormessage);
                }
            });
                     },
                                error: function(object, error) {
var errormessage ="Error in::"+"codegroup::" + "save::"+ error.code + "::" + error.message+"::";
 Notify( eplatform , emodal , eusr , "deleteClass" , echannel , errormessage);
response.error(errormessage);
                                }
                            });
                        },
                        error: function(error) {
var errormessage ="Error in::"+"codegroup::"+ "first::" + error.code + "::" + error.message+"::";
 Notify( eplatform , emodal , eusr , "deleteClass", echannel , errormessage);
response.error(errormessage);
                        }
                    });
                },
                error: function(user,error) {
var errormessage ="Error in::"+"user::" + "save::"+ error.code + "::" + error.message+"::";
 Notify( eplatform , emodal , eusr , "deleteClass" , echannel , errormessage);
response.error(errormessage);    
                }
            });
}

/*
function for returning list of classes as a suggest for parent to join
input array named 'input' of json object whose elements are school ,standard,divison and date (latest date of suggested codegroup created date)
output codegroup entries of suggested classes 
use of compound query on codegroup to compute suggestion whose class exits and removed groups that are already joined/created or removed
*/
exports.suggestClasses = function(request, response) {
var echannel;
var eplatform=request.user.get("OS");var emodal=request.user.get("MODAL");var eusr=request.user.get("name");
if((eplatform=='IOS')||(eplatform=='ANDROID')||(eplatform=='WEB')){echannel=eplatform;}
else{echannel='UNKNOWN';}
var groups=request.params.input;
var date=request.params.date;
if(groups.length==0){response.success([]);}
else{
var Codegroup = Parse.Object.extend("Codegroup");
var data=groups[0];
//#*#console.log(data.school);
//#*#console.log(data.standard);
//#*#console.log(data.division);
//#*#console.log(date);
    var query1 = new Parse.Query("Codegroup");
    query1.equalTo("school", data.school);
    query1.equalTo("standard", data.standard);
if(data.division!='NA'){query1.equalTo("divison", data.division);}
for(var i=1;i<groups.length;i++){
data=groups[i];
//#*#console.log(data.school);
//#*#console.log(data.standard);
//#*#console.log(data.division);
    var query2 = new Parse.Query("Codegroup");
    query2.equalTo("school", data.school);
    query2.equalTo("standard", data.standard);
if(data.division!='NA'){query2.equalTo("divison", data.division);}
    query1 = Parse.Query.or(query1, query2);
}
var clarray1 = request.user.get("joined_groups");
var clarray2 = request.user.get("Created_groups");
var clarray3 = request.user.get("removed_groups");
var clarray=[];
var i;
if(typeof clarray1 !='undefined'){
  for ( i = 0; i < clarray1.length; i++) {
clarray[i]=clarray1[i][0];
}
}
if(typeof clarray2 !='undefined'){
  for (var j = 0; j < clarray2.length; j++) {
clarray[i]=clarray2[j][0];
i++;
}
}
if(typeof clarray3 !='undefined'){
  for (var k = 0; k < clarray3.length; k++) {
clarray[i]=clarray3[k][0];
i++;
}
}
//#*#console.log(date);
//#*#console.log(clarray);
query1.greaterThan("updatedAt",date);
query1.notContainedIn("code",clarray);
    query1.find({
        success: function(results) {
//#*#console.log(results.length);
//#*#console.log(results[length/2)].id;

            response.success(results);
        },
        error: function(error) {
var errormessage="Error: " + error.code + " " + error.message;
 Notify( eplatform , emodal , eusr , "suggestClass"," finding entries of codegroup" , echannel , errormessage);
response.error(errormessage);    
        }
    });
}
}   
/* 
function to return all details related to joined or created classes through codegroup table
input nothing
output codegroup entries
simple query on user created and joined group then on codegroup table
*/
exports.giveClassesDetails = function(request, response) {
var echannel;
var eplatform=request.user.get("OS");var emodal=request.user.get("MODAL");var eusr=request.user.get("name");
if((eplatform=='IOS')||(eplatform=='ANDROID')||(eplatform=='WEB')){echannel=eplatform;}
else{echannel='UNKNOWN';}
    var clarray1 = request.user.get("joined_groups");
  var clarray2 = request.user.get("Created_groups");
if((typeof clarray1 =='undefined')&&(typeof clarray2 =='undefined')){resonse.success([]);}
else{
var clarray=[];
var i;
if(typeof clarray1 !='undefined'){
  for ( i = 0; i < clarray1.length; i++) {
clarray[i]=clarray1[i][0];
}
}
if(typeof clarray2 !='undefined'){
  for (var j = 0; j < clarray2.length; j++) {
clarray[i]=clarray2[j][0];
i++;
}
}
console.log(clarray);
    var Codegroup = Parse.Object.extend("Codegroup");
    var query = new Parse.Query("Codegroup");
    query.containedIn("code", clarray);
    query.find({
        success: function(results) {
if(results.length>0){
console.log(results.length);
//console.log(results[(results.length)/2].id);
}
            response.success(results);
        },
        error: function(error) {
var errormessage ="Error in::"+"codegroup::"+ "find::" + error.code + "::" + error.message+"::";
 Notify( eplatform , emodal , eusr , "giving Classes details" , echannel , errormessage);
response.error(errormessage);    
        }
    });
}
}
/*
function to remove member from any joined class and send him notification regarding that
input classname ,classcode and emailId field from groupmember in case of app user and in case of sms user input  number instead of emailId and usertype string app/sms
output bool true
 if usertype is app then in groupmember using emailId and classcode set status REMOVED ,and change entry in joined group and all instalaltion
and send push notificaion(using target push)
for sms user using classcode and number set status and send message saying removed
*/
exports.removeMember = function(request, response) {
var echannel;
var eplatform=request.user.get("OS");var emodal=request.user.get("MODAL");var eusr=request.user.get("name");
if((eplatform=='IOS')||(eplatform=='ANDROID')||(eplatform=='WEB')){echannel=eplatform;}
else{echannel='UNKNOWN';}
Parse.Cloud.useMasterKey();
var classname = request.params.classname;
    var clcode = request.params.classcode;
var usertype=request.params.usertype;
console.log(classname);
console.log(clcode);
console.log(usertype);
if(usertype=='app'){
 var username=request.params.emailId;
console.log(username);
var GroupMembers= Parse.Object.extend("GroupMembers");
                var query = new Parse.Query(GroupMembers);
		query.equalTo("code", clcode);
		query.equalTo("emailId", username);

query.notEqualTo("status", "REMOVED");
query.notEqualTo("status", "LEAVE");
		query.first({
                        success: function(object) {
console.log(object.id);
                            object.set("status", "REMOVED");
                            object.save({
                                success: function(object) {
console.log(object.id);
 var query = new Parse.Query(Parse.User);
query.equalTo("username", username);
query.first({
                        success: function(object) {
console.log(object.id);
var clarray = object.get("joined_groups");
console.log(classname);
    for (var i = 0; i < clarray.length; i++) {
        if (clarray[i][0] == clcode) {
            clarray.splice(i, 1);
        break;
        }
    }
console.log(clarray);
            object.set("joined_groups", clarray);
            object.save(null, {
                success: function(user) {
console.log(user.id);
var query = new Parse.Query(Parse.Installation);
query.equalTo("username",username);
query.find({
        success: function(results) {
console.log(results.length);
//console.log(results[(results.length)/2].id);
var allObjects = [];
for (var i = 0; i <results.length; i++) { 
results[i].remove("channels",clcode);
allObjects.push(results[i]);
}
Parse.Object.saveAll(allObjects, {
        success: function(objs) {
var query = new Parse.Query(Parse.Installation);
query.equalTo('username', username);
query.ascending("updatedAt");
query.limit(1);
 
var message="You have been removed from "+classname +" class,You won't receive any notification from this class from now onwards";
Parse.Push.send({
  where: query,
  data: {                        msg: message,
			alert:message,
			badge: "Increment",
                        groupName: classname,
			groupCode: clcode,
			type:"REMOVE",
			action:"INBOX"        
  }
}, {
  success: function() {
console.log(message);
var flag=true;
console.log(flag);
response.success(flag);
  },
  error: function(error) {
var flag=false;response.error(flag);
  }
});
        },
        error: function(error) { 
 response.error("Error: " + error.code + " " + error.message);
        }
    });
 },
                error: function( error) {
                    response.error("Error: " + error.code + " " + error.message);
                }
            });   
 },
                error: function(user, error) {
                    response.error("Error: " + error.code + " " + error.message);
                }
            });  
},
                error: function(object, error) {
                    response.error("Error: " + error.code + " " + error.message);
                }
            });   
           },
                error: function(object, error) {
                    response.error("Error: " + error.code + " " + error.message);
                }
            });                      
  },
                error: function(object, error) {
                    response.error("Error: " + error.code + " " + error.message);
                }
            });          
}
else{
var number=request.params.number;
//#*#console.log(number);
var Messageneeders = Parse.Object.extend("Messageneeders");
        var query = new Parse.Query(Messageneeders);
        query.equalTo("cod", clcode);
        query.equalTo("number", number);
        query.first({
            success: function(myObject) {
                if (myObject) {
//#*#console.log(myObject.id);
		    myObject.set("status","REMOVED");
                    myObject.save({
                        success: function(myObject) {
//#*#console.log(myObject.id);
                                Parse.Cloud.httpRequest({
                                url: 'http://enterprise.smsgupshup.com/GatewayAPI/rest',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                params: {
                                    method: 'sendMessage',
                                    send_to:number,
                                    msg: "You have been removed from your teachers "+  classname+" class,Now you will not recieve any message from your Teacher",
                                    msg_type: 'Text',
                                    userid: '2000133095',
                                    auth_scheme: 'plain',
                                    password: 'wdq6tyUzP',
                                    v: '1.0',
                                    format: 'text'
                                },
                                success: function(httpResponse) {
                                    var flag=true;
//#*#console.log(flag);
//#*#console.log(number);
response.success(flag);
                                },
                                error: function(httpResponse) {
                                    response.error("Error: " + error.code + " " + error.message);
                                }
                            });
                        },
                        error: function(myObject, error) {
response.error("Error: " + error.code + " " + error.message);
                        }
                    });
                } 
            },
            error: function(error) {
                response.error("Error: " + error.code + " " + error.message);
            }
        });
}                       
}

/*
function for user to leave a class he has joined
input classcode and installationObjectId
output bool true or error
change joined groups and remove from channels and groupmember set status LEAVE
*/
exports.leaveClass = function(request, response) {
var echannel;
var eplatform=request.user.get("OS");var emodal=request.user.get("MODAL");var eusr=request.user.get("name");
if((eplatform=='IOS')||(eplatform=='ANDROID')||(eplatform=='WEB')){echannel=eplatform;}
else{echannel='UNKNOWN';}

Parse.Cloud.useMasterKey();
    var clcode = request.params.classcode;
    var ID = request.params.installationObjectId;
console.log(clcode);
console.log(ID);
    var user = request.user;
  var clarray = request.user.get("joined_groups");
console.log(clarray);
    for (var i = 0; i < clarray.length; i++) {
        if (clarray[i][0] == clcode) {
            clarray.splice(i, 1);
        break;
        }
    }
console.log(clarray);
            user.set("joined_groups", clarray);
            user.save(null, {
                success: function(user) {
console.log(user.id);
                    var GroupMembers= Parse.Object.extend("GroupMembers");
                    var query = new Parse.Query(GroupMembers);
		query.equalTo("code", clcode);
		query.equalTo("emailId", user.get("username"));
        query.notEqualTo("status", "LEAVE");
        query.notEqualTo("status", "REMOVED");
		query.first({
                        success: function(object) {
console.log(object.id);
                            object.set("status", "LEAVE");
                            object.save({
                                success: function(object) {
console.log(object.id);
     var query = new Parse.Query(Parse.Installation);
console.log(ID);
	query.get(ID, {
        success: function(object) {
console.log(object.id);
	    object.remove("channels", clcode);  
            object.save(null,{
                success: function(object) {
console.log(object.id);
			var flag=true;
console.log(flag);
response.success(flag);
                },
                error: function(object, error) {
var errormessage ="Error in::"+"installation::"+ "save::" + error.code + "::" + error.message+"::";
 Notify( eplatform , emodal , eusr , "leaveClass", echannel , errormessage);
response.error(errormessage);
                }
            });          
                                },
                                error: function(object, error) {    
var errormessage ="Error in::"+"installation::"+ "get::" + error.code + "::" + error.message+"::";
 Notify( eplatform , emodal , eusr , "leaveClass", echannel , errormessage);
response.error(errormessage);
                                }
                            });
		 },
                error: function(object,error) {
var errormessage ="Error in::"+"groupmembers::"+ "save::" + error.code + "::" + error.message+"::";
 Notify( eplatform , emodal , eusr , "leaveClass", echannel , errormessage);
response.error(errormessage);
                }
            });
                },
                error: function(error) {
var errormessage ="Error in::"+"groupmembers::"+ "first::" + error.code + "::" + error.message+"::";
 Notify( eplatform , emodal , eusr , "leaveClass", echannel , errormessage);
response.error(errormessage);
                }
            });
 },
                error: function(object,error) {
var errormessage ="Error in::"+"user::"+ "save::" + error.code + "::" + error.message+"::";
 Notify( eplatform , emodal , eusr , "leaveClass", echannel , errormessage);
response.error(errormessage); 
                }
            });
}

/*
function to join a class 
input classCode,associateName,installationObjectId
output json object codegroup(as codegroup) entry related to that user and 5 message (as messages) of groupdetail table
check that code exist then add entry in user joined group ,then in groupmember and then in installation of currentuser and then groupdetail 5 messages
*/
exports.joinClass = function(request, response) {
var echannel;
var eplatform=request.user.get("OS");var emodal=request.user.get("MODAL");var eusr=request.user.get("name");
if((eplatform=='IOS')||(eplatform=='ANDROID')||(eplatform=='WEB')){echannel=eplatform;}
else{echannel='UNKNOWN';}

    var classcode = request.params.classCode;
    var child = request.params.associateName;
    var childnam=[child];
    classcode = classcode.toUpperCase();
//#*#console.log(classcode);
//#*#console.log(childnam);
    var Codegroup = Parse.Object.extend("Codegroup");
    var query = new Parse.Query("Codegroup");
    query.equalTo("code", classcode);
    query.first({
        success: function(result) {
            if (result) {
//#*#console.log(result.id);
                var classname = result.get('name');
                var clarray = request.user.get("Created_groups");
                var currentname = request.user.get("name");
                var email = request.user.get("email");
                var array = [classcode, classname,child];
                request.user.addUnique("joined_groups", array);
                request.user.save(null, {
                    success: function(user) {
//#*#console.log(user.id);
//#*#console.log(user.get("joined_groups"));
                        var GroupMembers = Parse.Object.extend("GroupMembers");
                        var groupmembers = new GroupMembers();
                        groupmembers.set("name", user.get("name"));
                        groupmembers.set("code", classcode);
                        groupmembers.set("children_names",childnam);
                        groupmembers.set("emailId", user.get("username"));
                        groupmembers.save(null, {
                            success: function(groupmembers) {
//#*#console.log(groupmembers.id);
//#*#console.log(installId);
 var installId = request.params.installationObjectId;
     var query = new Parse.Query(Parse.Installation);
	query.get(installId, {
        success: function(object) {
//#*#console.log(object.id);
            object.addUnique("channels", classcode);
            object.save({
                success: function(object) {
//#*#console.log(object.id);
    var GroupDetails = Parse.Object.extend("GroupDetails");
    var query = new Parse.Query("GroupDetails");
    query.equalTo("code", classcode);
var d=new Date();
var e=new Date(d.getTime()-432000000);
    query.greaterThan("createdAt",e);
    query.descending("createdAt");
    query.limit(5);
    query.find({
        success: function(results) {
//#*#console.log(result.id);
//#*#console.log(results.length);
//#*#console.log(results[results.length-1].id);
var output={"codegroup":result,"messages":results};
response.success(output);
        },
        error: function(error) {
            response.error("Error: " + error.code + " " + error.message);
        }
    });
                },
                error: function(object, error) {
                    response.error("Error: " + error.code + " " + error.message);
                }
            });
        },
        error: function(object,error) {
          //  response.error("Error: " + error.code + " " + error.message);
if(error.code==101){response.error("INSTALLATION_NOT_CREATED");}
else{response.error("Error: " + error.code + " " + error.message);}
        }
    });
                     },
                            error: function(groupmembers, error) {
                                response.error("Error: " + error.code + " " + error.message);
                            }
                        });
                    },
                    error: function(error) {response.error("interputed in user save");}
                });
            } else {
//#*#console.log("NO class exist");
                response.error("No such class exits");
            }
        },
        error: function(error) {
            response.error("Error: " + error.code + " " + error.message);
        }
    });  
}






/*
function for returning list of classes as a suggest for parent to join
input  school ,standard,divison 
output codegroup entries of suggested classes 
use of compound query on codegroup to compute suggestion whose class exits and removed groups that are already joined/created or removed
*/
exports.suggestClass = function(request, response) {
var echannel;
var eplatform=request.user.get("OS");var emodal=request.user.get("MODAL");var eusr=request.user.get("name");
if((eplatform=='IOS')||(eplatform=='ANDROID')||(eplatform=='WEB')){echannel=eplatform;}
else{echannel='UNKNOWN';}
var school=request.params.school;
var standard=request.params.standard;
var division=request.params.division;
var clarray1 = request.user.get("joined_groups");
var clarray2 = request.user.get("Created_groups");
var clarray3 = request.user.get("removed_groups");
var clarray=[];
var i;
if(typeof clarray1 !='undefined'){
  for ( i = 0; i < clarray1.length; i++) {
clarray[i]=clarray1[i][0];
}
}
if(typeof clarray2 !='undefined'){
  for (var j = 0; j < clarray2.length; j++) {
clarray[i]=clarray2[j][0];
i++;
}
}
if(typeof clarray3 !='undefined'){
  for (var k = 0; k < clarray3.length; k++) {
clarray[i]=clarray3[k][0];
i++;
}
}


var Codegroup = Parse.Object.extend("Codegroup");
//#*#console.log(date);
    var query1 = new Parse.Query("Codegroup");
    query1.equalTo("school", school);
    query1.equalTo("standard", standard);
if(division!='NA'){
query1.equalTo("divison", division);
}

query1.notContainedIn("code",clarray);
    query1.find({
        success: function(results) {
//#*#console.log(results.length);
//#*#console.log(results[length/2)].id;

            response.success(results);
        },
        error: function(error) {
var errormessage="Error: " + error.code + " " + error.message;
 Notify( eplatform , emodal , eusr , "suggestClass"," finding entries of codegroup" , echannel , errormessage);
response.error(errormessage);    
        }
    });
}