
var globalData = {
	stringField : "testString",
	numberField : 12,
	falseField : false,
	trueField : true,
	simpleArray : [ "aaa", "bbb", "ccc" ],
	currencyName : "EUR",
	locale : "en-US",
	timezone : "02:00",
	array : [
		{ stringField : "array1", numberField : 5 },
		{ stringField : "array2", numberField : 2 },
		{ stringField : "array3", numberField : 15 }	
	],
	obj : {
		stringField : "Nested testString",
		numberField : 1234,
		"first.last": "value2",
	},
	"first.last" : "value",
	"prop[withBracket" : "value2",
	approver : "Bob",
	complexArray : [
		{ from : "Alice", status : "approved" },
		{ from : "Bob", status : "pending" },
		{ from : "Charlie", status : "pending" }
	]
};

function test(name, data, template, expected) {
	if (arguments.length == 3) [ data, template, expected ] = [ globalData, data, template ];
	try {
		var res = jslt.transform(data, template, transformProps);
	} catch(ex) {
		res = ex;
	}
	var success = JSON.stringify(res) == JSON.stringify(expected);
	success ? ++passed : ++failed;
	console.log(`${name.padEnd(45)} ${success ? "Passed" : "FAILED  " + JSON.stringify(res)}`);
}

var passed = 0, failed = 0, transformProps;
var jslt = require("./jslt.js");

test("Static string", "aaa", "aaa");
test("Static number", 1122, 1122);
test("Static true", true, true);
test("Static false", false, false);

test("Identity transform - string", "{{stringField}}", "testString");
test("Identity transform - number", "{{numberField}}", 12);
test("Identity transform - true", "{{falseField}}", false);
test("Identity transform - false", "{{trueField}}", true);
test("Identity transform - undefined", "{{stringField1}}", undefined);

test("Transform strings", "{{stringField}} {{stringField}}", "testString testString");
test("Nested transform", "{{obj.stringField}}", "Nested testString");
test("Array transform", "{{array[1].numberField}}", 2);
test("Dot transform", "{{first\\.last}}", "value");
test("Dot + nested transform", "{{obj.first\\.last}}", "value2");
test("Dot transform", "{{prop\\[withBracket}}", "value2");
test("Bracket transform", "{{obj[stringField]}}", "Nested testString");
test("Empty transform", 2, "{{}}", 2);

test("type - number - pass", { prop : 3 }, { p : "{{prop:number}}" }, { p : 3 });
test("type - number/string - pass", { prop : "3" }, { p : "{{prop:number}}" }, { p : 3 });
test("type - number/string - fail", { prop : "aa" }, { p : "{{prop:number}}" }, "p.{{prop}} - Expected number, but received string");
test("type - number - fail", { prop : "test" }, { p : "{{prop:number}}" }, "p.{{prop}} - Expected number, but received string");
test("type - boolean - pass", { prop : true }, { p : "{{prop:boolean}}" }, { p : true });
test("type - boolean - fail", { prop : 4 }, { p : "{{prop:boolean}}" }, "p.{{prop}} - Expected boolean, but received number");
test("type - string - pass", { prop : "aa" }, { p : "{{prop:string}}" }, { p : "aa" });
test("type - string/number - pass", { prop : 4 }, { p : "{{prop:string}}" }, { p : "4" });
test("type - string - fail", { prop : true }, { p : "{{prop:string}}" }, "p.{{prop}} - Expected string, but received boolean");
test("type - array - pass", { prop : [] }, { p : "{{prop:array}}" }, { p : [] });
test("type - array - fail", { prop : false }, { p : "{{prop:array}}" }, "p.{{prop}} - Expected array, but received boolean");
test("type - object - pass", { prop : {} }, { p : "{{prop:object}}" }, { p : {} });
test("type - object - fail", { prop : "zz" }, { p : "{{prop:object}}" }, "p.{{prop}} - Expected object, but received string");
test("type - object/null - fail", { prop : null }, { p : "{{prop:object}}" }, "p.{{prop}} - Missing required value");
test("type - date - pass", { prop : "2015-07-15T22:00:00.000Z" }, { p : "{{prop:date}}" }, { p : "2015-07-15T22:00:00.000Z" });
test("type - date obj - pass", { prop : new Date("2015-07-15T22:00:00.000Z") }, { p : "{{prop:date}}" }, { p : "2015-07-15T22:00:00.000Z" });
test("type - date - fail", { prop : "zz" }, { p : "{{prop:date}}" }, "p.{{prop}} - Expected date, but received string");
test("type - required/undefined - fail", { prop1 : "test" }, { p : "{{prop:number}}" }, "p.{{prop}} - Missing required value");
test("type - required/null - fail", { prop : null }, { p : "{{prop:number}}" }, "p.{{prop}} - Missing required value");
test("type - optional/undefined - pass", { prop1 : "test" }, { p : "{{prop:?number}}", p2 : 3 }, { p2 : 3 });
test("type - optional/null - pass", { prop : null }, { p : "{{prop:?number}}", p2 : 3 }, { p : null, p2 : 3 });
test("type - in-string - fail", { prop : "aa" }, { p : "test {{prop:number}}" }, "p.{{prop}} - Expected number, but received string");

