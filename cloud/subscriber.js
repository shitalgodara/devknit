//function-1
//input classcode and out put # members subscribed to that class via app and sms
exports.showclassstrength = function(request, response) {
    var clcode = request.params.classcode;
    var GroupMembers = Parse.Object.extend("GroupMembers");
    var query = new Parse.Query(GroupMembers);
    query.equalTo("code", clcode);
	
    query.count({
        success: function(count1) {
            var Messageneeders = Parse.Object.extend("Messageneeders");
            var query = new Parse.Query(Messageneeders);
            query.equalTo("cod", clcode);
            query.count({
                success: function(count2) {
console.log(count1+count2);
                    response.success(count1 + count2);
                },
                error: function(error) {
var errormessage="Error: " + error.code + " " + error.message;
console.log(errormessage);
                    response.error("Error: " + error.code + " " + error.message);
                }
            });
        },
        error: function(error) {
var errormessage="Error: " + error.code + " " + error.message;
console.log(errormessage);
            response.error("Error: " + error.code + " " + error.message);
        }
    });
}
/*---------------------------------------------New changes----------------------------*/
/*
function to change assoicate name of joined class
input classCode and childName
output bool true
change entry in groupmember and in users joined groups
*/
exports.changeAssociateName = function(request, response) {
    var classcode = request.params.classCode;
    var newchild = request.params.childName;
//#*#console.log(classcode);
//#*#console.log(newchild);
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
        success: function(object) {
//#*#console.log(object.id);
//#*#console.log(newchild);
            object.set("children_names",child);
            object.save({
                success: function(object) {
//#*#console.log(object.get("children_names"));
var user=request.user;
var classname="";
var clarray = user.get("joined_groups");
    for (var i = 0; i < clarray.length; i++) {
        if (clarray[i][0] == classcode) {
classname=clarray[i][1];
            clarray.splice(i, 1);
        break;
        }
    }
var clelement=[classcode,classname,newchild];
//#*#console.log(clelement);
clarray.push(clelement);
//#*#console.log(clarray);
 user.set("joined_groups", clarray);
                    user.save(null, {
                        success: function(user) {
//#*#console.log(user.get("joined_groups"));
			  var flag=true;response.success(flag);
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
        error: function(error) {
            response.error("Error: " + error.code + " " + error.message);
        }
    });  
}
/*
function to show all latest subscribers of a class
input classcode and date
output json object of app and sms which represents entries of parse objects of groupmembers and messageneeders
query on both tables 
*/
exports.showSubscribers = function(request, response) {
    var clcode = request.params.classcode;
    var Date = request.params.date;
//#*#console.log(clcode);
//#*#console.log(Date);
    var GroupMembers = Parse.Object.extend("GroupMembers");
    var query = new Parse.Query(GroupMembers);
    query.greaterThan("updatedAt",Date);
    query.equalTo("code", clcode);
    query.select("name", "children_names","code","status","emailId");
    query.find({
        success: function(results1) {
    var Messageneeders = Parse.Object.extend("Messageneeders");
    var query = new Parse.Query(Messageneeders);
    query.greaterThan("updatedAt",Date);
    query.equalTo("cod", clcode);
    query.select("subscriber", "number","cod","status");
    query.find({
        success: function(results2) {
      var result = {
        "app": results1,
        "sms": results2
      };
/*##
for(var i=0;i<result.app.length;i++){
console.log(result.app[i].id+"$$"+result.app[i].get("children_names")+"$$"+result.app[i].get("name")+"$$"+result.app[i].createdAt);
}
##*/
/*##
for(var i=0;i<result.sms.length;i++){
console.log(result.sms[i].id+"$$"+result.sms[i].get("cod")+"$$"+result.sms[i].get("number")+"$$"+result.sms[i].createdAt);
}
##*/
            response.success(result);
        },
        error: function(error) {
            response.error("Error: " + error.code + " " + error.message);
        }
    });
        },
        error: function(error) {
            response.error("Error: " + error.code + " " + error.message);
        }
    });
}
/*
function to show all latest subscribers of all created classes
input  date
output json object of app and sms which represents entries of parse objects of groupmembers and messageneeders
query on both tables 
*/
exports.showAllSubscribers = function(request, response) {
var clarray1 = request.user.get("Created_groups");
if(typeof clarray1 == 'undefined'){response.success({"app":[],"sms":[]});}
else{
var clarray=[];
 for (var i = 0; i < clarray1.length; i++) {
	clarray[i]=clarray1[i][0];
	}
    var date = request.params.date;
//#*#console.log(date);
//#*#console.log(clarray);
    var GroupMembers = Parse.Object.extend("GroupMembers");
    var query = new Parse.Query(GroupMembers);
    query.greaterThan("updatedAt",date);
    query.containedIn("code", clarray);
    query.select("name", "children_names","code","status","emailId");
    query.find({
        success: function(results1) {
    var Messageneeders = Parse.Object.extend("Messageneeders");
    var query = new Parse.Query(Messageneeders);
    query.containedIn("cod", clarray);
    query.greaterThan("updatedAt",date);
    query.select("subscriber", "number","cod","status");
    query.find({
        success: function(results2) {
      var result = {
        "app": results1,
        "sms": results2
      };
/*##
for(var i=0;i<result.app.length;i++){
console.log(result.app[i].id+"$$"+result.app[i].get("children_names")+"$$"+result.app[i].get("name")+"$$"+result.app[i].createdAt);
}
##*/
/*##
for(var i=0;i<result.sms.length;i++){
console.log(result.sms[i].id+"$$"+result.sms[i].get("cod")+"$$"+result.sms[i].get("number")+"$$"+result.sms[i].createdAt);
}
##*/
            response.success(result);
        },
        error: function(error) {
            response.error("Error: " + error.code + " " + error.message);
        }
    });
        },
        error: function(error) {
            response.error("Error: " + error.code + " " + error.message);
        }
    });
}
}