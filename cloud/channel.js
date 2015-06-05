/*
Function to empty channels in case of app logout to stop sending notifications
  Input =>
    installationObjectId: String // object id of installation table
  Output =>
    flag: bool // true in case of successful deletion
  Description => 
    Process to empty channels field of installation object corresponding to install Id
*/
exports.removeChannels = function(request, response) {
  var installId = request.params.installationObjectId;
  var query = new Parse.Query("_Installation");
  query.get(installId, {
    success: function(object) {
      object.set("channels", []);
      object.save({
        success: function(object) {
          var flag = true;
          response.success(flag);
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
Function to restart sending notification in case of login
  Input =>
    installationObjectId: String // objectId of installation table 
  Output => 
    flag: Bool // True in case of success else error message
  Description =>
    Process to empty channels field of installation object corresponding to install Id
*/
exports.addChannels = function(request, response) {
  var installId = request.params.installationObjectId;
  var clarray = request.user.get("joined_groups");
  if(typeof clarray == 'undefined'){
    var flag = true;
    response.success(flag);
  }
  else{
    var channels = [];
    for (var i = 0; i < clarray.length; i++) {
     channels[i] = clarray[i][0];
    }
    var query = new Parse.Query("_Installation");
    query.get(installId, {
      success: function(object) {
        object.set("channels", channels);
        object.save({
          success: function(object) {
            var flag = true;
            response.success(flag);
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