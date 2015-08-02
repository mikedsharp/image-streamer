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

});
