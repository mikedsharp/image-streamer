var express = require('express');
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

app.get('/authorize/success', function(request, response){
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
