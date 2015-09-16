/*
Function to return FAQs
  Input =>
    Date: String // Last date locally updated date available else 1st Nov 2014( some random old date)
  Output =>
    Array of objects of FAQs // Different according to different roles
  Procedure =>
    Simple query on FAQ
*/
exports.faq = function(request, response){
  var role = request.user.get("role");
  var date = request.params.date;
  var query = new Parse.Query("FAQs");
  if (role == "parent"){
    query.equalTo("role", "Parent");
  }
  query.select("question", "answer");
  query.greaterThan("updatedAt", date);
  query.find().then(function(faqs){
    response.success(faqs);
  }, function(error) {
    response.error(error.code + ": " + error.message);
  });
}

/*
Function to submit feedback 
  Input =>
    feed: String // Feedback content
  Output =>
    flag: Bool // true in case of success otherwise false 
  Procedure =>
    Simple save query on feedback table
*/
exports.feedback = function(request, response){
  var feed = request.params.feed;
  var Feedbacks = Parse.Object.extend("Feedbacks");
  var feedback = new Feedbacks();
  feedback.set("content", feed);
  feedback.set("emailId", request.user.get("username"));
  feedback.save().then(function(feedback){
    response.success(true);
  }, function(error){
    response.error(error.code + ": " + error.message);
  });
}