test("$fetch", { $fetch : "{{stringField}}" }, "testString");
test("$fetch cascaded", { $fetch : "{{obj}}", $fetch2 : "{{stringField}}" }, "Nested testString");

test("$translate", { $fetch : "{{falseField}}", $translate : [ { from : true, to : "Yes" }, { from : false,  to : "No" } ] }, "No");
test("$translate - old syntax", { $fetch : "{{falseField}}", $translate : { from : [ true, false ], to : [ "Yes", "No" ] } }, "No");
test("$translate - undefined", { $fetch : undefined, $translate : [ { to : "Yes" } ] }, "Yes");
test("$translate - condition", { $fetch : 5, $translate : [ { from : { $lt : 3 }, to : "Yes" }, { from : { $gte : 3 }, to : "No" } ] }, "No");
test("$translate - condition obj", { $fetch : "{{obj}}", $translate : [ { from : { numberField : { $gt : 3 } }, to : "Yes" } ] }, "Yes");
test("$translate - condition obj - transform", { $fetch : "{{obj}}", $translate : [ { from : { numberField : { $gt : "{{numberField}}" } }, to : "Yes" } ] }, "Yes");
test("$translate - transform", { $fetch : "{{trueField}}", $translate : [ { from : true, to : "{{stringField}}" }, { from : false, to : "No" } ] }, "testString");
test("$translate - default", "test", { $translate : [ { from : "not test", to : "fail" },  { default : "Yes" } ] }, "Yes");

test("$join", { $join : [ "Hello ", "world" ] }, "Hello world");
test("$join - transform", { $join : [ "Hello ", "{{stringField}}" ] }, "Hello testString");
test("$join (method)", { $fetch: [ "Hello", "world" ], $join : "+" }, "Hello+world");
test("$join (method) - transform", { $fetch: [ "Hello", "world" ], $join : "{{numberField}}" }, "Hello12world");

test("$concat", { $fetch : [ "Hello", "world" ], $concat : [ "world2" ] }, [ "Hello", "world", "world2" ]);
test("$concat", { $concat : [ [ "Hello", "world" ], [ "world2" ] ] }, [ "Hello", "world", "world2" ]);
test("$concat", { $fetch : [ "Hello", "world" ], $concat : [ "{{stringField}}" ] }, [ "Hello", "world", "testString" ]);

test("$push", [ "aaa", "bbb", "ccc" ], { $push : "ddd" }, [ "aaa", "bbb", "ccc", "ddd" ]);
test("$push & transform", { $fetch : "{{simpleArray}}", $push : "{{stringField}}" }, [ "aaa", "bbb", "ccc", "testString" ]);
test("$unshift", [ "aaa", "bbb", "ccc" ], { $unshift : "ddd" }, [ "ddd", "aaa", "bbb", "ccc" ]);
test("$unshift - transform", { $fetch : "{{simpleArray}}", $unshift : "{{stringField}}" }, [ "testString", "aaa", "bbb", "ccc" ]);

