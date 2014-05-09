'use strict';

var demo = angular.module('myDemoApp');

demo.controller( 'DemoCtrl',
[
'$scope', '$anchorScroll'
,
function($scope, $anchorScroll) {

    $scope.scrollToSection = function(id) {
        $anchorScroll();
    };

}]);
