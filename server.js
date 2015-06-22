//server.js 

// packages 
var express = require('express');
var bodyParser = require('body-parser'); 
var needle = require('needle'); 
var fs = require('fs'); 

var app = express(); 
// globals 
var subscribedTags = []; 
var maxsubscriptionlife = 60000; 
var client_id = '617bb2656c9d46ccbc3a603106230bf0'; 
var client_secret = '8e76d033812d47aa95b8e65b3b5c01c1'; 
var redirect = 'https://mike-s-imagestreamer.herokuapp.com'; 
var environment = 'production';

if(environment == 'dev'){
    redirect = 'http://146.200.38.90:5000'; 
}

//config 
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());  

var port = process.env.PORT || 5000;

// API ROUTES 
var router = express.Router(); 

router.use(function(req, res, next){
	console.log('api is being called!');
	// let routing propagate
	next(); 
}); 

// throw up front page for app 
router.get('/', function  (request, response) {
	fs.readFile('./index.html', function (err, html) {
    if (err) {
        throw err; 
    }       
    
    response.writeHeader(200, {"Content-Type": "text/html"});  
    response.write(html);  
    response.end();  
 
});
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
			 		subscribedTags[currentsub].maxlife = new Date(new Date().getTime() + maxsubscriptionlife); 
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
				var a = 'a'; 

			}); 

		}

		response.json({message: "hashtag added successfully!"}); 

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
				//response.json(subscribedTags.splice(currentsub, 1)); 
			}
		}
	    response.json({message: 'no tag subscribed by that name.'}); 

	}); 

// INSTAGRAM SUBSCRIPTION ROUTES 

// subscriptions (node to real time API communication)
router.route('/api/subscription/register')
.get(function(request, response) {

   if(typeof request.query["hub.challenge"] !== "string"){ // ignore as this isn't from instagram API
      response.send(""); 	
    }
	else{ //if the call is successful, echo back challenge
      response.send(request.query["hub.challenge"]); 	
	}
  
})

.post(function(request, response) {

   if(typeof request.query["hub.challenge"] !== "string"){ // ignore as this isn't from instagram API
      response.send(""); 	
    }
	else{ //if the call is successful, echo back challenge
      response.send( request.query["hub.challenge"]); 	
    }
  
});

router.route('/api/subscription')
	.post(function(request, response) {

	   if(typeof request.body.hashtag === "string"){ // ignore as this isn't from instagram API
	     
	     var tag = request.body.hashtag;
	     var options = []; 
	 	 var post_data = {
	 	 	"object": "tag", 
	 	 	"object_id": tag,
	 	 	"aspect": "media", 
	 	 	"callback_url": redirect + '/api/subscription'
	 	 }; 

	 	 needle.post('https://api.instagram.com/v1/subscriptions?client_id=' + client_id + '&client_secret=' + client_secret + '&verify_token=' + 'streamapp', post_data, options, function(err,response){
	 	 	  if(response.statusCode == 200 ){
		 	    	console.log("request succeeded"); 
		 	    	//subscribedTags
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
  
})


router.route('/api/subscription/:id')
	.delete(function(request, response) {
	if(typeof request.params.id === "string"){ // ignore as this isn't from instagram API
     
 	 	  // remove subscriptions by subscription id 
	     var id = request.params.id; 
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

     }(request.params.id))); 

   }

   response.send('');

}); 

// register routes 
app.use('/', router); 

// start server 
app.listen(port); 
console.log('server started on port: ' + port); 

