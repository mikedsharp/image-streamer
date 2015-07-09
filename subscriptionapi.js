var subscribedTags = {}; 
var subscriptionInt; 
var maxsubscriptionlife = 60000; 

var needle = require('needle'); 
var deleteKey = require('key-del');

var self = {
	subscriptionCheck: function(credentials){
		for(currentsub in subscribedTags){
			if(subscribedTags[currentsub].maxlife <= new Date().getTime()){
				self.removeSubscription(currentsub, credentials); 
				console.log('hashtag deleted due to inactivity');
			}
		}

	}, 
	removeSubscription: function(hashtag, credentials){
	  // remove subscriptions by subscription id 
	  var id = subscribedTags[hashtag].subscription_id; 
	  var options = []; 
	  var post_data = {
	  
	  }; 

	  needle.delete('https://api.instagram.com/v1/subscriptions?&client_id=' + credentials.clientId + '&id=' + id + '&client_secret=' + credentials.clientSecret, post_data, options,  
	  	(function(scope){

	  				console.log('hashtag "' + hashtag  +'" deleted'); 
	  				subscribedTags = deleteKey(subscribedTags, [hashtag]);
	  		
	  	}(hashtag))); 
	}, 
	removeAllSubscriptions: function(credentials){
		var options = []; 
		var post_data = {
		}; 

		for(currentsub in subscribedTags){
			needle.delete('https://api.instagram.com/v1/subscriptions?&client_id=' + credentials.clientId + '&object=' + 'tag' + '&client_secret=' + credentials.clientSecret, post_data, options, function(){
				console.log('All hashtags deleted');
				subscribedTags = {};
			}); 
		}
	}, 
	addSubscription: function(hashtag, credentials){

			var tag = hashtag;
			var options = []; 
			var post_data = {
				"object": "tag", 
				"object_id": tag,
				"aspect": "media", 
				"callback_url": credentials.redirect + '/api/subscription/new'
			}; 

			needle.post('https://api.instagram.com/v1/subscriptions?client_id=' + credentials.clientId + '&client_secret=' + credentials.clientSecret + '&verify_token=' + 'streamapp', post_data, options, function(err,response){
				if(response.statusCode == 200 ){
					subscribedTags[response.body.data.object_id] =  {
						hashtag: response.body.data.object_id, 
						maxlife: new Date().getTime() + maxsubscriptionlife, 
						subscription_id:response.body.data.id
					}; 

				}
				else{
		 	    	console.log("request failed"); 
		 	    }
		 	}); 
	

	},
	processHeartbeat: function(tags){
	 for(key in tags){
		if(subscribedTags[tags[key]] != null && typeof subscribedTags[tags[key]] == "object"){
			subscribedTags[tags[key]].maxlife = new Date().getTime() + maxsubscriptionlife; 
		}
	 }

	} 
};

module.exports = self; 