test("$map", { $fetch : "{{array}}", $map : "{{this.stringField}}" }, [ "array1", "array2", "array3" ]);
test("$map - object", { $fetch : "{{array}}", $map : { prop : "{{this.stringField}}" } }, [ { prop : "array1" }, { prop : "array2" }, { prop : "array3" } ]);
test("$map - global - this", { $fetch : "{{array}}", $map : "{{this.stringField}} {{stringField}}" }, [ "array1 testString", "array2 testString", "array3 testString" ]);
test("$map - $sum", { $fetch : "{{array}}", $map : "{{this.numberField}}", $sum : {} }, 22);

test("$filter - eq", [ 1, 2, 3, 4 ], { $filter : { $eq : 3 } }, [ 3 ]);
test("$filter - ne", [ 1, 2, 3, 4 ], { $filter : { $ne : 3 } }, [ 1, 2, 4 ]);
test("$filter - gt", [ 1, 2, 3, 4 ], { $filter : { $gt : 3 } }, [ 4 ]);
test("$filter - lt", [ 1, 2, 3, 4 ], { $filter : { $lt : 3 } }, [ 1, 2 ]);
test("$filter - gte", [ 1, 2, 3, 4 ], { $filter : { $gte : 3 } }, [ 3, 4 ]);
test("$filter - lte", [ 1, 2, 3, 4 ], { $filter : { $lte : 3 } }, [ 1, 2, 3 ]);
test("$filter - in", [ 1, 2, 3, 4 ], { $filter : { $in : [ 2, 3 ] } }, [ 2, 3 ]);
test("$filter - nin", [ 1, 2, 3, 4 ], { $filter : { $nin : [ 2, 3 ] } }, [ 1, 4 ]);
test("$filter - regex", [ "aaa", "bbb", "ccc" ], { $filter : { $regex : /^aaa$/ } }, [ "aaa" ]);
test("$filter - regex string", [ "aaa", "bbb", "ccc" ], { $filter : { $regex : "^(aaa|bbb)$" } }, [ "aaa", "bbb" ]);
test("$filter - object", { $fetch : "{{array}}", $filter : { numberField : { $eq : 2 } } }, [{ stringField : "array2", numberField : 2 }]);
test("$filter - object - multi", { $fetch : "{{array}}", $filter : { numberField : { $eq : 2 }, stringField : { $eq : "array2" } } }, [{ stringField : "array2", numberField : 2 }]);
test("$filter - object - transform", { $fetch : "{{array}}", $filter : { numberField : { $gt : "{{numberField}}" } } }, [{ stringField : "array3", numberField : 15 }]);
test("$filter - type", [ 1, "2", true, {} ], { $filter : { $type : "number" } }, [ 1 ]);
test("$filter - type - array", [ 1, "2", true, {} ], { $filter : { $type : [ "number", "string" ] } }, [ 1, "2" ]);
test("$filter - type", [ 1, [], {} ], { $filter : { $type : "array" } }, [ [] ]);

test("$reverse", [ "aaa", "bbb", "ccc" ], { $reverse : {} }, [ "ccc", "bbb", "aaa" ]);
test("$reverse - map - transform", { $fetch : "{{array}}", $reverse : {}, $map : "{{this.stringField}}" }, [ "array3", "array2", "array1" ]);

test("$find - simple", [ 1, 2, 3, 4 ], { $find : { $eq : 3 } }, 3);
test("$find - multi", [ 1, 2, 3, 4 ], { $find : { $gt : 2 } }, 3);

test("$parseNumber", "123.0", { $parseNumber : {} }, 123);
test("$parseNumber groupSymbol", "123.0", { $parseNumber : { groupSymbol : "." } }, 1230);
test("$parseNumber commas", "1,230", { $parseNumber : {} }, 1230);

