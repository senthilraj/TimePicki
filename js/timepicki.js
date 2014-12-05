/* 
 * Author: senthil
 * plugin: timepicker
 */
(function($) {

	$.fn.timepicki = function(options) {

		var defaults = {
			format_output: function(tim, mini, meri) {
				return tim + " : " + mini + " : " + meri;
			},
			increase_direction: 'down',
			custom_classes: ''
		};

		var settings = $.extend({}, defaults, options);

		return this.each(function() {

			var ele = $(this);
			var ele_hei = ele.outerHeight();
			var ele_lef = ele.position().left;
			ele_hei += 10;
			$(ele).wrap("<div class='time_pick'>");
			var ele_par = $(this).parents(".time_pick");

			// developer can specify which arrow makes the numbers go up or down
			var top_arrow_button = (settings.increase_direction === 'down') ?
				"<div class='prev action-prev'></div>" :
				"<div class='prev action-next'></div>";
			var bottom_arrow_button = (settings.increase_direction === 'down') ?
				"<div class='next action-next'></div>" :
				"<div class='next action-prev'></div>";

			ele_par.append(
				"<div class='timepicker_wrap " + settings.custom_classes + "'>" +
					"<div class='arrow_top'></div>" +
					"<div class='time'>" +
						top_arrow_button +
						"<div class='ti_tx'><input type='text' class='timepicki-input'></div>" +
						bottom_arrow_button +
					"</div>" +
					"<div class='mins'>" +
						top_arrow_button +
						"<div class='mi_tx'><input type='text' class='timepicki-input'></div>" +
						bottom_arrow_button +
					"</div>" +
					"<div class='meridian'>" +
						top_arrow_button +
						"<div class='mer_tx'><input type='text' class='timepicki-input'></div>" +
						bottom_arrow_button +
					"</div>" +
				"</div>");
			var ele_next = $(this).next(".timepicker_wrap");
			var ele_next_all_child = ele_next.find("div");
			ele_next.css({
				"top": ele_hei + "px",
				"left": ele_lef + "px"
			});

			var inputs = ele_par.find('input');

			// open or close time picker when clicking
			$(document).on("click", function(event) {
				if (!$(event.target).is(ele_next)) {
					if (!$(event.target).is(ele)) {
						set_value(event, !is_element_in_timepicki($(event.target)));
					} else {
						open_timepicki();
					}
				}
			});

			// open the modal when the user focuses on the input
			ele.on('focus', open_timepicki);

			// select all text in input when user focuses on it
			inputs.on('focus', function() {
				var input = $(this);
				if (!input.is(ele)) {
					input.select();
				}
			});

			// close the modal when the time picker loses keyboard focus
			inputs.on('blur', function() {
				setTimeout(function() {
					var focused_element = $(document.activeElement);
					if (!is_element_in_timepicki(focused_element)) {
						set_value();
						close_timepicki();
					}
				}, 0);
			});

			function is_element_in_timepicki(jquery_element) {
				return $.contains(ele_par[0], jquery_element[0]) || ele_par.is(jquery_element);
			}

			function set_value(event, close) {
				// use input values to set the time
				var tim = ele_next.find(".ti_tx input").val();
				var mini = ele_next.find(".mi_tx input").val();
				var meri = ele_next.find(".mer_tx input").val();

				if (tim.length !== 0 && mini.length !== 0 && meri.length !== 0) {
					// store the value so we can set the initial value
					// next time the picker is opened
					ele.attr('data-timepicki-tim', tim);
					ele.attr('data-timepicki-mini', mini);
					ele.attr('data-timepicki-meri', meri);

					// set the formatted value
					ele.val(settings.format_output(tim, mini, meri));
				}

				if (close) {
					close_timepicki();
				}
			}

			function open_timepicki() {
				set_date(settings.start_time);
				ele_next.fadeIn();
				// focus on the first input and select its contents
				var first_input = ele_next.find('input:visible').first();
				first_input.focus();
				// if the user presses shift+tab while on the first input,
				// they mean to exit the time picker and go to the previous field
				var first_input_exit_handler = function(e) {
					if (e.which === 9 && e.shiftKey) {
						first_input.off('keydown', first_input_exit_handler);
						var all_form_elements = $(':input:visible:not(.timepicki-input)');
						var index_of_timepicki_input = all_form_elements.index(ele);
						var previous_form_element = all_form_elements.get(index_of_timepicki_input-1);
						previous_form_element.focus();
					}
				};
				first_input.on('keydown', first_input_exit_handler);
			}

			function close_timepicki() {
				ele_next.fadeOut();
			}

			function set_date(start_time) {

				// if a value was already picked we will remember that value
				if (ele.is('[data-timepicki-tim]')) {
					var ti = Number(ele.attr('data-timepicki-tim'));
					var mi = Number(ele.attr('data-timepicki-mini'));
					var mer = ele.attr('data-timepicki-meri');

				// developer can specify a custom starting value
				} else if (typeof start_time === 'object') {
					var ti = Number(start_time[0]);
					var mi = Number(start_time[1]);
					var mer = start_time[2];

				// default is we will use the current time
				} else {
					var d = new Date();
					var ti = d.getHours();
					var mi = d.getMinutes();
					var mer = "AM";
					if (12 < ti) {
						ti -= 12;
						mer = "PM";
					}
				}

				if (ti < 10) {
					ele_next.find(".ti_tx input").val("0" + ti);
				} else {
					ele_next.find(".ti_tx input").val(ti);
				}
				if (mi < 10) {
					ele_next.find(".mi_tx input").val("0" + mi);
				} else {
					ele_next.find(".mi_tx input").val(mi);
				}
				if (mer < 10) {
					ele_next.find(".mer_tx input").val("0" + mer);
				} else {
					ele_next.find(".mer_tx input").val(mer);
				}
			}


			var cur_next = ele_next.find(".action-next");
			var cur_prev = ele_next.find(".action-prev");


			$(cur_prev).add(cur_next).on("click", function() {
				//console.log("click");
				var cur_ele = $(this);
				var cur_cli = null;
				var ele_st = 0;
				var ele_en = 0;
				if (cur_ele.parent().attr("class") == "time") {
					//alert("time");
					cur_cli = "time";
					ele_en = 12;
					var cur_time = null;
					cur_time = ele_next.find("." + cur_cli + " .ti_tx input").val();
					cur_time = Number(cur_time);
					//console.log(ele_next.find("." + cur_cli + " .ti_tx"));
					if ($(cur_ele).hasClass('action-next')) {
						//alert("nex");
						if (cur_time == 12) {
							ele_next.find("." + cur_cli + " .ti_tx input").val("01");
						} else {
							cur_time++;

							if (cur_time < 10) {
								ele_next.find("." + cur_cli + " .ti_tx input").val("0" + cur_time);
							} else {
								ele_next.find("." + cur_cli + " .ti_tx input").val(cur_time);
							}
						}

					} else {
						if (cur_time == 1) {
							ele_next.find("." + cur_cli + " .ti_tx input").val(12);
						} else {
							cur_time--;
							if (cur_time < 10) {
								ele_next.find("." + cur_cli + " .ti_tx input").val("0" + cur_time);
							} else {
								ele_next.find("." + cur_cli + " .ti_tx input").val(cur_time);
							}
						}
					}

				} else if (cur_ele.parent().attr("class") == "mins") {
					//alert("mins");
					cur_cli = "mins";
					ele_en = 59;
					var cur_mins = null;
					cur_mins = ele_next.find("." + cur_cli + " .mi_tx input").val();
					cur_mins = parseInt(cur_mins);
					if ($(cur_ele).hasClass('action-next')) {
						//alert("nex");
						if (cur_mins == 59) {
							ele_next.find("." + cur_cli + " .mi_tx input").val("00");
						} else {
							cur_mins++;
							if (cur_mins < 10) {
								ele_next.find("." + cur_cli + " .mi_tx input").val("0" + cur_mins);
							} else {
								ele_next.find("." + cur_cli + " .mi_tx input").val(cur_mins);
							}
						}
					} else {

						if (cur_mins == 0) {
							ele_next.find("." + cur_cli + " .mi_tx input").val(59);
						} else {
							cur_mins--;

							if (cur_mins < 10) {
								ele_next.find("." + cur_cli + " .mi_tx input").val("0" + cur_mins);
							} else {
								ele_next.find("." + cur_cli + " .mi_tx input").val(cur_mins);
							}

						}

					}
				} else {
					//alert("merdian");
					ele_en = 1;
					cur_cli = "meridian";
					var cur_mer = null;
					cur_mer = ele_next.find("." + cur_cli + " .mer_tx input").val();
					if ($(cur_ele).hasClass('action-next')) {
						//alert(cur_mer);
						if (cur_mer == "AM") {
							ele_next.find("." + cur_cli + " .mer_tx input").val("PM");
						} else {
							ele_next.find("." + cur_cli + " .mer_tx input").val("AM");
						}
					} else {
						if (cur_mer == "AM") {
							ele_next.find("." + cur_cli + " .mer_tx input").val("PM");
						} else {
							ele_next.find("." + cur_cli + " .mer_tx input").val("AM");
						}
					}
				}


			});

		});
	};

}(jQuery));