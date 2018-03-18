
class JSLT {
	constructor() {	
	}
	
	transform(data, template) {
		return JSLT.transform(data, template || this.template);
	}
	
	setTemplate(template) {
		this.template = template;
	}
	
	static transform(data, template) {
		errorStack = null;
		var res = compileTemplate(data, arguments.length == 2 ? template : this.template);
		if (errorStack) {
			var ex = errorStack.reverse().join(".");
			errorStack = null;
			throw ex;
		}
		return res;
	}
};

function compileTemplate(data, template) {
	function visit(value) {
		if (typeof value == "string") {
			var res = /^{{([^}]+)}}$/.exec(value);
			if (res) return resolveProp(res[1], data);
			return value.replace(/{{([^}]+)}}/g, (str, p1) => resolveProp(p1, data));
		}
		
		if (value instanceof Array)
			return value.map(visit);
		
		if (value instanceof Object && !(value instanceof RegExp)) {
			const entries = Object.entries(value);
			
			const ops = entries.filter(e => e[0].startsWith("$"));
			if (ops.length) return processUpdate(ops, data);
			
			const obj = {};
			for (var i = 0; i < entries.length; ++i) {
				const [key, value] = entries[i];
				obj[key] = visit(value);
				if (errorStack) return error(key);
			}
			return obj;
		}
		
		return value;
	}

	return visit(template);
}

function resolveProp(name, scope) {
	const name2 = name.replace(/\\(\.|\[|\])/g, (str, p1) => String.fromCodePoint(p1.codePointAt(0) + 0xE000));
	const parts = name2.split("."), hasSpecialChars = name != name2;
	
	for (var i = 0; i < parts.length; ++i) {
		var reRes = /^([^[]+)(?:\[([^\]]+)\])?$/.exec(parts[i]);
		var propName = reRes ? reRes[1] : parts[i];
		
		if (hasSpecialChars)
			propName = propName.replace(/[\uE000-\uF000]/g, str => String.fromCodePoint(str.codePointAt(0) - 0xE000));
		
		scope = scope[propName];
		if (!scope) return scope;
		
		if (reRes && reRes[2]) {
			const bracketName = hasSpecialChars ? reRes[2].replace(/[\uE000-\uF000]/g, s => String.fromCodePoint(s.codePointAt(0) - 0xE000)) : reRes[2];
			scope = scope[bracketName];
			if (!scope) return scope;
		}
	}
	return scope;
}

function processQuery(query, self, global) {
	function checkConds(entries, value) {
		return entries.every(([opName, opValue]) => {
			const opFunc = QueryOperators[opName];
			if (!opFunc) return error(`${opName} - Unknown query operator`);
			return opFunc(compileTemplate(global, opValue), value);
		});
	}
		
	const entries = Object.entries(query);
	const ops = entries.filter(e => e[0].startsWith("$"));
	if (ops.length) return checkConds(ops, self);
	return entries.every(([fieldName, fieldValue]) => checkConds(Object.entries(fieldValue), resolveProp(fieldName, self)));
}

function processUpdate(ops, data) {
	var payload = data;
	for (var i = 0; i < ops.length; ++i) {
		const [opName, opValue] = ops[i];
		const opFunc = UpdateOperators[opName] || UpdateOperators[opName.replace(/\d+$/, "")];
		if (!opFunc) return error(`${opName} - Unknown operator`);
		payload = opFunc(payload, opValue, data);
		if (errorStack) return error(opName);
	}
	return payload;
}

var errorStack = null;

function error(err) {
	if (errorStack) errorStack.push(err);
	else errorStack = [ err ];
}

