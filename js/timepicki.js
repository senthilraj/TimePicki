(function ($) {

    $.fn.timepicki = function (options) {
        var settings = $.extend({
            format_output: function (hours, minutes, meridian) {
                if (settings.show_meridian) {
                    hours = Math.min(Math.max(parseInt(hours), 1), 12);
                } else {
                    hours = Math.min(Math.max(parseInt(hours), 0), 23);
                }

                if (hours < 10) {
                    hours = '0' + hours;
                }

                minutes = Math.min(Math.max(parseInt(minutes), 0), 59);
                if (minutes < 10) {
                    minutes = '0' + minutes;
                }

                return hours + ':' + minutes + (settings.show_meridian ? ' ' + meridian : '');
            },
            increase_direction: 'up',
            custom_classes: '',
            min_hour_value: 1,
            max_hour_value: 12,
            show_meridian: true,
            step_size_hours: '1',
            step_size_minutes: '1',
            overflow_minutes: false,
            disable_keyboard_mobile: false,
            reset: false,
            on_change: null
        }, options);

        return this.each(function () {
            var $element = $(this),
                elementHeight = $element.outerHeight() + 10,
                top_arrow_button = '<div class="prev action-next"></div>',
                bottom_arrow_button = '<div class="next action-prev"></div>';

            $element.wrap('<div class="time_pick">');
            var $parent = $element.parents('.time_pick');

            if (settings.increase_direction === 'down') {
                top_arrow_button = '<div class="prev action-prev"></div>';
                bottom_arrow_button = '<div class="next action-next"></div>';
            }

            var $newElement = $(
                '<div class="timepicker_wrap ' + settings.custom_classes + '">' +
                '<div class="arrow_top"></div>' +
                '<div class="time">' +
                top_arrow_button +
                '<div class="ti_tx"><input type="text" class="timepicki-input"' + (settings.disable_keyboard_mobile ? 'readonly' : '') + '></div>' +
                bottom_arrow_button +
                '</div>' +
                '<div class="mins">' +
                top_arrow_button +
                '<div class="mi_tx"><input type="text" class="timepicki-input"' + (settings.disable_keyboard_mobile ? 'readonly' : '') + '></div>' +
                bottom_arrow_button +
                '</div>'
            );

            if (settings.show_meridian) {
                $newElement.append(
                    '<div class="meridian">' +
                    top_arrow_button +
                    '<div class="mer_tx"><input type="text" class="timepicki-input" readonly></div>' +
                    bottom_arrow_button +
                    '</div>');
            }
            if (settings.reset) {
                $newElement.append('<div><a href="#" class="reset_time">Reset</a></div>');
            }
            $parent.append($newElement);

            var $elementWrapper = $element.next('.timepicker_wrap'),
                $inputs = $parent.find('input');

            $('.reset_time').on('click', function () {
                $element.val('');
                closeTimepicki();
            });

            //-----------------------------------------------------------------------------------
            //  NOTE:.change() event does not work here, as it is called when input looses focus
            //-----------------------------------------------------------------------------------
            $('.timepicki-input').keydown(function (keyevent) {

                // enter - prevent form submission and close popup
                if (keyevent.keyCode === 13) {
                    keyevent.preventDefault();

                    setValue();
                    closeTimepicki();

                    return;
                }

                // the grand father div specifies the type of input that we are dealing with (time/mins/meridian)
                var $input = $(this),
                    lastValue = $input.val(),
                    $grandfatherDiv = $input.parent().parent();

                // validate input values
                function validate() {
                    var isValidNumber = /^\d+$/.test(lastValue),
                        isEmpty = lastValue === '';

                    // hours
                    if ($grandfatherDiv.hasClass('time')) {
                        if (isValidNumber) {
                            var hours = (settings.show_meridian) ?
                                Math.min(Math.max(parseInt(lastValue), 1), 12) :
                                Math.min(Math.max(parseInt(lastValue), 0), 23);

                            $input.val(hours);
                        } else if (!isEmpty) {
                            $input.val(lastValue);
                        }
                    } else if ($grandfatherDiv.hasClass('mins')) {
                        if (isValidNumber) {
                            var minutes = Math.min(Math.max(parseInt($input.val()), 0), 59);

                            $input.val(minutes);
                        } else if (!isEmpty) {
                            $input.val(lastValue);
                        }
                    } else if ($grandfatherDiv.hasClass('meridian')) { // MERIDIAN
                        // key presses should not affect meridian
                        keyevent.preventDefault();
                    }
                }

                // wrapValidate() ensures that validate() is called only once
                var done = false;
                function wrapValidate() {
                    if (!done) {
                        validate();

                        done = true;
                    }
                }

                // enqueue wrapValidate function before any thing else takes place
                setTimeout(wrapValidate, 0);
            });

            // open or close time picker when clicking
            $(document).on('click', function (event) {
                if (!$(event.target).is($elementWrapper) && $elementWrapper.css('display') === 'block' && !$(event.target).is($('.reset_time'))) {
                    if (!$(event.target).is($element)) {
                        setValue(!iselementInTimepicki($(event.target)));
                    } else {
                        $elementWrapper.css({
                            'top': elementHeight + 'px',
                            'left': '0px'
                        });

                        openTimepicki();
                    }
                }
            });

            // open the modal when the user focuses on the input
            $element.on('focus', openTimepicki);

            // select all text in input when user focuses on it
            $inputs.on('focus', function () {
                var input = $(this);
                if (!input.is($element)) {
                    input.select();
                }
            });

            // allow user to increase and decrease numbers using arrow keys
            $inputs.on('keydown', function (e) {
                var direction, input = $(this);

                // arrow key up
                if (e.which === 38) {
                    if (settings.increase_direction === 'down') {
                        direction = 'prev';
                    } else {
                        direction = 'next';
                    }
                } else if (e.which === 40) { // arrow key down
                    if (settings.increase_direction === 'down') {
                        direction = 'next';
                    } else {
                        direction = 'prev';
                    }
                }

                if (input.closest('.timepicker_wrap .time').length) {
                    changeTime(null, direction);
                } else if (input.closest('.timepicker_wrap .mins').length) {
                    changeMins(null, direction);
                } else if (input.closest('.timepicker_wrap .meridian').length && settings.show_meridian) {
                    changeMeri(null, direction);
                }
            });

            // close the modal when the time picker loses keyboard focus
            $inputs.on('blur', function () {
                setTimeout(function () {
                    var focused_element = $(document.activeElement);
                    if (focused_element.is(':input') && !iselementInTimepicki(focused_element)) {
                        setValue();
                        closeTimepicki();
                    }
                }, 0);
            });

            function iselementInTimepicki(jquery_element) {
                return $.contains($parent[0], jquery_element[0]) || $parent.is(jquery_element);
            }

            function setValue(close) {
                // use input values to set the time
                var hoursInputVal = $elementWrapper.find('.ti_tx input').val(),
                    minutesInputVal = $elementWrapper.find('.mi_tx input').val(),
                    meridianInputVal = '';

                if (settings.show_meridian) {
                    meridianInputVal = $elementWrapper.find('.mer_tx input').val();
                }

                if (hoursInputVal.length !== 0 && minutesInputVal.length !== 0 && (!settings.show_meridian || meridianInputVal.length !== 0)) {
                    // store the value so we can set the initial value
                    // next time the picker is opened
                    $element.attr('data-timepicki-tim', hoursInputVal);
                    $element.attr('data-timepicki-mini', minutesInputVal);

                    if (settings.show_meridian) {
                        $element.attr('data-timepicki-meri', meridianInputVal);
                        // set the formatted value
                        $element.val(settings.format_output(hoursInputVal, minutesInputVal, meridianInputVal));
                    } else {
                        $element.val(settings.format_output(hoursInputVal, minutesInputVal));
                    }
                }

                //Call user on_change callback function if set
                if (settings.on_change !== null) {
                    settings.on_change($element[0]);
                }

                if (close) {
                    closeTimepicki();
                }
            }

            function openTimepicki() {
                setDate(settings.start_time);
                $elementWrapper.fadeIn();
                // focus on the first input and select its contents
                var first_input = $elementWrapper.find('input:visible').first();
                first_input.focus();
                // if the user presses shift+tab while on the first input,
                // they mean to exit the time picker and go to the previous field
                var first_input_exit_handler = function (e) {
                    if (e.which === 9 && e.shiftKey) {
                        first_input.off('keydown', first_input_exit_handler);

                        var all_form_elements = $(':input:visible:not(.timepicki-input)'),
                            index_of_timepicki_input = all_form_elements.index($element),
                            previous_form_element = all_form_elements.get(index_of_timepicki_input - 1);

                        previous_form_element.focus();
                    }
                };
                first_input.on('keydown', first_input_exit_handler);
            }

            function closeTimepicki() {
                $elementWrapper.fadeOut();
            }

            function setDate(start_time) {
                var dateObject, hours, minutes, meridian;

                // if a value was already picked we will remember that value
                if ($element.is('[data-timepicki-tim]')) {
                    hours = Number($element.attr('data-timepicki-tim'));
                    minutes = Number($element.attr('data-timepicki-mini'));
                    if (settings.show_meridian) {
                        meridian = $element.attr('data-timepicki-meri');
                    }
                    // developer can specify a custom starting value
                } else if (typeof start_time === 'object') {
                    hours = Number(start_time[0]);
                    minutes = Number(start_time[1]);
                    if (settings.show_meridian) {
                        meridian = start_time[2];
                    }
                    // default is we will use the current time
                } else {
                    dateObject = new Date();
                    hours = dateObject.getHours();
                    minutes = dateObject.getMinutes();
                    meridian = 'AM';
                    if (settings.show_meridian) {
                        if (hours === 0) { // midnight
                            hours = 12;
                        } else if (hours === 12) { // noon
                            meridian = 'PM';
                        } else if (hours > 12) {
                            hours -= 12;
                            meridian = 'PM';
                        }
                    }
                }

                if (hours < 10) {
                    $elementWrapper.find('.ti_tx input').val('0' + hours);
                } else {
                    $elementWrapper.find('.ti_tx input').val(hours);
                }
                if (minutes < 10) {
                    $elementWrapper.find('.mi_tx input').val('0' + minutes);
                } else {
                    $elementWrapper.find('.mi_tx input').val(minutes);
                }
                if (settings.show_meridian) {
                    if (meridian < 10) {
                        $elementWrapper.find('.mer_tx input').val('0' + meridian);
                    } else {
                        $elementWrapper.find('.mer_tx input').val(meridian);
                    }
                }
            }

            function changeTime(currentElement, direction) {
                var currentClass = 'time',
                    cur_time = Number($elementWrapper.find('.' + currentClass + ' .ti_tx input').val()),
                    ele_st = Number(settings.min_hour_value),
                    ele_en = Number(settings.max_hour_value),
                    stepSize = Number(settings.step_size_hours);

                if ((currentElement && currentElement.hasClass('action-next')) || direction === 'next') {
                    if (cur_time + stepSize > ele_en) {
                        var min_value = ele_st;
                        if (min_value < 10) {
                            min_value = '0' + min_value;
                        } else {
                            min_value = String(min_value);
                        }
                        $elementWrapper.find('.' + currentClass + ' .ti_tx input').val(min_value);
                    } else {
                        cur_time = cur_time + stepSize;
                        if (cur_time < 10) {
                            cur_time = '0' + cur_time;
                        }
                        $elementWrapper.find('.' + currentClass + ' .ti_tx input').val(cur_time);
                    }
                } else if ((currentElement && currentElement.hasClass('action-prev')) || direction === 'prev') {
                    var minValue = Number(settings.min_hour_value);

                    if (cur_time - stepSize < minValue) {
                        var max_value = ele_en;
                        if (max_value < 10) {
                            max_value = '0' + max_value;
                        } else {
                            max_value = String(max_value);
                        }
                        $elementWrapper.find('.' + currentClass + ' .ti_tx input').val(max_value);
                    } else {
                        cur_time = cur_time - stepSize;
                        if (cur_time < 10) {
                            cur_time = '0' + cur_time;
                        }
                        $elementWrapper.find('.' + currentClass + ' .ti_tx input').val(cur_time);
                    }
                }
            }

            function changeMins(cur_ele, direction) {
                var cur_cli = 'mins',
                    cur_mins = Number($elementWrapper.find('.' + cur_cli + ' .mi_tx input').val()),
                    ele_en = 59,
                    stepSize = Number(settings.step_size_minutes);

                if ((cur_ele && cur_ele.hasClass('action-next')) || direction === 'next') {
                    if (cur_mins + stepSize > ele_en) {
                        $elementWrapper.find('.' + cur_cli + ' .mi_tx input').val('00');
                        if (settings.overflow_minutes) {
                            changeTime(null, 'next');
                        }
                    } else {
                        cur_mins = cur_mins + stepSize;
                        if (cur_mins < 10) {
                            $elementWrapper.find('.' + cur_cli + ' .mi_tx input').val('0' + cur_mins);
                        } else {
                            $elementWrapper.find('.' + cur_cli + ' .mi_tx input').val(cur_mins);
                        }
                    }
                } else if ((cur_ele && cur_ele.hasClass('action-prev')) || direction === 'prev') {
                    if (cur_mins - stepSize <= -1) {
                        $elementWrapper.find('.' + cur_cli + ' .mi_tx input').val(ele_en + 1 - stepSize);
                        if (settings.overflow_minutes) {
                            changeTime(null, 'prev');
                        }
                    } else {
                        cur_mins = cur_mins - stepSize;
                        if (cur_mins < 10) {
                            $elementWrapper.find('.' + cur_cli + ' .mi_tx input').val('0' + cur_mins);
                        } else {
                            $elementWrapper.find('.' + cur_cli + ' .mi_tx input').val(cur_mins);
                        }
                    }
                }
            }

            function changeMeri(cur_ele, direction) {
                var cur_cli = 'meridian',
                    cur_mer = $elementWrapper.find('.' + cur_cli + ' .mer_tx input').val();

                if ((cur_ele && cur_ele.hasClass('action-next')) || direction === 'next') {
                    if (cur_mer === 'AM') {
                        $elementWrapper.find('.' + cur_cli + ' .mer_tx input').val('PM');
                    } else {
                        $elementWrapper.find('.' + cur_cli + ' .mer_tx input').val('AM');
                    }
                } else if ((cur_ele && cur_ele.hasClass('action-prev')) || direction === 'prev') {
                    if (cur_mer === 'AM') {
                        $elementWrapper.find('.' + cur_cli + ' .mer_tx input').val('PM');
                    } else {
                        $elementWrapper.find('.' + cur_cli + ' .mer_tx input').val('AM');
                    }
                }
            }

            // handle clicking on the arrow icons
            var $actionArrows = $elementWrapper.find('.action-next, .action-prev');
            $($actionArrows).on('click', function () {
                var $element = $(this);

                if ($element.parent().hasClass('time')) {
                    changeTime($element);
                } else if ($element.parent().hasClass('mins')) {
                    changeMins($element);
                } else if (settings.show_meridian) {
                    changeMeri($element);
                }
            });

        });
    };

}(jQuery));
