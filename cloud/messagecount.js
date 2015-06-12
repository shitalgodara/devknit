/*
function for getting counts of like,confusion and seen after a given time
input array{array of message Id }
output objects of groupdetails with fields like_count,confused_count,seen_count
simple query on groupdetail 
*/
//old input date,limit and classtype
exports.updateCount= function(request, response) {
    var GroupDetails = Parse.Object.extend("GroupDetails");
    var query = new Parse.Query("GroupDetails");
        var array=request.params.array;

    /*
    var limit = request.params.limit;
    if(typeof limit !=undefined){
    var date = request.params.date;
    //#*#console.log(limit);
    //#*#console.log(date);
    query.lessThan("createdAt",date);
    query.limit(limit);
}

var type = request.params.classtype;
//#*#console.log(type);
if(type=='c'){
 var clarray1 = request.user.get("Created_groups");
var clarray=[];
if(typeof clarray1 != 'undefined'){
  for (var i = 0; i < clarray1.length; i++) {
clarray[i]=clarray1[i][0];
}
}
}
else if(type=='j'){
 var clarray1 = request.user.get("joined_groups");
var clarray=[];
if(typeof clarray1 != 'undefined'){
  for (var i = 0; i < clarray1.length; i++) {
clarray[i]=clarray1[i][0];
}
}
}
*/
//#*#console.log(clarray);
    //query.select("seen_count", "like_count","confused_count");
//    query.containedIn("code", clarray);
query.containedIn("objectId",array);
    query.find({
        success: function(results) {
/*##
for(var i=0;i<results.length;i++){
console.log(results[i].id+"$$"+results[i].get("seen_count")+"$$"+results[i].get("like_count")+"$$"+results[i].get("confused_count"));
}
##*/
response.success(results);
        },
        error: function(error) {
            response.error("Error: " + error.code + " " + error.message);
        }
    });
}

