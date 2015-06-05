/*
Function to give teachers details mainly pid and name whose class a user has joined
	Input => 
		Array of 
			joinedObjectIds: String // teacher usernames or ids from local codegroup table
	Output =>
		Array of JSON object {
			username: String
			pid: File // Profile Picture of User
			name: String
	}
	Description =>
		Process simply queries on users table and give required details 
*/
exports.getUpdatesUserDetail = function(request, response) {
	var clarray = request.params.joinedObjectIds;
	var query = new Parse.Query(Parse.User);
	query.equalTo("role", "teacher");
	query.containedIn("username", clarray);
	query.find( {
		success: function(users) {
			var results = [];
			for(var i = 0; i < users.length; i++){
				results[i] = {
					username: users[i].get("username"),
					pid: users[i].get("pid"),
					name: users[i].get("name")
				};
			}
			response.success(results);                            
		}, 
		error: function(users, error) {
			response.error("Error: " + error.code + " " + error.message);
		}
	});
}