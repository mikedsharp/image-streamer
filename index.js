var express = require('express');
var needle = require('needle');
var app = express();

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

app.get('/', function(request, response) {
  response.send("Hello world again");
});

var client_id = '617bb2656c9d46ccbc3a603106230bf0'; 
var client_secret = '8e76d033812d47aa95b8e65b3b5c01c1'; 
var redirect = 'https://mike-s-imagestreamer.herokuapp.com'; 
var environment = 'dev';

if(environment == 'dev'){
    redirect = 'http://localhost:5000'; 
}


// subscriptions (node to real time API communication)
app.get('/subscription/request', function(request, response) {

   if(typeof request.query["hub.challenge"] !== "string"){ // ignore as this isn't from instagram API
      response.send(""); 	
    }
	else{ //if the call is successful, echo back challenge
      response.send( request.query["hub.challenge"]); 	
	}
  
});

app.get('/subscription/add', function(request, response) {

   if(typeof request.query["tag"] === "string"){ // ignore as this isn't from instagram API
     
     var tag = request.query["tag"]; 
     var options = []; 
 	 var post_data = {
 	 	"client_id" : client_id, 
 	 	"client_secret": client_secret, 
 	 	"object": "tag", 
 	 	"object_id": tag,
 	 	"aspect": "media", 
 	 	"verify_token": "media-request-from-imagestreamer", 
 	 	"callback_url": redirect + '/subscriptions/request'
 	 }; 

 	 needle.post('https://api.instagram.com/v1/subscriptions/', post_data, options, function(err, resp){

 	 	console.log("subscription successful");

 	 }); 


   }
	
  
});







// user authorization (to obtain actual media from content ids)
app.get('/authorize/redirect', function(request, response){

	var authEndpoint = ''; 
    var code = request.query['code']; 
   
    var redirect_uri = redirect + '/authorize/redirect'; 

    var post_data = {
    	"client_id": client_id, 
    	"client_secret": client_secret,
    	"grant_type": "authorization_code",  
    	"code": code, 
    	'redirect_uri': redirect_uri
    }; 

    var options = []; 

    needle.post('https://api.instagram.com/oauth/access_token', post_data,  options, function(err, resp) {
      console.log("we should have the token now"); 
      var access_token = resp.body.access_token; 
      response.cookie('access_token', access_token); 
      response.send("i am a response"); 
	});

   
	
}); 

app.get('/authorize/success', function(request, response){
	response.send("Authorization successful!"); 
}); 

app.get('/authorize', function(request, response){
	var authEndpoint = ''; 
	var redirect_uri =  redirect + '/authorize/redirect'; 

	authEndpoint = 'https://api.instagram.com/oauth/authorize/?client_id='
	+ client_id 
	+ '&redirect_uri=' 
	+  redirect_uri
	+ '&response_type=code'; 

	response.redirect(authEndpoint); 
}); 



app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
