# jslt

## Update operators

### $fetch

* `Input` None
* `Parameters` \<Any\>
* `Output` \<Any\>

### $translate

* `Input` \<Any\>
* `Parameters` \<Array\>
* `Output` \<Any\>

### $join

* `Input` None
* `Parameters` \<Array\>
* `Output` \<String\>

### $concat

* `Input` None
* `Parameters` \<Array\>
* `Output` \<Array\>

### $formatDate
Returns a string with a language sensitive representation of the input date. See [Date.prototype.toLocaleString()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleString) documentation for more information.

* `Input` \<Date\>
* `Parameters`
  - `locales` \<String\> Optional
  - `options` \<Object\> Optional
* `Output` \<String\>

### $formatNumber
Returns a string with a language sensitive representation of the input number. See [Number.prototype.toLocaleString()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString) documentation for more information.

* `Input` \<Number\>
* `Parameters`
  - `locales` \<String\> Optional
  - `options` \<Object\> Optional
* `Output` \<String\>

### $parseNumber
* `Input` \<String\>
* `Parameters`
  - `groupSymbol` \<String\> Optional
  - `decimalSymbol` \<String\> Optional
* `Output` \<Number\>

### $parseDate
* `Input` \<String\>
* `Parameters`
  - `format` \<String\>
  - `timezone` \<String\>
* `Output` \<Number\>

### $replace
Returns a new string with some or all matches of a pattern replaced by a new string.

* `Input` \<String\>
* `Parameters`
  - `substr` (pattern) \<String\>
  - `regexp` (pattern) \<RegExp\>
  - `newSubstr` \<String\>
* `Output` \<String\>

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
 
### $unshift
Adds an element to the beginning of an array.

* `Input` \<Array\>
* `Parameters` \<Any\> The element to add
* `Output` \<Array\>

### $reverse
Reverses an array.

* `Input` \<Array\>
* `Parameters` None
* `Output` \<Array\>

### $sum
Returns the sum of all the elements in an array.

* `Input` \<Array\>
* `Parameters` None
* `Output` \<Number\>

## Query operators

### $eq
### $nq
### $gt
### $lt
### $gte
### $lte
### $in
### $nin
### $regex
