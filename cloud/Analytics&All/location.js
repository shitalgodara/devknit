Parse.Cloud.define("getGeoPointsForPlotting",function(request,response){
	Parse.Cloud.useMasterKey();
	var result = [];
	var processCallback = function(res) {
            result = result.concat(res);
            if (res.length == 1000) {
              process(res[res.length-1].id);
              return;
            }
            var len = result.length;
            var final = [];
            for(var i=0;i<len;i++){
				var lat = result[i].get('lat');
				var long = result[i].get('long');
				final.push([lat,long]);
			}
			response.success(final);
            
            }
            
            
    var process = function(skip) {
        var query = new Parse.Query("_Session");
        if (skip) {
          query.greaterThan("objectId", skip);
        }
        query.limit(1000);
        query.select("lat","long");
        query.ascending("objectId");
        query.find().then(function querySuccess(res) {
          processCallback(res);
        }, function queryFailed(error) {
          status.error("query unsuccessful, length of result " + result.length + ", error:" + error.code + " " + error.message);
        });
      }
  process(false);
});