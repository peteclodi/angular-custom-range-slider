'use strict';

angular.module('angular-slider', [])
    .directive('angularSlider', ['$swipe', function($swipe) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                min: '=',
                max: '=',
                step: '@',
                tickFormat: '&',
                handleValues: "="
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

                if(scope.showTicks){
                    generateTickMarks();
                }

                var sliderHandles = [];
                scope.handleValues.forEach(function(handleValue, index){
                    var sliderHandleClass = 'angular-slider-handle-' + index;
                    var sliderHandle = angular.element('<div class="angular-slider-handle ' + sliderHandleClass + '"></div>');
                    sliderHandle.handleIndex = index;
                    sliderRangeElement.append(sliderHandle);
                    sliderHandles.push(sliderHandle);

                    if(angular.isUndefined(handleValue.step) ||
                        ((scope.max - scope.min) % handleValue.step !== 0) ||
                        (handleValue.value % handleValue.step !== 0)) {
                        if((scope.max - scope.min) % handleValue.step !== 0) {
                            console.log("The handle's step value (" + handleValue.step +
                                        ") must be a rational divisor of the slider's range (" +
                                        (scope.max - scope.min) + ")");
                        }
                        else if((handleValue.value - scope.min) % handleValue.step !== 0) {
                            console.log("The handle's step value (" + handleValue.step +
                                        ") must be a rational divisor of the handle's value, relative to the slider's " +
                                        "minimum value (" + (handleValue.value - scope.min) + ")");
                        }
                        console.log("The handle's step value is being reset to 1");
                        handleValue.step = 1;
                    }

                    sliderHandle.prevPageX = 0;
                    sliderHandle.ready(function(){
                        sliderHandle.prevPageX = calculateXForValue(handleValue.value);
                        setHandlePositionByValue(sliderHandle, handleValue.value);
                    });

                    $swipe.bind(sliderHandle, {
                        start: function(coords){
                        },
                        move: function(coords){
                            swipeMove(coords.x);
                        },
                        end: function(){
                        },
                        cancel: function(){
                        }
                    });

                    function swipeMove(pageX) {
                        if(pageX === sliderHandle.prevPageX){
                            return;
                        }
                        var movingLeft = pageX < sliderHandle.prevPageX;
                        if((movingLeft && (sliderRangeElement.prop('offsetLeft') > pageX)) ||
                            (sliderRangeElement.prop('offsetLeft') + sliderRangeElement.prop('clientWidth')) < pageX){
                            return;
                        }

                        var prevSlider = sliderHandle.handleIndex > 0 ? sliderHandles[sliderHandle.handleIndex - 1] : undefined;
                        var nextSlider = sliderHandle.handleIndex < (sliderHandles.length - 1) ? sliderHandles[sliderHandle.handleIndex + 1] : undefined;

                        if((movingLeft && (angular.isDefined(prevSlider) && prevSlider.prevPageX >= pageX)) ||
                            (angular.isDefined(nextSlider) && nextSlider.prevPageX <= pageX)){
                            return;
                        }

                        var newValue = Math.round(getValueByPosition(pageX - sliderRangeElement.prop('offsetLeft')));
                        if((newValue % handleValue.step) !== 0) {
                            return;
                        }
                        sliderHandle.x = Math.round(pageX - (sliderHandle.prop('clientWidth') / 2));
                        sliderHandle.css({
                            left:  sliderHandle.x + 'px'
                        });
                        sliderHandle.prevPageX = pageX;
                        handleValue.value = newValue;
                        // force the application of the scope.handleValues[].value update
                        scope.$apply('handleValue.value');
                    }
                });

                function calculateXForValue(value){
                    return Math.round((sliderRangeElement.prop('clientWidth') * ((value - scope.min) / (scope.max - scope.min))) + sliderRangeElement.prop('offsetLeft'));
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
