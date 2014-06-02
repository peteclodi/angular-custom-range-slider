'use strict';

angular.module('angular-slider', [])
    .directive('angularSlider', ['$document', function($document) {
        return {
            require: 'ngModel',
            restrict: 'E',
            replace: true,
            scope: {
                min: '=',
                max: '=',
                step: '@',
                tickFormat: '&',
                values: "="
            },
            templateUrl: 'views/angular-slider.html',
            link: function(scope, element, attrs){
                scope.showTicks = angular.isDefined(attrs.showTicks);
                scope.showValues = angular.isDefined(attrs.showValues);

                var sliderRangeElement = undefined;
                angular.forEach(element.children(),
                    function(child){
                        if(angular.isDefined(sliderRangeElement)){ return; }
                        var angularChild = angular.element(child);
                        if(angularChild.hasClass('angular-slider-range')){
                            sliderRangeElement = angularChild;
                        }
                    });

                if(angular.isUndefined(scope.step)) {
                    scope.step = 1;
                }

                if(scope.showTicks){
                    generateTickMarks();
                }

                var sliderHandles = [];
                scope.values.forEach(function(value){
                    var sliderHandle = angular.element('<div class="angular-slider-handle"></div>');
                    sliderRangeElement.append(sliderHandle);
                    sliderHandles.push(sliderHandle);

                    sliderHandle.prevPageX = 0;
                    sliderHandle.ready(function(){
                        sliderHandle.prevPageX = setHandlePositionByValue(sliderHandle, value);
                    });

                    sliderHandle.on('mousedown', function(event) {
                        if(event.button !== 0){
                            return;
                        }
                        // Prevent default dragging of selected content
                        event.preventDefault();
                        $document.on('mousemove', mousemove);
                        $document.on('mouseup', mouseup);
                    });

                    function mousemove(event) {
                        if(event.pageX === sliderHandle.prevPageX){
                            return;
                        }
                        var movingLeft = event.pageX < sliderHandle.prevPageX;
                        if((movingLeft && (sliderRangeElement.prop('offsetLeft') > event.pageX)) ||
                            (sliderRangeElement.prop('offsetLeft') + sliderRangeElement.prop('clientWidth')) < event.pageX){
                            return;
                        }
                        var newValue = Math.round(getValueByPosition(event.pageX - sliderRangeElement.prop('offsetLeft')));
                        if((newValue % scope.step) !== 0) {
                            return;
                        }
                        sliderHandle.x = event.pageX - (sliderHandle.prop('clientWidth') / 2);
                        sliderHandle.css({
                            left:  sliderHandle.x + 'px'
                        });
                        sliderHandle.prevPageX = event.pageX;
                        scope.value = newValue;
                        // force the application of the scope.value update
                        scope.$apply('value');
                    }

                    function mouseup() {
                        $document.off('mousemove', mousemove);
                        $document.off('mouseup', mouseup);
                    }
                });

                function calculateXForValue(value){
                    return (sliderRangeElement.prop('clientWidth') * ((value - scope.min) / (scope.max - scope.min))) + sliderRangeElement.prop('offsetLeft');
                }

                function calculateHandleXAtValue(handle, value){
                    return calculateXForValue(value) - (handle.prop('clientWidth') / 2);
                }

                function setHandlePositionByValue(handle, value){
                    handle.x = calculateHandleXAtValue(handle, value);
                    handle.css({
                        left:  handle.x + 'px'
                    });
                    return handle.x;
                }

                function getValueByPosition(position){
                    var positionRatio = position / sliderRangeElement.prop('clientWidth');
                    var pointOffset = (scope.max - scope.min) * positionRatio;
                    return pointOffset + scope.min;
                }

                function generateTickMarks() {
                    var range = scope.max - scope.min;
                    var rangePerTick = range / 4;
                    for(var tick = 0; tick < 5; ++tick){
                        var tickValue = scope.min + (rangePerTick * tick);
                        var tickElement = angular.element("<span></span>")
                            .addClass("angular-slider-tick")
                            .css({top: (sliderRangeElement.prop('offsetTop') + sliderRangeElement.prop('offsetHeight')) + 'px'})
                            // pass the value in as an object so that it will be properly marshaled to the parent controller
                            .text(scope.tickFormat({value: tickValue}));
                        tickElement.prop('tickValue', tickValue);
                        (function(tickElement){
                            tickElement.ready(function(){
                                tickElement.css({left: calculateXForValue(tickElement.prop('tickValue')) - (tickElement.prop('clientWidth') / 2) + 'px'});
                            });
                        }(tickElement));
                        sliderRangeElement.append(tickElement);
                    }
                }

                scope.formatTickValue = function(tickValue) {
                    return scope.tickFormat({value: tickValue});
                };
            }
        };
    }]);
