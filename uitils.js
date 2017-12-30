var fs = require('fs');
var portscanner = require('portscanner');
var async = require('async');

module.exports.logo = function(cb) {
	fs.readFile('../logo.txt', 'utf8', cb);
};
module.exports.printLogo = function() {
	common.logo(function(err, logo) {
		if (err) {
			throw err
		}

		console.log('   * ');
		console.log('   * ' + logo.split('\n').join('\n   * '));
		console.log('   * ');
		console.log('   * (C) 2014, MangoRaft.');
	});
};

module.exports.waitForServerState = function(client, serverId, targetState, cb) {
	var latestState = 'unknown';
	var latestServer = null;
	async.whilst(function(a) {
		return latestState !== targetState;
	}, function(whilstCb) {
		client.servers.get(serverId, function(err, server) {

			if (err) {
				return whilstCb(err)
			}

			latestServer = server;
			latestState = server.state;
			if (latestState === targetState) {
				whilstCb(null, server);
			} else {
				setTimeout(whilstCb, 1000);
			}
		});
	}, function(err) {
		if (err) {
			return cb(err)
		}
		cb(null, latestServer)

	});
};

module.exports.waitPortOpen = function(ip, port, cb) {
	var isPortOpen = false;
	async.until(function() {
		return isPortOpen;
	}, function(loopCb) {
		portscanner.checkPortStatus(port, ip, function(err, statusOfPort) {
			if (statusOfPort === 'open') {
				isPortOpen = true;
				cb(err);
			} else {
				setTimeout(function() {
					loopCb(null);
				}, 1000);
			}
		});
	}, cb);
};
