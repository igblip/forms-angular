describe('Links', function () {

    var schemaThrough, dataThrough;

    function initService(html5Mode, hashPrefix, serverBase, supportHistory) {
        return module(function($provide, teleProvider){
            teleProvider.html5Mode(html5Mode);
            teleProvider.hashPrefix(hashPrefix);
            teleProvider.serverBase(serverBase);
            $provide.value('$sniffer', {history: supportHistory});
        });
    }

    beforeEach(function () {
        module('formsAngular');
        initService(false, '!', 'api/', true)
    });

    describe('simple link', function () {

        describe('controller', function () {

            var $httpBackend;

            afterEach(function () {
                $httpBackend.verifyNoOutstandingExpectation();
                $httpBackend.verifyNoOutstandingRequest();
            });

            describe('process schema', function () {
                var scope, ctrl;

                beforeEach(inject(function (_$httpBackend_, $rootScope, $location, $controller) {
                    $httpBackend = _$httpBackend_;
                    $httpBackend.whenGET('/api/schema/collection').respond({
                        'textField': {
                            'path': 'textField',
                            'instance': 'String',
                            'options': {
                                'form': {
                                    'label': 'Organisation Name'
                                },
                                'list': true
                            },
                            '_index': null
                        },
                        'lookupField': {
                            'path': 'lookupField',
                            'instance': 'ObjectID',
                            'options': {
                                'ref': 'Person',
                                'form': {
                                    'link': {
                                        'linkOnly': true,
                                        'text': 'My link text'
                                    }
                                }
                            },
                            '_index': null
                        }
                    });
                    $httpBackend.whenGET('/api/collection/3').respond({"textField": "This is some text", "lookupField": 123456789});

                    $location.$$path = '/fng/collection/3/edit';
                    routeParamsStub = jasmine.createSpy('routeParamsStub');
                    routeParamsStub.modelName = 'collection';
                    routeParamsStub.id = '3';
                    //routeParamsStub.formName = 'foo';
                    scope = $rootScope.$new();
                    ctrl = $controller("BaseCtrl", {'$scope': scope, '$routeParams': routeParamsStub});

                    $httpBackend.flush();
                }));

                it('generates correct schema', function () {
                    expect(scope.formSchema[1].ref).toBe('Person');
                    expect(scope.formSchema[1].type).toBe('link');
                    expect(scope.formSchema[1].linkText).toBe('My link text');
                    expect(scope.formSchema[1].link).toBe(undefined);
                    schemaThrough = scope.formSchema[1];
                    dataThrough = scope.record;
                });

            });

            describe('form generation', function () {

                var elm, scope;

                beforeEach(inject(function ($rootScope, $compile) {
                    elm = angular.element(
                        '<form name="myForm" class="form-horizontal compact">' +
                            '<form-input schema="formSchema"></form-input>' +
                        '</form>');

                    scope = $rootScope;
                    scope.formSchema = schemaThrough;
                    scope.record = dataThrough;
                    $compile(elm)(scope);
                    scope.$digest();
                }));
                //
                it('should have a link', function () {
                    var anchor = elm.find('a');
                    expect(anchor.attr('href')).toBe('/#!/fng/Person/123456789/edit');
                    expect(anchor.text()).toBe('My link text');
                });

            });

        });

    });

    describe('link to a form schema', function () {

        describe('controller', function () {

            var $httpBackend;

            afterEach(function () {
                $httpBackend.verifyNoOutstandingExpectation();
                $httpBackend.verifyNoOutstandingRequest();
            });

            describe('process schema', function () {
                var scope, ctrl;

                beforeEach(inject(function (_$httpBackend_, $rootScope, $location, $controller) {
                    $httpBackend = _$httpBackend_;
                    $httpBackend.whenGET('/api/schema/collection').respond({
                        'textField': {
                            'path': 'textField',
                            'instance': 'String',
                            'options': {
                                'form': {
                                    'label': 'Organisation Name'
                                },
                                'list': true
                            },
                            '_index': null
                        },
                        'lookupField': {
                            'path': 'lookupField',
                            'instance': 'ObjectID',
                            'options': {
                                'ref': 'Person',
                                'form': {
                                    'link': {
                                        'linkOnly': true,
                                        'form':'myschema',
                                        'text': 'My link text'
                                    }
                                }
                            },
                            '_index': null
                        }
                    });
                    $httpBackend.whenGET('/api/collection/3').respond({"textField": "This is some text", "lookupField": 123456789});

                    $location.$$path = '/fng/collection/3/edit';
                    routeParamsStub = jasmine.createSpy('routeParamsStub');
                    routeParamsStub.modelName = 'collection';
                    routeParamsStub.id = '3';
                    //routeParamsStub.formName = 'foo';
                    scope = $rootScope.$new();
                    ctrl = $controller("BaseCtrl", {'$scope': scope, '$routeParams': routeParamsStub});

                    $httpBackend.flush();
                }));

                it('generates correct schema', function () {
                    expect(scope.formSchema[1].ref).toBe('Person');
                    expect(scope.formSchema[1].type).toBe('link');
                    expect(scope.formSchema[1].linkText).toBe('My link text');
                    expect(scope.formSchema[1].form).toBe('myschema');
                    expect(scope.formSchema[1].link).toBe(undefined);
                    schemaThrough = scope.formSchema[1];
                    dataThrough = scope.record;
                });

            });

            describe('form generation', function () {

                var elm, scope;

                beforeEach(inject(function ($rootScope, $compile) {
                    elm = angular.element(
                        '<form name="myForm" class="form-horizontal compact">' +
                            '<form-input schema="formSchema"></form-input>' +
                            '</form>');

                    scope = $rootScope;
                    scope.formSchema = schemaThrough;
                    scope.record = dataThrough;
                    $compile(elm)(scope);
                    scope.$digest();
                }));
                //
                it('should have a link', function () {
                    var anchor = elm.find('a');
                    expect(anchor.attr('href')).toBe('/#!/fng/Person/myschema/123456789/edit');
                    expect(anchor.text()).toBe('My link text');
                });

            });

        });

    });


});
