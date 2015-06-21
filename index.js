var express = require('express');
var needle = require('needle');
var app = express();

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

app.get('/', function(request, response) {
  response.send("Hello world again");
});

app.get('/subscription/request', function(request, response) {

   if(typeof request.query["hub.challenge"] !== "string"){ // ignore as this isn't from instagram API
      response.send("bacon"); 	
    }
	else{ //if the call is successful, echo back challenge
      response.send( request.query["hub.challenge"]); 	
	}
  
});

app.get('/authorize/redirect', function(request, response){

	var authEndpoint = ''; 
	var client_id = '617bb2656c9d46ccbc3a603106230bf0'; 
	var client_secret = '8e76d033812d47aa95b8e65b3b5c01c1'; 
	var redirect_uri = 'https://mike-s-imagestreamer.herokuapp.com/authorize/success'; 
    var code = request.query['code']; 
    
    var post_data = {
    	"client_id": client_id, 
    	"client_secret": client_secret,
    	"grant_type": authorization_code,  
    	"code": code
    }; 

    var options = []; 

    needle.post('https://api.instagram.com/oauth/access_token', post_data,  options, function(err, resp) {
      console.log("we should have the token now"); 
	});

    response.send("Redirecting"); 
	
}); 

app.get('/authorize/redirect/success', function(request, response){
	response.send("Authorization successful!"); 
}); 

app.get('/authorize', function(request, response){
	var authEndpoint = ''; 
	var client_id = '617bb2656c9d46ccbc3a603106230bf0'; 
	var client_secret = ''; 
	var redirect_uri = 'https://mike-s-imagestreamer.herokuapp.com/authorize/success'; 

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
