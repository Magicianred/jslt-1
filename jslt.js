
function compileTemplate(data, template) {
	function visit(value) {
		if (typeof value == "string") {
			var res = /^{{([^}]+)}}$/.exec(value);
			if (res) return resolveProp(res[1], data);
			return value.replace(/{{([^}]+)}}/g, (str, p1) => resolveProp(p1, data));
		} else if (value instanceof Array) {
			return value.map(visit);
		} else if (value instanceof Object) {
			const entries = Object.entries(value);
			const ops = entries.filter(e => e[0].startsWith("$"));
			return ops.length ?
				processUpdate(ops, data) : 
				entries.reduce((obj, [key, value]) => { return (obj[key] = visit(value)), obj; }, {});
		} else {
			return value;
		}
	}

	return visit(template);
}

function resolveProp(name, scope) {
	const parts = name.split(".");
	for (var i = 0; i < parts.length; ++i) {
		var [, name, index] = /^([^[]+)(?:\[(\d+)\])?$/.exec(parts[i]);
		scope = scope[name];
		if (!scope) return scope;
		if (index !== undefined) scope = scope[index];
		if (!scope) return scope;
	}
	return scope;
}

function processQuery(query, data) {
	return Object.entries(query).every(([fieldName, fieldValue]) => {
		return Object.entries(fieldValue).every(([opName, opValue]) => {
			const opFunc = QueryOperators[opName];
			if (!opFunc) throw `Invalid query operator: ${opName}`;
			return opFunc(opValue, resolveProp(fieldName, data));
		});
	});
}

function processUpdate(ops, data) {
	return ops.reduce((payload, [opName, opValue]) => {
		const opFunc = UpdateOperators[opName] || UpdateOperators[opName.replace(/\d+$/, "")];
		if (!opFunc) throw `Invalid operator: ${opName}`;
		return opFunc(opValue, payload, data);
	}, data);
}

const QueryOperators = {
	$eq(expected, actual) {
		return expected == actual;
	},
	
	$ne(expected, actual) {
		return expected != actual;
	},
	
	$gt(expected, actual) {
		return expected > actual;
	},
	
	$lt(expected, actual) {
		return expected < actual;
	},
	
	$gte(expected, actual) {
		return expected >= actual;
	},
	
	$lte(expected, actual) {
		return expected <= actual;
	},
	
	$in(expected, actual) {
		if (!(expected instanceof Array)) throw "$in: argumment is not an array";
		return expected.includes(actual);
	},
	
	$nin(expected, actual) {
		if (!(expected instanceof Array)) throw "$nin: argumment is not an array";
		return !expected.includes(actual);
	},
	
	$regex(expected, actual) {
		if (expected instanceof RegExp) return expected.test(actual);
		if (typeof expected !== "string") throw "$regex: invalid expression";
		var re = new RegExp(expected);
		return re.test(actual);
	}
};

const UpdateOperators = {
	$fetch(op, data, global) {
		return compileTemplate(data, op);
	},
	
	$map(op, data, global) {
		if (!(data instanceof Array)) throw "$map: input is not an array";
		return data.map(item => compileTemplate(item, op));
	},

	$filter(op, data, global) {
		if (!(data instanceof Array)) throw "$filter: input is not an array";
		return data.filter(item => processQuery(op, item));
	},
	
	$push(op, data, global) {
		if (!(data instanceof Array)) throw "$push: input is not an array";
		return data.concat(compileTemplate(global, op));
	},
	
	$unshift(op, data, global) {
		if (!(data instanceof Array)) throw "$unshift: input is not an array";
		return [ compileTemplate(global, op) ].concat(data);
	},
	
	$sum(op, data, global) {
		if (!(data instanceof Array)) throw "$sum: input is not an array";
		return data.reduce((sum, cur) => sum + cur, 0);
	},

	$translate(op, data, global) {
		if (!(op && op.from instanceof Array && op.to instanceof Array))
			throw "$translate: invalid from/to argument";
		
		var idx = op.from.indexOf(data);
		return idx != -1 ? compileTemplate(global, op.to[idx]) : data;
	},
	
	$concat(op, data, global) {
		return op.map(item => compileTemplate(global, item)).join("");
	},
	
	$formatDate(op, data, global) {
		return (new Date(data)).toLocaleString(op && op.locales, op && op.options);
	},
	
	$formatNumber(op, data, global) {
		return Number(data).toLocaleString(op && op.locales, op && op.options);
	}	
};

module.exports = compileTemplate;
