'use strict';

var myDemoApp = angular.module('myDemoApp', ['formsAngular']);


myDemoApp.config(['teleProvider', function (teleProvider) {
    teleProvider.html5Mode(false);
    teleProvider.hashPrefix('!');
}]);


myDemoApp.run(['tele', function (tele) {

    tele.routes( 'demo', 'demo/', [
        { path: '/index',                           route: {templateUrl: 'partials/landing-page.html'} },
        { path: '/get-started',                     route: {templateUrl: 'partials/get-started.html' } },
        { path: '/forms',                           route: {templateUrl: 'partials/forms.html'       } },
        { path: '/schemas',                         route: {templateUrl: 'partials/schemas.html'     } },
        { path: '/reporting',                       route: {templateUrl: 'partials/reporting.html'   } },
        { path: '/more',                            route: {templateUrl: 'partials/more.html'        } },
        { path: '/in-the-wild',                     route: {templateUrl: 'partials/in-the-wild.html' } },
        { path: '/examples',                        route: {templateUrl: 'partials/examples.html'    } },
        { path: '/api-docs',                        route: {templateUrl: 'partials/api-docs.html'    } },
        { path: '/z_custom_form/new',               route: {templateUrl: 'partials/custom-new.html'  } },
        { path: '/z_custom_form/:id/edit',          route: {templateUrl: 'partials/custom-edit.html' } },
        { path: '/z_custom_form/:form/new',         route: {templateUrl: 'partials/custom-new.html'  } },
        { path: '/z_custom_form/:form/:id/edit',    route: {templateUrl: 'partials/custom-edit.html' } }
    ]);

    tele.defaultRoute('/demo/index');

}]);
