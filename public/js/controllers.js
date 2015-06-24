

angular.module( 'imageStreamerApp.controllers' , ['ngCookies']).
	controller('ImageStreamerCtrl', ['$scope','$http', '$cookies', function  ($scope, $http, $cookies) {
	

   $scope.socket = io(); 

   $scope.hashtags = [
   ]; 

	$scope.addHashtag = function(){
        // create blank list first, awaiting values to stream in 
		$scope.hashtags.push({
			'name': $scope.newHashtag, 
			'images': [], 
			'lastid': 0
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
		 // let the API know that we want to remove these tags and no longer subscribe
	    $http({
	       method: 'delete',
	       url: '../api/tag/' + deletedTag[0].name,
	       headers: {'Content-Type': 'application/json'}
 		}).success(function(response){
 		   console.log('tag removed');  
	    });
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

	   	 		 $http.jsonp('https://api.instagram.com/v1/tags/' + tag+'/media/recent?access_token=' + token +'&callback=JSON_CALLBACK&count=4')
		   	 	 .success(function(data){

		   	 	 		var currentTag = data.pagination.next_url.match(/(tags\/){1}([A-z0-9])+(\/media\/){1}/gi)[0].replace('tags/', '').replace('/media/', ''); 
		   	 	 	
		   	 	 		for(var j = 0; j < $scope.hashtags.length; j++){
		   	 	 			if($scope.hashtags[j].name == currentTag){
		   	 	 			$scope.hashtags[j].images = []; 
		   	 	 			for(var i = 0; i < data.data.length; i++){
			   	 	 				$scope.hashtags[j].images.push({'src': data.data[i].images.low_resolution.url}); 
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

