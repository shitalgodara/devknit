//function-4
//input classcode and limit output timedetails of messages of that class
exports.toupdatetimebyclass = function(request, response) {
    var clcode = request.params.classcode;
    var limit = request.params.limit;
    var GroupDetails = Parse.Object.extend("GroupDetails");
    var query = new Parse.Query("GroupDetails");
    query.equalTo("code", clcode);
    query.select("createdAt");
    query.descending("createdAt");
    query.limit(limit);
    query.find({
        success: function(results) {
            response.success(results);
        },
        error: function(error) {
            response.error("Error: " + error.code + " " + error.message);
        }
    });
}
//function-5
//input classcodearray and limit output timedetails of messages of that class
exports.toupdatetime = function(request, response) {
    var clarray = request.params.classarray;
    var limit = request.params.limit;
    var GroupDetails = Parse.Object.extend("GroupDetails");
    var query = new Parse.Query("GroupDetails");
    query.containedIn("code", clarray);
    query.select("createdAt");
    query.descending("createdAt");
    query.limit(limit);
    query.find({
        success: function(results) {
            response.success(results);
        },
        error: function(error) {
            response.error("Error: " + error.code + " " + error.message);
        }
    });
}