const QueryOperators = {
	$eq(expected, actual) {
		return expected == actual;
	},
	
	$ne(expected, actual) {
		return expected != actual;
	},
	
	$gt(expected, actual) {
		return actual > expected;
	},
	
	$lt(expected, actual) {
		return actual < expected;
	},
	
	$gte(expected, actual) {
		return actual >= expected;
	},
	
	$lte(expected, actual) {
		return actual <= expected;
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
			var obj = args.find(obj => typeof obj.from == "object" && obj.from !== null ?
				processQuery(obj.from, input, global) :
				(obj.hasOwnProperty("default") || obj.from === input));
			return obj ? compileTemplate(global, obj.hasOwnProperty("default") ? obj.default : obj.to) : input;
		}
		
		if (!args) return error(" - Missing arguments");
		if (!(args.from instanceof Array)) return error(`[from] - Expected an array, but received ${typeof args.from}`);
		if (!(args.to instanceof Array)) return error(`[to] - Expected an array, but received ${typeof args.to}`);
					
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
		return (new Date(input)).toLocaleString(compileTemplate(global, args && args.locales), compileTemplate(global, args && args.options));
	},
	
	$formatNumber(input, args, global) {
		return Number(input).toLocaleString(compileTemplate(global, args && args.locales), compileTemplate(global, args && args.options));
	},
	
	$parseNumber(input, args, global) {
		input = String(input).replace(new RegExp(`\\s|[${(args && args.groupSymbol) || ","}]`, "g"), "");
		if (args && args.decimalSymbol) input.replace(new RegExp(`[${args.decimalSymbol}]`, "g"), ".");
		return Number(input);
	},
	
	$parseDate(input, args, global) {	
		var tzRes = /^([\-\+])?(\d\d):?(\d\d)$/.exec(compileTemplate(global, args.timezone));
		if (!tzRes) return error(`[timezone] - invalid timezone: ${args.timezone}`);
		var tzOffset = (Number(tzRes[2]) * 60 + Number(tzRes[3])) * (tzRes[1] == "-" ? -1 : 1);
		
		var format, day, month, year;
		if (format = /^dd[\/.\- ]?MM[\/.\- ]?yyyy$/.exec(args.format)) {
			[, day, month, year] = /^(\d{1,2})[\/.\- ]?(\d{1,2})[\/.\- ]?(\d{2,4})$/.exec(input) || [];
		} else if (format = /^MM[\/.\- ]?dd[\/.\- ]?yyyy$/.exec(args.format)) {
			[, month, day, year] = /^(\d{1,2})[\/.\- ]?(\d{1,2})[\/.\- ]?(\d{2,4})$/.exec(input) || [];
		} else if (format = /^yyyy[\/.\- ]?MM[\/.\- ]?dd$/.exec(args.format)) {
			[, year, month, day] = /^(\d{2,4})[\/.\- ]?(\d{1,2})[\/.\- ]?(\d{1,2})$/.exec(input) || [];
		} else {
			return error(`[format] - unsupported format: ${args.format}`);
		}

		day = Number(day), month = Number(month), year = Number(year);
		if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 0)
			return new Date(Date.UTC(year, month - 1, day) - (tzOffset * 60000));
		return error(`[input] - invalid date: ${input}`);
	},
	
	$replace(input, args, global) {
		if (!(typeof args.newSubstr == "string")) return error(`[newSubstr] - missing / invalid`);
		
		var firstArg;
		if (typeof args.substr == "string") firstArg = args.substr
		else if (args.regexp instanceof RegExp) firstArg = args.regexp;
		else if (typeof args.regexp == "string") {
			try { firstArg = new RegExp(args.regexp, "g");
			} catch(ex) { return error(`[regexp] - invalid expression`); }
		} else return error(`[substr/regexp] - missing or invalid`);
		
		return String(input).replace(firstArg, args.newSubstr);
	},
	
	// Array
	$map(input, args, global) {
		if (!(input instanceof Array)) return error(`[input] - Expected an array, but received ${typeof input}`);
		var newGlobal = Object.create(global), retVal = [];
		for (var i = 0; i < input.length; ++i) {
			newGlobal.this = input[i];
			retVal.push(compileTemplate(newGlobal, args));
			if (errorStack) return error(`[${i}]`);
		}
		return retVal;
	},

	$filter(input, args, global) {
		if (!(input instanceof Array)) return error(`[input] - Expected an array, but received ${typeof input}`);
		var newGlobal = Object.create(global), retVal = [];
		for (var i = 0; i < input.length; ++i) {
			newGlobal.this = input[i];
			if (processQuery(args, input[i], newGlobal)) retVal.push(input[i]);
			if (errorStack) return error(`[${i}]`);
		}
		return retVal;
	},
	
	$push(input, args, global) {
		if (!(input instanceof Array)) return error(`[input] - Expected an array, but received ${typeof input}`);
		return input.concat(compileTemplate(global, args));
	},
	
	$unshift(input, args, global) {
		if (!(input instanceof Array)) return error(`[input] - Expected an array, but received ${typeof input}`);
		return [ compileTemplate(global, args) ].concat(input);
	},
	
	$reverse(input, args, global) {
		if (!(input instanceof Array)) return error(`[input] - Expected an array, but received ${typeof input}`);
		return [].concat(input).reverse();
	},
	
	$find(input, args, global) {
		if (!(input instanceof Array)) return error(`[input] - Expected an array, but received ${typeof input}`);
		var newGlobal = Object.create(global);
		return input.find(item => {
			newGlobal.this = item;
			return processQuery(args, item, newGlobal);
		});
	},
	
	$sum(input, args, global) {
		if (!(input instanceof Array)) return error(`[input] - Expected an array, but received ${typeof input}`);
		return input.reduce((sum, cur) => sum + Number(cur), 0);
	}
};

module.exports = JSLT;
