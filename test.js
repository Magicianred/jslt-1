
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
	var res = jslt.transform(data, template);
	var success = JSON.stringify(res) == JSON.stringify(expected);
	success ? ++passed : ++failed;
	console.log(`${name.padEnd(40)} ${success ? "Passed" : "FAILED  " + JSON.stringify(res)}`);
}

var passed = 0, failed = 0;
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
test("$concat", { $concat : [ [ "Hello", "world" ], [ "world2" ] ] }, [ "Hello", "world", "world2" ]);

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

test("$formatDate", Date.UTC(2017, 4, 20, 5, 0, 0), { $formatDate: { locales : "en-US" } }, "5/20/2017, 8:00:00 AM");
test("$formatDate", Date.UTC(2017, 4, 20, 5, 0, 0), { $formatDate: { locales : "en-US", options : { month : "short", day : "numeric", weekday : "long" } } }, "Saturday, May 20");
test("$formatDate - transform", { $fetch : Date.UTC(2017, 4, 20, 5, 0, 0), $formatDate: { locales : "{{locale}}" } }, "5/20/2017, 8:00:00 AM");

test("$parseDate", "16-07-2015", { $parseDate : { format : "dd-MM-yyyy", timezone: "02:00" } }, "2015-07-15T22:00:00.000Z");
test("$parseDate", "07-16-2015", { $parseDate : { format : "MM/dd/yyyy", timezone: "-0430" } }, "2015-07-16T04:30:00.000Z");
test("$parseDate", "2015-07-16", { $parseDate : { format : "yyyy.MM.dd", timezone: "+0000" } }, "2015-07-16T00:00:00.000Z");
test("$parseDate", "20150716", { $parseDate : { format : "yyyyMMdd", timezone: "0000" } }, "2015-07-16T00:00:00.000Z");
test("$parseDate", { $fetch : "07-16-2015", $parseDate : { format : "MM/dd/yyyy", timezone: "{{timezone}}" } }, "2015-07-15T22:00:00.000Z");

test("$replace substr", "test str", { $replace : { substr : "str", newSubstr : "new" } }, "test new");
test("$replace regexp", "test 123", { $replace : { regexp : /\d+/, newSubstr : "" } }, "test ");
test("$replace regexp string", "test 123", { $replace : { regexp : "\\d+", newSubstr : "" } }, "test ");

test("$catch - no error", { prop : "test" }, { $fetch : "{{prop}}", $catch : {} }, "test");
test("$catch - error", "test", { $map : {}, $catch : "error" }, "error");
test("$catch - error props", "test", { $map : {}, $catch : "{{stack}} - {{message}}" }, "[input] - Expected an array, but received string");
test("$catch - error & skip", "test", { $map : {}, $filter : {}, $catch : "error" }, "error");
test("$catch - multi catch1", { prop : "test" }, { $fetch : "{{prop}}", $catch : "error1", $map : {}, $catch2 : "error2" }, "error2");
test("$catch - multi catch2", { prop : "test" }, { $fetch : "{{prop}}", $map : {}, $catch : "error1", $catch2 : "error2" }, "error1");
test("$catch - nested", { prop : [ 1 ] }, { prop1 : { $fetch : "{{prop}}", $map : { $map : {} }, $catch : "error" } }, { prop1 : "error" });
test("$catch - array", [ [], 2, [] ], { $map : { p : { $fetch : "{{this}}", $map : "a", $catch : "not array" } } }, [ { p : [] }, { p : "not array" }, { p : [] }]);
test("$catch - catch with error", "test", { $map : {}, $catch : { $map : {} }, $catch2 : "catch2" }, "catch2");

console.log(`\nPassed: ${passed} Failed: ${failed}`);
