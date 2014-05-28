'use strict';

var myDemoApp = angular.module('myDemoApp');

myDemoApp.config(['formUrlsProvider', function (formStates) {
  formStates.setStates([
    {name: 'index',            options: { url: '/index',             templateUrl: 'partials/landing-page.html'}},
    {name: 'get-started',      options: { url: '/get-started',       templateUrl: 'partials/get-started.html'}},
    {name: 'forms',            options: { url: '/forms',             templateUrl: 'partials/forms.html'}},
    {name: 'schemas',          options: { url: '/schemas',           templateUrl: 'partials/schemas.html'}},
    {name: 'reporting',        options: { url: '/reporting',         templateUrl: 'partials/reporting.html'}},
    {name: 'more',             options: { url: '/more',              templateUrl: 'partials/more.html'}},
    {name: 'in-the-wild',      options: { url: '/in-the-wild',       templateUrl: 'partials/in-the-wild.html'}},
    {name: 'examples',         options: { url: '/examples',          templateUrl: 'partials/examples.html'}},
    {name: 'api-docs',         options: { url: '/api-docs',          templateUrl: 'partials/api-docs.html'}},
    {name: 'error',            options: { url: '/404',               templateUrl: 'partials/404.html'}},

    {name: 'custom',           options: { url: '/z_custom_form',                   templateUrl: 'partials/custom-new.html'}},     // example view override
    {name: 'custom.new',       options: { url:              '/new',                templateUrl: 'partials/custom-new.html'}},     // example view override
    {name: 'custom.edit',      options: { url:              '/:id/edit',           templateUrl: 'partials/custom-edit.html'}},    // example view override
    {name: 'custom.form.new',  options: { url:              '/:form/new',          templateUrl: 'partials/custom-new.html'}},     // example view override with specified form content
    {name: 'custom.form.edit', options: { url:                        '/:id/edit', templateUrl: 'partials/custom-edit.html'}}     // example view override with specified form content
  ], '/index');
}]);