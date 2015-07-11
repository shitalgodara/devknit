/*
Function to get yesterday signups
  Input =>
    Nothing 
      or 
    Date: String // date of requested data
  Output =>
    Parse.User objects{
      username: String
      phone: String 
      name: String 
      Created_groups: Array
    }
  Procedure =>
    A simple query on user table
*/
exports.yesterdayNewSignUpDetails = function(request, response){
	var date = request.params.date;
  var today = new Date();
  if(typeof date !='undefined'){
	  today = date;
    today = new Date(today.getTime() + 86400000);
  }
	today.setHours(0);
	today.setMinutes(0);
	today.setSeconds(0);
	today.setMilliseconds(0);
	today = new Date(today);
	var yesterday = new Date(today.getTime() - 86400000);
  var query = new Parse.Query(Parse.User);
  query.equalTo("role", "teacher");
  query.greaterThan("createdAt", yesterday);
  query.lessThan("createdAt", today);
  query.descending("createdAt");
  query.select("username", "phone", "name", "Created_groups");
  query.find({
    success: function(results){
      response.success(results)
    },
    error: function(error){
      response.error(error.message + error.code);
    }
  });
}

/*
Function to save followup details
  Input =>
    name: String
    phone: String
    status: String
    person: Stinrg 
    date: String 
    remarks: String
  Output =>
    flag: Bool
  Procedure =>
    A simple query on FollowUp
*/
exports.updateFollowUpDetails = function(request, response){
  var FolllowUp = Parse.Object.extend("FolllowUp");
  var folllowUp = new FolllowUp();
  folllowUp.save({
    name: request.params.name,
    phone: request.params.phone,
    status: request.params.status,
    folllowUpPerson: request.params.person ,
    nextFollowUpDate: request.params.date,
    Remarks: request.params.remarks
  }, {
    success: function(Object){
      response.success(true);
    },
    error: function(Object, error){
      response.error(error);
    }
  });
}

/*
Function to get todays follow targets
  Input =>
    Nothing
  Output =>
    todays followup parse objects{
      name: String
      phone: String
      status: String
      person: Stinrg 
      date: String 
      remarks: String
    }
  Procedure =>
    A simple query on FollowUp
*/
exports.getTodaysFollowUpDetails = function(request, response){
  var today = new Date();
	today.setHours(0);
	today.setMinutes(0);
	today.setSeconds(0);
	today.setMilliseconds(0);
	today = new Date(today);
	var FolllowUp = Parse.Object.extend("FolllowUp");
  var query = new Parse.Query(FolllowUp);
  query.equalTo("nextFollowUpDate", today);
  query.find({
    success: function(results){
      response.success(results);
    },
    error: function(error){
      response.error(error.message + error.code);
    }
  });
}

/*
Function to get how many signedup of tried user , sms, call db
  Input =>
    Array of numbers
  Output =>
    Parse.User objects{
      username: String
      phone: String
      name: String
      created_groups: Array
    }
  Procedure =>
    A simple query on user table
*/
exports.expectedSignups = function(request, response){
	var numbers = request.params.numbers;
  var query = new Parse.Query(Parse.User);
  query.containedIn("phone", numbers);
  query.descending("createdAt");
  query.select("phone", "name");
  query.find({
    success: function(results){
      response.success(results)
    },
    error: function(error){
      response.error(error.message + error.code);
    }
  });
}

