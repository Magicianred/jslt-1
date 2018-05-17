
class JSLT {
	constructor() {	
	}
	
	transform(data, template, props) {
		return JSLT.transform(data, template || this.template, props || this.props || {});
	}
	
	setTemplate(template) {
		this.template = template;
	}
	
	setProps(props) {
		this.props = props;
	}
	
	static transform(data, template, props = {}) {
		lastError = null;
		transformProps = props;
		var res = compileTemplate(data, template);
		if (lastError) {
			var ex = lastError.stack.reverse().join(".") + " - " + lastError.message;
			lastError = null;
			throw ex;
		}
		transformProps = null;
		return res;
	}
};

var lastError = null, transformProps;

function compileTemplate(data, template) {
	function visit(value) {
		if (typeof value == "string") {
			var res = /^{{([^}]*)}}$/.exec(value);
			if (res) return resolveProp(res[1], data);
			return value.replace(/{{([^}]+)}}/g, (str, p1) => resolveProp(p1, data));
		}
		
		if (value instanceof Array)
			return value.map(visit);
		
		if (value instanceof Object && !(value instanceof RegExp)) {
			if (typeof value == "function") {
				if (transformProps.disableFunctions) return error("[function]", "disableFunctions is enabled");
				try { return value(data);
				} catch(ex) { return error("[function]", ex.message); }
			}
			
			const entries = Object.entries(value);
			const ops = entries.filter(e => e[0].startsWith("$"));
			if (ops.length) return processUpdate(ops, data);
			
			const obj = {};
			for (var i = 0; i < entries.length; ++i) {
				const [key, value] = entries[i];
				obj[key] = visit(value);
				if (lastError) return error(key);
			}
			return obj;
		}
				
		return value;
	}

	return visit(template);
}

function resolveProp(name, scope) {
	if (scope === undefined || scope === null || !name) return scope;
	
	const [, nameWithoutType, maybe, type ] = /(.*?)(?::(\?)?(string|number|boolean|array|object|date))?$/.exec(name);
	const nameWithSpecialChars = nameWithoutType.replace(/\\(\.|\[|\])/g, (str, p1) => String.fromCodePoint(p1.codePointAt(0) + 0xE000));
	const parts = nameWithSpecialChars.split("."), hasSpecialChars = name != nameWithSpecialChars;
	
	for (var i = 0; i < parts.length; ++i) {
		var reRes = /^([^[]+)(?:\[([^\]]+)\])?$/.exec(parts[i]);
		var propName = reRes ? reRes[1] : parts[i];
		
		if (hasSpecialChars)
			propName = propName.replace(/[\uE000-\uF000]/g, str => String.fromCodePoint(str.codePointAt(0) - 0xE000));
		
		scope = scope[propName];
		if (!scope) break;
		
		if (reRes && reRes[2]) {
			const bracketName = hasSpecialChars ? reRes[2].replace(/[\uE000-\uF000]/g, s => String.fromCodePoint(s.codePointAt(0) - 0xE000)) : reRes[2];
			scope = scope[bracketName];
			if (!scope) return scope;
		}
	}
	
	if (type) {
		if (scope === undefined) return maybe ? undefined : error(`{{${nameWithoutType}}}`, "Missing required value");
		return verifyType(nameWithoutType, type, scope);
	}
	return scope;
}

