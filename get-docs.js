var mongoose = require('nodetopia-model');

var docs = module.exports = {};

docs.app = function(id, cb) {
	mongoose.App.findOne({
		_id : id
	}, cb);
};
docs.repo = function(id, cb) {
	mongoose.App.findOne({
		_id : id
	}, cb);
};
