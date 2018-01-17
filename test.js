
var data = {
	stringField : "testString",
	numberField : 1234,
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
		numberField : 1234
	}
};

function test(name, template, expected) {
	var res = jslt.transform(data, template);
	var success = JSON.stringify(res) == JSON.stringify(expected);
	success ? ++passed : ++failed;
	console.log(`${name}: ${success ? "Passed" : "FAILED"}`);
	if (!success) console.log(JSON.stringify(res));
}

var passed = 0, failed = 0;
var jslt = require("./jslt.js");

test("Static string", "aaa", "aaa");
test("Static number", 1122, 1122);
test("Static true", true, true);
test("Static false", false, false);

test("Identity transform string", "{{stringField}}", "testString");
test("Identity transform number", "{{numberField}}", 1234);
test("Identity transform true", "{{falseField}}", false);
test("Identity transform false", "{{trueField}}", true);

test("Transform strings", "{{stringField}} {{stringField}}", "testString testString");
test("Nested transform", "{{obj.stringField}}", "Nested testString");
test("Array transform", "{{array[1].numberField}}", 2);

test("$fetch", { $fetch : "{{stringField}}" }, "testString");
test("$fetch cascaded", { $fetch : "{{obj}}", $fetch2 : "{{stringField}}" }, "Nested testString");

test("$translate old syntax", { $fetch : "{{falseField}}", $translate : { from : [ true, false ], to : [ "Yes", "No" ] } }, "No");
test("$translate", { $fetch : "{{falseField}}", $translate : [ { from : true, to : "Yes" }, { from : false,  to : "No" } ] }, "No");
test("$translate - undefined", { $fetch : undefined, $translate : [ { to : "Yes" } ] }, "Yes");
test("$translate - condition", { $fetch : 5, $translate : [ { from : { $lt : 3 }, to : "Yes" }, { from : { $gte : 3 }, to : "No" } ] }, "No");
test("$translate - condition obj", { $fetch : "{{obj}}", $translate : [ { from : { numberField : { $gt : 3 } }, to : "Yes" } ] }, "Yes");
test("$translate & transform", { $fetch : "{{trueField}}", $translate : [ { from : true, to : "{{stringField}}" }, { from : false, to : "No" } ] }, "testString");

test("$join", { $join : [ "Hello ", "world" ] }, "Hello world");
test("$join & transform", { $join : [ "Hello ", "{{stringField}}" ] }, "Hello testString");
test("$concat", { $concat : [ [ "Hello", "world" ], [ "world2" ] ] }, [ "Hello", "world", "world2" ]);

test("$push", { $fetch : "{{simpleArray}}", $push : "ddd" }, [ "aaa", "bbb", "ccc", "ddd" ]);
test("$push & transform", { $fetch : "{{simpleArray}}", $push : "{{stringField}}" }, [ "aaa", "bbb", "ccc", "testString" ]);
test("$unshift", { $fetch : "{{simpleArray}}", $unshift : "ddd" }, [ "ddd", "aaa", "bbb", "ccc" ]);
test("$unshift & transform", { $fetch : "{{simpleArray}}", $unshift : "{{stringField}}" }, [ "testString", "aaa", "bbb", "ccc" ]);

test("$map", { $fetch : "{{array}}", $map : "{{this.stringField}}" }, [ "array1", "array2", "array3" ]);
test("$map & global", { $fetch : "{{array}}", $map : "{{this.stringField}} {{stringField}}" }, [ "array1 testString", "array2 testString", "array3 testString" ]);
test("$map & $sum", { $fetch : "{{array}}", $map : "{{this.numberField}}", $sum : {} }, 22);