test("$formatNumber", 1234, { $formatNumber : { options : { useGrouping : false }} }, "1234");
test("$formatNumber - transform", { $fetch : 1234, $formatNumber : { options : { style : "currency", currencyDisplay: "name", currency : "{{currencyName}}" }} }, "1,234.00 EUR");
test("$formatNumber - exception", 1234, { $formatNumber : { options : { style : "currency", currencyDisplay: "name", currency : "USD1" }} }, "$formatNumber.[exception] - Invalid currency code: USD1");

test("$formatDate", Date.UTC(2017, 4, 20, 5, 0, 0), { $formatDate: { locales : "en-US", options : { timeZone : "UTC" } } }, "5/20/2017, 5:00:00 AM");
test("$formatDate", Date.UTC(2017, 4, 20, 5, 0, 0), { $formatDate: { locales : "en-US", options : { timeZone : "UTC", month : "short", day : "numeric", weekday : "long" } } }, "Saturday, May 20");
test("$formatDate - transform", { $fetch : Date.UTC(2017, 4, 20, 5, 0, 0), $formatDate: { locales : "{{locale}}", options : { timeZone : "UTC" } } }, "5/20/2017, 5:00:00 AM");

test("$parseDate", "16-07-2015", { $parseDate : { format : "dd-MM-yyyy", timezone: "02:00" } }, "2015-07-15T22:00:00.000Z");
test("$parseDate", "07-16-2015", { $parseDate : { format : "MM/dd/yyyy", timezone: "-0430" } }, "2015-07-16T04:30:00.000Z");
test("$parseDate", "2015-07-16", { $parseDate : { format : "yyyy.MM.dd", timezone: "+0000" } }, "2015-07-16T00:00:00.000Z");
test("$parseDate", "20150716", { $parseDate : { format : "yyyyMMdd", timezone: "0000" } }, "2015-07-16T00:00:00.000Z");
test("$parseDate", { $fetch : "07-16-2015", $parseDate : { format : "MM/dd/yyyy", timezone: "{{timezone}}" } }, "2015-07-15T22:00:00.000Z");

test("$replace substr", "test str", { $replace : { substr : "str", newSubstr : "new" } }, "test new");
test("$replace regexp", "test 123", { $replace : { regexp : /\d+/, newSubstr : "" } }, "test ");
test("$replace regexp string", "test 123", { $replace : { regexp : "\\d+", newSubstr : "" } }, "test ");
test("$replace", "test str", { $replace : null }, "$replace.[arguments] - missing / invalid");

test("$catch - no error", { prop : "test" }, { $fetch : "{{prop}}", $catch : {} }, "test");
test("$catch - error", "test", { $map : {}, $catch : "error" }, "error");
test("$catch - error props", "test", { $map : {}, $catch : "{{stack}} - {{message}}" }, "[input] - Expected an array, but received string");
test("$catch - error & skip", "test", { $map : {}, $filter : {}, $catch : "error" }, "error");
test("$catch - multi catch1", { prop : "test" }, { $fetch : "{{prop}}", $catch : "error1", $map : {}, $catch2 : "error2" }, "error2");
test("$catch - multi catch2", { prop : "test" }, { $fetch : "{{prop}}", $map : {}, $catch : "error1", $catch2 : "error2" }, "error1");
test("$catch - nested", { prop : [ 1 ] }, { prop1 : { $fetch : "{{prop}}", $map : { $map : {} }, $catch : "error" } }, { prop1 : "error" });
test("$catch - array", [ [], 2, [] ], { $map : { p : { $fetch : "{{this}}", $map : "a", $catch : "not array" } } }, [ { p : [] }, { p : "not array" }, { p : [] }]);
test("$catch - catch with error", "test", { $map : {}, $catch : { $map : {} }, $catch2 : "catch2" }, "catch2");

test("function", { prop : "aa" }, { p : data => data.prop }, { p : "aa" });
test("$function", { prop : "aa"}, { p : { $fetch : "abc", $function : input => input.toUpperCase() }}, { p : "ABC" });
test("$function", { prop : [ "a", "b" ] }, { p : { $fetch : "{{prop}}", $map : { $function : (input, global) => global.this.toUpperCase() } } }, { p : [ "A", "B" ] });