function HashTable(obj){
  this.length = 0;
  this.items = {};
  for(var p in obj){
    if(obj.hasOwnProperty(p)){
      this.items[p] = obj[p];
      this.length++;
    }
  }

  this.setItem = function(key, value){
    var previous = undefined;
    if(this.hasItem(key)){
      previous = this.items[key];
    }
    else
      this.length++;
    this.items[key] = value;
    return previous;
  }

  this.getItem = function(key){
    return this.hasItem(key) ? this.items[key] : undefined;
  }

  this.hasItem = function(key){
    return this.items.hasOwnProperty(key);
  }
 
  this.removeItem = function(key){
    if(this.hasItem(key)){
      var previous = this.items[key];
      this.length--;
      delete this.items[key];
      return previous;
    }
    else
      return undefined;
  }

  this.keys = function(){
      var keys = [];
      for(var k in this.items){
          if(this.hasItem(k)){
              keys.push(k);
          }
      }
      return keys;
  }

  this.values = function(){
    var values = [];
    for(var k in this.items){
      if(this.hasItem(k)){
        values.push(this.items[k]);
      }
    }
    return values;
  }

  this.each = function(fn){
    for(var k in this.items){
      if(this.hasItem(k)){
        fn(k, this.items[k]);
      }
    }
  }

  this.clear = function(){
    this.items = {};
    this.length = 0;
  }
}

/*
Function to get how many signedup of tried user , sms, call db
  Input =>
    Array of numbers: String // phone numbers of users who have created account
  Output =>
    Parse.User objects{
      username: String 
      phone: String 
      name: String 
      Created_groups: Array
    }
  Procedure =>
    A simple query on user table
*/
exports.statusOfAllUsers = function(request, response){
  var numbers = request.params.numbers;
  var h = new HashTable();
  for(var i = 0; i < numbers.length; i++){
    h.setItem(numbers[i], ["", 0, 0, 0,-1,[]]);
  }
  var codegroup = Parse.Object.extend("Codegroup");
  var query = new Parse.Query(codegroup);
  query.containedIn("senderId", numbers);
  query.descending("createdAt");
  query.select("code", "Creator", "senderId");
  query.find({
    success: function(results){
      var h2 = new HashTable();
      var classcodes = [];
      for(var i = 0; i < results.length; i++){
        var code = results[i].get("code");
        h2.setItem(results[i].get("code"), 0);
        classcodes.push(code);
        var item = results[i].get("senderId");
        var temp_array = h.getItem(item);
        if(temp_array[1] == 0){
          temp_array[0] = results[i].get("Creator");
        }
        temp_array[1] = temp_array[1] + 1;
        temp_array[5].push(code);
        h.setItem(item, temp_array);
      }
      var groupmembers = Parse.Object.extend("GroupMembers");
      var query = new Parse.Query(groupmembers);
      query.containedIn("code", classcodes);
      query.descending("createdAt");
      query.select("code");
      query.find({
        success: function(results){
          for(var i = 0; i < results.length; i++){
            var code = results[i].get("code");
            h2.setItem(code, h2.getItem(code) + 1);  
          }
          var groupdetails = Parse.Object.extend("GroupDetails");
          var query = new Parse.Query(groupdetails);
          query.containedIn("senderId", numbers);
          query.descending("createdAt");
          query.select("senderId");
          query.find({
            success: function(results){
              for(var i = 0; i < results.length; i++){
                var item = results[i].get("senderId");
                var temp_array = h.getItem(item);
                temp_array[3] = temp_array[3] + 1;
                if(temp_array[3] == 1)
                  temp_array[4] = results[i].createdAt;
                h.setItem(item, temp_array);
              }
              for(var i = 0, keys = h.keys(), len = keys.length; i < len; i++){
                var temp_array = h.getItem(keys[i]);
                for(var j = 0; j < temp_array[5].length; j++){
                  temp_array[3] = temp_array[3] + h2.getItem(temp_array[5][j]);
                }
              }
              response.success(h);
            },
            error: function(error){
              response.error(error.message + error.code);
            }
          });
        },
        error: function(error){
          response.error(error.message + error.code);
        }
      });
    },
    error: function(error){
      response.error(error.message + error.code);
    }
  });
}

