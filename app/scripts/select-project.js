/**
 * scripts/select-project.js
 *
 * This is a sample CommonJS module.
 * Take a look at http://browserify.org/ for more info
 */

'use strict';

function SelectProject(app) {
	var self = this;

	var selectProject = app.myViewModel.selectProject = {};

	selectProject.viewType = ko.observable('all');
	selectProject.allProjects = ko.observableArray();
	selectProject.isAddMode = ko.observable(false);
	selectProject.uniqueCompanyNames = ko.observableArray();
	selectProject.filteredProjectList = ko.observableArray();
	selectProject.isRefreshDragging = ko.observable(false);
	selectProject.dragStart = ko.observable(0);
	selectProject.count = ko.observable(0);
	selectProject.week = ko.observable('This Week');
	selectProject.show = ko.observable(false);
	selectProject.today = moment(new Date()).startOf('isoweek');

	selectProject.getProjects = function() {
		Parse.Cloud.run('getProjects', {}, {
			success: function(projects) {
				selectProject.allProjects([]);
				for (var i = 0; i < projects.length; i++) {
					projects[i].attributes.active = ko.observable(false);
					projects[i].attributes.percentage = ko.observableArray([{ value: ko.observable(0) }, { value: ko.observable(0) }, { value: ko.observable(0) }]);
					selectProject.allProjects.push(projects[i]);
				}

				$('#select-project .refresh').html('<span class="fa fa-arrow-circle-down"></span>Pull to refresh');
				selectProject.isRefreshDragging(false);
				selectProject.dragStart(0);
				$('#select-project .all-projects').animate({
					marginTop: 0
				}, 100);
			}, error: function(error) {
				console.log(error);
			}
		});

		Parse.Cloud.run('getUniqueCompanyNames', {}, {
			success: function(projects) {
				selectProject.uniqueCompanyNames(projects);
			}, error: function(error) {
				console.log(error);
			}
		});
	}

	selectProject.goHome = function() {
		selectProject.show(false);
		app.goToView('home');
	}

	selectProject.init = function(index) {
		var styledDate = 'Week of ' + moment(selectProject.today).add('days', (index * 7)).format('MMM D');
		if (index == 0) styledDate = 'This Week';
		if (index == 1) styledDate = 'Next Week';
		selectProject.week(styledDate);
		selectProject.show(true);
		selectProject.getProjects();
	}

	selectProject.toggleProject = function(item, event) {
		if (item.attributes.active()) {
			item.attributes.active(false);
			selectProject.count(selectProject.count() - 1);
		} else {
			item.attributes.active(true);
			selectProject.count(selectProject.count() + 1);
		}
	}

	selectProject.toggleAddMode = function() {
		if (selectProject.isAddMode()) {
			app.myViewModel.header.isModal(false);
			selectProject.isAddMode(false);
		} else {
			app.myViewModel.header.isModal(true);
			$('.project-typeahead-field').val('');
			$('.project-name-field').val('');
			selectProject.filteredProjectList([]);
			selectProject.isAddMode(true);
		}
	}

	selectProject.toggleView = function() {
		if (selectProject.viewType() == 'all') {
			selectProject.viewType('selected');
		} else {
			selectProject.viewType('all');
		}
	}

	selectProject.selectProjectTypeahead = function(item) {
		$('.project-typeahead-field').val(item);
		selectProject.filteredProjectList([]);
	}

	selectProject.showTypeaheadResults = function(item, event) {
		var needle = event.target.value.toLowerCase().replace(/[^\w\d]/gi, '');

		if (needle.length > 0) {
			var filteredProjects = _.filter(selectProject.uniqueCompanyNames(), function(obj) {
				var haystack = obj.toLowerCase().replace(/[^\w\d]/gi, '');
				return haystack.indexOf(needle) >= 0; 
			});
			var fieldPosition = $('.project-typeahead-field').offset();
			$('.project-typeahead').css('left', fieldPosition.left).css('top', fieldPosition.top + $('.project-typeahead-field').height()+20);
			selectProject.filteredProjectList(filteredProjects);
		} else {
			selectProject.filteredProjectList([]);
		}
	}

	selectProject.saveNewProject = function() {
		var data = {
			company: $('.project-typeahead-field').val(),
			project: $('.project-name-field').val(),
		}
		Parse.Cloud.run('saveProject', data, {
			success: function(project) {
				alert('"' + project.attributes.company + ': ' + project.attributes.name + '" created successfully.');
				selectProject.toggleAddMode();
				selectProject.getProjects();
			}, error: function(error) {
				// alert(error)
				console.log(error);
			}
		});	
	}

	selectProject.dragRefresh = function(item, event) {
		if (selectProject.isRefreshDragging() && selectProject.dragStart() == 0) {
			var top = $('#select-project .all-projects').scrollTop();
			var delta = Math.floor(event.gesture.distance);
			if (top == 0 && delta > 30) {
				if (delta > 150) delta = 150;
				$('#select-project .all-projects').css('margin-top', delta - 30);
				if (delta >= 100) {
					$('#select-project .refresh').html('<span class="fa fa-arrow-circle-up"></span>Release to refresh');
				} else {
					$('#select-project .refresh').html('<span class="fa fa-arrow-circle-down"></span>Pull to refresh');
				}
			}
		}
	}

	selectProject.startRefreshDrag = function(item, event) {
		if (!selectProject.isRefreshDragging() && selectProject.dragStart() == 0) {
			selectProject.dragStart($('#select-project .all-projects').scrollTop());
			selectProject.isRefreshDragging(true);
			$(event.gesture.target).one('dragend', function(event) {
				var delta = parseInt($('#select-project .all-projects').css('margin-top'));

				if (delta >= 70) {
					selectProject.getProjects();
					$('#select-project .refresh').html('<span class="fa fa-refresh fa-spin"></span>Refreshing...');
				} else {
					$('#select-project .refresh').html('<span class="fa fa-arrow-circle-down"></span>Pull to refresh');
					selectProject.isRefreshDragging(false);
					selectProject.dragStart(0);
					$('#select-project .all-projects').animate({
						marginTop: 0
					}, 100);
				}
			})
		}

	}

	selectProject.init();

	return self;
}

module.exports = SelectProject;