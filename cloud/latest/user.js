var _ = require('cloud/include/underscore.js');

/*
Function to give teachers details mainly pid and name whose class a user has joined
	Input => 
		Array of joinedObjectIds: String
	Output =>
		Array of JSON object {
			username: String
			pid: File // Profile Picture of User
			name: String
		}
	Procedure =>
		Simply query on users table and give required details 
*/
exports.getUpdatesUserDetail = function(request, response){
	var clarray = request.params.joinedObjectIds;
	var query = new Parse.Query(Parse.User);
	query.equalTo("role", "teacher");
	query.containedIn("username", clarray);
	query.find().then(function(users){
		var output = _.map(users, function(user){
			return {
				username: user.get("username"),
				pid: user.get("pid"),
				name: user.get("name")
			};
		});
		response.success(output);                            
	}, function(error){
		response.error(error.code + ": " + error.message);
	});
}

/*
Function to get user details
	Input =>
		details: Array
	Output =>
		JSON Object{
			details
		}
	Procedure =>
		Process simply retrieves of users information
*/
exports.getUserDetails = function(request, response){
	var user = request.user;
	var details = request.params.details;
	var output = {};
	_.each(details,function(detail){
		output[detail] = user.get(detail);
	});
	response.success(output);
}

/* 
Function to edit profile picture of user 
	Input =>
		pid: File Pointer
	Output =>
		flag: Bool // true in case of success
	Procedure =>
		Simple save profile pic of user object
*/
exports.updateProfilePic = function(request, response){
	var user = request.user;
	user.set("pid", request.params.pid);
	user.save().then(function(user){
		response.success(true);
	}, function(error){
		response.error(error.code + ": " + error.message);
	});
}

/* 
Function to edit profile name of user 
	Input =>
		name: String
	Output =>
		flag: Bool // true in case of success
	Procedure =>
		Simple save name of user object
*/
exports.updateProfileName = function(request, response){
	var user = request.user;
	user.set("name", request.params.name);
	user.save().then(function(user){
		response.success(true);
	}, function(error){
		response.error(error.code + ": " + error.message);
	});
}

/* 
Function to update school place id of teacher
	Input =>
		place_id: String
	Output =>
		flag: Bool // true in case of success
	Procedure =>
		Simple save place_id of user object
*/
exports.updateSchoolId = function(request, response){
	var user = request.user;
	user.set("place_id", request.params.place_id);
	user.save().then(function(user){
		response.success(true);
	}, function(error){
		response.error(error.code + ": " + error.message);
	});
}