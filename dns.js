var nconf = require('nconf');
var tld = require('tldjs');

var mongoose = require('nodetopia-model');
var kue = require('nodetopia-kue');

var dns = module.exports = {
	getZone : function(zone, organization, callback) {

		mongoose.DNSZone.findOne({
			zone : zone
		}, function(err, dnsZone) {
			if (err) {
				err.type = 'InternalError';
				return callback(err);
			}

			if (!dnsZone) {
				dnsZone = new mongoose.DNSZone({
					organization : organization,
					zone : zone
				});
			} else if (dnsZone.organization.toString() != organization.toString()) {
				return callback(new Error('Zone used by another organization'));
			}
			callback(null, dnsZone);

		});
	},
	add : function(_data, callback) {
		console.log(_data)
		var organization = _data.organization;

		var name = _data.name.toLowerCase();
		var type = _data.type.toUpperCase();
		var ttl = _data.ttl || 3600;
		var priority = _data.priority;
		var data = _data.data;
		var zone = tld.getDomain(name.replace('*.', ''));

		if (type == 'MX' && priority == undefined) {
			priority = 10;
		}

		dns.getZone(zone, organization, function(err, dnsZone) {
			if (err) {
				err.type = 'InternalError';
				return callback(err);
			}

			if (dnsZone.isNew) {
				return callback(new restify.errors.NotFoundError('zone does not exists'));
			}
			for (var i = 0; i < dnsZone.records.length; i++) {
				var record = dnsZone.records[i];
				if (dnsZone.records[i].name == name && dnsZone.records[i].type == type && dnsZone.records[i].data == data) {
					if (dnsZone.records[i].ttl !== ttl) {
						return callback(new Error('dns record already exists ttl change?'));
					} else if (dnsZone.records[i].priority !== priority) {
						return callback(new Error('dns record already exists priority change?'));
					} else {
						return callback(new Error('dns record already exists ' + type + ':' + name + ':' + data));
					}
				}
			};

			record = new mongoose.DNSRecord({
				name : name,
				type : type,
				data : data,
				priority : priority,
				reference : dnsZone._id
			});

			['ttl', 'admin', 'serial', 'refresh', 'retry', 'expiration', 'minimum'].forEach(function(key) {
				if (_data.hasOwnProperty(key)) {
					record[key] = _data[key];
				}
			});

			record.save(function(err) {
				if (err) {
					err.type = 'InternalError';
					return callback(err);
				}
				dnsZone.update({
					'$push' : {
						records : {
							'$each' : [record._id]
						}
					}
				}, function(err) {
					if (err) {
						err.type = 'InternalError';
						return callback(err);
					}
					kue.dns.add(record.toRecord(), function(err, result) {
						if (err) {
							err.type = 'InternalError';
							return callback(err);
						}
						callback(null, {
							zone : dnsZone,
							record : record,
							raw : result
						});
					});
				});
			});

		});
	},
	remove : function(data, callback) {
		var organization = data.organization;

		var name = data.name.toLowerCase();
		var type = data.type.toUpperCase();

		var data = data.data;
		var ttl = data.ttl || 3600;
		var zone = tld.getDomain(name.replace('*.', ''));

		mongoose.DNSZone.findOne({
			organization : organization,
			zone : zone
		}, function(err, dnsZone) {
			if (err) {
				err.type = 'InternalError';
				return callback(err);
			}
			if (!dnsZone) {
				return callback(Error('zone does not exists'));
			}
			if (dnsZone.isNew) {
				return next(new restify.errors.NotFoundError('zone does not exists'));
			}
			for (var i = 0; i < dnsZone.records.length; i++) {
				var record = dnsZone.records[i];
				if (record.name == name && record.type == type && record.data == data) {
					dnsZone.records.splice(i, 1);
					break;
				}
				record = null;
			};

			if (!record) {
				return callback(new Error('record does not exists'));
			}
			record.remove(function(err) {
				if (err) {
					err.type = 'InternalError';
					return callback(err);
				}
				dnsZone.save(function(err) {
					if (err) {
						err.type = 'InternalError';
						return callback(err);
					}

					kue.dns.remove(record.toRecord(), function(err, result) {
						if (err) {
							err.type = 'InternalError';
							return callback(err);
						}
						callback(null, {
							zone : dnsZone,
							record : record,
							raw : result
						});
					});
				});
			});

		});
	}
};