test("$assert - multipleOf - pass", 4, { $assert : { multipleOf : 2 } }, 4);
test("$assert - multipleOf - fail", 4, { $assert : { multipleOf : 3 } }, "$assert.[input] - multipleOf");
test("$assert - enum - pass", "test", { $assert : { enum : [ "test" ] } }, "test");
test("$assert - enum - fail", "test", { $assert : { enum : [ "test1" ] } }, "$assert.[input] - enum");
test("$assert - maximum - pass", 3, { $assert : { maximum : 3 } }, 3);
test("$assert - maximum - fail", 3, { $assert : { maximum : 2 } }, "$assert.[input] - maximum");
test("$assert - exclusiveMaximum - pass", 3, { $assert : { exclusiveMaximum : 4 } }, 3);
test("$assert - exclusiveMaximum - fail", 3, { $assert : { exclusiveMaximum : 3 } }, "$assert.[input] - exclusiveMaximum");
test("$assert - minimum - pass", 3, { $assert : { minimum : 2 } }, 3);
test("$assert - minimum - fail", 3, { $assert : { minimum : 4 } }, "$assert.[input] - minimum");
test("$assert - exclusiveMinimum - pass", 3, { $assert : { exclusiveMinimum : 2 } }, 3);
test("$assert - exclusiveMinimum - fail", 3, { $assert : { exclusiveMinimum : 3 } }, "$assert.[input] - exclusiveMinimum");
test("$assert - maxLength - pass", "test", { $assert : { maxLength : 10 } }, "test");
test("$assert - maxLength - fail", "test", { $assert : { maxLength : 3 } }, "$assert.[input] - maxLength");
test("$assert - minLength - pass", "test", { $assert : { minLength : 3 } }, "test");
test("$assert - minLength - fail", "test", { $assert : { minLength : 10 } }, "$assert.[input] - minLength");
test("$assert - maxItems - pass", [ 1, 2 ], { $assert : { maxItems : 3 } }, [ 1, 2 ]);
test("$assert - maxItems - fail", [ 1, 2 ], { $assert : { maxItems : 1 } }, "$assert.[input] - maxItems");
test("$assert - minItems - pass", [ 1, 2 ], { $assert : { minItems : 1 } }, [ 1, 2 ]);
test("$assert - minItems - fail", [ 1, 2 ], { $assert : { minItems : 3 } }, "$assert.[input] - minItems");
test("$assert - maxProperties - pass", { a : 3, b : 4 }, { $assert : { maxProperties : 4 } }, { a : 3, b : 4 });
test("$assert - maxProperties - fail", { a : 3, b : 4 }, { $assert : { maxProperties : 1 } }, "$assert.[input] - maxProperties");
test("$assert - minProperties - pass", { a : 3, b : 4 }, { $assert : { minProperties : 1 } }, { a : 3, b : 4 });
test("$assert - minProperties - fail", { a : 3, b : 4 }, { $assert : { minProperties : 4 } }, "$assert.[input] - minProperties");
test("$assert - required - pass", { a : 3, b : 4 }, { $assert : { required : [ "a" ] } }, { a : 3, b : 4 });
test("$assert - required - fail", { a : 3, b : 4 }, { $assert : { required : [ "c" ] } }, "$assert.[input] - required");

transformProps = { disableAssertions : true };
test("disableAssertions", 4, { $assert : { maximum : 3 } }, 4);

transformProps = { disableFunctions : true };
test("disableFunctions - function", { prop : "aa" }, { p : data => data.prop }, "p.[function] - disableFunctions is enabled");
test("disableFunctions - $function", { prop : "aa" }, { p : { $function : data => data.prop } }, "p.$function.[function] - disableFunctions is enabled");

