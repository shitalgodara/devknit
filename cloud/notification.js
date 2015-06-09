var _ = require('underscore.js');
Parse.Cloud.job("sendLikeNotifications", function(request, response){	
	var intervals = 4; 
	var intervalTime = (86400000/ intervals);
	var date = new Date();
	var currentTime = date.getTime();
	var dateLowerBound = new Date(currentTime - intervals * intervalTime);
	var dateUpperBound = new Date(currentTime - (intervals - 1) * intervalTime);
	var query1 = new Parse.Query("GroupDetails");
	query1.greaterThanOrEqualTo("createdAt", dateLowerBound);
	query1.lessThan("createdAt", dateUpperBound);
	query1.greaterThanOrEqualTo("like_count", 0);
	query1.select("objectId", "name", "title", "like_count", "senderId");
	query1.find().then(function(results){
		var promise = Parse.Promise.as();
		Parse.Cloud.useMasterKey();
		_.each(results, function(result){
			var query2 = new Parse.Query(Parse.Installation);
			query2.equalTo("username", result.get("senderId")); 
			promise = promise.then(function(){
				return Parse.Push.send({
					where: query2,
					data: {
						msg: "Hey !:)",
						alert: "Hey! :)",
						badge: "Increment",
						groupName: "classname",
						type: "NORMAL",
  			    action: "INBOX"
					}
				});
			});
		});
		return promise;
	}).then(function(){
		response.success("Successful send notifications to all teachers !!");
	}, function(error){
		response.error(error);
	});
});