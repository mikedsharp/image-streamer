//server.js 

// packages 
var express = require('express');
var app = express();
var server = require('http').Server(app);
var bodyParser = require('body-parser'); 
var needle = require('needle'); 
var path = require('path');
var os = require("os");

// globals 
var subscribedTags = []; 
var maxsubscriptionlife = 60000; 
var client_id =  process.env.CLIENT_ID; 
var client_secret = process.env.CLIENT_SECRET;  
var redirect = process.env.HOST_URL; 

var environment = 'production';

var port = process.env.PORT || 5000;

var io = require('socket.io').listen(app.listen(port));


app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());  
app.use("", express.static(path.join(__dirname, 'public')));

// API ROUTES 
var router = express.Router(); 

router.use(function(req, res, next){
	// let routing propagate
	next(); 
}); 

// all api requests will be routed through here
router.get('/api', function  (request, response) {
	response.json({message: 'api reached'}); 
}); 

// TAG ROUTES 
router.route('/api/tag')
	.post(function(request, response){
		// obtain tagname and see if we already have it, if we do, update its expiration date, otherwise, call subscription APIs 
		var hashtag = request.body.hashtag; 
		var isSubscribed = subscribedTags.filter(function(value){
			return value.hashtag == hashtag; 
		}).length > 0; 

		if(isSubscribed){
			//no need to add, just update the max life
			for(currentsub in subscribedTags){
				if(subscribedTags[currentsub].hashtag == 'hashtag'){
					subscribedTags[currentsub].maxlife = new Date(new Date().getTime() + maxsubscriptionlife).getTime(); 
				}
			}
		}
		else{
			//call instagram API for real time subscription 
			var post_data = {
				"hashtag" : hashtag
			}
			var options = []; 

			needle.post(redirect + '/api/subscription', post_data, options, function(err, resp){
			}); 

		}
		response.json({message: "response request sent !"}); 

	})
	.get(function(request, response){
	response.json(subscribedTags); 
});

router.route('/api/tag/:hashtag')
	.get(function(request, response){
	for(currentsub in subscribedTags){
		if(subscribedTags[currentsub].hashtag == request.params.hashtag){
			response.json(subscribedTags[currentsub]); 
		}
	}
	response.json({message: 'no tag subscribed by that name.'}); 

})
	.delete(function(request, response){
	for(currentsub in subscribedTags){
		if(subscribedTags[currentsub].hashtag == request.params.hashtag){
			removeSubscription(subscribedTags[currentsub].subscription_id)
		}
	}
	response.json({message: 'no tag subscribed by that name.'}); 

}); 

router.route('/api/image/:hashtag')
	.get(function(request, response){
	var url = 'https://api.instagram.com/v1/tags/' + request.params.hashtag + '/media/recent' + '?access_token=' +  request.query.access_token; 

}); 


// INSTAGRAM SUBSCRIPTION ROUTES 

// subscriptions (node to real time API communication)
router.route('/api/subscription/new')
	.post(function(request, response) {
		// let users know in real time that there's a new image to stream
		io.emit('new recent image', request.body); 
		response.send(''); 

	}).get(function(request, response) {

   if(typeof request.query["hub.challenge"] !== "string"){ // ignore as this isn't from instagram API
	   	response.send(""); 	
	}
	else{ //if the call is successful, echo back challenge
		response.send(request.query["hub.challenge"]); 	
	}

});

