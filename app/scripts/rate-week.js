/**
 * scripts/rate-week.js
 *
 * This is a sample CommonJS module.
 * Take a look at http://browserify.org/ for more info
 */

'use strict';

function RateWeek(app) {
	var self = this;

	var rateWeek = app.myViewModel.rateWeek = {};

	rateWeek.registerMouseX = ko.observable();
	rateWeek.registerStartPercentage = ko.observable(0);
	rateWeek.registerRatio = ko.observable($(document).width() - 20);
	rateWeek.show = ko.observable(false);

	rateWeek.totals = ko.computed(function() {
		var total = 0;
		_.each(app.myViewModel.selectProject.groups(), function(group) {
			_.each(group.attributes.projects(), function(project) {
				total = total + project.attributes.percentage();
			});
		});
		return total;
	});

	rateWeek.drag = function(item, event) {
		var direction = event.gesture.direction;
		if (direction == 'left' || direction == 'right') {
			var startX = event.gesture.startEvent.center.pageX;
			if (rateWeek.registerMouseX() != startX) {
				rateWeek.registerMouseX(startX);
				rateWeek.registerStartPercentage(item.attributes.percentage());
			}
			var diff = (event.gesture.deltaX / rateWeek.registerRatio()) * 150;
			var newPercentage = Math.floor((diff + rateWeek.registerStartPercentage()) / 5) * 5;

			if (newPercentage > 0 && newPercentage <= 150) {
				item.attributes.percentage(newPercentage);
			} else if (newPercentage > 150) {
				item.attributes.percentage(150);
			} else {
				item.attributes.percentage(0);
			}
		}
	}

	rateWeek.goBack = function() {
		app.myViewModel.selectProject.show(true);
		rateWeek.show(false);
		app.goToView('select-project');
	}

	rateWeek.goNext = function() {
		rateWeek.show(false);
		app.myViewModel.notes.show(true);
		app.goToView('notes');
	}

	return self;
}

module.exports = RateWeek;