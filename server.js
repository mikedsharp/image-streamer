//server.js

// packages
var express = require('express');
var app = express();
var server = require('http').Server(app);
var bodyParser = require('body-parser');
var needle = require('needle');
var path = require('path');
var os = require("os");

var subscriptionAPI = require('./subscriptionapi.js')({
			"clientId":  process.env.CLIENT_ID,
			"clientSecret": process.env.CLIENT_SECRET,
			"redirect": process.env.HOST_URL
});

// globals
var clientId =  process.env.CLIENT_ID;
var clientSecret = process.env.CLIENT_SECRET;
var redirect = process.env.HOST_URL;
var environment = 'production';

var subscriptionInt;

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

		if(subscriptionAPI.isSubscribed(hashtag)){
			//no need to add, just update the max life
			subscriptionAPI.refreshTag(hashtag);
		}
		else{
			//call instagram API for real time subscription
			subscriptionAPI.addSubscription(hashtag);
		}
		response.json({message: "response request sent !"});
	})
	.get(function(request, response){
		response.json(subscriptionAPI.getAllSubscribedTags());
});


router.route('/api/tag/heartbeat')
	.post(function(request, response){
		subscriptionAPI.processHeartbeat(request.body);
		response.send('');
});

router.route('/api/tag/:hashtag')
	.get(function(request, response){
		response.json(subscriptionAPI.getSubscribedTag(request.params.hashtag));
})
	.delete(function(request, response){
			subscriptionAPI.removeSubscription(request.params.hashtag);
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

			subscriptionAPI.addSubscription(tag);
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

// remove add and view subscriptions, sends requests to instagram API
router.route('/api/subscription/:id')
	.delete(function(request, response) {
		if(typeof request.params.id === "string"){

 	 	 // remove subscriptions by subscription id
 	 	 var id = request.params.id;
 	 	 var options = [];
 	 	 var post_data = {
 	 	 };

 	 	 subscriptionAPI.removeSubscription(id);
 	 	 response.json({message : "subscription removed"});
		}
 	});

	router.route('/api/user/authorize')
	.get(function(request, response){

		var authEndpoint = '';
		var redirect_uri =  redirect + '/api/user/authorize/redirect';

		authEndpoint = 'https://api.instagram.com/oauth/authorize/?client_id=' + clientId + '&redirect_uri='	+  redirect_uri + '&response_type=code';

		response.redirect(authEndpoint);
	});

	router.route('/api/user/authorize/redirect')
	.get(function(request, response){

		var authEndpoint = '';
		var code = request.query.code;
		var redirect_uri = redirect + '/api/user/authorize/redirect';
		var post_data = {
			"client_id": clientId,
			"client_secret": clientSecret,
			"grant_type": "authorization_code",
			"code": code,
			'redirect_uri': redirect_uri
		};
		var options = [];

		needle.post('https://api.instagram.com/oauth/access_token', post_data,  options, function(err, resp) {
			var access_token = resp.body.access_token;
      		// hand access token to user to allow them to request images
      		response.cookie('access_token', access_token);
      		response.redirect('/streamer.html');
  		});

	});


// register routes
app.use('/', router);

// start socket io server
io.sockets.on('connection', function (socket) {


    console.log('user connected, number connected: ' + io.engine.clientsCount);
	if(io.engine.clientsCount == 1){
		subscriptionInt = setInterval(subscriptionAPI.subscriptionCheck, 60000);
	}

	socket.on('echo', function (data) {
		io.sockets.emit('message', data);
	});

	socket.on('disconnect', function(){

		if(io.engine.clientsCount === 0){
			subscriptionAPI.removeAllSubscriptions();
			clearInterval(subscriptionInt);
		}

		console.log('user disconnected number connected: ' + io.engine.clientsCount);
	});

});

console.log('server started on port: ' + port);