test("$filter - eq", { $fetch : [ 1, 2, 3, 4 ], $filter : { $eq : 3 } }, [ 3 ]);
test("$filter - ne", { $fetch : [ 1, 2, 3, 4 ], $filter : { $ne : 3 } }, [ 1, 2, 4 ]);
test("$filter - gt", { $fetch : [ 1, 2, 3, 4 ], $filter : { $gt : 3 } }, [ 4 ]);
test("$filter - lt", { $fetch : [ 1, 2, 3, 4 ], $filter : { $lt : 3 } }, [ 1, 2 ]);
test("$filter - gte", { $fetch : [ 1, 2, 3, 4 ], $filter : { $gte : 3 } }, [ 3, 4 ]);
test("$filter - lte", { $fetch : [ 1, 2, 3, 4 ], $filter : { $lte : 3 } }, [ 1, 2, 3 ]);
test("$filter - in", { $fetch : [ 1, 2, 3, 4 ], $filter : { $in : [ 2, 3 ] } }, [ 2, 3 ]);
test("$filter - nin", { $fetch : [ 1, 2, 3, 4 ], $filter : { $nin : [ 2, 3 ] } }, [ 1, 4 ]);
test("$filter - regex", { $fetch : [ "aaa", "bbb", "ccc" ], $filter : { $regex : /^aaa$/ } }, [ "aaa" ]);
test("$filter - regex string", { $fetch : [ "aaa", "bbb", "ccc" ], $filter : { $regex : "^(aaa|bbb)$" } }, [ "aaa", "bbb" ]);
test("$filter - object", { $fetch : "{{array}}", $filter : { numberField : { $eq : 2 } } }, [{ stringField : "array2", numberField : 2 }]);

test("$reverse", { $fetch : "{{simpleArray}}", $reverse : {} }, [ "ccc", "bbb", "aaa" ]);
test("$reverse", { $fetch : "{{array}}", $reverse : {}, $map : "{{this.stringField}}" }, [ "array3", "array2", "array1" ]);

test("$parseNumber", { $fetch : "123.0", $parseNumber : {} }, 123);
test("$parseNumber groupSymbol", { $fetch : "123.0", $parseNumber : { groupSymbol : "." } }, 1230);
test("$parseNumber commas", { $fetch : "1,230", $parseNumber : {} }, 1230);

test("$formatNumber", { $fetch : 1234, $formatNumber : { options : { useGrouping : false }} }, "1234");
test("$formatNumber & transform", { $fetch : 1234, $formatNumber : { options : { style : "currency", currencyDisplay: "name", currency : "{{currencyName}}" }} }, "1,234.00 EUR");

test("$formatDate", { $fetch : Date.UTC(2017, 4, 20, 5, 0, 0), $formatDate: { locales : "en-US" } }, "5/20/2017, 8:00:00 AM");
test("$formatDate & transform", { $fetch : Date.UTC(2017, 4, 20, 5, 0, 0), $formatDate: { locales : "{{locale}}" } }, "5/20/2017, 8:00:00 AM");

test("$parseDate", { $fetch : "16-07-2015", $parseDate : { format : "dd-MM-yyyy", timezone: "02:00" } }, "2015-07-15T22:00:00.000Z");
test("$parseDate", { $fetch : "07-16-2015", $parseDate : { format : "MM/dd/yyyy", timezone: "-0430" } }, "2015-07-16T04:30:00.000Z");
test("$parseDate", { $fetch : "2015-07-16", $parseDate : { format : "yyyy.MM.dd", timezone: "+0000" } }, "2015-07-16T00:00:00.000Z");
test("$parseDate", { $fetch : "20150716", $parseDate : { format : "yyyyMMdd", timezone: "0000" } }, "2015-07-16T00:00:00.000Z");
test("$parseDate", { $fetch : "07-16-2015", $parseDate : { format : "MM/dd/yyyy", timezone: "{{timezone}}" } }, "2015-07-15T22:00:00.000Z");

test("$replace substr", { $fetch : "test str", $replace : { substr : "str", newSubstr : "new" } }, "test new");
test("$replace regexp", { $fetch : "test 123", $replace : { regexp : /\d+/, newSubstr : "" } }, "test ");
test("$replace regexp string", { $fetch : "test 123", $replace : { regexp : "\\d+", newSubstr : "" } }, "test ");

console.log(`Passed: ${passed} Failed: ${failed}`);
