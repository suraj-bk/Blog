
var mongoose = require('mongoose');

module.exports = mongoose.model('Writer',{
	id: String,
	username: String,
	password: String,
	email: String,
	firstName: String,
	lastName: String,
	group: String
});