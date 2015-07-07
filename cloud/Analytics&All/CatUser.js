//categories of users
//active teachers->name,emailId,phone-web,app->number,emailid->mail(on web emailID),notification(on app number,emailId),sms(on web with number)
//parents of active classes->on app(username notify),sms->phone no,mail to parens also
//inactive teachers on web,app->number,emailid->
//mail(on web emailID and on app emailId(just to double effort)),notification(on app username(number,emailId),sms(on web with number)

//users on both->sms,app

//users->active ,retened,dropped
//user with feedback type->loyal(likes),not getting app,buggy report bugs,suggestive[all in all roles]

//replace with hash
//>10k is right way skip find more element s for >10k it would 11k do
//so date use and get upto 1k then gain last date as param and sort based on it


//all teachers 
//all- active = in active teacher then detail
//all base return username to notify use 
//get email and number for advance
exports.allUsers = function(request, response) {
  var n = request.params.nval;
  var result = [];
  var emails = [];
  var processCallback = function(res) {
            result = result.concat(res);
            if (res.length == 1000) {
              process(res[res.length-1].id);
              return;
            }
                for(var i=0;i<result.length;i++){
                   emails.push(result[i].get('username'));   
                }   
            response.success(emails);
            }
        var process = function(skip) {
        var query = new Parse.Query("_User");
        query.equalTo("role",'teacher');
        if (skip) {
          query.greaterThan("objectId", skip);
        }
        query.select("username");
        query.limit(1000);
        query.ascending("objectId");
        query.find().then(function querySuccess(res) {
          processCallback(res);
        }, function queryFailed(error) {
          response.error("query unsuccessful, length of result " + result.length + ", error:" + error.code + " " + error.message);
        });
      }
  process(false);
}

//Active teachers and there active parent 
exports.usersActiveInLastnMonths = function(request, response) {
  var n = request.params.nval;
  var result = [];
  var emails = [];
  var d1 = new Date(); // gets today
  var d2 = new Date(d1 - 1000 * 60 * 60 * 24 * 30 * n); // n months ago 
  var processCallback = function(res) {
            result = result.concat(res);
            if (res.length == 1000) {
              process(res[res.length-1].id);
              return;
            }
                var len = result.length;
                for(var i=0;i<len;i++){
                    var tmp1 = result[i].get('senderId');
                    chk=true;
                    for(var k=0;k<emails.length;k++){
                        if(emails[k] == tmp1){chk=false;break;}
                    }
                    if(chk == true)emails.push(tmp1);   
                }   
            response.success(emails);
            }
     
    var process = function(skip) {
        var query = new Parse.Query("GroupDetails");
         
        if (skip) {
          query.greaterThan("objectId", skip);
        }
         
        query.lessThanOrEqualTo("createdAt",d1);
        query.greaterThan("createdAt",d2);
        query.select("senderId");
        query.limit(1000);
        query.ascending("objectId");
         
        query.find().then(function querySuccess(res) {
          processCallback(res);
        }, function queryFailed(error) {
          response.error("query unsuccessful, length of result " + result.length + ", error:" + error.code + " " + error.message);
        });
      }
  process(false);
}
 

exports.ClassesActiveInLastnMonths = function(request, response) {
  var n = request.params.nval;
  var result = [];
  var classes = [];
  var d1 = new Date(); // gets today
  var d2 = new Date(d1 - 1000 * 60 * 60 * 24 * 30 * n); // n months ago 
  var processCallback = function(res) {
            result = result.concat(res);
            if (res.length == 1000) {
              process(res[res.length-1].id);
              return;
            }
                var len = result.length;
                for(var i=0;i<len;i++){
                    var tmp1 = result[i].get('code');
                    chk=true;
                    for(var k=0;k<classes.length;k++){
                        if(classes[k] == tmp1){chk=false;break;}
                    }
                    if(chk == true)classes.push(tmp1);  
                }   
            response.success(classes);
            }
     
    var process = function(skip) {
        var query = new Parse.Query("GroupDetails");
         
        if (skip) {
          query.greaterThan("objectId", skip);
        }
         
        query.lessThanOrEqualTo("createdAt",d1);
        query.greaterThan("createdAt",d2);
        query.select("code");
        query.limit(1000);
        query.ascending("objectId");
         
        query.find().then(function querySuccess(res) {
          processCallback(res);
        }, function queryFailed(error) {
          response.error("query unsuccessful, length of result " + result.length + ", error:" + error.code + " " + error.message);
        });
      }
  process(false);
}
 
