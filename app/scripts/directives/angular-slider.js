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
                step: '=',
                tickFormat: '&',
                value: "="
            },
            templateUrl: 'views/angular-slider.html',
            link: function(scope, element){
                var sliderRangeElement = undefined;
                angular.forEach(element.children(),
                    function(child){
                        if(angular.isDefined(sliderRangeElement)){ return; }
                        var angularChild = angular.element(child);
                        if(angularChild.hasClass('angular-slider-range')){
                            sliderRangeElement = angularChild;
                        }
                    });

                generateTickMarks();

                var sliderHandle = angular.element('<div class="angular-slider-handle"></div>');
                sliderRangeElement.append(sliderHandle);

                function calculatePointsPerVal(range){
                    return sliderRangeElement.prop('clientWidth') / range;
                }

                function calculateXForValue(value){
                    return (sliderRangeElement.prop('clientWidth') * ((value - scope.min) / (scope.max - scope.min))) + sliderRangeElement.prop('offsetLeft');
                }

                function calculateHandleXAtValue(value){
                    return calculateXForValue(value) - (sliderHandle.prop('clientWidth') / 2);
                }

                function setHandlePositionByValue(handle, value){
                    handle.x = calculateHandleXAtValue(value);
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

                var prevPageX = 0;

                sliderHandle.ready(function(){
                    prevPageX = setHandlePositionByValue(sliderHandle, scope.value);
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
                    if(event.pageX === prevPageX){
                        return;
                    }
                    var movingLeft = event.pageX < prevPageX;
                    if((movingLeft && (sliderRangeElement.prop('offsetLeft') > event.pageX)) ||
                       (sliderRangeElement.prop('offsetLeft') + sliderRangeElement.prop('clientWidth')) < event.pageX){
                        return;
                    }
                    sliderHandle.x = event.pageX - (sliderHandle.prop('clientWidth') / 2);
                    sliderHandle.css({
                        left:  sliderHandle.x + 'px'
                    });
                    prevPageX = event.pageX;
                    scope.value = Math.floor(getValueByPosition(event.pageX - sliderRangeElement.prop('offsetLeft')));
                    // force the application of the scope.value update
                    scope.$apply('value');
                }

                function mouseup() {
                    $document.off('mousemove', mousemove);
                    $document.off('mouseup', mouseup);
                }

                function generateTickMarks() {
                    var range = scope.max - scope.min;
                    var rangePerTick = range / 4;
                    for(var tick = 0; tick < 5; ++tick){
                        var tickValue = scope.min + (rangePerTick * tick);
                        var tickElement = angular.element("<span></span>")
                            .addClass("angular-slider-tick")
                            .css({top: (sliderRangeElement.prop('offsetTop') + sliderRangeElement.prop('offsetHeight')) + 'px'})
                            .text(scope.tickFormat(tickValue));
                        tickElement.prop('tickValue', tickValue);
                        (function(tickElement){
                            tickElement.ready(function(){
                                tickElement.css({left: calculateXForValue(tickElement.prop('tickValue')) - (tickElement.prop('clientWidth') / 2) + 'px'});
                            });
                        }(tickElement));


                        sliderRangeElement.append(tickElement);
                    }
                }
            }
        };
    }]);
