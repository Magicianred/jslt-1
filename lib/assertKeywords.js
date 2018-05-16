
module.exports = {
	enum(value, keyword) {
		return keyword.includes(value);
	},	
	
	// number
	multipleOf(value, keyword) {
		return typeof value != "number" || value % keyword == 0;
	},
		
	maximum(value, keyword) {
		return typeof value != "number" || value <= keyword;
	},

	exclusiveMaximum(value, keyword) {
		return typeof value != "number" || value < keyword;
	},
	
	minimum(value, keyword) {
		return typeof value != "number" || value >= keyword;
	},

	exclusiveMinimum(value, keyword) {
		return typeof value != "number" || value > keyword;
	},

	// string
	maxLength(value, keyword) {
		return typeof value != "string" || value.length <= keyword;
	},

	minLength(value, keyword) {
		return typeof value != "string" || value.length >= keyword;
	},
	
	// array
	maxItems(value, keyword) {
		return !(value instanceof Array) || value.length <= keyword;
	},

	minItems(value, keyword) {
		return !(value instanceof Array) || value.length >= keyword;
	},
	
	// object
	maxProperties(value, keyword) {
		return typeof value != "object" || value === null || Object.keys(value).length <= keyword;
	},

	minProperties(value, keyword) {
		return typeof value != "object" || value === null || Object.keys(value).length >= keyword;
	},

	required(value, keyword) {
		return typeof value != "object" || value === null || keyword.every(k => value.hasOwnProperty(k));
	}
};
