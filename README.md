# angular-custom-range-slider
==============
This is a slider control written using only [Angular.js](http://angularjs.org/) with no dependency on [jQuery](http://jquery.com/).

## Purpose

The purpose of this control is to provide [Angular.js](http://angularjs.org/) developers with a slider control that also supports ranges while maintaining a small footprint.

Most slider control implementations for [Angular.js](http://angularjs.org/) are little more than wrappers for the [jQueryUI](http://jqueryui.com/) slider control. While this is not inherently bad or wrong, especially when most [Angular.js](http://angularjs.org/) apps are already utilizing [jQuery](http://jquery.com/), it does force potentially unwanted dependencies into apps that are attempting to keep their code base simple.

## Functionality

This control provides the basic functionality that is expected of a slider control:

* A well defined range element
* Well defined drag handles to allow the changing of values
* Both Common and Individual classes on stylable controls to allow for user customization

### Additional Functionality
* Ability to create *n* number of ranges just by passing in *n* number of value objects
* Both Common and Individual classes for the styling of the ranges between drag handles
* User customizable value formatting to allow for any style of display for the raw values used within the control

## Using angular-custom-range-slider in your project

### Installing from Bower
    **add Bower install instructions once Bower support is added**

### Using with your code
    <angular-custom-range-slider min="20" max="80" handle-values="sliderValues" show-values show-ticks
                    is-valid-formatted_value="isValidFormattedValue(value)" formatted-to-tick="formattedToTick(value)"
                    tick-to-formatted="tickToFormatted(value)"></angular-custom-range-slider>

Some of these values are self explanatory when it comes to a slider control, but I will explain each settings anyway just in case.

| Attribute Name           | Default Value         | What the Attribute Does                              |
|--------------------------|----------------------:|------------------------------------------------------|
| min                      | 0                     | Sets the minimum value of the slider control's range |
| max                      | 100                   | Sets the maximum value of the slider control's range |
| handle-values            | *undefined*           | Provides the control with the initial values of the drag handles. *see the handle values table below for further explanation* |
| show-values              | false                 | Controls whether the value input boxes will be displayed, allowing the user to quickly enter a value without using the drag handle |
| show-ticks               | false                 | Controls whether the user formatted tick values will be displayed along the bottom of the slider control |
| is-valid-formatted_value | returns true          | Provides a function that will validate the value entered into the value input control, determining if the entered value can be expressed by a drag handle's position |
| formatted-to-tick        | returns the raw value | Provides a function that will convert a formatted value back into the raw value used within the slider control |
| tick-to-formatted        | returns the raw value | Provides a function that will convert a raw value used within the slider control to a formatted value that will be displayed as a tick value and within the input boxes |

#### handle-values explanation
| Attribute Name | Default Value | What the Attribute Does                                                 |
|----------------|--------------:|-------------------------------------------------------------------------|
| value          | *undefined*   | Sets the initial value for the drag handle                              |
| step           | 1             | Sets the minimum number of raw values by which a drag handle may change |

    If the handle-values attribute is not set then no drag handles can be displayed and neither can the value input box(es)
    The step value must be evenly divisible into the slider control's range as defined by {max - min} % step === 0
    The step value must also be evenly divisible into the associated value's offset from the slider control's minimum value as defined by {value - min} % step === 0

### Demo
See the [demo](http://#) page for an illustration of some of the usages of the angular-custom-range-slider control