transformProps = { disableTypeCoercion : true };
test("disableTypeCoercion - number/string", { prop : 3 }, { p : "{{prop:string}}" }, "p.{{prop}} - Expected string, but received number");
test("disableTypeCoercion - string/number", { prop : "3" }, { p : "{{prop:number}}" }, "p.{{prop}} - Expected number, but received string");

transformProps = { continueOnError : true };
test("continueOnError", { p1 : "{{prop1:number}}", p2 : "{{prop1:number}}" }, {
	result : { p1 : "[JSLT ERROR]", p2 : "[JSLT ERROR]" },
	errors : [
		{ message : "Missing required value", stack : [ "{{prop1}}" ], path : [ "p1" ] },
		{ message : "Missing required value", stack : [ "{{prop1}}" ], path : [ "p2" ] }
	]
});

test("continueOnError - array", { a : [ 1,"z",3 ]}, { p : { $fetch : "{{a}}", $map : { b : "{{this:number}}" } } }, {
	result : { p : [ { b : 1 }, { b : "[JSLT ERROR]" },{ b : 3 } ] },
	errors : [ { message : "Expected number, but received string", stack : [ "{{this}}" ], path : [ "p", 1, "b" ] } ]
});

test("continueOnError - array & catch1", { a : [ 1,"z",3 ]}, { p : { $fetch : "{{a}}", $map : { $fetch : "{{this:number}}", $catch : "err" } } }, { p : [1, "err", 3] });
test("continueOnError - array & catch2", { a : [ 1,"z",3 ]}, { p : { $fetch : "{{a}}", $map : { b : "{{this:number}}" }, $catch : "err" } }, { p : "err" });

transformProps = { locales : "ko-KR" };
test("$localize - exact", { label : { $localize : { "ko-KR" : "Korean KR" } } }, { label : "Korean KR" });
test("$localize - lang", { label : { $localize : { "ko" : "Korean" } } }, { label : "Korean" });
test("$localize - none", { label : { $localize : { "en" : "English" } } }, {});
//test("$formatDate - locales", Date.UTC(2017, 4, 20, 5, 0, 0), { $formatDate: {} }, "2017-5-20 08:00:00");

transformProps = { locales : [ "ko-KR", "en-US" ] };
test("$localize - multi - exact", { label : { $localize : { "en-US" : "English US", "ko-KR" : "Korean KR" } } }, { label : "Korean KR" });
test("$localize - multi - case", { label : { $localize : { "en-US" : "English US", "ko-kr" : "Korean KR" } } }, { label : "Korean KR" });
test("$localize - multi - lang", { label : { $localize : { "en-US" : "English US", "ko" : "Korean" } } }, { label : "Korean" });
test("$localize - multi - fallback - exact", { label : { $localize : { "en-US" : "English US" } } }, { label : "English US" });
test("$localize - multi - fallback - lang", { label : { $localize : { "en" : "English" } } }, { label : "English" });
//test("$formatDate - multi - locales", Date.UTC(2017, 4, 20, 5, 0, 0), { $formatDate: {} }, "2017-5-20 08:00:00");

test("$blacklist", { a : 3, b : 2 }, { $blacklist : [ "a", "c" ] }, { b : 2 });
test("$blacklist", { a : 3 }, { $blacklist : [ "a" ] }, {});
test("$blacklist", 3, { $blacklist : [ "a", "c" ] }, 3);
test("$blacklist", null, { $blacklist : [ "a", "c" ] }, null);
test("$blacklist", null, { $blacklist : 3 }, "$blacklist.[arguments] - missing / invalid");

test("$whitelist", { a : 3, b : 2 }, { $whitelist : [ "a", "c" ] }, { a : 3 });
test("$whitelist", { a : 3 }, { $whitelist : [ "b" ] }, {});
test("$whitelist", 3, { $whitelist : [ "a", "c" ] }, 3);
test("$whitelist", null, { $whitelist : [ "a", "c" ] }, null);
test("$whitelist", null, { $whitelist : 3 }, "$whitelist.[arguments] - missing / invalid");

console.log(`\nPassed: ${passed}, Failed: ${failed}`);
