//one time functions,to help testing and developing
exports.deleteKioClassFromUserJoinedGroups = function(request, response) {
  var result = [];
  var processCallback = function(res) {
            result = result.concat(res);
            if (res.length == 1000) {
              process(res[res.length-1].id);
              return;
            }
            var len = result.length;
            for(var i=0;i<len;i++){
                var joinedGroups = result[i].get('joined_groups');
              for(var i = 0; i < joinedGroups.length; i++){
                          if(joinedGroups[i][1] == "MR. KIO"){
                            joinedGroups.splice(i, 1);
                            result[i].set("joined_groups",joinedGroups);
                            break;
                          }
                        }
            }
            Parse.Object.saveAll(result, {
                success: function(objs) {
            response.success("deleted the messages");
                },
                error: function(error) { 
            response.error(error.code+":"+error.message);
                }
            });
            }
    var process = function(skip) {
        var query = new Parse.Query("User");
        query.select("joined_groups");
        if (skip) {
          query.greaterThan("objectId", skip);
        }
        query.limit(1000);
        query.ascending("objectId");
        query.find().then(function querySuccess(res) {
          processCallback(res);
        }, function queryFailed(reason) {
          response.error("query unsuccessful, length of result " + result.length + ", error:" + error.code + " " + error.message);
        });
      }
  process(false);
}

//add kio function