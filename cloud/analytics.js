
/*
input 
output 3-d array of size [4][30][5] containing data of platform wise ,then date wise then role wise
4->ios,android,web ,extra 30 days,5 Total,date ,teacher,parent ,student
function to get data of last 30 days newsignu counts
a simple query on user
*/

exports.newSignUps = function(request, response) {
	var today= new Date();
	today.setHours(0);
	today.setMinutes(0);
	today.setSeconds(0);
	today=new Date(today);
	var fourweekbefore=new Date(today.getTime()-2592000000);
	console.log(today);
	console.log(fourweekbefore);
var query = new Parse.Query(Parse.User);
query.greaterThan("createdAt",fourweekbefore);
query.lessThan("createdAt",today);
query.select("OS","role");
query.limit(1000);
query.find({
  success: function(results) {
  	console.log(results.length);
  	var index;
  	var data=new Array(4);
  	for (i=0; i <4; i++){ data[i]=new Array(30);}
  		for (i=0; i <4; i++){
  	for (j=0; j <30; j++){
    data[i][j]=new Array(5);
}
}
  	for(var i=0;i<results.length;i++){
  		var objDate=results[i].createdAt;
  		if(results[i].get("OS")=='IOS'){index=0;}
  				else if(results[i].get("OS")=='ANDROID'){index=1;}
  				else if(results[i].get("OS")=='WEB'){index=2;}
  				else{index=3;}
  		var nextday=new Date(fourweekbefore.getTime()+86400000);
  		var prevday=fourweekbefore;
  		for(var j=0;j<30;j++){
  			if((objDate<nextday)&&(objDate>prevday)){
  				if(typeof data[index][j][0]=='undefined'){
  					data[index][j][0]=1;data[index][j][1]=prevday;
  					if(results[i].get("role")=='teacher'){data[index][j][2]=1;}
  					else if(results[i].get("role")=='parent'){data[index][j][3]=1}
  					else if(results[i].get("role")=='student'){data[index][j][4]=1}
  				}
  				else{
  					data[index][j][0]=data[index][j][0]+1;
  					if(results[i].get("role")=='teacher'){
  						if(typeof data[index][j][2]=='undefined'){
  							data[index][j][2]=1;}
  							else{data[index][j][2]=data[index][j][2]+1;}
  						}
  					else if(results[i].get("role")=='parent'){
						if(typeof data[index][j][3]=='undefined'){
  							data[index][j][3]=1;}
  							else{data[index][j][3]=data[index][j][3]+1;}
  						}
  					else if(results[i].get("role")=='student'){
  						if(typeof data[index][j][4]=='undefined'){
  							data[index][j][4]=1;}
  							else{data[index][j][4]=data[index][j][4]+1;}
  						}
  					}
  					break;
  				}
  				var prevday=nextday;
  				var nextday=new Date(nextday.getTime()+86400000);
  			}
  			
  		}
response.success(data)
  },
  error: function(error) {
response.error(error.message+error.code);
  }
});

}

/*
input 
output 1-d array of size [30] containing data 
function to get data of last 30 days message sent
a simple query on user
*/
/*
for fututre purpose 
output 3-d array of size [4][30][3] containing data of platform wise ,then date wise then attachement or not wise
function to get data of last 30 days message sent
4->ios,android,web ,extra 30 days,5 withoutattachment,date ,withattachment

*/
exports.newMessageSent = function(request, response) {
	var today= new Date();
	today.setHours(0);
	today.setMinutes(0);
	today.setSeconds(0);
	today=new Date(today);
	var fourweekbefore=new Date(today.getTime()-2592000000);
	console.log(today);
	console.log(fourweekbefore);
	var GroupDetails = Parse.Object.extend("GroupDetails");
var query = new Parse.Query(GroupDetails);
query.greaterThan("createdAt",fourweekbefore);
query.lessThan("createdAt",today);
query.limit(1000);
query.select();
query.find({
  success: function(results) {
  	console.log(results.length);
  	var data=new Array(30);
  	for(var i=0;i<results.length;i++){
  		var objDate=results[i].createdAt;
  		var nextday=new Date(fourweekbefore.getTime()+86400000);
  		var prevday=fourweekbefore;
  		for(var j=0;j<30;j++){
  			if((objDate<nextday)&&(objDate>prevday)){
  				if(typeof data[j]=='undefined'){
  					data[j]=1;
  				}
  				else{
  					data[j]++;
  				}
  				break;
  			}
  				var prevday=nextday;
  				var nextday=new Date(nextday.getTime()+86400000);
  			}
  			
  		}
response.success(data)
  },
  error: function(error) {
response.error(error.message+error.code);
  }
});

}

var Set = require('cloud/SetFolder/src/set').Set;
/*
input nothing
output integer no of active messagenes in last month
function to get unique messagesender in last month
a simple query on groupdetail and use set
*/
exports.activeMessenger = function(request, response) {
	var today= new Date();
	today.setHours(0);
	today.setMinutes(0);
	today.setSeconds(0);
	today=new Date(today);
	var fourweekbefore=new Date(today.getTime()-2592000000);
	console.log(today);
	console.log(fourweekbefore);
	var GroupDetails = Parse.Object.extend("GroupDetails");
var query = new Parse.Query(GroupDetails);
query.greaterThan("createdAt",fourweekbefore);
query.lessThan("createdAt",today);
query.limit(1000);
query.select("senderId");
query.find({
  success: function(results) {
  	console.log(results.length);
  	var data = new Set();
  	for(var i=0;i<results.length;i++){
  		  		data.add(results[i].get("senderId"));
  		}
response.success(data.size);
  },
  error: function(error) {
response.error(error.message+error.code);
  }
});
}


