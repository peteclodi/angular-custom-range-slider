'use strict';

angular.module('angularSliderApp')
    .controller('MainCtrl', function ($scope) {
        $scope.awesomeThings = [
            'HTML5 Boilerplate',
            'AngularJS',
            'Karma'
        ];
        $scope.simpleSliderValues = [{value: 25, step: 1}];
        $scope.rangeSliderValues = [{value: 25, step: 1}, {value: 75, step: 5}];
        $scope.complexRangeSliderValues = [{value: 25, step: 1}, {value: 50, step: 1}, {value: 75, step: 5}];
        $scope.veryComplexRangeSliderValues = [{value: 25, step: 1}, {value: 35, step: 1}, {value: 45, step: 5},{value: 55, step: 1}, {value: 65, step: 1}, {value: 75, step: 5}];

        $scope.tickFormat = function(tickValue){
            // Ensure that the value is a number
            return (+tickValue).formatMoney();
        };
    });
