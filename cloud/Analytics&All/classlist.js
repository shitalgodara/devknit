//get list of classes used in all
//in classcode option of exist true fale and both for codegroup table
//to make it for greater than 10k objects in eavh table

//verify /insure function
//code(true)==user
//msg,GM,GD subset user classes(all)
//normal tester for older Gd(for msg+GM >0)

//kio channel delete,joined class,GM delete,codegroup entry

//clean up and before image message,profile delete pic->in delete account add this

//delete not inactive ones but testing ones
//get tesitng account by 00000
//delete account->testing account =>whole data->gm,msg,gd,installtion,code,user,delete class also ,and whom he joined as testing all in circle
//done by either track of deleted or delete by senderID
//2 del function 1 for testing 1 in general

//all functions
//after class delete data some like GM maybe then handle-of leave class
//msg cant be deleted property when all user left clas or after 2 yr
//if exist false and gm+msg==0,then remove GD
//else del GM+msg
//leave handle of joined class in msg,gm
//if all left class then delete msg
//or after 1 yr,force remove channel in installaion
//all this section yearly function



//get detail of suspected ones-may be not direct serachin json
//if not presnet in codegroup
//else by function->created at,by ,exist/deletedat,mem on both,msg,last msg
 
//file timeout

//get users now
//send emial,phone sms,phone notify,..

//actual plot ones on all caegory wis wise

exports.giveCLassesInCodegroup = function(request, response) {
  var type = request.params.type;
  var bool = request.params.bool;
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
            if(type==1){
              query.equalTo("classExist",bool);
            }
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
            var query = new Parse.Query("GroupMembers");
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
