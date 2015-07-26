module.exports = function(credentials) {

  var subscribedTags = {};
  var subscriptionInt;
  var maxsubscriptionlife = 60000;
  var serverCredentials = credentials;

  var needle = require('needle');
  var deleteKey = require('key-del');

  module.subscriptionCheck = function() {
    for (var currentsub in subscribedTags) {
      if (subscribedTags[currentsub].maxlife <= new Date().getTime()) {
        module.removeSubscription(currentsub);
        console.log('hashtag deleted due to inactivity');
      }
    }

  };
  module.removeSubscription = function(hashtag) {
    // remove subscriptions by subscription id
    var id = subscribedTags[hashtag].subscription_id;
    var options = [];
    var post_data = {

    };

    needle.delete('https://api.instagram.com/v1/subscriptions?&client_id=' + serverCredentials.clientId + '&id=' + id + '&client_secret=' + serverCredentials.clientSecret, post_data, options, (function(scope) {
      console.log('hashtag "' + hashtag + '" deleted');
      subscribedTags = deleteKey(subscribedTags, [hashtag]);
    }(hashtag)));
  };
  module.removeAllSubscriptions = function() {
    var options = [];
    var post_data = {};
    for (var currentsub in subscribedTags) {
      needle.delete('https://api.instagram.com/v1/subscriptions?&client_id=' + serverCredentials.clientId + '&object=' + 'tag' + '&client_secret=' + serverCredentials.clientSecret, post_data, options, module.removeSubscription_success);
    }
  };
  module.removeSubscription_success = function() {
    console.log('All hashtags deleted');
    subscribedTags = {};
  };
  module.addSubscription = function(hashtag) {

    var tag = hashtag;
    var options = [];
    var post_data = {
      "object": "tag",
      "object_id": tag,
      "aspect": "media",
      "callback_url": serverCredentials.redirect + '/api/subscription/new'
    };

    needle.post('https://api.instagram.com/v1/subscriptions?client_id=' + serverCredentials.clientId + '&client_secret=' + serverCredentials.clientSecret + '&verify_token=' + 'streamapp', post_data, options, function(err, response) {
      if (response.statusCode == 200) {
        subscribedTags[response.body.data.object_id] = {
          hashtag: response.body.data.object_id,
          maxlife: new Date().getTime() + maxsubscriptionlife,
          subscription_id: response.body.data.id
        };

      } else {
        console.log("request failed");
      }
    });


  };
  module.processHeartbeat = function(data) {
    for (var key in data.tags) {
      if (subscribedTags[data.tags[key]] !== null && typeof subscribedTags[data.tags[key]] == "object") {
        subscribedTags[data.tags[key]].maxlife = new Date().getTime() + maxsubscriptionlife;
      }
    }

  };
  module.refreshTag = function(tag) {
    if (subscribedTags[tag] !== null && typeof subscribedTags[tag] == "object") {
      subscribedTags[tag].maxlife = new Date().getTime() + maxsubscriptionlife;
    }
  };
  module.isSubscribed = function(tag) {
    return typeof subscribedTags[tag] == 'object';
  };
  module.getSubscribedTag = function(tag) {
    if (subscribedTags[tag] !== null && typeof subscribedTags[tag] == "object") {
      return subscribedTags[tag];
    }
    return [];
  };
  module.getAllSubscribedTags = function() {
    return subscribedTags;
  };




  return module;
};