exports.usersWhoJoinedActiveClassOnSms = function(request, response) {
    var active = request.params.classList;
              var result = [];
              var processCallback = function(res) {
                        result = result.concat(res);
                        if (res.length == 1000) {
                          process(res[res.length-1].id);
                          return;
                        }
                            var final=[];
                             
                            numbers = result.filter(function(item, pos) {
                                return result.indexOf(item) == pos;
                            });
                            var len = numbers.length;
                            for(var i=0;i<len;i++){
                                var tmp;
                                if(numbers[i].get('subscriber') == null || numbers[i].get('subscriber') == ""){tmp = [" - ",numbers[i].get('number')];final.push(tmp);}
                                else{ tmp = [numbers[i].get('subscriber'),numbers[i].get('number')];final.push(tmp);}
                                 
                            }
                             
                             
                        response.success(final);
                        }
                 
                var process = function(skip) {
                    var query = new Parse.Query("Messageneeders");
                     
                    if (skip) {
                      query.greaterThan("objectId", skip);
                    }
                    query.containedIn("cod",active);
                    query.select("number","subscriber");
                    query.limit(1000);
                    query.ascending("objectId");
                     
                    query.find().then(function querySuccess(res) {
                      processCallback(res);
                    }, function queryFailed(error) {
                      response.error("query unsuccessful, length of result " + result.length + ", error:" + error.code + " " + error.message);
                    });
                  }
              process(false);
}
 
//old continue+ del kio where terminate reaosn
exports.usersWhoJoinedActiveClassOnApp = function(request, response) {
       var active = request.params.classList;
              var result = [];
              var processCallback = function(res) {
                        result = result.concat(res);
                        if (res.length == 1000) {
                          process(res[res.length-1].id);
                          return;
                        }
                        var final = [];
                        var len1 = result.length;
                        for(var i=0;i<len1;i++){
                            final.push(result[i].get('emailId'));
                        }
                        response.success(final);
                    }
                 
                var process = function(skip) {
                    var query = new Parse.Query("GroupMembers");
                     
                    if (skip) {
                      query.greaterThan("objectId", skip);
                    }
                    query.containedIn("code",active);
                    query.select("emailId");
                    query.limit(1000);
                    query.ascending("objectId");
                     
                    query.find().then(function querySuccess(res) {
                      processCallback(res);
                    }, function queryFailed(error) {
                      response.error("query unsuccessful, length of result " + result.length + ", error:" + error.code + " " + error.message);
                    });
                  }
              process(false);
          }

exports.usernames00000 = function(request, response) {
  var result = [];
  var processCallback = function(res) {
            result = result.concat(res);
            if (res.length == 1000) {
              process(res[res.length-1].id);
              return;
            }
            for(var i=0;i<result.length;i++){
                final.push(result[i].get('username'));
            }
            response.success(final);
            }
     
    var process = function(skip) {
        var query = new Parse.Query("User");
         
        if (skip) {
          query.greaterThan("objectId", skip);
        }
        query.limit(1000);
        query.startsWith("username","00000");
        query.ascending("objectId");
        query.select("username");
        query.find().then(function querySuccess(res) {
          processCallback(res);
        }, function queryFailed(error) {
          response.error("query unsuccessful, length of result " + result.length + ", error:" + error.code + " " + error.message);
        });
      }
  process(false);
}

//get phone ,name ,email or simply phone no list or email list to target by email or sms
//or notification use username
exports.getNamesAndEmails = function(request, response) {
    var caseno = request.params.caseno;
    var users = request.params.users;
    var result = [];
      var processCallback = function(res) {
                result = result.concat(res);
                if (res.length == 1000) {
                  process(res[res.length-1].id);
                  return;
                }
                var final = [];
                for(var i=0;i<result.length;i++){
                    var tmp=[];
                    if(caseno==1){
                    if(result[i].get('phone') == null){}
                    else {
                      tmp.push(result[i].get('name'));
                      tmp.push(result[i].get('phone'));
                      final.push(tmp);
                    }                    
                  }
                    if(caseno==2){
                    if(result[i].get('email') == null){}
                    else {
                      //tmp.push(result[i].get('name'));
                      //tmp.push(result[i].get('email'));
                      //final.push(tmp);
                      final.push(result[i].get('email'));
                    }
                  }
                  if(caseno>2){
                    tmp.push(result[i].get('name'));
                    if(result[i].get('email') == null)tmp.push(" - ");
                    else tmp.push(result[i].get('email'));
                    if(result[i].get('phone') == null)tmp.push(" - ");
                    else tmp.push(result[i].get('phone'));
                    final.push(tmp);
                  }
                }
                response.success(final);
                }
         
        var process = function(skip) {
            var query = new Parse.Query("User");
             
            if (skip) {
              query.greaterThan("objectId", skip);
            }
            query.limit(1000);
            query.containedIn("username",users);
            query.ascending("objectId");
            if(caseno == 1){query.select("phone","name");}
              else if(caseno == 2){query.select("name","email");}
                else{query.select("phone","name","email");}
            query.find().then(function querySuccess(res) {
              processCallback(res);
            }, function queryFailed(error) {
              response.error("query unsuccessful, length of result " + result.length + ", error:" + error.code + " " + error.message);
            });
          }
      process(false);
}


//Inactive Teachers
//user teachers-usersActive
//function of in l1 not in l2 write here
//function by callof 2 functions here without exceeding api count
//kansal check->function check all*-????in that also
exports.getNamesAndEmails = function(request, response) {
  allUsers({}).then(function(alluser){
usersActiveInLastnMonths({
    "nval": request.params.nval
  }).then(function(activeusers){
    myArray = alluser.filter( function( el ) {
  return activeusers.indexOf( el ) < 0;
});
    response.success(true);
  },
  function(){
    response.error(false);
  });
  }, function(){
    response.error(false);
  });
}

//rentented teacher list
//retented parent list
//parent dropped