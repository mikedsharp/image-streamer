'use strict';

/* Services */

angular.module('imageStreamerApp.services', []).
  factory('socket', function ($rootScope) {
  	var socket = io.connect(); 



  	return {
  		on: function(eventName, callback){
  			var args = arguments; 
  			$rootScope.$safeApply(function(){
  				callback.apply(socket, args);
  			}); 
  		}, 
  		emit: function  (eventName, data, callback) {
  			socket.emit(eventName, data, function(){
  				var args = arguments; 
  				$rootScope.$safeApply(function(){
  					if(callback){
  						callback.apply(socket, args);
  					}
  				});
  				
  		})
  		}
	}
  }); 