/*
Function to get how many signedup of tried user, sms, call db
  Input =>
    Array of numbers who have created account
  Output =>
    Parse user objects{
      username: String
      phone: String
      name: String
      Created_groups: Array
  Procedure =>
    A simple query on user table
*/
exports.KnitDiagram = function(request, response){
  var today = new Date();
  var h = new HashTable();
  var numbers = [];
  var one_month_ago = new Date(today.getTime()-2592000000);
  var query = new Parse.Query(Parse.User);
  query.equalTo("role", "teacher");
  query.lessThan("createdAt", one_month_ago);
  query.select("username");
  query.limit(1000);
  query.find({
    success: function(results){
      for(var i = 0; i < results.length; i++){
        var temp_user = results[i].get("username");
        h.setItem(temp_user, [0,-1]);
        numbers.push(temp_user);
      }
      var groupdetails = Parse.Object.extend("GroupDetails");
      var query = new Parse.Query(groupdetails);
      query.containedIn("senderId", numbers);
      query.select("senderId");
      query.descending("createdAt");
      query.limit(1000);
      query.find({
        success: function(results){
          for(var i = 0; i < results.length; i++){
            var item = results[i].get("senderId");
            var temp_array = h.getItem(item);
            temp_array[0] = temp_array[0] + 1;
            if(temp_array[0] == 1)
              temp_array[1] = results[i].createdAt;
            h.setItem(item, temp_array);
          }
          var a = new Array(5);
          a[0] = 0; a[1] = 0; a[2] = 0; a[3] = 0; a[4] = 0;
          var groupdetails = Parse.Object.extend("GroupDetails");
          var query = new Parse.Query(groupdetails);
          query.containedIn("senderId", numbers);
          query.select("senderId");
          query.descending("createdAt");
          query.skip(1000);
          query.limit(1000);
          query.find({
            success: function(results){
              for(var i = 0; i < results.length; i++){
                var item = results[i].get("senderId");
                var temp_array = h.getItem(item);
                temp_array[0] = temp_array[0] + 1;
                if(temp_array[0] == 1)
                  temp_array[1] = results[i].createdAt;
                h.setItem(item, temp_array);
              }
              var groupdetails = Parse.Object.extend("GroupDetails");
              var query = new Parse.Query(groupdetails);
              query.containedIn("senderId", numbers);
              query.select("senderId");
              query.descending("createdAt");
              query.skip(1000);
              query.limit(1000);
              query.find({
                success: function(results){
                  for(var i = 0; i < results.length; i++){
                    var item = results[i].get("senderId");
                    var temp_array = h.getItem(item);
                    temp_array[0] = temp_array[0] + 1;
                    if(temp_array[0] == 1)
                      temp_array[1] = results[i].createdAt;
                    h.setItem(item, temp_array);
                  }
                  var mm = 0;
                  for(var i = 0, keys = h.keys(), len = keys.length; i < len; i++){
                    var temp_array = h.getItem(keys[i]);
                    var msgs = temp_array[0];
                    var lastdate = temp_array[1];
                    mm = mm + msgs;
                    if(msgs == 0){
                      h.setItem("drop_01"); 
                      a[0]++;
                    }
                    else if((msgs < 50) && (lastdate >= one_month_ago)){
                      h.setItem("User"); 
                      a[1]++;
                    }
                    else if((msgs < 50) && (lastdate < one_month_ago)){
                      h.setItem("drop_2");
                      a[2]++;
                    }
                    else if((msgs<= 50) && (lastdate >= one_month_ago)){
                      h.setItem("Retened");
                      a[3]++;
                    }
                    else if((msgs<= 50) && (lastdate < one_month_ago)){
                      h.setItem("drop_3"); 
                      a[4]++;
                    }
                  }
                  response.success(mm);
                },
                error: function(error){
                  response.error(error.message + error.code);
                }
              });
            },
            error: function(error){ 
              response.error(error.message + error.code);
            }
          });
        },
        error: function(error){
          response.error(error.message + error.code);
        }
      });
    },
    error: function(error){
      response.error(error.message + error.code);
    }
  });
}

