exports.giveCLassesInCodegroup = function(request, response) {
      var result = [];
      var processCallback = function(res) {
                result = result.concat(res);
                if (res.length == 1000) {
                  process(res[res.length-1].get('code'));
                  return;
                }
                var tmp = [];
                for(var i=0;i<result.length;i++){
                    tmp.push(result[i].get('code'));
                }
                response.success(tmp);
            }   
        var process = function(skip) {
            var query = new Parse.Query("Codegroup");
            if (skip) {
              query.greaterThan("code", skip);
            }
            query.limit(1000);
            query.ascending("code");
            query.select("code");
            query.find().then(function querySuccess(res) {
              processCallback(res);
            }, function queryFailed(error) {
              status.error("query unsuccessful, length of result " + result.length + ", error:" + error.code + " " + error.message);
            });
          }
      process(false);
}
exports.giveCLassesInGroupDetails = function(request, response) {
      var result = [];
      var processCallback = function(res) {
                result = result.concat(res);
                if (res.length == 1000) {
                  process(res[res.length-1].get('code'));
                  return;
                }
                var tmp = [];
                for(var i=0;i<result.length;i++){
                    tmp.push(result[i].get('code'));
                }
                function uniq(a) {
                    return a.filter(function(item, pos, ary) {
                        return !pos || item != ary[pos - 1];
                    })
                }
                var final = uniq(tmp);
                response.success(final);
            }
        var process = function(skip) {
            var query = new Parse.Query("GroupDetails");
            if (skip) {
              query.greaterThan("code", skip);
            }
            query.limit(1000);
            query.ascending("code");
            query.select("code");
            query.find().then(function querySuccess(res) {
              processCallback(res);
            }, function queryFailed(error) {
              status.error("query unsuccessful, length of result " + result.length + ", error:" + error.code + " " + error.message);
            });
          }
      process(false);
}
exports.giveCLassesInUser = function(request, response) {
      var result = [];
      var processCallback = function(res) {
                result = result.concat(res);
                if (res.length == 1000) {
                  process(res[res.length-1].id);
                  return;
                }
                var final = [];
                var tmp;
                for(var i=0;i<result.length;i++){
                    tmp = result[i].get('Created_groups');
                    if(tmp != null){
                        for(var j=0;j<tmp.length;j++){
                            final.push(tmp[j][0]);
                        }
                    }
                }
                response.success(final);
            }
        var process = function(skip) {
            var query = new Parse.Query("User");
            query.equalTo("role","teacher");
            if (skip) {
              query.greaterThan("objectId", skip);
            }
            query.limit(1000);
            query.ascending("objectId");
            query.select("Created_groups");
            query.find().then(function querySuccess(res) {
              processCallback(res);
            }, function queryFailed(error) {
              status.error("query unsuccessful, length of result " + result.length + ", error:" + error.code + " " + error.message);
            });
          }
      process(false);
}
exports.giveCLassesInGroupmembers = function(request, response) {
      var result = [];
      var processCallback = function(res) {
                result = result.concat(res);
                if (res.length == 1000) {
                  process(res[res.length-1].get('code'));
                  return;
                }
                var tmp = [];
                for(var i=0;i<result.length;i++){
                    tmp.push(result[i].get('code'));
                }
                function uniq(a) {
                    return a.filter(function(item, pos, ary) {
                        return !pos || item != ary[pos - 1];
                    })
                }
                var final = uniq(tmp);
                response.success(final);
            }
        var process = function(skip) {
            var query = new Parse.Query("Groupmembers");
            if (skip) {
              query.greaterThan("code", skip);
            }
            query.limit(1000);
            query.ascending("code");
            query.select("code");
            query.find().then(function querySuccess(res) {
              processCallback(res);
            }, function queryFailed(error) {
              status.error("query unsuccessful, length of result " + result.length + ", error:" + error.code + " " + error.message);
            });
          }
      process(false);
}
exports.giveCLassesInMessageneeders = function(request, response) {
      var result = [];
      var processCallback = function(res) {
                result = result.concat(res);
                if (res.length == 1000) {
                  process(res[res.length-1].get('cod'));
                  return;
                }
                var tmp = [];
                for(var i=0;i<result.length;i++){
                    tmp.push(result[i].get('cod'));
                }
                function uniq(a) {
                    return a.filter(function(item, pos, ary) {
                        return !pos || item != ary[pos - 1];
                    })
                }
                var final = uniq(tmp);
                response.success(final);
            }
        var process = function(skip) {
            var query = new Parse.Query("Messageneeders");
            if (skip) {
              query.greaterThan("cod", skip);
            }
            query.limit(1000);
            query.ascending("cod");
            query.select("cod");
            query.find().then(function querySuccess(res) {
              processCallback(res);
            }, function queryFailed(error) {
              status.error("query unsuccessful, length of result " + result.length + ", error:" + error.code + " " + error.message);
            });
          }
      process(false);
}