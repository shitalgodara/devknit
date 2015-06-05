//function-23
//School's list->output list of school names
exports.schoollist = function(request, response) {
    var FAQs = Parse.Object.extend("SCHOOLS");
    var query = new Parse.Query("SCHOOLS");
    query.select("school_name");
    query.find({
        success: function(results) {
            response.success(results);
        },
        error: function(error) {
            response.error("Error: " + error.code + " " + error.message);
        }
    });
}
/*
function to give school name after giving school id
input schoolId
output school name coresponding school id{string}
procedure siple query on schools table
*/
exports.getSchoolName = function(request, response) {
    var school = request.params.schoolId;
    var SCHOOLS = Parse.Object.extend("SCHOOLS");
    var query = new Parse.Query(SCHOOLS); 
    query.get(school,{
        success: function(result) {
                    response.success(result.get('school_name'));
},
 error: function(temp, error) {
                           errormessage="Error: " + error.code + " " + error.message;
response.error(error.message);
                                }
                            });
                   } 

/*
function to give school Id after giving school name
input schoolName
output id of school
search query then save if doesn't exists on school
*/
exports.getSchoolId = function(request, response) {
var schoolName=request.params.school;
//#*#console.log(schoolName);
    var SCHOOLS = Parse.Object.extend("SCHOOLS");
    var query = new Parse.Query("SCHOOLS");
    query.equalTo("school_name",schoolName);
    query.first({
        success: function(result) {
if(result){
//#*#console.log(result.id);
            response.success(result.id);
}
else{
var SCHOOLS = Parse.Object.extend("SCHOOLS");
                        var schools = new SCHOOLS();
                        schools.set("school_name", schoolName);                    
                        schools.save(null, {
                            success: function(school) {
//#*#console.log(result.id);
response.success(school.id);
 },
        error: function(error) {
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

//function-19
//FAQs->input role if teacher show all FAQ, if parent then only with role parent output objects with role,question and answer
/*
return Faq question and answers
input date last updated date of locally available local else 1 nov 2014 like some old date
output objects of FAQs table
simple query on FAQ
*/
exports.faq = function(request, response) {
    var role = request.user.get("role");
    var date=request.params.date;
//#*#console.log(date);
    var FAQs = Parse.Object.extend("FAQs");
    var query = new Parse.Query("FAQs");
    if (role == "parent") {
        query.equalTo("role", "Parent");
    }
query.select("question","answer");
query.greaterThan("updatedAt",date);
    query.find({
        success: function(results) {
/*##
for(var i=0;i<results.length;i++){
console.log(results[i].id+"$$"+results[i].get("question")+"$$"+results[i].get("answer")+"$$"+results[i].updatedAt);
}
##*/
            response.success(results);
        },
        error: function(error) {
            response.error("Error: " + error.code + " " + error.message);
        }
    });
}

/*
function to submit feedback 
input feed as content
output bool true 
simple save query on feedback table
*/
exports.feedback = function(request, response) {
    var feed = request.params.feed;
//#*#console.log(feed);
var Feedbacks = Parse.Object.extend("Feedbacks");
                        var feedbacks = new Feedbacks();
                        feedbacks.set("content", feed);
                        feedbacks.set("emailId", request.user.get("username"));
                        feedbacks.save(null, {
                            success: function(feedbacks) {
var flag=true;
//#*#console.log(flag);
				response.success(flag);
                },
                error: function(object, error) {
                    response.error("Error: " + error.code + " " + error.message);
                }
            });
}


/*
function to find class
input code 
output codegroup object
simple find query on codegroup
*/
exports.findClass = function(request, response) {
    var classcode = request.params.code
    var Codegroup = Parse.Object.extend("Codegroup");
    var query = new Parse.Query("Codegroup");
    query.equalTo("code", classcode);
    query.find({
        success: function(results) {
            response.success(results);
        },
        error: function(error) {
var errormessage ="Error in::"+"codegroup::"+ "find::" + error.code + "::" + error.message+"::";
response.error(errormessage);    
        }
    });
}

/*
function to invite others
input classCode{string},type{number},data{json object with fields name ,phone or email},mode {string "phone","email"}
1 indicate 2 indicate ....
output boolean true/flase
algo to be written
*/
exports.inviteUsers = function(request, response) {
    var classCode=request.params.classCode;
    var type=request.params.type;
    var data=request.params.data;
    var mode=request.params.mode;
            response.success('true');
}