function processQuery(query, self, global) {
	function checkConds(entries, value) {
		return entries.every(([opName, opValue]) => {
			const opFunc = QueryOperators[opName];
			if (!opFunc) return error(opName, "Unknown query operator");
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
		
		if (opFunc) payload = opFunc(payload, opValue, data);
		else error(opName, "Unknown operator");
		
		if (lastError) {
			for (++i; i < ops.length; ++i) {
				if (ops[i][0].replace(/\d+$/, "") == "$catch") {
					var exception = { message : lastError.message, stack : lastError.stack.reverse().join(".") };
					lastError = null;
					payload = compileTemplate(exception, ops[i][1]);
					if (lastError) continue;
					else break;
				}
			}
			if (lastError) return error(opName);
		}
	}
	return payload;
}

function error(prop, message) {
	if (lastError) lastError.stack.push(prop);
	else lastError = { stack : [ prop ], message };
}

function verifyType(propName, type, value) {
	var actualType = typeof value;
	if (actualType === "object") {
		if (value === null) actualType = "null";
		else if (value instanceof Array) actualType = "array";
		else if (value instanceof Date) actualType = "date";
	}

	if (type == actualType) return value;
	if (!transformProps.disableTypeCoercion) {
		if (type == "string" && actualType == "number") return String(value);
		if (type == "number" && actualType == "string" && !isNaN(Number(value))) return Number(value);
	}
	if (type == "date" && actualType == "string") {
		let date = new Date(value);
		if (date.toJSON() === value) return date;
	}
	
	error(`{{${propName}}}`, `Expected ${type}, but received ${actualType}`);
	return null;
}

const UpdateOperators = {
	$fetch(input, args, global) {
		return compileTemplate(input, args);
	},
	
	$catch(input, args, global) {
		return input;
	},
	
	$translate(input, args, global) {
		if (args instanceof Array) {
			var obj = args.find(obj => typeof obj.from == "object" && obj.from !== null ?
				processQuery(obj.from, input, global) :
				(obj.hasOwnProperty("default") || obj.from === input));
			return obj ? compileTemplate(global, obj.hasOwnProperty("default") ? obj.default : obj.to) : input;
		}
		
		if (!args) return error("[args]", "Missing arguments");
		if (!(args.from instanceof Array)) return error("[from]", `Expected an array, but received ${typeof args.from}`);
		if (!(args.to instanceof Array)) return error("[to]", `Expected an array, but received ${typeof args.to}`);
		
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
		if (!tzRes) return error("[timezone]", `invalid timezone: ${args.timezone}`);
		var tzOffset = (Number(tzRes[2]) * 60 + Number(tzRes[3])) * (tzRes[1] == "-" ? -1 : 1);
		
		var format, day, month, year;
		if (format = /^dd[\/.\- ]?MM[\/.\- ]?yyyy$/.exec(args.format)) {
			[, day, month, year] = /^(\d{1,2})[\/.\- ]?(\d{1,2})[\/.\- ]?(\d{2,4})$/.exec(input) || [];
		} else if (format = /^MM[\/.\- ]?dd[\/.\- ]?yyyy$/.exec(args.format)) {
			[, month, day, year] = /^(\d{1,2})[\/.\- ]?(\d{1,2})[\/.\- ]?(\d{2,4})$/.exec(input) || [];
		} else if (format = /^yyyy[\/.\- ]?MM[\/.\- ]?dd$/.exec(args.format)) {
			[, year, month, day] = /^(\d{2,4})[\/.\- ]?(\d{1,2})[\/.\- ]?(\d{1,2})$/.exec(input) || [];
		} else {
			return error("[format]", `unsupported format: ${args.format}`);
		}

		day = Number(day), month = Number(month), year = Number(year);
		if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 0)
			return new Date(Date.UTC(year, month - 1, day) - (tzOffset * 60000));
		return error("[input]", `invalid date: ${input}`);
	},
	
	$replace(input, args, global) {
		if (!(typeof args.newSubstr == "string")) return error("[newSubstr]", "missing / invalid");
		
		var firstArg;
		if (typeof args.substr == "string") firstArg = args.substr
		else if (args.regexp instanceof RegExp) firstArg = args.regexp;
		else if (typeof args.regexp == "string") {
			try { firstArg = new RegExp(args.regexp, "g");
			} catch(ex) { return error("[regexp]", "invalid expression"); }
		} else return error("[substr/regexp]", "missing or invalid");
		
		return String(input).replace(firstArg, args.newSubstr);
	},

	$assert(input, args, global) {
		if (transformProps.disableAssertions) return input;
		
		var keywords = Object.keys(args);
		for (var i = 0; i < keywords.length; ++i) {
			var keyword = keywords[i];
			keywordFunc = AssertKeywords[keyword];
			if (!keywordFunc) return error(`[${keyword}]`, "Unknown keyword");
			if (!keywordFunc(input, args[keyword]))	return error("[input]",  keyword);
		}
		return input;
	},
	
	// Array
	$map(input, args, global) {
		if (!(input instanceof Array)) return error("[input]", `Expected an array, but received ${typeof input}`);
		var newGlobal = Object.create(global), retVal = [];
		for (var i = 0; i < input.length; ++i) {
			newGlobal.this = input[i];
			retVal.push(compileTemplate(newGlobal, args));
			if (lastError) return error(`[${i}]`);
		}
		return retVal;
	},

	$filter(input, args, global) {
		if (!(input instanceof Array)) return error("[input]", `Expected an array, but received ${typeof input}`);
		var newGlobal = Object.create(global), retVal = [];
		for (var i = 0; i < input.length; ++i) {
			newGlobal.this = input[i];
			if (processQuery(args, input[i], newGlobal)) retVal.push(input[i]);
			if (lastError) return error(`[${i}]`);
		}
		return retVal;
	},
	
	$push(input, args, global) {
		if (!(input instanceof Array)) return error("[input]", `Expected an array, but received ${typeof input}`);
		return input.concat(compileTemplate(global, args));
	},
	
	$unshift(input, args, global) {
		if (!(input instanceof Array)) return error("[input]", `Expected an array, but received ${typeof input}`);
		return [ compileTemplate(global, args) ].concat(input);
	},
	
	$reverse(input, args, global) {
		if (!(input instanceof Array)) return error("[input]", `Expected an array, but received ${typeof input}`);
		return [].concat(input).reverse();
	},
	
	$find(input, args, global) {
		if (!(input instanceof Array)) return error("[input]", `Expected an array, but received ${typeof input}`);
		var newGlobal = Object.create(global);
		return input.find(item => {
			newGlobal.this = item;
			return processQuery(args, item, newGlobal);
		});
	},
	
	$sum(input, args, global) {
		if (!(input instanceof Array)) return error("[input]", `Expected an array, but received ${typeof input}`);
		return input.reduce((sum, cur) => sum + Number(cur), 0);
	}
};

const QueryOperators = require("./lib/queryOperators.js");
const AssertKeywords = require("./lib/assertKeywords.js");

module.exports = JSLT;
