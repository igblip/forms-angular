'use strict';

var myDemoApp = angular.module('myDemoApp', ['formsAngular']);

formsAngular.config(['urlServiceProvider', 'cssFrameworkServiceProvider', function (urlService, cssFrameworkService) {
  urlService.setOptions({html5Mode: false, hashPrefix: '!'});
  cssFrameworkService.setOptions({framework: 'bs2'});  // e2e tests depend on this being bs2
}]);
