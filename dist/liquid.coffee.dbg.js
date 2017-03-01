(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Liquid = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))

},{"_process":3}],3:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],4:[function(require,module,exports){
// Generated by CoffeeScript 1.11.1
(function() {
  var Liquid, fs;

  fs = require('fs');

  Liquid = require('../liquid');

  Liquid.LiquidView = (function() {
    var cache;

    function LiquidView() {}

    cache = {};

    LiquidView.prototype.render = function(source, data) {
      var template;
      if (data == null) {
        data = {};
      }
      if (cache[source] != null) {
        template = cache[source];
      } else {
        template = Liquid.Template.parse(source);
      }
      return template.render(data);
    };

    LiquidView.prototype.renderFile = function(filePath, options, next) {
      return fs.readFile(filePath, 'utf-8', function(err, content) {
        var template;
        if (err) {
          return next(new Error(err));
        }
        template = Liquid.Template.parse(content);
        return next(null, template.render(options));
      });
    };

    LiquidView.prototype.__express = function(filePath, options, next) {
      return fs.readFile(filePath, 'utf-8', function(err, content) {
        var template;
        if (err) {
          return next(new Error(err));
        }
        template = Liquid.Template.parse(content);
        return next(null, template.render(options));
      });
    };

    return LiquidView;

  })();

}).call(this);

},{"../liquid":5,"fs":1}],5:[function(require,module,exports){
// Generated by CoffeeScript 1.11.1

/*

Copyright (c) 2013 - 2014 Bruce Davidson darkoverlordofdata@gmail.com
Copyright (c) 2005, 2006 Tobias Luetke

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

(function() {
  var Liquid;

  module.exports = Liquid = (function() {
    function Liquid() {}

    Liquid.FilterSeparator = /\|/;

    Liquid.ArgumentSeparator = ',';

    Liquid.FilterArgumentSeparator = ':';

    Liquid.VariableAttributeSeparator = '.';

    Liquid.TagStart = /\{\%/;

    Liquid.TagEnd = /\%\}/;

    Liquid.VariableSignature = /\(?[\w\-\.\[\]]\)?/;

    Liquid.VariableSegment = /[\w\-]/;

    Liquid.VariableStart = /\{\{/;

    Liquid.VariableEnd = /\}\}/;

    Liquid.VariableIncompleteEnd = /\}\}?/;

    Liquid.QuotedString = /"[^"]*"|'[^']*'/;

    Liquid.QuotedFragment = RegExp(Liquid.QuotedString.source + "|(?:[^\\s,\\|'\"]|" + Liquid.QuotedString.source + ")+");

    Liquid.StrictQuotedFragment = /"[^"]+"|'[^']+'|[^\s|:,]+/;

    Liquid.FirstFilterArgument = RegExp(Liquid.FilterArgumentSeparator + "(?:" + Liquid.StrictQuotedFragment.source + ")");

    Liquid.OtherFilterArgument = RegExp(Liquid.ArgumentSeparator + "(?:" + Liquid.StrictQuotedFragment.source + ")");

    Liquid.SpacelessFilter = RegExp("^(?:'[^']+'|\"[^\"]+\"|[^'\"])*" + Liquid.FilterSeparator.source + "(?:" + Liquid.StrictQuotedFragment.source + ")(?:" + Liquid.FirstFilterArgument.source + "(?:" + Liquid.OtherFilterArgument.source + ")*)?");

    Liquid.Expression = RegExp("(?:" + Liquid.QuotedFragment.source + "(?:" + Liquid.SpacelessFilter.source + ")*)");

    Liquid.TagAttributes = RegExp("(\\w+)\\s*\\:\\s*(" + Liquid.QuotedFragment.source + ")");

    Liquid.AnyStartingTag = /\{\{|\{\%/;

    Liquid.PartialTemplateParser = RegExp(Liquid.TagStart.source + ".*?" + Liquid.TagEnd.source + "|" + Liquid.VariableStart.source + ".*?" + Liquid.VariableIncompleteEnd.source);

    Liquid.TemplateParser = RegExp("(" + Liquid.PartialTemplateParser.source + "|" + Liquid.AnyStartingTag.source + ")");

    Liquid.VariableParser = RegExp("\\[[^\\]]+\\]|" + Liquid.VariableSegment.source + "+\\??");

    Liquid.LiteralShorthand = /^(?:\{\{\{\s?)(.*?)(?:\s*\}\}\})$/;

    Liquid.setPath = function(path) {
      Liquid.Template.fileSystem = new Liquid.LocalFileSystem(path);
      return Liquid;
    };

    Liquid.compile = function(template, options) {
      var t;
      t = Liquid.Template.parse(template);
      return function(context, options) {
        return t.render(context);
      };
    };

    return Liquid;

  })();

  require('./liquid/version');

  require('./liquid/drop');

  require('./liquid/errors');

  require('./liquid/interrupts');

  require('./liquid/strainer');

  require('./liquid/context');

  require('./liquid/tag');

  require('./liquid/block');

  require('./liquid/document');

  require('./liquid/variable');

  require('./liquid/filesystem');

  require('./liquid/template');

  require('./liquid/standardfilters');

  require('./liquid/condition');

  Liquid.Tags = (function() {
    function Tags() {}

    return Tags;

  })();

  require('./liquid/tags/assign');

  require('./liquid/tags/block');

  require('./liquid/tags/break');

  require('./liquid/tags/capture');

  require('./liquid/tags/case');

  require('./liquid/tags/comment');

  require('./liquid/tags/continue');

  require('./liquid/tags/cycle');

  require('./liquid/tags/decrement');

  require('./liquid/tags/extends');

  require('./liquid/tags/for');

  require('./liquid/tags/if');

  require('./liquid/tags/ifchanged');

  require('./liquid/tags/include');

  require('./liquid/tags/increment');

  require('./liquid/tags/raw');

  require('./liquid/tags/unless');

  require('./extras/liquidView');

}).call(this);

},{"./extras/liquidView":4,"./liquid/block":6,"./liquid/condition":7,"./liquid/context":8,"./liquid/document":9,"./liquid/drop":10,"./liquid/errors":11,"./liquid/filesystem":12,"./liquid/interrupts":13,"./liquid/standardfilters":14,"./liquid/strainer":15,"./liquid/tag":16,"./liquid/tags/assign":17,"./liquid/tags/block":18,"./liquid/tags/break":19,"./liquid/tags/capture":20,"./liquid/tags/case":21,"./liquid/tags/comment":22,"./liquid/tags/continue":23,"./liquid/tags/cycle":24,"./liquid/tags/decrement":25,"./liquid/tags/extends":26,"./liquid/tags/for":27,"./liquid/tags/if":28,"./liquid/tags/ifchanged":29,"./liquid/tags/include":30,"./liquid/tags/increment":31,"./liquid/tags/raw":32,"./liquid/tags/unless":33,"./liquid/template":34,"./liquid/variable":36,"./liquid/version":37}],6:[function(require,module,exports){
// Generated by CoffeeScript 1.11.1
(function() {
  var Liquid,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Liquid = require('../liquid');

  Liquid.Block = (function(superClass) {
    var ContentOfVariable, FullToken, IsTag, IsVariable;

    extend(Block, superClass);

    IsTag = RegExp("^" + Liquid.TagStart.source);

    IsVariable = RegExp("^" + Liquid.VariableStart.source);

    FullToken = RegExp("^" + Liquid.TagStart.source + "\\s*(\\w+)\\s*(.*)?" + Liquid.TagEnd.source + "$");

    ContentOfVariable = RegExp("^" + Liquid.VariableStart.source + "(.*)" + Liquid.VariableEnd.source + "$");

    function Block(tagName, markup, tokens) {
      this.blockName = tagName;
      this.blockDelimiter = "end" + this.blockName;
      Block.__super__.constructor.call(this, tagName, markup, tokens);
    }

    Block.prototype.parse = function(tokens) {
      var $, tag, token;
      this.nodelist || (this.nodelist = []);
      this.nodelist.length = 0;
      while ((token = tokens.shift()) != null) {
        if (IsTag.test(token)) {
          if ($ = token.match(FullToken)) {
            if (this.blockDelimiter === $[1]) {
              this.endTag();
              return;
            }
            if (tag = Liquid.Template.tags[$[1]]) {
              this.nodelist.push(new tag($[1], $[2], tokens));
            } else {
              this.unknownTag($[1], $[2], tokens);
            }
          } else {
            throw new SyntaxError("Tag '" + token + "' was not properly terminated with regexp: " + Liquid.TagEnd.source + " ");
          }
        } else if (IsVariable.test(token)) {
          this.nodelist.push(this.createVariable(token));
        } else if (token === '') {

        } else {
          this.nodelist.push(token);
        }
      }
      return this.assertMissingDelimitation();
    };

    Block.prototype.endTag = function() {};

    Block.prototype.unknownTag = function(tag, params, tokens) {
      if (tag === "else") {
        throw new SyntaxError(this.blockName + " tag does not expect else tag");
      } else if (tag === "end") {
        throw new SyntaxError("'end' is not a valid delimiter for " + this.blockName + " tags. use " + this.blockDelimiter);
      } else {
        throw new SyntaxError("Unknown tag '" + tag + "'");
      }
    };

    Block.prototype.createVariable = function(token) {
      var content;
      if (content = token.match(ContentOfVariable)) {
        return new Liquid.Variable(content[1]);
      } else {
        throw new Liquid.SyntaxError("Variable '" + token + "' was not properly terminated with regexp: " + Liquid.VariableEnd.source + " ");
      }
    };

    Block.prototype.render = function(context) {
      return this.renderAll(this.nodelist, context);
    };

    Block.prototype.renderAll = function(list, context) {
      var e, i, len, output, token;
      output = [];
      for (i = 0, len = list.length; i < len; i++) {
        token = list[i];
        if (context.hasInterrupt()) {
          break;
        }
        try {
          if (token instanceof Liquid.Tags.Continue || token instanceof Liquid.Tags.Break) {
            context.pushInterrupt(token.interrupt);
            break;
          }
          output.push(token.render != null ? token.render(context) : token);
        } catch (error) {
          e = error;
          context.handleError(e);
        }
      }
      return output.join('');
    };

    Block.prototype.assertMissingDelimitation = function() {
      throw new Liquid.SyntaxError(block_name + " tag was never closed");
    };

    return Block;

  })(Liquid.Tag);

}).call(this);

},{"../liquid":5}],7:[function(require,module,exports){
// Generated by CoffeeScript 1.11.1
(function() {
  var Liquid,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Liquid = require('../liquid');

  Liquid.Condition = (function() {
    var compact;

    compact = require('./util').compact;

    Condition.operators = {
      "==": function(l, r) {
        return l === r;
      },
      "=": function(l, r) {
        return l === r;
      },
      "!=": function(l, r) {
        return l !== r;
      },
      "<>": function(l, r) {
        return l !== r;
      },
      "<": function(l, r) {
        return l < r;
      },
      ">": function(l, r) {
        return l > r;
      },
      "<=": function(l, r) {
        return l <= r;
      },
      ">=": function(l, r) {
        return l >= r;
      },
      contains: function(l, r) {
        return l.match(r);
      },
      hasKey: function(l, r) {
        return l[r] != null;
      },
      hasValue: function(l, r) {
        var p;
        for (p in l) {
          if (l[p] === r) {
            return true;
          }
        }
        return false;
      }
    };

    function Condition(left1, operator, right1) {
      this.left = left1;
      this.operator = operator;
      this.right = right1;
      this.childRelation = null;
      this.childCondition = null;
      this.attachment = null;
    }

    Condition.prototype.evaluate = function(context) {
      var result;
      if (context == null) {
        context = new Liquid.Context;
      }
      result = this.interpretCondition(this.left, this.right, this.operator, context);
      switch (this.childRelation) {
        case "or":
          return result || this.childCondition.evaluate(context);
        case "and":
          return result && this.childCondition.evaluate(context);
        default:
          return result;
      }
    };

    Condition.prototype.or = function(condition) {
      this.childRelation = "or";
      return this.childCondition = condition;
    };

    Condition.prototype.and = function(condition) {
      this.childRelation = "and";
      return this.childCondition = condition;
    };

    Condition.prototype.attach = function(attachment) {
      return this.attachment = attachment;
    };

    Condition.prototype["else"] = function() {
      return false;
    };

    Condition.prototype.toString = function() {
      return "#<Condition " + (compact([this.left, this.operator, this.right]).join(' ')) + ">";
    };

    Condition.prototype.interpretCondition = function(left, right, op, context) {
      var operation;
      if (op == null) {
        return context.get(left);
      }
      left = context.get(left);
      right = context.get(right);
      operation = Condition.operators[op] || new Liquid.ArgumentError("Unknown operator " + op);
      if (operation.call != null) {
        return operation.call(this, left, right);
      } else {
        return null;
      }
    };

    return Condition;

  })();

  Liquid.ElseCondition = (function(superClass) {
    extend(ElseCondition, superClass);

    function ElseCondition() {
      return ElseCondition.__super__.constructor.apply(this, arguments);
    }

    ElseCondition.prototype["else"] = function() {
      return true;
    };

    ElseCondition.prototype.evaluate = function(context) {
      return true;
    };

    return ElseCondition;

  })(Liquid.Condition);

}).call(this);

},{"../liquid":5,"./util":35}],8:[function(require,module,exports){
// Generated by CoffeeScript 1.11.1
(function() {
  var Liquid,
    slice = [].slice;

  Liquid = require('../liquid');

  Liquid.Context = (function() {
    var LITERALS, compact, flatten, ref;

    LITERALS = {
      'nil': null,
      'null': null,
      '': null,
      'true': true,
      'false': false
    };

    ref = require('./util'), compact = ref.compact, flatten = ref.flatten;

    function Context(environments, outerScope, registers, rethrowErrors) {
      this.environments = flatten([environments]);
      this.scopes = [outerScope || {}];
      this.registers = registers;
      this.errors = [];
      this.rethrowErrors = rethrowErrors;
      this.strainer = Liquid.Strainer.create(this);
      this.interrupts = [];
    }

    Context.prototype.addFilters = function(filters) {
      var f, i, len, results;
      filters = compact(flatten([filters]));
      results = [];
      for (i = 0, len = filters.length; i < len; i++) {
        f = filters[i];
        if (typeof f !== "function") {
          throw Liquid.ArgumentError("Expected module but got: " + typeof f);
        }
        results.push(this.strainer.extend(f));
      }
      return results;
    };

    Context.prototype.hasInterrupt = function() {
      return this.interrupts.length > 0;
    };

    Context.prototype.pushInterrupt = function(e) {
      return this.interrupts.push(e);
    };

    Context.prototype.popInterrupt = function() {
      return this.interrupts.pop();
    };

    Context.prototype.handleError = function(e) {
      this.errors.push(e);
      if (this.rethrowErrors) {
        if (e instanceof Liquid.SyntaxError) {
          throw "Liquid syntax error: " + e.message;
        } else {
          throw "Liquid error: " + e.message;
        }
      }
    };

    Context.prototype.invoke = function() {
      var args, method, ref1;
      method = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      if (this.strainer.respondTo(method)) {
        return (ref1 = this.strainer)[method].apply(ref1, args);
      } else {
        return args[0];
      }
    };

    Context.prototype.push = function(newScope) {
      if (newScope == null) {
        newScope = {};
      }
      this.scopes.push(newScope);
      if (this.scopes.length > 100) {
        throw new Liquid.StackLevelError("Nesting too deep");
      }
    };

    Context.prototype.merge = function(newScope) {
      var key, results, val;
      results = [];
      for (key in newScope) {
        val = newScope[key];
        results.push(this.scopes[0][key] = val);
      }
      return results;
    };

    Context.prototype.pop = function() {
      if (this.scopes.length === 1) {
        throw new Liquid.ContextError();
      }
      return this.scopes.pop();
    };

    Context.prototype.stack = function($yield, newScope) {
      if (newScope == null) {
        newScope = {};
      }
      this.push(newScope);
      try {
        return $yield();
      } finally {
        this.pop();
      }
    };

    Context.prototype.clearInstanceAssigns = function() {
      return this.scopes[0] = {};
    };

    Context.prototype.get = function(varname) {
      return this.resolve(varname);
    };

    Context.prototype.set = function(varname, value) {
      return this.scopes[0][varname] = value;
    };

    Context.prototype.hasKey = function(key) {
      return this.resolve(key) != null;
    };

    Context.prototype.resolve = function(key) {
      var $, ch, i, j, ref1, ref2, ref3, ref4, results, results1;
      if (LITERALS[key] != null) {
        return LITERALS[key];
      } else {
        if ($ = /^'(.*)'$/.exec(key)) {
          return $[1];
        } else if ($ = /^"(.*)"$/.exec(key)) {
          return $[1];
        } else if ($ = /^(\d+)$/.exec(key)) {
          return parseInt($[1], 10);
        } else if ($ = /^(\d[\d\.]+)$/.exec(key)) {
          return parseFloat($[1]);
        } else if ($ = /^\((\S+)\.\.(\S+)\)$/.exec(key)) {
          if (isNaN($[1])) {
            results = [];
            for (ch = i = ref1 = $[1].charCodeAt(0), ref2 = $[2].charCodeAt(0); ref1 <= ref2 ? i <= ref2 : i >= ref2; ch = ref1 <= ref2 ? ++i : --i) {
              results.push(String.fromCharCode(ch));
            }
            return results;
          } else {
            return (function() {
              results1 = [];
              for (var j = ref3 = parseInt($[1]), ref4 = parseInt($[2]); ref3 <= ref4 ? j <= ref4 : j >= ref4; ref3 <= ref4 ? j++ : j--){ results1.push(j); }
              return results1;
            }).apply(this);
          }
        } else {
          return this.variable(key);
        }
      }
    };

    Context.prototype.findVariable = function(key) {
      var e, i, j, len, len1, ref1, ref2, s, scope, variable;
      ref1 = this.scopes;
      for (i = 0, len = ref1.length; i < len; i++) {
        s = ref1[i];
        if (s[key] != null) {
          scope = s;
        }
      }
      if (scope == null) {
        ref2 = this.environments;
        for (j = 0, len1 = ref2.length; j < len1; j++) {
          e = ref2[j];
          if (variable = this.lookupAndEvaluate(e, key)) {
            scope = e;
            break;
          }
        }
      }
      scope || (scope = this.environments[this.environments.length - 1] || this.scopes[this.scopes.length - 1]);
      variable || (variable = this.lookupAndEvaluate(scope, key));
      if (variable != null) {
        if (typeof variable.setContext === "function") {
          variable.setContext(this);
        }
      }
      return variable;
    };

    Context.prototype.variable = function(markup) {
      var $, firstPart, i, len, object, part, parts, squareBracketed;
      if (typeof markup !== "string") {
        return null;
      }
      parts = markup.match(/\[[^\]]+\]|(?:[\w\-]\??)+/g);
      squareBracketed = /^\[(.*)\]$/;
      firstPart = parts.shift();
      if (($ = squareBracketed.exec(firstPart))) {
        firstPart = this.resolve($[1]);
      }
      if (object = this.findVariable(firstPart)) {
        for (i = 0, len = parts.length; i < len; i++) {
          part = parts[i];
          if (($ = squareBracketed.exec(part))) {
            part = this.resolve($[1]);
            object = object[part];
          } else {
            if (typeof object === 'object' && part in object) {
              object = this.lookupAndEvaluate(object, part);
            } else if (/^\d+$/.test(part)) {
              object = object[parseInt(part, 10)];
            } else {
              return null;
            }
          }
          if (object != null) {
            if (typeof object.setContext === "function") {
              object.setContext(this);
            }
          }
        }
      }
      return object;
    };

    Context.prototype.lookupAndEvaluate = function(obj, key) {
      var value;
      if (typeof (value = obj[key]) === 'function') {
        return obj[key] = value(this);
      } else {
        return value;
      }
    };

    return Context;

  })();

}).call(this);

},{"../liquid":5,"./util":35}],9:[function(require,module,exports){
// Generated by CoffeeScript 1.11.1
(function() {
  var Liquid,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Liquid = require('../liquid');

  Liquid.Document = (function(superClass) {
    extend(Document, superClass);

    function Document(tokens) {
      this.blockDelimiter = [];
      this.parse(tokens);
    }

    Document.prototype.assertMissingDelimitation = function() {};

    return Document;

  })(Liquid.Block);

}).call(this);

},{"../liquid":5}],10:[function(require,module,exports){
// Generated by CoffeeScript 1.11.1
(function() {
  var Liquid;

  Liquid = require('../liquid');

  Liquid.Drop = (function() {
    function Drop() {}

    Drop.prototype.setContext = function(context) {
      return this.context = context;
    };

    Drop.prototype.beforeMethod = function(method) {};

    Drop.prototype.invokeDrop = function(method) {
      if ('function' === typeof Drop.prototype[method]) {
        return this[method].apply(this);
      } else {
        return this.beforeMethod(method);
      }
    };

    Drop.prototype.hasKey = function(name) {
      return true;
    };

    return Drop;

  })();

}).call(this);

},{"../liquid":5}],11:[function(require,module,exports){
// Generated by CoffeeScript 1.11.1
(function() {
  var Liquid,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Liquid = require('../liquid');

  Liquid.ArgumentError = (function(superClass) {
    extend(ArgumentError, superClass);

    function ArgumentError() {
      return ArgumentError.__super__.constructor.apply(this, arguments);
    }

    return ArgumentError;

  })(Error);

  Liquid.ContextError = (function(superClass) {
    extend(ContextError, superClass);

    function ContextError() {
      return ContextError.__super__.constructor.apply(this, arguments);
    }

    return ContextError;

  })(Error);

  Liquid.FilterNotFound = (function(superClass) {
    extend(FilterNotFound, superClass);

    function FilterNotFound() {
      return FilterNotFound.__super__.constructor.apply(this, arguments);
    }

    return FilterNotFound;

  })(Error);

  Liquid.FileSystemError = (function(superClass) {
    extend(FileSystemError, superClass);

    function FileSystemError() {
      return FileSystemError.__super__.constructor.apply(this, arguments);
    }

    return FileSystemError;

  })(Error);

  Liquid.StandardError = (function(superClass) {
    extend(StandardError, superClass);

    function StandardError() {
      return StandardError.__super__.constructor.apply(this, arguments);
    }

    return StandardError;

  })(Error);

  Liquid.SyntaxError = (function(superClass) {
    extend(SyntaxError, superClass);

    function SyntaxError() {
      return SyntaxError.__super__.constructor.apply(this, arguments);
    }

    return SyntaxError;

  })(Error);

  Liquid.StackLevelError = (function(superClass) {
    extend(StackLevelError, superClass);

    function StackLevelError() {
      return StackLevelError.__super__.constructor.apply(this, arguments);
    }

    return StackLevelError;

  })(Error);

  Liquid.MemoryError = (function(superClass) {
    extend(MemoryError, superClass);

    function MemoryError() {
      return MemoryError.__super__.constructor.apply(this, arguments);
    }

    return MemoryError;

  })(Error);

}).call(this);

},{"../liquid":5}],12:[function(require,module,exports){
// Generated by CoffeeScript 1.11.1
(function() {
  var Liquid, fs, path,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  fs = require('fs');

  path = require('path');

  Liquid = require('../liquid');

  Liquid.BlankFileSystem = (function() {
    function BlankFileSystem() {}

    BlankFileSystem.prototype.readTemplateFile = function(path) {
      throw "This liquid context does not allow includes.";
    };

    return BlankFileSystem;

  })();

  Liquid.LocalFileSystem = (function() {
    function LocalFileSystem(root) {
      this.root = root;
      this.readTemplateFile = bind(this.readTemplateFile, this);
    }

    LocalFileSystem.prototype.readTemplateFile = function($template) {
      return String(fs.readFileSync(path.resolve(this.root, $template)));
    };

    return LocalFileSystem;

  })();

}).call(this);

},{"../liquid":5,"fs":1,"path":2}],13:[function(require,module,exports){
// Generated by CoffeeScript 1.11.1
(function() {
  var Liquid,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Liquid = require('../liquid');

  Liquid.Interrupt = (function() {
    Interrupt.prototype.message = '';

    function Interrupt(message) {
      this.message = message != null ? message : 'interrupt';
    }

    return Interrupt;

  })();

  Liquid.BreakInterrupt = (function(superClass) {
    extend(BreakInterrupt, superClass);

    function BreakInterrupt() {
      return BreakInterrupt.__super__.constructor.apply(this, arguments);
    }

    return BreakInterrupt;

  })(Liquid.Interrupt);

  Liquid.ContinueInterrupt = (function(superClass) {
    extend(ContinueInterrupt, superClass);

    function ContinueInterrupt() {
      return ContinueInterrupt.__super__.constructor.apply(this, arguments);
    }

    return ContinueInterrupt;

  })(Liquid.Interrupt);

}).call(this);

},{"../liquid":5}],14:[function(require,module,exports){
// Generated by CoffeeScript 1.11.1
(function() {
  var Liquid, strftime;

  strftime = require('strftime');

  Liquid = require('../liquid');

  Liquid.StandardFilters = (function() {
    function StandardFilters() {}

    StandardFilters.size = function(iterable) {
      if (iterable["length"]) {
        return iterable.length;
      } else {
        return 0;
      }
    };

    StandardFilters.downcase = function(input) {
      return input.toString().toLowerCase();
    };

    StandardFilters.upcase = function(input) {
      return input.toString().toUpperCase();
    };

    StandardFilters.capitalize = function(input) {
      var str;
      str = input.toString();
      return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
    };

    StandardFilters.escape = function(input) {
      input = input.toString();
      input = input.replace(/&/g, "&amp;");
      input = input.replace(/</g, "&lt;");
      input = input.replace(/>/g, "&gt;");
      input = input.replace(/"/g, "&quot;");
      return input;
    };

    StandardFilters.h = function(input) {
      input = input.toString();
      input = input.replace(/&/g, "&amp;");
      input = input.replace(/</g, "&lt;");
      input = input.replace(/>/g, "&gt;");
      input = input.replace(/"/g, "&quot;");
      return input;
    };

    StandardFilters.truncate = function(input, length, string) {
      var seg;
      if (!input || input === "") {
        return "";
      }
      length = length || 50;
      string = string || "...";
      seg = input.slice(0, length);
      if (input.length > length) {
        return input.slice(0, length) + string;
      } else {
        return input;
      }
    };

    StandardFilters.truncatewords = function(input, words, string) {
      var l, wordlist;
      if (!input || input === "") {
        return "";
      }
      words = parseInt(words || 15);
      string = string || "...";
      wordlist = input.toString().split(" ");
      l = Math.max(words, 0);
      if (wordlist.length > l) {
        return wordlist.slice(0, l).join(" ") + string;
      } else {
        return input;
      }
    };

    StandardFilters.truncate_words = function(input, words, string) {
      var l, wordlist;
      if (!input || input === "") {
        return "";
      }
      words = parseInt(words || 15);
      string = string || "...";
      wordlist = input.toString().split(" ");
      l = Math.max(words, 0);
      if (wordlist.length > l) {
        return wordlist.slice(0, l).join(" ") + string;
      } else {
        return input;
      }
    };

    StandardFilters.strip_html = function(input) {
      return input.toString().replace(/<.*?>/g, "");
    };

    StandardFilters.strip_newlines = function(input) {
      return input.toString().replace(/\n/g, "");
    };

    StandardFilters.join = function(input, separator) {
      separator = separator || " ";
      return input.join(separator);
    };

    StandardFilters.split = function(input, separator) {
      separator = separator || " ";
      return input.split(separator);
    };

    StandardFilters.sort = function(input) {
      return input.sort();
    };

    StandardFilters.reverse = function(input) {
      return input.reverse();
    };

    StandardFilters.replace = function(input, string, replacement) {
      replacement = replacement || "";
      return input.toString().replace(new RegExp(string, "g"), replacement);
    };

    StandardFilters.replace_first = function(input, string, replacement) {
      replacement = replacement || "";
      return input.toString().replace(new RegExp(string, ""), replacement);
    };

    StandardFilters.newline_to_br = function(input) {
      return input.toString().replace(/\n/g, "<br/>\n");
    };

    StandardFilters.date = function(input, format) {
      var date;
      date = void 0;
      if (input instanceof Date) {
        date = input;
      }
      if ((!(date instanceof Date)) && input === "now") {
        date = new Date();
      }
      if (!(date instanceof Date)) {
        date = new Date(input);
      }
      if (!(date instanceof Date)) {
        date = new Date(Date.parse(input));
      }
      if (!(date instanceof Date)) {
        return input;
      }
      return strftime(format, date);
    };

    StandardFilters.first = function(input) {
      return input[0];
    };

    StandardFilters.last = function(input) {
      input = input;
      return input[input.length - 1];
    };

    return StandardFilters;

  })();

  Liquid.Template.registerFilter(Liquid.StandardFilters);

}).call(this);

},{"../liquid":5,"strftime":38}],15:[function(require,module,exports){
// Generated by CoffeeScript 1.11.1
(function() {
  var Liquid,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Liquid = require('../liquid');

  Liquid.Strainer = (function() {
    var INTERNAL_METHOD;

    INTERNAL_METHOD = /^__/;

    Strainer.requiredMethods = ['respondTo', 'context', 'extend'];

    Strainer.filters = {};

    function Strainer(context) {
      this.context = context;
    }

    Strainer.globalFilter = function(filter) {
      if (typeof filter !== 'function') {
        throw new Liquid.ArgumentError("Passed filter is not a module");
      }
      return Strainer.filters[filter.name] = filter;
    };

    Strainer.create = function(context) {
      var k, m, ref, strainer;
      strainer = new Strainer(context);
      ref = Strainer.filters;
      for (k in ref) {
        m = ref[k];
        strainer.extend(m);
      }
      return strainer;
    };

    Strainer.prototype.respondTo = function(methodName) {
      methodName = methodName.toString();
      if (INTERNAL_METHOD.test(methodName)) {
        return false;
      }
      if (indexOf.call(Strainer.requiredMethods, methodName) >= 0) {
        return false;
      }
      if (this[methodName] != null) {
        return true;
      } else {
        return false;
      }
    };

    Strainer.prototype.extend = function(m) {
      var name, results, val;
      results = [];
      for (name in m) {
        val = m[name];
        if (this[name] == null) {
          results.push(this[name] = val);
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    return Strainer;

  })();

}).call(this);

},{"../liquid":5}],16:[function(require,module,exports){
// Generated by CoffeeScript 1.11.1
(function() {
  var Liquid;

  Liquid = require('../liquid');

  Liquid.Tag = (function() {
    function Tag(tagName, markup, tokens) {
      this.tagName = tagName;
      this.markup = markup;
      this.nodelist = this.nodelist || [];
      this.parse(tokens);
    }

    Tag.prototype.parse = function(tokens) {};

    Tag.prototype.render = function(context) {
      return "";
    };

    return Tag;

  })();

}).call(this);

},{"../liquid":5}],17:[function(require,module,exports){
// Generated by CoffeeScript 1.11.1
(function() {
  var Liquid,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Liquid = require('../../liquid');

  Liquid.Tags.Assign = (function(superClass) {
    var Syntax;

    extend(Assign, superClass);

    Syntax = RegExp("((?:" + Liquid.VariableSignature.source + ")+)\\s*=\\s*((?:" + Liquid.StrictQuotedFragment.source + ")+)");

    function Assign(tagName, markup, tokens) {
      var $;
      if ($ = markup.match(Syntax)) {
        this.to = $[1];
        this.from = $[2];
      } else {
        throw new Liquid.SyntaxError("Syntax error in 'assign' - Valid syntax: assign [var] = [source]");
      }
      Assign.__super__.constructor.call(this, tagName, markup, tokens);
    }

    Assign.prototype.render = function(context) {
      var last;
      last = context.scopes.length - 1;
      context.scopes[last][this.to] = context.get(this.from);
      return "";
    };

    return Assign;

  })(Liquid.Tag);

  Liquid.Template.registerTag("assign", Liquid.Tags.Assign);

}).call(this);

},{"../../liquid":5}],18:[function(require,module,exports){
// Generated by CoffeeScript 1.11.1
(function() {
  var Liquid,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Liquid = require('../../liquid');

  Liquid.Tags.BlockDrop = (function(superClass) {
    extend(BlockDrop, superClass);

    function BlockDrop(block) {
      this.block = block;
      Object.defineProperty(this, 'super', {
        get: function() {
          return this.block.callSuper(this.context);
        }
      });
    }

    return BlockDrop;

  })(Liquid.Drop);

  Liquid.Tags.Block = (function(superClass) {
    var Syntax;

    extend(Block, superClass);

    Syntax = RegExp("(" + Liquid.QuotedFragment.source + ")");

    Block.prototype.parent = null;

    Block.prototype.name = '';

    function Block(tagName, markup, tokens) {
      var $;
      if ($ = markup.match(Syntax)) {
        this.name = $[1];
      } else {
        throw new Liquid.SyntaxError("Syntax Error in 'block' - Valid syntax: block [name]");
      }
      if (tokens != null) {
        Block.__super__.constructor.call(this, tagName, markup, tokens);
      }
    }

    Block.prototype.render = function(context) {
      return context.stack((function(_this) {
        return function() {
          context.set('block', new Liquid.Tags.BlockDrop(_this));
          return _this.renderAll(_this.nodelist, context);
        };
      })(this));
    };

    Block.prototype.addParent = function(nodelist) {
      if (this.parent != null) {
        return this.parent.addParent(nodelist);
      } else {
        this.parent = new Block(this.tagName, this.name);
        return this.parent.nodelist = nodelist;
      }
    };

    Block.prototype.callSuper = function(context) {
      if (this.parent != null) {
        return this.parent.render(context);
      } else {
        return '';
      }
    };

    return Block;

  })(Liquid.Block);

  Liquid.Template.registerTag("block", Liquid.Tags.Block);

}).call(this);

},{"../../liquid":5}],19:[function(require,module,exports){
// Generated by CoffeeScript 1.11.1
(function() {
  var Liquid,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Liquid = require('../../liquid');

  Liquid.Tags.Break = (function(superClass) {
    extend(Break, superClass);

    function Break() {
      return Break.__super__.constructor.apply(this, arguments);
    }

    Break.prototype.interrupt = function() {
      return new Liquid.BreakInterrupt;
    };

    return Break;

  })(Liquid.Tag);

  Liquid.Template.registerTag("break", Liquid.Tags.Break);

}).call(this);

},{"../../liquid":5}],20:[function(require,module,exports){
// Generated by CoffeeScript 1.11.1
(function() {
  var Liquid,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Liquid = require('../../liquid');

  Liquid.Tags.Capture = (function(superClass) {
    var Syntax;

    extend(Capture, superClass);

    Syntax = /(\w+)/;

    function Capture(tagName, markup, tokens) {
      var $;
      if ($ = markup.match(Syntax)) {
        this.to = $[1];
      } else {
        throw new Liquid.SyntaxError("Syntax error in 'capture' - Valid syntax: capture [var]");
      }
      Capture.__super__.constructor.call(this, tagName, markup, tokens);
    }

    Capture.prototype.render = function(context) {
      var last, output;
      output = Capture.__super__.render.call(this, context);
      last = context.scopes.length - 1;
      context.scopes[last][this.to] = output;
      return '';
    };

    return Capture;

  })(Liquid.Block);

  Liquid.Template.registerTag("capture", Liquid.Tags.Capture);

}).call(this);

},{"../../liquid":5}],21:[function(require,module,exports){
// Generated by CoffeeScript 1.11.1
(function() {
  var Liquid,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Liquid = require('../../liquid');

  Liquid.Tags.Case = (function(superClass) {
    var Syntax, WhenSyntax;

    extend(Case, superClass);

    Syntax = RegExp("(" + Liquid.StrictQuotedFragment.source + ")");

    WhenSyntax = RegExp("(" + Liquid.StrictQuotedFragment.source + ")(?:(?:\\s+or\\s+|\\s*\\,\\s*)(" + Liquid.StrictQuotedFragment.source + ".*))?");

    function Case(tagName, markup, tokens) {
      var $;
      this.blocks = [];
      this.nodelist = [];
      if ($ = markup.match(Syntax)) {
        this.left = $[1];
      } else {
        throw new Liquid.SyntaxError("Syntax error in 'case' - Valid syntax: case [condition]");
      }
      Case.__super__.constructor.call(this, tagName, markup, tokens);
    }

    Case.prototype.unknownTag = function(tag, markup, tokens) {
      this.nodelist = [];
      switch (tag) {
        case "when":
          return this.recordWhenCondition(markup);
        case "else":
          return this.recordElseCondition(markup);
        default:
          return Case.__super__.unknownTag.call(this, tag, markup, tokens);
      }
    };

    Case.prototype.render = function(context) {
      var output;
      output = '';
      context.stack((function(_this) {
        return function() {
          var block, execElseBlock, i, len, ref, results;
          execElseBlock = true;
          ref = _this.blocks;
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            block = ref[i];
            if (block["else"]()) {
              if (execElseBlock === true) {
                results.push(output += _this.renderAll(block.attachment, context));
              } else {
                results.push(void 0);
              }
            } else if (block.evaluate(context)) {
              execElseBlock = false;
              results.push(output += _this.renderAll(block.attachment, context));
            } else {
              results.push(void 0);
            }
          }
          return results;
        };
      })(this));
      return output;
    };

    Case.prototype.recordWhenCondition = function(markup) {
      var $, block, results;
      results = [];
      while (markup) {
        if (!($ = markup.match(WhenSyntax))) {
          throw new Liquid.SyntaxError("Syntax error in tag 'case' - Valid when condition: {% when [condition] [or condition2...] %} ");
        }
        markup = $[2];
        block = new Liquid.Condition(this.left, "==", $[1]);
        block.attach(this.nodelist);
        results.push(this.blocks.push(block));
      }
      return results;
    };

    Case.prototype.recordElseCondition = function(markup) {
      var block;
      if ((markup || "").trim() !== "") {
        if ((markup || "").trim() !== "") {
          throw new Liquid.SyntaxError("Syntax error in tag 'case' - Valid else condition: {% else %} (no parameters) ");
        }
      }
      block = new Liquid.ElseCondition();
      block.attach(this.nodelist);
      return this.blocks.push(block);
    };

    return Case;

  })(Liquid.Block);

  Liquid.Template.registerTag("case", Liquid.Tags.Case);

}).call(this);

},{"../../liquid":5}],22:[function(require,module,exports){
// Generated by CoffeeScript 1.11.1
(function() {
  var Liquid,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Liquid = require('../../liquid');

  Liquid.Tags.Comment = (function(superClass) {
    extend(Comment, superClass);

    function Comment() {
      return Comment.__super__.constructor.apply(this, arguments);
    }

    Comment.prototype.render = function(context) {
      return "";
    };

    return Comment;

  })(Liquid.Block);

  Liquid.Template.registerTag("comment", Liquid.Tags.Comment);

}).call(this);

},{"../../liquid":5}],23:[function(require,module,exports){
// Generated by CoffeeScript 1.11.1
(function() {
  var Liquid,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Liquid = require('../../liquid');

  Liquid.Tags.Continue = (function(superClass) {
    extend(Continue, superClass);

    function Continue() {
      return Continue.__super__.constructor.apply(this, arguments);
    }

    Continue.prototype.interrupt = function() {
      return new Liquid.ContinueInterrupt;
    };

    return Continue;

  })(Liquid.Tag);

  Liquid.Template.registerTag("continue", Liquid.Tags.Continue);

}).call(this);

},{"../../liquid":5}],24:[function(require,module,exports){
// Generated by CoffeeScript 1.11.1
(function() {
  var Liquid,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Liquid = require('../../liquid');

  Liquid.Tags.Cycle = (function(superClass) {
    var NamedSyntax, SimpleSyntax;

    extend(Cycle, superClass);

    SimpleSyntax = RegExp("^" + Liquid.StrictQuotedFragment.source);

    NamedSyntax = RegExp("^(" + Liquid.StrictQuotedFragment.source + ")\\s*\\:\\s*(.*)");

    function Cycle(tag, markup, tokens) {
      var $;
      if ($ = markup.match(NamedSyntax)) {
        this.variables = this.variablesFromString($[2]);
        this.name = $[1];
      } else if ($ = markup.match(SimpleSyntax)) {
        this.variables = this.variablesFromString(markup);
        this.name = "'" + (this.variables.toString()) + "'";
      } else {
        throw new Liquid.SyntaxError("Syntax error in 'cycle' - Valid syntax: cycle [name :] var [, var2, var3 ...]");
      }
      Cycle.__super__.constructor.call(this, tag, markup, tokens);
    }

    Cycle.prototype.render = function(context) {
      var base, output;
      (base = context.registers).cycle || (base.cycle = {});
      output = '';
      context.stack((function(_this) {
        return function() {
          var iteration, key, ref, result;
          key = context.get(_this.name);
          iteration = (ref = context.registers.cycle[key]) != null ? ref : 0;
          result = context.get(_this.variables[iteration]);
          iteration += 1;
          if (iteration >= _this.variables.length) {
            iteration = 0;
          }
          context.registers.cycle[key] = iteration;
          return output = result;
        };
      })(this));
      return output;
    };

    Cycle.prototype.variablesFromString = function(markup) {
      var $, i, len, ref, results, varname;
      ref = markup.split(',');
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        varname = ref[i];
        $ = varname.match(RegExp("\\s*(" + Liquid.StrictQuotedFragment.source + ")\\s*"));
        if ($[1]) {
          results.push($[1]);
        } else {
          results.push(null);
        }
      }
      return results;
    };

    return Cycle;

  })(Liquid.Tag);

  Liquid.Template.registerTag("cycle", Liquid.Tags.Cycle);

}).call(this);

},{"../../liquid":5}],25:[function(require,module,exports){
// Generated by CoffeeScript 1.11.1
(function() {
  var Liquid,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Liquid = require('../../liquid');

  Liquid.Tags.Decrement = (function(superClass) {
    extend(Decrement, superClass);

    function Decrement(tagName, markup, tokens) {
      this.variable = markup.trim();
      Decrement.__super__.constructor.call(this, tagName, markup, tokens);
    }

    Decrement.prototype.render = function(context) {
      var base, name, value;
      value = (base = context.scopes[0])[name = this.variable] || (base[name] = 0);
      value = value - 1;
      context.scopes[0][this.variable] = value;
      return value.toString();
    };

    return Decrement;

  })(Liquid.Tag);

  Liquid.Template.registerTag("decrement", Liquid.Tags.Decrement);

}).call(this);

},{"../../liquid":5}],26:[function(require,module,exports){
// Generated by CoffeeScript 1.11.1
(function() {
  var Liquid,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Liquid = require('../../liquid');

  Liquid.Tags.Extends = (function(superClass) {
    var ContentOfVariable, FullToken, IsTag, IsVariable, Syntax;

    extend(Extends, superClass);

    Syntax = RegExp("(" + Liquid.QuotedFragment.source + ")");

    IsTag = RegExp("^" + Liquid.TagStart.source);

    IsVariable = RegExp("^" + Liquid.VariableStart.source);

    FullToken = RegExp("^" + Liquid.TagStart.source + "\\s*(\\w+)\\s*(.*)?" + Liquid.TagEnd.source + "$");

    ContentOfVariable = RegExp("^" + Liquid.VariableStart.source + "(.*)" + Liquid.VariableEnd.source + "$");

    function Extends(tagName, markup, tokens) {
      var $, i, len, m, node, ref;
      if (($ = markup.match(Syntax))) {
        this.templateName = $[1];
      } else {
        throw new Liquid.SyntaxError("Syntax Error in 'extends' - Valid syntax: extends [template]");
      }
      Extends.__super__.constructor.apply(this, arguments);
      m = {};
      ref = this.nodelist;
      for (i = 0, len = ref.length; i < len; i++) {
        node = ref[i];
        if (node instanceof Liquid.Tags.Block) {
          m[node.name] = node;
        }
      }
      this.blocks = m;
    }

    Extends.prototype.parse = function(tokens) {
      return this.parseAll(tokens);
    };

    Extends.prototype.render = function(context) {
      var block, name, parentBlocks, pb, ref, template;
      template = this.loadTemplate(context);
      parentBlocks = this.findBlocks(template.root);
      ref = this.blocks;
      for (name in ref) {
        block = ref[name];
        if ((pb = parentBlocks[name]) != null) {
          pb.parent = block.parent;
          pb.addParent(pb.nodelist);
          pb.nodelist = block.nodelist;
        } else {
          if (this.isExtending(template)) {
            template.root.nodelist.push(block);
          }
        }
      }
      return template.render(context);
    };

    Extends.prototype.parseAll = function(tokens) {
      var $, results, tag, token;
      this.nodelist || (this.nodelist = []);
      this.nodelist.length = 0;
      results = [];
      while ((token = tokens.shift()) != null) {
        if (IsTag.test(token)) {
          if (($ = token.match(FullToken))) {
            if (tag = Liquid.Template.tags[$[1]]) {
              results.push(this.nodelist.push(new tag($[1], $[2], tokens)));
            } else {
              results.push(this.unknownTag($[1], $[2], tokens));
            }
          } else {
            throw new Liquid.SyntaxError("Tag '" + token + "' was not properly terminated with regexp: " + TagEnd.inspect + " ");
          }
        } else if (IsVariable.test(token)) {
          results.push(this.nodelist.push(this.createVariable(token)));
        } else if (token === '') {

        } else {
          results.push(this.nodelist.push(token));
        }
      }
      return results;
    };

    Extends.prototype.loadTemplate = function(context) {
      var source;
      source = Liquid.Template.fileSystem.readTemplateFile(context.get(this.templateName));
      return Liquid.Template.parse(source);
    };

    Extends.prototype.findBlocks = function(node, blocks) {
      var b, i, len, ref;
      if (blocks == null) {
        blocks = {};
      }
      if (node.nodelist != null) {
        b = blocks;
        ref = node.nodelist;
        for (i = 0, len = ref.length; i < len; i++) {
          node = ref[i];
          if (node instanceof Liquid.Tags.Block) {
            b[node.name] = node;
          } else {
            this.findBlocks(node, b);
          }
          b;
        }
      }
      return blocks;
    };

    Extends.prototype.isExtending = function(template) {
      var i, len, node, ref;
      ref = template.root.nodelist;
      for (i = 0, len = ref.length; i < len; i++) {
        node = ref[i];
        if (node instanceof Extends) {
          return true;
        }
      }
      return false;
    };

    return Extends;

  })(Liquid.Block);

  Liquid.Template.registerTag("extends", Liquid.Tags.Extends);

}).call(this);

},{"../../liquid":5}],27:[function(require,module,exports){
// Generated by CoffeeScript 1.11.1
(function() {
  var Liquid,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Liquid = require('../../liquid');

  Liquid.Tags.For = (function(superClass) {
    var Syntax;

    extend(For, superClass);

    Syntax = RegExp("(\\w+)\\s+in\\s+(" + Liquid.StrictQuotedFragment.source + ")\\s*(reversed)?");

    function For(tag, markup, tokens) {
      var $;
      if ($ = markup.match(Syntax)) {
        this.variableName = $[1];
        this.collectionName = $[2];
        this.name = $[1] + "-" + $[2];
        this.reversed = $[3];
        this.attributes = {};
        markup.replace(Liquid.TagAttributes, (function(_this) {
          return function($0, key, value) {
            return _this.attributes[key] = value;
          };
        })(this));
      } else {
        throw new Liquid.SyntaxError("Syntax Error in 'for loop' - Valid syntax: for [item] in [collection]");
      }
      For.__super__.constructor.call(this, tag, markup, tokens);
    }

    For.prototype.render = function(context) {
      var collection, from, k, length, limit, result, segment, to, v;
      if (context.registers["for"] == null) {
        context.registers["for"] = {};
      }
      collection = context.get(this.collectionName);
      if (!Array.isArray(collection)) {
        collection = (function() {
          var results;
          results = [];
          for (k in collection) {
            v = collection[k];
            results.push({
              key: k,
              value: v
            });
          }
          return results;
        })();
      }
      from = this.attributes['offset'] === 'continue' ? context.registers["for"][this.name] : context.get(this.attributes['offset']);
      limit = context.get(this.attributes['limit']);
      to = limit ? limit + from : collection.length;
      segment = collection.slice(from, to);
      if (segment.length === 0) {
        return '';
      }
      if (this.reversed) {
        segment.reverse();
      }
      result = '';
      length = segment.length;
      context.registers["for"][this.name] = from + segment.length;
      context.stack((function(_this) {
        return function() {
          var i, index, interrupt, item, len, results;
          results = [];
          for (index = i = 0, len = segment.length; i < len; index = ++i) {
            item = segment[index];
            context.set(_this.variableName, item);
            context.set('forloop', {
              name: _this.name,
              length: length,
              index: index + 1,
              index0: index,
              rindex: length - index,
              rindex0: length - index - 1,
              first: index === 0,
              last: index === length - 1
            });
            result += _this.renderAll(_this.nodelist, context);
            if (context.hasInterrupt()) {
              interrupt = context.popInterrupt();
              if (interrupt instanceof Liquid.BreakInterrupt) {
                break;
              }
              if (interrupt instanceof Liquid.ContinueInterrupt) {
                continue;
              } else {
                results.push(void 0);
              }
            } else {
              results.push(void 0);
            }
          }
          return results;
        };
      })(this));
      return result;
    };

    return For;

  })(Liquid.Block);

  Liquid.Template.registerTag("for", Liquid.Tags.For);

}).call(this);

},{"../../liquid":5}],28:[function(require,module,exports){
// Generated by CoffeeScript 1.11.1
(function() {
  var Liquid,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Liquid = require('../../liquid');

  Liquid.Tags.If = (function(superClass) {
    var ExpressionsAndOperators, Syntax, SyntaxHelp;

    extend(If, superClass);

    SyntaxHelp = "Syntax Error in tag 'if' - Valid syntax: if [expression]";

    Syntax = RegExp("(" + Liquid.StrictQuotedFragment.source + ")\\s*([=!<>a-z_]+)?\\s*(" + Liquid.StrictQuotedFragment.source + ")?");

    ExpressionsAndOperators = RegExp("(?:\\b(?:\\s?and\\s?|\\s?or\\s?)\\b|(?:\\s*(?!\\b(?:\\s?and\\s?|\\s?or\\s?)\\b)(?:" + Liquid.StrictQuotedFragment.source + "|\\S+)\\s*)+)", "g");

    function If(tag, markup, tokens) {
      this.nodelist = [];
      this.blocks = [];
      this.pushBlock("if", markup);
      If.__super__.constructor.call(this, tag, markup, tokens);
    }

    If.prototype.unknownTag = function(tag, markup, tokens) {
      if (tag === "elsif" || tag === "else") {
        return this.pushBlock(tag, markup);
      } else {
        return If.__super__.unknownTag.call(this, tag, markup, tokens);
      }
    };

    If.prototype.render = function(context) {
      var output;
      output = '';
      context.stack((function(_this) {
        return function() {
          var block, i, len, ref;
          ref = _this.blocks;
          for (i = 0, len = ref.length; i < len; i++) {
            block = ref[i];
            if (block.evaluate(context)) {
              output = _this.renderAll(block.attachment, context);
              return;
            }
          }
          return '';
        };
      })(this));
      return output;
    };

    If.prototype.pushBlock = function(tag, markup) {
      var $, block, condition, expressions, newCondition, operator;
      block = (function() {
        if (tag === 'else') {
          return new Liquid.ElseCondition;
        } else {
          expressions = markup.match(ExpressionsAndOperators).reverse();
          if (!($ = expressions.shift().match(Syntax))) {
            throw new Liquid.SyntaxError(SyntaxHelp);
          }
          condition = new Liquid.Condition($[1], $[2], $[3]);
          while (expressions.length > 0) {
            operator = expressions.shift();
            if (!expressions.shift().match(Syntax)) {
              throw new Liquid.SyntaxError(SyntaxHelp);
            }
            newCondition = new Liquid.Condition($[1], $[2], $[3]);
            newCondition[operator](condition);
            condition = newCondition;
          }
          return condition;
        }
      })();
      this.blocks.push(block);
      return this.nodelist = block.attach([]);
    };

    return If;

  })(Liquid.Block);

  Liquid.Template.registerTag("if", Liquid.Tags.If);

}).call(this);

},{"../../liquid":5}],29:[function(require,module,exports){
// Generated by CoffeeScript 1.11.1
(function() {
  var Liquid,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Liquid = require('../../liquid');

  Liquid.Tags.IfChanged = (function(superClass) {
    extend(IfChanged, superClass);

    function IfChanged() {
      return IfChanged.__super__.constructor.apply(this, arguments);
    }

    IfChanged.prototype.render = function(context) {
      var output;
      output = "";
      context.stack((function(_this) {
        return function() {
          output = _this.renderAll(_this.nodelist, context);
          if (output !== context.registers.ifchanged) {
            return context.registers.ifchanged = output;
          } else {
            return output = '';
          }
        };
      })(this));
      return output;
    };

    return IfChanged;

  })(Liquid.Block);

  Liquid.Template.registerTag("ifchanged", Liquid.Tags.IfChanged);

}).call(this);

},{"../../liquid":5}],30:[function(require,module,exports){
// Generated by CoffeeScript 1.11.1
(function() {
  var Include, Liquid,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Liquid = require('../../liquid');

  Include = (function(superClass) {
    var Syntax;

    extend(Include, superClass);

    Syntax = RegExp("(" + Liquid.StrictQuotedFragment.source + ")(\\s+(?:with|for)\\s+(" + Liquid.StrictQuotedFragment.source + "))?");

    function Include(tag, markup, tokens) {
      var $;
      if ($ = markup.match(Syntax)) {
        this.templateName = $[1];
        this.variableName = $[3];
        this.attributes = {};
        markup.replace(Liquid.TagAttributes, (function(_this) {
          return function(key, value) {
            var ref;
            ref = key.split(':'), key = ref[0], value = ref[1];
            return _this.attributes[key] = value;
          };
        })(this));
      } else {
        throw new Liquid.SyntaxError("Error in tag 'include' - Valid syntax: include '[template]' (with|for) [object|collection]");
      }
      Include.__super__.constructor.call(this, tag, markup, tokens);
    }

    Include.prototype.render = function(context) {
      var output, partial, source, variable;
      source = Include.readTemplateFromFileSystem(context, this.templateName);
      partial = Liquid.Template.parse(source);
      variable = context.get(this.variableName || this.templateName.slice(1, -1));
      output = '';
      context.stack((function(_this) {
        return function() {
          var i, key, len, ref, results, v, value;
          ref = _this.attributes;
          for (key in ref) {
            value = ref[key];
            context.set(key, context.get(value));
          }
          if (variable instanceof Array) {
            output = '';
            results = [];
            for (i = 0, len = variable.length; i < len; i++) {
              v = variable[i];
              context.set(_this.templateName.slice(1, -1), v);
              results.push(output += partial.render(context));
            }
            return results;
          } else {
            context.set(_this.templateName.slice(1, -1), variable);
            return output = partial.render(context);
          }
        };
      })(this));
      return output;
    };

    Include.readTemplateFromFileSystem = function(context, templateName) {
      var fileSystem;
      fileSystem = context.registers.fileSystem || Liquid.Template.fileSystem;
      return fileSystem.readTemplateFile(context.get(templateName));
    };

    return Include;

  })(Liquid.Tag);

  Liquid.Template.registerTag("include", Include);

}).call(this);

},{"../../liquid":5}],31:[function(require,module,exports){
// Generated by CoffeeScript 1.11.1
(function() {
  var Liquid,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Liquid = require('../../liquid');

  Liquid.Tags.Increment = (function(superClass) {
    extend(Increment, superClass);

    function Increment(tagName, markup, tokens) {
      this.variable = markup.trim();
      Increment.__super__.constructor.call(this, tagName, markup, tokens);
    }

    Increment.prototype.render = function(context) {
      var value;
      if (context.scopes[0][this.variable] != null) {
        value = context.scopes[0][this.variable];
      } else {
        value = context.scopes[0][this.variable] = -1;
      }
      value = value + 1;
      context.scopes[0][this.variable] = value;
      return value.toString();
    };

    return Increment;

  })(Liquid.Tag);

  Liquid.Template.registerTag("increment", Liquid.Tags.Increment);

}).call(this);

},{"../../liquid":5}],32:[function(require,module,exports){
// Generated by CoffeeScript 1.11.1
(function() {
  var Liquid,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Liquid = require('../../liquid');

  Liquid.Tags.Raw = (function(superClass) {
    var FullToken;

    extend(Raw, superClass);

    FullToken = RegExp("^" + Liquid.TagStart.source + "\\s*(\\w+)\\s*(.*)?" + Liquid.TagEnd.source + "$");

    function Raw(tag, markup, tokens) {
      Raw.__super__.constructor.call(this, tag, markup, tokens);
    }

    Raw.prototype.parse = function(tokens) {
      var $, token;
      this.nodelist || (this.nodelist = []);
      this.nodelist.length = 0;
      while ((token = tokens.shift()) != null) {
        if ($ = token.match(FullToken)) {
          if (this.blockDelimiter === $[1]) {
            this.endTag();
            return;
          }
        }
        if (typeof token !== "undefined" && token !== null) {
          this.nodelist.push(token);
        }
      }
    };

    return Raw;

  })(Liquid.Block);

  Liquid.Template.registerTag("raw", Liquid.Tags.Raw);

}).call(this);

},{"../../liquid":5}],33:[function(require,module,exports){
// Generated by CoffeeScript 1.11.1
(function() {
  var Liquid,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Liquid = require('../../liquid');

  Liquid.Tags.Unless = (function(superClass) {
    extend(Unless, superClass);

    function Unless() {
      return Unless.__super__.constructor.apply(this, arguments);
    }

    Unless.prototype.render = function(context) {
      var output;
      output = '';
      context.stack((function(_this) {
        return function() {
          var block, i, len, ref;
          block = _this.blocks[0];
          if (!block.evaluate(context)) {
            output = _this.renderAll(block.attachment, context);
            return;
          }
          ref = _this.blocks.slice(1);
          for (i = 0, len = ref.length; i < len; i++) {
            block = ref[i];
            if (block.evaluate(context)) {
              output = _this.renderAll(block.attachment, context);
              return;
            }
          }
          return '';
        };
      })(this));
      return output;
    };

    return Unless;

  })(Liquid.Tags.If);

  Liquid.Template.registerTag("unless", Liquid.Tags.Unless);

}).call(this);

},{"../../liquid":5}],34:[function(require,module,exports){
// Generated by CoffeeScript 1.11.1
(function() {
  var Liquid,
    slice = [].slice;

  Liquid = require('../liquid');

  Liquid.Template = (function() {
    Template.fileSystem = new Liquid.BlankFileSystem();

    Template.tags = {};

    Template.registerTag = function(name, klass) {
      return Liquid.Template.tags[name] = klass;
    };

    Template.registerFilter = function(mod) {
      return Liquid.Strainer.globalFilter(mod);
    };

    Template.parse = function(source) {
      var template;
      template = new Liquid.Template;
      template.parse(source);
      return template;
    };

    function Template() {
      this.root = null;
      this.registers = {};
      this.assigns = {};
      this.instanceAssigns = {};
      this.errors = [];
      this.rethrowErrors = false;
    }

    Template.prototype.parse = function(src) {
      this.root = new Liquid.Document(Liquid.Template.tokenize(src));
      return this;
    };

    Template.prototype.render = function() {
      var args, context, key, last, options, ref, result, val;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      if (this.root === null) {
        return '';
      }
      context = (function() {
        if (args[0] instanceof Liquid.Context) {
          return args.shift();
        } else if (args[0] instanceof Object) {
          return new Liquid.Context([args.shift(), this.assigns], this.instanceAssigns, this.registers, this.rethrowErrors);
        } else if (args[0] == null) {
          return new Liquid.Context(this.assigns, this.instanceAssigns, this.registers, this.rethrowErrors);
        } else {
          throw new Liquid.ArgumentErro("Expect Hash or Liquid::Context as parameter");
        }
      }).call(this);
      last = args.length - 1;
      if (args[last] instanceof Object) {
        options = args.pop();
        if ('registers' in options) {
          ref = options.registers;
          for (key in ref) {
            val = ref[key];
            this.registers[key] = val;
          }
        }
        if ('filters' in options) {
          context.addFilters(options.filters);
        }
      } else if (args[last] instanceof Function) {
        context.addFilters(args.pop());
      } else if (args[last] instanceof Array) {
        context.addFilters(args.pop());
      }
      try {
        result = this.root.render(context);
        if (result.join != null) {
          return result.join('');
        } else {
          return result;
        }
      } catch (error) {
        return this.errors = context.errors;
      }
    };

    Template.prototype.renderWithErrors = function() {
      var res, savedRethrowErrors;
      savedRethrowErrors = this.rethrowErrors;
      this.rethrowErrors = true;
      res = this.render.apply(this, arguments);
      this.rethrowErrors = savedRethrowErrors;
      return res;
    };

    Template.tokenize = function(source) {
      var tokens;
      if (source == null) {
        source = '';
      }
      if (source.source != null) {
        source = source.source;
      }
      if (source === '') {
        return [];
      }
      tokens = source.split(Liquid.TemplateParser);
      if (tokens[0] === '') {
        tokens.shift();
      }
      return tokens;
    };

    return Template;

  })();

}).call(this);

},{"../liquid":5}],35:[function(require,module,exports){
// Generated by CoffeeScript 1.11.1
(function() {
  var compact, flatten;

  compact = function($this) {
    var $that, i, len, results;
    results = [];
    for (i = 0, len = $this.length; i < len; i++) {
      $that = $this[i];
      if ($that) {
        results.push($that);
      }
    }
    return results;
  };

  flatten = function($list) {
    var $a, $item, i, len;
    if ($list == null) {
      return [];
    }
    $a = [];
    for (i = 0, len = $list.length; i < len; i++) {
      $item = $list[i];
      if (Array.isArray($item)) {
        $a = $a.concat(flatten($item));
      } else {
        $a.push($item);
      }
    }
    return $a;
  };

  module.exports = {
    compact: compact,
    flatten: flatten
  };

}).call(this);

},{}],36:[function(require,module,exports){
// Generated by CoffeeScript 1.11.1
(function() {
  var Liquid,
    slice = [].slice;

  Liquid = require('../liquid');

  Liquid.Variable = (function() {
    var FilterParser, compact, flatten, ref;

    FilterParser = RegExp("(?:" + Liquid.FilterSeparator.source + "|(?:\\s*(?!(?:" + Liquid.FilterSeparator.source + "))(?:" + Liquid.QuotedFragment.source + "|\\S+)\\s*)+)");

    ref = require('./util'), compact = ref.compact, flatten = ref.flatten;

    function Variable(markup) {
      var f, filterargs, filtername, filters, i, len, match, matches;
      this.markup = markup;
      this.name = null;
      this.filters = [];
      if (match = markup.match(RegExp("\\s*(" + Liquid.QuotedFragment.source + ")(.*)"))) {
        this.name = match[1];
        if (match[2].match(RegExp(Liquid.FilterSeparator.source + "\\s*(.*)"))) {
          filters = match[2].match(RegExp("" + FilterParser.source, "g"));
          for (i = 0, len = filters.length; i < len; i++) {
            f = filters[i];
            if (matches = f.match(/\s*(\w+)/)) {
              filtername = matches[1];
              filterargs = f.split(RegExp("(?:" + Liquid.FilterArgumentSeparator + "|" + Liquid.ArgumentSeparator + ")\\s*(" + Liquid.QuotedFragment.source + ")"));
              filterargs.shift();
              filterargs.pop();
              this.filters.push([filtername, compact(flatten(filterargs))]);
            }
          }
        }
      }
    }

    Variable.prototype.render = function(context) {
      var a, e, filter, filterargs, i, j, len, len1, output, ref1, ref2;
      if (this.name == null) {
        return '';
      }
      output = context.get(this.name);
      ref1 = this.filters;
      for (i = 0, len = ref1.length; i < len; i++) {
        filter = ref1[i];
        filterargs = [];
        ref2 = filter[1];
        for (j = 0, len1 = ref2.length; j < len1; j++) {
          a = ref2[j];
          filterargs.push(context.get(a));
        }
        try {
          output = context.invoke.apply(context, [filter[0], output].concat(slice.call(filterargs)));
        } catch (error) {
          e = error;
          throw new Liquid.FilterNotFound("Error - filter '" + filter[0] + "' in '" + (this.markup.trim()) + "' could not be found.");
        }
      }
      return output;
    };

    return Variable;

  })();

}).call(this);

},{"../liquid":5,"./util":35}],37:[function(require,module,exports){
// Generated by CoffeeScript 1.11.1
(function() {
  var Liquid;

  Liquid = require('../liquid');

  Liquid.VERSION = require('../../package.json').version;

}).call(this);

},{"../../package.json":39,"../liquid":5}],38:[function(require,module,exports){
//
// strftime
// github.com/samsonjs/strftime
// @_sjs
//
// Copyright 2010 - 2013 Sami Samhuri <sami@samhuri.net>
//
// MIT License
// http://sjs.mit-license.org
//

;(function() {

  //// Where to export the API
  var namespace;

  // CommonJS / Node module
  if (typeof module !== 'undefined') {
    namespace = module.exports = strftime;
  }

  // Browsers and other environments
  else {
    // Get the global object. Works in ES3, ES5, and ES5 strict mode.
    namespace = (function(){ return this || (1,eval)('this') }());
  }

  function words(s) { return (s || '').split(' '); }

  var DefaultLocale =
  { days: words('Sunday Monday Tuesday Wednesday Thursday Friday Saturday')
  , shortDays: words('Sun Mon Tue Wed Thu Fri Sat')
  , months: words('January February March April May June July August September October November December')
  , shortMonths: words('Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec')
  , AM: 'AM'
  , PM: 'PM'
  , am: 'am'
  , pm: 'pm'
  };

  namespace.strftime = strftime;
  function strftime(fmt, d, locale) {
    return _strftime(fmt, d, locale);
  }

  // locale is optional
  namespace.strftimeTZ = strftime.strftimeTZ = strftimeTZ;
  function strftimeTZ(fmt, d, locale, timezone) {
    if (typeof locale == 'number' && timezone == null) {
      timezone = locale;
      locale = undefined;
    }
    return _strftime(fmt, d, locale, { timezone: timezone });
  }

  namespace.strftimeUTC = strftime.strftimeUTC = strftimeUTC;
  function strftimeUTC(fmt, d, locale) {
    return _strftime(fmt, d, locale, { utc: true });
  }

  namespace.localizedStrftime = strftime.localizedStrftime = localizedStrftime;
  function localizedStrftime(locale) {
    return function(fmt, d, options) {
      return strftime(fmt, d, locale, options);
    };
  }

  // d, locale, and options are optional, but you can't leave
  // holes in the argument list. If you pass options you have to pass
  // in all the preceding args as well.
  //
  // options:
  //   - locale   [object] an object with the same structure as DefaultLocale
  //   - timezone [number] timezone offset in minutes from GMT
  function _strftime(fmt, d, locale, options) {
    options = options || {};

    // d and locale are optional so check if d is really the locale
    if (d && !quacksLikeDate(d)) {
      locale = d;
      d = undefined;
    }
    d = d || new Date();

    locale = locale || DefaultLocale;
    locale.formats = locale.formats || {};

    // Hang on to this Unix timestamp because we might mess with it directly below.
    var timestamp = d.getTime();

    if (options.utc || typeof options.timezone == 'number') {
      d = dateToUTC(d);
    }

    if (typeof options.timezone == 'number') {
      d = new Date(d.getTime() + (options.timezone * 60000));
    }

    // Most of the specifiers supported by C's strftime, and some from Ruby.
    // Some other syntax extensions from Ruby are supported: %-, %_, and %0
    // to pad with nothing, space, or zero (respectively).
    return fmt.replace(/%([-_0]?.)/g, function(_, c) {
      var mod, padding;
      if (c.length == 2) {
        mod = c[0];
        // omit padding
        if (mod == '-') {
          padding = '';
        }
        // pad with space
        else if (mod == '_') {
          padding = ' ';
        }
        // pad with zero
        else if (mod == '0') {
          padding = '0';
        }
        else {
          // unrecognized, return the format
          return _;
        }
        c = c[1];
      }
      switch (c) {
        case 'A': return locale.days[d.getDay()];
        case 'a': return locale.shortDays[d.getDay()];
        case 'B': return locale.months[d.getMonth()];
        case 'b': return locale.shortMonths[d.getMonth()];
        case 'C': return pad(Math.floor(d.getFullYear() / 100), padding);
        case 'D': return _strftime(locale.formats.D || '%m/%d/%y', d, locale);
        case 'd': return pad(d.getDate(), padding);
        case 'e': return d.getDate();
        case 'F': return _strftime(locale.formats.F || '%Y-%m-%d', d, locale);
        case 'H': return pad(d.getHours(), padding);
        case 'h': return locale.shortMonths[d.getMonth()];
        case 'I': return pad(hours12(d), padding);
        case 'j':
          var y = new Date(d.getFullYear(), 0, 1);
          var day = Math.ceil((d.getTime() - y.getTime()) / (1000 * 60 * 60 * 24));
          return pad(day, 3);
        case 'k': return pad(d.getHours(), padding == null ? ' ' : padding);
        case 'L': return pad(Math.floor(timestamp % 1000), 3);
        case 'l': return pad(hours12(d), padding == null ? ' ' : padding);
        case 'M': return pad(d.getMinutes(), padding);
        case 'm': return pad(d.getMonth() + 1, padding);
        case 'n': return '\n';
        case 'o': return String(d.getDate()) + ordinal(d.getDate());
        case 'P': return d.getHours() < 12 ? locale.am : locale.pm;
        case 'p': return d.getHours() < 12 ? locale.AM : locale.PM;
        case 'R': return _strftime(locale.formats.R || '%H:%M', d, locale);
        case 'r': return _strftime(locale.formats.r || '%I:%M:%S %p', d, locale);
        case 'S': return pad(d.getSeconds(), padding);
        case 's': return Math.floor(timestamp / 1000);
        case 'T': return _strftime(locale.formats.T || '%H:%M:%S', d, locale);
        case 't': return '\t';
        case 'U': return pad(weekNumber(d, 'sunday'), padding);
        case 'u':
          var day = d.getDay();
          return day == 0 ? 7 : day; // 1 - 7, Monday is first day of the week
        case 'v': return _strftime(locale.formats.v || '%e-%b-%Y', d, locale);
        case 'W': return pad(weekNumber(d, 'monday'), padding);
        case 'w': return d.getDay(); // 0 - 6, Sunday is first day of the week
        case 'Y': return d.getFullYear();
        case 'y':
          var y = String(d.getFullYear());
          return y.slice(y.length - 2);
        case 'Z':
          if (options.utc) {
            return "GMT";
          }
          else {
            var tz = d.toString().match(/\((\w+)\)/);
            return tz && tz[1] || '';
          }
        case 'z':
          if (options.utc) {
            return "+0000";
          }
          else {
            var off = typeof options.timezone == 'number' ? options.timezone : -d.getTimezoneOffset();
            return (off < 0 ? '-' : '+') + pad(Math.abs(off / 60)) + pad(off % 60);
          }
        default: return c;
      }
    });
  }

  function dateToUTC(d) {
    var msDelta = (d.getTimezoneOffset() || 0) * 60000;
    return new Date(d.getTime() + msDelta);
  }

  var RequiredDateMethods = ['getTime', 'getTimezoneOffset', 'getDay', 'getDate', 'getMonth', 'getFullYear', 'getYear', 'getHours', 'getMinutes', 'getSeconds'];
  function quacksLikeDate(x) {
    var i = 0
      , n = RequiredDateMethods.length
      ;
    for (i = 0; i < n; ++i) {
      if (typeof x[RequiredDateMethods[i]] != 'function') {
        return false;
      }
    }
    return true;
  }

  // Default padding is '0' and default length is 2, both are optional.
  function pad(n, padding, length) {
    // pad(n, <length>)
    if (typeof padding === 'number') {
      length = padding;
      padding = '0';
    }

    // Defaults handle pad(n) and pad(n, <padding>)
    if (padding == null) {
      padding = '0';
    }
    length = length || 2;

    var s = String(n);
    // padding may be an empty string, don't loop forever if it is
    if (padding) {
      while (s.length < length) s = padding + s;
    }
    return s;
  }

  function hours12(d) {
    var hour = d.getHours();
    if (hour == 0) hour = 12;
    else if (hour > 12) hour -= 12;
    return hour;
  }

  // Get the ordinal suffix for a number: st, nd, rd, or th
  function ordinal(n) {
    var i = n % 10
      , ii = n % 100
      ;
    if ((ii >= 11 && ii <= 13) || i === 0 || i >= 4) {
      return 'th';
    }
    switch (i) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
    }
  }

  // firstWeekday: 'sunday' or 'monday', default is 'sunday'
  //
  // Pilfered & ported from Ruby's strftime implementation.
  function weekNumber(d, firstWeekday) {
    firstWeekday = firstWeekday || 'sunday';

    // This works by shifting the weekday back by one day if we
    // are treating Monday as the first day of the week.
    var wday = d.getDay();
    if (firstWeekday == 'monday') {
      if (wday == 0) // Sunday
        wday = 6;
      else
        wday--;
    }
    var firstDayOfYear = new Date(d.getFullYear(), 0, 1)
      , yday = (d - firstDayOfYear) / 86400000
      , weekNum = (yday + 7 - wday) / 7
      ;
    return Math.floor(weekNum);
  }

}());

},{}],39:[function(require,module,exports){
module.exports={
  "name": "liquid.coffee",
  "version": "0.1.6",
  "description": "Port of Liquid to CoffeeScript",
  "keywords": [
    "Liquid",
    "templates",
    "coffee-script"
  ],
  "author": "bruce davidson <brucedavidson@darkoverlordofdata.com>",
  "contributors": [
    {
      "name": "bruce davidson",
      "email": "brucedavidson@darkoverlordofdata.com"
    }
  ],
  "dependencies": {
    "strftime": "~0.7.0"
  },
  "scripts": {
    "clean": "rimraf dist/*",
    "build": "cake build",
    "prebuild": "npm run clean",
    "test": "NODE_ENV=test mocha --compilers coffee:coffee-script --require test/test_helper.js --recursive"
  },
  "bin": {},
  "devDependencies": {
    "async": "*",
    "chai": "*",
    "coffee-script": "*",
    "gulp": "^3.9.0",
    "gulp-shell": "^0.4.2",
    "mocha": "*",
    "q": "~1.1.1",
    "rimraf": "^2.4.2"
  },
  "directories": {
    "lib": "./lib",
    "example": "./example"
  },
  "repository": "git://github.com/darkoverlordofdata/liquid.coffee",
  "main": "index",
  "engines": {
    "node": ">=0.10.x",
    "npm": ">=1.x.x"
  },
  "license": "MIT"
}

},{}]},{},[5])(5)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy5ucG0tZ2xvYmFsL2xpYi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiLi4vLi4vLm5wbS1nbG9iYWwvbGliL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L2xpYi9fZW1wdHkuanMiLCIuLi8uLi8ubnBtLWdsb2JhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3BhdGgtYnJvd3NlcmlmeS9pbmRleC5qcyIsIi4uLy4uLy5ucG0tZ2xvYmFsL2xpYi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibGliL2V4dHJhcy9saXF1aWRWaWV3LmpzIiwibGliL2xpcXVpZC5qcyIsImxpYi9saXF1aWQvYmxvY2suanMiLCJsaWIvbGlxdWlkL2NvbmRpdGlvbi5qcyIsImxpYi9saXF1aWQvY29udGV4dC5qcyIsImxpYi9saXF1aWQvZG9jdW1lbnQuanMiLCJsaWIvbGlxdWlkL2Ryb3AuanMiLCJsaWIvbGlxdWlkL2Vycm9ycy5qcyIsImxpYi9saXF1aWQvZmlsZXN5c3RlbS5qcyIsImxpYi9saXF1aWQvaW50ZXJydXB0cy5qcyIsImxpYi9saXF1aWQvc3RhbmRhcmRmaWx0ZXJzLmpzIiwibGliL2xpcXVpZC9zdHJhaW5lci5qcyIsImxpYi9saXF1aWQvdGFnLmpzIiwibGliL2xpcXVpZC90YWdzL2Fzc2lnbi5qcyIsImxpYi9saXF1aWQvdGFncy9ibG9jay5qcyIsImxpYi9saXF1aWQvdGFncy9icmVhay5qcyIsImxpYi9saXF1aWQvdGFncy9jYXB0dXJlLmpzIiwibGliL2xpcXVpZC90YWdzL2Nhc2UuanMiLCJsaWIvbGlxdWlkL3RhZ3MvY29tbWVudC5qcyIsImxpYi9saXF1aWQvdGFncy9jb250aW51ZS5qcyIsImxpYi9saXF1aWQvdGFncy9jeWNsZS5qcyIsImxpYi9saXF1aWQvdGFncy9kZWNyZW1lbnQuanMiLCJsaWIvbGlxdWlkL3RhZ3MvZXh0ZW5kcy5qcyIsImxpYi9saXF1aWQvdGFncy9mb3IuanMiLCJsaWIvbGlxdWlkL3RhZ3MvaWYuanMiLCJsaWIvbGlxdWlkL3RhZ3MvaWZjaGFuZ2VkLmpzIiwibGliL2xpcXVpZC90YWdzL2luY2x1ZGUuanMiLCJsaWIvbGlxdWlkL3RhZ3MvaW5jcmVtZW50LmpzIiwibGliL2xpcXVpZC90YWdzL3Jhdy5qcyIsImxpYi9saXF1aWQvdGFncy91bmxlc3MuanMiLCJsaWIvbGlxdWlkL3RlbXBsYXRlLmpzIiwibGliL2xpcXVpZC91dGlsLmpzIiwibGliL2xpcXVpZC92YXJpYWJsZS5qcyIsImxpYi9saXF1aWQvdmVyc2lvbi5qcyIsIm5vZGVfbW9kdWxlcy9zdHJmdGltZS9zdHJmdGltZS5qcyIsInBhY2thZ2UuanNvbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOzs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNoT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9LQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIiLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuLy8gcmVzb2x2ZXMgLiBhbmQgLi4gZWxlbWVudHMgaW4gYSBwYXRoIGFycmF5IHdpdGggZGlyZWN0b3J5IG5hbWVzIHRoZXJlXG4vLyBtdXN0IGJlIG5vIHNsYXNoZXMsIGVtcHR5IGVsZW1lbnRzLCBvciBkZXZpY2UgbmFtZXMgKGM6XFwpIGluIHRoZSBhcnJheVxuLy8gKHNvIGFsc28gbm8gbGVhZGluZyBhbmQgdHJhaWxpbmcgc2xhc2hlcyAtIGl0IGRvZXMgbm90IGRpc3Rpbmd1aXNoXG4vLyByZWxhdGl2ZSBhbmQgYWJzb2x1dGUgcGF0aHMpXG5mdW5jdGlvbiBub3JtYWxpemVBcnJheShwYXJ0cywgYWxsb3dBYm92ZVJvb3QpIHtcbiAgLy8gaWYgdGhlIHBhdGggdHJpZXMgdG8gZ28gYWJvdmUgdGhlIHJvb3QsIGB1cGAgZW5kcyB1cCA+IDBcbiAgdmFyIHVwID0gMDtcbiAgZm9yICh2YXIgaSA9IHBhcnRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgdmFyIGxhc3QgPSBwYXJ0c1tpXTtcbiAgICBpZiAobGFzdCA9PT0gJy4nKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgfSBlbHNlIGlmIChsYXN0ID09PSAnLi4nKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgICB1cCsrO1xuICAgIH0gZWxzZSBpZiAodXApIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICAgIHVwLS07XG4gICAgfVxuICB9XG5cbiAgLy8gaWYgdGhlIHBhdGggaXMgYWxsb3dlZCB0byBnbyBhYm92ZSB0aGUgcm9vdCwgcmVzdG9yZSBsZWFkaW5nIC4uc1xuICBpZiAoYWxsb3dBYm92ZVJvb3QpIHtcbiAgICBmb3IgKDsgdXAtLTsgdXApIHtcbiAgICAgIHBhcnRzLnVuc2hpZnQoJy4uJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHBhcnRzO1xufVxuXG4vLyBTcGxpdCBhIGZpbGVuYW1lIGludG8gW3Jvb3QsIGRpciwgYmFzZW5hbWUsIGV4dF0sIHVuaXggdmVyc2lvblxuLy8gJ3Jvb3QnIGlzIGp1c3QgYSBzbGFzaCwgb3Igbm90aGluZy5cbnZhciBzcGxpdFBhdGhSZSA9XG4gICAgL14oXFwvP3wpKFtcXHNcXFNdKj8pKCg/OlxcLnsxLDJ9fFteXFwvXSs/fCkoXFwuW14uXFwvXSp8KSkoPzpbXFwvXSopJC87XG52YXIgc3BsaXRQYXRoID0gZnVuY3Rpb24oZmlsZW5hbWUpIHtcbiAgcmV0dXJuIHNwbGl0UGF0aFJlLmV4ZWMoZmlsZW5hbWUpLnNsaWNlKDEpO1xufTtcblxuLy8gcGF0aC5yZXNvbHZlKFtmcm9tIC4uLl0sIHRvKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5yZXNvbHZlID0gZnVuY3Rpb24oKSB7XG4gIHZhciByZXNvbHZlZFBhdGggPSAnJyxcbiAgICAgIHJlc29sdmVkQWJzb2x1dGUgPSBmYWxzZTtcblxuICBmb3IgKHZhciBpID0gYXJndW1lbnRzLmxlbmd0aCAtIDE7IGkgPj0gLTEgJiYgIXJlc29sdmVkQWJzb2x1dGU7IGktLSkge1xuICAgIHZhciBwYXRoID0gKGkgPj0gMCkgPyBhcmd1bWVudHNbaV0gOiBwcm9jZXNzLmN3ZCgpO1xuXG4gICAgLy8gU2tpcCBlbXB0eSBhbmQgaW52YWxpZCBlbnRyaWVzXG4gICAgaWYgKHR5cGVvZiBwYXRoICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnRzIHRvIHBhdGgucmVzb2x2ZSBtdXN0IGJlIHN0cmluZ3MnKTtcbiAgICB9IGVsc2UgaWYgKCFwYXRoKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICByZXNvbHZlZFBhdGggPSBwYXRoICsgJy8nICsgcmVzb2x2ZWRQYXRoO1xuICAgIHJlc29sdmVkQWJzb2x1dGUgPSBwYXRoLmNoYXJBdCgwKSA9PT0gJy8nO1xuICB9XG5cbiAgLy8gQXQgdGhpcyBwb2ludCB0aGUgcGF0aCBzaG91bGQgYmUgcmVzb2x2ZWQgdG8gYSBmdWxsIGFic29sdXRlIHBhdGgsIGJ1dFxuICAvLyBoYW5kbGUgcmVsYXRpdmUgcGF0aHMgdG8gYmUgc2FmZSAobWlnaHQgaGFwcGVuIHdoZW4gcHJvY2Vzcy5jd2QoKSBmYWlscylcblxuICAvLyBOb3JtYWxpemUgdGhlIHBhdGhcbiAgcmVzb2x2ZWRQYXRoID0gbm9ybWFsaXplQXJyYXkoZmlsdGVyKHJlc29sdmVkUGF0aC5zcGxpdCgnLycpLCBmdW5jdGlvbihwKSB7XG4gICAgcmV0dXJuICEhcDtcbiAgfSksICFyZXNvbHZlZEFic29sdXRlKS5qb2luKCcvJyk7XG5cbiAgcmV0dXJuICgocmVzb2x2ZWRBYnNvbHV0ZSA/ICcvJyA6ICcnKSArIHJlc29sdmVkUGF0aCkgfHwgJy4nO1xufTtcblxuLy8gcGF0aC5ub3JtYWxpemUocGF0aClcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMubm9ybWFsaXplID0gZnVuY3Rpb24ocGF0aCkge1xuICB2YXIgaXNBYnNvbHV0ZSA9IGV4cG9ydHMuaXNBYnNvbHV0ZShwYXRoKSxcbiAgICAgIHRyYWlsaW5nU2xhc2ggPSBzdWJzdHIocGF0aCwgLTEpID09PSAnLyc7XG5cbiAgLy8gTm9ybWFsaXplIHRoZSBwYXRoXG4gIHBhdGggPSBub3JtYWxpemVBcnJheShmaWx0ZXIocGF0aC5zcGxpdCgnLycpLCBmdW5jdGlvbihwKSB7XG4gICAgcmV0dXJuICEhcDtcbiAgfSksICFpc0Fic29sdXRlKS5qb2luKCcvJyk7XG5cbiAgaWYgKCFwYXRoICYmICFpc0Fic29sdXRlKSB7XG4gICAgcGF0aCA9ICcuJztcbiAgfVxuICBpZiAocGF0aCAmJiB0cmFpbGluZ1NsYXNoKSB7XG4gICAgcGF0aCArPSAnLyc7XG4gIH1cblxuICByZXR1cm4gKGlzQWJzb2x1dGUgPyAnLycgOiAnJykgKyBwYXRoO1xufTtcblxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5pc0Fic29sdXRlID0gZnVuY3Rpb24ocGF0aCkge1xuICByZXR1cm4gcGF0aC5jaGFyQXQoMCkgPT09ICcvJztcbn07XG5cbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMuam9pbiA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcGF0aHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xuICByZXR1cm4gZXhwb3J0cy5ub3JtYWxpemUoZmlsdGVyKHBhdGhzLCBmdW5jdGlvbihwLCBpbmRleCkge1xuICAgIGlmICh0eXBlb2YgcCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyB0byBwYXRoLmpvaW4gbXVzdCBiZSBzdHJpbmdzJyk7XG4gICAgfVxuICAgIHJldHVybiBwO1xuICB9KS5qb2luKCcvJykpO1xufTtcblxuXG4vLyBwYXRoLnJlbGF0aXZlKGZyb20sIHRvKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5yZWxhdGl2ZSA9IGZ1bmN0aW9uKGZyb20sIHRvKSB7XG4gIGZyb20gPSBleHBvcnRzLnJlc29sdmUoZnJvbSkuc3Vic3RyKDEpO1xuICB0byA9IGV4cG9ydHMucmVzb2x2ZSh0bykuc3Vic3RyKDEpO1xuXG4gIGZ1bmN0aW9uIHRyaW0oYXJyKSB7XG4gICAgdmFyIHN0YXJ0ID0gMDtcbiAgICBmb3IgKDsgc3RhcnQgPCBhcnIubGVuZ3RoOyBzdGFydCsrKSB7XG4gICAgICBpZiAoYXJyW3N0YXJ0XSAhPT0gJycpIGJyZWFrO1xuICAgIH1cblxuICAgIHZhciBlbmQgPSBhcnIubGVuZ3RoIC0gMTtcbiAgICBmb3IgKDsgZW5kID49IDA7IGVuZC0tKSB7XG4gICAgICBpZiAoYXJyW2VuZF0gIT09ICcnKSBicmVhaztcbiAgICB9XG5cbiAgICBpZiAoc3RhcnQgPiBlbmQpIHJldHVybiBbXTtcbiAgICByZXR1cm4gYXJyLnNsaWNlKHN0YXJ0LCBlbmQgLSBzdGFydCArIDEpO1xuICB9XG5cbiAgdmFyIGZyb21QYXJ0cyA9IHRyaW0oZnJvbS5zcGxpdCgnLycpKTtcbiAgdmFyIHRvUGFydHMgPSB0cmltKHRvLnNwbGl0KCcvJykpO1xuXG4gIHZhciBsZW5ndGggPSBNYXRoLm1pbihmcm9tUGFydHMubGVuZ3RoLCB0b1BhcnRzLmxlbmd0aCk7XG4gIHZhciBzYW1lUGFydHNMZW5ndGggPSBsZW5ndGg7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoZnJvbVBhcnRzW2ldICE9PSB0b1BhcnRzW2ldKSB7XG4gICAgICBzYW1lUGFydHNMZW5ndGggPSBpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgdmFyIG91dHB1dFBhcnRzID0gW107XG4gIGZvciAodmFyIGkgPSBzYW1lUGFydHNMZW5ndGg7IGkgPCBmcm9tUGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICBvdXRwdXRQYXJ0cy5wdXNoKCcuLicpO1xuICB9XG5cbiAgb3V0cHV0UGFydHMgPSBvdXRwdXRQYXJ0cy5jb25jYXQodG9QYXJ0cy5zbGljZShzYW1lUGFydHNMZW5ndGgpKTtcblxuICByZXR1cm4gb3V0cHV0UGFydHMuam9pbignLycpO1xufTtcblxuZXhwb3J0cy5zZXAgPSAnLyc7XG5leHBvcnRzLmRlbGltaXRlciA9ICc6JztcblxuZXhwb3J0cy5kaXJuYW1lID0gZnVuY3Rpb24ocGF0aCkge1xuICB2YXIgcmVzdWx0ID0gc3BsaXRQYXRoKHBhdGgpLFxuICAgICAgcm9vdCA9IHJlc3VsdFswXSxcbiAgICAgIGRpciA9IHJlc3VsdFsxXTtcblxuICBpZiAoIXJvb3QgJiYgIWRpcikge1xuICAgIC8vIE5vIGRpcm5hbWUgd2hhdHNvZXZlclxuICAgIHJldHVybiAnLic7XG4gIH1cblxuICBpZiAoZGlyKSB7XG4gICAgLy8gSXQgaGFzIGEgZGlybmFtZSwgc3RyaXAgdHJhaWxpbmcgc2xhc2hcbiAgICBkaXIgPSBkaXIuc3Vic3RyKDAsIGRpci5sZW5ndGggLSAxKTtcbiAgfVxuXG4gIHJldHVybiByb290ICsgZGlyO1xufTtcblxuXG5leHBvcnRzLmJhc2VuYW1lID0gZnVuY3Rpb24ocGF0aCwgZXh0KSB7XG4gIHZhciBmID0gc3BsaXRQYXRoKHBhdGgpWzJdO1xuICAvLyBUT0RPOiBtYWtlIHRoaXMgY29tcGFyaXNvbiBjYXNlLWluc2Vuc2l0aXZlIG9uIHdpbmRvd3M/XG4gIGlmIChleHQgJiYgZi5zdWJzdHIoLTEgKiBleHQubGVuZ3RoKSA9PT0gZXh0KSB7XG4gICAgZiA9IGYuc3Vic3RyKDAsIGYubGVuZ3RoIC0gZXh0Lmxlbmd0aCk7XG4gIH1cbiAgcmV0dXJuIGY7XG59O1xuXG5cbmV4cG9ydHMuZXh0bmFtZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgcmV0dXJuIHNwbGl0UGF0aChwYXRoKVszXTtcbn07XG5cbmZ1bmN0aW9uIGZpbHRlciAoeHMsIGYpIHtcbiAgICBpZiAoeHMuZmlsdGVyKSByZXR1cm4geHMuZmlsdGVyKGYpO1xuICAgIHZhciByZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChmKHhzW2ldLCBpLCB4cykpIHJlcy5wdXNoKHhzW2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbn1cblxuLy8gU3RyaW5nLnByb3RvdHlwZS5zdWJzdHIgLSBuZWdhdGl2ZSBpbmRleCBkb24ndCB3b3JrIGluIElFOFxudmFyIHN1YnN0ciA9ICdhYicuc3Vic3RyKC0xKSA9PT0gJ2InXG4gICAgPyBmdW5jdGlvbiAoc3RyLCBzdGFydCwgbGVuKSB7IHJldHVybiBzdHIuc3Vic3RyKHN0YXJ0LCBsZW4pIH1cbiAgICA6IGZ1bmN0aW9uIChzdHIsIHN0YXJ0LCBsZW4pIHtcbiAgICAgICAgaWYgKHN0YXJ0IDwgMCkgc3RhcnQgPSBzdHIubGVuZ3RoICsgc3RhcnQ7XG4gICAgICAgIHJldHVybiBzdHIuc3Vic3RyKHN0YXJ0LCBsZW4pO1xuICAgIH1cbjtcbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuMTEuMVxuKGZ1bmN0aW9uKCkge1xuICB2YXIgTGlxdWlkLCBmcztcblxuICBmcyA9IHJlcXVpcmUoJ2ZzJyk7XG5cbiAgTGlxdWlkID0gcmVxdWlyZSgnLi4vbGlxdWlkJyk7XG5cbiAgTGlxdWlkLkxpcXVpZFZpZXcgPSAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNhY2hlO1xuXG4gICAgZnVuY3Rpb24gTGlxdWlkVmlldygpIHt9XG5cbiAgICBjYWNoZSA9IHt9O1xuXG4gICAgTGlxdWlkVmlldy5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oc291cmNlLCBkYXRhKSB7XG4gICAgICB2YXIgdGVtcGxhdGU7XG4gICAgICBpZiAoZGF0YSA9PSBudWxsKSB7XG4gICAgICAgIGRhdGEgPSB7fTtcbiAgICAgIH1cbiAgICAgIGlmIChjYWNoZVtzb3VyY2VdICE9IG51bGwpIHtcbiAgICAgICAgdGVtcGxhdGUgPSBjYWNoZVtzb3VyY2VdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGVtcGxhdGUgPSBMaXF1aWQuVGVtcGxhdGUucGFyc2Uoc291cmNlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0ZW1wbGF0ZS5yZW5kZXIoZGF0YSk7XG4gICAgfTtcblxuICAgIExpcXVpZFZpZXcucHJvdG90eXBlLnJlbmRlckZpbGUgPSBmdW5jdGlvbihmaWxlUGF0aCwgb3B0aW9ucywgbmV4dCkge1xuICAgICAgcmV0dXJuIGZzLnJlYWRGaWxlKGZpbGVQYXRoLCAndXRmLTgnLCBmdW5jdGlvbihlcnIsIGNvbnRlbnQpIHtcbiAgICAgICAgdmFyIHRlbXBsYXRlO1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgcmV0dXJuIG5leHQobmV3IEVycm9yKGVycikpO1xuICAgICAgICB9XG4gICAgICAgIHRlbXBsYXRlID0gTGlxdWlkLlRlbXBsYXRlLnBhcnNlKGNvbnRlbnQpO1xuICAgICAgICByZXR1cm4gbmV4dChudWxsLCB0ZW1wbGF0ZS5yZW5kZXIob3B0aW9ucykpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIExpcXVpZFZpZXcucHJvdG90eXBlLl9fZXhwcmVzcyA9IGZ1bmN0aW9uKGZpbGVQYXRoLCBvcHRpb25zLCBuZXh0KSB7XG4gICAgICByZXR1cm4gZnMucmVhZEZpbGUoZmlsZVBhdGgsICd1dGYtOCcsIGZ1bmN0aW9uKGVyciwgY29udGVudCkge1xuICAgICAgICB2YXIgdGVtcGxhdGU7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICByZXR1cm4gbmV4dChuZXcgRXJyb3IoZXJyKSk7XG4gICAgICAgIH1cbiAgICAgICAgdGVtcGxhdGUgPSBMaXF1aWQuVGVtcGxhdGUucGFyc2UoY29udGVudCk7XG4gICAgICAgIHJldHVybiBuZXh0KG51bGwsIHRlbXBsYXRlLnJlbmRlcihvcHRpb25zKSk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIExpcXVpZFZpZXc7XG5cbiAgfSkoKTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS4xMS4xXG5cbi8qXG5cbkNvcHlyaWdodCAoYykgMjAxMyAtIDIwMTQgQnJ1Y2UgRGF2aWRzb24gZGFya292ZXJsb3Jkb2ZkYXRhQGdtYWlsLmNvbVxuQ29weXJpZ2h0IChjKSAyMDA1LCAyMDA2IFRvYmlhcyBMdWV0a2VcblxuUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nXG5hIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcblwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xud2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvXG5wZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG9cbnRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmVcbmluY2x1ZGVkIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELFxuRVhQUkVTUyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG5NRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORFxuTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRVxuTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTlxuT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OXG5XSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4oZnVuY3Rpb24oKSB7XG4gIHZhciBMaXF1aWQ7XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBMaXF1aWQgPSAoZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gTGlxdWlkKCkge31cblxuICAgIExpcXVpZC5GaWx0ZXJTZXBhcmF0b3IgPSAvXFx8LztcblxuICAgIExpcXVpZC5Bcmd1bWVudFNlcGFyYXRvciA9ICcsJztcblxuICAgIExpcXVpZC5GaWx0ZXJBcmd1bWVudFNlcGFyYXRvciA9ICc6JztcblxuICAgIExpcXVpZC5WYXJpYWJsZUF0dHJpYnV0ZVNlcGFyYXRvciA9ICcuJztcblxuICAgIExpcXVpZC5UYWdTdGFydCA9IC9cXHtcXCUvO1xuXG4gICAgTGlxdWlkLlRhZ0VuZCA9IC9cXCVcXH0vO1xuXG4gICAgTGlxdWlkLlZhcmlhYmxlU2lnbmF0dXJlID0gL1xcKD9bXFx3XFwtXFwuXFxbXFxdXVxcKT8vO1xuXG4gICAgTGlxdWlkLlZhcmlhYmxlU2VnbWVudCA9IC9bXFx3XFwtXS87XG5cbiAgICBMaXF1aWQuVmFyaWFibGVTdGFydCA9IC9cXHtcXHsvO1xuXG4gICAgTGlxdWlkLlZhcmlhYmxlRW5kID0gL1xcfVxcfS87XG5cbiAgICBMaXF1aWQuVmFyaWFibGVJbmNvbXBsZXRlRW5kID0gL1xcfVxcfT8vO1xuXG4gICAgTGlxdWlkLlF1b3RlZFN0cmluZyA9IC9cIlteXCJdKlwifCdbXiddKicvO1xuXG4gICAgTGlxdWlkLlF1b3RlZEZyYWdtZW50ID0gUmVnRXhwKExpcXVpZC5RdW90ZWRTdHJpbmcuc291cmNlICsgXCJ8KD86W15cXFxccyxcXFxcfCdcXFwiXXxcIiArIExpcXVpZC5RdW90ZWRTdHJpbmcuc291cmNlICsgXCIpK1wiKTtcblxuICAgIExpcXVpZC5TdHJpY3RRdW90ZWRGcmFnbWVudCA9IC9cIlteXCJdK1wifCdbXiddKyd8W15cXHN8OixdKy87XG5cbiAgICBMaXF1aWQuRmlyc3RGaWx0ZXJBcmd1bWVudCA9IFJlZ0V4cChMaXF1aWQuRmlsdGVyQXJndW1lbnRTZXBhcmF0b3IgKyBcIig/OlwiICsgTGlxdWlkLlN0cmljdFF1b3RlZEZyYWdtZW50LnNvdXJjZSArIFwiKVwiKTtcblxuICAgIExpcXVpZC5PdGhlckZpbHRlckFyZ3VtZW50ID0gUmVnRXhwKExpcXVpZC5Bcmd1bWVudFNlcGFyYXRvciArIFwiKD86XCIgKyBMaXF1aWQuU3RyaWN0UXVvdGVkRnJhZ21lbnQuc291cmNlICsgXCIpXCIpO1xuXG4gICAgTGlxdWlkLlNwYWNlbGVzc0ZpbHRlciA9IFJlZ0V4cChcIl4oPzonW14nXSsnfFxcXCJbXlxcXCJdK1xcXCJ8W14nXFxcIl0pKlwiICsgTGlxdWlkLkZpbHRlclNlcGFyYXRvci5zb3VyY2UgKyBcIig/OlwiICsgTGlxdWlkLlN0cmljdFF1b3RlZEZyYWdtZW50LnNvdXJjZSArIFwiKSg/OlwiICsgTGlxdWlkLkZpcnN0RmlsdGVyQXJndW1lbnQuc291cmNlICsgXCIoPzpcIiArIExpcXVpZC5PdGhlckZpbHRlckFyZ3VtZW50LnNvdXJjZSArIFwiKSopP1wiKTtcblxuICAgIExpcXVpZC5FeHByZXNzaW9uID0gUmVnRXhwKFwiKD86XCIgKyBMaXF1aWQuUXVvdGVkRnJhZ21lbnQuc291cmNlICsgXCIoPzpcIiArIExpcXVpZC5TcGFjZWxlc3NGaWx0ZXIuc291cmNlICsgXCIpKilcIik7XG5cbiAgICBMaXF1aWQuVGFnQXR0cmlidXRlcyA9IFJlZ0V4cChcIihcXFxcdyspXFxcXHMqXFxcXDpcXFxccyooXCIgKyBMaXF1aWQuUXVvdGVkRnJhZ21lbnQuc291cmNlICsgXCIpXCIpO1xuXG4gICAgTGlxdWlkLkFueVN0YXJ0aW5nVGFnID0gL1xce1xce3xcXHtcXCUvO1xuXG4gICAgTGlxdWlkLlBhcnRpYWxUZW1wbGF0ZVBhcnNlciA9IFJlZ0V4cChMaXF1aWQuVGFnU3RhcnQuc291cmNlICsgXCIuKj9cIiArIExpcXVpZC5UYWdFbmQuc291cmNlICsgXCJ8XCIgKyBMaXF1aWQuVmFyaWFibGVTdGFydC5zb3VyY2UgKyBcIi4qP1wiICsgTGlxdWlkLlZhcmlhYmxlSW5jb21wbGV0ZUVuZC5zb3VyY2UpO1xuXG4gICAgTGlxdWlkLlRlbXBsYXRlUGFyc2VyID0gUmVnRXhwKFwiKFwiICsgTGlxdWlkLlBhcnRpYWxUZW1wbGF0ZVBhcnNlci5zb3VyY2UgKyBcInxcIiArIExpcXVpZC5BbnlTdGFydGluZ1RhZy5zb3VyY2UgKyBcIilcIik7XG5cbiAgICBMaXF1aWQuVmFyaWFibGVQYXJzZXIgPSBSZWdFeHAoXCJcXFxcW1teXFxcXF1dK1xcXFxdfFwiICsgTGlxdWlkLlZhcmlhYmxlU2VnbWVudC5zb3VyY2UgKyBcIitcXFxcPz9cIik7XG5cbiAgICBMaXF1aWQuTGl0ZXJhbFNob3J0aGFuZCA9IC9eKD86XFx7XFx7XFx7XFxzPykoLio/KSg/OlxccypcXH1cXH1cXH0pJC87XG5cbiAgICBMaXF1aWQuc2V0UGF0aCA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgICAgIExpcXVpZC5UZW1wbGF0ZS5maWxlU3lzdGVtID0gbmV3IExpcXVpZC5Mb2NhbEZpbGVTeXN0ZW0ocGF0aCk7XG4gICAgICByZXR1cm4gTGlxdWlkO1xuICAgIH07XG5cbiAgICBMaXF1aWQuY29tcGlsZSA9IGZ1bmN0aW9uKHRlbXBsYXRlLCBvcHRpb25zKSB7XG4gICAgICB2YXIgdDtcbiAgICAgIHQgPSBMaXF1aWQuVGVtcGxhdGUucGFyc2UodGVtcGxhdGUpO1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHQucmVuZGVyKGNvbnRleHQpO1xuICAgICAgfTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIExpcXVpZDtcblxuICB9KSgpO1xuXG4gIHJlcXVpcmUoJy4vbGlxdWlkL3ZlcnNpb24nKTtcblxuICByZXF1aXJlKCcuL2xpcXVpZC9kcm9wJyk7XG5cbiAgcmVxdWlyZSgnLi9saXF1aWQvZXJyb3JzJyk7XG5cbiAgcmVxdWlyZSgnLi9saXF1aWQvaW50ZXJydXB0cycpO1xuXG4gIHJlcXVpcmUoJy4vbGlxdWlkL3N0cmFpbmVyJyk7XG5cbiAgcmVxdWlyZSgnLi9saXF1aWQvY29udGV4dCcpO1xuXG4gIHJlcXVpcmUoJy4vbGlxdWlkL3RhZycpO1xuXG4gIHJlcXVpcmUoJy4vbGlxdWlkL2Jsb2NrJyk7XG5cbiAgcmVxdWlyZSgnLi9saXF1aWQvZG9jdW1lbnQnKTtcblxuICByZXF1aXJlKCcuL2xpcXVpZC92YXJpYWJsZScpO1xuXG4gIHJlcXVpcmUoJy4vbGlxdWlkL2ZpbGVzeXN0ZW0nKTtcblxuICByZXF1aXJlKCcuL2xpcXVpZC90ZW1wbGF0ZScpO1xuXG4gIHJlcXVpcmUoJy4vbGlxdWlkL3N0YW5kYXJkZmlsdGVycycpO1xuXG4gIHJlcXVpcmUoJy4vbGlxdWlkL2NvbmRpdGlvbicpO1xuXG4gIExpcXVpZC5UYWdzID0gKGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIFRhZ3MoKSB7fVxuXG4gICAgcmV0dXJuIFRhZ3M7XG5cbiAgfSkoKTtcblxuICByZXF1aXJlKCcuL2xpcXVpZC90YWdzL2Fzc2lnbicpO1xuXG4gIHJlcXVpcmUoJy4vbGlxdWlkL3RhZ3MvYmxvY2snKTtcblxuICByZXF1aXJlKCcuL2xpcXVpZC90YWdzL2JyZWFrJyk7XG5cbiAgcmVxdWlyZSgnLi9saXF1aWQvdGFncy9jYXB0dXJlJyk7XG5cbiAgcmVxdWlyZSgnLi9saXF1aWQvdGFncy9jYXNlJyk7XG5cbiAgcmVxdWlyZSgnLi9saXF1aWQvdGFncy9jb21tZW50Jyk7XG5cbiAgcmVxdWlyZSgnLi9saXF1aWQvdGFncy9jb250aW51ZScpO1xuXG4gIHJlcXVpcmUoJy4vbGlxdWlkL3RhZ3MvY3ljbGUnKTtcblxuICByZXF1aXJlKCcuL2xpcXVpZC90YWdzL2RlY3JlbWVudCcpO1xuXG4gIHJlcXVpcmUoJy4vbGlxdWlkL3RhZ3MvZXh0ZW5kcycpO1xuXG4gIHJlcXVpcmUoJy4vbGlxdWlkL3RhZ3MvZm9yJyk7XG5cbiAgcmVxdWlyZSgnLi9saXF1aWQvdGFncy9pZicpO1xuXG4gIHJlcXVpcmUoJy4vbGlxdWlkL3RhZ3MvaWZjaGFuZ2VkJyk7XG5cbiAgcmVxdWlyZSgnLi9saXF1aWQvdGFncy9pbmNsdWRlJyk7XG5cbiAgcmVxdWlyZSgnLi9saXF1aWQvdGFncy9pbmNyZW1lbnQnKTtcblxuICByZXF1aXJlKCcuL2xpcXVpZC90YWdzL3JhdycpO1xuXG4gIHJlcXVpcmUoJy4vbGlxdWlkL3RhZ3MvdW5sZXNzJyk7XG5cbiAgcmVxdWlyZSgnLi9leHRyYXMvbGlxdWlkVmlldycpO1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjExLjFcbihmdW5jdGlvbigpIHtcbiAgdmFyIExpcXVpZCxcbiAgICBleHRlbmQgPSBmdW5jdGlvbihjaGlsZCwgcGFyZW50KSB7IGZvciAodmFyIGtleSBpbiBwYXJlbnQpIHsgaWYgKGhhc1Byb3AuY2FsbChwYXJlbnQsIGtleSkpIGNoaWxkW2tleV0gPSBwYXJlbnRba2V5XTsgfSBmdW5jdGlvbiBjdG9yKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gY2hpbGQ7IH0gY3Rvci5wcm90b3R5cGUgPSBwYXJlbnQucHJvdG90eXBlOyBjaGlsZC5wcm90b3R5cGUgPSBuZXcgY3RvcigpOyBjaGlsZC5fX3N1cGVyX18gPSBwYXJlbnQucHJvdG90eXBlOyByZXR1cm4gY2hpbGQ7IH0sXG4gICAgaGFzUHJvcCA9IHt9Lmhhc093blByb3BlcnR5O1xuXG4gIExpcXVpZCA9IHJlcXVpcmUoJy4uL2xpcXVpZCcpO1xuXG4gIExpcXVpZC5CbG9jayA9IChmdW5jdGlvbihzdXBlckNsYXNzKSB7XG4gICAgdmFyIENvbnRlbnRPZlZhcmlhYmxlLCBGdWxsVG9rZW4sIElzVGFnLCBJc1ZhcmlhYmxlO1xuXG4gICAgZXh0ZW5kKEJsb2NrLCBzdXBlckNsYXNzKTtcblxuICAgIElzVGFnID0gUmVnRXhwKFwiXlwiICsgTGlxdWlkLlRhZ1N0YXJ0LnNvdXJjZSk7XG5cbiAgICBJc1ZhcmlhYmxlID0gUmVnRXhwKFwiXlwiICsgTGlxdWlkLlZhcmlhYmxlU3RhcnQuc291cmNlKTtcblxuICAgIEZ1bGxUb2tlbiA9IFJlZ0V4cChcIl5cIiArIExpcXVpZC5UYWdTdGFydC5zb3VyY2UgKyBcIlxcXFxzKihcXFxcdyspXFxcXHMqKC4qKT9cIiArIExpcXVpZC5UYWdFbmQuc291cmNlICsgXCIkXCIpO1xuXG4gICAgQ29udGVudE9mVmFyaWFibGUgPSBSZWdFeHAoXCJeXCIgKyBMaXF1aWQuVmFyaWFibGVTdGFydC5zb3VyY2UgKyBcIiguKilcIiArIExpcXVpZC5WYXJpYWJsZUVuZC5zb3VyY2UgKyBcIiRcIik7XG5cbiAgICBmdW5jdGlvbiBCbG9jayh0YWdOYW1lLCBtYXJrdXAsIHRva2Vucykge1xuICAgICAgdGhpcy5ibG9ja05hbWUgPSB0YWdOYW1lO1xuICAgICAgdGhpcy5ibG9ja0RlbGltaXRlciA9IFwiZW5kXCIgKyB0aGlzLmJsb2NrTmFtZTtcbiAgICAgIEJsb2NrLl9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIHRhZ05hbWUsIG1hcmt1cCwgdG9rZW5zKTtcbiAgICB9XG5cbiAgICBCbG9jay5wcm90b3R5cGUucGFyc2UgPSBmdW5jdGlvbih0b2tlbnMpIHtcbiAgICAgIHZhciAkLCB0YWcsIHRva2VuO1xuICAgICAgdGhpcy5ub2RlbGlzdCB8fCAodGhpcy5ub2RlbGlzdCA9IFtdKTtcbiAgICAgIHRoaXMubm9kZWxpc3QubGVuZ3RoID0gMDtcbiAgICAgIHdoaWxlICgodG9rZW4gPSB0b2tlbnMuc2hpZnQoKSkgIT0gbnVsbCkge1xuICAgICAgICBpZiAoSXNUYWcudGVzdCh0b2tlbikpIHtcbiAgICAgICAgICBpZiAoJCA9IHRva2VuLm1hdGNoKEZ1bGxUb2tlbikpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmJsb2NrRGVsaW1pdGVyID09PSAkWzFdKSB7XG4gICAgICAgICAgICAgIHRoaXMuZW5kVGFnKCk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0YWcgPSBMaXF1aWQuVGVtcGxhdGUudGFnc1skWzFdXSkge1xuICAgICAgICAgICAgICB0aGlzLm5vZGVsaXN0LnB1c2gobmV3IHRhZygkWzFdLCAkWzJdLCB0b2tlbnMpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRoaXMudW5rbm93blRhZygkWzFdLCAkWzJdLCB0b2tlbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgU3ludGF4RXJyb3IoXCJUYWcgJ1wiICsgdG9rZW4gKyBcIicgd2FzIG5vdCBwcm9wZXJseSB0ZXJtaW5hdGVkIHdpdGggcmVnZXhwOiBcIiArIExpcXVpZC5UYWdFbmQuc291cmNlICsgXCIgXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChJc1ZhcmlhYmxlLnRlc3QodG9rZW4pKSB7XG4gICAgICAgICAgdGhpcy5ub2RlbGlzdC5wdXNoKHRoaXMuY3JlYXRlVmFyaWFibGUodG9rZW4pKTtcbiAgICAgICAgfSBlbHNlIGlmICh0b2tlbiA9PT0gJycpIHtcblxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMubm9kZWxpc3QucHVzaCh0b2tlbik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLmFzc2VydE1pc3NpbmdEZWxpbWl0YXRpb24oKTtcbiAgICB9O1xuXG4gICAgQmxvY2sucHJvdG90eXBlLmVuZFRhZyA9IGZ1bmN0aW9uKCkge307XG5cbiAgICBCbG9jay5wcm90b3R5cGUudW5rbm93blRhZyA9IGZ1bmN0aW9uKHRhZywgcGFyYW1zLCB0b2tlbnMpIHtcbiAgICAgIGlmICh0YWcgPT09IFwiZWxzZVwiKSB7XG4gICAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcih0aGlzLmJsb2NrTmFtZSArIFwiIHRhZyBkb2VzIG5vdCBleHBlY3QgZWxzZSB0YWdcIik7XG4gICAgICB9IGVsc2UgaWYgKHRhZyA9PT0gXCJlbmRcIikge1xuICAgICAgICB0aHJvdyBuZXcgU3ludGF4RXJyb3IoXCInZW5kJyBpcyBub3QgYSB2YWxpZCBkZWxpbWl0ZXIgZm9yIFwiICsgdGhpcy5ibG9ja05hbWUgKyBcIiB0YWdzLiB1c2UgXCIgKyB0aGlzLmJsb2NrRGVsaW1pdGVyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcihcIlVua25vd24gdGFnICdcIiArIHRhZyArIFwiJ1wiKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgQmxvY2sucHJvdG90eXBlLmNyZWF0ZVZhcmlhYmxlID0gZnVuY3Rpb24odG9rZW4pIHtcbiAgICAgIHZhciBjb250ZW50O1xuICAgICAgaWYgKGNvbnRlbnQgPSB0b2tlbi5tYXRjaChDb250ZW50T2ZWYXJpYWJsZSkpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBMaXF1aWQuVmFyaWFibGUoY29udGVudFsxXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgTGlxdWlkLlN5bnRheEVycm9yKFwiVmFyaWFibGUgJ1wiICsgdG9rZW4gKyBcIicgd2FzIG5vdCBwcm9wZXJseSB0ZXJtaW5hdGVkIHdpdGggcmVnZXhwOiBcIiArIExpcXVpZC5WYXJpYWJsZUVuZC5zb3VyY2UgKyBcIiBcIik7XG4gICAgICB9XG4gICAgfTtcblxuICAgIEJsb2NrLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gICAgICByZXR1cm4gdGhpcy5yZW5kZXJBbGwodGhpcy5ub2RlbGlzdCwgY29udGV4dCk7XG4gICAgfTtcblxuICAgIEJsb2NrLnByb3RvdHlwZS5yZW5kZXJBbGwgPSBmdW5jdGlvbihsaXN0LCBjb250ZXh0KSB7XG4gICAgICB2YXIgZSwgaSwgbGVuLCBvdXRwdXQsIHRva2VuO1xuICAgICAgb3V0cHV0ID0gW107XG4gICAgICBmb3IgKGkgPSAwLCBsZW4gPSBsaXN0Lmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIHRva2VuID0gbGlzdFtpXTtcbiAgICAgICAgaWYgKGNvbnRleHQuaGFzSW50ZXJydXB0KCkpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICB0cnkge1xuICAgICAgICAgIGlmICh0b2tlbiBpbnN0YW5jZW9mIExpcXVpZC5UYWdzLkNvbnRpbnVlIHx8IHRva2VuIGluc3RhbmNlb2YgTGlxdWlkLlRhZ3MuQnJlYWspIHtcbiAgICAgICAgICAgIGNvbnRleHQucHVzaEludGVycnVwdCh0b2tlbi5pbnRlcnJ1cHQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIG91dHB1dC5wdXNoKHRva2VuLnJlbmRlciAhPSBudWxsID8gdG9rZW4ucmVuZGVyKGNvbnRleHQpIDogdG9rZW4pO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGUgPSBlcnJvcjtcbiAgICAgICAgICBjb250ZXh0LmhhbmRsZUVycm9yKGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gb3V0cHV0LmpvaW4oJycpO1xuICAgIH07XG5cbiAgICBCbG9jay5wcm90b3R5cGUuYXNzZXJ0TWlzc2luZ0RlbGltaXRhdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgdGhyb3cgbmV3IExpcXVpZC5TeW50YXhFcnJvcihibG9ja19uYW1lICsgXCIgdGFnIHdhcyBuZXZlciBjbG9zZWRcIik7XG4gICAgfTtcblxuICAgIHJldHVybiBCbG9jaztcblxuICB9KShMaXF1aWQuVGFnKTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS4xMS4xXG4oZnVuY3Rpb24oKSB7XG4gIHZhciBMaXF1aWQsXG4gICAgZXh0ZW5kID0gZnVuY3Rpb24oY2hpbGQsIHBhcmVudCkgeyBmb3IgKHZhciBrZXkgaW4gcGFyZW50KSB7IGlmIChoYXNQcm9wLmNhbGwocGFyZW50LCBrZXkpKSBjaGlsZFtrZXldID0gcGFyZW50W2tleV07IH0gZnVuY3Rpb24gY3RvcigpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGNoaWxkOyB9IGN0b3IucHJvdG90eXBlID0gcGFyZW50LnByb3RvdHlwZTsgY2hpbGQucHJvdG90eXBlID0gbmV3IGN0b3IoKTsgY2hpbGQuX19zdXBlcl9fID0gcGFyZW50LnByb3RvdHlwZTsgcmV0dXJuIGNoaWxkOyB9LFxuICAgIGhhc1Byb3AgPSB7fS5oYXNPd25Qcm9wZXJ0eTtcblxuICBMaXF1aWQgPSByZXF1aXJlKCcuLi9saXF1aWQnKTtcblxuICBMaXF1aWQuQ29uZGl0aW9uID0gKGZ1bmN0aW9uKCkge1xuICAgIHZhciBjb21wYWN0O1xuXG4gICAgY29tcGFjdCA9IHJlcXVpcmUoJy4vdXRpbCcpLmNvbXBhY3Q7XG5cbiAgICBDb25kaXRpb24ub3BlcmF0b3JzID0ge1xuICAgICAgXCI9PVwiOiBmdW5jdGlvbihsLCByKSB7XG4gICAgICAgIHJldHVybiBsID09PSByO1xuICAgICAgfSxcbiAgICAgIFwiPVwiOiBmdW5jdGlvbihsLCByKSB7XG4gICAgICAgIHJldHVybiBsID09PSByO1xuICAgICAgfSxcbiAgICAgIFwiIT1cIjogZnVuY3Rpb24obCwgcikge1xuICAgICAgICByZXR1cm4gbCAhPT0gcjtcbiAgICAgIH0sXG4gICAgICBcIjw+XCI6IGZ1bmN0aW9uKGwsIHIpIHtcbiAgICAgICAgcmV0dXJuIGwgIT09IHI7XG4gICAgICB9LFxuICAgICAgXCI8XCI6IGZ1bmN0aW9uKGwsIHIpIHtcbiAgICAgICAgcmV0dXJuIGwgPCByO1xuICAgICAgfSxcbiAgICAgIFwiPlwiOiBmdW5jdGlvbihsLCByKSB7XG4gICAgICAgIHJldHVybiBsID4gcjtcbiAgICAgIH0sXG4gICAgICBcIjw9XCI6IGZ1bmN0aW9uKGwsIHIpIHtcbiAgICAgICAgcmV0dXJuIGwgPD0gcjtcbiAgICAgIH0sXG4gICAgICBcIj49XCI6IGZ1bmN0aW9uKGwsIHIpIHtcbiAgICAgICAgcmV0dXJuIGwgPj0gcjtcbiAgICAgIH0sXG4gICAgICBjb250YWluczogZnVuY3Rpb24obCwgcikge1xuICAgICAgICByZXR1cm4gbC5tYXRjaChyKTtcbiAgICAgIH0sXG4gICAgICBoYXNLZXk6IGZ1bmN0aW9uKGwsIHIpIHtcbiAgICAgICAgcmV0dXJuIGxbcl0gIT0gbnVsbDtcbiAgICAgIH0sXG4gICAgICBoYXNWYWx1ZTogZnVuY3Rpb24obCwgcikge1xuICAgICAgICB2YXIgcDtcbiAgICAgICAgZm9yIChwIGluIGwpIHtcbiAgICAgICAgICBpZiAobFtwXSA9PT0gcikge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gQ29uZGl0aW9uKGxlZnQxLCBvcGVyYXRvciwgcmlnaHQxKSB7XG4gICAgICB0aGlzLmxlZnQgPSBsZWZ0MTtcbiAgICAgIHRoaXMub3BlcmF0b3IgPSBvcGVyYXRvcjtcbiAgICAgIHRoaXMucmlnaHQgPSByaWdodDE7XG4gICAgICB0aGlzLmNoaWxkUmVsYXRpb24gPSBudWxsO1xuICAgICAgdGhpcy5jaGlsZENvbmRpdGlvbiA9IG51bGw7XG4gICAgICB0aGlzLmF0dGFjaG1lbnQgPSBudWxsO1xuICAgIH1cblxuICAgIENvbmRpdGlvbi5wcm90b3R5cGUuZXZhbHVhdGUgPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gICAgICB2YXIgcmVzdWx0O1xuICAgICAgaWYgKGNvbnRleHQgPT0gbnVsbCkge1xuICAgICAgICBjb250ZXh0ID0gbmV3IExpcXVpZC5Db250ZXh0O1xuICAgICAgfVxuICAgICAgcmVzdWx0ID0gdGhpcy5pbnRlcnByZXRDb25kaXRpb24odGhpcy5sZWZ0LCB0aGlzLnJpZ2h0LCB0aGlzLm9wZXJhdG9yLCBjb250ZXh0KTtcbiAgICAgIHN3aXRjaCAodGhpcy5jaGlsZFJlbGF0aW9uKSB7XG4gICAgICAgIGNhc2UgXCJvclwiOlxuICAgICAgICAgIHJldHVybiByZXN1bHQgfHwgdGhpcy5jaGlsZENvbmRpdGlvbi5ldmFsdWF0ZShjb250ZXh0KTtcbiAgICAgICAgY2FzZSBcImFuZFwiOlxuICAgICAgICAgIHJldHVybiByZXN1bHQgJiYgdGhpcy5jaGlsZENvbmRpdGlvbi5ldmFsdWF0ZShjb250ZXh0KTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfVxuICAgIH07XG5cbiAgICBDb25kaXRpb24ucHJvdG90eXBlLm9yID0gZnVuY3Rpb24oY29uZGl0aW9uKSB7XG4gICAgICB0aGlzLmNoaWxkUmVsYXRpb24gPSBcIm9yXCI7XG4gICAgICByZXR1cm4gdGhpcy5jaGlsZENvbmRpdGlvbiA9IGNvbmRpdGlvbjtcbiAgICB9O1xuXG4gICAgQ29uZGl0aW9uLnByb3RvdHlwZS5hbmQgPSBmdW5jdGlvbihjb25kaXRpb24pIHtcbiAgICAgIHRoaXMuY2hpbGRSZWxhdGlvbiA9IFwiYW5kXCI7XG4gICAgICByZXR1cm4gdGhpcy5jaGlsZENvbmRpdGlvbiA9IGNvbmRpdGlvbjtcbiAgICB9O1xuXG4gICAgQ29uZGl0aW9uLnByb3RvdHlwZS5hdHRhY2ggPSBmdW5jdGlvbihhdHRhY2htZW50KSB7XG4gICAgICByZXR1cm4gdGhpcy5hdHRhY2htZW50ID0gYXR0YWNobWVudDtcbiAgICB9O1xuXG4gICAgQ29uZGl0aW9uLnByb3RvdHlwZVtcImVsc2VcIl0gPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuXG4gICAgQ29uZGl0aW9uLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIFwiIzxDb25kaXRpb24gXCIgKyAoY29tcGFjdChbdGhpcy5sZWZ0LCB0aGlzLm9wZXJhdG9yLCB0aGlzLnJpZ2h0XSkuam9pbignICcpKSArIFwiPlwiO1xuICAgIH07XG5cbiAgICBDb25kaXRpb24ucHJvdG90eXBlLmludGVycHJldENvbmRpdGlvbiA9IGZ1bmN0aW9uKGxlZnQsIHJpZ2h0LCBvcCwgY29udGV4dCkge1xuICAgICAgdmFyIG9wZXJhdGlvbjtcbiAgICAgIGlmIChvcCA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBjb250ZXh0LmdldChsZWZ0KTtcbiAgICAgIH1cbiAgICAgIGxlZnQgPSBjb250ZXh0LmdldChsZWZ0KTtcbiAgICAgIHJpZ2h0ID0gY29udGV4dC5nZXQocmlnaHQpO1xuICAgICAgb3BlcmF0aW9uID0gQ29uZGl0aW9uLm9wZXJhdG9yc1tvcF0gfHwgbmV3IExpcXVpZC5Bcmd1bWVudEVycm9yKFwiVW5rbm93biBvcGVyYXRvciBcIiArIG9wKTtcbiAgICAgIGlmIChvcGVyYXRpb24uY2FsbCAhPSBudWxsKSB7XG4gICAgICAgIHJldHVybiBvcGVyYXRpb24uY2FsbCh0aGlzLCBsZWZ0LCByaWdodCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIENvbmRpdGlvbjtcblxuICB9KSgpO1xuXG4gIExpcXVpZC5FbHNlQ29uZGl0aW9uID0gKGZ1bmN0aW9uKHN1cGVyQ2xhc3MpIHtcbiAgICBleHRlbmQoRWxzZUNvbmRpdGlvbiwgc3VwZXJDbGFzcyk7XG5cbiAgICBmdW5jdGlvbiBFbHNlQ29uZGl0aW9uKCkge1xuICAgICAgcmV0dXJuIEVsc2VDb25kaXRpb24uX19zdXBlcl9fLmNvbnN0cnVjdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgRWxzZUNvbmRpdGlvbi5wcm90b3R5cGVbXCJlbHNlXCJdID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuXG4gICAgRWxzZUNvbmRpdGlvbi5wcm90b3R5cGUuZXZhbHVhdGUgPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIEVsc2VDb25kaXRpb247XG5cbiAgfSkoTGlxdWlkLkNvbmRpdGlvbik7XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuMTEuMVxuKGZ1bmN0aW9uKCkge1xuICB2YXIgTGlxdWlkLFxuICAgIHNsaWNlID0gW10uc2xpY2U7XG5cbiAgTGlxdWlkID0gcmVxdWlyZSgnLi4vbGlxdWlkJyk7XG5cbiAgTGlxdWlkLkNvbnRleHQgPSAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIExJVEVSQUxTLCBjb21wYWN0LCBmbGF0dGVuLCByZWY7XG5cbiAgICBMSVRFUkFMUyA9IHtcbiAgICAgICduaWwnOiBudWxsLFxuICAgICAgJ251bGwnOiBudWxsLFxuICAgICAgJyc6IG51bGwsXG4gICAgICAndHJ1ZSc6IHRydWUsXG4gICAgICAnZmFsc2UnOiBmYWxzZVxuICAgIH07XG5cbiAgICByZWYgPSByZXF1aXJlKCcuL3V0aWwnKSwgY29tcGFjdCA9IHJlZi5jb21wYWN0LCBmbGF0dGVuID0gcmVmLmZsYXR0ZW47XG5cbiAgICBmdW5jdGlvbiBDb250ZXh0KGVudmlyb25tZW50cywgb3V0ZXJTY29wZSwgcmVnaXN0ZXJzLCByZXRocm93RXJyb3JzKSB7XG4gICAgICB0aGlzLmVudmlyb25tZW50cyA9IGZsYXR0ZW4oW2Vudmlyb25tZW50c10pO1xuICAgICAgdGhpcy5zY29wZXMgPSBbb3V0ZXJTY29wZSB8fCB7fV07XG4gICAgICB0aGlzLnJlZ2lzdGVycyA9IHJlZ2lzdGVycztcbiAgICAgIHRoaXMuZXJyb3JzID0gW107XG4gICAgICB0aGlzLnJldGhyb3dFcnJvcnMgPSByZXRocm93RXJyb3JzO1xuICAgICAgdGhpcy5zdHJhaW5lciA9IExpcXVpZC5TdHJhaW5lci5jcmVhdGUodGhpcyk7XG4gICAgICB0aGlzLmludGVycnVwdHMgPSBbXTtcbiAgICB9XG5cbiAgICBDb250ZXh0LnByb3RvdHlwZS5hZGRGaWx0ZXJzID0gZnVuY3Rpb24oZmlsdGVycykge1xuICAgICAgdmFyIGYsIGksIGxlbiwgcmVzdWx0cztcbiAgICAgIGZpbHRlcnMgPSBjb21wYWN0KGZsYXR0ZW4oW2ZpbHRlcnNdKSk7XG4gICAgICByZXN1bHRzID0gW107XG4gICAgICBmb3IgKGkgPSAwLCBsZW4gPSBmaWx0ZXJzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGYgPSBmaWx0ZXJzW2ldO1xuICAgICAgICBpZiAodHlwZW9mIGYgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgIHRocm93IExpcXVpZC5Bcmd1bWVudEVycm9yKFwiRXhwZWN0ZWQgbW9kdWxlIGJ1dCBnb3Q6IFwiICsgdHlwZW9mIGYpO1xuICAgICAgICB9XG4gICAgICAgIHJlc3VsdHMucHVzaCh0aGlzLnN0cmFpbmVyLmV4dGVuZChmKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0cztcbiAgICB9O1xuXG4gICAgQ29udGV4dC5wcm90b3R5cGUuaGFzSW50ZXJydXB0ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5pbnRlcnJ1cHRzLmxlbmd0aCA+IDA7XG4gICAgfTtcblxuICAgIENvbnRleHQucHJvdG90eXBlLnB1c2hJbnRlcnJ1cHQgPSBmdW5jdGlvbihlKSB7XG4gICAgICByZXR1cm4gdGhpcy5pbnRlcnJ1cHRzLnB1c2goZSk7XG4gICAgfTtcblxuICAgIENvbnRleHQucHJvdG90eXBlLnBvcEludGVycnVwdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuaW50ZXJydXB0cy5wb3AoKTtcbiAgICB9O1xuXG4gICAgQ29udGV4dC5wcm90b3R5cGUuaGFuZGxlRXJyb3IgPSBmdW5jdGlvbihlKSB7XG4gICAgICB0aGlzLmVycm9ycy5wdXNoKGUpO1xuICAgICAgaWYgKHRoaXMucmV0aHJvd0Vycm9ycykge1xuICAgICAgICBpZiAoZSBpbnN0YW5jZW9mIExpcXVpZC5TeW50YXhFcnJvcikge1xuICAgICAgICAgIHRocm93IFwiTGlxdWlkIHN5bnRheCBlcnJvcjogXCIgKyBlLm1lc3NhZ2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgXCJMaXF1aWQgZXJyb3I6IFwiICsgZS5tZXNzYWdlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuICAgIENvbnRleHQucHJvdG90eXBlLmludm9rZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGFyZ3MsIG1ldGhvZCwgcmVmMTtcbiAgICAgIG1ldGhvZCA9IGFyZ3VtZW50c1swXSwgYXJncyA9IDIgPD0gYXJndW1lbnRzLmxlbmd0aCA/IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSA6IFtdO1xuICAgICAgaWYgKHRoaXMuc3RyYWluZXIucmVzcG9uZFRvKG1ldGhvZCkpIHtcbiAgICAgICAgcmV0dXJuIChyZWYxID0gdGhpcy5zdHJhaW5lcilbbWV0aG9kXS5hcHBseShyZWYxLCBhcmdzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBhcmdzWzBdO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBDb250ZXh0LnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24obmV3U2NvcGUpIHtcbiAgICAgIGlmIChuZXdTY29wZSA9PSBudWxsKSB7XG4gICAgICAgIG5ld1Njb3BlID0ge307XG4gICAgICB9XG4gICAgICB0aGlzLnNjb3Blcy5wdXNoKG5ld1Njb3BlKTtcbiAgICAgIGlmICh0aGlzLnNjb3Blcy5sZW5ndGggPiAxMDApIHtcbiAgICAgICAgdGhyb3cgbmV3IExpcXVpZC5TdGFja0xldmVsRXJyb3IoXCJOZXN0aW5nIHRvbyBkZWVwXCIpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBDb250ZXh0LnByb3RvdHlwZS5tZXJnZSA9IGZ1bmN0aW9uKG5ld1Njb3BlKSB7XG4gICAgICB2YXIga2V5LCByZXN1bHRzLCB2YWw7XG4gICAgICByZXN1bHRzID0gW107XG4gICAgICBmb3IgKGtleSBpbiBuZXdTY29wZSkge1xuICAgICAgICB2YWwgPSBuZXdTY29wZVtrZXldO1xuICAgICAgICByZXN1bHRzLnB1c2godGhpcy5zY29wZXNbMF1ba2V5XSA9IHZhbCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0cztcbiAgICB9O1xuXG4gICAgQ29udGV4dC5wcm90b3R5cGUucG9wID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAodGhpcy5zY29wZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHRocm93IG5ldyBMaXF1aWQuQ29udGV4dEVycm9yKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5zY29wZXMucG9wKCk7XG4gICAgfTtcblxuICAgIENvbnRleHQucHJvdG90eXBlLnN0YWNrID0gZnVuY3Rpb24oJHlpZWxkLCBuZXdTY29wZSkge1xuICAgICAgaWYgKG5ld1Njb3BlID09IG51bGwpIHtcbiAgICAgICAgbmV3U2NvcGUgPSB7fTtcbiAgICAgIH1cbiAgICAgIHRoaXMucHVzaChuZXdTY29wZSk7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gJHlpZWxkKCk7XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICB0aGlzLnBvcCgpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBDb250ZXh0LnByb3RvdHlwZS5jbGVhckluc3RhbmNlQXNzaWducyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuc2NvcGVzWzBdID0ge307XG4gICAgfTtcblxuICAgIENvbnRleHQucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKHZhcm5hbWUpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlc29sdmUodmFybmFtZSk7XG4gICAgfTtcblxuICAgIENvbnRleHQucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uKHZhcm5hbWUsIHZhbHVlKSB7XG4gICAgICByZXR1cm4gdGhpcy5zY29wZXNbMF1bdmFybmFtZV0gPSB2YWx1ZTtcbiAgICB9O1xuXG4gICAgQ29udGV4dC5wcm90b3R5cGUuaGFzS2V5ID0gZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gdGhpcy5yZXNvbHZlKGtleSkgIT0gbnVsbDtcbiAgICB9O1xuXG4gICAgQ29udGV4dC5wcm90b3R5cGUucmVzb2x2ZSA9IGZ1bmN0aW9uKGtleSkge1xuICAgICAgdmFyICQsIGNoLCBpLCBqLCByZWYxLCByZWYyLCByZWYzLCByZWY0LCByZXN1bHRzLCByZXN1bHRzMTtcbiAgICAgIGlmIChMSVRFUkFMU1trZXldICE9IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIExJVEVSQUxTW2tleV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoJCA9IC9eJyguKiknJC8uZXhlYyhrZXkpKSB7XG4gICAgICAgICAgcmV0dXJuICRbMV07XG4gICAgICAgIH0gZWxzZSBpZiAoJCA9IC9eXCIoLiopXCIkLy5leGVjKGtleSkpIHtcbiAgICAgICAgICByZXR1cm4gJFsxXTtcbiAgICAgICAgfSBlbHNlIGlmICgkID0gL14oXFxkKykkLy5leGVjKGtleSkpIHtcbiAgICAgICAgICByZXR1cm4gcGFyc2VJbnQoJFsxXSwgMTApO1xuICAgICAgICB9IGVsc2UgaWYgKCQgPSAvXihcXGRbXFxkXFwuXSspJC8uZXhlYyhrZXkpKSB7XG4gICAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQoJFsxXSk7XG4gICAgICAgIH0gZWxzZSBpZiAoJCA9IC9eXFwoKFxcUyspXFwuXFwuKFxcUyspXFwpJC8uZXhlYyhrZXkpKSB7XG4gICAgICAgICAgaWYgKGlzTmFOKCRbMV0pKSB7XG4gICAgICAgICAgICByZXN1bHRzID0gW107XG4gICAgICAgICAgICBmb3IgKGNoID0gaSA9IHJlZjEgPSAkWzFdLmNoYXJDb2RlQXQoMCksIHJlZjIgPSAkWzJdLmNoYXJDb2RlQXQoMCk7IHJlZjEgPD0gcmVmMiA/IGkgPD0gcmVmMiA6IGkgPj0gcmVmMjsgY2ggPSByZWYxIDw9IHJlZjIgPyArK2kgOiAtLWkpIHtcbiAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKFN0cmluZy5mcm9tQ2hhckNvZGUoY2gpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICByZXN1bHRzMSA9IFtdO1xuICAgICAgICAgICAgICBmb3IgKHZhciBqID0gcmVmMyA9IHBhcnNlSW50KCRbMV0pLCByZWY0ID0gcGFyc2VJbnQoJFsyXSk7IHJlZjMgPD0gcmVmNCA/IGogPD0gcmVmNCA6IGogPj0gcmVmNDsgcmVmMyA8PSByZWY0ID8gaisrIDogai0tKXsgcmVzdWx0czEucHVzaChqKTsgfVxuICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0czE7XG4gICAgICAgICAgICB9KS5hcHBseSh0aGlzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMudmFyaWFibGUoa2V5KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbiAgICBDb250ZXh0LnByb3RvdHlwZS5maW5kVmFyaWFibGUgPSBmdW5jdGlvbihrZXkpIHtcbiAgICAgIHZhciBlLCBpLCBqLCBsZW4sIGxlbjEsIHJlZjEsIHJlZjIsIHMsIHNjb3BlLCB2YXJpYWJsZTtcbiAgICAgIHJlZjEgPSB0aGlzLnNjb3BlcztcbiAgICAgIGZvciAoaSA9IDAsIGxlbiA9IHJlZjEubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgcyA9IHJlZjFbaV07XG4gICAgICAgIGlmIChzW2tleV0gIT0gbnVsbCkge1xuICAgICAgICAgIHNjb3BlID0gcztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHNjb3BlID09IG51bGwpIHtcbiAgICAgICAgcmVmMiA9IHRoaXMuZW52aXJvbm1lbnRzO1xuICAgICAgICBmb3IgKGogPSAwLCBsZW4xID0gcmVmMi5sZW5ndGg7IGogPCBsZW4xOyBqKyspIHtcbiAgICAgICAgICBlID0gcmVmMltqXTtcbiAgICAgICAgICBpZiAodmFyaWFibGUgPSB0aGlzLmxvb2t1cEFuZEV2YWx1YXRlKGUsIGtleSkpIHtcbiAgICAgICAgICAgIHNjb3BlID0gZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgc2NvcGUgfHwgKHNjb3BlID0gdGhpcy5lbnZpcm9ubWVudHNbdGhpcy5lbnZpcm9ubWVudHMubGVuZ3RoIC0gMV0gfHwgdGhpcy5zY29wZXNbdGhpcy5zY29wZXMubGVuZ3RoIC0gMV0pO1xuICAgICAgdmFyaWFibGUgfHwgKHZhcmlhYmxlID0gdGhpcy5sb29rdXBBbmRFdmFsdWF0ZShzY29wZSwga2V5KSk7XG4gICAgICBpZiAodmFyaWFibGUgIT0gbnVsbCkge1xuICAgICAgICBpZiAodHlwZW9mIHZhcmlhYmxlLnNldENvbnRleHQgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgIHZhcmlhYmxlLnNldENvbnRleHQodGhpcyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB2YXJpYWJsZTtcbiAgICB9O1xuXG4gICAgQ29udGV4dC5wcm90b3R5cGUudmFyaWFibGUgPSBmdW5jdGlvbihtYXJrdXApIHtcbiAgICAgIHZhciAkLCBmaXJzdFBhcnQsIGksIGxlbiwgb2JqZWN0LCBwYXJ0LCBwYXJ0cywgc3F1YXJlQnJhY2tldGVkO1xuICAgICAgaWYgKHR5cGVvZiBtYXJrdXAgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICBwYXJ0cyA9IG1hcmt1cC5tYXRjaCgvXFxbW15cXF1dK1xcXXwoPzpbXFx3XFwtXVxcPz8pKy9nKTtcbiAgICAgIHNxdWFyZUJyYWNrZXRlZCA9IC9eXFxbKC4qKVxcXSQvO1xuICAgICAgZmlyc3RQYXJ0ID0gcGFydHMuc2hpZnQoKTtcbiAgICAgIGlmICgoJCA9IHNxdWFyZUJyYWNrZXRlZC5leGVjKGZpcnN0UGFydCkpKSB7XG4gICAgICAgIGZpcnN0UGFydCA9IHRoaXMucmVzb2x2ZSgkWzFdKTtcbiAgICAgIH1cbiAgICAgIGlmIChvYmplY3QgPSB0aGlzLmZpbmRWYXJpYWJsZShmaXJzdFBhcnQpKSB7XG4gICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IHBhcnRzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgcGFydCA9IHBhcnRzW2ldO1xuICAgICAgICAgIGlmICgoJCA9IHNxdWFyZUJyYWNrZXRlZC5leGVjKHBhcnQpKSkge1xuICAgICAgICAgICAgcGFydCA9IHRoaXMucmVzb2x2ZSgkWzFdKTtcbiAgICAgICAgICAgIG9iamVjdCA9IG9iamVjdFtwYXJ0XTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmplY3QgPT09ICdvYmplY3QnICYmIHBhcnQgaW4gb2JqZWN0KSB7XG4gICAgICAgICAgICAgIG9iamVjdCA9IHRoaXMubG9va3VwQW5kRXZhbHVhdGUob2JqZWN0LCBwYXJ0KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoL15cXGQrJC8udGVzdChwYXJ0KSkge1xuICAgICAgICAgICAgICBvYmplY3QgPSBvYmplY3RbcGFyc2VJbnQocGFydCwgMTApXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAob2JqZWN0ICE9IG51bGwpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqZWN0LnNldENvbnRleHQgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICBvYmplY3Quc2V0Q29udGV4dCh0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBvYmplY3Q7XG4gICAgfTtcblxuICAgIENvbnRleHQucHJvdG90eXBlLmxvb2t1cEFuZEV2YWx1YXRlID0gZnVuY3Rpb24ob2JqLCBrZXkpIHtcbiAgICAgIHZhciB2YWx1ZTtcbiAgICAgIGlmICh0eXBlb2YgKHZhbHVlID0gb2JqW2tleV0pID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiBvYmpba2V5XSA9IHZhbHVlKHRoaXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gQ29udGV4dDtcblxuICB9KSgpO1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjExLjFcbihmdW5jdGlvbigpIHtcbiAgdmFyIExpcXVpZCxcbiAgICBleHRlbmQgPSBmdW5jdGlvbihjaGlsZCwgcGFyZW50KSB7IGZvciAodmFyIGtleSBpbiBwYXJlbnQpIHsgaWYgKGhhc1Byb3AuY2FsbChwYXJlbnQsIGtleSkpIGNoaWxkW2tleV0gPSBwYXJlbnRba2V5XTsgfSBmdW5jdGlvbiBjdG9yKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gY2hpbGQ7IH0gY3Rvci5wcm90b3R5cGUgPSBwYXJlbnQucHJvdG90eXBlOyBjaGlsZC5wcm90b3R5cGUgPSBuZXcgY3RvcigpOyBjaGlsZC5fX3N1cGVyX18gPSBwYXJlbnQucHJvdG90eXBlOyByZXR1cm4gY2hpbGQ7IH0sXG4gICAgaGFzUHJvcCA9IHt9Lmhhc093blByb3BlcnR5O1xuXG4gIExpcXVpZCA9IHJlcXVpcmUoJy4uL2xpcXVpZCcpO1xuXG4gIExpcXVpZC5Eb2N1bWVudCA9IChmdW5jdGlvbihzdXBlckNsYXNzKSB7XG4gICAgZXh0ZW5kKERvY3VtZW50LCBzdXBlckNsYXNzKTtcblxuICAgIGZ1bmN0aW9uIERvY3VtZW50KHRva2Vucykge1xuICAgICAgdGhpcy5ibG9ja0RlbGltaXRlciA9IFtdO1xuICAgICAgdGhpcy5wYXJzZSh0b2tlbnMpO1xuICAgIH1cblxuICAgIERvY3VtZW50LnByb3RvdHlwZS5hc3NlcnRNaXNzaW5nRGVsaW1pdGF0aW9uID0gZnVuY3Rpb24oKSB7fTtcblxuICAgIHJldHVybiBEb2N1bWVudDtcblxuICB9KShMaXF1aWQuQmxvY2spO1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjExLjFcbihmdW5jdGlvbigpIHtcbiAgdmFyIExpcXVpZDtcblxuICBMaXF1aWQgPSByZXF1aXJlKCcuLi9saXF1aWQnKTtcblxuICBMaXF1aWQuRHJvcCA9IChmdW5jdGlvbigpIHtcbiAgICBmdW5jdGlvbiBEcm9wKCkge31cblxuICAgIERyb3AucHJvdG90eXBlLnNldENvbnRleHQgPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gICAgICByZXR1cm4gdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICB9O1xuXG4gICAgRHJvcC5wcm90b3R5cGUuYmVmb3JlTWV0aG9kID0gZnVuY3Rpb24obWV0aG9kKSB7fTtcblxuICAgIERyb3AucHJvdG90eXBlLmludm9rZURyb3AgPSBmdW5jdGlvbihtZXRob2QpIHtcbiAgICAgIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2YgRHJvcC5wcm90b3R5cGVbbWV0aG9kXSkge1xuICAgICAgICByZXR1cm4gdGhpc1ttZXRob2RdLmFwcGx5KHRoaXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYmVmb3JlTWV0aG9kKG1ldGhvZCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIERyb3AucHJvdG90eXBlLmhhc0tleSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG5cbiAgICByZXR1cm4gRHJvcDtcblxuICB9KSgpO1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjExLjFcbihmdW5jdGlvbigpIHtcbiAgdmFyIExpcXVpZCxcbiAgICBleHRlbmQgPSBmdW5jdGlvbihjaGlsZCwgcGFyZW50KSB7IGZvciAodmFyIGtleSBpbiBwYXJlbnQpIHsgaWYgKGhhc1Byb3AuY2FsbChwYXJlbnQsIGtleSkpIGNoaWxkW2tleV0gPSBwYXJlbnRba2V5XTsgfSBmdW5jdGlvbiBjdG9yKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gY2hpbGQ7IH0gY3Rvci5wcm90b3R5cGUgPSBwYXJlbnQucHJvdG90eXBlOyBjaGlsZC5wcm90b3R5cGUgPSBuZXcgY3RvcigpOyBjaGlsZC5fX3N1cGVyX18gPSBwYXJlbnQucHJvdG90eXBlOyByZXR1cm4gY2hpbGQ7IH0sXG4gICAgaGFzUHJvcCA9IHt9Lmhhc093blByb3BlcnR5O1xuXG4gIExpcXVpZCA9IHJlcXVpcmUoJy4uL2xpcXVpZCcpO1xuXG4gIExpcXVpZC5Bcmd1bWVudEVycm9yID0gKGZ1bmN0aW9uKHN1cGVyQ2xhc3MpIHtcbiAgICBleHRlbmQoQXJndW1lbnRFcnJvciwgc3VwZXJDbGFzcyk7XG5cbiAgICBmdW5jdGlvbiBBcmd1bWVudEVycm9yKCkge1xuICAgICAgcmV0dXJuIEFyZ3VtZW50RXJyb3IuX19zdXBlcl9fLmNvbnN0cnVjdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIEFyZ3VtZW50RXJyb3I7XG5cbiAgfSkoRXJyb3IpO1xuXG4gIExpcXVpZC5Db250ZXh0RXJyb3IgPSAoZnVuY3Rpb24oc3VwZXJDbGFzcykge1xuICAgIGV4dGVuZChDb250ZXh0RXJyb3IsIHN1cGVyQ2xhc3MpO1xuXG4gICAgZnVuY3Rpb24gQ29udGV4dEVycm9yKCkge1xuICAgICAgcmV0dXJuIENvbnRleHRFcnJvci5fX3N1cGVyX18uY29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gQ29udGV4dEVycm9yO1xuXG4gIH0pKEVycm9yKTtcblxuICBMaXF1aWQuRmlsdGVyTm90Rm91bmQgPSAoZnVuY3Rpb24oc3VwZXJDbGFzcykge1xuICAgIGV4dGVuZChGaWx0ZXJOb3RGb3VuZCwgc3VwZXJDbGFzcyk7XG5cbiAgICBmdW5jdGlvbiBGaWx0ZXJOb3RGb3VuZCgpIHtcbiAgICAgIHJldHVybiBGaWx0ZXJOb3RGb3VuZC5fX3N1cGVyX18uY29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gRmlsdGVyTm90Rm91bmQ7XG5cbiAgfSkoRXJyb3IpO1xuXG4gIExpcXVpZC5GaWxlU3lzdGVtRXJyb3IgPSAoZnVuY3Rpb24oc3VwZXJDbGFzcykge1xuICAgIGV4dGVuZChGaWxlU3lzdGVtRXJyb3IsIHN1cGVyQ2xhc3MpO1xuXG4gICAgZnVuY3Rpb24gRmlsZVN5c3RlbUVycm9yKCkge1xuICAgICAgcmV0dXJuIEZpbGVTeXN0ZW1FcnJvci5fX3N1cGVyX18uY29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gRmlsZVN5c3RlbUVycm9yO1xuXG4gIH0pKEVycm9yKTtcblxuICBMaXF1aWQuU3RhbmRhcmRFcnJvciA9IChmdW5jdGlvbihzdXBlckNsYXNzKSB7XG4gICAgZXh0ZW5kKFN0YW5kYXJkRXJyb3IsIHN1cGVyQ2xhc3MpO1xuXG4gICAgZnVuY3Rpb24gU3RhbmRhcmRFcnJvcigpIHtcbiAgICAgIHJldHVybiBTdGFuZGFyZEVycm9yLl9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIHJldHVybiBTdGFuZGFyZEVycm9yO1xuXG4gIH0pKEVycm9yKTtcblxuICBMaXF1aWQuU3ludGF4RXJyb3IgPSAoZnVuY3Rpb24oc3VwZXJDbGFzcykge1xuICAgIGV4dGVuZChTeW50YXhFcnJvciwgc3VwZXJDbGFzcyk7XG5cbiAgICBmdW5jdGlvbiBTeW50YXhFcnJvcigpIHtcbiAgICAgIHJldHVybiBTeW50YXhFcnJvci5fX3N1cGVyX18uY29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gU3ludGF4RXJyb3I7XG5cbiAgfSkoRXJyb3IpO1xuXG4gIExpcXVpZC5TdGFja0xldmVsRXJyb3IgPSAoZnVuY3Rpb24oc3VwZXJDbGFzcykge1xuICAgIGV4dGVuZChTdGFja0xldmVsRXJyb3IsIHN1cGVyQ2xhc3MpO1xuXG4gICAgZnVuY3Rpb24gU3RhY2tMZXZlbEVycm9yKCkge1xuICAgICAgcmV0dXJuIFN0YWNrTGV2ZWxFcnJvci5fX3N1cGVyX18uY29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gU3RhY2tMZXZlbEVycm9yO1xuXG4gIH0pKEVycm9yKTtcblxuICBMaXF1aWQuTWVtb3J5RXJyb3IgPSAoZnVuY3Rpb24oc3VwZXJDbGFzcykge1xuICAgIGV4dGVuZChNZW1vcnlFcnJvciwgc3VwZXJDbGFzcyk7XG5cbiAgICBmdW5jdGlvbiBNZW1vcnlFcnJvcigpIHtcbiAgICAgIHJldHVybiBNZW1vcnlFcnJvci5fX3N1cGVyX18uY29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gTWVtb3J5RXJyb3I7XG5cbiAgfSkoRXJyb3IpO1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjExLjFcbihmdW5jdGlvbigpIHtcbiAgdmFyIExpcXVpZCwgZnMsIHBhdGgsXG4gICAgYmluZCA9IGZ1bmN0aW9uKGZuLCBtZSl7IHJldHVybiBmdW5jdGlvbigpeyByZXR1cm4gZm4uYXBwbHkobWUsIGFyZ3VtZW50cyk7IH07IH07XG5cbiAgZnMgPSByZXF1aXJlKCdmcycpO1xuXG4gIHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5cbiAgTGlxdWlkID0gcmVxdWlyZSgnLi4vbGlxdWlkJyk7XG5cbiAgTGlxdWlkLkJsYW5rRmlsZVN5c3RlbSA9IChmdW5jdGlvbigpIHtcbiAgICBmdW5jdGlvbiBCbGFua0ZpbGVTeXN0ZW0oKSB7fVxuXG4gICAgQmxhbmtGaWxlU3lzdGVtLnByb3RvdHlwZS5yZWFkVGVtcGxhdGVGaWxlID0gZnVuY3Rpb24ocGF0aCkge1xuICAgICAgdGhyb3cgXCJUaGlzIGxpcXVpZCBjb250ZXh0IGRvZXMgbm90IGFsbG93IGluY2x1ZGVzLlwiO1xuICAgIH07XG5cbiAgICByZXR1cm4gQmxhbmtGaWxlU3lzdGVtO1xuXG4gIH0pKCk7XG5cbiAgTGlxdWlkLkxvY2FsRmlsZVN5c3RlbSA9IChmdW5jdGlvbigpIHtcbiAgICBmdW5jdGlvbiBMb2NhbEZpbGVTeXN0ZW0ocm9vdCkge1xuICAgICAgdGhpcy5yb290ID0gcm9vdDtcbiAgICAgIHRoaXMucmVhZFRlbXBsYXRlRmlsZSA9IGJpbmQodGhpcy5yZWFkVGVtcGxhdGVGaWxlLCB0aGlzKTtcbiAgICB9XG5cbiAgICBMb2NhbEZpbGVTeXN0ZW0ucHJvdG90eXBlLnJlYWRUZW1wbGF0ZUZpbGUgPSBmdW5jdGlvbigkdGVtcGxhdGUpIHtcbiAgICAgIHJldHVybiBTdHJpbmcoZnMucmVhZEZpbGVTeW5jKHBhdGgucmVzb2x2ZSh0aGlzLnJvb3QsICR0ZW1wbGF0ZSkpKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIExvY2FsRmlsZVN5c3RlbTtcblxuICB9KSgpO1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjExLjFcbihmdW5jdGlvbigpIHtcbiAgdmFyIExpcXVpZCxcbiAgICBleHRlbmQgPSBmdW5jdGlvbihjaGlsZCwgcGFyZW50KSB7IGZvciAodmFyIGtleSBpbiBwYXJlbnQpIHsgaWYgKGhhc1Byb3AuY2FsbChwYXJlbnQsIGtleSkpIGNoaWxkW2tleV0gPSBwYXJlbnRba2V5XTsgfSBmdW5jdGlvbiBjdG9yKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gY2hpbGQ7IH0gY3Rvci5wcm90b3R5cGUgPSBwYXJlbnQucHJvdG90eXBlOyBjaGlsZC5wcm90b3R5cGUgPSBuZXcgY3RvcigpOyBjaGlsZC5fX3N1cGVyX18gPSBwYXJlbnQucHJvdG90eXBlOyByZXR1cm4gY2hpbGQ7IH0sXG4gICAgaGFzUHJvcCA9IHt9Lmhhc093blByb3BlcnR5O1xuXG4gIExpcXVpZCA9IHJlcXVpcmUoJy4uL2xpcXVpZCcpO1xuXG4gIExpcXVpZC5JbnRlcnJ1cHQgPSAoZnVuY3Rpb24oKSB7XG4gICAgSW50ZXJydXB0LnByb3RvdHlwZS5tZXNzYWdlID0gJyc7XG5cbiAgICBmdW5jdGlvbiBJbnRlcnJ1cHQobWVzc2FnZSkge1xuICAgICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZSAhPSBudWxsID8gbWVzc2FnZSA6ICdpbnRlcnJ1cHQnO1xuICAgIH1cblxuICAgIHJldHVybiBJbnRlcnJ1cHQ7XG5cbiAgfSkoKTtcblxuICBMaXF1aWQuQnJlYWtJbnRlcnJ1cHQgPSAoZnVuY3Rpb24oc3VwZXJDbGFzcykge1xuICAgIGV4dGVuZChCcmVha0ludGVycnVwdCwgc3VwZXJDbGFzcyk7XG5cbiAgICBmdW5jdGlvbiBCcmVha0ludGVycnVwdCgpIHtcbiAgICAgIHJldHVybiBCcmVha0ludGVycnVwdC5fX3N1cGVyX18uY29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gQnJlYWtJbnRlcnJ1cHQ7XG5cbiAgfSkoTGlxdWlkLkludGVycnVwdCk7XG5cbiAgTGlxdWlkLkNvbnRpbnVlSW50ZXJydXB0ID0gKGZ1bmN0aW9uKHN1cGVyQ2xhc3MpIHtcbiAgICBleHRlbmQoQ29udGludWVJbnRlcnJ1cHQsIHN1cGVyQ2xhc3MpO1xuXG4gICAgZnVuY3Rpb24gQ29udGludWVJbnRlcnJ1cHQoKSB7XG4gICAgICByZXR1cm4gQ29udGludWVJbnRlcnJ1cHQuX19zdXBlcl9fLmNvbnN0cnVjdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIENvbnRpbnVlSW50ZXJydXB0O1xuXG4gIH0pKExpcXVpZC5JbnRlcnJ1cHQpO1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjExLjFcbihmdW5jdGlvbigpIHtcbiAgdmFyIExpcXVpZCwgc3RyZnRpbWU7XG5cbiAgc3RyZnRpbWUgPSByZXF1aXJlKCdzdHJmdGltZScpO1xuXG4gIExpcXVpZCA9IHJlcXVpcmUoJy4uL2xpcXVpZCcpO1xuXG4gIExpcXVpZC5TdGFuZGFyZEZpbHRlcnMgPSAoZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gU3RhbmRhcmRGaWx0ZXJzKCkge31cblxuICAgIFN0YW5kYXJkRmlsdGVycy5zaXplID0gZnVuY3Rpb24oaXRlcmFibGUpIHtcbiAgICAgIGlmIChpdGVyYWJsZVtcImxlbmd0aFwiXSkge1xuICAgICAgICByZXR1cm4gaXRlcmFibGUubGVuZ3RoO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgICB9XG4gICAgfTtcblxuICAgIFN0YW5kYXJkRmlsdGVycy5kb3duY2FzZSA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICByZXR1cm4gaW5wdXQudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpO1xuICAgIH07XG5cbiAgICBTdGFuZGFyZEZpbHRlcnMudXBjYXNlID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgIHJldHVybiBpbnB1dC50b1N0cmluZygpLnRvVXBwZXJDYXNlKCk7XG4gICAgfTtcblxuICAgIFN0YW5kYXJkRmlsdGVycy5jYXBpdGFsaXplID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgIHZhciBzdHI7XG4gICAgICBzdHIgPSBpbnB1dC50b1N0cmluZygpO1xuICAgICAgcmV0dXJuIHN0ci5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHN0ci5zdWJzdHJpbmcoMSkudG9Mb3dlckNhc2UoKTtcbiAgICB9O1xuXG4gICAgU3RhbmRhcmRGaWx0ZXJzLmVzY2FwZSA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICBpbnB1dCA9IGlucHV0LnRvU3RyaW5nKCk7XG4gICAgICBpbnB1dCA9IGlucHV0LnJlcGxhY2UoLyYvZywgXCImYW1wO1wiKTtcbiAgICAgIGlucHV0ID0gaW5wdXQucmVwbGFjZSgvPC9nLCBcIiZsdDtcIik7XG4gICAgICBpbnB1dCA9IGlucHV0LnJlcGxhY2UoLz4vZywgXCImZ3Q7XCIpO1xuICAgICAgaW5wdXQgPSBpbnB1dC5yZXBsYWNlKC9cIi9nLCBcIiZxdW90O1wiKTtcbiAgICAgIHJldHVybiBpbnB1dDtcbiAgICB9O1xuXG4gICAgU3RhbmRhcmRGaWx0ZXJzLmggPSBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgaW5wdXQgPSBpbnB1dC50b1N0cmluZygpO1xuICAgICAgaW5wdXQgPSBpbnB1dC5yZXBsYWNlKC8mL2csIFwiJmFtcDtcIik7XG4gICAgICBpbnB1dCA9IGlucHV0LnJlcGxhY2UoLzwvZywgXCImbHQ7XCIpO1xuICAgICAgaW5wdXQgPSBpbnB1dC5yZXBsYWNlKC8+L2csIFwiJmd0O1wiKTtcbiAgICAgIGlucHV0ID0gaW5wdXQucmVwbGFjZSgvXCIvZywgXCImcXVvdDtcIik7XG4gICAgICByZXR1cm4gaW5wdXQ7XG4gICAgfTtcblxuICAgIFN0YW5kYXJkRmlsdGVycy50cnVuY2F0ZSA9IGZ1bmN0aW9uKGlucHV0LCBsZW5ndGgsIHN0cmluZykge1xuICAgICAgdmFyIHNlZztcbiAgICAgIGlmICghaW5wdXQgfHwgaW5wdXQgPT09IFwiXCIpIHtcbiAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICB9XG4gICAgICBsZW5ndGggPSBsZW5ndGggfHwgNTA7XG4gICAgICBzdHJpbmcgPSBzdHJpbmcgfHwgXCIuLi5cIjtcbiAgICAgIHNlZyA9IGlucHV0LnNsaWNlKDAsIGxlbmd0aCk7XG4gICAgICBpZiAoaW5wdXQubGVuZ3RoID4gbGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBpbnB1dC5zbGljZSgwLCBsZW5ndGgpICsgc3RyaW5nO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGlucHV0O1xuICAgICAgfVxuICAgIH07XG5cbiAgICBTdGFuZGFyZEZpbHRlcnMudHJ1bmNhdGV3b3JkcyA9IGZ1bmN0aW9uKGlucHV0LCB3b3Jkcywgc3RyaW5nKSB7XG4gICAgICB2YXIgbCwgd29yZGxpc3Q7XG4gICAgICBpZiAoIWlucHV0IHx8IGlucHV0ID09PSBcIlwiKSB7XG4gICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgfVxuICAgICAgd29yZHMgPSBwYXJzZUludCh3b3JkcyB8fCAxNSk7XG4gICAgICBzdHJpbmcgPSBzdHJpbmcgfHwgXCIuLi5cIjtcbiAgICAgIHdvcmRsaXN0ID0gaW5wdXQudG9TdHJpbmcoKS5zcGxpdChcIiBcIik7XG4gICAgICBsID0gTWF0aC5tYXgod29yZHMsIDApO1xuICAgICAgaWYgKHdvcmRsaXN0Lmxlbmd0aCA+IGwpIHtcbiAgICAgICAgcmV0dXJuIHdvcmRsaXN0LnNsaWNlKDAsIGwpLmpvaW4oXCIgXCIpICsgc3RyaW5nO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGlucHV0O1xuICAgICAgfVxuICAgIH07XG5cbiAgICBTdGFuZGFyZEZpbHRlcnMudHJ1bmNhdGVfd29yZHMgPSBmdW5jdGlvbihpbnB1dCwgd29yZHMsIHN0cmluZykge1xuICAgICAgdmFyIGwsIHdvcmRsaXN0O1xuICAgICAgaWYgKCFpbnB1dCB8fCBpbnB1dCA9PT0gXCJcIikge1xuICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgIH1cbiAgICAgIHdvcmRzID0gcGFyc2VJbnQod29yZHMgfHwgMTUpO1xuICAgICAgc3RyaW5nID0gc3RyaW5nIHx8IFwiLi4uXCI7XG4gICAgICB3b3JkbGlzdCA9IGlucHV0LnRvU3RyaW5nKCkuc3BsaXQoXCIgXCIpO1xuICAgICAgbCA9IE1hdGgubWF4KHdvcmRzLCAwKTtcbiAgICAgIGlmICh3b3JkbGlzdC5sZW5ndGggPiBsKSB7XG4gICAgICAgIHJldHVybiB3b3JkbGlzdC5zbGljZSgwLCBsKS5qb2luKFwiIFwiKSArIHN0cmluZztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBpbnB1dDtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgU3RhbmRhcmRGaWx0ZXJzLnN0cmlwX2h0bWwgPSBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgcmV0dXJuIGlucHV0LnRvU3RyaW5nKCkucmVwbGFjZSgvPC4qPz4vZywgXCJcIik7XG4gICAgfTtcblxuICAgIFN0YW5kYXJkRmlsdGVycy5zdHJpcF9uZXdsaW5lcyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICByZXR1cm4gaW5wdXQudG9TdHJpbmcoKS5yZXBsYWNlKC9cXG4vZywgXCJcIik7XG4gICAgfTtcblxuICAgIFN0YW5kYXJkRmlsdGVycy5qb2luID0gZnVuY3Rpb24oaW5wdXQsIHNlcGFyYXRvcikge1xuICAgICAgc2VwYXJhdG9yID0gc2VwYXJhdG9yIHx8IFwiIFwiO1xuICAgICAgcmV0dXJuIGlucHV0LmpvaW4oc2VwYXJhdG9yKTtcbiAgICB9O1xuXG4gICAgU3RhbmRhcmRGaWx0ZXJzLnNwbGl0ID0gZnVuY3Rpb24oaW5wdXQsIHNlcGFyYXRvcikge1xuICAgICAgc2VwYXJhdG9yID0gc2VwYXJhdG9yIHx8IFwiIFwiO1xuICAgICAgcmV0dXJuIGlucHV0LnNwbGl0KHNlcGFyYXRvcik7XG4gICAgfTtcblxuICAgIFN0YW5kYXJkRmlsdGVycy5zb3J0ID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgIHJldHVybiBpbnB1dC5zb3J0KCk7XG4gICAgfTtcblxuICAgIFN0YW5kYXJkRmlsdGVycy5yZXZlcnNlID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgIHJldHVybiBpbnB1dC5yZXZlcnNlKCk7XG4gICAgfTtcblxuICAgIFN0YW5kYXJkRmlsdGVycy5yZXBsYWNlID0gZnVuY3Rpb24oaW5wdXQsIHN0cmluZywgcmVwbGFjZW1lbnQpIHtcbiAgICAgIHJlcGxhY2VtZW50ID0gcmVwbGFjZW1lbnQgfHwgXCJcIjtcbiAgICAgIHJldHVybiBpbnB1dC50b1N0cmluZygpLnJlcGxhY2UobmV3IFJlZ0V4cChzdHJpbmcsIFwiZ1wiKSwgcmVwbGFjZW1lbnQpO1xuICAgIH07XG5cbiAgICBTdGFuZGFyZEZpbHRlcnMucmVwbGFjZV9maXJzdCA9IGZ1bmN0aW9uKGlucHV0LCBzdHJpbmcsIHJlcGxhY2VtZW50KSB7XG4gICAgICByZXBsYWNlbWVudCA9IHJlcGxhY2VtZW50IHx8IFwiXCI7XG4gICAgICByZXR1cm4gaW5wdXQudG9TdHJpbmcoKS5yZXBsYWNlKG5ldyBSZWdFeHAoc3RyaW5nLCBcIlwiKSwgcmVwbGFjZW1lbnQpO1xuICAgIH07XG5cbiAgICBTdGFuZGFyZEZpbHRlcnMubmV3bGluZV90b19iciA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICByZXR1cm4gaW5wdXQudG9TdHJpbmcoKS5yZXBsYWNlKC9cXG4vZywgXCI8YnIvPlxcblwiKTtcbiAgICB9O1xuXG4gICAgU3RhbmRhcmRGaWx0ZXJzLmRhdGUgPSBmdW5jdGlvbihpbnB1dCwgZm9ybWF0KSB7XG4gICAgICB2YXIgZGF0ZTtcbiAgICAgIGRhdGUgPSB2b2lkIDA7XG4gICAgICBpZiAoaW5wdXQgaW5zdGFuY2VvZiBEYXRlKSB7XG4gICAgICAgIGRhdGUgPSBpbnB1dDtcbiAgICAgIH1cbiAgICAgIGlmICgoIShkYXRlIGluc3RhbmNlb2YgRGF0ZSkpICYmIGlucHV0ID09PSBcIm5vd1wiKSB7XG4gICAgICAgIGRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgICAgfVxuICAgICAgaWYgKCEoZGF0ZSBpbnN0YW5jZW9mIERhdGUpKSB7XG4gICAgICAgIGRhdGUgPSBuZXcgRGF0ZShpbnB1dCk7XG4gICAgICB9XG4gICAgICBpZiAoIShkYXRlIGluc3RhbmNlb2YgRGF0ZSkpIHtcbiAgICAgICAgZGF0ZSA9IG5ldyBEYXRlKERhdGUucGFyc2UoaW5wdXQpKTtcbiAgICAgIH1cbiAgICAgIGlmICghKGRhdGUgaW5zdGFuY2VvZiBEYXRlKSkge1xuICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICB9XG4gICAgICByZXR1cm4gc3RyZnRpbWUoZm9ybWF0LCBkYXRlKTtcbiAgICB9O1xuXG4gICAgU3RhbmRhcmRGaWx0ZXJzLmZpcnN0ID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgIHJldHVybiBpbnB1dFswXTtcbiAgICB9O1xuXG4gICAgU3RhbmRhcmRGaWx0ZXJzLmxhc3QgPSBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgaW5wdXQgPSBpbnB1dDtcbiAgICAgIHJldHVybiBpbnB1dFtpbnB1dC5sZW5ndGggLSAxXTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIFN0YW5kYXJkRmlsdGVycztcblxuICB9KSgpO1xuXG4gIExpcXVpZC5UZW1wbGF0ZS5yZWdpc3RlckZpbHRlcihMaXF1aWQuU3RhbmRhcmRGaWx0ZXJzKTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS4xMS4xXG4oZnVuY3Rpb24oKSB7XG4gIHZhciBMaXF1aWQsXG4gICAgaW5kZXhPZiA9IFtdLmluZGV4T2YgfHwgZnVuY3Rpb24oaXRlbSkgeyBmb3IgKHZhciBpID0gMCwgbCA9IHRoaXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7IGlmIChpIGluIHRoaXMgJiYgdGhpc1tpXSA9PT0gaXRlbSkgcmV0dXJuIGk7IH0gcmV0dXJuIC0xOyB9O1xuXG4gIExpcXVpZCA9IHJlcXVpcmUoJy4uL2xpcXVpZCcpO1xuXG4gIExpcXVpZC5TdHJhaW5lciA9IChmdW5jdGlvbigpIHtcbiAgICB2YXIgSU5URVJOQUxfTUVUSE9EO1xuXG4gICAgSU5URVJOQUxfTUVUSE9EID0gL15fXy87XG5cbiAgICBTdHJhaW5lci5yZXF1aXJlZE1ldGhvZHMgPSBbJ3Jlc3BvbmRUbycsICdjb250ZXh0JywgJ2V4dGVuZCddO1xuXG4gICAgU3RyYWluZXIuZmlsdGVycyA9IHt9O1xuXG4gICAgZnVuY3Rpb24gU3RyYWluZXIoY29udGV4dCkge1xuICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICB9XG5cbiAgICBTdHJhaW5lci5nbG9iYWxGaWx0ZXIgPSBmdW5jdGlvbihmaWx0ZXIpIHtcbiAgICAgIGlmICh0eXBlb2YgZmlsdGVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBMaXF1aWQuQXJndW1lbnRFcnJvcihcIlBhc3NlZCBmaWx0ZXIgaXMgbm90IGEgbW9kdWxlXCIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIFN0cmFpbmVyLmZpbHRlcnNbZmlsdGVyLm5hbWVdID0gZmlsdGVyO1xuICAgIH07XG5cbiAgICBTdHJhaW5lci5jcmVhdGUgPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gICAgICB2YXIgaywgbSwgcmVmLCBzdHJhaW5lcjtcbiAgICAgIHN0cmFpbmVyID0gbmV3IFN0cmFpbmVyKGNvbnRleHQpO1xuICAgICAgcmVmID0gU3RyYWluZXIuZmlsdGVycztcbiAgICAgIGZvciAoayBpbiByZWYpIHtcbiAgICAgICAgbSA9IHJlZltrXTtcbiAgICAgICAgc3RyYWluZXIuZXh0ZW5kKG0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHN0cmFpbmVyO1xuICAgIH07XG5cbiAgICBTdHJhaW5lci5wcm90b3R5cGUucmVzcG9uZFRvID0gZnVuY3Rpb24obWV0aG9kTmFtZSkge1xuICAgICAgbWV0aG9kTmFtZSA9IG1ldGhvZE5hbWUudG9TdHJpbmcoKTtcbiAgICAgIGlmIChJTlRFUk5BTF9NRVRIT0QudGVzdChtZXRob2ROYW1lKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAoaW5kZXhPZi5jYWxsKFN0cmFpbmVyLnJlcXVpcmVkTWV0aG9kcywgbWV0aG9kTmFtZSkgPj0gMCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAodGhpc1ttZXRob2ROYW1lXSAhPSBudWxsKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBTdHJhaW5lci5wcm90b3R5cGUuZXh0ZW5kID0gZnVuY3Rpb24obSkge1xuICAgICAgdmFyIG5hbWUsIHJlc3VsdHMsIHZhbDtcbiAgICAgIHJlc3VsdHMgPSBbXTtcbiAgICAgIGZvciAobmFtZSBpbiBtKSB7XG4gICAgICAgIHZhbCA9IG1bbmFtZV07XG4gICAgICAgIGlmICh0aGlzW25hbWVdID09IG51bGwpIHtcbiAgICAgICAgICByZXN1bHRzLnB1c2godGhpc1tuYW1lXSA9IHZhbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzdWx0cy5wdXNoKHZvaWQgMCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH07XG5cbiAgICByZXR1cm4gU3RyYWluZXI7XG5cbiAgfSkoKTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS4xMS4xXG4oZnVuY3Rpb24oKSB7XG4gIHZhciBMaXF1aWQ7XG5cbiAgTGlxdWlkID0gcmVxdWlyZSgnLi4vbGlxdWlkJyk7XG5cbiAgTGlxdWlkLlRhZyA9IChmdW5jdGlvbigpIHtcbiAgICBmdW5jdGlvbiBUYWcodGFnTmFtZSwgbWFya3VwLCB0b2tlbnMpIHtcbiAgICAgIHRoaXMudGFnTmFtZSA9IHRhZ05hbWU7XG4gICAgICB0aGlzLm1hcmt1cCA9IG1hcmt1cDtcbiAgICAgIHRoaXMubm9kZWxpc3QgPSB0aGlzLm5vZGVsaXN0IHx8IFtdO1xuICAgICAgdGhpcy5wYXJzZSh0b2tlbnMpO1xuICAgIH1cblxuICAgIFRhZy5wcm90b3R5cGUucGFyc2UgPSBmdW5jdGlvbih0b2tlbnMpIHt9O1xuXG4gICAgVGFnLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gICAgICByZXR1cm4gXCJcIjtcbiAgICB9O1xuXG4gICAgcmV0dXJuIFRhZztcblxuICB9KSgpO1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjExLjFcbihmdW5jdGlvbigpIHtcbiAgdmFyIExpcXVpZCxcbiAgICBleHRlbmQgPSBmdW5jdGlvbihjaGlsZCwgcGFyZW50KSB7IGZvciAodmFyIGtleSBpbiBwYXJlbnQpIHsgaWYgKGhhc1Byb3AuY2FsbChwYXJlbnQsIGtleSkpIGNoaWxkW2tleV0gPSBwYXJlbnRba2V5XTsgfSBmdW5jdGlvbiBjdG9yKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gY2hpbGQ7IH0gY3Rvci5wcm90b3R5cGUgPSBwYXJlbnQucHJvdG90eXBlOyBjaGlsZC5wcm90b3R5cGUgPSBuZXcgY3RvcigpOyBjaGlsZC5fX3N1cGVyX18gPSBwYXJlbnQucHJvdG90eXBlOyByZXR1cm4gY2hpbGQ7IH0sXG4gICAgaGFzUHJvcCA9IHt9Lmhhc093blByb3BlcnR5O1xuXG4gIExpcXVpZCA9IHJlcXVpcmUoJy4uLy4uL2xpcXVpZCcpO1xuXG4gIExpcXVpZC5UYWdzLkFzc2lnbiA9IChmdW5jdGlvbihzdXBlckNsYXNzKSB7XG4gICAgdmFyIFN5bnRheDtcblxuICAgIGV4dGVuZChBc3NpZ24sIHN1cGVyQ2xhc3MpO1xuXG4gICAgU3ludGF4ID0gUmVnRXhwKFwiKCg/OlwiICsgTGlxdWlkLlZhcmlhYmxlU2lnbmF0dXJlLnNvdXJjZSArIFwiKSspXFxcXHMqPVxcXFxzKigoPzpcIiArIExpcXVpZC5TdHJpY3RRdW90ZWRGcmFnbWVudC5zb3VyY2UgKyBcIikrKVwiKTtcblxuICAgIGZ1bmN0aW9uIEFzc2lnbih0YWdOYW1lLCBtYXJrdXAsIHRva2Vucykge1xuICAgICAgdmFyICQ7XG4gICAgICBpZiAoJCA9IG1hcmt1cC5tYXRjaChTeW50YXgpKSB7XG4gICAgICAgIHRoaXMudG8gPSAkWzFdO1xuICAgICAgICB0aGlzLmZyb20gPSAkWzJdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IExpcXVpZC5TeW50YXhFcnJvcihcIlN5bnRheCBlcnJvciBpbiAnYXNzaWduJyAtIFZhbGlkIHN5bnRheDogYXNzaWduIFt2YXJdID0gW3NvdXJjZV1cIik7XG4gICAgICB9XG4gICAgICBBc3NpZ24uX19zdXBlcl9fLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgdGFnTmFtZSwgbWFya3VwLCB0b2tlbnMpO1xuICAgIH1cblxuICAgIEFzc2lnbi5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oY29udGV4dCkge1xuICAgICAgdmFyIGxhc3Q7XG4gICAgICBsYXN0ID0gY29udGV4dC5zY29wZXMubGVuZ3RoIC0gMTtcbiAgICAgIGNvbnRleHQuc2NvcGVzW2xhc3RdW3RoaXMudG9dID0gY29udGV4dC5nZXQodGhpcy5mcm9tKTtcbiAgICAgIHJldHVybiBcIlwiO1xuICAgIH07XG5cbiAgICByZXR1cm4gQXNzaWduO1xuXG4gIH0pKExpcXVpZC5UYWcpO1xuXG4gIExpcXVpZC5UZW1wbGF0ZS5yZWdpc3RlclRhZyhcImFzc2lnblwiLCBMaXF1aWQuVGFncy5Bc3NpZ24pO1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjExLjFcbihmdW5jdGlvbigpIHtcbiAgdmFyIExpcXVpZCxcbiAgICBleHRlbmQgPSBmdW5jdGlvbihjaGlsZCwgcGFyZW50KSB7IGZvciAodmFyIGtleSBpbiBwYXJlbnQpIHsgaWYgKGhhc1Byb3AuY2FsbChwYXJlbnQsIGtleSkpIGNoaWxkW2tleV0gPSBwYXJlbnRba2V5XTsgfSBmdW5jdGlvbiBjdG9yKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gY2hpbGQ7IH0gY3Rvci5wcm90b3R5cGUgPSBwYXJlbnQucHJvdG90eXBlOyBjaGlsZC5wcm90b3R5cGUgPSBuZXcgY3RvcigpOyBjaGlsZC5fX3N1cGVyX18gPSBwYXJlbnQucHJvdG90eXBlOyByZXR1cm4gY2hpbGQ7IH0sXG4gICAgaGFzUHJvcCA9IHt9Lmhhc093blByb3BlcnR5O1xuXG4gIExpcXVpZCA9IHJlcXVpcmUoJy4uLy4uL2xpcXVpZCcpO1xuXG4gIExpcXVpZC5UYWdzLkJsb2NrRHJvcCA9IChmdW5jdGlvbihzdXBlckNsYXNzKSB7XG4gICAgZXh0ZW5kKEJsb2NrRHJvcCwgc3VwZXJDbGFzcyk7XG5cbiAgICBmdW5jdGlvbiBCbG9ja0Ryb3AoYmxvY2spIHtcbiAgICAgIHRoaXMuYmxvY2sgPSBibG9jaztcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCAnc3VwZXInLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuYmxvY2suY2FsbFN1cGVyKHRoaXMuY29udGV4dCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBCbG9ja0Ryb3A7XG5cbiAgfSkoTGlxdWlkLkRyb3ApO1xuXG4gIExpcXVpZC5UYWdzLkJsb2NrID0gKGZ1bmN0aW9uKHN1cGVyQ2xhc3MpIHtcbiAgICB2YXIgU3ludGF4O1xuXG4gICAgZXh0ZW5kKEJsb2NrLCBzdXBlckNsYXNzKTtcblxuICAgIFN5bnRheCA9IFJlZ0V4cChcIihcIiArIExpcXVpZC5RdW90ZWRGcmFnbWVudC5zb3VyY2UgKyBcIilcIik7XG5cbiAgICBCbG9jay5wcm90b3R5cGUucGFyZW50ID0gbnVsbDtcblxuICAgIEJsb2NrLnByb3RvdHlwZS5uYW1lID0gJyc7XG5cbiAgICBmdW5jdGlvbiBCbG9jayh0YWdOYW1lLCBtYXJrdXAsIHRva2Vucykge1xuICAgICAgdmFyICQ7XG4gICAgICBpZiAoJCA9IG1hcmt1cC5tYXRjaChTeW50YXgpKSB7XG4gICAgICAgIHRoaXMubmFtZSA9ICRbMV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgTGlxdWlkLlN5bnRheEVycm9yKFwiU3ludGF4IEVycm9yIGluICdibG9jaycgLSBWYWxpZCBzeW50YXg6IGJsb2NrIFtuYW1lXVwiKTtcbiAgICAgIH1cbiAgICAgIGlmICh0b2tlbnMgIT0gbnVsbCkge1xuICAgICAgICBCbG9jay5fX3N1cGVyX18uY29uc3RydWN0b3IuY2FsbCh0aGlzLCB0YWdOYW1lLCBtYXJrdXAsIHRva2Vucyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgQmxvY2sucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgICAgIHJldHVybiBjb250ZXh0LnN0YWNrKChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgY29udGV4dC5zZXQoJ2Jsb2NrJywgbmV3IExpcXVpZC5UYWdzLkJsb2NrRHJvcChfdGhpcykpO1xuICAgICAgICAgIHJldHVybiBfdGhpcy5yZW5kZXJBbGwoX3RoaXMubm9kZWxpc3QsIGNvbnRleHQpO1xuICAgICAgICB9O1xuICAgICAgfSkodGhpcykpO1xuICAgIH07XG5cbiAgICBCbG9jay5wcm90b3R5cGUuYWRkUGFyZW50ID0gZnVuY3Rpb24obm9kZWxpc3QpIHtcbiAgICAgIGlmICh0aGlzLnBhcmVudCAhPSBudWxsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnBhcmVudC5hZGRQYXJlbnQobm9kZWxpc3QpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5wYXJlbnQgPSBuZXcgQmxvY2sodGhpcy50YWdOYW1lLCB0aGlzLm5hbWUpO1xuICAgICAgICByZXR1cm4gdGhpcy5wYXJlbnQubm9kZWxpc3QgPSBub2RlbGlzdDtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgQmxvY2sucHJvdG90eXBlLmNhbGxTdXBlciA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgICAgIGlmICh0aGlzLnBhcmVudCAhPSBudWxsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnBhcmVudC5yZW5kZXIoY29udGV4dCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiBCbG9jaztcblxuICB9KShMaXF1aWQuQmxvY2spO1xuXG4gIExpcXVpZC5UZW1wbGF0ZS5yZWdpc3RlclRhZyhcImJsb2NrXCIsIExpcXVpZC5UYWdzLkJsb2NrKTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS4xMS4xXG4oZnVuY3Rpb24oKSB7XG4gIHZhciBMaXF1aWQsXG4gICAgZXh0ZW5kID0gZnVuY3Rpb24oY2hpbGQsIHBhcmVudCkgeyBmb3IgKHZhciBrZXkgaW4gcGFyZW50KSB7IGlmIChoYXNQcm9wLmNhbGwocGFyZW50LCBrZXkpKSBjaGlsZFtrZXldID0gcGFyZW50W2tleV07IH0gZnVuY3Rpb24gY3RvcigpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGNoaWxkOyB9IGN0b3IucHJvdG90eXBlID0gcGFyZW50LnByb3RvdHlwZTsgY2hpbGQucHJvdG90eXBlID0gbmV3IGN0b3IoKTsgY2hpbGQuX19zdXBlcl9fID0gcGFyZW50LnByb3RvdHlwZTsgcmV0dXJuIGNoaWxkOyB9LFxuICAgIGhhc1Byb3AgPSB7fS5oYXNPd25Qcm9wZXJ0eTtcblxuICBMaXF1aWQgPSByZXF1aXJlKCcuLi8uLi9saXF1aWQnKTtcblxuICBMaXF1aWQuVGFncy5CcmVhayA9IChmdW5jdGlvbihzdXBlckNsYXNzKSB7XG4gICAgZXh0ZW5kKEJyZWFrLCBzdXBlckNsYXNzKTtcblxuICAgIGZ1bmN0aW9uIEJyZWFrKCkge1xuICAgICAgcmV0dXJuIEJyZWFrLl9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIEJyZWFrLnByb3RvdHlwZS5pbnRlcnJ1cHQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgTGlxdWlkLkJyZWFrSW50ZXJydXB0O1xuICAgIH07XG5cbiAgICByZXR1cm4gQnJlYWs7XG5cbiAgfSkoTGlxdWlkLlRhZyk7XG5cbiAgTGlxdWlkLlRlbXBsYXRlLnJlZ2lzdGVyVGFnKFwiYnJlYWtcIiwgTGlxdWlkLlRhZ3MuQnJlYWspO1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjExLjFcbihmdW5jdGlvbigpIHtcbiAgdmFyIExpcXVpZCxcbiAgICBleHRlbmQgPSBmdW5jdGlvbihjaGlsZCwgcGFyZW50KSB7IGZvciAodmFyIGtleSBpbiBwYXJlbnQpIHsgaWYgKGhhc1Byb3AuY2FsbChwYXJlbnQsIGtleSkpIGNoaWxkW2tleV0gPSBwYXJlbnRba2V5XTsgfSBmdW5jdGlvbiBjdG9yKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gY2hpbGQ7IH0gY3Rvci5wcm90b3R5cGUgPSBwYXJlbnQucHJvdG90eXBlOyBjaGlsZC5wcm90b3R5cGUgPSBuZXcgY3RvcigpOyBjaGlsZC5fX3N1cGVyX18gPSBwYXJlbnQucHJvdG90eXBlOyByZXR1cm4gY2hpbGQ7IH0sXG4gICAgaGFzUHJvcCA9IHt9Lmhhc093blByb3BlcnR5O1xuXG4gIExpcXVpZCA9IHJlcXVpcmUoJy4uLy4uL2xpcXVpZCcpO1xuXG4gIExpcXVpZC5UYWdzLkNhcHR1cmUgPSAoZnVuY3Rpb24oc3VwZXJDbGFzcykge1xuICAgIHZhciBTeW50YXg7XG5cbiAgICBleHRlbmQoQ2FwdHVyZSwgc3VwZXJDbGFzcyk7XG5cbiAgICBTeW50YXggPSAvKFxcdyspLztcblxuICAgIGZ1bmN0aW9uIENhcHR1cmUodGFnTmFtZSwgbWFya3VwLCB0b2tlbnMpIHtcbiAgICAgIHZhciAkO1xuICAgICAgaWYgKCQgPSBtYXJrdXAubWF0Y2goU3ludGF4KSkge1xuICAgICAgICB0aGlzLnRvID0gJFsxXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBMaXF1aWQuU3ludGF4RXJyb3IoXCJTeW50YXggZXJyb3IgaW4gJ2NhcHR1cmUnIC0gVmFsaWQgc3ludGF4OiBjYXB0dXJlIFt2YXJdXCIpO1xuICAgICAgfVxuICAgICAgQ2FwdHVyZS5fX3N1cGVyX18uY29uc3RydWN0b3IuY2FsbCh0aGlzLCB0YWdOYW1lLCBtYXJrdXAsIHRva2Vucyk7XG4gICAgfVxuXG4gICAgQ2FwdHVyZS5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oY29udGV4dCkge1xuICAgICAgdmFyIGxhc3QsIG91dHB1dDtcbiAgICAgIG91dHB1dCA9IENhcHR1cmUuX19zdXBlcl9fLnJlbmRlci5jYWxsKHRoaXMsIGNvbnRleHQpO1xuICAgICAgbGFzdCA9IGNvbnRleHQuc2NvcGVzLmxlbmd0aCAtIDE7XG4gICAgICBjb250ZXh0LnNjb3Blc1tsYXN0XVt0aGlzLnRvXSA9IG91dHB1dDtcbiAgICAgIHJldHVybiAnJztcbiAgICB9O1xuXG4gICAgcmV0dXJuIENhcHR1cmU7XG5cbiAgfSkoTGlxdWlkLkJsb2NrKTtcblxuICBMaXF1aWQuVGVtcGxhdGUucmVnaXN0ZXJUYWcoXCJjYXB0dXJlXCIsIExpcXVpZC5UYWdzLkNhcHR1cmUpO1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjExLjFcbihmdW5jdGlvbigpIHtcbiAgdmFyIExpcXVpZCxcbiAgICBleHRlbmQgPSBmdW5jdGlvbihjaGlsZCwgcGFyZW50KSB7IGZvciAodmFyIGtleSBpbiBwYXJlbnQpIHsgaWYgKGhhc1Byb3AuY2FsbChwYXJlbnQsIGtleSkpIGNoaWxkW2tleV0gPSBwYXJlbnRba2V5XTsgfSBmdW5jdGlvbiBjdG9yKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gY2hpbGQ7IH0gY3Rvci5wcm90b3R5cGUgPSBwYXJlbnQucHJvdG90eXBlOyBjaGlsZC5wcm90b3R5cGUgPSBuZXcgY3RvcigpOyBjaGlsZC5fX3N1cGVyX18gPSBwYXJlbnQucHJvdG90eXBlOyByZXR1cm4gY2hpbGQ7IH0sXG4gICAgaGFzUHJvcCA9IHt9Lmhhc093blByb3BlcnR5O1xuXG4gIExpcXVpZCA9IHJlcXVpcmUoJy4uLy4uL2xpcXVpZCcpO1xuXG4gIExpcXVpZC5UYWdzLkNhc2UgPSAoZnVuY3Rpb24oc3VwZXJDbGFzcykge1xuICAgIHZhciBTeW50YXgsIFdoZW5TeW50YXg7XG5cbiAgICBleHRlbmQoQ2FzZSwgc3VwZXJDbGFzcyk7XG5cbiAgICBTeW50YXggPSBSZWdFeHAoXCIoXCIgKyBMaXF1aWQuU3RyaWN0UXVvdGVkRnJhZ21lbnQuc291cmNlICsgXCIpXCIpO1xuXG4gICAgV2hlblN5bnRheCA9IFJlZ0V4cChcIihcIiArIExpcXVpZC5TdHJpY3RRdW90ZWRGcmFnbWVudC5zb3VyY2UgKyBcIikoPzooPzpcXFxccytvclxcXFxzK3xcXFxccypcXFxcLFxcXFxzKikoXCIgKyBMaXF1aWQuU3RyaWN0UXVvdGVkRnJhZ21lbnQuc291cmNlICsgXCIuKikpP1wiKTtcblxuICAgIGZ1bmN0aW9uIENhc2UodGFnTmFtZSwgbWFya3VwLCB0b2tlbnMpIHtcbiAgICAgIHZhciAkO1xuICAgICAgdGhpcy5ibG9ja3MgPSBbXTtcbiAgICAgIHRoaXMubm9kZWxpc3QgPSBbXTtcbiAgICAgIGlmICgkID0gbWFya3VwLm1hdGNoKFN5bnRheCkpIHtcbiAgICAgICAgdGhpcy5sZWZ0ID0gJFsxXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBMaXF1aWQuU3ludGF4RXJyb3IoXCJTeW50YXggZXJyb3IgaW4gJ2Nhc2UnIC0gVmFsaWQgc3ludGF4OiBjYXNlIFtjb25kaXRpb25dXCIpO1xuICAgICAgfVxuICAgICAgQ2FzZS5fX3N1cGVyX18uY29uc3RydWN0b3IuY2FsbCh0aGlzLCB0YWdOYW1lLCBtYXJrdXAsIHRva2Vucyk7XG4gICAgfVxuXG4gICAgQ2FzZS5wcm90b3R5cGUudW5rbm93blRhZyA9IGZ1bmN0aW9uKHRhZywgbWFya3VwLCB0b2tlbnMpIHtcbiAgICAgIHRoaXMubm9kZWxpc3QgPSBbXTtcbiAgICAgIHN3aXRjaCAodGFnKSB7XG4gICAgICAgIGNhc2UgXCJ3aGVuXCI6XG4gICAgICAgICAgcmV0dXJuIHRoaXMucmVjb3JkV2hlbkNvbmRpdGlvbihtYXJrdXApO1xuICAgICAgICBjYXNlIFwiZWxzZVwiOlxuICAgICAgICAgIHJldHVybiB0aGlzLnJlY29yZEVsc2VDb25kaXRpb24obWFya3VwKTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4gQ2FzZS5fX3N1cGVyX18udW5rbm93blRhZy5jYWxsKHRoaXMsIHRhZywgbWFya3VwLCB0b2tlbnMpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBDYXNlLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gICAgICB2YXIgb3V0cHV0O1xuICAgICAgb3V0cHV0ID0gJyc7XG4gICAgICBjb250ZXh0LnN0YWNrKChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIGJsb2NrLCBleGVjRWxzZUJsb2NrLCBpLCBsZW4sIHJlZiwgcmVzdWx0cztcbiAgICAgICAgICBleGVjRWxzZUJsb2NrID0gdHJ1ZTtcbiAgICAgICAgICByZWYgPSBfdGhpcy5ibG9ja3M7XG4gICAgICAgICAgcmVzdWx0cyA9IFtdO1xuICAgICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IHJlZi5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgYmxvY2sgPSByZWZbaV07XG4gICAgICAgICAgICBpZiAoYmxvY2tbXCJlbHNlXCJdKCkpIHtcbiAgICAgICAgICAgICAgaWYgKGV4ZWNFbHNlQmxvY2sgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2gob3V0cHV0ICs9IF90aGlzLnJlbmRlckFsbChibG9jay5hdHRhY2htZW50LCBjb250ZXh0KSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHZvaWQgMCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYmxvY2suZXZhbHVhdGUoY29udGV4dCkpIHtcbiAgICAgICAgICAgICAgZXhlY0Vsc2VCbG9jayA9IGZhbHNlO1xuICAgICAgICAgICAgICByZXN1bHRzLnB1c2gob3V0cHV0ICs9IF90aGlzLnJlbmRlckFsbChibG9jay5hdHRhY2htZW50LCBjb250ZXh0KSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXN1bHRzLnB1c2godm9pZCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKSk7XG4gICAgICByZXR1cm4gb3V0cHV0O1xuICAgIH07XG5cbiAgICBDYXNlLnByb3RvdHlwZS5yZWNvcmRXaGVuQ29uZGl0aW9uID0gZnVuY3Rpb24obWFya3VwKSB7XG4gICAgICB2YXIgJCwgYmxvY2ssIHJlc3VsdHM7XG4gICAgICByZXN1bHRzID0gW107XG4gICAgICB3aGlsZSAobWFya3VwKSB7XG4gICAgICAgIGlmICghKCQgPSBtYXJrdXAubWF0Y2goV2hlblN5bnRheCkpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IExpcXVpZC5TeW50YXhFcnJvcihcIlN5bnRheCBlcnJvciBpbiB0YWcgJ2Nhc2UnIC0gVmFsaWQgd2hlbiBjb25kaXRpb246IHslIHdoZW4gW2NvbmRpdGlvbl0gW29yIGNvbmRpdGlvbjIuLi5dICV9IFwiKTtcbiAgICAgICAgfVxuICAgICAgICBtYXJrdXAgPSAkWzJdO1xuICAgICAgICBibG9jayA9IG5ldyBMaXF1aWQuQ29uZGl0aW9uKHRoaXMubGVmdCwgXCI9PVwiLCAkWzFdKTtcbiAgICAgICAgYmxvY2suYXR0YWNoKHRoaXMubm9kZWxpc3QpO1xuICAgICAgICByZXN1bHRzLnB1c2godGhpcy5ibG9ja3MucHVzaChibG9jaykpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfTtcblxuICAgIENhc2UucHJvdG90eXBlLnJlY29yZEVsc2VDb25kaXRpb24gPSBmdW5jdGlvbihtYXJrdXApIHtcbiAgICAgIHZhciBibG9jaztcbiAgICAgIGlmICgobWFya3VwIHx8IFwiXCIpLnRyaW0oKSAhPT0gXCJcIikge1xuICAgICAgICBpZiAoKG1hcmt1cCB8fCBcIlwiKS50cmltKCkgIT09IFwiXCIpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgTGlxdWlkLlN5bnRheEVycm9yKFwiU3ludGF4IGVycm9yIGluIHRhZyAnY2FzZScgLSBWYWxpZCBlbHNlIGNvbmRpdGlvbjogeyUgZWxzZSAlfSAobm8gcGFyYW1ldGVycykgXCIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBibG9jayA9IG5ldyBMaXF1aWQuRWxzZUNvbmRpdGlvbigpO1xuICAgICAgYmxvY2suYXR0YWNoKHRoaXMubm9kZWxpc3QpO1xuICAgICAgcmV0dXJuIHRoaXMuYmxvY2tzLnB1c2goYmxvY2spO1xuICAgIH07XG5cbiAgICByZXR1cm4gQ2FzZTtcblxuICB9KShMaXF1aWQuQmxvY2spO1xuXG4gIExpcXVpZC5UZW1wbGF0ZS5yZWdpc3RlclRhZyhcImNhc2VcIiwgTGlxdWlkLlRhZ3MuQ2FzZSk7XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuMTEuMVxuKGZ1bmN0aW9uKCkge1xuICB2YXIgTGlxdWlkLFxuICAgIGV4dGVuZCA9IGZ1bmN0aW9uKGNoaWxkLCBwYXJlbnQpIHsgZm9yICh2YXIga2V5IGluIHBhcmVudCkgeyBpZiAoaGFzUHJvcC5jYWxsKHBhcmVudCwga2V5KSkgY2hpbGRba2V5XSA9IHBhcmVudFtrZXldOyB9IGZ1bmN0aW9uIGN0b3IoKSB7IHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDsgfSBjdG9yLnByb3RvdHlwZSA9IHBhcmVudC5wcm90b3R5cGU7IGNoaWxkLnByb3RvdHlwZSA9IG5ldyBjdG9yKCk7IGNoaWxkLl9fc3VwZXJfXyA9IHBhcmVudC5wcm90b3R5cGU7IHJldHVybiBjaGlsZDsgfSxcbiAgICBoYXNQcm9wID0ge30uaGFzT3duUHJvcGVydHk7XG5cbiAgTGlxdWlkID0gcmVxdWlyZSgnLi4vLi4vbGlxdWlkJyk7XG5cbiAgTGlxdWlkLlRhZ3MuQ29tbWVudCA9IChmdW5jdGlvbihzdXBlckNsYXNzKSB7XG4gICAgZXh0ZW5kKENvbW1lbnQsIHN1cGVyQ2xhc3MpO1xuXG4gICAgZnVuY3Rpb24gQ29tbWVudCgpIHtcbiAgICAgIHJldHVybiBDb21tZW50Ll9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIENvbW1lbnQucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgICAgIHJldHVybiBcIlwiO1xuICAgIH07XG5cbiAgICByZXR1cm4gQ29tbWVudDtcblxuICB9KShMaXF1aWQuQmxvY2spO1xuXG4gIExpcXVpZC5UZW1wbGF0ZS5yZWdpc3RlclRhZyhcImNvbW1lbnRcIiwgTGlxdWlkLlRhZ3MuQ29tbWVudCk7XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuMTEuMVxuKGZ1bmN0aW9uKCkge1xuICB2YXIgTGlxdWlkLFxuICAgIGV4dGVuZCA9IGZ1bmN0aW9uKGNoaWxkLCBwYXJlbnQpIHsgZm9yICh2YXIga2V5IGluIHBhcmVudCkgeyBpZiAoaGFzUHJvcC5jYWxsKHBhcmVudCwga2V5KSkgY2hpbGRba2V5XSA9IHBhcmVudFtrZXldOyB9IGZ1bmN0aW9uIGN0b3IoKSB7IHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDsgfSBjdG9yLnByb3RvdHlwZSA9IHBhcmVudC5wcm90b3R5cGU7IGNoaWxkLnByb3RvdHlwZSA9IG5ldyBjdG9yKCk7IGNoaWxkLl9fc3VwZXJfXyA9IHBhcmVudC5wcm90b3R5cGU7IHJldHVybiBjaGlsZDsgfSxcbiAgICBoYXNQcm9wID0ge30uaGFzT3duUHJvcGVydHk7XG5cbiAgTGlxdWlkID0gcmVxdWlyZSgnLi4vLi4vbGlxdWlkJyk7XG5cbiAgTGlxdWlkLlRhZ3MuQ29udGludWUgPSAoZnVuY3Rpb24oc3VwZXJDbGFzcykge1xuICAgIGV4dGVuZChDb250aW51ZSwgc3VwZXJDbGFzcyk7XG5cbiAgICBmdW5jdGlvbiBDb250aW51ZSgpIHtcbiAgICAgIHJldHVybiBDb250aW51ZS5fX3N1cGVyX18uY29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICBDb250aW51ZS5wcm90b3R5cGUuaW50ZXJydXB0ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IExpcXVpZC5Db250aW51ZUludGVycnVwdDtcbiAgICB9O1xuXG4gICAgcmV0dXJuIENvbnRpbnVlO1xuXG4gIH0pKExpcXVpZC5UYWcpO1xuXG4gIExpcXVpZC5UZW1wbGF0ZS5yZWdpc3RlclRhZyhcImNvbnRpbnVlXCIsIExpcXVpZC5UYWdzLkNvbnRpbnVlKTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS4xMS4xXG4oZnVuY3Rpb24oKSB7XG4gIHZhciBMaXF1aWQsXG4gICAgZXh0ZW5kID0gZnVuY3Rpb24oY2hpbGQsIHBhcmVudCkgeyBmb3IgKHZhciBrZXkgaW4gcGFyZW50KSB7IGlmIChoYXNQcm9wLmNhbGwocGFyZW50LCBrZXkpKSBjaGlsZFtrZXldID0gcGFyZW50W2tleV07IH0gZnVuY3Rpb24gY3RvcigpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGNoaWxkOyB9IGN0b3IucHJvdG90eXBlID0gcGFyZW50LnByb3RvdHlwZTsgY2hpbGQucHJvdG90eXBlID0gbmV3IGN0b3IoKTsgY2hpbGQuX19zdXBlcl9fID0gcGFyZW50LnByb3RvdHlwZTsgcmV0dXJuIGNoaWxkOyB9LFxuICAgIGhhc1Byb3AgPSB7fS5oYXNPd25Qcm9wZXJ0eTtcblxuICBMaXF1aWQgPSByZXF1aXJlKCcuLi8uLi9saXF1aWQnKTtcblxuICBMaXF1aWQuVGFncy5DeWNsZSA9IChmdW5jdGlvbihzdXBlckNsYXNzKSB7XG4gICAgdmFyIE5hbWVkU3ludGF4LCBTaW1wbGVTeW50YXg7XG5cbiAgICBleHRlbmQoQ3ljbGUsIHN1cGVyQ2xhc3MpO1xuXG4gICAgU2ltcGxlU3ludGF4ID0gUmVnRXhwKFwiXlwiICsgTGlxdWlkLlN0cmljdFF1b3RlZEZyYWdtZW50LnNvdXJjZSk7XG5cbiAgICBOYW1lZFN5bnRheCA9IFJlZ0V4cChcIl4oXCIgKyBMaXF1aWQuU3RyaWN0UXVvdGVkRnJhZ21lbnQuc291cmNlICsgXCIpXFxcXHMqXFxcXDpcXFxccyooLiopXCIpO1xuXG4gICAgZnVuY3Rpb24gQ3ljbGUodGFnLCBtYXJrdXAsIHRva2Vucykge1xuICAgICAgdmFyICQ7XG4gICAgICBpZiAoJCA9IG1hcmt1cC5tYXRjaChOYW1lZFN5bnRheCkpIHtcbiAgICAgICAgdGhpcy52YXJpYWJsZXMgPSB0aGlzLnZhcmlhYmxlc0Zyb21TdHJpbmcoJFsyXSk7XG4gICAgICAgIHRoaXMubmFtZSA9ICRbMV07XG4gICAgICB9IGVsc2UgaWYgKCQgPSBtYXJrdXAubWF0Y2goU2ltcGxlU3ludGF4KSkge1xuICAgICAgICB0aGlzLnZhcmlhYmxlcyA9IHRoaXMudmFyaWFibGVzRnJvbVN0cmluZyhtYXJrdXApO1xuICAgICAgICB0aGlzLm5hbWUgPSBcIidcIiArICh0aGlzLnZhcmlhYmxlcy50b1N0cmluZygpKSArIFwiJ1wiO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IExpcXVpZC5TeW50YXhFcnJvcihcIlN5bnRheCBlcnJvciBpbiAnY3ljbGUnIC0gVmFsaWQgc3ludGF4OiBjeWNsZSBbbmFtZSA6XSB2YXIgWywgdmFyMiwgdmFyMyAuLi5dXCIpO1xuICAgICAgfVxuICAgICAgQ3ljbGUuX19zdXBlcl9fLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgdGFnLCBtYXJrdXAsIHRva2Vucyk7XG4gICAgfVxuXG4gICAgQ3ljbGUucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgICAgIHZhciBiYXNlLCBvdXRwdXQ7XG4gICAgICAoYmFzZSA9IGNvbnRleHQucmVnaXN0ZXJzKS5jeWNsZSB8fCAoYmFzZS5jeWNsZSA9IHt9KTtcbiAgICAgIG91dHB1dCA9ICcnO1xuICAgICAgY29udGV4dC5zdGFjaygoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBpdGVyYXRpb24sIGtleSwgcmVmLCByZXN1bHQ7XG4gICAgICAgICAga2V5ID0gY29udGV4dC5nZXQoX3RoaXMubmFtZSk7XG4gICAgICAgICAgaXRlcmF0aW9uID0gKHJlZiA9IGNvbnRleHQucmVnaXN0ZXJzLmN5Y2xlW2tleV0pICE9IG51bGwgPyByZWYgOiAwO1xuICAgICAgICAgIHJlc3VsdCA9IGNvbnRleHQuZ2V0KF90aGlzLnZhcmlhYmxlc1tpdGVyYXRpb25dKTtcbiAgICAgICAgICBpdGVyYXRpb24gKz0gMTtcbiAgICAgICAgICBpZiAoaXRlcmF0aW9uID49IF90aGlzLnZhcmlhYmxlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGl0ZXJhdGlvbiA9IDA7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnRleHQucmVnaXN0ZXJzLmN5Y2xlW2tleV0gPSBpdGVyYXRpb247XG4gICAgICAgICAgcmV0dXJuIG91dHB1dCA9IHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICAgIH0pKHRoaXMpKTtcbiAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgfTtcblxuICAgIEN5Y2xlLnByb3RvdHlwZS52YXJpYWJsZXNGcm9tU3RyaW5nID0gZnVuY3Rpb24obWFya3VwKSB7XG4gICAgICB2YXIgJCwgaSwgbGVuLCByZWYsIHJlc3VsdHMsIHZhcm5hbWU7XG4gICAgICByZWYgPSBtYXJrdXAuc3BsaXQoJywnKTtcbiAgICAgIHJlc3VsdHMgPSBbXTtcbiAgICAgIGZvciAoaSA9IDAsIGxlbiA9IHJlZi5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICB2YXJuYW1lID0gcmVmW2ldO1xuICAgICAgICAkID0gdmFybmFtZS5tYXRjaChSZWdFeHAoXCJcXFxccyooXCIgKyBMaXF1aWQuU3RyaWN0UXVvdGVkRnJhZ21lbnQuc291cmNlICsgXCIpXFxcXHMqXCIpKTtcbiAgICAgICAgaWYgKCRbMV0pIHtcbiAgICAgICAgICByZXN1bHRzLnB1c2goJFsxXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzdWx0cy5wdXNoKG51bGwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0cztcbiAgICB9O1xuXG4gICAgcmV0dXJuIEN5Y2xlO1xuXG4gIH0pKExpcXVpZC5UYWcpO1xuXG4gIExpcXVpZC5UZW1wbGF0ZS5yZWdpc3RlclRhZyhcImN5Y2xlXCIsIExpcXVpZC5UYWdzLkN5Y2xlKTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS4xMS4xXG4oZnVuY3Rpb24oKSB7XG4gIHZhciBMaXF1aWQsXG4gICAgZXh0ZW5kID0gZnVuY3Rpb24oY2hpbGQsIHBhcmVudCkgeyBmb3IgKHZhciBrZXkgaW4gcGFyZW50KSB7IGlmIChoYXNQcm9wLmNhbGwocGFyZW50LCBrZXkpKSBjaGlsZFtrZXldID0gcGFyZW50W2tleV07IH0gZnVuY3Rpb24gY3RvcigpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGNoaWxkOyB9IGN0b3IucHJvdG90eXBlID0gcGFyZW50LnByb3RvdHlwZTsgY2hpbGQucHJvdG90eXBlID0gbmV3IGN0b3IoKTsgY2hpbGQuX19zdXBlcl9fID0gcGFyZW50LnByb3RvdHlwZTsgcmV0dXJuIGNoaWxkOyB9LFxuICAgIGhhc1Byb3AgPSB7fS5oYXNPd25Qcm9wZXJ0eTtcblxuICBMaXF1aWQgPSByZXF1aXJlKCcuLi8uLi9saXF1aWQnKTtcblxuICBMaXF1aWQuVGFncy5EZWNyZW1lbnQgPSAoZnVuY3Rpb24oc3VwZXJDbGFzcykge1xuICAgIGV4dGVuZChEZWNyZW1lbnQsIHN1cGVyQ2xhc3MpO1xuXG4gICAgZnVuY3Rpb24gRGVjcmVtZW50KHRhZ05hbWUsIG1hcmt1cCwgdG9rZW5zKSB7XG4gICAgICB0aGlzLnZhcmlhYmxlID0gbWFya3VwLnRyaW0oKTtcbiAgICAgIERlY3JlbWVudC5fX3N1cGVyX18uY29uc3RydWN0b3IuY2FsbCh0aGlzLCB0YWdOYW1lLCBtYXJrdXAsIHRva2Vucyk7XG4gICAgfVxuXG4gICAgRGVjcmVtZW50LnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gICAgICB2YXIgYmFzZSwgbmFtZSwgdmFsdWU7XG4gICAgICB2YWx1ZSA9IChiYXNlID0gY29udGV4dC5zY29wZXNbMF0pW25hbWUgPSB0aGlzLnZhcmlhYmxlXSB8fCAoYmFzZVtuYW1lXSA9IDApO1xuICAgICAgdmFsdWUgPSB2YWx1ZSAtIDE7XG4gICAgICBjb250ZXh0LnNjb3Blc1swXVt0aGlzLnZhcmlhYmxlXSA9IHZhbHVlO1xuICAgICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gICAgfTtcblxuICAgIHJldHVybiBEZWNyZW1lbnQ7XG5cbiAgfSkoTGlxdWlkLlRhZyk7XG5cbiAgTGlxdWlkLlRlbXBsYXRlLnJlZ2lzdGVyVGFnKFwiZGVjcmVtZW50XCIsIExpcXVpZC5UYWdzLkRlY3JlbWVudCk7XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuMTEuMVxuKGZ1bmN0aW9uKCkge1xuICB2YXIgTGlxdWlkLFxuICAgIGV4dGVuZCA9IGZ1bmN0aW9uKGNoaWxkLCBwYXJlbnQpIHsgZm9yICh2YXIga2V5IGluIHBhcmVudCkgeyBpZiAoaGFzUHJvcC5jYWxsKHBhcmVudCwga2V5KSkgY2hpbGRba2V5XSA9IHBhcmVudFtrZXldOyB9IGZ1bmN0aW9uIGN0b3IoKSB7IHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDsgfSBjdG9yLnByb3RvdHlwZSA9IHBhcmVudC5wcm90b3R5cGU7IGNoaWxkLnByb3RvdHlwZSA9IG5ldyBjdG9yKCk7IGNoaWxkLl9fc3VwZXJfXyA9IHBhcmVudC5wcm90b3R5cGU7IHJldHVybiBjaGlsZDsgfSxcbiAgICBoYXNQcm9wID0ge30uaGFzT3duUHJvcGVydHk7XG5cbiAgTGlxdWlkID0gcmVxdWlyZSgnLi4vLi4vbGlxdWlkJyk7XG5cbiAgTGlxdWlkLlRhZ3MuRXh0ZW5kcyA9IChmdW5jdGlvbihzdXBlckNsYXNzKSB7XG4gICAgdmFyIENvbnRlbnRPZlZhcmlhYmxlLCBGdWxsVG9rZW4sIElzVGFnLCBJc1ZhcmlhYmxlLCBTeW50YXg7XG5cbiAgICBleHRlbmQoRXh0ZW5kcywgc3VwZXJDbGFzcyk7XG5cbiAgICBTeW50YXggPSBSZWdFeHAoXCIoXCIgKyBMaXF1aWQuUXVvdGVkRnJhZ21lbnQuc291cmNlICsgXCIpXCIpO1xuXG4gICAgSXNUYWcgPSBSZWdFeHAoXCJeXCIgKyBMaXF1aWQuVGFnU3RhcnQuc291cmNlKTtcblxuICAgIElzVmFyaWFibGUgPSBSZWdFeHAoXCJeXCIgKyBMaXF1aWQuVmFyaWFibGVTdGFydC5zb3VyY2UpO1xuXG4gICAgRnVsbFRva2VuID0gUmVnRXhwKFwiXlwiICsgTGlxdWlkLlRhZ1N0YXJ0LnNvdXJjZSArIFwiXFxcXHMqKFxcXFx3KylcXFxccyooLiopP1wiICsgTGlxdWlkLlRhZ0VuZC5zb3VyY2UgKyBcIiRcIik7XG5cbiAgICBDb250ZW50T2ZWYXJpYWJsZSA9IFJlZ0V4cChcIl5cIiArIExpcXVpZC5WYXJpYWJsZVN0YXJ0LnNvdXJjZSArIFwiKC4qKVwiICsgTGlxdWlkLlZhcmlhYmxlRW5kLnNvdXJjZSArIFwiJFwiKTtcblxuICAgIGZ1bmN0aW9uIEV4dGVuZHModGFnTmFtZSwgbWFya3VwLCB0b2tlbnMpIHtcbiAgICAgIHZhciAkLCBpLCBsZW4sIG0sIG5vZGUsIHJlZjtcbiAgICAgIGlmICgoJCA9IG1hcmt1cC5tYXRjaChTeW50YXgpKSkge1xuICAgICAgICB0aGlzLnRlbXBsYXRlTmFtZSA9ICRbMV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgTGlxdWlkLlN5bnRheEVycm9yKFwiU3ludGF4IEVycm9yIGluICdleHRlbmRzJyAtIFZhbGlkIHN5bnRheDogZXh0ZW5kcyBbdGVtcGxhdGVdXCIpO1xuICAgICAgfVxuICAgICAgRXh0ZW5kcy5fX3N1cGVyX18uY29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIG0gPSB7fTtcbiAgICAgIHJlZiA9IHRoaXMubm9kZWxpc3Q7XG4gICAgICBmb3IgKGkgPSAwLCBsZW4gPSByZWYubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgbm9kZSA9IHJlZltpXTtcbiAgICAgICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBMaXF1aWQuVGFncy5CbG9jaykge1xuICAgICAgICAgIG1bbm9kZS5uYW1lXSA9IG5vZGU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuYmxvY2tzID0gbTtcbiAgICB9XG5cbiAgICBFeHRlbmRzLnByb3RvdHlwZS5wYXJzZSA9IGZ1bmN0aW9uKHRva2Vucykge1xuICAgICAgcmV0dXJuIHRoaXMucGFyc2VBbGwodG9rZW5zKTtcbiAgICB9O1xuXG4gICAgRXh0ZW5kcy5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oY29udGV4dCkge1xuICAgICAgdmFyIGJsb2NrLCBuYW1lLCBwYXJlbnRCbG9ja3MsIHBiLCByZWYsIHRlbXBsYXRlO1xuICAgICAgdGVtcGxhdGUgPSB0aGlzLmxvYWRUZW1wbGF0ZShjb250ZXh0KTtcbiAgICAgIHBhcmVudEJsb2NrcyA9IHRoaXMuZmluZEJsb2Nrcyh0ZW1wbGF0ZS5yb290KTtcbiAgICAgIHJlZiA9IHRoaXMuYmxvY2tzO1xuICAgICAgZm9yIChuYW1lIGluIHJlZikge1xuICAgICAgICBibG9jayA9IHJlZltuYW1lXTtcbiAgICAgICAgaWYgKChwYiA9IHBhcmVudEJsb2Nrc1tuYW1lXSkgIT0gbnVsbCkge1xuICAgICAgICAgIHBiLnBhcmVudCA9IGJsb2NrLnBhcmVudDtcbiAgICAgICAgICBwYi5hZGRQYXJlbnQocGIubm9kZWxpc3QpO1xuICAgICAgICAgIHBiLm5vZGVsaXN0ID0gYmxvY2subm9kZWxpc3Q7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKHRoaXMuaXNFeHRlbmRpbmcodGVtcGxhdGUpKSB7XG4gICAgICAgICAgICB0ZW1wbGF0ZS5yb290Lm5vZGVsaXN0LnB1c2goYmxvY2spO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRlbXBsYXRlLnJlbmRlcihjb250ZXh0KTtcbiAgICB9O1xuXG4gICAgRXh0ZW5kcy5wcm90b3R5cGUucGFyc2VBbGwgPSBmdW5jdGlvbih0b2tlbnMpIHtcbiAgICAgIHZhciAkLCByZXN1bHRzLCB0YWcsIHRva2VuO1xuICAgICAgdGhpcy5ub2RlbGlzdCB8fCAodGhpcy5ub2RlbGlzdCA9IFtdKTtcbiAgICAgIHRoaXMubm9kZWxpc3QubGVuZ3RoID0gMDtcbiAgICAgIHJlc3VsdHMgPSBbXTtcbiAgICAgIHdoaWxlICgodG9rZW4gPSB0b2tlbnMuc2hpZnQoKSkgIT0gbnVsbCkge1xuICAgICAgICBpZiAoSXNUYWcudGVzdCh0b2tlbikpIHtcbiAgICAgICAgICBpZiAoKCQgPSB0b2tlbi5tYXRjaChGdWxsVG9rZW4pKSkge1xuICAgICAgICAgICAgaWYgKHRhZyA9IExpcXVpZC5UZW1wbGF0ZS50YWdzWyRbMV1dKSB7XG4gICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh0aGlzLm5vZGVsaXN0LnB1c2gobmV3IHRhZygkWzFdLCAkWzJdLCB0b2tlbnMpKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXN1bHRzLnB1c2godGhpcy51bmtub3duVGFnKCRbMV0sICRbMl0sIHRva2VucykpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgTGlxdWlkLlN5bnRheEVycm9yKFwiVGFnICdcIiArIHRva2VuICsgXCInIHdhcyBub3QgcHJvcGVybHkgdGVybWluYXRlZCB3aXRoIHJlZ2V4cDogXCIgKyBUYWdFbmQuaW5zcGVjdCArIFwiIFwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoSXNWYXJpYWJsZS50ZXN0KHRva2VuKSkge1xuICAgICAgICAgIHJlc3VsdHMucHVzaCh0aGlzLm5vZGVsaXN0LnB1c2godGhpcy5jcmVhdGVWYXJpYWJsZSh0b2tlbikpKTtcbiAgICAgICAgfSBlbHNlIGlmICh0b2tlbiA9PT0gJycpIHtcblxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3VsdHMucHVzaCh0aGlzLm5vZGVsaXN0LnB1c2godG9rZW4pKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfTtcblxuICAgIEV4dGVuZHMucHJvdG90eXBlLmxvYWRUZW1wbGF0ZSA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgICAgIHZhciBzb3VyY2U7XG4gICAgICBzb3VyY2UgPSBMaXF1aWQuVGVtcGxhdGUuZmlsZVN5c3RlbS5yZWFkVGVtcGxhdGVGaWxlKGNvbnRleHQuZ2V0KHRoaXMudGVtcGxhdGVOYW1lKSk7XG4gICAgICByZXR1cm4gTGlxdWlkLlRlbXBsYXRlLnBhcnNlKHNvdXJjZSk7XG4gICAgfTtcblxuICAgIEV4dGVuZHMucHJvdG90eXBlLmZpbmRCbG9ja3MgPSBmdW5jdGlvbihub2RlLCBibG9ja3MpIHtcbiAgICAgIHZhciBiLCBpLCBsZW4sIHJlZjtcbiAgICAgIGlmIChibG9ja3MgPT0gbnVsbCkge1xuICAgICAgICBibG9ja3MgPSB7fTtcbiAgICAgIH1cbiAgICAgIGlmIChub2RlLm5vZGVsaXN0ICE9IG51bGwpIHtcbiAgICAgICAgYiA9IGJsb2NrcztcbiAgICAgICAgcmVmID0gbm9kZS5ub2RlbGlzdDtcbiAgICAgICAgZm9yIChpID0gMCwgbGVuID0gcmVmLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgbm9kZSA9IHJlZltpXTtcbiAgICAgICAgICBpZiAobm9kZSBpbnN0YW5jZW9mIExpcXVpZC5UYWdzLkJsb2NrKSB7XG4gICAgICAgICAgICBiW25vZGUubmFtZV0gPSBub2RlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmZpbmRCbG9ja3Mobm9kZSwgYik7XG4gICAgICAgICAgfVxuICAgICAgICAgIGI7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBibG9ja3M7XG4gICAgfTtcblxuICAgIEV4dGVuZHMucHJvdG90eXBlLmlzRXh0ZW5kaW5nID0gZnVuY3Rpb24odGVtcGxhdGUpIHtcbiAgICAgIHZhciBpLCBsZW4sIG5vZGUsIHJlZjtcbiAgICAgIHJlZiA9IHRlbXBsYXRlLnJvb3Qubm9kZWxpc3Q7XG4gICAgICBmb3IgKGkgPSAwLCBsZW4gPSByZWYubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgbm9kZSA9IHJlZltpXTtcbiAgICAgICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBFeHRlbmRzKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIEV4dGVuZHM7XG5cbiAgfSkoTGlxdWlkLkJsb2NrKTtcblxuICBMaXF1aWQuVGVtcGxhdGUucmVnaXN0ZXJUYWcoXCJleHRlbmRzXCIsIExpcXVpZC5UYWdzLkV4dGVuZHMpO1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjExLjFcbihmdW5jdGlvbigpIHtcbiAgdmFyIExpcXVpZCxcbiAgICBleHRlbmQgPSBmdW5jdGlvbihjaGlsZCwgcGFyZW50KSB7IGZvciAodmFyIGtleSBpbiBwYXJlbnQpIHsgaWYgKGhhc1Byb3AuY2FsbChwYXJlbnQsIGtleSkpIGNoaWxkW2tleV0gPSBwYXJlbnRba2V5XTsgfSBmdW5jdGlvbiBjdG9yKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gY2hpbGQ7IH0gY3Rvci5wcm90b3R5cGUgPSBwYXJlbnQucHJvdG90eXBlOyBjaGlsZC5wcm90b3R5cGUgPSBuZXcgY3RvcigpOyBjaGlsZC5fX3N1cGVyX18gPSBwYXJlbnQucHJvdG90eXBlOyByZXR1cm4gY2hpbGQ7IH0sXG4gICAgaGFzUHJvcCA9IHt9Lmhhc093blByb3BlcnR5O1xuXG4gIExpcXVpZCA9IHJlcXVpcmUoJy4uLy4uL2xpcXVpZCcpO1xuXG4gIExpcXVpZC5UYWdzLkZvciA9IChmdW5jdGlvbihzdXBlckNsYXNzKSB7XG4gICAgdmFyIFN5bnRheDtcblxuICAgIGV4dGVuZChGb3IsIHN1cGVyQ2xhc3MpO1xuXG4gICAgU3ludGF4ID0gUmVnRXhwKFwiKFxcXFx3KylcXFxccytpblxcXFxzKyhcIiArIExpcXVpZC5TdHJpY3RRdW90ZWRGcmFnbWVudC5zb3VyY2UgKyBcIilcXFxccyoocmV2ZXJzZWQpP1wiKTtcblxuICAgIGZ1bmN0aW9uIEZvcih0YWcsIG1hcmt1cCwgdG9rZW5zKSB7XG4gICAgICB2YXIgJDtcbiAgICAgIGlmICgkID0gbWFya3VwLm1hdGNoKFN5bnRheCkpIHtcbiAgICAgICAgdGhpcy52YXJpYWJsZU5hbWUgPSAkWzFdO1xuICAgICAgICB0aGlzLmNvbGxlY3Rpb25OYW1lID0gJFsyXTtcbiAgICAgICAgdGhpcy5uYW1lID0gJFsxXSArIFwiLVwiICsgJFsyXTtcbiAgICAgICAgdGhpcy5yZXZlcnNlZCA9ICRbM107XG4gICAgICAgIHRoaXMuYXR0cmlidXRlcyA9IHt9O1xuICAgICAgICBtYXJrdXAucmVwbGFjZShMaXF1aWQuVGFnQXR0cmlidXRlcywgKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCQwLCBrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMuYXR0cmlidXRlc1trZXldID0gdmFsdWU7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSkodGhpcykpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IExpcXVpZC5TeW50YXhFcnJvcihcIlN5bnRheCBFcnJvciBpbiAnZm9yIGxvb3AnIC0gVmFsaWQgc3ludGF4OiBmb3IgW2l0ZW1dIGluIFtjb2xsZWN0aW9uXVwiKTtcbiAgICAgIH1cbiAgICAgIEZvci5fX3N1cGVyX18uY29uc3RydWN0b3IuY2FsbCh0aGlzLCB0YWcsIG1hcmt1cCwgdG9rZW5zKTtcbiAgICB9XG5cbiAgICBGb3IucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgICAgIHZhciBjb2xsZWN0aW9uLCBmcm9tLCBrLCBsZW5ndGgsIGxpbWl0LCByZXN1bHQsIHNlZ21lbnQsIHRvLCB2O1xuICAgICAgaWYgKGNvbnRleHQucmVnaXN0ZXJzW1wiZm9yXCJdID09IG51bGwpIHtcbiAgICAgICAgY29udGV4dC5yZWdpc3RlcnNbXCJmb3JcIl0gPSB7fTtcbiAgICAgIH1cbiAgICAgIGNvbGxlY3Rpb24gPSBjb250ZXh0LmdldCh0aGlzLmNvbGxlY3Rpb25OYW1lKTtcbiAgICAgIGlmICghQXJyYXkuaXNBcnJheShjb2xsZWN0aW9uKSkge1xuICAgICAgICBjb2xsZWN0aW9uID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciByZXN1bHRzO1xuICAgICAgICAgIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgICBmb3IgKGsgaW4gY29sbGVjdGlvbikge1xuICAgICAgICAgICAgdiA9IGNvbGxlY3Rpb25ba107XG4gICAgICAgICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICAgICAgICBrZXk6IGssXG4gICAgICAgICAgICAgIHZhbHVlOiB2XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgICAgIH0pKCk7XG4gICAgICB9XG4gICAgICBmcm9tID0gdGhpcy5hdHRyaWJ1dGVzWydvZmZzZXQnXSA9PT0gJ2NvbnRpbnVlJyA/IGNvbnRleHQucmVnaXN0ZXJzW1wiZm9yXCJdW3RoaXMubmFtZV0gOiBjb250ZXh0LmdldCh0aGlzLmF0dHJpYnV0ZXNbJ29mZnNldCddKTtcbiAgICAgIGxpbWl0ID0gY29udGV4dC5nZXQodGhpcy5hdHRyaWJ1dGVzWydsaW1pdCddKTtcbiAgICAgIHRvID0gbGltaXQgPyBsaW1pdCArIGZyb20gOiBjb2xsZWN0aW9uLmxlbmd0aDtcbiAgICAgIHNlZ21lbnQgPSBjb2xsZWN0aW9uLnNsaWNlKGZyb20sIHRvKTtcbiAgICAgIGlmIChzZWdtZW50Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5yZXZlcnNlZCkge1xuICAgICAgICBzZWdtZW50LnJldmVyc2UoKTtcbiAgICAgIH1cbiAgICAgIHJlc3VsdCA9ICcnO1xuICAgICAgbGVuZ3RoID0gc2VnbWVudC5sZW5ndGg7XG4gICAgICBjb250ZXh0LnJlZ2lzdGVyc1tcImZvclwiXVt0aGlzLm5hbWVdID0gZnJvbSArIHNlZ21lbnQubGVuZ3RoO1xuICAgICAgY29udGV4dC5zdGFjaygoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBpLCBpbmRleCwgaW50ZXJydXB0LCBpdGVtLCBsZW4sIHJlc3VsdHM7XG4gICAgICAgICAgcmVzdWx0cyA9IFtdO1xuICAgICAgICAgIGZvciAoaW5kZXggPSBpID0gMCwgbGVuID0gc2VnbWVudC5sZW5ndGg7IGkgPCBsZW47IGluZGV4ID0gKytpKSB7XG4gICAgICAgICAgICBpdGVtID0gc2VnbWVudFtpbmRleF07XG4gICAgICAgICAgICBjb250ZXh0LnNldChfdGhpcy52YXJpYWJsZU5hbWUsIGl0ZW0pO1xuICAgICAgICAgICAgY29udGV4dC5zZXQoJ2Zvcmxvb3AnLCB7XG4gICAgICAgICAgICAgIG5hbWU6IF90aGlzLm5hbWUsXG4gICAgICAgICAgICAgIGxlbmd0aDogbGVuZ3RoLFxuICAgICAgICAgICAgICBpbmRleDogaW5kZXggKyAxLFxuICAgICAgICAgICAgICBpbmRleDA6IGluZGV4LFxuICAgICAgICAgICAgICByaW5kZXg6IGxlbmd0aCAtIGluZGV4LFxuICAgICAgICAgICAgICByaW5kZXgwOiBsZW5ndGggLSBpbmRleCAtIDEsXG4gICAgICAgICAgICAgIGZpcnN0OiBpbmRleCA9PT0gMCxcbiAgICAgICAgICAgICAgbGFzdDogaW5kZXggPT09IGxlbmd0aCAtIDFcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmVzdWx0ICs9IF90aGlzLnJlbmRlckFsbChfdGhpcy5ub2RlbGlzdCwgY29udGV4dCk7XG4gICAgICAgICAgICBpZiAoY29udGV4dC5oYXNJbnRlcnJ1cHQoKSkge1xuICAgICAgICAgICAgICBpbnRlcnJ1cHQgPSBjb250ZXh0LnBvcEludGVycnVwdCgpO1xuICAgICAgICAgICAgICBpZiAoaW50ZXJydXB0IGluc3RhbmNlb2YgTGlxdWlkLkJyZWFrSW50ZXJydXB0KSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKGludGVycnVwdCBpbnN0YW5jZW9mIExpcXVpZC5Db250aW51ZUludGVycnVwdCkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh2b2lkIDApO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXN1bHRzLnB1c2godm9pZCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKSk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG5cbiAgICByZXR1cm4gRm9yO1xuXG4gIH0pKExpcXVpZC5CbG9jayk7XG5cbiAgTGlxdWlkLlRlbXBsYXRlLnJlZ2lzdGVyVGFnKFwiZm9yXCIsIExpcXVpZC5UYWdzLkZvcik7XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuMTEuMVxuKGZ1bmN0aW9uKCkge1xuICB2YXIgTGlxdWlkLFxuICAgIGV4dGVuZCA9IGZ1bmN0aW9uKGNoaWxkLCBwYXJlbnQpIHsgZm9yICh2YXIga2V5IGluIHBhcmVudCkgeyBpZiAoaGFzUHJvcC5jYWxsKHBhcmVudCwga2V5KSkgY2hpbGRba2V5XSA9IHBhcmVudFtrZXldOyB9IGZ1bmN0aW9uIGN0b3IoKSB7IHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDsgfSBjdG9yLnByb3RvdHlwZSA9IHBhcmVudC5wcm90b3R5cGU7IGNoaWxkLnByb3RvdHlwZSA9IG5ldyBjdG9yKCk7IGNoaWxkLl9fc3VwZXJfXyA9IHBhcmVudC5wcm90b3R5cGU7IHJldHVybiBjaGlsZDsgfSxcbiAgICBoYXNQcm9wID0ge30uaGFzT3duUHJvcGVydHk7XG5cbiAgTGlxdWlkID0gcmVxdWlyZSgnLi4vLi4vbGlxdWlkJyk7XG5cbiAgTGlxdWlkLlRhZ3MuSWYgPSAoZnVuY3Rpb24oc3VwZXJDbGFzcykge1xuICAgIHZhciBFeHByZXNzaW9uc0FuZE9wZXJhdG9ycywgU3ludGF4LCBTeW50YXhIZWxwO1xuXG4gICAgZXh0ZW5kKElmLCBzdXBlckNsYXNzKTtcblxuICAgIFN5bnRheEhlbHAgPSBcIlN5bnRheCBFcnJvciBpbiB0YWcgJ2lmJyAtIFZhbGlkIHN5bnRheDogaWYgW2V4cHJlc3Npb25dXCI7XG5cbiAgICBTeW50YXggPSBSZWdFeHAoXCIoXCIgKyBMaXF1aWQuU3RyaWN0UXVvdGVkRnJhZ21lbnQuc291cmNlICsgXCIpXFxcXHMqKFs9ITw+YS16X10rKT9cXFxccyooXCIgKyBMaXF1aWQuU3RyaWN0UXVvdGVkRnJhZ21lbnQuc291cmNlICsgXCIpP1wiKTtcblxuICAgIEV4cHJlc3Npb25zQW5kT3BlcmF0b3JzID0gUmVnRXhwKFwiKD86XFxcXGIoPzpcXFxccz9hbmRcXFxccz98XFxcXHM/b3JcXFxccz8pXFxcXGJ8KD86XFxcXHMqKD8hXFxcXGIoPzpcXFxccz9hbmRcXFxccz98XFxcXHM/b3JcXFxccz8pXFxcXGIpKD86XCIgKyBMaXF1aWQuU3RyaWN0UXVvdGVkRnJhZ21lbnQuc291cmNlICsgXCJ8XFxcXFMrKVxcXFxzKikrKVwiLCBcImdcIik7XG5cbiAgICBmdW5jdGlvbiBJZih0YWcsIG1hcmt1cCwgdG9rZW5zKSB7XG4gICAgICB0aGlzLm5vZGVsaXN0ID0gW107XG4gICAgICB0aGlzLmJsb2NrcyA9IFtdO1xuICAgICAgdGhpcy5wdXNoQmxvY2soXCJpZlwiLCBtYXJrdXApO1xuICAgICAgSWYuX19zdXBlcl9fLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgdGFnLCBtYXJrdXAsIHRva2Vucyk7XG4gICAgfVxuXG4gICAgSWYucHJvdG90eXBlLnVua25vd25UYWcgPSBmdW5jdGlvbih0YWcsIG1hcmt1cCwgdG9rZW5zKSB7XG4gICAgICBpZiAodGFnID09PSBcImVsc2lmXCIgfHwgdGFnID09PSBcImVsc2VcIikge1xuICAgICAgICByZXR1cm4gdGhpcy5wdXNoQmxvY2sodGFnLCBtYXJrdXApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIElmLl9fc3VwZXJfXy51bmtub3duVGFnLmNhbGwodGhpcywgdGFnLCBtYXJrdXAsIHRva2Vucyk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIElmLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gICAgICB2YXIgb3V0cHV0O1xuICAgICAgb3V0cHV0ID0gJyc7XG4gICAgICBjb250ZXh0LnN0YWNrKChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIGJsb2NrLCBpLCBsZW4sIHJlZjtcbiAgICAgICAgICByZWYgPSBfdGhpcy5ibG9ja3M7XG4gICAgICAgICAgZm9yIChpID0gMCwgbGVuID0gcmVmLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBibG9jayA9IHJlZltpXTtcbiAgICAgICAgICAgIGlmIChibG9jay5ldmFsdWF0ZShjb250ZXh0KSkge1xuICAgICAgICAgICAgICBvdXRwdXQgPSBfdGhpcy5yZW5kZXJBbGwoYmxvY2suYXR0YWNobWVudCwgY29udGV4dCk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9O1xuICAgICAgfSkodGhpcykpO1xuICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9O1xuXG4gICAgSWYucHJvdG90eXBlLnB1c2hCbG9jayA9IGZ1bmN0aW9uKHRhZywgbWFya3VwKSB7XG4gICAgICB2YXIgJCwgYmxvY2ssIGNvbmRpdGlvbiwgZXhwcmVzc2lvbnMsIG5ld0NvbmRpdGlvbiwgb3BlcmF0b3I7XG4gICAgICBibG9jayA9IChmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRhZyA9PT0gJ2Vsc2UnKSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBMaXF1aWQuRWxzZUNvbmRpdGlvbjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBleHByZXNzaW9ucyA9IG1hcmt1cC5tYXRjaChFeHByZXNzaW9uc0FuZE9wZXJhdG9ycykucmV2ZXJzZSgpO1xuICAgICAgICAgIGlmICghKCQgPSBleHByZXNzaW9ucy5zaGlmdCgpLm1hdGNoKFN5bnRheCkpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgTGlxdWlkLlN5bnRheEVycm9yKFN5bnRheEhlbHApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25kaXRpb24gPSBuZXcgTGlxdWlkLkNvbmRpdGlvbigkWzFdLCAkWzJdLCAkWzNdKTtcbiAgICAgICAgICB3aGlsZSAoZXhwcmVzc2lvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgb3BlcmF0b3IgPSBleHByZXNzaW9ucy5zaGlmdCgpO1xuICAgICAgICAgICAgaWYgKCFleHByZXNzaW9ucy5zaGlmdCgpLm1hdGNoKFN5bnRheCkpIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IExpcXVpZC5TeW50YXhFcnJvcihTeW50YXhIZWxwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5ld0NvbmRpdGlvbiA9IG5ldyBMaXF1aWQuQ29uZGl0aW9uKCRbMV0sICRbMl0sICRbM10pO1xuICAgICAgICAgICAgbmV3Q29uZGl0aW9uW29wZXJhdG9yXShjb25kaXRpb24pO1xuICAgICAgICAgICAgY29uZGl0aW9uID0gbmV3Q29uZGl0aW9uO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gY29uZGl0aW9uO1xuICAgICAgICB9XG4gICAgICB9KSgpO1xuICAgICAgdGhpcy5ibG9ja3MucHVzaChibG9jayk7XG4gICAgICByZXR1cm4gdGhpcy5ub2RlbGlzdCA9IGJsb2NrLmF0dGFjaChbXSk7XG4gICAgfTtcblxuICAgIHJldHVybiBJZjtcblxuICB9KShMaXF1aWQuQmxvY2spO1xuXG4gIExpcXVpZC5UZW1wbGF0ZS5yZWdpc3RlclRhZyhcImlmXCIsIExpcXVpZC5UYWdzLklmKTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS4xMS4xXG4oZnVuY3Rpb24oKSB7XG4gIHZhciBMaXF1aWQsXG4gICAgZXh0ZW5kID0gZnVuY3Rpb24oY2hpbGQsIHBhcmVudCkgeyBmb3IgKHZhciBrZXkgaW4gcGFyZW50KSB7IGlmIChoYXNQcm9wLmNhbGwocGFyZW50LCBrZXkpKSBjaGlsZFtrZXldID0gcGFyZW50W2tleV07IH0gZnVuY3Rpb24gY3RvcigpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGNoaWxkOyB9IGN0b3IucHJvdG90eXBlID0gcGFyZW50LnByb3RvdHlwZTsgY2hpbGQucHJvdG90eXBlID0gbmV3IGN0b3IoKTsgY2hpbGQuX19zdXBlcl9fID0gcGFyZW50LnByb3RvdHlwZTsgcmV0dXJuIGNoaWxkOyB9LFxuICAgIGhhc1Byb3AgPSB7fS5oYXNPd25Qcm9wZXJ0eTtcblxuICBMaXF1aWQgPSByZXF1aXJlKCcuLi8uLi9saXF1aWQnKTtcblxuICBMaXF1aWQuVGFncy5JZkNoYW5nZWQgPSAoZnVuY3Rpb24oc3VwZXJDbGFzcykge1xuICAgIGV4dGVuZChJZkNoYW5nZWQsIHN1cGVyQ2xhc3MpO1xuXG4gICAgZnVuY3Rpb24gSWZDaGFuZ2VkKCkge1xuICAgICAgcmV0dXJuIElmQ2hhbmdlZC5fX3N1cGVyX18uY29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICBJZkNoYW5nZWQucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgICAgIHZhciBvdXRwdXQ7XG4gICAgICBvdXRwdXQgPSBcIlwiO1xuICAgICAgY29udGV4dC5zdGFjaygoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIG91dHB1dCA9IF90aGlzLnJlbmRlckFsbChfdGhpcy5ub2RlbGlzdCwgY29udGV4dCk7XG4gICAgICAgICAgaWYgKG91dHB1dCAhPT0gY29udGV4dC5yZWdpc3RlcnMuaWZjaGFuZ2VkKSB7XG4gICAgICAgICAgICByZXR1cm4gY29udGV4dC5yZWdpc3RlcnMuaWZjaGFuZ2VkID0gb3V0cHV0O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gb3V0cHV0ID0gJyc7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfSkodGhpcykpO1xuICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9O1xuXG4gICAgcmV0dXJuIElmQ2hhbmdlZDtcblxuICB9KShMaXF1aWQuQmxvY2spO1xuXG4gIExpcXVpZC5UZW1wbGF0ZS5yZWdpc3RlclRhZyhcImlmY2hhbmdlZFwiLCBMaXF1aWQuVGFncy5JZkNoYW5nZWQpO1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjExLjFcbihmdW5jdGlvbigpIHtcbiAgdmFyIEluY2x1ZGUsIExpcXVpZCxcbiAgICBleHRlbmQgPSBmdW5jdGlvbihjaGlsZCwgcGFyZW50KSB7IGZvciAodmFyIGtleSBpbiBwYXJlbnQpIHsgaWYgKGhhc1Byb3AuY2FsbChwYXJlbnQsIGtleSkpIGNoaWxkW2tleV0gPSBwYXJlbnRba2V5XTsgfSBmdW5jdGlvbiBjdG9yKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gY2hpbGQ7IH0gY3Rvci5wcm90b3R5cGUgPSBwYXJlbnQucHJvdG90eXBlOyBjaGlsZC5wcm90b3R5cGUgPSBuZXcgY3RvcigpOyBjaGlsZC5fX3N1cGVyX18gPSBwYXJlbnQucHJvdG90eXBlOyByZXR1cm4gY2hpbGQ7IH0sXG4gICAgaGFzUHJvcCA9IHt9Lmhhc093blByb3BlcnR5O1xuXG4gIExpcXVpZCA9IHJlcXVpcmUoJy4uLy4uL2xpcXVpZCcpO1xuXG4gIEluY2x1ZGUgPSAoZnVuY3Rpb24oc3VwZXJDbGFzcykge1xuICAgIHZhciBTeW50YXg7XG5cbiAgICBleHRlbmQoSW5jbHVkZSwgc3VwZXJDbGFzcyk7XG5cbiAgICBTeW50YXggPSBSZWdFeHAoXCIoXCIgKyBMaXF1aWQuU3RyaWN0UXVvdGVkRnJhZ21lbnQuc291cmNlICsgXCIpKFxcXFxzKyg/OndpdGh8Zm9yKVxcXFxzKyhcIiArIExpcXVpZC5TdHJpY3RRdW90ZWRGcmFnbWVudC5zb3VyY2UgKyBcIikpP1wiKTtcblxuICAgIGZ1bmN0aW9uIEluY2x1ZGUodGFnLCBtYXJrdXAsIHRva2Vucykge1xuICAgICAgdmFyICQ7XG4gICAgICBpZiAoJCA9IG1hcmt1cC5tYXRjaChTeW50YXgpKSB7XG4gICAgICAgIHRoaXMudGVtcGxhdGVOYW1lID0gJFsxXTtcbiAgICAgICAgdGhpcy52YXJpYWJsZU5hbWUgPSAkWzNdO1xuICAgICAgICB0aGlzLmF0dHJpYnV0ZXMgPSB7fTtcbiAgICAgICAgbWFya3VwLnJlcGxhY2UoTGlxdWlkLlRhZ0F0dHJpYnV0ZXMsIChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICB2YXIgcmVmO1xuICAgICAgICAgICAgcmVmID0ga2V5LnNwbGl0KCc6JyksIGtleSA9IHJlZlswXSwgdmFsdWUgPSByZWZbMV07XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMuYXR0cmlidXRlc1trZXldID0gdmFsdWU7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSkodGhpcykpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IExpcXVpZC5TeW50YXhFcnJvcihcIkVycm9yIGluIHRhZyAnaW5jbHVkZScgLSBWYWxpZCBzeW50YXg6IGluY2x1ZGUgJ1t0ZW1wbGF0ZV0nICh3aXRofGZvcikgW29iamVjdHxjb2xsZWN0aW9uXVwiKTtcbiAgICAgIH1cbiAgICAgIEluY2x1ZGUuX19zdXBlcl9fLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgdGFnLCBtYXJrdXAsIHRva2Vucyk7XG4gICAgfVxuXG4gICAgSW5jbHVkZS5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oY29udGV4dCkge1xuICAgICAgdmFyIG91dHB1dCwgcGFydGlhbCwgc291cmNlLCB2YXJpYWJsZTtcbiAgICAgIHNvdXJjZSA9IEluY2x1ZGUucmVhZFRlbXBsYXRlRnJvbUZpbGVTeXN0ZW0oY29udGV4dCwgdGhpcy50ZW1wbGF0ZU5hbWUpO1xuICAgICAgcGFydGlhbCA9IExpcXVpZC5UZW1wbGF0ZS5wYXJzZShzb3VyY2UpO1xuICAgICAgdmFyaWFibGUgPSBjb250ZXh0LmdldCh0aGlzLnZhcmlhYmxlTmFtZSB8fCB0aGlzLnRlbXBsYXRlTmFtZS5zbGljZSgxLCAtMSkpO1xuICAgICAgb3V0cHV0ID0gJyc7XG4gICAgICBjb250ZXh0LnN0YWNrKChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIGksIGtleSwgbGVuLCByZWYsIHJlc3VsdHMsIHYsIHZhbHVlO1xuICAgICAgICAgIHJlZiA9IF90aGlzLmF0dHJpYnV0ZXM7XG4gICAgICAgICAgZm9yIChrZXkgaW4gcmVmKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHJlZltrZXldO1xuICAgICAgICAgICAgY29udGV4dC5zZXQoa2V5LCBjb250ZXh0LmdldCh2YWx1ZSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodmFyaWFibGUgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgb3V0cHV0ID0gJyc7XG4gICAgICAgICAgICByZXN1bHRzID0gW107XG4gICAgICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSB2YXJpYWJsZS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICB2ID0gdmFyaWFibGVbaV07XG4gICAgICAgICAgICAgIGNvbnRleHQuc2V0KF90aGlzLnRlbXBsYXRlTmFtZS5zbGljZSgxLCAtMSksIHYpO1xuICAgICAgICAgICAgICByZXN1bHRzLnB1c2gob3V0cHV0ICs9IHBhcnRpYWwucmVuZGVyKGNvbnRleHQpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb250ZXh0LnNldChfdGhpcy50ZW1wbGF0ZU5hbWUuc2xpY2UoMSwgLTEpLCB2YXJpYWJsZSk7XG4gICAgICAgICAgICByZXR1cm4gb3V0cHV0ID0gcGFydGlhbC5yZW5kZXIoY29udGV4dCk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfSkodGhpcykpO1xuICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9O1xuXG4gICAgSW5jbHVkZS5yZWFkVGVtcGxhdGVGcm9tRmlsZVN5c3RlbSA9IGZ1bmN0aW9uKGNvbnRleHQsIHRlbXBsYXRlTmFtZSkge1xuICAgICAgdmFyIGZpbGVTeXN0ZW07XG4gICAgICBmaWxlU3lzdGVtID0gY29udGV4dC5yZWdpc3RlcnMuZmlsZVN5c3RlbSB8fCBMaXF1aWQuVGVtcGxhdGUuZmlsZVN5c3RlbTtcbiAgICAgIHJldHVybiBmaWxlU3lzdGVtLnJlYWRUZW1wbGF0ZUZpbGUoY29udGV4dC5nZXQodGVtcGxhdGVOYW1lKSk7XG4gICAgfTtcblxuICAgIHJldHVybiBJbmNsdWRlO1xuXG4gIH0pKExpcXVpZC5UYWcpO1xuXG4gIExpcXVpZC5UZW1wbGF0ZS5yZWdpc3RlclRhZyhcImluY2x1ZGVcIiwgSW5jbHVkZSk7XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuMTEuMVxuKGZ1bmN0aW9uKCkge1xuICB2YXIgTGlxdWlkLFxuICAgIGV4dGVuZCA9IGZ1bmN0aW9uKGNoaWxkLCBwYXJlbnQpIHsgZm9yICh2YXIga2V5IGluIHBhcmVudCkgeyBpZiAoaGFzUHJvcC5jYWxsKHBhcmVudCwga2V5KSkgY2hpbGRba2V5XSA9IHBhcmVudFtrZXldOyB9IGZ1bmN0aW9uIGN0b3IoKSB7IHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDsgfSBjdG9yLnByb3RvdHlwZSA9IHBhcmVudC5wcm90b3R5cGU7IGNoaWxkLnByb3RvdHlwZSA9IG5ldyBjdG9yKCk7IGNoaWxkLl9fc3VwZXJfXyA9IHBhcmVudC5wcm90b3R5cGU7IHJldHVybiBjaGlsZDsgfSxcbiAgICBoYXNQcm9wID0ge30uaGFzT3duUHJvcGVydHk7XG5cbiAgTGlxdWlkID0gcmVxdWlyZSgnLi4vLi4vbGlxdWlkJyk7XG5cbiAgTGlxdWlkLlRhZ3MuSW5jcmVtZW50ID0gKGZ1bmN0aW9uKHN1cGVyQ2xhc3MpIHtcbiAgICBleHRlbmQoSW5jcmVtZW50LCBzdXBlckNsYXNzKTtcblxuICAgIGZ1bmN0aW9uIEluY3JlbWVudCh0YWdOYW1lLCBtYXJrdXAsIHRva2Vucykge1xuICAgICAgdGhpcy52YXJpYWJsZSA9IG1hcmt1cC50cmltKCk7XG4gICAgICBJbmNyZW1lbnQuX19zdXBlcl9fLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgdGFnTmFtZSwgbWFya3VwLCB0b2tlbnMpO1xuICAgIH1cblxuICAgIEluY3JlbWVudC5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oY29udGV4dCkge1xuICAgICAgdmFyIHZhbHVlO1xuICAgICAgaWYgKGNvbnRleHQuc2NvcGVzWzBdW3RoaXMudmFyaWFibGVdICE9IG51bGwpIHtcbiAgICAgICAgdmFsdWUgPSBjb250ZXh0LnNjb3Blc1swXVt0aGlzLnZhcmlhYmxlXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhbHVlID0gY29udGV4dC5zY29wZXNbMF1bdGhpcy52YXJpYWJsZV0gPSAtMTtcbiAgICAgIH1cbiAgICAgIHZhbHVlID0gdmFsdWUgKyAxO1xuICAgICAgY29udGV4dC5zY29wZXNbMF1bdGhpcy52YXJpYWJsZV0gPSB2YWx1ZTtcbiAgICAgIHJldHVybiB2YWx1ZS50b1N0cmluZygpO1xuICAgIH07XG5cbiAgICByZXR1cm4gSW5jcmVtZW50O1xuXG4gIH0pKExpcXVpZC5UYWcpO1xuXG4gIExpcXVpZC5UZW1wbGF0ZS5yZWdpc3RlclRhZyhcImluY3JlbWVudFwiLCBMaXF1aWQuVGFncy5JbmNyZW1lbnQpO1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjExLjFcbihmdW5jdGlvbigpIHtcbiAgdmFyIExpcXVpZCxcbiAgICBleHRlbmQgPSBmdW5jdGlvbihjaGlsZCwgcGFyZW50KSB7IGZvciAodmFyIGtleSBpbiBwYXJlbnQpIHsgaWYgKGhhc1Byb3AuY2FsbChwYXJlbnQsIGtleSkpIGNoaWxkW2tleV0gPSBwYXJlbnRba2V5XTsgfSBmdW5jdGlvbiBjdG9yKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gY2hpbGQ7IH0gY3Rvci5wcm90b3R5cGUgPSBwYXJlbnQucHJvdG90eXBlOyBjaGlsZC5wcm90b3R5cGUgPSBuZXcgY3RvcigpOyBjaGlsZC5fX3N1cGVyX18gPSBwYXJlbnQucHJvdG90eXBlOyByZXR1cm4gY2hpbGQ7IH0sXG4gICAgaGFzUHJvcCA9IHt9Lmhhc093blByb3BlcnR5O1xuXG4gIExpcXVpZCA9IHJlcXVpcmUoJy4uLy4uL2xpcXVpZCcpO1xuXG4gIExpcXVpZC5UYWdzLlJhdyA9IChmdW5jdGlvbihzdXBlckNsYXNzKSB7XG4gICAgdmFyIEZ1bGxUb2tlbjtcblxuICAgIGV4dGVuZChSYXcsIHN1cGVyQ2xhc3MpO1xuXG4gICAgRnVsbFRva2VuID0gUmVnRXhwKFwiXlwiICsgTGlxdWlkLlRhZ1N0YXJ0LnNvdXJjZSArIFwiXFxcXHMqKFxcXFx3KylcXFxccyooLiopP1wiICsgTGlxdWlkLlRhZ0VuZC5zb3VyY2UgKyBcIiRcIik7XG5cbiAgICBmdW5jdGlvbiBSYXcodGFnLCBtYXJrdXAsIHRva2Vucykge1xuICAgICAgUmF3Ll9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIHRhZywgbWFya3VwLCB0b2tlbnMpO1xuICAgIH1cblxuICAgIFJhdy5wcm90b3R5cGUucGFyc2UgPSBmdW5jdGlvbih0b2tlbnMpIHtcbiAgICAgIHZhciAkLCB0b2tlbjtcbiAgICAgIHRoaXMubm9kZWxpc3QgfHwgKHRoaXMubm9kZWxpc3QgPSBbXSk7XG4gICAgICB0aGlzLm5vZGVsaXN0Lmxlbmd0aCA9IDA7XG4gICAgICB3aGlsZSAoKHRva2VuID0gdG9rZW5zLnNoaWZ0KCkpICE9IG51bGwpIHtcbiAgICAgICAgaWYgKCQgPSB0b2tlbi5tYXRjaChGdWxsVG9rZW4pKSB7XG4gICAgICAgICAgaWYgKHRoaXMuYmxvY2tEZWxpbWl0ZXIgPT09ICRbMV0pIHtcbiAgICAgICAgICAgIHRoaXMuZW5kVGFnKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgdG9rZW4gIT09IFwidW5kZWZpbmVkXCIgJiYgdG9rZW4gIT09IG51bGwpIHtcbiAgICAgICAgICB0aGlzLm5vZGVsaXN0LnB1c2godG9rZW4pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiBSYXc7XG5cbiAgfSkoTGlxdWlkLkJsb2NrKTtcblxuICBMaXF1aWQuVGVtcGxhdGUucmVnaXN0ZXJUYWcoXCJyYXdcIiwgTGlxdWlkLlRhZ3MuUmF3KTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS4xMS4xXG4oZnVuY3Rpb24oKSB7XG4gIHZhciBMaXF1aWQsXG4gICAgZXh0ZW5kID0gZnVuY3Rpb24oY2hpbGQsIHBhcmVudCkgeyBmb3IgKHZhciBrZXkgaW4gcGFyZW50KSB7IGlmIChoYXNQcm9wLmNhbGwocGFyZW50LCBrZXkpKSBjaGlsZFtrZXldID0gcGFyZW50W2tleV07IH0gZnVuY3Rpb24gY3RvcigpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGNoaWxkOyB9IGN0b3IucHJvdG90eXBlID0gcGFyZW50LnByb3RvdHlwZTsgY2hpbGQucHJvdG90eXBlID0gbmV3IGN0b3IoKTsgY2hpbGQuX19zdXBlcl9fID0gcGFyZW50LnByb3RvdHlwZTsgcmV0dXJuIGNoaWxkOyB9LFxuICAgIGhhc1Byb3AgPSB7fS5oYXNPd25Qcm9wZXJ0eTtcblxuICBMaXF1aWQgPSByZXF1aXJlKCcuLi8uLi9saXF1aWQnKTtcblxuICBMaXF1aWQuVGFncy5Vbmxlc3MgPSAoZnVuY3Rpb24oc3VwZXJDbGFzcykge1xuICAgIGV4dGVuZChVbmxlc3MsIHN1cGVyQ2xhc3MpO1xuXG4gICAgZnVuY3Rpb24gVW5sZXNzKCkge1xuICAgICAgcmV0dXJuIFVubGVzcy5fX3N1cGVyX18uY29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICBVbmxlc3MucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgICAgIHZhciBvdXRwdXQ7XG4gICAgICBvdXRwdXQgPSAnJztcbiAgICAgIGNvbnRleHQuc3RhY2soKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgYmxvY2ssIGksIGxlbiwgcmVmO1xuICAgICAgICAgIGJsb2NrID0gX3RoaXMuYmxvY2tzWzBdO1xuICAgICAgICAgIGlmICghYmxvY2suZXZhbHVhdGUoY29udGV4dCkpIHtcbiAgICAgICAgICAgIG91dHB1dCA9IF90aGlzLnJlbmRlckFsbChibG9jay5hdHRhY2htZW50LCBjb250ZXh0KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVmID0gX3RoaXMuYmxvY2tzLnNsaWNlKDEpO1xuICAgICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IHJlZi5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgYmxvY2sgPSByZWZbaV07XG4gICAgICAgICAgICBpZiAoYmxvY2suZXZhbHVhdGUoY29udGV4dCkpIHtcbiAgICAgICAgICAgICAgb3V0cHV0ID0gX3RoaXMucmVuZGVyQWxsKGJsb2NrLmF0dGFjaG1lbnQsIGNvbnRleHQpO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfTtcbiAgICAgIH0pKHRoaXMpKTtcbiAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgfTtcblxuICAgIHJldHVybiBVbmxlc3M7XG5cbiAgfSkoTGlxdWlkLlRhZ3MuSWYpO1xuXG4gIExpcXVpZC5UZW1wbGF0ZS5yZWdpc3RlclRhZyhcInVubGVzc1wiLCBMaXF1aWQuVGFncy5Vbmxlc3MpO1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjExLjFcbihmdW5jdGlvbigpIHtcbiAgdmFyIExpcXVpZCxcbiAgICBzbGljZSA9IFtdLnNsaWNlO1xuXG4gIExpcXVpZCA9IHJlcXVpcmUoJy4uL2xpcXVpZCcpO1xuXG4gIExpcXVpZC5UZW1wbGF0ZSA9IChmdW5jdGlvbigpIHtcbiAgICBUZW1wbGF0ZS5maWxlU3lzdGVtID0gbmV3IExpcXVpZC5CbGFua0ZpbGVTeXN0ZW0oKTtcblxuICAgIFRlbXBsYXRlLnRhZ3MgPSB7fTtcblxuICAgIFRlbXBsYXRlLnJlZ2lzdGVyVGFnID0gZnVuY3Rpb24obmFtZSwga2xhc3MpIHtcbiAgICAgIHJldHVybiBMaXF1aWQuVGVtcGxhdGUudGFnc1tuYW1lXSA9IGtsYXNzO1xuICAgIH07XG5cbiAgICBUZW1wbGF0ZS5yZWdpc3RlckZpbHRlciA9IGZ1bmN0aW9uKG1vZCkge1xuICAgICAgcmV0dXJuIExpcXVpZC5TdHJhaW5lci5nbG9iYWxGaWx0ZXIobW9kKTtcbiAgICB9O1xuXG4gICAgVGVtcGxhdGUucGFyc2UgPSBmdW5jdGlvbihzb3VyY2UpIHtcbiAgICAgIHZhciB0ZW1wbGF0ZTtcbiAgICAgIHRlbXBsYXRlID0gbmV3IExpcXVpZC5UZW1wbGF0ZTtcbiAgICAgIHRlbXBsYXRlLnBhcnNlKHNvdXJjZSk7XG4gICAgICByZXR1cm4gdGVtcGxhdGU7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIFRlbXBsYXRlKCkge1xuICAgICAgdGhpcy5yb290ID0gbnVsbDtcbiAgICAgIHRoaXMucmVnaXN0ZXJzID0ge307XG4gICAgICB0aGlzLmFzc2lnbnMgPSB7fTtcbiAgICAgIHRoaXMuaW5zdGFuY2VBc3NpZ25zID0ge307XG4gICAgICB0aGlzLmVycm9ycyA9IFtdO1xuICAgICAgdGhpcy5yZXRocm93RXJyb3JzID0gZmFsc2U7XG4gICAgfVxuXG4gICAgVGVtcGxhdGUucHJvdG90eXBlLnBhcnNlID0gZnVuY3Rpb24oc3JjKSB7XG4gICAgICB0aGlzLnJvb3QgPSBuZXcgTGlxdWlkLkRvY3VtZW50KExpcXVpZC5UZW1wbGF0ZS50b2tlbml6ZShzcmMpKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICBUZW1wbGF0ZS5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYXJncywgY29udGV4dCwga2V5LCBsYXN0LCBvcHRpb25zLCByZWYsIHJlc3VsdCwgdmFsO1xuICAgICAgYXJncyA9IDEgPD0gYXJndW1lbnRzLmxlbmd0aCA/IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSA6IFtdO1xuICAgICAgaWYgKHRoaXMucm9vdCA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgICB9XG4gICAgICBjb250ZXh0ID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoYXJnc1swXSBpbnN0YW5jZW9mIExpcXVpZC5Db250ZXh0KSB7XG4gICAgICAgICAgcmV0dXJuIGFyZ3Muc2hpZnQoKTtcbiAgICAgICAgfSBlbHNlIGlmIChhcmdzWzBdIGluc3RhbmNlb2YgT2JqZWN0KSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBMaXF1aWQuQ29udGV4dChbYXJncy5zaGlmdCgpLCB0aGlzLmFzc2lnbnNdLCB0aGlzLmluc3RhbmNlQXNzaWducywgdGhpcy5yZWdpc3RlcnMsIHRoaXMucmV0aHJvd0Vycm9ycyk7XG4gICAgICAgIH0gZWxzZSBpZiAoYXJnc1swXSA9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBMaXF1aWQuQ29udGV4dCh0aGlzLmFzc2lnbnMsIHRoaXMuaW5zdGFuY2VBc3NpZ25zLCB0aGlzLnJlZ2lzdGVycywgdGhpcy5yZXRocm93RXJyb3JzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBuZXcgTGlxdWlkLkFyZ3VtZW50RXJybyhcIkV4cGVjdCBIYXNoIG9yIExpcXVpZDo6Q29udGV4dCBhcyBwYXJhbWV0ZXJcIik7XG4gICAgICAgIH1cbiAgICAgIH0pLmNhbGwodGhpcyk7XG4gICAgICBsYXN0ID0gYXJncy5sZW5ndGggLSAxO1xuICAgICAgaWYgKGFyZ3NbbGFzdF0gaW5zdGFuY2VvZiBPYmplY3QpIHtcbiAgICAgICAgb3B0aW9ucyA9IGFyZ3MucG9wKCk7XG4gICAgICAgIGlmICgncmVnaXN0ZXJzJyBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgcmVmID0gb3B0aW9ucy5yZWdpc3RlcnM7XG4gICAgICAgICAgZm9yIChrZXkgaW4gcmVmKSB7XG4gICAgICAgICAgICB2YWwgPSByZWZba2V5XTtcbiAgICAgICAgICAgIHRoaXMucmVnaXN0ZXJzW2tleV0gPSB2YWw7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICgnZmlsdGVycycgaW4gb3B0aW9ucykge1xuICAgICAgICAgIGNvbnRleHQuYWRkRmlsdGVycyhvcHRpb25zLmZpbHRlcnMpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGFyZ3NbbGFzdF0gaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgICAgICBjb250ZXh0LmFkZEZpbHRlcnMoYXJncy5wb3AoKSk7XG4gICAgICB9IGVsc2UgaWYgKGFyZ3NbbGFzdF0gaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICBjb250ZXh0LmFkZEZpbHRlcnMoYXJncy5wb3AoKSk7XG4gICAgICB9XG4gICAgICB0cnkge1xuICAgICAgICByZXN1bHQgPSB0aGlzLnJvb3QucmVuZGVyKGNvbnRleHQpO1xuICAgICAgICBpZiAocmVzdWx0LmpvaW4gIT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiByZXN1bHQuam9pbignJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXJyb3JzID0gY29udGV4dC5lcnJvcnM7XG4gICAgICB9XG4gICAgfTtcblxuICAgIFRlbXBsYXRlLnByb3RvdHlwZS5yZW5kZXJXaXRoRXJyb3JzID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgcmVzLCBzYXZlZFJldGhyb3dFcnJvcnM7XG4gICAgICBzYXZlZFJldGhyb3dFcnJvcnMgPSB0aGlzLnJldGhyb3dFcnJvcnM7XG4gICAgICB0aGlzLnJldGhyb3dFcnJvcnMgPSB0cnVlO1xuICAgICAgcmVzID0gdGhpcy5yZW5kZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIHRoaXMucmV0aHJvd0Vycm9ycyA9IHNhdmVkUmV0aHJvd0Vycm9ycztcbiAgICAgIHJldHVybiByZXM7XG4gICAgfTtcblxuICAgIFRlbXBsYXRlLnRva2VuaXplID0gZnVuY3Rpb24oc291cmNlKSB7XG4gICAgICB2YXIgdG9rZW5zO1xuICAgICAgaWYgKHNvdXJjZSA9PSBudWxsKSB7XG4gICAgICAgIHNvdXJjZSA9ICcnO1xuICAgICAgfVxuICAgICAgaWYgKHNvdXJjZS5zb3VyY2UgIT0gbnVsbCkge1xuICAgICAgICBzb3VyY2UgPSBzb3VyY2Uuc291cmNlO1xuICAgICAgfVxuICAgICAgaWYgKHNvdXJjZSA9PT0gJycpIHtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgfVxuICAgICAgdG9rZW5zID0gc291cmNlLnNwbGl0KExpcXVpZC5UZW1wbGF0ZVBhcnNlcik7XG4gICAgICBpZiAodG9rZW5zWzBdID09PSAnJykge1xuICAgICAgICB0b2tlbnMuc2hpZnQoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0b2tlbnM7XG4gICAgfTtcblxuICAgIHJldHVybiBUZW1wbGF0ZTtcblxuICB9KSgpO1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjExLjFcbihmdW5jdGlvbigpIHtcbiAgdmFyIGNvbXBhY3QsIGZsYXR0ZW47XG5cbiAgY29tcGFjdCA9IGZ1bmN0aW9uKCR0aGlzKSB7XG4gICAgdmFyICR0aGF0LCBpLCBsZW4sIHJlc3VsdHM7XG4gICAgcmVzdWx0cyA9IFtdO1xuICAgIGZvciAoaSA9IDAsIGxlbiA9ICR0aGlzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAkdGhhdCA9ICR0aGlzW2ldO1xuICAgICAgaWYgKCR0aGF0KSB7XG4gICAgICAgIHJlc3VsdHMucHVzaCgkdGhhdCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRzO1xuICB9O1xuXG4gIGZsYXR0ZW4gPSBmdW5jdGlvbigkbGlzdCkge1xuICAgIHZhciAkYSwgJGl0ZW0sIGksIGxlbjtcbiAgICBpZiAoJGxpc3QgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICAkYSA9IFtdO1xuICAgIGZvciAoaSA9IDAsIGxlbiA9ICRsaXN0Lmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAkaXRlbSA9ICRsaXN0W2ldO1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoJGl0ZW0pKSB7XG4gICAgICAgICRhID0gJGEuY29uY2F0KGZsYXR0ZW4oJGl0ZW0pKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICRhLnB1c2goJGl0ZW0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gJGE7XG4gIH07XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY29tcGFjdDogY29tcGFjdCxcbiAgICBmbGF0dGVuOiBmbGF0dGVuXG4gIH07XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuMTEuMVxuKGZ1bmN0aW9uKCkge1xuICB2YXIgTGlxdWlkLFxuICAgIHNsaWNlID0gW10uc2xpY2U7XG5cbiAgTGlxdWlkID0gcmVxdWlyZSgnLi4vbGlxdWlkJyk7XG5cbiAgTGlxdWlkLlZhcmlhYmxlID0gKGZ1bmN0aW9uKCkge1xuICAgIHZhciBGaWx0ZXJQYXJzZXIsIGNvbXBhY3QsIGZsYXR0ZW4sIHJlZjtcblxuICAgIEZpbHRlclBhcnNlciA9IFJlZ0V4cChcIig/OlwiICsgTGlxdWlkLkZpbHRlclNlcGFyYXRvci5zb3VyY2UgKyBcInwoPzpcXFxccyooPyEoPzpcIiArIExpcXVpZC5GaWx0ZXJTZXBhcmF0b3Iuc291cmNlICsgXCIpKSg/OlwiICsgTGlxdWlkLlF1b3RlZEZyYWdtZW50LnNvdXJjZSArIFwifFxcXFxTKylcXFxccyopKylcIik7XG5cbiAgICByZWYgPSByZXF1aXJlKCcuL3V0aWwnKSwgY29tcGFjdCA9IHJlZi5jb21wYWN0LCBmbGF0dGVuID0gcmVmLmZsYXR0ZW47XG5cbiAgICBmdW5jdGlvbiBWYXJpYWJsZShtYXJrdXApIHtcbiAgICAgIHZhciBmLCBmaWx0ZXJhcmdzLCBmaWx0ZXJuYW1lLCBmaWx0ZXJzLCBpLCBsZW4sIG1hdGNoLCBtYXRjaGVzO1xuICAgICAgdGhpcy5tYXJrdXAgPSBtYXJrdXA7XG4gICAgICB0aGlzLm5hbWUgPSBudWxsO1xuICAgICAgdGhpcy5maWx0ZXJzID0gW107XG4gICAgICBpZiAobWF0Y2ggPSBtYXJrdXAubWF0Y2goUmVnRXhwKFwiXFxcXHMqKFwiICsgTGlxdWlkLlF1b3RlZEZyYWdtZW50LnNvdXJjZSArIFwiKSguKilcIikpKSB7XG4gICAgICAgIHRoaXMubmFtZSA9IG1hdGNoWzFdO1xuICAgICAgICBpZiAobWF0Y2hbMl0ubWF0Y2goUmVnRXhwKExpcXVpZC5GaWx0ZXJTZXBhcmF0b3Iuc291cmNlICsgXCJcXFxccyooLiopXCIpKSkge1xuICAgICAgICAgIGZpbHRlcnMgPSBtYXRjaFsyXS5tYXRjaChSZWdFeHAoXCJcIiArIEZpbHRlclBhcnNlci5zb3VyY2UsIFwiZ1wiKSk7XG4gICAgICAgICAgZm9yIChpID0gMCwgbGVuID0gZmlsdGVycy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgZiA9IGZpbHRlcnNbaV07XG4gICAgICAgICAgICBpZiAobWF0Y2hlcyA9IGYubWF0Y2goL1xccyooXFx3KykvKSkge1xuICAgICAgICAgICAgICBmaWx0ZXJuYW1lID0gbWF0Y2hlc1sxXTtcbiAgICAgICAgICAgICAgZmlsdGVyYXJncyA9IGYuc3BsaXQoUmVnRXhwKFwiKD86XCIgKyBMaXF1aWQuRmlsdGVyQXJndW1lbnRTZXBhcmF0b3IgKyBcInxcIiArIExpcXVpZC5Bcmd1bWVudFNlcGFyYXRvciArIFwiKVxcXFxzKihcIiArIExpcXVpZC5RdW90ZWRGcmFnbWVudC5zb3VyY2UgKyBcIilcIikpO1xuICAgICAgICAgICAgICBmaWx0ZXJhcmdzLnNoaWZ0KCk7XG4gICAgICAgICAgICAgIGZpbHRlcmFyZ3MucG9wKCk7XG4gICAgICAgICAgICAgIHRoaXMuZmlsdGVycy5wdXNoKFtmaWx0ZXJuYW1lLCBjb21wYWN0KGZsYXR0ZW4oZmlsdGVyYXJncykpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgVmFyaWFibGUucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgICAgIHZhciBhLCBlLCBmaWx0ZXIsIGZpbHRlcmFyZ3MsIGksIGosIGxlbiwgbGVuMSwgb3V0cHV0LCByZWYxLCByZWYyO1xuICAgICAgaWYgKHRoaXMubmFtZSA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiAnJztcbiAgICAgIH1cbiAgICAgIG91dHB1dCA9IGNvbnRleHQuZ2V0KHRoaXMubmFtZSk7XG4gICAgICByZWYxID0gdGhpcy5maWx0ZXJzO1xuICAgICAgZm9yIChpID0gMCwgbGVuID0gcmVmMS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBmaWx0ZXIgPSByZWYxW2ldO1xuICAgICAgICBmaWx0ZXJhcmdzID0gW107XG4gICAgICAgIHJlZjIgPSBmaWx0ZXJbMV07XG4gICAgICAgIGZvciAoaiA9IDAsIGxlbjEgPSByZWYyLmxlbmd0aDsgaiA8IGxlbjE7IGorKykge1xuICAgICAgICAgIGEgPSByZWYyW2pdO1xuICAgICAgICAgIGZpbHRlcmFyZ3MucHVzaChjb250ZXh0LmdldChhKSk7XG4gICAgICAgIH1cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBvdXRwdXQgPSBjb250ZXh0Lmludm9rZS5hcHBseShjb250ZXh0LCBbZmlsdGVyWzBdLCBvdXRwdXRdLmNvbmNhdChzbGljZS5jYWxsKGZpbHRlcmFyZ3MpKSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgZSA9IGVycm9yO1xuICAgICAgICAgIHRocm93IG5ldyBMaXF1aWQuRmlsdGVyTm90Rm91bmQoXCJFcnJvciAtIGZpbHRlciAnXCIgKyBmaWx0ZXJbMF0gKyBcIicgaW4gJ1wiICsgKHRoaXMubWFya3VwLnRyaW0oKSkgKyBcIicgY291bGQgbm90IGJlIGZvdW5kLlwiKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9O1xuXG4gICAgcmV0dXJuIFZhcmlhYmxlO1xuXG4gIH0pKCk7XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuMTEuMVxuKGZ1bmN0aW9uKCkge1xuICB2YXIgTGlxdWlkO1xuXG4gIExpcXVpZCA9IHJlcXVpcmUoJy4uL2xpcXVpZCcpO1xuXG4gIExpcXVpZC5WRVJTSU9OID0gcmVxdWlyZSgnLi4vLi4vcGFja2FnZS5qc29uJykudmVyc2lvbjtcblxufSkuY2FsbCh0aGlzKTtcbiIsIi8vXG4vLyBzdHJmdGltZVxuLy8gZ2l0aHViLmNvbS9zYW1zb25qcy9zdHJmdGltZVxuLy8gQF9zanNcbi8vXG4vLyBDb3B5cmlnaHQgMjAxMCAtIDIwMTMgU2FtaSBTYW1odXJpIDxzYW1pQHNhbWh1cmkubmV0PlxuLy9cbi8vIE1JVCBMaWNlbnNlXG4vLyBodHRwOi8vc2pzLm1pdC1saWNlbnNlLm9yZ1xuLy9cblxuOyhmdW5jdGlvbigpIHtcblxuICAvLy8vIFdoZXJlIHRvIGV4cG9ydCB0aGUgQVBJXG4gIHZhciBuYW1lc3BhY2U7XG5cbiAgLy8gQ29tbW9uSlMgLyBOb2RlIG1vZHVsZVxuICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBuYW1lc3BhY2UgPSBtb2R1bGUuZXhwb3J0cyA9IHN0cmZ0aW1lO1xuICB9XG5cbiAgLy8gQnJvd3NlcnMgYW5kIG90aGVyIGVudmlyb25tZW50c1xuICBlbHNlIHtcbiAgICAvLyBHZXQgdGhlIGdsb2JhbCBvYmplY3QuIFdvcmtzIGluIEVTMywgRVM1LCBhbmQgRVM1IHN0cmljdCBtb2RlLlxuICAgIG5hbWVzcGFjZSA9IChmdW5jdGlvbigpeyByZXR1cm4gdGhpcyB8fCAoMSxldmFsKSgndGhpcycpIH0oKSk7XG4gIH1cblxuICBmdW5jdGlvbiB3b3JkcyhzKSB7IHJldHVybiAocyB8fCAnJykuc3BsaXQoJyAnKTsgfVxuXG4gIHZhciBEZWZhdWx0TG9jYWxlID1cbiAgeyBkYXlzOiB3b3JkcygnU3VuZGF5IE1vbmRheSBUdWVzZGF5IFdlZG5lc2RheSBUaHVyc2RheSBGcmlkYXkgU2F0dXJkYXknKVxuICAsIHNob3J0RGF5czogd29yZHMoJ1N1biBNb24gVHVlIFdlZCBUaHUgRnJpIFNhdCcpXG4gICwgbW9udGhzOiB3b3JkcygnSmFudWFyeSBGZWJydWFyeSBNYXJjaCBBcHJpbCBNYXkgSnVuZSBKdWx5IEF1Z3VzdCBTZXB0ZW1iZXIgT2N0b2JlciBOb3ZlbWJlciBEZWNlbWJlcicpXG4gICwgc2hvcnRNb250aHM6IHdvcmRzKCdKYW4gRmViIE1hciBBcHIgTWF5IEp1biBKdWwgQXVnIFNlcCBPY3QgTm92IERlYycpXG4gICwgQU06ICdBTSdcbiAgLCBQTTogJ1BNJ1xuICAsIGFtOiAnYW0nXG4gICwgcG06ICdwbSdcbiAgfTtcblxuICBuYW1lc3BhY2Uuc3RyZnRpbWUgPSBzdHJmdGltZTtcbiAgZnVuY3Rpb24gc3RyZnRpbWUoZm10LCBkLCBsb2NhbGUpIHtcbiAgICByZXR1cm4gX3N0cmZ0aW1lKGZtdCwgZCwgbG9jYWxlKTtcbiAgfVxuXG4gIC8vIGxvY2FsZSBpcyBvcHRpb25hbFxuICBuYW1lc3BhY2Uuc3RyZnRpbWVUWiA9IHN0cmZ0aW1lLnN0cmZ0aW1lVFogPSBzdHJmdGltZVRaO1xuICBmdW5jdGlvbiBzdHJmdGltZVRaKGZtdCwgZCwgbG9jYWxlLCB0aW1lem9uZSkge1xuICAgIGlmICh0eXBlb2YgbG9jYWxlID09ICdudW1iZXInICYmIHRpbWV6b25lID09IG51bGwpIHtcbiAgICAgIHRpbWV6b25lID0gbG9jYWxlO1xuICAgICAgbG9jYWxlID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gX3N0cmZ0aW1lKGZtdCwgZCwgbG9jYWxlLCB7IHRpbWV6b25lOiB0aW1lem9uZSB9KTtcbiAgfVxuXG4gIG5hbWVzcGFjZS5zdHJmdGltZVVUQyA9IHN0cmZ0aW1lLnN0cmZ0aW1lVVRDID0gc3RyZnRpbWVVVEM7XG4gIGZ1bmN0aW9uIHN0cmZ0aW1lVVRDKGZtdCwgZCwgbG9jYWxlKSB7XG4gICAgcmV0dXJuIF9zdHJmdGltZShmbXQsIGQsIGxvY2FsZSwgeyB1dGM6IHRydWUgfSk7XG4gIH1cblxuICBuYW1lc3BhY2UubG9jYWxpemVkU3RyZnRpbWUgPSBzdHJmdGltZS5sb2NhbGl6ZWRTdHJmdGltZSA9IGxvY2FsaXplZFN0cmZ0aW1lO1xuICBmdW5jdGlvbiBsb2NhbGl6ZWRTdHJmdGltZShsb2NhbGUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oZm10LCBkLCBvcHRpb25zKSB7XG4gICAgICByZXR1cm4gc3RyZnRpbWUoZm10LCBkLCBsb2NhbGUsIG9wdGlvbnMpO1xuICAgIH07XG4gIH1cblxuICAvLyBkLCBsb2NhbGUsIGFuZCBvcHRpb25zIGFyZSBvcHRpb25hbCwgYnV0IHlvdSBjYW4ndCBsZWF2ZVxuICAvLyBob2xlcyBpbiB0aGUgYXJndW1lbnQgbGlzdC4gSWYgeW91IHBhc3Mgb3B0aW9ucyB5b3UgaGF2ZSB0byBwYXNzXG4gIC8vIGluIGFsbCB0aGUgcHJlY2VkaW5nIGFyZ3MgYXMgd2VsbC5cbiAgLy9cbiAgLy8gb3B0aW9uczpcbiAgLy8gICAtIGxvY2FsZSAgIFtvYmplY3RdIGFuIG9iamVjdCB3aXRoIHRoZSBzYW1lIHN0cnVjdHVyZSBhcyBEZWZhdWx0TG9jYWxlXG4gIC8vICAgLSB0aW1lem9uZSBbbnVtYmVyXSB0aW1lem9uZSBvZmZzZXQgaW4gbWludXRlcyBmcm9tIEdNVFxuICBmdW5jdGlvbiBfc3RyZnRpbWUoZm10LCBkLCBsb2NhbGUsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIC8vIGQgYW5kIGxvY2FsZSBhcmUgb3B0aW9uYWwgc28gY2hlY2sgaWYgZCBpcyByZWFsbHkgdGhlIGxvY2FsZVxuICAgIGlmIChkICYmICFxdWFja3NMaWtlRGF0ZShkKSkge1xuICAgICAgbG9jYWxlID0gZDtcbiAgICAgIGQgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGQgPSBkIHx8IG5ldyBEYXRlKCk7XG5cbiAgICBsb2NhbGUgPSBsb2NhbGUgfHwgRGVmYXVsdExvY2FsZTtcbiAgICBsb2NhbGUuZm9ybWF0cyA9IGxvY2FsZS5mb3JtYXRzIHx8IHt9O1xuXG4gICAgLy8gSGFuZyBvbiB0byB0aGlzIFVuaXggdGltZXN0YW1wIGJlY2F1c2Ugd2UgbWlnaHQgbWVzcyB3aXRoIGl0IGRpcmVjdGx5IGJlbG93LlxuICAgIHZhciB0aW1lc3RhbXAgPSBkLmdldFRpbWUoKTtcblxuICAgIGlmIChvcHRpb25zLnV0YyB8fCB0eXBlb2Ygb3B0aW9ucy50aW1lem9uZSA9PSAnbnVtYmVyJykge1xuICAgICAgZCA9IGRhdGVUb1VUQyhkKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG9wdGlvbnMudGltZXpvbmUgPT0gJ251bWJlcicpIHtcbiAgICAgIGQgPSBuZXcgRGF0ZShkLmdldFRpbWUoKSArIChvcHRpb25zLnRpbWV6b25lICogNjAwMDApKTtcbiAgICB9XG5cbiAgICAvLyBNb3N0IG9mIHRoZSBzcGVjaWZpZXJzIHN1cHBvcnRlZCBieSBDJ3Mgc3RyZnRpbWUsIGFuZCBzb21lIGZyb20gUnVieS5cbiAgICAvLyBTb21lIG90aGVyIHN5bnRheCBleHRlbnNpb25zIGZyb20gUnVieSBhcmUgc3VwcG9ydGVkOiAlLSwgJV8sIGFuZCAlMFxuICAgIC8vIHRvIHBhZCB3aXRoIG5vdGhpbmcsIHNwYWNlLCBvciB6ZXJvIChyZXNwZWN0aXZlbHkpLlxuICAgIHJldHVybiBmbXQucmVwbGFjZSgvJShbLV8wXT8uKS9nLCBmdW5jdGlvbihfLCBjKSB7XG4gICAgICB2YXIgbW9kLCBwYWRkaW5nO1xuICAgICAgaWYgKGMubGVuZ3RoID09IDIpIHtcbiAgICAgICAgbW9kID0gY1swXTtcbiAgICAgICAgLy8gb21pdCBwYWRkaW5nXG4gICAgICAgIGlmIChtb2QgPT0gJy0nKSB7XG4gICAgICAgICAgcGFkZGluZyA9ICcnO1xuICAgICAgICB9XG4gICAgICAgIC8vIHBhZCB3aXRoIHNwYWNlXG4gICAgICAgIGVsc2UgaWYgKG1vZCA9PSAnXycpIHtcbiAgICAgICAgICBwYWRkaW5nID0gJyAnO1xuICAgICAgICB9XG4gICAgICAgIC8vIHBhZCB3aXRoIHplcm9cbiAgICAgICAgZWxzZSBpZiAobW9kID09ICcwJykge1xuICAgICAgICAgIHBhZGRpbmcgPSAnMCc7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgLy8gdW5yZWNvZ25pemVkLCByZXR1cm4gdGhlIGZvcm1hdFxuICAgICAgICAgIHJldHVybiBfO1xuICAgICAgICB9XG4gICAgICAgIGMgPSBjWzFdO1xuICAgICAgfVxuICAgICAgc3dpdGNoIChjKSB7XG4gICAgICAgIGNhc2UgJ0EnOiByZXR1cm4gbG9jYWxlLmRheXNbZC5nZXREYXkoKV07XG4gICAgICAgIGNhc2UgJ2EnOiByZXR1cm4gbG9jYWxlLnNob3J0RGF5c1tkLmdldERheSgpXTtcbiAgICAgICAgY2FzZSAnQic6IHJldHVybiBsb2NhbGUubW9udGhzW2QuZ2V0TW9udGgoKV07XG4gICAgICAgIGNhc2UgJ2InOiByZXR1cm4gbG9jYWxlLnNob3J0TW9udGhzW2QuZ2V0TW9udGgoKV07XG4gICAgICAgIGNhc2UgJ0MnOiByZXR1cm4gcGFkKE1hdGguZmxvb3IoZC5nZXRGdWxsWWVhcigpIC8gMTAwKSwgcGFkZGluZyk7XG4gICAgICAgIGNhc2UgJ0QnOiByZXR1cm4gX3N0cmZ0aW1lKGxvY2FsZS5mb3JtYXRzLkQgfHwgJyVtLyVkLyV5JywgZCwgbG9jYWxlKTtcbiAgICAgICAgY2FzZSAnZCc6IHJldHVybiBwYWQoZC5nZXREYXRlKCksIHBhZGRpbmcpO1xuICAgICAgICBjYXNlICdlJzogcmV0dXJuIGQuZ2V0RGF0ZSgpO1xuICAgICAgICBjYXNlICdGJzogcmV0dXJuIF9zdHJmdGltZShsb2NhbGUuZm9ybWF0cy5GIHx8ICclWS0lbS0lZCcsIGQsIGxvY2FsZSk7XG4gICAgICAgIGNhc2UgJ0gnOiByZXR1cm4gcGFkKGQuZ2V0SG91cnMoKSwgcGFkZGluZyk7XG4gICAgICAgIGNhc2UgJ2gnOiByZXR1cm4gbG9jYWxlLnNob3J0TW9udGhzW2QuZ2V0TW9udGgoKV07XG4gICAgICAgIGNhc2UgJ0knOiByZXR1cm4gcGFkKGhvdXJzMTIoZCksIHBhZGRpbmcpO1xuICAgICAgICBjYXNlICdqJzpcbiAgICAgICAgICB2YXIgeSA9IG5ldyBEYXRlKGQuZ2V0RnVsbFllYXIoKSwgMCwgMSk7XG4gICAgICAgICAgdmFyIGRheSA9IE1hdGguY2VpbCgoZC5nZXRUaW1lKCkgLSB5LmdldFRpbWUoKSkgLyAoMTAwMCAqIDYwICogNjAgKiAyNCkpO1xuICAgICAgICAgIHJldHVybiBwYWQoZGF5LCAzKTtcbiAgICAgICAgY2FzZSAnayc6IHJldHVybiBwYWQoZC5nZXRIb3VycygpLCBwYWRkaW5nID09IG51bGwgPyAnICcgOiBwYWRkaW5nKTtcbiAgICAgICAgY2FzZSAnTCc6IHJldHVybiBwYWQoTWF0aC5mbG9vcih0aW1lc3RhbXAgJSAxMDAwKSwgMyk7XG4gICAgICAgIGNhc2UgJ2wnOiByZXR1cm4gcGFkKGhvdXJzMTIoZCksIHBhZGRpbmcgPT0gbnVsbCA/ICcgJyA6IHBhZGRpbmcpO1xuICAgICAgICBjYXNlICdNJzogcmV0dXJuIHBhZChkLmdldE1pbnV0ZXMoKSwgcGFkZGluZyk7XG4gICAgICAgIGNhc2UgJ20nOiByZXR1cm4gcGFkKGQuZ2V0TW9udGgoKSArIDEsIHBhZGRpbmcpO1xuICAgICAgICBjYXNlICduJzogcmV0dXJuICdcXG4nO1xuICAgICAgICBjYXNlICdvJzogcmV0dXJuIFN0cmluZyhkLmdldERhdGUoKSkgKyBvcmRpbmFsKGQuZ2V0RGF0ZSgpKTtcbiAgICAgICAgY2FzZSAnUCc6IHJldHVybiBkLmdldEhvdXJzKCkgPCAxMiA/IGxvY2FsZS5hbSA6IGxvY2FsZS5wbTtcbiAgICAgICAgY2FzZSAncCc6IHJldHVybiBkLmdldEhvdXJzKCkgPCAxMiA/IGxvY2FsZS5BTSA6IGxvY2FsZS5QTTtcbiAgICAgICAgY2FzZSAnUic6IHJldHVybiBfc3RyZnRpbWUobG9jYWxlLmZvcm1hdHMuUiB8fCAnJUg6JU0nLCBkLCBsb2NhbGUpO1xuICAgICAgICBjYXNlICdyJzogcmV0dXJuIF9zdHJmdGltZShsb2NhbGUuZm9ybWF0cy5yIHx8ICclSTolTTolUyAlcCcsIGQsIGxvY2FsZSk7XG4gICAgICAgIGNhc2UgJ1MnOiByZXR1cm4gcGFkKGQuZ2V0U2Vjb25kcygpLCBwYWRkaW5nKTtcbiAgICAgICAgY2FzZSAncyc6IHJldHVybiBNYXRoLmZsb29yKHRpbWVzdGFtcCAvIDEwMDApO1xuICAgICAgICBjYXNlICdUJzogcmV0dXJuIF9zdHJmdGltZShsb2NhbGUuZm9ybWF0cy5UIHx8ICclSDolTTolUycsIGQsIGxvY2FsZSk7XG4gICAgICAgIGNhc2UgJ3QnOiByZXR1cm4gJ1xcdCc7XG4gICAgICAgIGNhc2UgJ1UnOiByZXR1cm4gcGFkKHdlZWtOdW1iZXIoZCwgJ3N1bmRheScpLCBwYWRkaW5nKTtcbiAgICAgICAgY2FzZSAndSc6XG4gICAgICAgICAgdmFyIGRheSA9IGQuZ2V0RGF5KCk7XG4gICAgICAgICAgcmV0dXJuIGRheSA9PSAwID8gNyA6IGRheTsgLy8gMSAtIDcsIE1vbmRheSBpcyBmaXJzdCBkYXkgb2YgdGhlIHdlZWtcbiAgICAgICAgY2FzZSAndic6IHJldHVybiBfc3RyZnRpbWUobG9jYWxlLmZvcm1hdHMudiB8fCAnJWUtJWItJVknLCBkLCBsb2NhbGUpO1xuICAgICAgICBjYXNlICdXJzogcmV0dXJuIHBhZCh3ZWVrTnVtYmVyKGQsICdtb25kYXknKSwgcGFkZGluZyk7XG4gICAgICAgIGNhc2UgJ3cnOiByZXR1cm4gZC5nZXREYXkoKTsgLy8gMCAtIDYsIFN1bmRheSBpcyBmaXJzdCBkYXkgb2YgdGhlIHdlZWtcbiAgICAgICAgY2FzZSAnWSc6IHJldHVybiBkLmdldEZ1bGxZZWFyKCk7XG4gICAgICAgIGNhc2UgJ3knOlxuICAgICAgICAgIHZhciB5ID0gU3RyaW5nKGQuZ2V0RnVsbFllYXIoKSk7XG4gICAgICAgICAgcmV0dXJuIHkuc2xpY2UoeS5sZW5ndGggLSAyKTtcbiAgICAgICAgY2FzZSAnWic6XG4gICAgICAgICAgaWYgKG9wdGlvbnMudXRjKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJHTVRcIjtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgdHogPSBkLnRvU3RyaW5nKCkubWF0Y2goL1xcKChcXHcrKVxcKS8pO1xuICAgICAgICAgICAgcmV0dXJuIHR6ICYmIHR6WzFdIHx8ICcnO1xuICAgICAgICAgIH1cbiAgICAgICAgY2FzZSAneic6XG4gICAgICAgICAgaWYgKG9wdGlvbnMudXRjKSB7XG4gICAgICAgICAgICByZXR1cm4gXCIrMDAwMFwiO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBvZmYgPSB0eXBlb2Ygb3B0aW9ucy50aW1lem9uZSA9PSAnbnVtYmVyJyA/IG9wdGlvbnMudGltZXpvbmUgOiAtZC5nZXRUaW1lem9uZU9mZnNldCgpO1xuICAgICAgICAgICAgcmV0dXJuIChvZmYgPCAwID8gJy0nIDogJysnKSArIHBhZChNYXRoLmFicyhvZmYgLyA2MCkpICsgcGFkKG9mZiAlIDYwKTtcbiAgICAgICAgICB9XG4gICAgICAgIGRlZmF1bHQ6IHJldHVybiBjO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gZGF0ZVRvVVRDKGQpIHtcbiAgICB2YXIgbXNEZWx0YSA9IChkLmdldFRpbWV6b25lT2Zmc2V0KCkgfHwgMCkgKiA2MDAwMDtcbiAgICByZXR1cm4gbmV3IERhdGUoZC5nZXRUaW1lKCkgKyBtc0RlbHRhKTtcbiAgfVxuXG4gIHZhciBSZXF1aXJlZERhdGVNZXRob2RzID0gWydnZXRUaW1lJywgJ2dldFRpbWV6b25lT2Zmc2V0JywgJ2dldERheScsICdnZXREYXRlJywgJ2dldE1vbnRoJywgJ2dldEZ1bGxZZWFyJywgJ2dldFllYXInLCAnZ2V0SG91cnMnLCAnZ2V0TWludXRlcycsICdnZXRTZWNvbmRzJ107XG4gIGZ1bmN0aW9uIHF1YWNrc0xpa2VEYXRlKHgpIHtcbiAgICB2YXIgaSA9IDBcbiAgICAgICwgbiA9IFJlcXVpcmVkRGF0ZU1ldGhvZHMubGVuZ3RoXG4gICAgICA7XG4gICAgZm9yIChpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgaWYgKHR5cGVvZiB4W1JlcXVpcmVkRGF0ZU1ldGhvZHNbaV1dICE9ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8vIERlZmF1bHQgcGFkZGluZyBpcyAnMCcgYW5kIGRlZmF1bHQgbGVuZ3RoIGlzIDIsIGJvdGggYXJlIG9wdGlvbmFsLlxuICBmdW5jdGlvbiBwYWQobiwgcGFkZGluZywgbGVuZ3RoKSB7XG4gICAgLy8gcGFkKG4sIDxsZW5ndGg+KVxuICAgIGlmICh0eXBlb2YgcGFkZGluZyA9PT0gJ251bWJlcicpIHtcbiAgICAgIGxlbmd0aCA9IHBhZGRpbmc7XG4gICAgICBwYWRkaW5nID0gJzAnO1xuICAgIH1cblxuICAgIC8vIERlZmF1bHRzIGhhbmRsZSBwYWQobikgYW5kIHBhZChuLCA8cGFkZGluZz4pXG4gICAgaWYgKHBhZGRpbmcgPT0gbnVsbCkge1xuICAgICAgcGFkZGluZyA9ICcwJztcbiAgICB9XG4gICAgbGVuZ3RoID0gbGVuZ3RoIHx8IDI7XG5cbiAgICB2YXIgcyA9IFN0cmluZyhuKTtcbiAgICAvLyBwYWRkaW5nIG1heSBiZSBhbiBlbXB0eSBzdHJpbmcsIGRvbid0IGxvb3AgZm9yZXZlciBpZiBpdCBpc1xuICAgIGlmIChwYWRkaW5nKSB7XG4gICAgICB3aGlsZSAocy5sZW5ndGggPCBsZW5ndGgpIHMgPSBwYWRkaW5nICsgcztcbiAgICB9XG4gICAgcmV0dXJuIHM7XG4gIH1cblxuICBmdW5jdGlvbiBob3VyczEyKGQpIHtcbiAgICB2YXIgaG91ciA9IGQuZ2V0SG91cnMoKTtcbiAgICBpZiAoaG91ciA9PSAwKSBob3VyID0gMTI7XG4gICAgZWxzZSBpZiAoaG91ciA+IDEyKSBob3VyIC09IDEyO1xuICAgIHJldHVybiBob3VyO1xuICB9XG5cbiAgLy8gR2V0IHRoZSBvcmRpbmFsIHN1ZmZpeCBmb3IgYSBudW1iZXI6IHN0LCBuZCwgcmQsIG9yIHRoXG4gIGZ1bmN0aW9uIG9yZGluYWwobikge1xuICAgIHZhciBpID0gbiAlIDEwXG4gICAgICAsIGlpID0gbiAlIDEwMFxuICAgICAgO1xuICAgIGlmICgoaWkgPj0gMTEgJiYgaWkgPD0gMTMpIHx8IGkgPT09IDAgfHwgaSA+PSA0KSB7XG4gICAgICByZXR1cm4gJ3RoJztcbiAgICB9XG4gICAgc3dpdGNoIChpKSB7XG4gICAgICBjYXNlIDE6IHJldHVybiAnc3QnO1xuICAgICAgY2FzZSAyOiByZXR1cm4gJ25kJztcbiAgICAgIGNhc2UgMzogcmV0dXJuICdyZCc7XG4gICAgfVxuICB9XG5cbiAgLy8gZmlyc3RXZWVrZGF5OiAnc3VuZGF5JyBvciAnbW9uZGF5JywgZGVmYXVsdCBpcyAnc3VuZGF5J1xuICAvL1xuICAvLyBQaWxmZXJlZCAmIHBvcnRlZCBmcm9tIFJ1YnkncyBzdHJmdGltZSBpbXBsZW1lbnRhdGlvbi5cbiAgZnVuY3Rpb24gd2Vla051bWJlcihkLCBmaXJzdFdlZWtkYXkpIHtcbiAgICBmaXJzdFdlZWtkYXkgPSBmaXJzdFdlZWtkYXkgfHwgJ3N1bmRheSc7XG5cbiAgICAvLyBUaGlzIHdvcmtzIGJ5IHNoaWZ0aW5nIHRoZSB3ZWVrZGF5IGJhY2sgYnkgb25lIGRheSBpZiB3ZVxuICAgIC8vIGFyZSB0cmVhdGluZyBNb25kYXkgYXMgdGhlIGZpcnN0IGRheSBvZiB0aGUgd2Vlay5cbiAgICB2YXIgd2RheSA9IGQuZ2V0RGF5KCk7XG4gICAgaWYgKGZpcnN0V2Vla2RheSA9PSAnbW9uZGF5Jykge1xuICAgICAgaWYgKHdkYXkgPT0gMCkgLy8gU3VuZGF5XG4gICAgICAgIHdkYXkgPSA2O1xuICAgICAgZWxzZVxuICAgICAgICB3ZGF5LS07XG4gICAgfVxuICAgIHZhciBmaXJzdERheU9mWWVhciA9IG5ldyBEYXRlKGQuZ2V0RnVsbFllYXIoKSwgMCwgMSlcbiAgICAgICwgeWRheSA9IChkIC0gZmlyc3REYXlPZlllYXIpIC8gODY0MDAwMDBcbiAgICAgICwgd2Vla051bSA9ICh5ZGF5ICsgNyAtIHdkYXkpIC8gN1xuICAgICAgO1xuICAgIHJldHVybiBNYXRoLmZsb29yKHdlZWtOdW0pO1xuICB9XG5cbn0oKSk7XG4iLCJtb2R1bGUuZXhwb3J0cz17XG4gIFwibmFtZVwiOiBcImxpcXVpZC5jb2ZmZWVcIixcbiAgXCJ2ZXJzaW9uXCI6IFwiMC4xLjZcIixcbiAgXCJkZXNjcmlwdGlvblwiOiBcIlBvcnQgb2YgTGlxdWlkIHRvIENvZmZlZVNjcmlwdFwiLFxuICBcImtleXdvcmRzXCI6IFtcbiAgICBcIkxpcXVpZFwiLFxuICAgIFwidGVtcGxhdGVzXCIsXG4gICAgXCJjb2ZmZWUtc2NyaXB0XCJcbiAgXSxcbiAgXCJhdXRob3JcIjogXCJicnVjZSBkYXZpZHNvbiA8YnJ1Y2VkYXZpZHNvbkBkYXJrb3ZlcmxvcmRvZmRhdGEuY29tPlwiLFxuICBcImNvbnRyaWJ1dG9yc1wiOiBbXG4gICAge1xuICAgICAgXCJuYW1lXCI6IFwiYnJ1Y2UgZGF2aWRzb25cIixcbiAgICAgIFwiZW1haWxcIjogXCJicnVjZWRhdmlkc29uQGRhcmtvdmVybG9yZG9mZGF0YS5jb21cIlxuICAgIH1cbiAgXSxcbiAgXCJkZXBlbmRlbmNpZXNcIjoge1xuICAgIFwic3RyZnRpbWVcIjogXCJ+MC43LjBcIlxuICB9LFxuICBcInNjcmlwdHNcIjoge1xuICAgIFwiY2xlYW5cIjogXCJyaW1yYWYgZGlzdC8qXCIsXG4gICAgXCJidWlsZFwiOiBcImNha2UgYnVpbGRcIixcbiAgICBcInByZWJ1aWxkXCI6IFwibnBtIHJ1biBjbGVhblwiLFxuICAgIFwidGVzdFwiOiBcIk5PREVfRU5WPXRlc3QgbW9jaGEgLS1jb21waWxlcnMgY29mZmVlOmNvZmZlZS1zY3JpcHQgLS1yZXF1aXJlIHRlc3QvdGVzdF9oZWxwZXIuanMgLS1yZWN1cnNpdmVcIlxuICB9LFxuICBcImJpblwiOiB7fSxcbiAgXCJkZXZEZXBlbmRlbmNpZXNcIjoge1xuICAgIFwiYXN5bmNcIjogXCIqXCIsXG4gICAgXCJjaGFpXCI6IFwiKlwiLFxuICAgIFwiY29mZmVlLXNjcmlwdFwiOiBcIipcIixcbiAgICBcImd1bHBcIjogXCJeMy45LjBcIixcbiAgICBcImd1bHAtc2hlbGxcIjogXCJeMC40LjJcIixcbiAgICBcIm1vY2hhXCI6IFwiKlwiLFxuICAgIFwicVwiOiBcIn4xLjEuMVwiLFxuICAgIFwicmltcmFmXCI6IFwiXjIuNC4yXCJcbiAgfSxcbiAgXCJkaXJlY3Rvcmllc1wiOiB7XG4gICAgXCJsaWJcIjogXCIuL2xpYlwiLFxuICAgIFwiZXhhbXBsZVwiOiBcIi4vZXhhbXBsZVwiXG4gIH0sXG4gIFwicmVwb3NpdG9yeVwiOiBcImdpdDovL2dpdGh1Yi5jb20vZGFya292ZXJsb3Jkb2ZkYXRhL2xpcXVpZC5jb2ZmZWVcIixcbiAgXCJtYWluXCI6IFwiaW5kZXhcIixcbiAgXCJlbmdpbmVzXCI6IHtcbiAgICBcIm5vZGVcIjogXCI+PTAuMTAueFwiLFxuICAgIFwibnBtXCI6IFwiPj0xLngueFwiXG4gIH0sXG4gIFwibGljZW5zZVwiOiBcIk1JVFwiXG59XG4iXX0=
