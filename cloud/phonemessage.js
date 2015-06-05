/*sending message to phone users
function to send message to sms subscriber in case of text message ,changed limit of content to 300 words,limit of subscriber also removed
pattern of message is sender name:message
input classcode and messsage
output saying message send successfully or no number to send (if no member via sms) or error 
*/
exports.messagecc = function(request, response) {
    var c = request.params.classcode;
    var msg = request.params.message;
var username = request.user.get("name");

msg=username+" :"+msg;
    var Messageneeders = Parse.Object.extend("Messageneeders");
    var query = new Parse.Query(Messageneeders);
    var mlist = "";
   msg = msg.substr(0, 330);
    query.equalTo("cod", c);
    query.find({
        success: function(results) {
            console.log(results.length);
            if (results) {
                for (var i = 0; i < results.length; i++) {
                    var object = results[i];
                    var a = object.get('number');
                    if (i == 0) {
                        mlist = a;
                    } else {
                        mlist = mlist + "," + a;
                    }
                }
                if (results.length > 0) {
                    Parse.Cloud.httpRequest({
                        url: 'http://enterprise.smsgupshup.com/GatewayAPI/rest',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        params: {
                            method: 'sendMessage',
                            send_to: mlist,
                            msg: msg,
                            msg_type: 'Text',
                            userid: '2000133095',
                            auth_scheme: 'plain',
                            password: 'wdq6tyUzP',
                            v: '1.0',
                            format: 'text'
                        },
                        success: function(httpResponse) {
                            //alert(httpResponse.text + ":" + httpResponse.status);
                            console.log(httpResponse.text);
                            response.success("Messsage send successfully");
                        },
                        error: function(httpResponse) {
                            console.error('Request failed with response code ' + httpResponse.status);
                            response.error(httpResponse.text);
                        }
                    });
                } else {
                    response.success('no number to send');
                }
            }
        },
        error: function(error) {
console.log("Error: " + error.code + " " + error.message);
response.error(error.message);
        }
    });
}

    


/*
function to send message to phone user in case of their teacher had sent and image attached message giving applink to download
latter ios app link has to be added
input classcode and output string saying done or no number to send or error
input have no field text message for this have to use previous funciton as this message is separate message*/
exports.samplemessage = function(request, response) {
    var c = request.params.classcode;
var username = request.user.get("name");
//msg=username+" :"+msg;

   // var nam = request.params.classname;
    var Messageneeders = Parse.Object.extend("Messageneeders");
    var query = new Parse.Query(Messageneeders);
    var mlist = "";
    
    msg = "Your Teacher "+username+" has sent you an attachment,we can't send you pics over mobile,so download our android-app http://goo.gl/Ptzhoa";
    query.equalTo("cod", c);
    
    query.find({
        success: function(results) {
            alert("Successfully retrieved " + results.length + " scores.");
            if (results) {
                for (var i = 0; i < results.length; i++) {
                    var object = results[i];
                    var a = object.get('number');
                    if (i == 0) {
                        mlist = a;
                    } else {
                        mlist = mlist + "," + a;
                    }
                }
                if (results.length > 0) {
                    Parse.Cloud.httpRequest({
                        url: 'http://enterprise.smsgupshup.com/GatewayAPI/rest',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        params: {
                            method: 'sendMessage',
                            send_to: mlist,
                            msg: msg,
                            msg_type: 'Text',
                            userid: '2000133095',
                            auth_scheme: 'plain',
                            password: 'wdq6tyUzP',
                            v: '1.0',
                            format: 'text'
                        },
                        success: function(httpResponse) {
                            alert(httpResponse.text + ":" + httpResponse.status);
                            console.log(httpResponse.text);
                            response.success("Done");
                        },
                        error: function(httpResponse) {
                            console.error('Request failed with response code ' + httpResponse.status);
                            response.error(httpResponse.text);
                        }
                    });
                } else {
                    response.success('no number to send');
                }
            }
        },
        error: function(error) {
            console.log("Error: " + error.code + " " + error.message);
		response.error(error.message);
        }
    });
}
