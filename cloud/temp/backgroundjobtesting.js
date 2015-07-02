Parse.Cloud.job("fetchMenus", function(request, status) {
  var LocationSP, counter, query;
  counter = 0;
  LocationSP = Parse.Object.extend("Location");
  query = new Parse.Query(LocationSP);
  query.doesNotExist("menu");
  query.equalTo("city_lc", "new york");
  return query.each(function(location) {
    if (counter % 100 === 0) {
      status.message(counter + " users processed.");
    }
    return Parse.Cloud.run('getMenu2', {
      alias: location.get("location_id")
    }).then(function(result) {
      counter += 1;
      return Parse.Promise.as("1");
    }, function(error) {
      return Parse.Promise.as("1");
    });
  }).then(function() {
    return status.success("Migration completed successfully.");
  }, function(error) {
    return status.error("Uh oh, something went wrong." + error);
  });
});