/*
input objectId of installation table as installationObjectId
output bool true or error string
function to stop sending notification in case of logout we have to delete all channels entry 
a simple get query on installation table and then save query on it
*/
exports.removeChannels = function(request, response) {
    var installId = request.params.installationObjectId;
    var query = new Parse.Query("_Installation");
    query.get( installId,{
        success: function(object) {
            object.set("channels", []);
            object.save({
                success: function(object) {
		    var flag=true;
                    response.sucsess(flag);
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
input objectId of installation table as installationObjectId
output bool true or error string
function to restart sending notification in case of logoin we have to add classcode array channels entry
a simple get query on installation table and then save query on it
*/
exports.addChannels = function(request, response) {
    var installId = request.params.installationObjectId;
    var clarray = request.user.get("joined_groups");
if(typeof clarray =='undefined'){var flag=true;response.sucsess(flag);}
else{
var channels=[];
    for (var i = 0; i < clarray.length; i++) {
	channels[i]=clarray[i][0];
    }
     var query = new Parse.Query("_Installation");
	query.get(installationObjectId, {
        success: function(object) {
            object.set("channels", channels);
            object.save({
                success: function(object) {
                    var flag=true;
                    response.sucsess(flag);
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
}