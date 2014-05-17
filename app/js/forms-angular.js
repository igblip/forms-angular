'use strict';

var fng = angular.module( 'formsAngular'
    ,
    [   'ngRoute'
    ,   'ngSanitize'
    ,   'ui.select2'
    ,   'ui.date'
    ,   'ui.bootstrap'
    ,   'ngGrid'
    ,   'infinite-scroll'
    ,   'monospaced.elastic'
    ,   'ngCkeditor'
    ,   'guidelight.telepathic'
]);


fng.run(['tele', function (tele) {

    tele.routes( 'form', 'fng/', [
        { path: '/analyse/:modelName/:reportSchemaName', route: { templateUrl: 'partials/base-analysis.html'   }},
        { path: '/analyse/:modelName',                   route: { templateUrl: 'partials/base-analysis.html'   }},
        { path: '/:modelName/:id/edit',                  route: { templateUrl: 'partials/base-edit.html'       }},
        { path: '/:modelName/new',                       route: { templateUrl: 'partials/base-edit.html'       }},
        { path: '/:modelName',                           route: { templateUrl: 'partials/base-list.html'       }},
        { path: '/:modelName/:formName/:id/edit',        route: { templateUrl: 'partials/base-edit.html'       }},
        { path: '/:modelName/:formName/new',             route: { templateUrl: 'partials/base-edit.html'       }},
        { path: '/:modelName/:formName',                 route: { templateUrl: 'partials/base-list.html'       }},
        { path: '/schema/:schemaName',                   route: { templateUrl: 'partials/schemaView.html'      }},
    ]);

    tele.routes( 'error', 'oops/', [
        { path: '/404',   route: { templateUrl: 'partials/404.html' }},
    ]);
}]);
