var helpers = module.exports;
var async = require('async');
var mongoose = require('nodetopia-model');
var errors = require('./errors');

helpers.docs = function(options, cb) {
	console.log(options)
	mongoose.Organization.findOne({
		name : options.organization
	}, function(err, organization) {

		mongoose.App.findOne({
			organization : organization._id,
			name : options.name
		}, function(err, app) {

			var query = {
				repo : function(next) {
					mongoose.Repo.findOne({
						app : app._id
					}, next);
				},
				env : function(next) {
					mongoose.Env.findOne({
						app : app._id
					}, next);
				},
				formation : function(next) {
					mongoose.Formation.findOne({
						app : app._id
					}, next);
				},
				domains : function(next) {
					mongoose.Domain.find({
						app : app._id
					}, next);
				}
			};

			if (options.commit) {
				query.commit = function(next) {
					mongoose.Commit.findOne({
						_id : options.commit
					}, next);
				};
			}
			if (options.build) {
				query.build = function(next) {
					mongoose.Build.findOne({
						app : app._id,
						_id : options.build
					}, next);
				};
			} else {
				query.build = function(next) {
					mongoose.Build.findOne({
						app : app._id,
						is_active : true
					}, next);
				};
			}

			query.tag = function(next) {
				mongoose.Build.count({
					organization : app.organization._id,
					name : app.name
				}, next);
			};

			async.parallel(query, function(err, docs) {
				docs.app = app;
				cb(null, docs);
			});
		});
	});

};
