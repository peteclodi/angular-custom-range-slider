'use strict';

angular.module('angular-custom-range-slider', [])
    .directive('angularCustomRangeSlider', ['$swipe', function ($swipe) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                tickToFormatted: '&',
                formattedToTick: '&',
                isValidFormattedValue: '&',
                handleValues: "="
            },
            template: '<div class="angular-custom-range-slider">' +
                '<div class="angular-custom-range-slider-range"></div>' +
                '<div class="angular-custom-range-slider-values">' +
                '<input class="angular-custom-range-slider-value" ng-if="showValues "' +
                'ng-repeat="handleValue in handleValues" ' +
                'ng-class="{\'angular-custom-range-slider-first-value\': $first, ' +
                '\'angular-custom-range-slider-only-value\': $first && $last, ' +
                '\'angular-custom-range-slider-invalid-value\': !isValid(handleValue)}" ' +
                'ng-style="$last && !$first ? {float: \'right\', ' +
                'width: \'{{inputWidths}}\'} : !($last && $first) ? {width: \'{{inputWidths}}\'}: {} "' +
                'ng-change="handleValueChanged(handleValue)" ng-keyup="handleKeyUp($event, handleValue)" ng-model="handleValue.displayValue"/>' +
                '</div>' +
                '</div>',
            link: function (scope, element, attrs) {
                scope.min = angular.isDefined(attrs.min) ? +attrs.min : 0;
                scope.max = angular.isDefined(attrs.max) ? +attrs.max : 100;

                scope.showTicks = angular.isDefined(attrs.showTicks);
                scope.showValues = angular.isDefined(attrs.showValues) && angular.isDefined(attrs.handleValues);

                if (angular.isUndefined(attrs.tickToFormatted)) {
                    // When the real call is made and thrown over the wall to the parent scope
                    // the {value: xxxxx} object is broken out to just pass xxxxx to the function
                    // Because the magic is not being done as it is not being thrown over the wall
                    // it is necessary to reference the object's value property
                    scope.tickToFormatted = function (tickValue) {
                        return tickValue.value;
                    };
                }

                if (angular.isUndefined(attrs.formattedToTick)) {
                    // When the real call is made and thrown over the wall to the parent scope
                    // the {value: xxxxx} object is broken out to just pass xxxxx to the function
                    // Because the magic is not being done as it is not being thrown over the wall
                    // it is necessary to reference the object's value property
                    scope.formattedToTick = function (displayValue) {
                        return displayValue.value;
                    };
                }

                if (angular.isUndefined(attrs.isValidFormattedValue)) {
                    scope.isValidFormattedValue = function () {
                        return true;
                    };
                }

                if (scope.showValues) {
                    var inputSections = scope.handleValues.length < 3 ? 4 : Math.max(scope.handleValues.length, 3);
                    var inputSectionOffset = scope.handleValues.length >= 3 ? 2.25 : 0;
                    scope.inputWidths = Math.round(((1 / inputSections) * 100) - inputSectionOffset) + '%';
                }

                var sliderRangeElement = undefined;
                angular.forEach(element.children(),
                    function (child) {
                        if (angular.isDefined(sliderRangeElement)) {
                            return;
                        }
                        var angularChild = angular.element(child);
                        if (angularChild.hasClass('angular-custom-range-slider-range')) {
                            sliderRangeElement = angularChild;
                        }
                    });

                if (scope.showTicks) {
                    generateTickMarks();
                }

                // Allow the slider control to be initialized with min, max and tick values
                // before verifying that handle values have been defined.
                if (angular.isUndefined(attrs.handleValues)) {
                    console.log("handle-values MUST be defined within the tag");
                    return;
                }

                var sliderHandles = [];
                var sliderInnerRangeIndex = 0;
                var draggedSliderHandle = undefined;
                scope.handleValues.forEach(function (handleValue, index) {
                    var sliderHandleClass = "angular-custom-range-slider-handle";
                    var sliderHandle =
                        angular.element("<div></div>")
                            .addClass(sliderHandleClass)
                            .addClass(sliderHandleClass + "-" + index);
                    sliderHandle.handleIndex = index;
                    sliderHandles.push(sliderHandle);
                    sliderHandle.getHandleOffset = function () {
                        return this.prop('clientWidth') / 2;
                    };

                    if (index < (scope.handleValues.length - 1)) {
                        var sliderInnerRangeClass = "angular-custom-range-slider-inner-range";
                        var sliderInnerRangeElement =
                            angular.element("<div></div>")
                                .addClass(sliderInnerRangeClass)
                                .addClass(sliderInnerRangeClass + "-" + sliderInnerRangeIndex++);
                        sliderRangeElement.append(sliderInnerRangeElement);
                        sliderHandle.nextInnerRangeElement = sliderInnerRangeElement;
                    }

                    if (index > 0) {
                        sliderHandle.prevInnerRangeElement = sliderHandles[index - 1].nextInnerRangeElement;
                    }

                    validateHandleSteppingValue(handleValue);

                    handleValue.displayValue = formatTickValue(handleValue.value);

                    sliderHandle.prevPageX = NaN;

                    $swipe.bind(sliderHandle, {
                        start: function (coords) {
                            draggedSliderHandle = sliderHandle;
                        },
                        end: function (coords) {
                            if (angular.isDefined(draggedSliderHandle)) {
                                snapHandleToStepIncrement(draggedSliderHandle);
                                var dragEndArg = {valueIndex: draggedSliderHandle.handleIndex};
                                draggedSliderHandle = undefined;
                                scope.$emit('dragEnd', dragEndArg);
                            }
                        }
                    });
                    $swipe.bind(sliderRangeElement, {
                        move: function (coords) {
                            if (angular.isDefined(draggedSliderHandle)) {
                                swipeMove(draggedSliderHandle, coords.x);
                            }
                        },
                        end: function () {
                            if (angular.isDefined(draggedSliderHandle)) {
                                snapHandleToStepIncrement(draggedSliderHandle);
                                var dragEndArg = {valueIndex: draggedSliderHandle.handleIndex};
                                draggedSliderHandle = undefined;
                                scope.$emit('dragEnd', dragEndArg);
                            }
                        }
                    });
                });

                // Don't add the slider handles to the DOM until after they all have been created
                // This will create them at the top of the Z-Order and the drawing will be as expected
                sliderHandles.forEach(function (sliderHandle) {
                    sliderRangeElement.append(sliderHandle);
                    sliderHandle.ready(function () {
                        updateSliderHandleElement(sliderHandle, scope.handleValues[sliderHandle.handleIndex].value);
                    });
                });

                function swipeMove(draggedHandle, pageX) {
                    if (pageX === draggedHandle.prevPageX) {
                        return;
                    }
                    var movingLeft = pageX < draggedHandle.prevPageX;
                    if ((movingLeft && (sliderRangeElement.prop('offsetLeft') > pageX)) ||
                        (sliderRangeElement.prop('offsetLeft') + sliderRangeElement.prop('clientWidth')) < pageX) {
                        return;
                    }

                    var draggedHandleValue = scope.handleValues[draggedHandle.handleIndex];
                    var prevSlider = draggedHandle.handleIndex > 0 ? sliderHandles[draggedHandle.handleIndex - 1] : undefined;
                    var nextSlider = draggedHandle.handleIndex < (sliderHandles.length - 1) ? sliderHandles[draggedHandle.handleIndex + 1] : undefined;

                    var pageXWithHandleOffset = movingLeft ? pageX - draggedHandle.getHandleOffset() : pageX + draggedHandle.getHandleOffset();

                    if ((movingLeft && (angular.isDefined(prevSlider) && (prevSlider.prevPageX + prevSlider.getHandleOffset()) >= pageXWithHandleOffset)) ||
                        (angular.isDefined(nextSlider) && (nextSlider.prevPageX - nextSlider.getHandleOffset()) <= pageXWithHandleOffset)) {
                        return;
                    }

                    draggedHandle.x = Math.round(pageX - draggedHandle.getHandleOffset());
                    draggedHandle.css({
                        left: draggedHandle.x + 'px'
                    });

                    var width = 0;
                    if (angular.isDefined(draggedHandle.nextInnerRangeElement)) {
                        draggedHandle.nextInnerRangeElement.css({
                            left: pageX + 'px'
                        });
                        if (angular.isDefined(nextSlider)) {
                            width = nextSlider.prevPageX - pageX;
                            draggedHandle.nextInnerRangeElement.css({
                                width: width + 'px'
                            });
                        }
                    }
                    if (angular.isDefined(draggedHandle.prevInnerRangeElement) && angular.isDefined(prevSlider)) {
                        width = pageX - prevSlider.prevPageX;
                        draggedHandle.prevInnerRangeElement.css({
                            width: width + 'px'
                        });
                    }

                    draggedHandle.prevPageX = pageX;

                    var newValue = Math.round(getValueByPosition(pageX - sliderRangeElement.prop('offsetLeft')));

                    if (valueOnStep(newValue, draggedHandleValue.step)) {
                        // Only update the value properties if the new value lands on a valid stepping value
                        draggedHandleValue.value = newValue;
                        draggedHandleValue.displayValue = formatTickValue(draggedHandleValue.value);

                        // force the application of the scope.handleValues[].value update
                        scope.$apply('draggedHandleValue.value');
                    }
                }

                function snapHandleToStepIncrement(draggedSliderHandle) {
                    var draggedHandleValue = scope.handleValues[draggedSliderHandle.handleIndex];
                    var valueX = calculateXForValue(draggedHandleValue.value);
                    var leftOfHandle = draggedSliderHandle.prevPageX < valueX;
                    var valueXDistanceRoundingPoint = 0;

                    if (leftOfHandle) {
                        var prevValue = Math.max(draggedHandleValue.value - draggedHandleValue.step, scope.min);
                        var prevValueX = calculateXForValue(prevValue);
                        valueXDistanceRoundingPoint = Math.floor((valueX - prevValueX) / 2);
                        if (draggedSliderHandle.prevPageX < (prevValueX + valueXDistanceRoundingPoint)) {
                            swipeMove(draggedSliderHandle, prevValueX);
                        } else {
                            swipeMove(draggedSliderHandle, valueX);
                        }
                    } else {
                        var nextValue = Math.min(draggedHandleValue.value + draggedHandleValue.step, scope.max);
                        var nextValueX = calculateXForValue(nextValue);
                        valueXDistanceRoundingPoint = Math.floor((nextValueX - valueX) / 2);
                        if (draggedSliderHandle.prevPageX > (nextValueX - valueXDistanceRoundingPoint)) {
                            swipeMove(draggedSliderHandle, nextValueX);
                        } else {
                            swipeMove(draggedSliderHandle, valueX);
                        }
                    }
                }

                function validateHandleSteppingValue(handleValue) {
                    if (angular.isUndefined(handleValue.step) ||
                        ((scope.max - scope.min) % handleValue.step !== 0) ||
                        (handleValue.value % handleValue.step !== 0)) {
                        if ((scope.max - scope.min) % handleValue.step !== 0) {
                            console.log("The handle's step value (" + handleValue.step +
                                ") must be a rational divisor of the slider's range (" +
                                (scope.max - scope.min) + ")");
                        }
                        else if ((handleValue.value - scope.min) % handleValue.step !== 0) {
                            console.log("The handle's step value (" + handleValue.step +
                                ") must be a rational divisor of the handle's value, relative to the slider's " +
                                "minimum value (" + (handleValue.value - scope.min) + ")");
                        }
                        console.log("The handle's step value is being reset to 1");
                        handleValue.step = 1;
                    }
                }

                function calculateXForValue(value) {
                    return Math.round((sliderRangeElement.prop('clientWidth') * ((value - scope.min) / (scope.max - scope.min))) + sliderRangeElement.prop('offsetLeft'));
                }

                function calculateHandleXAtValue(handle, value) {
                    return calculateXForValue(value) - handle.getHandleOffset();
                }

                function updateSliderHandleElement(sliderHandle, value) {
                    sliderHandle.prevPageX = calculateXForValue(value);
                    setHandlePositionByValue(sliderHandle, value);
                }

                function setHandlePositionByValue(handle, value) {
                    handle.x = calculateHandleXAtValue(handle, value);
                    handle.css({
                        left: handle.x + 'px'
                    });

                    var innerRangeX = calculateXForValue(value);
                    var width = 0;
                    if (angular.isDefined(handle.nextInnerRangeElement)) {
                        width = sliderHandles[handle.handleIndex + 1].prevPageX - innerRangeX;
                        handle.nextInnerRangeElement.css({
                            left: innerRangeX + 'px',
                            width: width + 'px'
                        });
                    }
                    if (angular.isDefined(handle.prevInnerRangeElement) && handle.handleIndex > 0) {
                        width = innerRangeX - sliderHandles[handle.handleIndex - 1].prevPageX;
                        handle.prevInnerRangeElement.css({
                            width: width + 'px'
                        });
                    }
                    return handle.x;
                }

                function getValueByPosition(position) {
                    var positionRatio = position / sliderRangeElement.prop('clientWidth');
                    var pointOffset = (scope.max - scope.min) * positionRatio;
                    return pointOffset + scope.min;
                }

                function generateTickMarks() {
                    var range = scope.max - scope.min;
                    var rangePerTick = range / 4;
                    for (var tick = 0; tick < 5; ++tick) {
                        var tickValue = scope.min + (rangePerTick * tick);
                        var tickElement = angular.element("<span></span>")
                            .addClass("angular-custom-range-slider-tick")
                            .css({top: (sliderRangeElement.prop('offsetTop') + sliderRangeElement.prop('offsetHeight')) + 'px'});
                        tickElement.text(formatTickValue(tickValue));
                        tickElement.prop('tickValue', tickValue);
                        (function (tickElement) {
                            tickElement.ready(function () {
                                tickElement.css({left: calculateXForValue(tickElement.prop('tickValue')) - (tickElement.prop('clientWidth') / 2) + 'px'});
                            });
                        }(tickElement));
                        sliderRangeElement.append(tickElement);
                    }
                }

                function formatTickValue(tickValue) {
                    // pass the value in as an object so that it will be properly marshaled to the parent controller
                    return scope.tickToFormatted({value: tickValue});
                }

                function valueOnStep(value, step) {
                    return ((value % step) === 0);
                }

                scope.handleValueChanged = function (handleValue) {
                    // pass the value in as an object so that it will be properly marshaled to the parent controller
                    if (scope.isValid(handleValue)) {
                        var index = scope.handleValues.indexOf(handleValue);
                        handleValue.value = scope.formattedToTick({value: handleValue.displayValue});
                        updateSliderHandleElement(sliderHandles[index], handleValue.value);
                        scope.$emit('dragEnd', {valueIndex: index});
                    }
                };

                // handle any changes to the handleValues collection, this will capture any structural changes
                // after the initialization of the directive
                scope.$watchCollection('handleValues', function (newHandleValues, oldHandleValues) {
                    if (angular.equals(newHandleValues, oldHandleValues)) {
                        return;
                    }
                    if (newHandleValues.length !== oldHandleValues.length) {
                        return;
                    }

                    angular.forEach(newHandleValues, function (handleValue) {
                        handleValue.displayValue = formatTickValue(handleValue.value);
                        updateSliderHandleElement(sliderHandles[scope.handleValues.indexOf(handleValue)], handleValue.value);
                    });
                });

                scope.isValid = function (handleValue) {
                    if (scope.isValidFormattedValue({value: handleValue.displayValue})) {
                        var value = scope.formattedToTick({value: handleValue.displayValue});

                        if (valueOnStep(value, handleValue.step)) {
                            var currentHandleElement = sliderHandles[scope.handleValues.indexOf(handleValue)];
                            var newValuesX = calculateXForValue(value);
                            var handlesLeadingEdge = newValuesX - currentHandleElement.getHandleOffset();
                            var handlesTrailingEdge = newValuesX + currentHandleElement.getHandleOffset();
                            var prevSlider = currentHandleElement.handleIndex > 0 ? sliderHandles[currentHandleElement.handleIndex - 1] : undefined;
                            var nextSlider = currentHandleElement.handleIndex < (sliderHandles.length - 1) ? sliderHandles[currentHandleElement.handleIndex + 1] : undefined;

                            if ((angular.isDefined(prevSlider) && (prevSlider.prevPageX + prevSlider.getHandleOffset()) >= handlesLeadingEdge) ||
                                (angular.isDefined(nextSlider) && (nextSlider.prevPageX - nextSlider.getHandleOffset()) <= handlesTrailingEdge)) {
                                return false;
                            }

                            var previousRangesValue = currentHandleElement.handleIndex > 0 ?
                                scope.handleValues[currentHandleElement.handleIndex - 1].value : scope.min;
                            var nextRangesValue = currentHandleElement.handleIndex < (scope.handleValues.length - 1) ?
                                scope.handleValues[currentHandleElement.handleIndex + 1].value : scope.max;

                            return value >= previousRangesValue && value <= nextRangesValue;
                        }
                    }
                    return false;
                };

                scope.handleKeyUp = function (event, handleValue) {
                    var currentValue = scope.formattedToTick({value: handleValue.displayValue});
                    var newValuesX = NaN;
                    switch (event.keyCode) {
                        case 38: // Up
                            if (currentValue < scope.max) {
                                if ((currentValue % handleValue.step) === 0) {
                                    currentValue += handleValue.step;
                                }
                                else {
                                    currentValue += handleValue.step - (currentValue % handleValue.step);
                                }
                                newValuesX = calculateXForValue(currentValue);
                                var handleIndex = scope.handleValues.indexOf(handleValue);
                                var handlesTrailingEdge = newValuesX + sliderHandles[handleIndex].getHandleOffset();
                                var nextSlider = handleIndex < (sliderHandles.length - 1) ? sliderHandles[handleIndex + 1] : undefined;
                                if (angular.isUndefined(nextSlider) || (nextSlider.prevPageX - nextSlider.getHandleOffset()) > handlesTrailingEdge) {
                                    handleValue.displayValue = scope.tickToFormatted({value: currentValue});
                                    scope.handleValueChanged(handleValue);
                                }
                            }
                            break;
                        case 40: // Down
                            if (currentValue > scope.min) {
                                if ((currentValue % handleValue.step) === 0) {
                                    currentValue -= handleValue.step;
                                }
                                else {
                                    currentValue -= currentValue % handleValue.step;
                                }
                                newValuesX = calculateXForValue(currentValue);
                                var handleIndex = scope.handleValues.indexOf(handleValue);
                                var handlesLeadingEdge = newValuesX - sliderHandles[handleIndex].getHandleOffset();
                                var prevSlider = handleIndex > 0 ? sliderHandles[handleIndex - 1] : undefined;
                                if (angular.isUndefined(prevSlider) || (prevSlider.prevPageX + prevSlider.getHandleOffset()) < handlesLeadingEdge) {
                                    handleValue.displayValue = scope.tickToFormatted({value: currentValue});
                                    scope.handleValueChanged(handleValue);
                                }
                            }
                            break;
                    }
                };
            }
        };
    }]);
