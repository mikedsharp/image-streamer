angular.module( 'imageStreamerApp.controllers' , []).
	controller('ImageStreamerCtrl', ['$scope','$http', function  ($scope, $http) {
	
   $scope.hashtags = [
   ]; 

	$scope.addHashtag = function(){
        // create blank list first, awaiting values to stream in 
		$scope.hashtags.push({
			'name': $scope.newHashtag, 
			'images': [] 
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
		 // let the API know that we want these tags 
	    $http({
	       method: 'delete',
	       url: '../api/tag/' + deletedTag[0].name,
	       headers: {'Content-Type': 'application/json'}
 		}).success(function(response){
 		   console.log('tag removed');  
	    });
	}; 
	
}]);

