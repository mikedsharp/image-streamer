

angular.module( 'imageStreamerApp.controllers', []).
controller('ImageStreamerCtrl', ['$scope','$http', '$interval', function  ($scope, $http, $interval) {
	
	$scope.socket = io(); 

	$scope.hashtags = [
	]; 

	$interval(function(){
       // let server know we're still interested in the hastags we have 
       var activeTags = []; 

       angular.forEach($scope.hashtags,  function(value, key){
       	this.push(value.name); 
       }, activeTags); 

       if(activeTags.length > 0){
       	$http({
       		withCredentials: false,
       		method: 'post',
       		url: '../api/tag/heartbeat',
       		headers: {'Content-Type': 'application/json'},
       		data: {"tags": activeTags}
       	}).success(function(response){
       		console.log('tag added!'); 
       	});

       }

   }, 30000); 

	$scope.addHashtag = function(){
        // create blank list first, awaiting values to stream in 
        $scope.hashtags.push({
        	'name': $scope.newHashtag, 
        	'images': [], 
        	'lasttimestamp': 0
        }); 

	    // let the API know that we want these tags 
	    $http({
	    	withCredentials: false,
	    	method: 'post',
	    	url: '../api/tag',
	    	headers: {'Content-Type': 'application/json'},
	    	data: {"hashtag": $scope.newHashtag}
	    }).success(function(response){
	    	console.log('tag added!'); 
	    });

	    $scope.newHashtag = ""; 

	};

	$scope.removeHashtag = function(tag){
		var deletedTag = $scope.hashtags.splice($scope.hashtags.indexOf(tag),1); 
	}; 

	$scope.updateStream = function(tag){
		for(var i = 0; i < $scope.hashtags.length; i++){
			if($scope.hashtags[i].name == tag){

				var cookies = document.cookie.split(';');
				var token = ''; 

				for(var j = 0; j < cookies.length; j++){
					if(cookies[j].indexOf('access_token=') > -1){
						token = cookies[j].replace('access_token=', ''); 
					}
					break; 
				}

				// make JSONP call to get around CORS and get latest stream of images for a given tag
				$http.jsonp('https://api.instagram.com/v1/tags/' + tag+'/media/recent?access_token=' + token +'&callback=JSON_CALLBACK&count=1&min_tag_id=' + $scope.hashtags[j].lastid)
				.success(function(data){
		   	 	 		// obtain tag name
		   	 	 		var currentTag = data.pagination.next_url.match(/(tags\/){1}([A-z0-9])+(\/media\/){1}/gi)[0].replace('tags/', '').replace('/media/', ''); 

		   	 	 		for(var j = 0; j < $scope.hashtags.length; j++){
		   	 	 			if($scope.hashtags[j].name == currentTag){
		   	 	 				for(var i = 0; i < data.data.length; i++){
		   	 	 					
		   	 	 					// if we've already had this id, wait until next 
		   	 	 					if( $scope.hashtags[j].lastid != data.data[i].id){
		   	 	 						// limit our carousel, taking older photos off first
			   	 	 					if($scope.hashtags[j].images.length > 3){
			   	 	 						$scope.hashtags[j].images.pop(); 
			   	 	 					} 
			   	 	 					$scope.hashtags[j].images.unshift({'src': data.data[i].images.low_resolution.url}); 
			   	 	 				    // make note of timestamp for sending to api
			   	 	 				    $scope.hashtags[j].lastid  = data.data[i].id; 
		   	 	 					}

		   	 	 				}
		   	 	 				break; 	
		   	 	 			}
		   	 	 		}

		   	 	 	});

				break; 
			}
		}

	}

	// socket IO events 
	$scope.socket.on('new recent image', function(data){
		for(var i = 0; i < data.length; i++){
			$scope.updateStream(data[i].object_id);  
		}
	});


}]);

