'use strict';

var fng = angular.module('formsAngular');


fng.factory( 'SubmissionsService',
[
    '$http', 'tele'
,
function ($http, tele) {

    return {
        getListAttributes: function (ref, id) {
            return $http.get( tele.apiPath(ref, [id, 'list']) );
        },
        readRecord: function (modelName, id) {
            return $http.get( tele.apiPath(modelName, [id]) );
        },
        getAll: function (modelName) {
            return $http.get( tele.apiPath(modelName), {cache: true} );
        },
        /**
        * options consists of the following:
        * {
        *   aggregate - whether or not to aggregate results (http://docs.mongodb.org/manual/aggregation/)
        *   find - find parameter
        *   limit - limit results to this number of records
        *   skip - skip this number of records before returning results
        *   order - sort order
        * }
        */
        getPagedAndFilteredList: function (modelName, options) {
            return $http.get( tele.apiPath(modelName, [], options) );
        },
        deleteRecord: function (modelName, id) {
            return $http.delete( tele.apiPath(modelName, [id]) );
        },
        updateRecord: function (modelName, id, dataToSave) {
            return $http.post( tele.apiPath(modelName, [id]), dataToSave );
        },
        createRecord: function (modelName, dataToSave) {
            return $http.post( tele.apiPath(modelName), dataToSave );
        }

    };
}]);

