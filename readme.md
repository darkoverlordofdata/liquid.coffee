# Liquid.Coffee

[![Build Status](https://travis-ci.org/darkoverlordofdata/liquid.coffee.svg?branch=master)](https://travis-ci.org/darkoverlordofdata/liquid.coffee)

Liquid Coffee Template Engine

Liquid.coffee was ported from a fork of (liquid 2.2.2) [https://github.com/Shopify/liquid-old], after which the following additions were made:

- Liquid Inheritance tags

    + block
    + extend

- Liquid3 tags

    + break
    + continue
    + decrement
    + increment

This library was created as a plugin for huginn and named huginn-liquid.
Version 0.0.9 is the last available version on npmjs.org under that name.
Going forward, this will be liquid.coffee, starting with version 0.1.0

My site, http://darkoverlordofdata.com is generated with huginn using liquid.coffee.
For bower users, there is also a browserified distribution in the dist folder.



## Quick Start

### Install

```bash
$ cd <project name>
$ npm install liquid.coffee --save
```

### Test

```bash
$ npm install liquid.coffee
$ npm test
```

### Make

```bash
$ npm install liquid.coffee
$ npm run build
```

### Use in Hapi

```coffee
server.views
  path: '/path/to/views'
  engines:
    tpl: require('liquid.coffee').setPath('/path/to/views')

```
### Use in expressjs

```coffee
Liquid = require('liquid.coffee').setPath('/path/to/views')

app.set "view engine", "tpl"
app.engine 'tpl', (new Liquid.LiquidView()).__express

```

### Example
```bash
$ cd liquid.coffee/example
$ npm install
$ coffee app.coffee
```


## License

(The MIT License)

Copyright (c) 2013 - 2017 Bruce Davidson &lt;darkoverlordofdata@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