//getretened email id
exports.getEmailId = function(request, response){
  var today = new Date();
  var h = new HashTable();
  var numbers = [];
  var one_month_ago = new Date(today.getTime() - 2592000000);
  var query = new Parse.Query(Parse.User);
  query.equalTo("role", "teacher");
  query.lessThan("createdAt", one_month_ago);
  var two_month_ago = new Date(one_month_ago.getTime() - 2592000000);
  var three_month_ago = new Date(two_month_ago.getTime() - 2592000000);
  var four_month_ago = new Date(three_month_ago.getTime() - 2592000000);
  query.select("username");
  query.limit(1000);
  query.find({
    success: function(results){
      for(var i = 0; i < results.length; i++){
        var temp_user = results[i].get("username");
        h.setItem(temp_user, [0,-1]);
        numbers.push(temp_user);
      }
      var groupdetails = Parse.Object.extend("GroupDetails");
      var query = new Parse.Query(groupdetails);
      query.containedIn("senderId", numbers);
      query.select("senderId");
      query.descending("createdAt");
      query.limit(1000);
      query.find({
        success: function(results){
          for(var i = 0; i < results.length; i++){
            var item = results[i].get("senderId");
            var temp_array = h.getItem(item);
            temp_array[0] = temp_array[0] + 1;
            if(temp_array[0] == 1)
              temp_array[1] = results[i].createdAt;
            h.setItem(item, temp_array);
          }
          var a = new Array(5);
          a[0] = 0; a[1] = 0; a[2] = 0; a[3] = 0; a[4] = 0;
          var groupdetails = Parse.Object.extend("GroupDetails");
          var query = new Parse.Query(groupdetails);
          query.containedIn("senderId", numbers);
          query.select("senderId");
          query.descending("createdAt");
          query.skip(1000);
          query.limit(1000);
          query.find({
            success: function(results){
              for(var i = 0; i < results.length; i++){
                var item = results[i].get("senderId");
                var temp_array = h.getItem(item);
                temp_array[0] = temp_array[0] + 1;
                if(temp_array[0] == 1)
                  temp_array[1] = results[i].createdAt;
                h.setItem(item, temp_array);
              }
              var groupdetails = Parse.Object.extend("GroupDetails");
              var query = new Parse.Query(groupdetails);
              query.containedIn("senderId", numbers);
              query.select("senderId");
              query.descending("createdAt");
              query.skip(1000);
              query.limit(1000);
              query.find({
                success: function(results){
                  for(var i = 0; i < results.length; i++){
                    var item = results[i].get("senderId");
                    var temp_array = h.getItem(item);
                    temp_array[0] = temp_array[0] + 1;
                    if(temp_array[0] == 1)
                      temp_array[1] = results[i].createdAt;
                    h.setItem(item, temp_array);
                  }
                  var mm = 0;
                  var ids = new Array();
                  for(var i = 0, keys = h.keys(), len = keys.length; i < len; i++){
                    var temp_array = h.getItem(keys[i]);
                    var msgs = temp_array[0];
                    var lastdate = temp_array[1];
                    mm = mm + msgs;
                    if(msgs == 0){
                      h.setItem("drop_01"); 
                      a[0]++;
                    }
                    else if((msgs < 20) && (lastdate>= four_month_ago)){
                      h.setItem("User"); 
                      a[1]++; 
                      ids.push(keys[i]);
                    }
                    else if((msgs < 20) && (lastdate < four_month_ago)){
                      h.setItem("drop_2"); 
                      a[2]++;
                    }
                    else if((msgs>= 20) && (lastdate>= four_month_ago)){
                      h.setItem("Retened"); 
                      a[3]++;
                    }
                    else if((msgs>= 20) && (lastdate < four_month_ago)){
                      h.setItem("drop_3"); 
                      a[4]++;
                    }
                    else{
                      a[5]++; 
                    }
                  }
                  response.success(ids);
                },
                error: function(error){
                  response.error(error.message + error.code);
                }
              }); 
            },
            error: function(error){
              response.error(error.message + error.code);
            }
          });
        },
        error: function(error){
          response.error(error.message + error.code);
        }
      });
    },
    error: function(error){
      response.error(error.message + error.code);
    }
  });
}