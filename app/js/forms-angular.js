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
        { path: '/analyse/:model/:reportSchemaName',   route: { templateUrl: 'partials/base-analysis.html'   }},
        { path: '/analyse/:model',                     route: { templateUrl: 'partials/base-analysis.html'   }},
        { path: '/:model/:id/edit',                    route: { templateUrl: 'partials/base-edit.html'       }},
        { path: '/:model/new',                         route: { templateUrl: 'partials/base-edit.html'       }},
        { path: '/:model',                             route: { templateUrl: 'partials/base-list.html'       }},
        { path: '/:model/:form/:id/edit',              route: { templateUrl: 'partials/base-edit.html'       }},
        { path: '/:model/:form/new',                   route: { templateUrl: 'partials/base-edit.html'       }},
        { path: '/:model/:form',                       route: { templateUrl: 'partials/base-list.html'       }},
        { path: '/schema/:schemaName',                 route: { templateUrl: 'partials/schemaView.html'      }},
    ]);

    tele.routes( 'error', 'oops/', [
        { path: '/404',   route: { templateUrl: 'partials/404.html' }},
    ]);
}]);
