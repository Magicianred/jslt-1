
module.exports = {
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
	},
	
	$type(expected, actual) {
		var type = typeof actual;
		if (type === "object") {
			if (actual === null) type = null;
			else if (actual instanceof Array) type = "array";
		}
		return expected instanceof Array ? expected.includes(type) : type == expected ;
	}
};
