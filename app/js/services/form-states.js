'use strict';

formsAngular.provider('formStates', ['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {

  var _fngStates = [
    {name: 'fng',         options: { url: '/:model',                templateUrl: 'partials/base-list.html'}},
    {name: 'fngnew',      options: { url: '/:model/new',            templateUrl: 'partials/base-edit.html'}},
    {name: 'fngedit',     options: { url: '/:model/:id/edit',       templateUrl: 'partials/base-edit.html'}},
    {name: 'fngform',     options: { url: '/:model/:form',          templateUrl: 'partials/base-list.html'}},
    {name: 'fngformnew',  options: { url: '/:model/:form/new',      templateUrl: 'partials/base-edit.html'}},
    {name: 'fngformedit', options: { url: '/:model/:form/:id/edit', templateUrl: 'partials/base-edit.html'}},

    {name: 'fngreport',       options: { url: '/analyse/:model',                   templateUrl: 'partials/base-analysis.html'}},
    {name: 'fngreportschema', options: { url: '/analyse/:model/:reportSchemaName', templateUrl: 'partials/base-analysis.html'}},
  ];

  var _setStates = function (appStates) {
    if (appStates === null || appStates === undefined) {
      throw new Error('invalid app states being added to forms-angular');
    }
    for (var i = 0, end = appStates.length; i < end; i++) {
      $stateProvider.state(appStates[i].name, appStates[i].options);
    }
  };

  var _setDefaultRoute = function (defaultRoute) {
    if (defaultRoute !== null) {
      $urlRouterProvider.otherwise(defaultRoute);
    }
  };

  return {
    setStates: function (appStates, defaultRoute) {
      _setStates(appStates);
      _setStates(_fngStates);
      _setDefaultRoute(defaultRoute);
    },
    $get: function () {
      return null;
    }
  };
}]);


