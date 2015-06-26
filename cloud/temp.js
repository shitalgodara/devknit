/* 
Function to set user profile 
  Input =>
    pname: String // Profile name
    pfile: File Pointer // Profile photo
  Output =>
    response: String // ok in case of success
  Procedure => 
    Simple query on Codegroup
*/
exports.cloudpic = function(request, response){
  var Codegroup = Parse.Object.extend("Codegroup");
  var query = new Parse.Query(Codegroup);
  query.select("Creator", "senderId", "classExist", "picName", "senderPic", "userId");
  query.equalTo("Creator", request.params.name);
  var pname = request.params.pname;
  var pfile = request.params.pfile;
  query.find({
    success: function(results) {
      alert("Successfully retrieved " + results.length + " scores.");
      // Do something with the returned Parse.Object values
      for (var i = 0; i < results.length; i++) {
        var object = results[i];
        object.set("senderPic", pfile);
        object.set("picName", pname);
        object.save();
      }
      response.success('ok');
    },
    error: function(error) {
      response.error("Error: " + error.code + " " + error.message);
    }
  });
}

// Image sizeing
/*
  var Image = require("parse-image");
  Parse.Cloud.beforeSave("GroupDetails", function(request, response) {
    var user = request.object;
    if (!user.get("attachment")) {
      response.error("Users must have a profile photo.");
      return;
    }
        
    if (!user.dirty("attachment")) {
      // The profile photo isn't being modified.
      response.success();
      return;
    }
        
    Parse.Cloud.httpRequest({
      url: user.get("attachment").url()
        
    }).then(function(response) {
      var image = new Image();
      return image.setData(response.buffer);
        
    }).then(function(image) {
      // Crop the image to the smaller of width or height.
      var size = Math.min(image.width(), image.height());
      return image.crop({
        left: (image.width() - size) / 2,
        top: (image.height() - size) / 2,
        width: size,
        height: size
      });
        
    }).then(function(image) {
      // Resize the image to 64x64.
      return image.scale({
        width: 64,
        height: 64
      });
        
    }).then(function(image) {
      // Make sure it's a JPEG to save disk space and bandwidth.
      return image.setFormat("JPEG");
        
    }).then(function(image) {
      // Get the image data in a Buffer.
      return image.data();
        
    }).then(function(buffer) {
      // Save the image into a new file.
      var base64 = buffer.toString("base64");
      var cropped = new Parse.File("thumbnail.jpg", { base64: base64 });
      return cropped.save();
        
    }).then(function(cropped) {
      // Attach the image file to the original object.
      user.set("attachment", cropped);
        
    }).then(function(result) {
      response.success();
    }, function(error) {
      response.error(error);
    });
  });
*/

/* 
getSeuence returns new unique number
*/
function getSequence() {
  var Test = Parse.Object.extend("Sequence");
  var query = new Parse.Query(Test);
  query.get("WxhFdmIB4k", {
      success: function(object) {
          object.increment('sequence');
          object.save(null, {
              success: function(object) {
                  var x = object.get('sequence');
                  console.log("X=" + x);
                  return x;
              },
              error: function(object, error) {
                  console.log('In error from getSequence save');
                  console.log(error);
                  return -1;
              }
          });
      },
      error: function(error) {
          console.log('In error from getSeq get');
          console.log(error);
          return -2;
      }
  });
}
    