(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * scripts/app.js
 *
 * This is a sample CommonJS module.
 * Take a look at http://browserify.org/ for more info
 */

'use strict';

function App() {
	var self = this;

	// initialize knockout
	self.myViewModel = {};

	self.myViewModel.currentUser = ko.observable(null);

	self.initialize = function() {
		document.addEventListener('deviceready', self.onDeviceReady, false);
	}

	self.onDeviceReady = function() {
		ko.applyBindings(self.myViewModel);
		setTimeout(function() {
			navigator.splashscreen.hide();
		}, 2000);
		
	}

	return self;
}

module.exports = App;
},{}],2:[function(require,module,exports){
/**
 * scripts/auth.js
 *
 * This is a sample CommonJS module.
 * Take a look at http://browserify.org/ for more info
 */

'use strict';

function Auth(app) {
	var self = this;

	var auth = app.myViewModel.auth = {};

	auth.currentUser = ko.observable();
	auth.errorMessage = ko.observable('');
	auth.signUpMode = ko.observable(false);
	auth.isAdmin = ko.observable(false);

	var currentUser = Parse.User.current();
	if (currentUser) {
		auth.currentUser(currentUser);
	}

	auth.init = function() {
		Parse.Cloud.run('checkAdminStatus', {}, {
			success: function(isAdmin) {
				auth.isAdmin(isAdmin);
			}, error: function(error) {
				console.log(error);
			}
		});
	}

	auth.resetError = function() {
		auth.errorMessage('');
	}

	auth.signInUp = function(formElement) {
		// ko.postbox.publish('isLoading', true);
		auth.resetError();

		var username = $(formElement).find('input[name=auth_username]').val();
		var password = $(formElement).find('input[name=auth_password]').val();

		if (auth.signUpMode()) {
			var email = $(formElement).find('input[name=auth_email]').val().toLowerCase();
			var displayName = $(formElement).find('input[name=auth_displayName]').val();
			var passwordConfirm = $(formElement).find('input[name=auth_confirmPassword]').val();

			// validation
			if (email.length < 1) {
				auth.errorMessage('Please enter your email address.');
				return false;
			}

			if (displayName.length < 1) {
				auth.errorMessage('Please enter your first and last name.');
				return false;
			}

			if (username.length < 1) {
				auth.errorMessage('Please enter a username.');
				return false;
			}

			if (password.length < 1 || passwordConfirm < 1 || password != passwordConfirm) {
				auth.errorMessage('Please enter and confirm a password.');
				return false;
			}

			var user = new Parse.User();
			var scrubbedUsername = username.replace(/\s+/g,""); //remove white space
			scrubbedUsername = scrubbedUsername.toLowerCase();

			user.set('username', scrubbedUsername);
			user.set('password', password);
			user.set('email', email);
			user.set('displayName', displayName);

			// other fields can be set just like with Parse.Object
			// user.set("phone", "415-392-0202");

			user.signUp(null, {
				success: function(user) {
					auth.currentUser(user);
				},
				error: function(user, error) {
					auth.errorMessage(auth.sanitizeErrors(error));
					console.log(error);
				}
			});

		} else {
			Parse.User.logIn(username, password, {
				success: function(user) {
					auth.currentUser(user);
					app.myViewModel.selectProject.init();
					if (user.attributes.isAdmin) {
						auth.isAdmin(true);
					}
				},
				error: function(user, error) {
					// The login failed. Check error to see why.
					auth.errorMessage(auth.sanitizeErrors(error));
					console.log(error);
				}
			});
		}
	}

	auth.logout = function() {
		Parse.User.logOut();
		auth.currentUser(null);
	}

	auth.showSignUp = function() {
		auth.errorMessage('');
		if (auth.signUpMode()) {
			auth.signUpMode(false);
		} else {
			auth.signUpMode(true);
		}
	}

	auth.sanitizeErrors = function(error) {
		switch(error.code)
		{
			case 101:
				return 'Please enter a valid username and password.';
			case 124:
				return 'Oops! We messed up. Please try again.';
			default:
				return error.message.charAt(0).toUpperCase() + error.message.slice(1) + '.';
		}
	}

	auth.init();

	return self;
}

module.exports = Auth;
},{}],3:[function(require,module,exports){
/**
 * scripts/main.js
 *
 * This is the starting point for your application.
 * Take a look at http://browserify.org/ for more info
 */

'use strict';

var App = require('./app.js');
var Auth = require('./auth.js');
var Steps = require('./steps.js');
var SelectProject = require('./select-project.js');
var Header = require('./header.js');
// var RateProject = require('./rate-project.js');
var RateWeek = require('./rate-week.js');
var Notes = require('./notes.js');
var People = require('./people.js');

// initialize parse
Parse.initialize("JkYNfPBw2aPgcc7PeTGHMAU2XKvjzeqVIkyClVuo", "45OMU3ZS3o5c168lQxa0ilxQu4FdMVHT1NVTkORl");

// initialize typekit
try{Typekit.load();}catch(e){}

var app = new App();
var auth = new Auth(app);
var steps = new Steps(app);
var selectProject = new SelectProject(app);
var header = new Header(app);
// var rateProject = new RateProject(app);
var rateWeek = new RateWeek(app);
var notes = new Notes(app);
var people = new People(app);


// Custom knockout extneders

// Here's a custom Knockout binding that makes elements shown/hidden via jQuery's fadeIn()/fadeOut() methods
// Could be stored in a separate utility library
ko.bindingHandlers.fadeVisible = {
    init: function(element, valueAccessor) {
        // Initially set the element to be instantly visible/hidden depending on the value
        var value = valueAccessor();
        $(element).toggle(ko.unwrap(value)); // Use "unwrapObservable" so we can handle values that may or may not be observable
    },
    update: function(element, valueAccessor) {
        // Whenever the value subsequently changes, slowly fade the element in or out
        var value = valueAccessor();
        ko.unwrap(value) ? $(element).fadeIn() : $(element).fadeOut();
    }
}

app.initialize();
},{"./app.js":1,"./auth.js":2,"./header.js":4,"./notes.js":5,"./people.js":6,"./rate-week.js":7,"./select-project.js":8,"./steps.js":9}],4:[function(require,module,exports){
/**
 * scripts/header.js
 *
 * This is a sample CommonJS module.
 * Take a look at http://browserify.org/ for more info
 */

'use strict';

function Header(app) {
	var self = this;

	var header = app.myViewModel.header = {};

	header.activePage = ko.observable(0);
	header.isModal = ko.observable(false);
	header.pages = ko.observableArray([
		{
			display: 'My Time',
			link: 'mytime'
		},
		{
			display: 'People',
			link: 'people'
		}
	]);

	header.goToPage = function(index) {
		header.activePage(index);
		$('#header .navbar-collapse').removeClass('in');
		app.myViewModel.steps.currentStep(0);
		if (index != 1) {
			app.myViewModel.people.showDetails(false);
		}
	}

	header.logout = function() {
		app.myViewModel.auth.logout();
	}

	return self;
}

module.exports = Header;
},{}],5:[function(require,module,exports){
/**
 * scripts/notes.js
 *
 * This is a sample CommonJS module.
 * Take a look at http://browserify.org/ for more info
 */

'use strict';

function Notes(app) {
	var self = this;

	var notes = app.myViewModel.notes = {};


	return self;
}


module.exports = Notes;
},{}],6:[function(require,module,exports){
/**
 * scripts/people.js
 *
 * This is a sample CommonJS module.
 * Take a look at http://browserify.org/ for more info
 */

'use strict';

function People(app) {
	var self = this;

	var people = app.myViewModel.people = {};

	people.registerMouseX = ko.observable();
	people.registerStartPercentage = ko.observable(0);
	people.today = moment(new Date()).startOf('isoweek');
	people.registerRatio = ko.observable($(document).width() - 20);
	people.activeWeek = ko.observable(0);
	people.activePerson = ko.observable();
	people.viewType = ko.observable('hours');
	people.showDetails = ko.observable(false);

	people.all = ko.observableArray([
		{
			name: 'Aaron Martlage',
			id: '1293482934',
			percentages: ko.observableArray([
				32, 42, 2, 12
			])
		},
		{
			name: 'John Doe',
			id: '1293482934',
			percentages: ko.observableArray([
				32, 42, 2, 12
			])
		},
	]);

	people.weeks = ko.observableArray([
		{
			date: ko.observable(moment(people.today).format('MMM D')),
			total: ko.computed(function() {
				var sum = _.reduce(app.myViewModel.selectProject.allProjects(), function(memo, project) {
					var colValue = 0;
					if (project.attributes.active()) {
						colValue = project.attributes.percentage()[0].value();
					}
					return memo + colValue; 
				}, 0);
				return sum;
			})
		},
		{
			date: ko.observable(moment(people.today).add('days', 7).format('MMM D')),
			total: ko.computed(function() {
				var sum = _.reduce(app.myViewModel.selectProject.allProjects(), function(memo, project) {
					var colValue = 0;
					if (project.attributes.active()) {
						colValue = project.attributes.percentage()[1].value();
					}
					return memo + colValue; 
				}, 0);
				return sum;
			})
		},
		{  
			date: ko.observable(moment(people.today).add('days', 14).format('MMM D')),
			total: ko.computed(function() {
				var sum = _.reduce(app.myViewModel.selectProject.allProjects(), function(memo, project) {
					var colValue = 0;
					if (project.attributes.active()) {
						colValue = project.attributes.percentage()[2].value();
					}
					return memo + colValue; 
				}, 0);
				return sum;
			})
		}
	]);

	people.selectWeek = function(index) {
		people.activeWeek(index);
		// go get the data for this week
	}

	people.toggleView = function() {
		if (people.viewType() == 'hours') {
			people.viewType('percent');
		} else {
			people.viewType('hours');
		}
	}

	people.goToPerson = function(item) {
		people.activePerson(item);
		people.showDetails(true);
	}

	return self;
}

module.exports = People;
},{}],7:[function(require,module,exports){
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
	rateWeek.today = moment(new Date()).startOf('isoweek');
	rateWeek.registerRatio = ko.observable($(document).width() - 20);
	rateWeek.activeWeek = ko.observable(0);
	rateWeek.viewType = ko.observable('hours');

	rateWeek.weeks = ko.observableArray([
		{
			date: ko.observable(moment(rateWeek.today).format('MMM D')),
			total: ko.computed(function() {
				var sum = _.reduce(app.myViewModel.selectProject.allProjects(), function(memo, project) {
					var colValue = 0;
					if (project.attributes.active()) {
						colValue = project.attributes.percentage()[0].value();
					}
					return memo + colValue; 
				}, 0);
				return sum;
			})
		},
		{
			date: ko.observable(moment(rateWeek.today).add('days', 7).format('MMM D')),
			total: ko.computed(function() {
				var sum = _.reduce(app.myViewModel.selectProject.allProjects(), function(memo, project) {
					var colValue = 0;
					if (project.attributes.active()) {
						colValue = project.attributes.percentage()[1].value();
					}
					return memo + colValue; 
				}, 0);
				return sum;
			})
		},
		{  
			date: ko.observable(moment(rateWeek.today).add('days', 14).format('MMM D')),
			total: ko.computed(function() {
				var sum = _.reduce(app.myViewModel.selectProject.allProjects(), function(memo, project) {
					var colValue = 0;
					if (project.attributes.active()) {
						colValue = project.attributes.percentage()[2].value();
					}
					return memo + colValue; 
				}, 0);
				return sum;
			})
		}
	]);

	rateWeek.drag = function(item, event) {
		var startX = event.gesture.startEvent.center.pageX;
		if (rateWeek.registerMouseX() != startX) {
			rateWeek.registerMouseX(startX);
			rateWeek.registerStartPercentage(item.attributes.percentage()[rateWeek.activeWeek()].value());
		}
		var diff = (event.gesture.deltaX / rateWeek.registerRatio()) * 100;
		var newPercentage = Math.floor((diff + rateWeek.registerStartPercentage()) / 5) * 5;

		if (newPercentage > 0 && newPercentage <= 100) {
			item.attributes.percentage()[rateWeek.activeWeek()].value(newPercentage);
		} else if (newPercentage > 100) {
			item.attributes.percentage()[rateWeek.activeWeek()].value(100);
		} else {
			item.attributes.percentage()[rateWeek.activeWeek()].value(0);
		}

	}

	rateWeek.selectWeek = function(index) {
		rateWeek.activeWeek(index);
	}

	rateWeek.toggleView = function() {
		if (rateWeek.viewType() == 'hours') {
			rateWeek.viewType('percent');
		} else {
			rateWeek.viewType('hours');
		}
	}

	rateWeek.goBack = function() {
		console.log('go back')
		app.myViewModel.people.showDetails(false);
		app.myViewModel.header.goToPage(1);
	}

	return self;
}

module.exports = RateWeek;
},{}],8:[function(require,module,exports){
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

	selectProject.getProjects = function() {
		Parse.Cloud.run('getProjects', {}, {
			success: function(projects) {
				selectProject.allProjects([]);
				for (var i = 0; i < projects.length; i++) {
					projects[i].attributes.active = ko.observable(false);
					projects[i].attributes.percentage = ko.observableArray([{ value: ko.observable(0) }, { value: ko.observable(0) }, { value: ko.observable(0) }]);
					selectProject.allProjects.push(projects[i]);
				}
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

	selectProject.init = function() {
		selectProject.getProjects();
	}

	selectProject.toggleProject = function(item, event) {
		if (item.attributes.active()) {
			item.attributes.active(false);
		} else {
			item.attributes.active(true);
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

	selectProject.init();

	return self;
}

module.exports = SelectProject;
},{}],9:[function(require,module,exports){
/**
 * scripts/steps.js
 *
 * This is a sample CommonJS module.
 * Take a look at http://browserify.org/ for more info
 */

'use strict';

function Steps(app) {
	var self = this;

	var steps = app.myViewModel.steps = {};

	steps.currentStep = ko.observable(0);
	steps.steps = ko.observableArray([
		{
			stepNumber: 0,
			stepName: 'selectProject'
		},
		{
			stepNumber: 1,
			stepName: 'selectProject'
		}
		// {
		// 	stepNumber: 2,
		// 	stepName: 'selectProject'
		// },
		// {
		// 	stepNumber: 3,
		// 	stepName: 'selectProject'
		// }
	]);

	// $(document).on('swipe', function() {
	// 	alert('swipe')
	// });

	steps.changeStep = function(item) {
		steps.currentStep(item.stepNumber);
		// app.myViewModel.rateProject.initProject();
	}

	steps.nextStep = function(direction) {
		steps.currentStep(steps.currentStep() + direction);
		// app.myViewModel.rateProject.initProject();
	}

	return self;
}

module.exports = Steps;
},{}]},{},[3])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvYW1hcnRsYWdlL2FsbG9jYXRlL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvYW1hcnRsYWdlL2FsbG9jYXRlL2FwcC9zY3JpcHRzL2FwcC5qcyIsIi9Vc2Vycy9hbWFydGxhZ2UvYWxsb2NhdGUvYXBwL3NjcmlwdHMvYXV0aC5qcyIsIi9Vc2Vycy9hbWFydGxhZ2UvYWxsb2NhdGUvYXBwL3NjcmlwdHMvZmFrZV9hYWQ2Yzk0Ni5qcyIsIi9Vc2Vycy9hbWFydGxhZ2UvYWxsb2NhdGUvYXBwL3NjcmlwdHMvaGVhZGVyLmpzIiwiL1VzZXJzL2FtYXJ0bGFnZS9hbGxvY2F0ZS9hcHAvc2NyaXB0cy9ub3Rlcy5qcyIsIi9Vc2Vycy9hbWFydGxhZ2UvYWxsb2NhdGUvYXBwL3NjcmlwdHMvcGVvcGxlLmpzIiwiL1VzZXJzL2FtYXJ0bGFnZS9hbGxvY2F0ZS9hcHAvc2NyaXB0cy9yYXRlLXdlZWsuanMiLCIvVXNlcnMvYW1hcnRsYWdlL2FsbG9jYXRlL2FwcC9zY3JpcHRzL3NlbGVjdC1wcm9qZWN0LmpzIiwiL1VzZXJzL2FtYXJ0bGFnZS9hbGxvY2F0ZS9hcHAvc2NyaXB0cy9zdGVwcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogc2NyaXB0cy9hcHAuanNcbiAqXG4gKiBUaGlzIGlzIGEgc2FtcGxlIENvbW1vbkpTIG1vZHVsZS5cbiAqIFRha2UgYSBsb29rIGF0IGh0dHA6Ly9icm93c2VyaWZ5Lm9yZy8gZm9yIG1vcmUgaW5mb1xuICovXG5cbid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gQXBwKCkge1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0Ly8gaW5pdGlhbGl6ZSBrbm9ja291dFxuXHRzZWxmLm15Vmlld01vZGVsID0ge307XG5cblx0c2VsZi5teVZpZXdNb2RlbC5jdXJyZW50VXNlciA9IGtvLm9ic2VydmFibGUobnVsbCk7XG5cblx0c2VsZi5pbml0aWFsaXplID0gZnVuY3Rpb24oKSB7XG5cdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignZGV2aWNlcmVhZHknLCBzZWxmLm9uRGV2aWNlUmVhZHksIGZhbHNlKTtcblx0fVxuXG5cdHNlbGYub25EZXZpY2VSZWFkeSA9IGZ1bmN0aW9uKCkge1xuXHRcdGtvLmFwcGx5QmluZGluZ3Moc2VsZi5teVZpZXdNb2RlbCk7XG5cdFx0c2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdG5hdmlnYXRvci5zcGxhc2hzY3JlZW4uaGlkZSgpO1xuXHRcdH0sIDIwMDApO1xuXHRcdFxuXHR9XG5cblx0cmV0dXJuIHNlbGY7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQXBwOyIsIi8qKlxuICogc2NyaXB0cy9hdXRoLmpzXG4gKlxuICogVGhpcyBpcyBhIHNhbXBsZSBDb21tb25KUyBtb2R1bGUuXG4gKiBUYWtlIGEgbG9vayBhdCBodHRwOi8vYnJvd3NlcmlmeS5vcmcvIGZvciBtb3JlIGluZm9cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIEF1dGgoYXBwKSB7XG5cdHZhciBzZWxmID0gdGhpcztcblxuXHR2YXIgYXV0aCA9IGFwcC5teVZpZXdNb2RlbC5hdXRoID0ge307XG5cblx0YXV0aC5jdXJyZW50VXNlciA9IGtvLm9ic2VydmFibGUoKTtcblx0YXV0aC5lcnJvck1lc3NhZ2UgPSBrby5vYnNlcnZhYmxlKCcnKTtcblx0YXV0aC5zaWduVXBNb2RlID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XG5cdGF1dGguaXNBZG1pbiA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xuXG5cdHZhciBjdXJyZW50VXNlciA9IFBhcnNlLlVzZXIuY3VycmVudCgpO1xuXHRpZiAoY3VycmVudFVzZXIpIHtcblx0XHRhdXRoLmN1cnJlbnRVc2VyKGN1cnJlbnRVc2VyKTtcblx0fVxuXG5cdGF1dGguaW5pdCA9IGZ1bmN0aW9uKCkge1xuXHRcdFBhcnNlLkNsb3VkLnJ1bignY2hlY2tBZG1pblN0YXR1cycsIHt9LCB7XG5cdFx0XHRzdWNjZXNzOiBmdW5jdGlvbihpc0FkbWluKSB7XG5cdFx0XHRcdGF1dGguaXNBZG1pbihpc0FkbWluKTtcblx0XHRcdH0sIGVycm9yOiBmdW5jdGlvbihlcnJvcikge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhlcnJvcik7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHRhdXRoLnJlc2V0RXJyb3IgPSBmdW5jdGlvbigpIHtcblx0XHRhdXRoLmVycm9yTWVzc2FnZSgnJyk7XG5cdH1cblxuXHRhdXRoLnNpZ25JblVwID0gZnVuY3Rpb24oZm9ybUVsZW1lbnQpIHtcblx0XHQvLyBrby5wb3N0Ym94LnB1Ymxpc2goJ2lzTG9hZGluZycsIHRydWUpO1xuXHRcdGF1dGgucmVzZXRFcnJvcigpO1xuXG5cdFx0dmFyIHVzZXJuYW1lID0gJChmb3JtRWxlbWVudCkuZmluZCgnaW5wdXRbbmFtZT1hdXRoX3VzZXJuYW1lXScpLnZhbCgpO1xuXHRcdHZhciBwYXNzd29yZCA9ICQoZm9ybUVsZW1lbnQpLmZpbmQoJ2lucHV0W25hbWU9YXV0aF9wYXNzd29yZF0nKS52YWwoKTtcblxuXHRcdGlmIChhdXRoLnNpZ25VcE1vZGUoKSkge1xuXHRcdFx0dmFyIGVtYWlsID0gJChmb3JtRWxlbWVudCkuZmluZCgnaW5wdXRbbmFtZT1hdXRoX2VtYWlsXScpLnZhbCgpLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHR2YXIgZGlzcGxheU5hbWUgPSAkKGZvcm1FbGVtZW50KS5maW5kKCdpbnB1dFtuYW1lPWF1dGhfZGlzcGxheU5hbWVdJykudmFsKCk7XG5cdFx0XHR2YXIgcGFzc3dvcmRDb25maXJtID0gJChmb3JtRWxlbWVudCkuZmluZCgnaW5wdXRbbmFtZT1hdXRoX2NvbmZpcm1QYXNzd29yZF0nKS52YWwoKTtcblxuXHRcdFx0Ly8gdmFsaWRhdGlvblxuXHRcdFx0aWYgKGVtYWlsLmxlbmd0aCA8IDEpIHtcblx0XHRcdFx0YXV0aC5lcnJvck1lc3NhZ2UoJ1BsZWFzZSBlbnRlciB5b3VyIGVtYWlsIGFkZHJlc3MuJyk7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRpc3BsYXlOYW1lLmxlbmd0aCA8IDEpIHtcblx0XHRcdFx0YXV0aC5lcnJvck1lc3NhZ2UoJ1BsZWFzZSBlbnRlciB5b3VyIGZpcnN0IGFuZCBsYXN0IG5hbWUuJyk7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHVzZXJuYW1lLmxlbmd0aCA8IDEpIHtcblx0XHRcdFx0YXV0aC5lcnJvck1lc3NhZ2UoJ1BsZWFzZSBlbnRlciBhIHVzZXJuYW1lLicpO1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChwYXNzd29yZC5sZW5ndGggPCAxIHx8IHBhc3N3b3JkQ29uZmlybSA8IDEgfHwgcGFzc3dvcmQgIT0gcGFzc3dvcmRDb25maXJtKSB7XG5cdFx0XHRcdGF1dGguZXJyb3JNZXNzYWdlKCdQbGVhc2UgZW50ZXIgYW5kIGNvbmZpcm0gYSBwYXNzd29yZC4nKTtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgdXNlciA9IG5ldyBQYXJzZS5Vc2VyKCk7XG5cdFx0XHR2YXIgc2NydWJiZWRVc2VybmFtZSA9IHVzZXJuYW1lLnJlcGxhY2UoL1xccysvZyxcIlwiKTsgLy9yZW1vdmUgd2hpdGUgc3BhY2Vcblx0XHRcdHNjcnViYmVkVXNlcm5hbWUgPSBzY3J1YmJlZFVzZXJuYW1lLnRvTG93ZXJDYXNlKCk7XG5cblx0XHRcdHVzZXIuc2V0KCd1c2VybmFtZScsIHNjcnViYmVkVXNlcm5hbWUpO1xuXHRcdFx0dXNlci5zZXQoJ3Bhc3N3b3JkJywgcGFzc3dvcmQpO1xuXHRcdFx0dXNlci5zZXQoJ2VtYWlsJywgZW1haWwpO1xuXHRcdFx0dXNlci5zZXQoJ2Rpc3BsYXlOYW1lJywgZGlzcGxheU5hbWUpO1xuXG5cdFx0XHQvLyBvdGhlciBmaWVsZHMgY2FuIGJlIHNldCBqdXN0IGxpa2Ugd2l0aCBQYXJzZS5PYmplY3Rcblx0XHRcdC8vIHVzZXIuc2V0KFwicGhvbmVcIiwgXCI0MTUtMzkyLTAyMDJcIik7XG5cblx0XHRcdHVzZXIuc2lnblVwKG51bGwsIHtcblx0XHRcdFx0c3VjY2VzczogZnVuY3Rpb24odXNlcikge1xuXHRcdFx0XHRcdGF1dGguY3VycmVudFVzZXIodXNlcik7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdGVycm9yOiBmdW5jdGlvbih1c2VyLCBlcnJvcikge1xuXHRcdFx0XHRcdGF1dGguZXJyb3JNZXNzYWdlKGF1dGguc2FuaXRpemVFcnJvcnMoZXJyb3IpKTtcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhlcnJvcik7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0fSBlbHNlIHtcblx0XHRcdFBhcnNlLlVzZXIubG9nSW4odXNlcm5hbWUsIHBhc3N3b3JkLCB7XG5cdFx0XHRcdHN1Y2Nlc3M6IGZ1bmN0aW9uKHVzZXIpIHtcblx0XHRcdFx0XHRhdXRoLmN1cnJlbnRVc2VyKHVzZXIpO1xuXHRcdFx0XHRcdGFwcC5teVZpZXdNb2RlbC5zZWxlY3RQcm9qZWN0LmluaXQoKTtcblx0XHRcdFx0XHRpZiAodXNlci5hdHRyaWJ1dGVzLmlzQWRtaW4pIHtcblx0XHRcdFx0XHRcdGF1dGguaXNBZG1pbih0cnVlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sXG5cdFx0XHRcdGVycm9yOiBmdW5jdGlvbih1c2VyLCBlcnJvcikge1xuXHRcdFx0XHRcdC8vIFRoZSBsb2dpbiBmYWlsZWQuIENoZWNrIGVycm9yIHRvIHNlZSB3aHkuXG5cdFx0XHRcdFx0YXV0aC5lcnJvck1lc3NhZ2UoYXV0aC5zYW5pdGl6ZUVycm9ycyhlcnJvcikpO1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKGVycm9yKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XG5cblx0YXV0aC5sb2dvdXQgPSBmdW5jdGlvbigpIHtcblx0XHRQYXJzZS5Vc2VyLmxvZ091dCgpO1xuXHRcdGF1dGguY3VycmVudFVzZXIobnVsbCk7XG5cdH1cblxuXHRhdXRoLnNob3dTaWduVXAgPSBmdW5jdGlvbigpIHtcblx0XHRhdXRoLmVycm9yTWVzc2FnZSgnJyk7XG5cdFx0aWYgKGF1dGguc2lnblVwTW9kZSgpKSB7XG5cdFx0XHRhdXRoLnNpZ25VcE1vZGUoZmFsc2UpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRhdXRoLnNpZ25VcE1vZGUodHJ1ZSk7XG5cdFx0fVxuXHR9XG5cblx0YXV0aC5zYW5pdGl6ZUVycm9ycyA9IGZ1bmN0aW9uKGVycm9yKSB7XG5cdFx0c3dpdGNoKGVycm9yLmNvZGUpXG5cdFx0e1xuXHRcdFx0Y2FzZSAxMDE6XG5cdFx0XHRcdHJldHVybiAnUGxlYXNlIGVudGVyIGEgdmFsaWQgdXNlcm5hbWUgYW5kIHBhc3N3b3JkLic7XG5cdFx0XHRjYXNlIDEyNDpcblx0XHRcdFx0cmV0dXJuICdPb3BzISBXZSBtZXNzZWQgdXAuIFBsZWFzZSB0cnkgYWdhaW4uJztcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHJldHVybiBlcnJvci5tZXNzYWdlLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgZXJyb3IubWVzc2FnZS5zbGljZSgxKSArICcuJztcblx0XHR9XG5cdH1cblxuXHRhdXRoLmluaXQoKTtcblxuXHRyZXR1cm4gc2VsZjtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBBdXRoOyIsIi8qKlxuICogc2NyaXB0cy9tYWluLmpzXG4gKlxuICogVGhpcyBpcyB0aGUgc3RhcnRpbmcgcG9pbnQgZm9yIHlvdXIgYXBwbGljYXRpb24uXG4gKiBUYWtlIGEgbG9vayBhdCBodHRwOi8vYnJvd3NlcmlmeS5vcmcvIGZvciBtb3JlIGluZm9cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBBcHAgPSByZXF1aXJlKCcuL2FwcC5qcycpO1xudmFyIEF1dGggPSByZXF1aXJlKCcuL2F1dGguanMnKTtcbnZhciBTdGVwcyA9IHJlcXVpcmUoJy4vc3RlcHMuanMnKTtcbnZhciBTZWxlY3RQcm9qZWN0ID0gcmVxdWlyZSgnLi9zZWxlY3QtcHJvamVjdC5qcycpO1xudmFyIEhlYWRlciA9IHJlcXVpcmUoJy4vaGVhZGVyLmpzJyk7XG4vLyB2YXIgUmF0ZVByb2plY3QgPSByZXF1aXJlKCcuL3JhdGUtcHJvamVjdC5qcycpO1xudmFyIFJhdGVXZWVrID0gcmVxdWlyZSgnLi9yYXRlLXdlZWsuanMnKTtcbnZhciBOb3RlcyA9IHJlcXVpcmUoJy4vbm90ZXMuanMnKTtcbnZhciBQZW9wbGUgPSByZXF1aXJlKCcuL3Blb3BsZS5qcycpO1xuXG4vLyBpbml0aWFsaXplIHBhcnNlXG5QYXJzZS5pbml0aWFsaXplKFwiSmtZTmZQQncyYVBnY2M3UGVUR0hNQVUyWEt2anplcVZJa3lDbFZ1b1wiLCBcIjQ1T01VM1pTM281YzE2OGxReGEwaWx4UXU0RmRNVkhUMU5WVGtPUmxcIik7XG5cbi8vIGluaXRpYWxpemUgdHlwZWtpdFxudHJ5e1R5cGVraXQubG9hZCgpO31jYXRjaChlKXt9XG5cbnZhciBhcHAgPSBuZXcgQXBwKCk7XG52YXIgYXV0aCA9IG5ldyBBdXRoKGFwcCk7XG52YXIgc3RlcHMgPSBuZXcgU3RlcHMoYXBwKTtcbnZhciBzZWxlY3RQcm9qZWN0ID0gbmV3IFNlbGVjdFByb2plY3QoYXBwKTtcbnZhciBoZWFkZXIgPSBuZXcgSGVhZGVyKGFwcCk7XG4vLyB2YXIgcmF0ZVByb2plY3QgPSBuZXcgUmF0ZVByb2plY3QoYXBwKTtcbnZhciByYXRlV2VlayA9IG5ldyBSYXRlV2VlayhhcHApO1xudmFyIG5vdGVzID0gbmV3IE5vdGVzKGFwcCk7XG52YXIgcGVvcGxlID0gbmV3IFBlb3BsZShhcHApO1xuXG5cbi8vIEN1c3RvbSBrbm9ja291dCBleHRuZWRlcnNcblxuLy8gSGVyZSdzIGEgY3VzdG9tIEtub2Nrb3V0IGJpbmRpbmcgdGhhdCBtYWtlcyBlbGVtZW50cyBzaG93bi9oaWRkZW4gdmlhIGpRdWVyeSdzIGZhZGVJbigpL2ZhZGVPdXQoKSBtZXRob2RzXG4vLyBDb3VsZCBiZSBzdG9yZWQgaW4gYSBzZXBhcmF0ZSB1dGlsaXR5IGxpYnJhcnlcbmtvLmJpbmRpbmdIYW5kbGVycy5mYWRlVmlzaWJsZSA9IHtcbiAgICBpbml0OiBmdW5jdGlvbihlbGVtZW50LCB2YWx1ZUFjY2Vzc29yKSB7XG4gICAgICAgIC8vIEluaXRpYWxseSBzZXQgdGhlIGVsZW1lbnQgdG8gYmUgaW5zdGFudGx5IHZpc2libGUvaGlkZGVuIGRlcGVuZGluZyBvbiB0aGUgdmFsdWVcbiAgICAgICAgdmFyIHZhbHVlID0gdmFsdWVBY2Nlc3NvcigpO1xuICAgICAgICAkKGVsZW1lbnQpLnRvZ2dsZShrby51bndyYXAodmFsdWUpKTsgLy8gVXNlIFwidW53cmFwT2JzZXJ2YWJsZVwiIHNvIHdlIGNhbiBoYW5kbGUgdmFsdWVzIHRoYXQgbWF5IG9yIG1heSBub3QgYmUgb2JzZXJ2YWJsZVxuICAgIH0sXG4gICAgdXBkYXRlOiBmdW5jdGlvbihlbGVtZW50LCB2YWx1ZUFjY2Vzc29yKSB7XG4gICAgICAgIC8vIFdoZW5ldmVyIHRoZSB2YWx1ZSBzdWJzZXF1ZW50bHkgY2hhbmdlcywgc2xvd2x5IGZhZGUgdGhlIGVsZW1lbnQgaW4gb3Igb3V0XG4gICAgICAgIHZhciB2YWx1ZSA9IHZhbHVlQWNjZXNzb3IoKTtcbiAgICAgICAga28udW53cmFwKHZhbHVlKSA/ICQoZWxlbWVudCkuZmFkZUluKCkgOiAkKGVsZW1lbnQpLmZhZGVPdXQoKTtcbiAgICB9XG59XG5cbmFwcC5pbml0aWFsaXplKCk7IiwiLyoqXG4gKiBzY3JpcHRzL2hlYWRlci5qc1xuICpcbiAqIFRoaXMgaXMgYSBzYW1wbGUgQ29tbW9uSlMgbW9kdWxlLlxuICogVGFrZSBhIGxvb2sgYXQgaHR0cDovL2Jyb3dzZXJpZnkub3JnLyBmb3IgbW9yZSBpbmZvXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBIZWFkZXIoYXBwKSB7XG5cdHZhciBzZWxmID0gdGhpcztcblxuXHR2YXIgaGVhZGVyID0gYXBwLm15Vmlld01vZGVsLmhlYWRlciA9IHt9O1xuXG5cdGhlYWRlci5hY3RpdmVQYWdlID0ga28ub2JzZXJ2YWJsZSgwKTtcblx0aGVhZGVyLmlzTW9kYWwgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcblx0aGVhZGVyLnBhZ2VzID0ga28ub2JzZXJ2YWJsZUFycmF5KFtcblx0XHR7XG5cdFx0XHRkaXNwbGF5OiAnTXkgVGltZScsXG5cdFx0XHRsaW5rOiAnbXl0aW1lJ1xuXHRcdH0sXG5cdFx0e1xuXHRcdFx0ZGlzcGxheTogJ1Blb3BsZScsXG5cdFx0XHRsaW5rOiAncGVvcGxlJ1xuXHRcdH1cblx0XSk7XG5cblx0aGVhZGVyLmdvVG9QYWdlID0gZnVuY3Rpb24oaW5kZXgpIHtcblx0XHRoZWFkZXIuYWN0aXZlUGFnZShpbmRleCk7XG5cdFx0JCgnI2hlYWRlciAubmF2YmFyLWNvbGxhcHNlJykucmVtb3ZlQ2xhc3MoJ2luJyk7XG5cdFx0YXBwLm15Vmlld01vZGVsLnN0ZXBzLmN1cnJlbnRTdGVwKDApO1xuXHRcdGlmIChpbmRleCAhPSAxKSB7XG5cdFx0XHRhcHAubXlWaWV3TW9kZWwucGVvcGxlLnNob3dEZXRhaWxzKGZhbHNlKTtcblx0XHR9XG5cdH1cblxuXHRoZWFkZXIubG9nb3V0ID0gZnVuY3Rpb24oKSB7XG5cdFx0YXBwLm15Vmlld01vZGVsLmF1dGgubG9nb3V0KCk7XG5cdH1cblxuXHRyZXR1cm4gc2VsZjtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBIZWFkZXI7IiwiLyoqXG4gKiBzY3JpcHRzL25vdGVzLmpzXG4gKlxuICogVGhpcyBpcyBhIHNhbXBsZSBDb21tb25KUyBtb2R1bGUuXG4gKiBUYWtlIGEgbG9vayBhdCBodHRwOi8vYnJvd3NlcmlmeS5vcmcvIGZvciBtb3JlIGluZm9cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIE5vdGVzKGFwcCkge1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0dmFyIG5vdGVzID0gYXBwLm15Vmlld01vZGVsLm5vdGVzID0ge307XG5cblxuXHRyZXR1cm4gc2VsZjtcbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IE5vdGVzOyIsIi8qKlxuICogc2NyaXB0cy9wZW9wbGUuanNcbiAqXG4gKiBUaGlzIGlzIGEgc2FtcGxlIENvbW1vbkpTIG1vZHVsZS5cbiAqIFRha2UgYSBsb29rIGF0IGh0dHA6Ly9icm93c2VyaWZ5Lm9yZy8gZm9yIG1vcmUgaW5mb1xuICovXG5cbid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gUGVvcGxlKGFwcCkge1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0dmFyIHBlb3BsZSA9IGFwcC5teVZpZXdNb2RlbC5wZW9wbGUgPSB7fTtcblxuXHRwZW9wbGUucmVnaXN0ZXJNb3VzZVggPSBrby5vYnNlcnZhYmxlKCk7XG5cdHBlb3BsZS5yZWdpc3RlclN0YXJ0UGVyY2VudGFnZSA9IGtvLm9ic2VydmFibGUoMCk7XG5cdHBlb3BsZS50b2RheSA9IG1vbWVudChuZXcgRGF0ZSgpKS5zdGFydE9mKCdpc293ZWVrJyk7XG5cdHBlb3BsZS5yZWdpc3RlclJhdGlvID0ga28ub2JzZXJ2YWJsZSgkKGRvY3VtZW50KS53aWR0aCgpIC0gMjApO1xuXHRwZW9wbGUuYWN0aXZlV2VlayA9IGtvLm9ic2VydmFibGUoMCk7XG5cdHBlb3BsZS5hY3RpdmVQZXJzb24gPSBrby5vYnNlcnZhYmxlKCk7XG5cdHBlb3BsZS52aWV3VHlwZSA9IGtvLm9ic2VydmFibGUoJ2hvdXJzJyk7XG5cdHBlb3BsZS5zaG93RGV0YWlscyA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xuXG5cdHBlb3BsZS5hbGwgPSBrby5vYnNlcnZhYmxlQXJyYXkoW1xuXHRcdHtcblx0XHRcdG5hbWU6ICdBYXJvbiBNYXJ0bGFnZScsXG5cdFx0XHRpZDogJzEyOTM0ODI5MzQnLFxuXHRcdFx0cGVyY2VudGFnZXM6IGtvLm9ic2VydmFibGVBcnJheShbXG5cdFx0XHRcdDMyLCA0MiwgMiwgMTJcblx0XHRcdF0pXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRuYW1lOiAnSm9obiBEb2UnLFxuXHRcdFx0aWQ6ICcxMjkzNDgyOTM0Jyxcblx0XHRcdHBlcmNlbnRhZ2VzOiBrby5vYnNlcnZhYmxlQXJyYXkoW1xuXHRcdFx0XHQzMiwgNDIsIDIsIDEyXG5cdFx0XHRdKVxuXHRcdH0sXG5cdF0pO1xuXG5cdHBlb3BsZS53ZWVrcyA9IGtvLm9ic2VydmFibGVBcnJheShbXG5cdFx0e1xuXHRcdFx0ZGF0ZToga28ub2JzZXJ2YWJsZShtb21lbnQocGVvcGxlLnRvZGF5KS5mb3JtYXQoJ01NTSBEJykpLFxuXHRcdFx0dG90YWw6IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR2YXIgc3VtID0gXy5yZWR1Y2UoYXBwLm15Vmlld01vZGVsLnNlbGVjdFByb2plY3QuYWxsUHJvamVjdHMoKSwgZnVuY3Rpb24obWVtbywgcHJvamVjdCkge1xuXHRcdFx0XHRcdHZhciBjb2xWYWx1ZSA9IDA7XG5cdFx0XHRcdFx0aWYgKHByb2plY3QuYXR0cmlidXRlcy5hY3RpdmUoKSkge1xuXHRcdFx0XHRcdFx0Y29sVmFsdWUgPSBwcm9qZWN0LmF0dHJpYnV0ZXMucGVyY2VudGFnZSgpWzBdLnZhbHVlKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHJldHVybiBtZW1vICsgY29sVmFsdWU7IFxuXHRcdFx0XHR9LCAwKTtcblx0XHRcdFx0cmV0dXJuIHN1bTtcblx0XHRcdH0pXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRkYXRlOiBrby5vYnNlcnZhYmxlKG1vbWVudChwZW9wbGUudG9kYXkpLmFkZCgnZGF5cycsIDcpLmZvcm1hdCgnTU1NIEQnKSksXG5cdFx0XHR0b3RhbDoga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciBzdW0gPSBfLnJlZHVjZShhcHAubXlWaWV3TW9kZWwuc2VsZWN0UHJvamVjdC5hbGxQcm9qZWN0cygpLCBmdW5jdGlvbihtZW1vLCBwcm9qZWN0KSB7XG5cdFx0XHRcdFx0dmFyIGNvbFZhbHVlID0gMDtcblx0XHRcdFx0XHRpZiAocHJvamVjdC5hdHRyaWJ1dGVzLmFjdGl2ZSgpKSB7XG5cdFx0XHRcdFx0XHRjb2xWYWx1ZSA9IHByb2plY3QuYXR0cmlidXRlcy5wZXJjZW50YWdlKClbMV0udmFsdWUoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cmV0dXJuIG1lbW8gKyBjb2xWYWx1ZTsgXG5cdFx0XHRcdH0sIDApO1xuXHRcdFx0XHRyZXR1cm4gc3VtO1xuXHRcdFx0fSlcblx0XHR9LFxuXHRcdHsgIFxuXHRcdFx0ZGF0ZToga28ub2JzZXJ2YWJsZShtb21lbnQocGVvcGxlLnRvZGF5KS5hZGQoJ2RheXMnLCAxNCkuZm9ybWF0KCdNTU0gRCcpKSxcblx0XHRcdHRvdGFsOiBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIHN1bSA9IF8ucmVkdWNlKGFwcC5teVZpZXdNb2RlbC5zZWxlY3RQcm9qZWN0LmFsbFByb2plY3RzKCksIGZ1bmN0aW9uKG1lbW8sIHByb2plY3QpIHtcblx0XHRcdFx0XHR2YXIgY29sVmFsdWUgPSAwO1xuXHRcdFx0XHRcdGlmIChwcm9qZWN0LmF0dHJpYnV0ZXMuYWN0aXZlKCkpIHtcblx0XHRcdFx0XHRcdGNvbFZhbHVlID0gcHJvamVjdC5hdHRyaWJ1dGVzLnBlcmNlbnRhZ2UoKVsyXS52YWx1ZSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRyZXR1cm4gbWVtbyArIGNvbFZhbHVlOyBcblx0XHRcdFx0fSwgMCk7XG5cdFx0XHRcdHJldHVybiBzdW07XG5cdFx0XHR9KVxuXHRcdH1cblx0XSk7XG5cblx0cGVvcGxlLnNlbGVjdFdlZWsgPSBmdW5jdGlvbihpbmRleCkge1xuXHRcdHBlb3BsZS5hY3RpdmVXZWVrKGluZGV4KTtcblx0XHQvLyBnbyBnZXQgdGhlIGRhdGEgZm9yIHRoaXMgd2Vla1xuXHR9XG5cblx0cGVvcGxlLnRvZ2dsZVZpZXcgPSBmdW5jdGlvbigpIHtcblx0XHRpZiAocGVvcGxlLnZpZXdUeXBlKCkgPT0gJ2hvdXJzJykge1xuXHRcdFx0cGVvcGxlLnZpZXdUeXBlKCdwZXJjZW50Jyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHBlb3BsZS52aWV3VHlwZSgnaG91cnMnKTtcblx0XHR9XG5cdH1cblxuXHRwZW9wbGUuZ29Ub1BlcnNvbiA9IGZ1bmN0aW9uKGl0ZW0pIHtcblx0XHRwZW9wbGUuYWN0aXZlUGVyc29uKGl0ZW0pO1xuXHRcdHBlb3BsZS5zaG93RGV0YWlscyh0cnVlKTtcblx0fVxuXG5cdHJldHVybiBzZWxmO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBlb3BsZTsiLCIvKipcbiAqIHNjcmlwdHMvcmF0ZS13ZWVrLmpzXG4gKlxuICogVGhpcyBpcyBhIHNhbXBsZSBDb21tb25KUyBtb2R1bGUuXG4gKiBUYWtlIGEgbG9vayBhdCBodHRwOi8vYnJvd3NlcmlmeS5vcmcvIGZvciBtb3JlIGluZm9cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIFJhdGVXZWVrKGFwcCkge1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0dmFyIHJhdGVXZWVrID0gYXBwLm15Vmlld01vZGVsLnJhdGVXZWVrID0ge307XG5cblx0cmF0ZVdlZWsucmVnaXN0ZXJNb3VzZVggPSBrby5vYnNlcnZhYmxlKCk7XG5cdHJhdGVXZWVrLnJlZ2lzdGVyU3RhcnRQZXJjZW50YWdlID0ga28ub2JzZXJ2YWJsZSgwKTtcblx0cmF0ZVdlZWsudG9kYXkgPSBtb21lbnQobmV3IERhdGUoKSkuc3RhcnRPZignaXNvd2VlaycpO1xuXHRyYXRlV2Vlay5yZWdpc3RlclJhdGlvID0ga28ub2JzZXJ2YWJsZSgkKGRvY3VtZW50KS53aWR0aCgpIC0gMjApO1xuXHRyYXRlV2Vlay5hY3RpdmVXZWVrID0ga28ub2JzZXJ2YWJsZSgwKTtcblx0cmF0ZVdlZWsudmlld1R5cGUgPSBrby5vYnNlcnZhYmxlKCdob3VycycpO1xuXG5cdHJhdGVXZWVrLndlZWtzID0ga28ub2JzZXJ2YWJsZUFycmF5KFtcblx0XHR7XG5cdFx0XHRkYXRlOiBrby5vYnNlcnZhYmxlKG1vbWVudChyYXRlV2Vlay50b2RheSkuZm9ybWF0KCdNTU0gRCcpKSxcblx0XHRcdHRvdGFsOiBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIHN1bSA9IF8ucmVkdWNlKGFwcC5teVZpZXdNb2RlbC5zZWxlY3RQcm9qZWN0LmFsbFByb2plY3RzKCksIGZ1bmN0aW9uKG1lbW8sIHByb2plY3QpIHtcblx0XHRcdFx0XHR2YXIgY29sVmFsdWUgPSAwO1xuXHRcdFx0XHRcdGlmIChwcm9qZWN0LmF0dHJpYnV0ZXMuYWN0aXZlKCkpIHtcblx0XHRcdFx0XHRcdGNvbFZhbHVlID0gcHJvamVjdC5hdHRyaWJ1dGVzLnBlcmNlbnRhZ2UoKVswXS52YWx1ZSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRyZXR1cm4gbWVtbyArIGNvbFZhbHVlOyBcblx0XHRcdFx0fSwgMCk7XG5cdFx0XHRcdHJldHVybiBzdW07XG5cdFx0XHR9KVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0ZGF0ZToga28ub2JzZXJ2YWJsZShtb21lbnQocmF0ZVdlZWsudG9kYXkpLmFkZCgnZGF5cycsIDcpLmZvcm1hdCgnTU1NIEQnKSksXG5cdFx0XHR0b3RhbDoga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciBzdW0gPSBfLnJlZHVjZShhcHAubXlWaWV3TW9kZWwuc2VsZWN0UHJvamVjdC5hbGxQcm9qZWN0cygpLCBmdW5jdGlvbihtZW1vLCBwcm9qZWN0KSB7XG5cdFx0XHRcdFx0dmFyIGNvbFZhbHVlID0gMDtcblx0XHRcdFx0XHRpZiAocHJvamVjdC5hdHRyaWJ1dGVzLmFjdGl2ZSgpKSB7XG5cdFx0XHRcdFx0XHRjb2xWYWx1ZSA9IHByb2plY3QuYXR0cmlidXRlcy5wZXJjZW50YWdlKClbMV0udmFsdWUoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cmV0dXJuIG1lbW8gKyBjb2xWYWx1ZTsgXG5cdFx0XHRcdH0sIDApO1xuXHRcdFx0XHRyZXR1cm4gc3VtO1xuXHRcdFx0fSlcblx0XHR9LFxuXHRcdHsgIFxuXHRcdFx0ZGF0ZToga28ub2JzZXJ2YWJsZShtb21lbnQocmF0ZVdlZWsudG9kYXkpLmFkZCgnZGF5cycsIDE0KS5mb3JtYXQoJ01NTSBEJykpLFxuXHRcdFx0dG90YWw6IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR2YXIgc3VtID0gXy5yZWR1Y2UoYXBwLm15Vmlld01vZGVsLnNlbGVjdFByb2plY3QuYWxsUHJvamVjdHMoKSwgZnVuY3Rpb24obWVtbywgcHJvamVjdCkge1xuXHRcdFx0XHRcdHZhciBjb2xWYWx1ZSA9IDA7XG5cdFx0XHRcdFx0aWYgKHByb2plY3QuYXR0cmlidXRlcy5hY3RpdmUoKSkge1xuXHRcdFx0XHRcdFx0Y29sVmFsdWUgPSBwcm9qZWN0LmF0dHJpYnV0ZXMucGVyY2VudGFnZSgpWzJdLnZhbHVlKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHJldHVybiBtZW1vICsgY29sVmFsdWU7IFxuXHRcdFx0XHR9LCAwKTtcblx0XHRcdFx0cmV0dXJuIHN1bTtcblx0XHRcdH0pXG5cdFx0fVxuXHRdKTtcblxuXHRyYXRlV2Vlay5kcmFnID0gZnVuY3Rpb24oaXRlbSwgZXZlbnQpIHtcblx0XHR2YXIgc3RhcnRYID0gZXZlbnQuZ2VzdHVyZS5zdGFydEV2ZW50LmNlbnRlci5wYWdlWDtcblx0XHRpZiAocmF0ZVdlZWsucmVnaXN0ZXJNb3VzZVgoKSAhPSBzdGFydFgpIHtcblx0XHRcdHJhdGVXZWVrLnJlZ2lzdGVyTW91c2VYKHN0YXJ0WCk7XG5cdFx0XHRyYXRlV2Vlay5yZWdpc3RlclN0YXJ0UGVyY2VudGFnZShpdGVtLmF0dHJpYnV0ZXMucGVyY2VudGFnZSgpW3JhdGVXZWVrLmFjdGl2ZVdlZWsoKV0udmFsdWUoKSk7XG5cdFx0fVxuXHRcdHZhciBkaWZmID0gKGV2ZW50Lmdlc3R1cmUuZGVsdGFYIC8gcmF0ZVdlZWsucmVnaXN0ZXJSYXRpbygpKSAqIDEwMDtcblx0XHR2YXIgbmV3UGVyY2VudGFnZSA9IE1hdGguZmxvb3IoKGRpZmYgKyByYXRlV2Vlay5yZWdpc3RlclN0YXJ0UGVyY2VudGFnZSgpKSAvIDUpICogNTtcblxuXHRcdGlmIChuZXdQZXJjZW50YWdlID4gMCAmJiBuZXdQZXJjZW50YWdlIDw9IDEwMCkge1xuXHRcdFx0aXRlbS5hdHRyaWJ1dGVzLnBlcmNlbnRhZ2UoKVtyYXRlV2Vlay5hY3RpdmVXZWVrKCldLnZhbHVlKG5ld1BlcmNlbnRhZ2UpO1xuXHRcdH0gZWxzZSBpZiAobmV3UGVyY2VudGFnZSA+IDEwMCkge1xuXHRcdFx0aXRlbS5hdHRyaWJ1dGVzLnBlcmNlbnRhZ2UoKVtyYXRlV2Vlay5hY3RpdmVXZWVrKCldLnZhbHVlKDEwMCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGl0ZW0uYXR0cmlidXRlcy5wZXJjZW50YWdlKClbcmF0ZVdlZWsuYWN0aXZlV2VlaygpXS52YWx1ZSgwKTtcblx0XHR9XG5cblx0fVxuXG5cdHJhdGVXZWVrLnNlbGVjdFdlZWsgPSBmdW5jdGlvbihpbmRleCkge1xuXHRcdHJhdGVXZWVrLmFjdGl2ZVdlZWsoaW5kZXgpO1xuXHR9XG5cblx0cmF0ZVdlZWsudG9nZ2xlVmlldyA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmIChyYXRlV2Vlay52aWV3VHlwZSgpID09ICdob3VycycpIHtcblx0XHRcdHJhdGVXZWVrLnZpZXdUeXBlKCdwZXJjZW50Jyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJhdGVXZWVrLnZpZXdUeXBlKCdob3VycycpO1xuXHRcdH1cblx0fVxuXG5cdHJhdGVXZWVrLmdvQmFjayA9IGZ1bmN0aW9uKCkge1xuXHRcdGNvbnNvbGUubG9nKCdnbyBiYWNrJylcblx0XHRhcHAubXlWaWV3TW9kZWwucGVvcGxlLnNob3dEZXRhaWxzKGZhbHNlKTtcblx0XHRhcHAubXlWaWV3TW9kZWwuaGVhZGVyLmdvVG9QYWdlKDEpO1xuXHR9XG5cblx0cmV0dXJuIHNlbGY7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUmF0ZVdlZWs7IiwiLyoqXG4gKiBzY3JpcHRzL3NlbGVjdC1wcm9qZWN0LmpzXG4gKlxuICogVGhpcyBpcyBhIHNhbXBsZSBDb21tb25KUyBtb2R1bGUuXG4gKiBUYWtlIGEgbG9vayBhdCBodHRwOi8vYnJvd3NlcmlmeS5vcmcvIGZvciBtb3JlIGluZm9cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIFNlbGVjdFByb2plY3QoYXBwKSB7XG5cdHZhciBzZWxmID0gdGhpcztcblxuXHR2YXIgc2VsZWN0UHJvamVjdCA9IGFwcC5teVZpZXdNb2RlbC5zZWxlY3RQcm9qZWN0ID0ge307XG5cblx0c2VsZWN0UHJvamVjdC52aWV3VHlwZSA9IGtvLm9ic2VydmFibGUoJ2FsbCcpO1xuXHRzZWxlY3RQcm9qZWN0LmFsbFByb2plY3RzID0ga28ub2JzZXJ2YWJsZUFycmF5KCk7XG5cdHNlbGVjdFByb2plY3QuaXNBZGRNb2RlID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XG5cdHNlbGVjdFByb2plY3QudW5pcXVlQ29tcGFueU5hbWVzID0ga28ub2JzZXJ2YWJsZUFycmF5KCk7XG5cdHNlbGVjdFByb2plY3QuZmlsdGVyZWRQcm9qZWN0TGlzdCA9IGtvLm9ic2VydmFibGVBcnJheSgpO1xuXG5cdHNlbGVjdFByb2plY3QuZ2V0UHJvamVjdHMgPSBmdW5jdGlvbigpIHtcblx0XHRQYXJzZS5DbG91ZC5ydW4oJ2dldFByb2plY3RzJywge30sIHtcblx0XHRcdHN1Y2Nlc3M6IGZ1bmN0aW9uKHByb2plY3RzKSB7XG5cdFx0XHRcdHNlbGVjdFByb2plY3QuYWxsUHJvamVjdHMoW10pO1xuXHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHByb2plY3RzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0cHJvamVjdHNbaV0uYXR0cmlidXRlcy5hY3RpdmUgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcblx0XHRcdFx0XHRwcm9qZWN0c1tpXS5hdHRyaWJ1dGVzLnBlcmNlbnRhZ2UgPSBrby5vYnNlcnZhYmxlQXJyYXkoW3sgdmFsdWU6IGtvLm9ic2VydmFibGUoMCkgfSwgeyB2YWx1ZToga28ub2JzZXJ2YWJsZSgwKSB9LCB7IHZhbHVlOiBrby5vYnNlcnZhYmxlKDApIH1dKTtcblx0XHRcdFx0XHRzZWxlY3RQcm9qZWN0LmFsbFByb2plY3RzLnB1c2gocHJvamVjdHNbaV0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9LCBlcnJvcjogZnVuY3Rpb24oZXJyb3IpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coZXJyb3IpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0UGFyc2UuQ2xvdWQucnVuKCdnZXRVbmlxdWVDb21wYW55TmFtZXMnLCB7fSwge1xuXHRcdFx0c3VjY2VzczogZnVuY3Rpb24ocHJvamVjdHMpIHtcblx0XHRcdFx0c2VsZWN0UHJvamVjdC51bmlxdWVDb21wYW55TmFtZXMocHJvamVjdHMpO1xuXHRcdFx0fSwgZXJyb3I6IGZ1bmN0aW9uKGVycm9yKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGVycm9yKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG5cdHNlbGVjdFByb2plY3QuaW5pdCA9IGZ1bmN0aW9uKCkge1xuXHRcdHNlbGVjdFByb2plY3QuZ2V0UHJvamVjdHMoKTtcblx0fVxuXG5cdHNlbGVjdFByb2plY3QudG9nZ2xlUHJvamVjdCA9IGZ1bmN0aW9uKGl0ZW0sIGV2ZW50KSB7XG5cdFx0aWYgKGl0ZW0uYXR0cmlidXRlcy5hY3RpdmUoKSkge1xuXHRcdFx0aXRlbS5hdHRyaWJ1dGVzLmFjdGl2ZShmYWxzZSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGl0ZW0uYXR0cmlidXRlcy5hY3RpdmUodHJ1ZSk7XG5cdFx0fVxuXHR9XG5cblx0c2VsZWN0UHJvamVjdC50b2dnbGVBZGRNb2RlID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHNlbGVjdFByb2plY3QuaXNBZGRNb2RlKCkpIHtcblx0XHRcdGFwcC5teVZpZXdNb2RlbC5oZWFkZXIuaXNNb2RhbChmYWxzZSk7XG5cdFx0XHRzZWxlY3RQcm9qZWN0LmlzQWRkTW9kZShmYWxzZSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGFwcC5teVZpZXdNb2RlbC5oZWFkZXIuaXNNb2RhbCh0cnVlKTtcblx0XHRcdCQoJy5wcm9qZWN0LXR5cGVhaGVhZC1maWVsZCcpLnZhbCgnJyk7XG5cdFx0XHQkKCcucHJvamVjdC1uYW1lLWZpZWxkJykudmFsKCcnKTtcblx0XHRcdHNlbGVjdFByb2plY3QuZmlsdGVyZWRQcm9qZWN0TGlzdChbXSk7XG5cdFx0XHRzZWxlY3RQcm9qZWN0LmlzQWRkTW9kZSh0cnVlKTtcblx0XHR9XG5cdH1cblxuXHRzZWxlY3RQcm9qZWN0LnRvZ2dsZVZpZXcgPSBmdW5jdGlvbigpIHtcblx0XHRpZiAoc2VsZWN0UHJvamVjdC52aWV3VHlwZSgpID09ICdhbGwnKSB7XG5cdFx0XHRzZWxlY3RQcm9qZWN0LnZpZXdUeXBlKCdzZWxlY3RlZCcpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRzZWxlY3RQcm9qZWN0LnZpZXdUeXBlKCdhbGwnKTtcblx0XHR9XG5cdH1cblxuXHRzZWxlY3RQcm9qZWN0LnNlbGVjdFByb2plY3RUeXBlYWhlYWQgPSBmdW5jdGlvbihpdGVtKSB7XG5cdFx0JCgnLnByb2plY3QtdHlwZWFoZWFkLWZpZWxkJykudmFsKGl0ZW0pO1xuXHRcdHNlbGVjdFByb2plY3QuZmlsdGVyZWRQcm9qZWN0TGlzdChbXSk7XG5cdH1cblxuXHRzZWxlY3RQcm9qZWN0LnNob3dUeXBlYWhlYWRSZXN1bHRzID0gZnVuY3Rpb24oaXRlbSwgZXZlbnQpIHtcblx0XHR2YXIgbmVlZGxlID0gZXZlbnQudGFyZ2V0LnZhbHVlLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvW15cXHdcXGRdL2dpLCAnJyk7XG5cblx0XHRpZiAobmVlZGxlLmxlbmd0aCA+IDApIHtcblx0XHRcdHZhciBmaWx0ZXJlZFByb2plY3RzID0gXy5maWx0ZXIoc2VsZWN0UHJvamVjdC51bmlxdWVDb21wYW55TmFtZXMoKSwgZnVuY3Rpb24ob2JqKSB7XG5cdFx0XHRcdHZhciBoYXlzdGFjayA9IG9iai50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1teXFx3XFxkXS9naSwgJycpO1xuXHRcdFx0XHRyZXR1cm4gaGF5c3RhY2suaW5kZXhPZihuZWVkbGUpID49IDA7IFxuXHRcdFx0fSk7XG5cdFx0XHR2YXIgZmllbGRQb3NpdGlvbiA9ICQoJy5wcm9qZWN0LXR5cGVhaGVhZC1maWVsZCcpLm9mZnNldCgpO1xuXHRcdFx0JCgnLnByb2plY3QtdHlwZWFoZWFkJykuY3NzKCdsZWZ0JywgZmllbGRQb3NpdGlvbi5sZWZ0KS5jc3MoJ3RvcCcsIGZpZWxkUG9zaXRpb24udG9wICsgJCgnLnByb2plY3QtdHlwZWFoZWFkLWZpZWxkJykuaGVpZ2h0KCkrMjApO1xuXHRcdFx0c2VsZWN0UHJvamVjdC5maWx0ZXJlZFByb2plY3RMaXN0KGZpbHRlcmVkUHJvamVjdHMpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRzZWxlY3RQcm9qZWN0LmZpbHRlcmVkUHJvamVjdExpc3QoW10pO1xuXHRcdH1cblx0fVxuXG5cdHNlbGVjdFByb2plY3Quc2F2ZU5ld1Byb2plY3QgPSBmdW5jdGlvbigpIHtcblx0XHR2YXIgZGF0YSA9IHtcblx0XHRcdGNvbXBhbnk6ICQoJy5wcm9qZWN0LXR5cGVhaGVhZC1maWVsZCcpLnZhbCgpLFxuXHRcdFx0cHJvamVjdDogJCgnLnByb2plY3QtbmFtZS1maWVsZCcpLnZhbCgpLFxuXHRcdH1cblx0XHRQYXJzZS5DbG91ZC5ydW4oJ3NhdmVQcm9qZWN0JywgZGF0YSwge1xuXHRcdFx0c3VjY2VzczogZnVuY3Rpb24ocHJvamVjdCkge1xuXHRcdFx0XHRhbGVydCgnXCInICsgcHJvamVjdC5hdHRyaWJ1dGVzLmNvbXBhbnkgKyAnOiAnICsgcHJvamVjdC5hdHRyaWJ1dGVzLm5hbWUgKyAnXCIgY3JlYXRlZCBzdWNjZXNzZnVsbHkuJyk7XG5cdFx0XHRcdHNlbGVjdFByb2plY3QudG9nZ2xlQWRkTW9kZSgpO1xuXHRcdFx0XHRzZWxlY3RQcm9qZWN0LmdldFByb2plY3RzKCk7XG5cdFx0XHR9LCBlcnJvcjogZnVuY3Rpb24oZXJyb3IpIHtcblx0XHRcdFx0Ly8gYWxlcnQoZXJyb3IpXG5cdFx0XHRcdGNvbnNvbGUubG9nKGVycm9yKTtcblx0XHRcdH1cblx0XHR9KTtcblx0XHRcblx0fVxuXG5cdHNlbGVjdFByb2plY3QuaW5pdCgpO1xuXG5cdHJldHVybiBzZWxmO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNlbGVjdFByb2plY3Q7IiwiLyoqXG4gKiBzY3JpcHRzL3N0ZXBzLmpzXG4gKlxuICogVGhpcyBpcyBhIHNhbXBsZSBDb21tb25KUyBtb2R1bGUuXG4gKiBUYWtlIGEgbG9vayBhdCBodHRwOi8vYnJvd3NlcmlmeS5vcmcvIGZvciBtb3JlIGluZm9cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIFN0ZXBzKGFwcCkge1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0dmFyIHN0ZXBzID0gYXBwLm15Vmlld01vZGVsLnN0ZXBzID0ge307XG5cblx0c3RlcHMuY3VycmVudFN0ZXAgPSBrby5vYnNlcnZhYmxlKDApO1xuXHRzdGVwcy5zdGVwcyA9IGtvLm9ic2VydmFibGVBcnJheShbXG5cdFx0e1xuXHRcdFx0c3RlcE51bWJlcjogMCxcblx0XHRcdHN0ZXBOYW1lOiAnc2VsZWN0UHJvamVjdCdcblx0XHR9LFxuXHRcdHtcblx0XHRcdHN0ZXBOdW1iZXI6IDEsXG5cdFx0XHRzdGVwTmFtZTogJ3NlbGVjdFByb2plY3QnXG5cdFx0fVxuXHRcdC8vIHtcblx0XHQvLyBcdHN0ZXBOdW1iZXI6IDIsXG5cdFx0Ly8gXHRzdGVwTmFtZTogJ3NlbGVjdFByb2plY3QnXG5cdFx0Ly8gfSxcblx0XHQvLyB7XG5cdFx0Ly8gXHRzdGVwTnVtYmVyOiAzLFxuXHRcdC8vIFx0c3RlcE5hbWU6ICdzZWxlY3RQcm9qZWN0J1xuXHRcdC8vIH1cblx0XSk7XG5cblx0Ly8gJChkb2N1bWVudCkub24oJ3N3aXBlJywgZnVuY3Rpb24oKSB7XG5cdC8vIFx0YWxlcnQoJ3N3aXBlJylcblx0Ly8gfSk7XG5cblx0c3RlcHMuY2hhbmdlU3RlcCA9IGZ1bmN0aW9uKGl0ZW0pIHtcblx0XHRzdGVwcy5jdXJyZW50U3RlcChpdGVtLnN0ZXBOdW1iZXIpO1xuXHRcdC8vIGFwcC5teVZpZXdNb2RlbC5yYXRlUHJvamVjdC5pbml0UHJvamVjdCgpO1xuXHR9XG5cblx0c3RlcHMubmV4dFN0ZXAgPSBmdW5jdGlvbihkaXJlY3Rpb24pIHtcblx0XHRzdGVwcy5jdXJyZW50U3RlcChzdGVwcy5jdXJyZW50U3RlcCgpICsgZGlyZWN0aW9uKTtcblx0XHQvLyBhcHAubXlWaWV3TW9kZWwucmF0ZVByb2plY3QuaW5pdFByb2plY3QoKTtcblx0fVxuXG5cdHJldHVybiBzZWxmO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFN0ZXBzOyJdfQ==
