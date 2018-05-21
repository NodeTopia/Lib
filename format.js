var format = module.exports;
var nconf = require('nconf');

format.user = function(user) {
	return {
		id : user._id,
		username : user.username,
		email : user.email,
		updated_at : user.updated_at,
		created_at : user.created_at,
		is_active : user.is_active,
		is_staff : user.is_staff,
		limits : user.limits
	};
};
format.userInfo = function(userInfo) {
	return {
		first_name : userInfo.first_name || '',
		last_name : userInfo.last_name || '',
		created_at : userInfo.created_at,
		updated_at : userInfo.updated_at
	};
};
format.app = function(app, organization) {
	return {
		name : app.name,
		id : app._id,
		organization : app.organization ? app.organization.name : null,
		region : app.region,
		url : nconf.get('urls:protocol') + app.url,
		maintenance : app.maintenance,
		//metricSession : app.metricSession,
		logSession : app.logSession,
		updated_at : app.updated_at,
		created_at : app.created_at,
		is_active : app.is_active,
		limits : app.limits,
		domains : app.domains.map(format.domain)
	};
};
format.repo = function(repo, users) {
	if (!repo)
		return undefined;
	return {
		name : repo.name,
		organization : repo.organization,
		url : nconf.get('urls:protocol') + repo.url,
		updated_at : repo.updated_at,
		created_at : repo.created_at,
		is_active : repo.is_active
	};
};

format.build = function(build) {
	if (!build)
		return undefined;
	return {

		id : build._id,
		name : build.name,
		build : format.buildTar(build.build),
		application : format.buildTar(build.application),
		cache : format.buildTar(build.cache),
		version : build.version,
		created_at : build.created_at,
		procfile : build.procfile.map(format.procfile),
		failed : build.failed,
		is_active : build.is_active
	};
};
format.buildTar = function(tar) {
	return {
		id : tar._id,
		size : tar.size,
		modified : tar.lastModified,
		etag : tar.etag,
	};
};
format.procfile = function(procfile) {
	return {
		command : procfile.command,
		process : procfile.process,
		id : procfile._id,
		options : procfile.options
	};
};
format.commit = function(commit) {
	if (!commit)
		return undefined;
	return {
		id : commit._id,
		name : commit.name,
		organization : commit.organization,
		action : commit.action,
		hash : commit.commit,
		head : commit.head,
		branch : commit.branch,
		created_at : commit.created_at
	};
};
format.env = function(env) {
	if (!env)
		return undefined;
	return {
		id : env.id,
		env : env.env,
		updated_at : env.updated_at,
		created_at : env.created_at
	};

};
format.domain = function(domain) {
	if (!domain)
		return undefined;
	return {
		created_at : domain.created_at,
		updated_at : domain.updated_at,
		url : domain.url,
		tls : format.tls(domain.tls)
	};
};
format.tls = function(tls) {
	if (!tls)
		return undefined;
	return {
		id : tls._id,
		//privkey :tls._id,
		//cert : tls.cert,
		//chain : tls.chain,
		//subject : tls.subject,
		issued : tls.issuedAt,
		expires : tls.expiresAt,
		staging : tls.staging,
		updated_at : tls.updated_at,
		created_at : tls.created_at
	};
};

format.container = function(container) {
	if (!container)
		return undefined;
	//return container
	return {
		id : container.id,
		index : container.config.index,
		created_at : container.created_at,
		stopped_at : container.stopped_at,
		statusCode : container.statusCode,
		state : container.state,
		name : container.name,
		type : container.type,
		env : container.env,
		uid : container.uid,
		limits : format.size(container.config.size),
		location : container.config.location,
		//ports : container.ports
	};
};
format.formation = function(formation) {
	if (!formation)
		return undefined;
	return {
		id : formation._id,
		updated_at : formation.updated_at,
		created_at : formation.created_at,
		commands : formation.commands.map(function(item) {
			return {
				type : item.type,
				//cmd : 'herokuish procfile start web',
				quantity : item.quantity,
				size : format.size(item.size)
			};
		})
	};
};
format.size = function(size) {
	if (!size)
		return undefined;

	return {
		id : size._id,
		type : size.type,
		memory : size.memory,
		//memoryReservation : size.memoryReservation,
		cpu : size.cpu,
		ioBandwidth : size.ioMaximumBandwidth,
		iops : size.ioMaximumIOps * 1000,
		oomKill : !size.oomKillDisable,
		dedicated : size.dedicated,
		//updated_at : size._id,
		//created_at : size._id
	};
};
format.addons = function(addon) {
	if (!addon)
		return undefined;

	return {
		is_active : addon.is_active,
		type : addon.type,
		env : addon.info,
		containers : addon.containers.map(format.container),
		size : format.size(addon.size),
		info : addon.info || {},
	};
};
format.plan = function(plan) {
	return {
		id : plan._id,
		apps : plan.apps,
		processes : plan.processes,
		cpu : plan.cpu,
		memory : plan.memory,
		services : plan.services,
		dedicated : plan.dedicated,
		name : plan.name,
		size : format.size(plan.size),
		//updated_at : plan.updated_at,
		//created_at : plan.created_at
	};
};
format.zone = function(zone) {
	return {
		id : zone._id,
		name : zone.name,
		//updated_at : zone.updated_at,
		//created_at : zone.created_at
	};
};
format.quota = function(quota) {
	return {
		id : quota._id,
		plan : format.plan(quota.plan),
		zones : quota.zones.map(format.zone),
		services : quota.services,
		memory : quota.memory,
		processes : quota.processes,
		apps : quota.apps,
		//updated_at : quota.updated_at,
		//created_at : quota.created_at
	};
};
format.role = function(role) {
	return {
		id : role._id,
		name : role.name,
		level : role.level,
		//updated_at : role.updated_at,
		//created_at : role.created_at
	};
};
format.organization = function(organization) {
	if (!organization)
		return undefined;

	return {
		id : organization._id,
		name : organization.name,
		quota : organization.quota && format.quota(organization.quota),
		//metricSession: organization.metricSession,
		apps : organization.apps && organization.apps.map(format.app),
		membership : organization.membership.map(function(member) {
			return {
				user : format.user(member.user),
				role : member.role && format.role(member.role),
				id : member._id,
				//updated_at : member.updated_at,
				//created_at : member.created_at
			};
		}),
		//updated_at : organization.updated_at,
		//created_at : organization.created_at
	};
};

format.DNSZone = function(zone) {
	return {
		id : zone._id,
		zone : zone.zone,
		records : zone.records.map(format.DNSRecord)
	};
};
format.DNSRecord = function(record) {
	return record.toRecord(true);
};
/**
 *
 *
 */

format.backupTar = function(tar) {
	return {
		id : tar._id,
		size : tar.size,
		contentType : tar.contentType,
		created_at : tar.lastModified,
		etag : tar.etag
	};
};
