'use strict';
var Backbone = require('backbone');

module.exports = Backbone.Collection.extend({
	initialize: function(options) {
		this.repo = options.repo;
	},

	url: function() {
		return '/rest/contributors?repo=' + this.repo;
	}
});