function error(err) {

	console.log(err);

		return err;

	var error = {
		aa : err
	};
	console.log(error);
	return error;
}

module.exports = {
	mongoose : error,
	addons : error,
	authenticated : error,
	build : error,
	git : error,
	fleet : error,
	fleetio : error,
	api : {
		mongoose : function(err, res) {
			if (err) {
				console.log(err)
				res.status(400).json({
					status : "failure",
					error : 'internal server error',
					message : err.message || 'Internal Server Error'
				});
				return true;
			}
			return false;
		}
	},
	missing : {
		app : function(name, app, res) {
			if (!app) {
				res.status(400).json({
					status : "failure",
					error : 'app not found',
					message : 'Application "' + name + '" not found'
				});
				return true;
			}
			return false;
		},
		build : function(build, res) {
			if (!build) {
				res.status(400).json({
					status : "failure",
					error : 'build not found',
					message : 'Build not found'
				});
				return true;
			}
			return false;
		},
		commit : function(commit, res) {
			if (!commit) {
				res.status(400).json({
					status : "failure",
					error : 'commit not found',
					message : 'Commit not found'
				});
				return true;
			}
			return false;
		},
		domain : function(domain, res) {
			if (!domain) {
				res.status(400).json({
					status : "failure",
					error : 'domain not found',
					message : 'Domain not found'
				});
				return true;
			}
			return false;
		},
		env : function(env, res) {
			if (!env) {
				res.status(400).json({
					status : "failure",
					error : 'env not found',
					message : 'Env not found'
				});
				return true;
			}
			return false;
		},
		container : function(container, res) {
			if (!container) {
				res.status(400).json({
					status : "failure",
					error : 'container not found',
					message : 'Container not found'
				});
				return true;
			}
			return false;
		},
		addon : function(addon, res) {
			if (!addon) {
				res.status(400).json({
					status : "failure",
					error : 'addon not found',
					message : 'Addon not found'
				});
				return true;
			}
			return false;
		},
		formation : function(formation, res) {
			if (!formation) {
				res.status(400).json({
					status : "failure",
					error : 'formation not found',
					message : 'Formation not found'
				});
				return true;
			}
			return false;
		}
	}
};
var errors = {
    'F1' : {
        code : 'F1',
        message : 'NOACTIVENODE',
        description : 'No active nodes in location am for development'
    },
    'F2' : {
        code : 'F2',
        message : 'NONODE',
        description : 'No node can host this application currently please try again later'
    }
};
module.exports.FleetError = function FleetError(code) {
	// Error.captureStackTrace(this, this.constructor);
	this.error = 'FleetError';
	this.msg = errors[code].message;
	this.code = errors[code].code;
	this.desc = errors[code].description;
};

