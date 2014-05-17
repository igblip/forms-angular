describe('Reports', function() {

    var $httpBackend;

    beforeEach(function () {
        module('formsAngular');
    });

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    describe('url handling', function() {

        it('should support report schemas which are fetched from server', function() {
            inject(function (_$httpBackend_, $rootScope, $controller, $location) {
                $httpBackend = _$httpBackend_;
                $httpBackend.whenGET('/api/report/collection/myReport').respond({'success':true, 'schema':{}, 'report':[{"_id":"F","count":11},{"_id":"M","count":6}]});

                $location.$$path = '/fng/report/collection/myReport';
                routeParamsStub = jasmine.createSpy('routeParamsStub');
                routeParamsStub.modelName = 'collection';
                routeParamsStub.reportSchemaName = 'myReport';
                //routeParamsStub.id = 3;
                //routeParamsStub.formName = 'foo';
                scope = $rootScope.$new();
                ctrl = $controller("ReportCtrl", {'$scope': scope, '$routeParams': routeParamsStub});

                $httpBackend.flush();
                expect(scope.report.length).toBe(2);
            });
        });

    });
});
