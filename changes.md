## History

##### 0.0.1
port of (liquid.js) [https://github.com/darthapo/liquid.js]

##### 0.0.2
re-write ported from liquid.rb 2.2.2 (liquid-old) [https://github.com/Shopify/liquid-old]
Some fixes referenced to (liquid.js) [https://github.com/darthapo/liquid.js]

##### 0.0.4
fix for limit:, if renderAll

##### 0.0.5
compile to .js, export .js module

##### 0.0.6
performance - replace iterator method calls with for/in loops
clean up - renderAll return type should be string
clean up - remove prototype extensions

##### 0.0.7
Add tags: block, extend, break, continue, decrement, increment

##### 0.0.8
update npm documentation

##### 0.0.9
Bugfix - issue#1 'block.name is a single character'
    (thanks to airtonix)

##### 0.1.0
Breaking change to new npm rep as liquid.coffee
Effectively renaming huginn-liquid to liquid.coffee.

##### 0.1.1
Oops = extra/liquidView was not required.
Added setPath & compile to base Liquid object
fixed LiquidView
added example folder

##### 0.1.3
For loop - treat object as array of {key:*,value:*} 

##### 0.1.4
Context - fix scope stack order 

##### 0.1.6
increment should start at 0, not 1

##### 0.1.7
throw inside of switch/case results in unreachable code error from typescript compiler
coffeescript 1.11.1

##### 0.1.8
add self-reference for amd define
add typescript d.ts
