/* Directives */

angular.module('imageStreamerApp').
directive('tagCloud', function() {
  return {
    restrict: 'E',
    controller: 'ImageStreamerCtrl',
    templateUrl: 'streamer-tagcloud.html',
  };

})
.directive('tagGallery', function() {
  return {
    restrict: 'E',
    controller: 'ImageStreamerCtrl',
    templateUrl: 'streamer-taggallery.html',
  };

})
.directive('tagPicker', function() {
  return {
    restrict: 'E',
    controller: 'ImageStreamerCtrl',
    templateUrl: 'streamer-tagform.html',
  };

})
.directive('fadeIn', function($timeout){
    return {
        restrict: 'A',
        link: function($scope, $element, attrs){
            $element.addClass("ng-hide-remove");
            $element.on('load', function() {
                $element.addClass("ng-hide-add");
            });
        }
    };
});