router.route('/api/subscription')
	.post(function(request, response) {

		if(typeof request.body.hashtag === "string"){ 

			var tag = request.body.hashtag;
			var options = []; 
			var post_data = {
				"object": "tag", 
				"object_id": tag,
				"aspect": "media", 
				"callback_url": redirect + '/api/subscription/new'
			}; 

			needle.post('https://api.instagram.com/v1/subscriptions?client_id=' + client_id + '&client_secret=' + client_secret + '&verify_token=' + 'streamapp', post_data, options, function(err,response){
				if(response.statusCode == 200 ){
					console.log("request succeeded"); 
					subscribedTags.push({
						hashtag: response.body.data.object_id, 
						maxlife: new Date(new Date().getTime()+60000), 
						subscription_id:response.body.data.id
					}); 

				}
				else{
		 	    	//response.send('subscription failed\n Status Code: ' + resp.statusCode + '\n response message: ' /*+ resp.body.meta.error_message*/); 
		 	    	console.log("request failed"); 
		 	    }
		 	}); 
		}

		response.send('');

	}).get(function(request, response) {

   if(typeof request.query["hub.challenge"] !== "string"){ // ignore as this isn't from instagram API
   	response.send(""); 	
	}
   else{ //if the call is successful, echo back challenge
   	response.send(request.query["hub.challenge"]); 	
   }

});

router.route('/api/subscription/:id')
	.delete(function(request, response) {
		if(typeof request.params.id === "string"){ 

 	 	 // remove subscriptions by subscription id 
 	 	 var id = request.params.id; 
 	 	 var options = []; 
 	 	 var post_data = {
 	 	 }; 

 	 	 removeSubscription(id); 
 	 	 response.json({message : "subscription removed"});
		}
 	}); 

	router.route('/api/user/authorize')
	.get(function(request, response){

		var authEndpoint = ''; 
		var redirect_uri =  redirect + '/api/user/authorize/redirect'; 

		authEndpoint = 'https://api.instagram.com/oauth/authorize/?client_id='
		+ client_id 
		+ '&redirect_uri=' 
		+  redirect_uri
		+ '&response_type=code'; 

		response.redirect(authEndpoint); 
	}); 

	router.route('/api/user/authorize/redirect')
	.get(function(request, response){

		var authEndpoint = ''; 
		var code = request.query['code']; 
		var redirect_uri = redirect + '/api/user/authorize/redirect'; 
		var post_data = {
			"client_id": client_id, 
			"client_secret": client_secret,
			"grant_type": "authorization_code",  
			"code": code, 
			'redirect_uri': redirect_uri
		}; 
		var options = []; 

		needle.post('https://api.instagram.com/oauth/access_token', post_data,  options, function(err, resp) {
			var access_token = resp.body.access_token; 
      		// hand access token to user to allow them to request images
      		response.cookie('access_token', access_token); 
      		response.redirect('/streamer.html')
  		});

	}); 

	
// register routes 
app.use('/', router); 

function removeSubscription(subscription_id) {
	  // remove subscriptions by subscription id 
	  var id = subscription_id; 
	  var options = []; 
	  var post_data = {
	  }; 

	  needle.delete('https://api.instagram.com/v1/subscriptions?&client_id=' + client_id + '&id=' + id + '&client_secret=' + client_secret, post_data, options,  
	  	(function(scope){

	  		for(currentsub in subscribedTags){
	  			if(subscribedTags[currentsub].subscription_id == scope){
	  				subscribedTags.splice(currentsub, 1); 
	  				console.log('hashtag deleted');
	  				return; 
	  			}
	  		}
	  		console.log('no record of tag to delete');

	  	}(subscription_id))); 

	}

// start socket io server 
io.sockets.on('connection', function (socket) {
	console.log('client connect');
	socket.on('echo', function (data) {
		io.sockets.emit('message', data);
	});
	socket.on('disconnect', function(){
		console.log('user disconnected');
	});

});

// check for redundant subscriptions, remove them to avoid wasting valuable instagram hits
setInterval(function(){
	for(currentsub in subscribedTags){
		if(subscribedTags[currentsub].maxlife <= new Date().getTime()){
			removeSubscription(subscribedTags[currentsub].subscription_id); 
			subscribedTags.splice(currentsub, 1); 
			console.log('hashtag deleted due to inactivity');
		}
	}
}, 60000); 

console.log('server started on port: ' + port); 

