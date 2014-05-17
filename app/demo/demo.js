'use strict';

var myDemoApp = angular.module('myDemoApp', ['formsAngular']);

myDemoApp.run(['tele', function (tele) {

    tele.routes( 'demo', 'demo/', [
        { path: '/index',                           route: {templateUrl: 'demo/partials/landing-page.html'} },
        { path: '/get-started',                     route: {templateUrl: 'demo/partials/get-started.html' } },
        { path: '/forms',                           route: {templateUrl: 'demo/partials/forms.html'       } },
        { path: '/schemas',                         route: {templateUrl: 'demo/partials/schemas.html'     } },
        { path: '/reporting',                       route: {templateUrl: 'demo/partials/reporting.html'   } },
        //{ path: '/more',                            route: {templateUrl: 'partials/more.html'        } },
        { path: '/in-the-wild',                     route: {templateUrl: 'demo/partials/in-the-wild.html' } },
        { path: '/examples',                        route: {templateUrl: 'demo/partials/examples.html'    } },
        { path: '/api-docs',                        route: {templateUrl: 'demo/partials/api-docs.html'    } },
        { path: '/z_custom_form/new',               route: {templateUrl: 'demo/partials/custom-new.html'  } },
        { path: '/z_custom_form/:id/edit',          route: {templateUrl: 'demo/partials/custom-edit.html' } },
        { path: '/z_custom_form/:form/new',         route: {templateUrl: 'demo/partials/custom-new.html'  } },
        { path: '/z_custom_form/:form/:id/edit',    route: {templateUrl: 'demo/partials/custom-edit.html' } }
    ]);

    tele.defaultRoute('/demo/index');

}]);
