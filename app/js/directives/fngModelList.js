'use strict';

var fng = angular.module('formsAngular');

fng.directive( 'fngModelList',
[
    'ModelsService', 'tele'
,
function (ModelsService, tele) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'partials/fngModelList.html',
        scope: {},
        link: {
            pre: function preLink(scope, iElement, iAttrs) {
                scope.models = [];
                scope.tele = tele;

                ModelsService.getAll()
                    .success(function (data) {
                        scope.models = data;
                    }).error(function () {
                        tele.path('error', [404]);
                    });
            },
            post: function postLink(scope, iElement, iAttrs) {
            }
        }
    };
}]);