/*
function for updating seen count
input array{array of message Id }
output bool true
simple query on groupdetail 
*/
//old input date,limit and classtype
exports.updateSeenCount= function(request, response) {
    var array=request.params.array;
    var GroupDetails = Parse.Object.extend("GroupDetails");
    var query = new Parse.Query("GroupDetails");
    query.containedIn("objectId",array);
    query.select("seen_count");
    query.find({
        success: function(results) {

console.log(results.length);
//console.log(results[(results.length)/2].id);
var allObjects = [];
for (var i = 0; i <results.length; i++) { 
    results[i].increment("seen_count");
    allObjects.push(results[i]);
}
Parse.Object.saveAll(allObjects, {
        success: function(objs) {
/*##
for(var i=0;i<results.length;i++){
console.log(results[i].id+"$$"+results[i].get("seen_count")+"$$"+results[i].get("like_count")+"$$"+results[i].get("confused_count"));
}
##*/
response.success(true);
        },
        error: function(error) {
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
function for updating like and confuse count
input->  input json object with key as msgid and value 1-d array of 2 elements with like and confusion change
output-> bool true
simple query on groupdetail and message state
*/

//old input date,limit and classtype
//saveall,hash to iterate,promises for all,last loop() 3 diff cases parrlle query 1 exist)
//promises parrelleize all for loop query loop ,exist point and also in for loop faster then query  and in parrlleel also 1,2 query differenti neach
//2 for loop then in further 1,2 loop of serial and different in each case
exports.updateLikeAndConfusionCount= function(request, response) {
var _ = require('underscore.js');
var input=request.params.input;
var msg_array=Object.keys(input);
//var msg_array=input.keys();
console.log(msg_array);
var msgarray=request.params.array;
    var GroupDetails = Parse.Object.extend("GroupDetails");
    var query = new Parse.Query("GroupDetails");
    query.containedIn("objectId",msgarray);
    query.select("confused_count","like_count");
    query.find({
        success: function(results) {

console.log(results.length);
//console.log(results[(results.length)/2].id);
var allObjects = [];
for (var i = 0; i <results.length; i++) { 
    console.log(results[i].id);
var temp=input[results[i].id];
console.log(temp);
    results[i].increment("like_count",temp[0]);
    results[i].increment("confused_count",temp[1]);
    allObjects.push(results[i]);
}
    

Parse.Object.saveAll(allObjects).then(function(results) {
  // Collect one promise for each delete into an array.
  var promises = [];
  _.each(results, function(result) {
    // Start this delete immediately and add its promise to the list.

    if((input[result.id][0]+input[result.id][1])==-1){
        //destroy
        //find and destroy
        console.log("destroy");
        promises.push((function(){
                var promise = new Parse.Promise();
        var query_destroy = new Parse.Query('MessageState');

        query_destroy.equalTo("message_id",result.id);
        query_destroy.equalTo("username",request.user.get("username"));
        console.log(request.user.id);
        console.log(result.id);
                query_destroy.first({  // this doesnt seem to ever run, i have tried .each as well
                    success: function(object) {
                        console.log(object);
                        object.destroy({
                            success: function(object) {
                                promise.resolve();
                            }
                        });
                    },
                    error: function(error) {
                        response.error(error);
                    }
                });
                return promise;
            })());
    }
    else if((input[result.id][0]+input[result.id][1])==0){
        //update
        //find and update
        var flag2 =false;
        var flag1=true;
        if(input[result.id][0]==-1){flag1=false;flag2=true;}
        console.log("update");
        promises.push((function(){
                var promise = new Parse.Promise();
    var query_update = new Parse.Query('MessageState');
    query_update.equalTo("message_id",result.id);
        query_update.equalTo("username",request.user.get("username"));
        console.log(request.user.id);
        console.log(result.id);
                query_update.first({  // this doesnt seem to ever run, i have tried .each as well
                    success: function(object) {
                        console.log(object);
                        object.set('like_status',flag1 );
                        object.set('confused_status', flag2);
                        object.save({
                            success: function(object) {
                                promise.resolve();
                            }
                        });
                    },
                    error: function(error) {
                        response.error(error);
                    }
                });
                return promise;
            })());
    }
    else if((input[result.id][0]+input[result.id][1])==1){
        //create
        var flag1 =false;
        var flag2=true;
        if(input[result.id][0]==1){flag1=true;flag2=false;}
        console.log(result.id);
        var messagestates = Parse.Object.extend("MessageState");
        var query_create = new messagestates();
                    promises.push(query_create.save({"username":request.user.get("username"),"message_id":result.id,"like_status":flag1,"confused_status":flag2}));
    }

  });
  // Return a new promise that is resolved when all of the deletes are finished.
  return Parse.Promise.when(promises);
 
}).then(function() {
  // Every comment was deleted.
  response.success(true);

});


        },
        error: function(error) {
            response.error("Error: " + error.code + " " + error.message);
        }
    });


}
/*
function for getting counts of like,confusion and seen after a given time
input array{array of message Id }
output json object with key as msgid and value as 1-d array of 3 elements seen,like,confused count
simple query on groupdetail 
*/
//old input date,limit and classtype
exports.updateCount2= function(request, response) {
    var GroupDetails = Parse.Object.extend("GroupDetails");
    var query = new Parse.Query("GroupDetails");
        var array=request.params.array;

//#*#console.log(clarray);
    query.select("seen_count", "like_count","confused_count");
//    query.containedIn("code", clarray);
query.containedIn("objectId",array);
    query.find({
        success: function(results) {
/*##
for(var i=0;i<results.length;i++){
console.log(results[i].id+"$$"+results[i].get("seen_count")+"$$"+results[i].get("like_count")+"$$"+results[i].get("confused_count"));
}
##*/
var result={};
for(var i=0;i<results.length;i++){
    var x=0;
    var y=0;
    var z=0;
    if(typeof results[i].get("seen_count") != 'undefined'){x=results[i].get("seen_count");}
        if(typeof results[i].get("like_count") != 'undefined'){y=results[i].get("like_count");}
            if(typeof results[i].get("confused_count") != 'undefined'){z=results[i].get("confused_count");}
    var temp_array=[x,y,z];
    result[results[i].id]=temp_array;
}
response.success(result);
        },
        error: function(error) {
            response.error("Error: " + error.code + " " + error.message);
        }
    });
}

/*
function for getting counts of like,confusion and seen after a given time
input date,limit and classtype
output objects of groupdetails with fields like_count,confused_count,seen_count
simple query on groupdetail 
*/
exports.updateCounts= function(request, response) {
    var GroupDetails = Parse.Object.extend("GroupDetails");
    var query = new Parse.Query("GroupDetails");
    var limit = request.params.limit;
    var date = request.params.date;
console.log(limit);
console.log(date);
    query.lessThan("createdAt",date);
    query.limit(limit);
var type = request.params.classtype;
console.log(type);
if(type=='c'){
 var clarray1 = request.user.get("Created_groups");
var clarray=[];
if(typeof clarray1 != 'undefined'){
  for (var i = 0; i < clarray1.length; i++) {
clarray[i]=clarray1[i][0];
}
}
}
else if(type=='j'){
 var clarray1 = request.user.get("joined_groups");
var clarray=[];
if(typeof clarray1 != 'undefined'){
  for (var i = 0; i < clarray1.length; i++) {
clarray[i]=clarray1[i][0];
}
}
}

console.log(clarray);
    query.select("seen_count", "like_count","confused_count");
    query.containedIn("code", clarray);
    query.find({
        success: function(results) {
/*##
for(var i=0;i<results.length;i++){
console.log(results[i].id+"$$"+results[i].get("seen_count")+"$$"+results[i].get("like_count")+"$$"+results[i].get("confused_count"));
}
##*/
response.success(results);
        },
        error: function(error) {
            response.error("Error: " + error.code + " " + error.message);
        }
    });
}
