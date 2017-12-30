/*
 * User actions
 * Nodester - Open Source PaaS
 * http://nodester.com
 */

var restify = require('restify');
var Authenticate = module.exports;

Authenticate.post = function(req, res, next) {

	var username = req.body.username,
	    password = req.body.password;

	if (!username) {
		return next(new restify.errors.UnauthorizedError('Username missing'));
	} else if (!password) {
		return next(new restify.errors.UnauthorizedError('Password missing'));
	}

	var User = req.mongoose.User;
	var UserTokens = req.mongoose.UserTokens;
	User.getAuthenticated(username, password, function(err, user, reason) {
		if (err)
			throw err;

		if (user) {
			UserTokens.new(user._id, function(err, userToken) {
				if (err)
					throw err;

				res.json({
					status : "success",
					token : userToken.token
				}, 200);
			});
			return;
		}

		// otherwise we can determine why we failed
		var reasons = User.failedLogin;
		switch (reason) {
		case reasons.NOT_FOUND:
		case reasons.PASSWORD_INCORRECT:
			// note: these cases are usually treated the same - don't tell
			// the user *why* the login failed, only that it did
			next(new restify.errors.UnauthorizedError('Login failed please try again.'));
			break;
		case reasons.MAX_ATTEMPTS:
			// send email or otherwise notify user that account is
			// temporarily locked
			next(new restify.errors.UnauthorizedError('Login failed please try again.'));
			break;
		}
	});
};

Authenticate.staff = function(req, res, next) {

	if (req.user.is_staff) {
		next();
	} else {
		next(new restify.errors.ForbiddenError("This action requires a staff account"));
	}

};

Authenticate.roleName = function(role) {

	return function(req, res, next) {

		var Organization = req.mongoose.Organization;
		var Roles = req.mongoose.Roles;
		var name = req.params.organization || req.user.username;
		var user = req.user;

		Organization.findOne({
			name : name,
			'membership.user' : user._id
		}, function(err, organization) {
			if (err) {
				return next(new restify.errors.InternalError(err.message || err));
			}

			if (!organization) {
				return next(new restify.errors.ForbiddenError("no org"));
			}
			Roles.findOne({
				name : role
			}, function(err, role) {
				if (err) {
					return next(new restify.errors.InternalError(err.message || err));
				}

				var member = organization.membership.filter(function(m) {
					return m.user._id.toString() == user._id.toString();
				}).shift();

				if (!member) {
					return next(new restify.errors.ForbiddenError("not a member"));
				}

				if (member.role.level >= role.level) {
					req.organization = organization;
					return next();
				}
				next(new restify.errors.ForbiddenError("bad role"));

			});
		});
	};
};
Authenticate.role = function(org, user, level) {

	if (!org) {
		return false;
	}

	var member = org.membership.filter(function(m) {
		return m.user._id.toString() == user._id.toString();
	}).shift();

	if (!member) {
		return false;
	}

	return member.role.level >= level;
};

Authenticate.auth = function(req, res, next) {

	var token = req.headers['x-auth-token'];

	if (!token && req.query['x-auth-token']) {
		token = req.query['x-auth-token'];
	}

	var User = req.mongoose.User;
	var UserTokens = req.mongoose.UserTokens;

	if (!token) {
		return next(new restify.errors.ForbiddenError("Missing authorization header"));
	}
	UserTokens.findOne({
		token : token
	}, function(err, userToken) {
		if (err) {
			return next(new restify.errors.InternalError(err.message || err));
		}

		if (!userToken) {
			return next(new restify.errors.ForbiddenError("Authorization failed please try again."));
		}

		req.userToken = userToken;

		User.findOne({
			_id : userToken.userId
		}, function(err, user) {
			if (err) {
				return next(new restify.errors.InternalError(err.message || err));
			}

			req.user = user;

			next();
		});
	});
};
