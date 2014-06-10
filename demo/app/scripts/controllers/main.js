'use strict';

angular.module('angularSliderApp')
    .controller('MainCtrl', function ($scope) {
        $scope.awesomeThings = [
            'HTML5 Boilerplate',
            'AngularJS',
            'Karma'
        ];
        $scope.simpleSliderValues = [{value: 1025, step: 1}];
        $scope.rangeSliderValues = [{value: 25, step: 1}, {value: 75, step: 5}];
        $scope.complexRangeSliderValues = [{value: 25, step: 1}, {value: 50, step: 1}, {value: 75, step: 5}];
        $scope.veryComplexRangeSliderValues = [{value: 25, step: 1}, {value: 35, step: 1}, {value: 45, step: 5},{value: 55, step: 1}, {value: 65, step: 1}, {value: 75, step: 5}];

        $scope.isValidFormattedValue = function(displayValue) {
            // Decimal and commas optional
            return new RegExp('(?=.)^\\$?(([1-9][0-9]{0,2}(,[0-9]{3})*)|[0-9]+)?(\\.[0-9]{1,2})?$').test(displayValue);
        };

        $scope.formattedToTick = function(displayValue){
            // Strip out the $ and , from the currency value
            return Math.round(+(displayValue.split('$').join('').split(',').join('')));
        };

        $scope.tickToFormatted = function(tickValue){
            // Ensure that the value is a number
            return (+tickValue).formatMoney();
        };

        $scope.$on('dragEnd', function(event, args){
            console.log('dragEnd');
        });
    });
