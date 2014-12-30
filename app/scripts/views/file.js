var Backbone = require('backbone');
var template = require('../templates/file.hbs');

module.exports = Backbone.View.extend({
	tag: 'li',
	className: 'file',

	initialize: function() {
		this.listenTo(this.model, 'change', this.render);
	},
	
	render: function() {
		this.$el.html(template(this.model.toJSON()));
		return this;
	}
});