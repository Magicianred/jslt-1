
class JSLT {
	constructor() {	
	}
	
	transform(data, template) {
		return compileTemplate(data, template || this.template);
	}
	
	setTemplate(template) {
		this.template = template;
	}
	
	static transform(data, template) {
		return compileTemplate(data, arguments.length == 2 ? template : this.template);
	}
};

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
		return opFunc(payload, opValue, data);
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
	$fetch(input, args, global) {
		return compileTemplate(input, args);
	},
	
	$translate(input, args, global) {
		if (args instanceof Array) {
			var obj = args.find(obj => obj.from == input);
			return obj ? compileTemplate(global, obj.to) : input;
		}
		
		if (!(args && args.from instanceof Array && args.to instanceof Array))
			throw "$translate: invalid from/to argument";
		
		var idx = args.from.indexOf(input);
		return idx != -1 ? compileTemplate(global, args.to[idx]) : input;
	},
	
	$join(input, args, global) {
		return args.map(item => compileTemplate(global, item)).join("");
	},

	$concat(input, args, global) {
		return [].concat(...args.map(item => compileTemplate(global, item)));
	},
	
	$formatDate(input, args, global) {
		return (new Date(input)).toLocaleString(args && args.locales, args && args.options);
	},
	
	$formatNumber(input, args, global) {
		return Number(input).toLocaleString(args && args.locales, args && args.options);
	},
	
	$parseNumber(input, args, global) {
		input = String(input).replace(new RegExp(`\\s|[${(args && args.groupSymbol) || ","}]`, "g"), "");
		if (args && args.decimalSymbol) input.replace(new RegExp(`[${args.decimalSymbol}]`, "g"), ".");
		return Number(input);
	},
	
	// Array
	$map(input, args, global) {
		if (!(input instanceof Array)) throw "$map: input is not an array";
		return input.map(item => compileTemplate(item, args));
	},

	$filter(input, args, global) {
		if (!(input instanceof Array)) throw "$filter: input is not an array";
		return input.filter(item => processQuery(args, item));
	},
	
	$push(input, args, global) {
		if (!(input instanceof Array)) throw "$push: input is not an array";
		return input.concat(compileTemplate(global, args));
	},
	
	$unshift(input, args, global) {
		if (!(input instanceof Array)) throw "$unshift: input is not an array";
		return [ compileTemplate(global, args) ].concat(input);
	},
	
	$reverse(input, args, global) {
		if (!(input instanceof Array)) throw "$reverse: input is not an array";
		return [].concat(input).reverse();
	},

	$sum(input, args, global) {
		if (!(input instanceof Array)) throw "$sum: input is not an array";
		return input.reduce((sum, cur) => sum + Number(cur), 0);
	}
};

module.exports = JSLT;
