const tld = require('tldjs');
const restify = require('restify')
const mongoose = require('nodetopia-model');
const kue = require('nodetopia-kue');

const to = require('./to');

var dns = module.exports = {
    getZone: function (zone, organization) {
        return new Promise(async function (resolve, reject) {
            let [err, dnsZone] = await to(mongoose.DNSZone.findOne({
                zone: zone
            }))

            if (err) {
                err.type = 'InternalError';
                reject(err)
                return
            }

            if (!dnsZone) {
                dnsZone = new mongoose.DNSZone({
                    organization: organization,
                    zone: zone
                });
            } else if (dnsZone.organization.toString() !== organization.toString()) {
                return reject(new Error('Zone used by another organization'));
            }
            resolve(dnsZone);
        })
    },
    validateRecord: function (records, name, type, data, priority, reject) {
        for (let record of records) {
            if (record.name === name && record.type === type && record.data === data) {
                if (record.ttl !== ttl) {
                    reject(new Error('dns record already exists ttl change?'));
                    return false
                } else if (record.priority !== priority) {
                    reject(new Error('dns record already exists priority change?'));
                    return false
                } else {
                    reject(new Error(`dns record already exists ${type}:${name}:'${data}`));
                    return false
                }
            }
        }
        return true
    },
    add: function (_data) {
        return new Promise(async function (resolve, reject) {

            let {
                organization,
                name,
                type,
                ttl = 3600,
                priority,
                data
            } = _data

            name = name.toLowerCase();
            type = type.toUpperCase();
            let zone = tld.getDomain(name.replace('*.', ''));

            if (type === 'MX' && priority === undefined) {
                priority = 10;
            }

            let dnsZone
            try {
                dnsZone = await dns.getZone(zone, organization)
            } catch (err) {
                err.type = 'InternalError';
                return reject(err);
            }

            if (dnsZone.isNew) {
                return reject(new restify.errors.NotFoundError('zone does not exists'));
            }

            if (dns.validateRecord(dnsZone.records, name, type, data, priority, reject)) {
                return
            }

            let record = new mongoose.DNSRecord({
                name: name,
                type: type,
                data: data,
                priority: priority,
                reference: dnsZone._id
            });

            ['ttl', 'admin', 'serial', 'refresh', 'retry', 'expiration', 'minimum'].forEach(function (key) {
                if (_data.hasOwnProperty(key)) {
                    record[key] = _data[key];
                }
            });

            try {
                await Promise.all([record.save(), dnsZone.update({
                    '$push': {
                        records: {
                            '$each': [record._id]
                        }
                    }
                })]);
                resolve({
                    zone: dnsZone,
                    record: record,
                    raw: await kue.dns.add(record.toRecord())
                });
            } catch (err) {
                err.type = 'InternalError';
                return reject(err);
            }
        })
    },
    remove: function (data, callback) {

        return new Promise(async function (resolve, reject) {

            let organization = data.organization;

            let name = data.name.toLowerCase();
            let type = data.type.toUpperCase();

            let data = data.data;
            let ttl = data.ttl || 3600;
            let zone = tld.getDomain(name.replace('*.', ''));
            let dnsZone
            try {
                dnsZone = await mongoose.DNSZone.findOne({
                    organization: organization,
                    zone: zone
                })
            } catch (err) {
                err.type = 'InternalError';
                return reject(err);
            }
            if (dnsZone.isNew) {
                return next(new restify.errors.NotFoundError('zone does not exists'));
            }
            for (var record of dnsZone.records) {
                if (record.name === name && record.type === type && record.data === data) {
                    dnsZone.records.splice(i, 1);
                    break;
                }
                record = null;
            }

            if (!record) {
                return reject(new Error('record does not exists'));
            }

            try {
                await Promise.all([record.remove(), dnsZone.save()]);
                resolve({
                    zone: dnsZone,
                    record: record,
                    raw: await kue.dns.remove(record.toRecord())
                });
            } catch (err) {
                err.type = 'InternalError';
                return reject(err);
            }
        })
    }
};
