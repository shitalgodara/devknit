/*------------------------------------USER.JS-----------------------------*/
/*
functions to give details of user pid and name of users whose class a user has joined
input joinedObjectIds from local codegroup table
output array of json object whose fields are username,pid and name
simple query on user table
*/
exports.getUpdatesUserDetail = function(request, response) {
var clarray=request.params.joinedObjectIds;
var query = new Parse.Query(Parse.User);
query.containedIn("username", clarray);
	query.find( {
        success: function(users) {
var results=[];
for(var i=0;i<users.length;i++){
results[i]={username:users[i].get("username"),pid:users[i].get("pid"),name:users[i].get("name")};
}
response.success(results);                            
                            }, 
 error: function(users, error) {
                    response.error("Error: " + error.code + " " + error.message);
                }
            });
}
//new date works