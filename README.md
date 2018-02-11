# jslt

```js
var jslt = require("jslt");
jslt.transform({ field1: 10 }, { outputField: "{{field1}}" });
```

## Table of contents

- Update operators:
  - [$fetch](#fetch)
  - [$translate](#translate)
  - [$concat](#concat)
  - [$formatDate](#formatDate)
  - [$formatNumber](#formatNumber)
  - [$parseNumber](#parseNumber)
  - [$parseDate](#parseDate)
  - [$replace](#replace)
  - [$map](#map)
  - [$filter](#filter)  
  - [$push](#push)
  - [$unshift](#unshift)
  - [$reverse](#reverse)
  - [$sum](#sum)
- Query operators:
  - [$eq](#eq)
  - [$ne](#ne)
  - [$lt](#lt)
  - [$gt](#gt)
  - [$lte](#lte)
  - [$gte](#gte)
  - [$in](#in)
  - [$nin](#nin)
  - [$regex](#regex)

## Update operators

### $fetch

* `Input` None
* `Parameters` \<Any\>
* `Output` \<Any\>

### $translate

* `Input` \<Any\>
* `Parameters` \<Array\>
* `Output` \<Any\>

Example:
```js
var res = jslt.transform(true, {
  $translate: [
    { from: true, to: "Yes" },
    { from: false, to: "No" }
  }
);
console.log(res); // => true
```
With query operators:
```js
var res = jslt.transform(10, {
  $translate: [
    { from: { $lt: 8 }, to: "Low" },
    { from: { $gte: 8 }, to: "High" }
  }
);
console.log(res); // => "High"
```
The above example with a default value:
```js
var res = jslt.transform(10, {
  $translate: [
    { from: { $lt : 8 }, to: "Low" },
    { default: "High" }
  }
);
console.log(res); // => "High"
```

### $join

* `Input` None
* `Parameters` \<Array\>
* `Output` \<String\>

Example:
```js
var res = jslt.transform({}, { $join: [ "Hello", " ", "world" ] });
console.log(res); // => "Hello world"
```

### $concat
Merges two or more arrays.

* `Input` None
* `Parameters` \<Array\>
* `Output` \<Array\>

Example:
```js
var res = jslt.transform({}, { $concat: [ [ 1, 2 ], [ 3, 4 ] ] });
console.log(res); // => [ 1, 2, 3, 4 ]
```

### $formatDate
Returns a string with a language sensitive representation of the input date.
See [Date.prototype.toLocaleString()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleString) documentation for more information.

* `Input` \<Date\>
* `Parameters`
  - `locales` \<String\> Optional
  - `options` \<Object\> Optional
* `Output` \<String\>

### $formatNumber
Returns a string with a language sensitive representation of the input number.
See [Number.prototype.toLocaleString()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString) documentation for more information.

* `Input` \<Number\>
* `Parameters`
  - `locales` \<String\> Optional
  - `options` \<Object\> Optional
* `Output` \<String\>

Example:
```js
var res = jslt.transform(1000, { $formatNumber: { locales: "en-US" options: { minimumFractionDigits: 2 } } });
console.log(res); // => "1,000.00"
```

### $parseNumber
Parses the input string and returns a number.

* `Input` \<String\>
* `Parameters`
  - `groupSymbol` \<String\> Optional
  - `decimalSymbol` \<String\> Optional
* `Output` \<Number\>

Example:
```js
var res = jslt.transform("1,000", { $parseNumber: { groupSymbol: "," } });
console.log(res); // => 1000
```

### $parseDate
Parses the input string and returns a date object.

* `Input` \<String\>
* `Parameters`
  - `format` \<String\>
  - `timezone` \<String\>
* `Output` \<Date\>

### $replace
Returns a new string with some or all matches of a pattern replaced by a new string.

* `Input` \<String\>
* `Parameters`
  - `substr` (pattern) \<String\>
  - `regexp` (pattern) \<RegExp\>
  - `newSubstr` \<String\>
* `Output` \<String\>

Example:
```js
var res = jslt.transform("Hello world", { $replace: { substr: "world", newSubstr: "world!!" });
console.log(res); // => "Hello world!!"
```

### $map

* `Input` \<Array\>
* `Parameters` \<Any\>
* `Output` \<Array\>

### $filter

* `Input` \<Array\>
* `Parameters` \<Any\>
* `Output` \<Array\>

### $push
Adds an element to the end of an array.

* `Input` \<Array\>
* `Parameters` \<Any\> The element to add
* `Output` \<Array\>

Example:
```js
var res = jslt.transform([ 1, 2 ], { $push: 3 });
console.log(res); // => [ 1, 2, 3 ]
```
 
### $unshift
Adds an element to the beginning of an array.

* `Input` \<Array\>
* `Parameters` \<Any\> The element to add
* `Output` \<Array\>

Example:
```js
var res = jslt.transform([ 1, 2 ], { $unshift: 0 });
console.log(res); // => [ 0, 1, 2 ]
```

### $reverse
Reverses an array.

* `Input` \<Array\>
* `Parameters` None
* `Output` \<Array\>

Example:
```js
var res = jslt.transform([ 1, 2, 3 ], { $reverse: {} });
console.log(res); // => [ 3, 2, 1 ]
```

### $sum
Returns the sum of all the elements in an array.

* `Input` \<Array\>
* `Parameters` None
* `Output` \<Number\>

```js
var res = jslt.transform([ 1, 2, 3 ], { $sum: {} });
console.log(res); // => 6
```

## Query operators

### $eq
### $nq
### $lt
### $gt
### $lte
### $gte
### $in
### $nin
### $regex
