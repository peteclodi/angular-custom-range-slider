'use strict';

angular.module('angularSliderApp')
    .controller('MainCtrl', function ($scope) {
        $scope.awesomeThings = [
            'HTML5 Boilerplate',
            'AngularJS',
            'Karma'
        ];
        $scope.sliderValues = [25, 75];
        $scope.sliderValue = 50;

        $scope.tickFormat = function(tickValue){
            // Ensure that the value is a number
            return (+tickValue).formatMoney();
        };
    });
