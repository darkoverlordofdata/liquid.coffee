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

    Liquid.Liquid = Liquid;

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
  "version": "0.1.7",
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy5ucG0tZ2xvYmFsL2xpYi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiLi4vLi4vLm5wbS1nbG9iYWwvbGliL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L2xpYi9fZW1wdHkuanMiLCIuLi8uLi8ubnBtLWdsb2JhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3BhdGgtYnJvd3NlcmlmeS9pbmRleC5qcyIsIi4uLy4uLy5ucG0tZ2xvYmFsL2xpYi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibGliL2V4dHJhcy9saXF1aWRWaWV3LmpzIiwibGliL2xpcXVpZC5qcyIsImxpYi9saXF1aWQvYmxvY2suanMiLCJsaWIvbGlxdWlkL2NvbmRpdGlvbi5qcyIsImxpYi9saXF1aWQvY29udGV4dC5qcyIsImxpYi9saXF1aWQvZG9jdW1lbnQuanMiLCJsaWIvbGlxdWlkL2Ryb3AuanMiLCJsaWIvbGlxdWlkL2Vycm9ycy5qcyIsImxpYi9saXF1aWQvZmlsZXN5c3RlbS5qcyIsImxpYi9saXF1aWQvaW50ZXJydXB0cy5qcyIsImxpYi9saXF1aWQvc3RhbmRhcmRmaWx0ZXJzLmpzIiwibGliL2xpcXVpZC9zdHJhaW5lci5qcyIsImxpYi9saXF1aWQvdGFnLmpzIiwibGliL2xpcXVpZC90YWdzL2Fzc2lnbi5qcyIsImxpYi9saXF1aWQvdGFncy9ibG9jay5qcyIsImxpYi9saXF1aWQvdGFncy9icmVhay5qcyIsImxpYi9saXF1aWQvdGFncy9jYXB0dXJlLmpzIiwibGliL2xpcXVpZC90YWdzL2Nhc2UuanMiLCJsaWIvbGlxdWlkL3RhZ3MvY29tbWVudC5qcyIsImxpYi9saXF1aWQvdGFncy9jb250aW51ZS5qcyIsImxpYi9saXF1aWQvdGFncy9jeWNsZS5qcyIsImxpYi9saXF1aWQvdGFncy9kZWNyZW1lbnQuanMiLCJsaWIvbGlxdWlkL3RhZ3MvZXh0ZW5kcy5qcyIsImxpYi9saXF1aWQvdGFncy9mb3IuanMiLCJsaWIvbGlxdWlkL3RhZ3MvaWYuanMiLCJsaWIvbGlxdWlkL3RhZ3MvaWZjaGFuZ2VkLmpzIiwibGliL2xpcXVpZC90YWdzL2luY2x1ZGUuanMiLCJsaWIvbGlxdWlkL3RhZ3MvaW5jcmVtZW50LmpzIiwibGliL2xpcXVpZC90YWdzL3Jhdy5qcyIsImxpYi9saXF1aWQvdGFncy91bmxlc3MuanMiLCJsaWIvbGlxdWlkL3RlbXBsYXRlLmpzIiwibGliL2xpcXVpZC91dGlsLmpzIiwibGliL2xpcXVpZC92YXJpYWJsZS5qcyIsImxpYi9saXF1aWQvdmVyc2lvbi5qcyIsIm5vZGVfbW9kdWxlcy9zdHJmdGltZS9zdHJmdGltZS5qcyIsInBhY2thZ2UuanNvbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOzs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNoT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbi8vIHJlc29sdmVzIC4gYW5kIC4uIGVsZW1lbnRzIGluIGEgcGF0aCBhcnJheSB3aXRoIGRpcmVjdG9yeSBuYW1lcyB0aGVyZVxuLy8gbXVzdCBiZSBubyBzbGFzaGVzLCBlbXB0eSBlbGVtZW50cywgb3IgZGV2aWNlIG5hbWVzIChjOlxcKSBpbiB0aGUgYXJyYXlcbi8vIChzbyBhbHNvIG5vIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHNsYXNoZXMgLSBpdCBkb2VzIG5vdCBkaXN0aW5ndWlzaFxuLy8gcmVsYXRpdmUgYW5kIGFic29sdXRlIHBhdGhzKVxuZnVuY3Rpb24gbm9ybWFsaXplQXJyYXkocGFydHMsIGFsbG93QWJvdmVSb290KSB7XG4gIC8vIGlmIHRoZSBwYXRoIHRyaWVzIHRvIGdvIGFib3ZlIHRoZSByb290LCBgdXBgIGVuZHMgdXAgPiAwXG4gIHZhciB1cCA9IDA7XG4gIGZvciAodmFyIGkgPSBwYXJ0cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIHZhciBsYXN0ID0gcGFydHNbaV07XG4gICAgaWYgKGxhc3QgPT09ICcuJykge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgIH0gZWxzZSBpZiAobGFzdCA9PT0gJy4uJykge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgICAgdXArKztcbiAgICB9IGVsc2UgaWYgKHVwKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgICB1cC0tO1xuICAgIH1cbiAgfVxuXG4gIC8vIGlmIHRoZSBwYXRoIGlzIGFsbG93ZWQgdG8gZ28gYWJvdmUgdGhlIHJvb3QsIHJlc3RvcmUgbGVhZGluZyAuLnNcbiAgaWYgKGFsbG93QWJvdmVSb290KSB7XG4gICAgZm9yICg7IHVwLS07IHVwKSB7XG4gICAgICBwYXJ0cy51bnNoaWZ0KCcuLicpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwYXJ0cztcbn1cblxuLy8gU3BsaXQgYSBmaWxlbmFtZSBpbnRvIFtyb290LCBkaXIsIGJhc2VuYW1lLCBleHRdLCB1bml4IHZlcnNpb25cbi8vICdyb290JyBpcyBqdXN0IGEgc2xhc2gsIG9yIG5vdGhpbmcuXG52YXIgc3BsaXRQYXRoUmUgPVxuICAgIC9eKFxcLz98KShbXFxzXFxTXSo/KSgoPzpcXC57MSwyfXxbXlxcL10rP3wpKFxcLlteLlxcL10qfCkpKD86W1xcL10qKSQvO1xudmFyIHNwbGl0UGF0aCA9IGZ1bmN0aW9uKGZpbGVuYW1lKSB7XG4gIHJldHVybiBzcGxpdFBhdGhSZS5leGVjKGZpbGVuYW1lKS5zbGljZSgxKTtcbn07XG5cbi8vIHBhdGgucmVzb2x2ZShbZnJvbSAuLi5dLCB0bylcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMucmVzb2x2ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcmVzb2x2ZWRQYXRoID0gJycsXG4gICAgICByZXNvbHZlZEFic29sdXRlID0gZmFsc2U7XG5cbiAgZm9yICh2YXIgaSA9IGFyZ3VtZW50cy5sZW5ndGggLSAxOyBpID49IC0xICYmICFyZXNvbHZlZEFic29sdXRlOyBpLS0pIHtcbiAgICB2YXIgcGF0aCA9IChpID49IDApID8gYXJndW1lbnRzW2ldIDogcHJvY2Vzcy5jd2QoKTtcblxuICAgIC8vIFNraXAgZW1wdHkgYW5kIGludmFsaWQgZW50cmllc1xuICAgIGlmICh0eXBlb2YgcGF0aCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyB0byBwYXRoLnJlc29sdmUgbXVzdCBiZSBzdHJpbmdzJyk7XG4gICAgfSBlbHNlIGlmICghcGF0aCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgcmVzb2x2ZWRQYXRoID0gcGF0aCArICcvJyArIHJlc29sdmVkUGF0aDtcbiAgICByZXNvbHZlZEFic29sdXRlID0gcGF0aC5jaGFyQXQoMCkgPT09ICcvJztcbiAgfVxuXG4gIC8vIEF0IHRoaXMgcG9pbnQgdGhlIHBhdGggc2hvdWxkIGJlIHJlc29sdmVkIHRvIGEgZnVsbCBhYnNvbHV0ZSBwYXRoLCBidXRcbiAgLy8gaGFuZGxlIHJlbGF0aXZlIHBhdGhzIHRvIGJlIHNhZmUgKG1pZ2h0IGhhcHBlbiB3aGVuIHByb2Nlc3MuY3dkKCkgZmFpbHMpXG5cbiAgLy8gTm9ybWFsaXplIHRoZSBwYXRoXG4gIHJlc29sdmVkUGF0aCA9IG5vcm1hbGl6ZUFycmF5KGZpbHRlcihyZXNvbHZlZFBhdGguc3BsaXQoJy8nKSwgZnVuY3Rpb24ocCkge1xuICAgIHJldHVybiAhIXA7XG4gIH0pLCAhcmVzb2x2ZWRBYnNvbHV0ZSkuam9pbignLycpO1xuXG4gIHJldHVybiAoKHJlc29sdmVkQWJzb2x1dGUgPyAnLycgOiAnJykgKyByZXNvbHZlZFBhdGgpIHx8ICcuJztcbn07XG5cbi8vIHBhdGgubm9ybWFsaXplKHBhdGgpXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgdmFyIGlzQWJzb2x1dGUgPSBleHBvcnRzLmlzQWJzb2x1dGUocGF0aCksXG4gICAgICB0cmFpbGluZ1NsYXNoID0gc3Vic3RyKHBhdGgsIC0xKSA9PT0gJy8nO1xuXG4gIC8vIE5vcm1hbGl6ZSB0aGUgcGF0aFxuICBwYXRoID0gbm9ybWFsaXplQXJyYXkoZmlsdGVyKHBhdGguc3BsaXQoJy8nKSwgZnVuY3Rpb24ocCkge1xuICAgIHJldHVybiAhIXA7XG4gIH0pLCAhaXNBYnNvbHV0ZSkuam9pbignLycpO1xuXG4gIGlmICghcGF0aCAmJiAhaXNBYnNvbHV0ZSkge1xuICAgIHBhdGggPSAnLic7XG4gIH1cbiAgaWYgKHBhdGggJiYgdHJhaWxpbmdTbGFzaCkge1xuICAgIHBhdGggKz0gJy8nO1xuICB9XG5cbiAgcmV0dXJuIChpc0Fic29sdXRlID8gJy8nIDogJycpICsgcGF0aDtcbn07XG5cbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMuaXNBYnNvbHV0ZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgcmV0dXJuIHBhdGguY2hhckF0KDApID09PSAnLyc7XG59O1xuXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLmpvaW4gPSBmdW5jdGlvbigpIHtcbiAgdmFyIHBhdGhzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcbiAgcmV0dXJuIGV4cG9ydHMubm9ybWFsaXplKGZpbHRlcihwYXRocywgZnVuY3Rpb24ocCwgaW5kZXgpIHtcbiAgICBpZiAodHlwZW9mIHAgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudHMgdG8gcGF0aC5qb2luIG11c3QgYmUgc3RyaW5ncycpO1xuICAgIH1cbiAgICByZXR1cm4gcDtcbiAgfSkuam9pbignLycpKTtcbn07XG5cblxuLy8gcGF0aC5yZWxhdGl2ZShmcm9tLCB0bylcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMucmVsYXRpdmUgPSBmdW5jdGlvbihmcm9tLCB0bykge1xuICBmcm9tID0gZXhwb3J0cy5yZXNvbHZlKGZyb20pLnN1YnN0cigxKTtcbiAgdG8gPSBleHBvcnRzLnJlc29sdmUodG8pLnN1YnN0cigxKTtcblxuICBmdW5jdGlvbiB0cmltKGFycikge1xuICAgIHZhciBzdGFydCA9IDA7XG4gICAgZm9yICg7IHN0YXJ0IDwgYXJyLmxlbmd0aDsgc3RhcnQrKykge1xuICAgICAgaWYgKGFycltzdGFydF0gIT09ICcnKSBicmVhaztcbiAgICB9XG5cbiAgICB2YXIgZW5kID0gYXJyLmxlbmd0aCAtIDE7XG4gICAgZm9yICg7IGVuZCA+PSAwOyBlbmQtLSkge1xuICAgICAgaWYgKGFycltlbmRdICE9PSAnJykgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYgKHN0YXJ0ID4gZW5kKSByZXR1cm4gW107XG4gICAgcmV0dXJuIGFyci5zbGljZShzdGFydCwgZW5kIC0gc3RhcnQgKyAxKTtcbiAgfVxuXG4gIHZhciBmcm9tUGFydHMgPSB0cmltKGZyb20uc3BsaXQoJy8nKSk7XG4gIHZhciB0b1BhcnRzID0gdHJpbSh0by5zcGxpdCgnLycpKTtcblxuICB2YXIgbGVuZ3RoID0gTWF0aC5taW4oZnJvbVBhcnRzLmxlbmd0aCwgdG9QYXJ0cy5sZW5ndGgpO1xuICB2YXIgc2FtZVBhcnRzTGVuZ3RoID0gbGVuZ3RoO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGZyb21QYXJ0c1tpXSAhPT0gdG9QYXJ0c1tpXSkge1xuICAgICAgc2FtZVBhcnRzTGVuZ3RoID0gaTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHZhciBvdXRwdXRQYXJ0cyA9IFtdO1xuICBmb3IgKHZhciBpID0gc2FtZVBhcnRzTGVuZ3RoOyBpIDwgZnJvbVBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgb3V0cHV0UGFydHMucHVzaCgnLi4nKTtcbiAgfVxuXG4gIG91dHB1dFBhcnRzID0gb3V0cHV0UGFydHMuY29uY2F0KHRvUGFydHMuc2xpY2Uoc2FtZVBhcnRzTGVuZ3RoKSk7XG5cbiAgcmV0dXJuIG91dHB1dFBhcnRzLmpvaW4oJy8nKTtcbn07XG5cbmV4cG9ydHMuc2VwID0gJy8nO1xuZXhwb3J0cy5kZWxpbWl0ZXIgPSAnOic7XG5cbmV4cG9ydHMuZGlybmFtZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgdmFyIHJlc3VsdCA9IHNwbGl0UGF0aChwYXRoKSxcbiAgICAgIHJvb3QgPSByZXN1bHRbMF0sXG4gICAgICBkaXIgPSByZXN1bHRbMV07XG5cbiAgaWYgKCFyb290ICYmICFkaXIpIHtcbiAgICAvLyBObyBkaXJuYW1lIHdoYXRzb2V2ZXJcbiAgICByZXR1cm4gJy4nO1xuICB9XG5cbiAgaWYgKGRpcikge1xuICAgIC8vIEl0IGhhcyBhIGRpcm5hbWUsIHN0cmlwIHRyYWlsaW5nIHNsYXNoXG4gICAgZGlyID0gZGlyLnN1YnN0cigwLCBkaXIubGVuZ3RoIC0gMSk7XG4gIH1cblxuICByZXR1cm4gcm9vdCArIGRpcjtcbn07XG5cblxuZXhwb3J0cy5iYXNlbmFtZSA9IGZ1bmN0aW9uKHBhdGgsIGV4dCkge1xuICB2YXIgZiA9IHNwbGl0UGF0aChwYXRoKVsyXTtcbiAgLy8gVE9ETzogbWFrZSB0aGlzIGNvbXBhcmlzb24gY2FzZS1pbnNlbnNpdGl2ZSBvbiB3aW5kb3dzP1xuICBpZiAoZXh0ICYmIGYuc3Vic3RyKC0xICogZXh0Lmxlbmd0aCkgPT09IGV4dCkge1xuICAgIGYgPSBmLnN1YnN0cigwLCBmLmxlbmd0aCAtIGV4dC5sZW5ndGgpO1xuICB9XG4gIHJldHVybiBmO1xufTtcblxuXG5leHBvcnRzLmV4dG5hbWUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHJldHVybiBzcGxpdFBhdGgocGF0aClbM107XG59O1xuXG5mdW5jdGlvbiBmaWx0ZXIgKHhzLCBmKSB7XG4gICAgaWYgKHhzLmZpbHRlcikgcmV0dXJuIHhzLmZpbHRlcihmKTtcbiAgICB2YXIgcmVzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB4cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoZih4c1tpXSwgaSwgeHMpKSByZXMucHVzaCh4c1tpXSk7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG59XG5cbi8vIFN0cmluZy5wcm90b3R5cGUuc3Vic3RyIC0gbmVnYXRpdmUgaW5kZXggZG9uJ3Qgd29yayBpbiBJRThcbnZhciBzdWJzdHIgPSAnYWInLnN1YnN0cigtMSkgPT09ICdiJ1xuICAgID8gZnVuY3Rpb24gKHN0ciwgc3RhcnQsIGxlbikgeyByZXR1cm4gc3RyLnN1YnN0cihzdGFydCwgbGVuKSB9XG4gICAgOiBmdW5jdGlvbiAoc3RyLCBzdGFydCwgbGVuKSB7XG4gICAgICAgIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gc3RyLmxlbmd0aCArIHN0YXJ0O1xuICAgICAgICByZXR1cm4gc3RyLnN1YnN0cihzdGFydCwgbGVuKTtcbiAgICB9XG47XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLy8gY2FjaGVkIGZyb20gd2hhdGV2ZXIgZ2xvYmFsIGlzIHByZXNlbnQgc28gdGhhdCB0ZXN0IHJ1bm5lcnMgdGhhdCBzdHViIGl0XG4vLyBkb24ndCBicmVhayB0aGluZ3MuICBCdXQgd2UgbmVlZCB0byB3cmFwIGl0IGluIGEgdHJ5IGNhdGNoIGluIGNhc2UgaXQgaXNcbi8vIHdyYXBwZWQgaW4gc3RyaWN0IG1vZGUgY29kZSB3aGljaCBkb2Vzbid0IGRlZmluZSBhbnkgZ2xvYmFscy4gIEl0J3MgaW5zaWRlIGFcbi8vIGZ1bmN0aW9uIGJlY2F1c2UgdHJ5L2NhdGNoZXMgZGVvcHRpbWl6ZSBpbiBjZXJ0YWluIGVuZ2luZXMuXG5cbnZhciBjYWNoZWRTZXRUaW1lb3V0O1xudmFyIGNhY2hlZENsZWFyVGltZW91dDtcblxuZnVuY3Rpb24gZGVmYXVsdFNldFRpbW91dCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbmZ1bmN0aW9uIGRlZmF1bHRDbGVhclRpbWVvdXQgKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignY2xlYXJUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG4oZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2V0VGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2xlYXJUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgIH1cbn0gKCkpXG5mdW5jdGlvbiBydW5UaW1lb3V0KGZ1bikge1xuICAgIGlmIChjYWNoZWRTZXRUaW1lb3V0ID09PSBzZXRUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICAvLyBpZiBzZXRUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkU2V0VGltZW91dCA9PT0gZGVmYXVsdFNldFRpbW91dCB8fCAhY2FjaGVkU2V0VGltZW91dCkgJiYgc2V0VGltZW91dCkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dChmdW4sIDApO1xuICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwobnVsbCwgZnVuLCAwKTtcbiAgICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKHRoaXMsIGZ1biwgMCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxufVxuZnVuY3Rpb24gcnVuQ2xlYXJUaW1lb3V0KG1hcmtlcikge1xuICAgIGlmIChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGNsZWFyVGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICAvLyBpZiBjbGVhclRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGRlZmF1bHRDbGVhclRpbWVvdXQgfHwgIWNhY2hlZENsZWFyVGltZW91dCkgJiYgY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCAgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbChudWxsLCBtYXJrZXIpO1xuICAgICAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yLlxuICAgICAgICAgICAgLy8gU29tZSB2ZXJzaW9ucyBvZiBJLkUuIGhhdmUgZGlmZmVyZW50IHJ1bGVzIGZvciBjbGVhclRpbWVvdXQgdnMgc2V0VGltZW91dFxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKHRoaXMsIG1hcmtlcik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG59XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBpZiAoIWRyYWluaW5nIHx8ICFjdXJyZW50UXVldWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBydW5UaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBydW5DbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBydW5UaW1lb3V0KGRyYWluUXVldWUpO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjExLjFcbihmdW5jdGlvbigpIHtcbiAgdmFyIExpcXVpZCwgZnM7XG5cbiAgZnMgPSByZXF1aXJlKCdmcycpO1xuXG4gIExpcXVpZCA9IHJlcXVpcmUoJy4uL2xpcXVpZCcpO1xuXG4gIExpcXVpZC5MaXF1aWRWaWV3ID0gKGZ1bmN0aW9uKCkge1xuICAgIHZhciBjYWNoZTtcblxuICAgIGZ1bmN0aW9uIExpcXVpZFZpZXcoKSB7fVxuXG4gICAgY2FjaGUgPSB7fTtcblxuICAgIExpcXVpZFZpZXcucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKHNvdXJjZSwgZGF0YSkge1xuICAgICAgdmFyIHRlbXBsYXRlO1xuICAgICAgaWYgKGRhdGEgPT0gbnVsbCkge1xuICAgICAgICBkYXRhID0ge307XG4gICAgICB9XG4gICAgICBpZiAoY2FjaGVbc291cmNlXSAhPSBudWxsKSB7XG4gICAgICAgIHRlbXBsYXRlID0gY2FjaGVbc291cmNlXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRlbXBsYXRlID0gTGlxdWlkLlRlbXBsYXRlLnBhcnNlKHNvdXJjZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGVtcGxhdGUucmVuZGVyKGRhdGEpO1xuICAgIH07XG5cbiAgICBMaXF1aWRWaWV3LnByb3RvdHlwZS5yZW5kZXJGaWxlID0gZnVuY3Rpb24oZmlsZVBhdGgsIG9wdGlvbnMsIG5leHQpIHtcbiAgICAgIHJldHVybiBmcy5yZWFkRmlsZShmaWxlUGF0aCwgJ3V0Zi04JywgZnVuY3Rpb24oZXJyLCBjb250ZW50KSB7XG4gICAgICAgIHZhciB0ZW1wbGF0ZTtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJldHVybiBuZXh0KG5ldyBFcnJvcihlcnIpKTtcbiAgICAgICAgfVxuICAgICAgICB0ZW1wbGF0ZSA9IExpcXVpZC5UZW1wbGF0ZS5wYXJzZShjb250ZW50KTtcbiAgICAgICAgcmV0dXJuIG5leHQobnVsbCwgdGVtcGxhdGUucmVuZGVyKG9wdGlvbnMpKTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBMaXF1aWRWaWV3LnByb3RvdHlwZS5fX2V4cHJlc3MgPSBmdW5jdGlvbihmaWxlUGF0aCwgb3B0aW9ucywgbmV4dCkge1xuICAgICAgcmV0dXJuIGZzLnJlYWRGaWxlKGZpbGVQYXRoLCAndXRmLTgnLCBmdW5jdGlvbihlcnIsIGNvbnRlbnQpIHtcbiAgICAgICAgdmFyIHRlbXBsYXRlO1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgcmV0dXJuIG5leHQobmV3IEVycm9yKGVycikpO1xuICAgICAgICB9XG4gICAgICAgIHRlbXBsYXRlID0gTGlxdWlkLlRlbXBsYXRlLnBhcnNlKGNvbnRlbnQpO1xuICAgICAgICByZXR1cm4gbmV4dChudWxsLCB0ZW1wbGF0ZS5yZW5kZXIob3B0aW9ucykpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIHJldHVybiBMaXF1aWRWaWV3O1xuXG4gIH0pKCk7XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuMTEuMVxuXG4vKlxuXG5Db3B5cmlnaHQgKGMpIDIwMTMgLSAyMDE0IEJydWNlIERhdmlkc29uIGRhcmtvdmVybG9yZG9mZGF0YUBnbWFpbC5jb21cbkNvcHlyaWdodCAoYykgMjAwNSwgMjAwNiBUb2JpYXMgTHVldGtlXG5cblBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZ1xuYSBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG5cIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbndpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbmRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0b1xucGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvXG50aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG5cblRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlXG5pbmNsdWRlZCBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCxcbkVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkRcbk5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkVcbkxJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT05cbk9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTlxuV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG4gKi9cblxuKGZ1bmN0aW9uKCkge1xuICB2YXIgTGlxdWlkO1xuXG4gIG1vZHVsZS5leHBvcnRzID0gTGlxdWlkID0gKGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIExpcXVpZCgpIHt9XG5cbiAgICBMaXF1aWQuTGlxdWlkID0gTGlxdWlkO1xuXG4gICAgTGlxdWlkLkZpbHRlclNlcGFyYXRvciA9IC9cXHwvO1xuXG4gICAgTGlxdWlkLkFyZ3VtZW50U2VwYXJhdG9yID0gJywnO1xuXG4gICAgTGlxdWlkLkZpbHRlckFyZ3VtZW50U2VwYXJhdG9yID0gJzonO1xuXG4gICAgTGlxdWlkLlZhcmlhYmxlQXR0cmlidXRlU2VwYXJhdG9yID0gJy4nO1xuXG4gICAgTGlxdWlkLlRhZ1N0YXJ0ID0gL1xce1xcJS87XG5cbiAgICBMaXF1aWQuVGFnRW5kID0gL1xcJVxcfS87XG5cbiAgICBMaXF1aWQuVmFyaWFibGVTaWduYXR1cmUgPSAvXFwoP1tcXHdcXC1cXC5cXFtcXF1dXFwpPy87XG5cbiAgICBMaXF1aWQuVmFyaWFibGVTZWdtZW50ID0gL1tcXHdcXC1dLztcblxuICAgIExpcXVpZC5WYXJpYWJsZVN0YXJ0ID0gL1xce1xcey87XG5cbiAgICBMaXF1aWQuVmFyaWFibGVFbmQgPSAvXFx9XFx9LztcblxuICAgIExpcXVpZC5WYXJpYWJsZUluY29tcGxldGVFbmQgPSAvXFx9XFx9Py87XG5cbiAgICBMaXF1aWQuUXVvdGVkU3RyaW5nID0gL1wiW15cIl0qXCJ8J1teJ10qJy87XG5cbiAgICBMaXF1aWQuUXVvdGVkRnJhZ21lbnQgPSBSZWdFeHAoTGlxdWlkLlF1b3RlZFN0cmluZy5zb3VyY2UgKyBcInwoPzpbXlxcXFxzLFxcXFx8J1xcXCJdfFwiICsgTGlxdWlkLlF1b3RlZFN0cmluZy5zb3VyY2UgKyBcIikrXCIpO1xuXG4gICAgTGlxdWlkLlN0cmljdFF1b3RlZEZyYWdtZW50ID0gL1wiW15cIl0rXCJ8J1teJ10rJ3xbXlxcc3w6LF0rLztcblxuICAgIExpcXVpZC5GaXJzdEZpbHRlckFyZ3VtZW50ID0gUmVnRXhwKExpcXVpZC5GaWx0ZXJBcmd1bWVudFNlcGFyYXRvciArIFwiKD86XCIgKyBMaXF1aWQuU3RyaWN0UXVvdGVkRnJhZ21lbnQuc291cmNlICsgXCIpXCIpO1xuXG4gICAgTGlxdWlkLk90aGVyRmlsdGVyQXJndW1lbnQgPSBSZWdFeHAoTGlxdWlkLkFyZ3VtZW50U2VwYXJhdG9yICsgXCIoPzpcIiArIExpcXVpZC5TdHJpY3RRdW90ZWRGcmFnbWVudC5zb3VyY2UgKyBcIilcIik7XG5cbiAgICBMaXF1aWQuU3BhY2VsZXNzRmlsdGVyID0gUmVnRXhwKFwiXig/OidbXiddKyd8XFxcIlteXFxcIl0rXFxcInxbXidcXFwiXSkqXCIgKyBMaXF1aWQuRmlsdGVyU2VwYXJhdG9yLnNvdXJjZSArIFwiKD86XCIgKyBMaXF1aWQuU3RyaWN0UXVvdGVkRnJhZ21lbnQuc291cmNlICsgXCIpKD86XCIgKyBMaXF1aWQuRmlyc3RGaWx0ZXJBcmd1bWVudC5zb3VyY2UgKyBcIig/OlwiICsgTGlxdWlkLk90aGVyRmlsdGVyQXJndW1lbnQuc291cmNlICsgXCIpKik/XCIpO1xuXG4gICAgTGlxdWlkLkV4cHJlc3Npb24gPSBSZWdFeHAoXCIoPzpcIiArIExpcXVpZC5RdW90ZWRGcmFnbWVudC5zb3VyY2UgKyBcIig/OlwiICsgTGlxdWlkLlNwYWNlbGVzc0ZpbHRlci5zb3VyY2UgKyBcIikqKVwiKTtcblxuICAgIExpcXVpZC5UYWdBdHRyaWJ1dGVzID0gUmVnRXhwKFwiKFxcXFx3KylcXFxccypcXFxcOlxcXFxzKihcIiArIExpcXVpZC5RdW90ZWRGcmFnbWVudC5zb3VyY2UgKyBcIilcIik7XG5cbiAgICBMaXF1aWQuQW55U3RhcnRpbmdUYWcgPSAvXFx7XFx7fFxce1xcJS87XG5cbiAgICBMaXF1aWQuUGFydGlhbFRlbXBsYXRlUGFyc2VyID0gUmVnRXhwKExpcXVpZC5UYWdTdGFydC5zb3VyY2UgKyBcIi4qP1wiICsgTGlxdWlkLlRhZ0VuZC5zb3VyY2UgKyBcInxcIiArIExpcXVpZC5WYXJpYWJsZVN0YXJ0LnNvdXJjZSArIFwiLio/XCIgKyBMaXF1aWQuVmFyaWFibGVJbmNvbXBsZXRlRW5kLnNvdXJjZSk7XG5cbiAgICBMaXF1aWQuVGVtcGxhdGVQYXJzZXIgPSBSZWdFeHAoXCIoXCIgKyBMaXF1aWQuUGFydGlhbFRlbXBsYXRlUGFyc2VyLnNvdXJjZSArIFwifFwiICsgTGlxdWlkLkFueVN0YXJ0aW5nVGFnLnNvdXJjZSArIFwiKVwiKTtcblxuICAgIExpcXVpZC5WYXJpYWJsZVBhcnNlciA9IFJlZ0V4cChcIlxcXFxbW15cXFxcXV0rXFxcXF18XCIgKyBMaXF1aWQuVmFyaWFibGVTZWdtZW50LnNvdXJjZSArIFwiK1xcXFw/P1wiKTtcblxuICAgIExpcXVpZC5MaXRlcmFsU2hvcnRoYW5kID0gL14oPzpcXHtcXHtcXHtcXHM/KSguKj8pKD86XFxzKlxcfVxcfVxcfSkkLztcblxuICAgIExpcXVpZC5zZXRQYXRoID0gZnVuY3Rpb24ocGF0aCkge1xuICAgICAgTGlxdWlkLlRlbXBsYXRlLmZpbGVTeXN0ZW0gPSBuZXcgTGlxdWlkLkxvY2FsRmlsZVN5c3RlbShwYXRoKTtcbiAgICAgIHJldHVybiBMaXF1aWQ7XG4gICAgfTtcblxuICAgIExpcXVpZC5jb21waWxlID0gZnVuY3Rpb24odGVtcGxhdGUsIG9wdGlvbnMpIHtcbiAgICAgIHZhciB0O1xuICAgICAgdCA9IExpcXVpZC5UZW1wbGF0ZS5wYXJzZSh0ZW1wbGF0ZSk7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oY29udGV4dCwgb3B0aW9ucykge1xuICAgICAgICByZXR1cm4gdC5yZW5kZXIoY29udGV4dCk7XG4gICAgICB9O1xuICAgIH07XG5cbiAgICByZXR1cm4gTGlxdWlkO1xuXG4gIH0pKCk7XG5cbiAgcmVxdWlyZSgnLi9saXF1aWQvdmVyc2lvbicpO1xuXG4gIHJlcXVpcmUoJy4vbGlxdWlkL2Ryb3AnKTtcblxuICByZXF1aXJlKCcuL2xpcXVpZC9lcnJvcnMnKTtcblxuICByZXF1aXJlKCcuL2xpcXVpZC9pbnRlcnJ1cHRzJyk7XG5cbiAgcmVxdWlyZSgnLi9saXF1aWQvc3RyYWluZXInKTtcblxuICByZXF1aXJlKCcuL2xpcXVpZC9jb250ZXh0Jyk7XG5cbiAgcmVxdWlyZSgnLi9saXF1aWQvdGFnJyk7XG5cbiAgcmVxdWlyZSgnLi9saXF1aWQvYmxvY2snKTtcblxuICByZXF1aXJlKCcuL2xpcXVpZC9kb2N1bWVudCcpO1xuXG4gIHJlcXVpcmUoJy4vbGlxdWlkL3ZhcmlhYmxlJyk7XG5cbiAgcmVxdWlyZSgnLi9saXF1aWQvZmlsZXN5c3RlbScpO1xuXG4gIHJlcXVpcmUoJy4vbGlxdWlkL3RlbXBsYXRlJyk7XG5cbiAgcmVxdWlyZSgnLi9saXF1aWQvc3RhbmRhcmRmaWx0ZXJzJyk7XG5cbiAgcmVxdWlyZSgnLi9saXF1aWQvY29uZGl0aW9uJyk7XG5cbiAgTGlxdWlkLlRhZ3MgPSAoZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gVGFncygpIHt9XG5cbiAgICByZXR1cm4gVGFncztcblxuICB9KSgpO1xuXG4gIHJlcXVpcmUoJy4vbGlxdWlkL3RhZ3MvYXNzaWduJyk7XG5cbiAgcmVxdWlyZSgnLi9saXF1aWQvdGFncy9ibG9jaycpO1xuXG4gIHJlcXVpcmUoJy4vbGlxdWlkL3RhZ3MvYnJlYWsnKTtcblxuICByZXF1aXJlKCcuL2xpcXVpZC90YWdzL2NhcHR1cmUnKTtcblxuICByZXF1aXJlKCcuL2xpcXVpZC90YWdzL2Nhc2UnKTtcblxuICByZXF1aXJlKCcuL2xpcXVpZC90YWdzL2NvbW1lbnQnKTtcblxuICByZXF1aXJlKCcuL2xpcXVpZC90YWdzL2NvbnRpbnVlJyk7XG5cbiAgcmVxdWlyZSgnLi9saXF1aWQvdGFncy9jeWNsZScpO1xuXG4gIHJlcXVpcmUoJy4vbGlxdWlkL3RhZ3MvZGVjcmVtZW50Jyk7XG5cbiAgcmVxdWlyZSgnLi9saXF1aWQvdGFncy9leHRlbmRzJyk7XG5cbiAgcmVxdWlyZSgnLi9saXF1aWQvdGFncy9mb3InKTtcblxuICByZXF1aXJlKCcuL2xpcXVpZC90YWdzL2lmJyk7XG5cbiAgcmVxdWlyZSgnLi9saXF1aWQvdGFncy9pZmNoYW5nZWQnKTtcblxuICByZXF1aXJlKCcuL2xpcXVpZC90YWdzL2luY2x1ZGUnKTtcblxuICByZXF1aXJlKCcuL2xpcXVpZC90YWdzL2luY3JlbWVudCcpO1xuXG4gIHJlcXVpcmUoJy4vbGlxdWlkL3RhZ3MvcmF3Jyk7XG5cbiAgcmVxdWlyZSgnLi9saXF1aWQvdGFncy91bmxlc3MnKTtcblxuICByZXF1aXJlKCcuL2V4dHJhcy9saXF1aWRWaWV3Jyk7XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuMTEuMVxuKGZ1bmN0aW9uKCkge1xuICB2YXIgTGlxdWlkLFxuICAgIGV4dGVuZCA9IGZ1bmN0aW9uKGNoaWxkLCBwYXJlbnQpIHsgZm9yICh2YXIga2V5IGluIHBhcmVudCkgeyBpZiAoaGFzUHJvcC5jYWxsKHBhcmVudCwga2V5KSkgY2hpbGRba2V5XSA9IHBhcmVudFtrZXldOyB9IGZ1bmN0aW9uIGN0b3IoKSB7IHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDsgfSBjdG9yLnByb3RvdHlwZSA9IHBhcmVudC5wcm90b3R5cGU7IGNoaWxkLnByb3RvdHlwZSA9IG5ldyBjdG9yKCk7IGNoaWxkLl9fc3VwZXJfXyA9IHBhcmVudC5wcm90b3R5cGU7IHJldHVybiBjaGlsZDsgfSxcbiAgICBoYXNQcm9wID0ge30uaGFzT3duUHJvcGVydHk7XG5cbiAgTGlxdWlkID0gcmVxdWlyZSgnLi4vbGlxdWlkJyk7XG5cbiAgTGlxdWlkLkJsb2NrID0gKGZ1bmN0aW9uKHN1cGVyQ2xhc3MpIHtcbiAgICB2YXIgQ29udGVudE9mVmFyaWFibGUsIEZ1bGxUb2tlbiwgSXNUYWcsIElzVmFyaWFibGU7XG5cbiAgICBleHRlbmQoQmxvY2ssIHN1cGVyQ2xhc3MpO1xuXG4gICAgSXNUYWcgPSBSZWdFeHAoXCJeXCIgKyBMaXF1aWQuVGFnU3RhcnQuc291cmNlKTtcblxuICAgIElzVmFyaWFibGUgPSBSZWdFeHAoXCJeXCIgKyBMaXF1aWQuVmFyaWFibGVTdGFydC5zb3VyY2UpO1xuXG4gICAgRnVsbFRva2VuID0gUmVnRXhwKFwiXlwiICsgTGlxdWlkLlRhZ1N0YXJ0LnNvdXJjZSArIFwiXFxcXHMqKFxcXFx3KylcXFxccyooLiopP1wiICsgTGlxdWlkLlRhZ0VuZC5zb3VyY2UgKyBcIiRcIik7XG5cbiAgICBDb250ZW50T2ZWYXJpYWJsZSA9IFJlZ0V4cChcIl5cIiArIExpcXVpZC5WYXJpYWJsZVN0YXJ0LnNvdXJjZSArIFwiKC4qKVwiICsgTGlxdWlkLlZhcmlhYmxlRW5kLnNvdXJjZSArIFwiJFwiKTtcblxuICAgIGZ1bmN0aW9uIEJsb2NrKHRhZ05hbWUsIG1hcmt1cCwgdG9rZW5zKSB7XG4gICAgICB0aGlzLmJsb2NrTmFtZSA9IHRhZ05hbWU7XG4gICAgICB0aGlzLmJsb2NrRGVsaW1pdGVyID0gXCJlbmRcIiArIHRoaXMuYmxvY2tOYW1lO1xuICAgICAgQmxvY2suX19zdXBlcl9fLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgdGFnTmFtZSwgbWFya3VwLCB0b2tlbnMpO1xuICAgIH1cblxuICAgIEJsb2NrLnByb3RvdHlwZS5wYXJzZSA9IGZ1bmN0aW9uKHRva2Vucykge1xuICAgICAgdmFyICQsIHRhZywgdG9rZW47XG4gICAgICB0aGlzLm5vZGVsaXN0IHx8ICh0aGlzLm5vZGVsaXN0ID0gW10pO1xuICAgICAgdGhpcy5ub2RlbGlzdC5sZW5ndGggPSAwO1xuICAgICAgd2hpbGUgKCh0b2tlbiA9IHRva2Vucy5zaGlmdCgpKSAhPSBudWxsKSB7XG4gICAgICAgIGlmIChJc1RhZy50ZXN0KHRva2VuKSkge1xuICAgICAgICAgIGlmICgkID0gdG9rZW4ubWF0Y2goRnVsbFRva2VuKSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuYmxvY2tEZWxpbWl0ZXIgPT09ICRbMV0pIHtcbiAgICAgICAgICAgICAgdGhpcy5lbmRUYWcoKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRhZyA9IExpcXVpZC5UZW1wbGF0ZS50YWdzWyRbMV1dKSB7XG4gICAgICAgICAgICAgIHRoaXMubm9kZWxpc3QucHVzaChuZXcgdGFnKCRbMV0sICRbMl0sIHRva2VucykpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGhpcy51bmtub3duVGFnKCRbMV0sICRbMl0sIHRva2Vucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcihcIlRhZyAnXCIgKyB0b2tlbiArIFwiJyB3YXMgbm90IHByb3Blcmx5IHRlcm1pbmF0ZWQgd2l0aCByZWdleHA6IFwiICsgTGlxdWlkLlRhZ0VuZC5zb3VyY2UgKyBcIiBcIik7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKElzVmFyaWFibGUudGVzdCh0b2tlbikpIHtcbiAgICAgICAgICB0aGlzLm5vZGVsaXN0LnB1c2godGhpcy5jcmVhdGVWYXJpYWJsZSh0b2tlbikpO1xuICAgICAgICB9IGVsc2UgaWYgKHRva2VuID09PSAnJykge1xuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5ub2RlbGlzdC5wdXNoKHRva2VuKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuYXNzZXJ0TWlzc2luZ0RlbGltaXRhdGlvbigpO1xuICAgIH07XG5cbiAgICBCbG9jay5wcm90b3R5cGUuZW5kVGFnID0gZnVuY3Rpb24oKSB7fTtcblxuICAgIEJsb2NrLnByb3RvdHlwZS51bmtub3duVGFnID0gZnVuY3Rpb24odGFnLCBwYXJhbXMsIHRva2Vucykge1xuICAgICAgaWYgKHRhZyA9PT0gXCJlbHNlXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFN5bnRheEVycm9yKHRoaXMuYmxvY2tOYW1lICsgXCIgdGFnIGRvZXMgbm90IGV4cGVjdCBlbHNlIHRhZ1wiKTtcbiAgICAgIH0gZWxzZSBpZiAodGFnID09PSBcImVuZFwiKSB7XG4gICAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcihcIidlbmQnIGlzIG5vdCBhIHZhbGlkIGRlbGltaXRlciBmb3IgXCIgKyB0aGlzLmJsb2NrTmFtZSArIFwiIHRhZ3MuIHVzZSBcIiArIHRoaXMuYmxvY2tEZWxpbWl0ZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IFN5bnRheEVycm9yKFwiVW5rbm93biB0YWcgJ1wiICsgdGFnICsgXCInXCIpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBCbG9jay5wcm90b3R5cGUuY3JlYXRlVmFyaWFibGUgPSBmdW5jdGlvbih0b2tlbikge1xuICAgICAgdmFyIGNvbnRlbnQ7XG4gICAgICBpZiAoY29udGVudCA9IHRva2VuLm1hdGNoKENvbnRlbnRPZlZhcmlhYmxlKSkge1xuICAgICAgICByZXR1cm4gbmV3IExpcXVpZC5WYXJpYWJsZShjb250ZW50WzFdKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBMaXF1aWQuU3ludGF4RXJyb3IoXCJWYXJpYWJsZSAnXCIgKyB0b2tlbiArIFwiJyB3YXMgbm90IHByb3Blcmx5IHRlcm1pbmF0ZWQgd2l0aCByZWdleHA6IFwiICsgTGlxdWlkLlZhcmlhYmxlRW5kLnNvdXJjZSArIFwiIFwiKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgQmxvY2sucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlbmRlckFsbCh0aGlzLm5vZGVsaXN0LCBjb250ZXh0KTtcbiAgICB9O1xuXG4gICAgQmxvY2sucHJvdG90eXBlLnJlbmRlckFsbCA9IGZ1bmN0aW9uKGxpc3QsIGNvbnRleHQpIHtcbiAgICAgIHZhciBlLCBpLCBsZW4sIG91dHB1dCwgdG9rZW47XG4gICAgICBvdXRwdXQgPSBbXTtcbiAgICAgIGZvciAoaSA9IDAsIGxlbiA9IGxpc3QubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgdG9rZW4gPSBsaXN0W2ldO1xuICAgICAgICBpZiAoY29udGV4dC5oYXNJbnRlcnJ1cHQoKSkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaWYgKHRva2VuIGluc3RhbmNlb2YgTGlxdWlkLlRhZ3MuQ29udGludWUgfHwgdG9rZW4gaW5zdGFuY2VvZiBMaXF1aWQuVGFncy5CcmVhaykge1xuICAgICAgICAgICAgY29udGV4dC5wdXNoSW50ZXJydXB0KHRva2VuLmludGVycnVwdCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgb3V0cHV0LnB1c2godG9rZW4ucmVuZGVyICE9IG51bGwgPyB0b2tlbi5yZW5kZXIoY29udGV4dCkgOiB0b2tlbik7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgZSA9IGVycm9yO1xuICAgICAgICAgIGNvbnRleHQuaGFuZGxlRXJyb3IoZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBvdXRwdXQuam9pbignJyk7XG4gICAgfTtcblxuICAgIEJsb2NrLnByb3RvdHlwZS5hc3NlcnRNaXNzaW5nRGVsaW1pdGF0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgICB0aHJvdyBuZXcgTGlxdWlkLlN5bnRheEVycm9yKGJsb2NrX25hbWUgKyBcIiB0YWcgd2FzIG5ldmVyIGNsb3NlZFwiKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIEJsb2NrO1xuXG4gIH0pKExpcXVpZC5UYWcpO1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjExLjFcbihmdW5jdGlvbigpIHtcbiAgdmFyIExpcXVpZCxcbiAgICBleHRlbmQgPSBmdW5jdGlvbihjaGlsZCwgcGFyZW50KSB7IGZvciAodmFyIGtleSBpbiBwYXJlbnQpIHsgaWYgKGhhc1Byb3AuY2FsbChwYXJlbnQsIGtleSkpIGNoaWxkW2tleV0gPSBwYXJlbnRba2V5XTsgfSBmdW5jdGlvbiBjdG9yKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gY2hpbGQ7IH0gY3Rvci5wcm90b3R5cGUgPSBwYXJlbnQucHJvdG90eXBlOyBjaGlsZC5wcm90b3R5cGUgPSBuZXcgY3RvcigpOyBjaGlsZC5fX3N1cGVyX18gPSBwYXJlbnQucHJvdG90eXBlOyByZXR1cm4gY2hpbGQ7IH0sXG4gICAgaGFzUHJvcCA9IHt9Lmhhc093blByb3BlcnR5O1xuXG4gIExpcXVpZCA9IHJlcXVpcmUoJy4uL2xpcXVpZCcpO1xuXG4gIExpcXVpZC5Db25kaXRpb24gPSAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNvbXBhY3Q7XG5cbiAgICBjb21wYWN0ID0gcmVxdWlyZSgnLi91dGlsJykuY29tcGFjdDtcblxuICAgIENvbmRpdGlvbi5vcGVyYXRvcnMgPSB7XG4gICAgICBcIj09XCI6IGZ1bmN0aW9uKGwsIHIpIHtcbiAgICAgICAgcmV0dXJuIGwgPT09IHI7XG4gICAgICB9LFxuICAgICAgXCI9XCI6IGZ1bmN0aW9uKGwsIHIpIHtcbiAgICAgICAgcmV0dXJuIGwgPT09IHI7XG4gICAgICB9LFxuICAgICAgXCIhPVwiOiBmdW5jdGlvbihsLCByKSB7XG4gICAgICAgIHJldHVybiBsICE9PSByO1xuICAgICAgfSxcbiAgICAgIFwiPD5cIjogZnVuY3Rpb24obCwgcikge1xuICAgICAgICByZXR1cm4gbCAhPT0gcjtcbiAgICAgIH0sXG4gICAgICBcIjxcIjogZnVuY3Rpb24obCwgcikge1xuICAgICAgICByZXR1cm4gbCA8IHI7XG4gICAgICB9LFxuICAgICAgXCI+XCI6IGZ1bmN0aW9uKGwsIHIpIHtcbiAgICAgICAgcmV0dXJuIGwgPiByO1xuICAgICAgfSxcbiAgICAgIFwiPD1cIjogZnVuY3Rpb24obCwgcikge1xuICAgICAgICByZXR1cm4gbCA8PSByO1xuICAgICAgfSxcbiAgICAgIFwiPj1cIjogZnVuY3Rpb24obCwgcikge1xuICAgICAgICByZXR1cm4gbCA+PSByO1xuICAgICAgfSxcbiAgICAgIGNvbnRhaW5zOiBmdW5jdGlvbihsLCByKSB7XG4gICAgICAgIHJldHVybiBsLm1hdGNoKHIpO1xuICAgICAgfSxcbiAgICAgIGhhc0tleTogZnVuY3Rpb24obCwgcikge1xuICAgICAgICByZXR1cm4gbFtyXSAhPSBudWxsO1xuICAgICAgfSxcbiAgICAgIGhhc1ZhbHVlOiBmdW5jdGlvbihsLCByKSB7XG4gICAgICAgIHZhciBwO1xuICAgICAgICBmb3IgKHAgaW4gbCkge1xuICAgICAgICAgIGlmIChsW3BdID09PSByKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBDb25kaXRpb24obGVmdDEsIG9wZXJhdG9yLCByaWdodDEpIHtcbiAgICAgIHRoaXMubGVmdCA9IGxlZnQxO1xuICAgICAgdGhpcy5vcGVyYXRvciA9IG9wZXJhdG9yO1xuICAgICAgdGhpcy5yaWdodCA9IHJpZ2h0MTtcbiAgICAgIHRoaXMuY2hpbGRSZWxhdGlvbiA9IG51bGw7XG4gICAgICB0aGlzLmNoaWxkQ29uZGl0aW9uID0gbnVsbDtcbiAgICAgIHRoaXMuYXR0YWNobWVudCA9IG51bGw7XG4gICAgfVxuXG4gICAgQ29uZGl0aW9uLnByb3RvdHlwZS5ldmFsdWF0ZSA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgICAgIHZhciByZXN1bHQ7XG4gICAgICBpZiAoY29udGV4dCA9PSBudWxsKSB7XG4gICAgICAgIGNvbnRleHQgPSBuZXcgTGlxdWlkLkNvbnRleHQ7XG4gICAgICB9XG4gICAgICByZXN1bHQgPSB0aGlzLmludGVycHJldENvbmRpdGlvbih0aGlzLmxlZnQsIHRoaXMucmlnaHQsIHRoaXMub3BlcmF0b3IsIGNvbnRleHQpO1xuICAgICAgc3dpdGNoICh0aGlzLmNoaWxkUmVsYXRpb24pIHtcbiAgICAgICAgY2FzZSBcIm9yXCI6XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdCB8fCB0aGlzLmNoaWxkQ29uZGl0aW9uLmV2YWx1YXRlKGNvbnRleHQpO1xuICAgICAgICBjYXNlIFwiYW5kXCI6XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdCAmJiB0aGlzLmNoaWxkQ29uZGl0aW9uLmV2YWx1YXRlKGNvbnRleHQpO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9XG4gICAgfTtcblxuICAgIENvbmRpdGlvbi5wcm90b3R5cGUub3IgPSBmdW5jdGlvbihjb25kaXRpb24pIHtcbiAgICAgIHRoaXMuY2hpbGRSZWxhdGlvbiA9IFwib3JcIjtcbiAgICAgIHJldHVybiB0aGlzLmNoaWxkQ29uZGl0aW9uID0gY29uZGl0aW9uO1xuICAgIH07XG5cbiAgICBDb25kaXRpb24ucHJvdG90eXBlLmFuZCA9IGZ1bmN0aW9uKGNvbmRpdGlvbikge1xuICAgICAgdGhpcy5jaGlsZFJlbGF0aW9uID0gXCJhbmRcIjtcbiAgICAgIHJldHVybiB0aGlzLmNoaWxkQ29uZGl0aW9uID0gY29uZGl0aW9uO1xuICAgIH07XG5cbiAgICBDb25kaXRpb24ucHJvdG90eXBlLmF0dGFjaCA9IGZ1bmN0aW9uKGF0dGFjaG1lbnQpIHtcbiAgICAgIHJldHVybiB0aGlzLmF0dGFjaG1lbnQgPSBhdHRhY2htZW50O1xuICAgIH07XG5cbiAgICBDb25kaXRpb24ucHJvdG90eXBlW1wiZWxzZVwiXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG5cbiAgICBDb25kaXRpb24ucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gXCIjPENvbmRpdGlvbiBcIiArIChjb21wYWN0KFt0aGlzLmxlZnQsIHRoaXMub3BlcmF0b3IsIHRoaXMucmlnaHRdKS5qb2luKCcgJykpICsgXCI+XCI7XG4gICAgfTtcblxuICAgIENvbmRpdGlvbi5wcm90b3R5cGUuaW50ZXJwcmV0Q29uZGl0aW9uID0gZnVuY3Rpb24obGVmdCwgcmlnaHQsIG9wLCBjb250ZXh0KSB7XG4gICAgICB2YXIgb3BlcmF0aW9uO1xuICAgICAgaWYgKG9wID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIGNvbnRleHQuZ2V0KGxlZnQpO1xuICAgICAgfVxuICAgICAgbGVmdCA9IGNvbnRleHQuZ2V0KGxlZnQpO1xuICAgICAgcmlnaHQgPSBjb250ZXh0LmdldChyaWdodCk7XG4gICAgICBvcGVyYXRpb24gPSBDb25kaXRpb24ub3BlcmF0b3JzW29wXSB8fCBuZXcgTGlxdWlkLkFyZ3VtZW50RXJyb3IoXCJVbmtub3duIG9wZXJhdG9yIFwiICsgb3ApO1xuICAgICAgaWYgKG9wZXJhdGlvbi5jYWxsICE9IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIG9wZXJhdGlvbi5jYWxsKHRoaXMsIGxlZnQsIHJpZ2h0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gQ29uZGl0aW9uO1xuXG4gIH0pKCk7XG5cbiAgTGlxdWlkLkVsc2VDb25kaXRpb24gPSAoZnVuY3Rpb24oc3VwZXJDbGFzcykge1xuICAgIGV4dGVuZChFbHNlQ29uZGl0aW9uLCBzdXBlckNsYXNzKTtcblxuICAgIGZ1bmN0aW9uIEVsc2VDb25kaXRpb24oKSB7XG4gICAgICByZXR1cm4gRWxzZUNvbmRpdGlvbi5fX3N1cGVyX18uY29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICBFbHNlQ29uZGl0aW9uLnByb3RvdHlwZVtcImVsc2VcIl0gPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG5cbiAgICBFbHNlQ29uZGl0aW9uLnByb3RvdHlwZS5ldmFsdWF0ZSA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG5cbiAgICByZXR1cm4gRWxzZUNvbmRpdGlvbjtcblxuICB9KShMaXF1aWQuQ29uZGl0aW9uKTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS4xMS4xXG4oZnVuY3Rpb24oKSB7XG4gIHZhciBMaXF1aWQsXG4gICAgc2xpY2UgPSBbXS5zbGljZTtcblxuICBMaXF1aWQgPSByZXF1aXJlKCcuLi9saXF1aWQnKTtcblxuICBMaXF1aWQuQ29udGV4dCA9IChmdW5jdGlvbigpIHtcbiAgICB2YXIgTElURVJBTFMsIGNvbXBhY3QsIGZsYXR0ZW4sIHJlZjtcblxuICAgIExJVEVSQUxTID0ge1xuICAgICAgJ25pbCc6IG51bGwsXG4gICAgICAnbnVsbCc6IG51bGwsXG4gICAgICAnJzogbnVsbCxcbiAgICAgICd0cnVlJzogdHJ1ZSxcbiAgICAgICdmYWxzZSc6IGZhbHNlXG4gICAgfTtcblxuICAgIHJlZiA9IHJlcXVpcmUoJy4vdXRpbCcpLCBjb21wYWN0ID0gcmVmLmNvbXBhY3QsIGZsYXR0ZW4gPSByZWYuZmxhdHRlbjtcblxuICAgIGZ1bmN0aW9uIENvbnRleHQoZW52aXJvbm1lbnRzLCBvdXRlclNjb3BlLCByZWdpc3RlcnMsIHJldGhyb3dFcnJvcnMpIHtcbiAgICAgIHRoaXMuZW52aXJvbm1lbnRzID0gZmxhdHRlbihbZW52aXJvbm1lbnRzXSk7XG4gICAgICB0aGlzLnNjb3BlcyA9IFtvdXRlclNjb3BlIHx8IHt9XTtcbiAgICAgIHRoaXMucmVnaXN0ZXJzID0gcmVnaXN0ZXJzO1xuICAgICAgdGhpcy5lcnJvcnMgPSBbXTtcbiAgICAgIHRoaXMucmV0aHJvd0Vycm9ycyA9IHJldGhyb3dFcnJvcnM7XG4gICAgICB0aGlzLnN0cmFpbmVyID0gTGlxdWlkLlN0cmFpbmVyLmNyZWF0ZSh0aGlzKTtcbiAgICAgIHRoaXMuaW50ZXJydXB0cyA9IFtdO1xuICAgIH1cblxuICAgIENvbnRleHQucHJvdG90eXBlLmFkZEZpbHRlcnMgPSBmdW5jdGlvbihmaWx0ZXJzKSB7XG4gICAgICB2YXIgZiwgaSwgbGVuLCByZXN1bHRzO1xuICAgICAgZmlsdGVycyA9IGNvbXBhY3QoZmxhdHRlbihbZmlsdGVyc10pKTtcbiAgICAgIHJlc3VsdHMgPSBbXTtcbiAgICAgIGZvciAoaSA9IDAsIGxlbiA9IGZpbHRlcnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgZiA9IGZpbHRlcnNbaV07XG4gICAgICAgIGlmICh0eXBlb2YgZiAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgdGhyb3cgTGlxdWlkLkFyZ3VtZW50RXJyb3IoXCJFeHBlY3RlZCBtb2R1bGUgYnV0IGdvdDogXCIgKyB0eXBlb2YgZik7XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0cy5wdXNoKHRoaXMuc3RyYWluZXIuZXh0ZW5kKGYpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH07XG5cbiAgICBDb250ZXh0LnByb3RvdHlwZS5oYXNJbnRlcnJ1cHQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLmludGVycnVwdHMubGVuZ3RoID4gMDtcbiAgICB9O1xuXG4gICAgQ29udGV4dC5wcm90b3R5cGUucHVzaEludGVycnVwdCA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgIHJldHVybiB0aGlzLmludGVycnVwdHMucHVzaChlKTtcbiAgICB9O1xuXG4gICAgQ29udGV4dC5wcm90b3R5cGUucG9wSW50ZXJydXB0ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5pbnRlcnJ1cHRzLnBvcCgpO1xuICAgIH07XG5cbiAgICBDb250ZXh0LnByb3RvdHlwZS5oYW5kbGVFcnJvciA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgIHRoaXMuZXJyb3JzLnB1c2goZSk7XG4gICAgICBpZiAodGhpcy5yZXRocm93RXJyb3JzKSB7XG4gICAgICAgIGlmIChlIGluc3RhbmNlb2YgTGlxdWlkLlN5bnRheEVycm9yKSB7XG4gICAgICAgICAgdGhyb3cgXCJMaXF1aWQgc3ludGF4IGVycm9yOiBcIiArIGUubWVzc2FnZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBcIkxpcXVpZCBlcnJvcjogXCIgKyBlLm1lc3NhZ2U7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgQ29udGV4dC5wcm90b3R5cGUuaW52b2tlID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYXJncywgbWV0aG9kLCByZWYxO1xuICAgICAgbWV0aG9kID0gYXJndW1lbnRzWzBdLCBhcmdzID0gMiA8PSBhcmd1bWVudHMubGVuZ3RoID8gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpIDogW107XG4gICAgICBpZiAodGhpcy5zdHJhaW5lci5yZXNwb25kVG8obWV0aG9kKSkge1xuICAgICAgICByZXR1cm4gKHJlZjEgPSB0aGlzLnN0cmFpbmVyKVttZXRob2RdLmFwcGx5KHJlZjEsIGFyZ3MpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGFyZ3NbMF07XG4gICAgICB9XG4gICAgfTtcblxuICAgIENvbnRleHQucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbihuZXdTY29wZSkge1xuICAgICAgaWYgKG5ld1Njb3BlID09IG51bGwpIHtcbiAgICAgICAgbmV3U2NvcGUgPSB7fTtcbiAgICAgIH1cbiAgICAgIHRoaXMuc2NvcGVzLnB1c2gobmV3U2NvcGUpO1xuICAgICAgaWYgKHRoaXMuc2NvcGVzLmxlbmd0aCA+IDEwMCkge1xuICAgICAgICB0aHJvdyBuZXcgTGlxdWlkLlN0YWNrTGV2ZWxFcnJvcihcIk5lc3RpbmcgdG9vIGRlZXBcIik7XG4gICAgICB9XG4gICAgfTtcblxuICAgIENvbnRleHQucHJvdG90eXBlLm1lcmdlID0gZnVuY3Rpb24obmV3U2NvcGUpIHtcbiAgICAgIHZhciBrZXksIHJlc3VsdHMsIHZhbDtcbiAgICAgIHJlc3VsdHMgPSBbXTtcbiAgICAgIGZvciAoa2V5IGluIG5ld1Njb3BlKSB7XG4gICAgICAgIHZhbCA9IG5ld1Njb3BlW2tleV07XG4gICAgICAgIHJlc3VsdHMucHVzaCh0aGlzLnNjb3Blc1swXVtrZXldID0gdmFsKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH07XG5cbiAgICBDb250ZXh0LnByb3RvdHlwZS5wb3AgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh0aGlzLnNjb3Blcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgdGhyb3cgbmV3IExpcXVpZC5Db250ZXh0RXJyb3IoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLnNjb3Blcy5wb3AoKTtcbiAgICB9O1xuXG4gICAgQ29udGV4dC5wcm90b3R5cGUuc3RhY2sgPSBmdW5jdGlvbigkeWllbGQsIG5ld1Njb3BlKSB7XG4gICAgICBpZiAobmV3U2NvcGUgPT0gbnVsbCkge1xuICAgICAgICBuZXdTY29wZSA9IHt9O1xuICAgICAgfVxuICAgICAgdGhpcy5wdXNoKG5ld1Njb3BlKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiAkeWllbGQoKTtcbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIHRoaXMucG9wKCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIENvbnRleHQucHJvdG90eXBlLmNsZWFySW5zdGFuY2VBc3NpZ25zID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5zY29wZXNbMF0gPSB7fTtcbiAgICB9O1xuXG4gICAgQ29udGV4dC5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24odmFybmFtZSkge1xuICAgICAgcmV0dXJuIHRoaXMucmVzb2x2ZSh2YXJuYW1lKTtcbiAgICB9O1xuXG4gICAgQ29udGV4dC5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24odmFybmFtZSwgdmFsdWUpIHtcbiAgICAgIHJldHVybiB0aGlzLnNjb3Blc1swXVt2YXJuYW1lXSA9IHZhbHVlO1xuICAgIH07XG5cbiAgICBDb250ZXh0LnByb3RvdHlwZS5oYXNLZXkgPSBmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlc29sdmUoa2V5KSAhPSBudWxsO1xuICAgIH07XG5cbiAgICBDb250ZXh0LnByb3RvdHlwZS5yZXNvbHZlID0gZnVuY3Rpb24oa2V5KSB7XG4gICAgICB2YXIgJCwgY2gsIGksIGosIHJlZjEsIHJlZjIsIHJlZjMsIHJlZjQsIHJlc3VsdHMsIHJlc3VsdHMxO1xuICAgICAgaWYgKExJVEVSQUxTW2tleV0gIT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gTElURVJBTFNba2V5XTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICgkID0gL14nKC4qKSckLy5leGVjKGtleSkpIHtcbiAgICAgICAgICByZXR1cm4gJFsxXTtcbiAgICAgICAgfSBlbHNlIGlmICgkID0gL15cIiguKilcIiQvLmV4ZWMoa2V5KSkge1xuICAgICAgICAgIHJldHVybiAkWzFdO1xuICAgICAgICB9IGVsc2UgaWYgKCQgPSAvXihcXGQrKSQvLmV4ZWMoa2V5KSkge1xuICAgICAgICAgIHJldHVybiBwYXJzZUludCgkWzFdLCAxMCk7XG4gICAgICAgIH0gZWxzZSBpZiAoJCA9IC9eKFxcZFtcXGRcXC5dKykkLy5leGVjKGtleSkpIHtcbiAgICAgICAgICByZXR1cm4gcGFyc2VGbG9hdCgkWzFdKTtcbiAgICAgICAgfSBlbHNlIGlmICgkID0gL15cXCgoXFxTKylcXC5cXC4oXFxTKylcXCkkLy5leGVjKGtleSkpIHtcbiAgICAgICAgICBpZiAoaXNOYU4oJFsxXSkpIHtcbiAgICAgICAgICAgIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgICAgIGZvciAoY2ggPSBpID0gcmVmMSA9ICRbMV0uY2hhckNvZGVBdCgwKSwgcmVmMiA9ICRbMl0uY2hhckNvZGVBdCgwKTsgcmVmMSA8PSByZWYyID8gaSA8PSByZWYyIDogaSA+PSByZWYyOyBjaCA9IHJlZjEgPD0gcmVmMiA/ICsraSA6IC0taSkge1xuICAgICAgICAgICAgICByZXN1bHRzLnB1c2goU3RyaW5nLmZyb21DaGFyQ29kZShjaCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiAoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJlc3VsdHMxID0gW107XG4gICAgICAgICAgICAgIGZvciAodmFyIGogPSByZWYzID0gcGFyc2VJbnQoJFsxXSksIHJlZjQgPSBwYXJzZUludCgkWzJdKTsgcmVmMyA8PSByZWY0ID8gaiA8PSByZWY0IDogaiA+PSByZWY0OyByZWYzIDw9IHJlZjQgPyBqKysgOiBqLS0peyByZXN1bHRzMS5wdXNoKGopOyB9XG4gICAgICAgICAgICAgIHJldHVybiByZXN1bHRzMTtcbiAgICAgICAgICAgIH0pLmFwcGx5KHRoaXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy52YXJpYWJsZShrZXkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuICAgIENvbnRleHQucHJvdG90eXBlLmZpbmRWYXJpYWJsZSA9IGZ1bmN0aW9uKGtleSkge1xuICAgICAgdmFyIGUsIGksIGosIGxlbiwgbGVuMSwgcmVmMSwgcmVmMiwgcywgc2NvcGUsIHZhcmlhYmxlO1xuICAgICAgcmVmMSA9IHRoaXMuc2NvcGVzO1xuICAgICAgZm9yIChpID0gMCwgbGVuID0gcmVmMS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBzID0gcmVmMVtpXTtcbiAgICAgICAgaWYgKHNba2V5XSAhPSBudWxsKSB7XG4gICAgICAgICAgc2NvcGUgPSBzO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoc2NvcGUgPT0gbnVsbCkge1xuICAgICAgICByZWYyID0gdGhpcy5lbnZpcm9ubWVudHM7XG4gICAgICAgIGZvciAoaiA9IDAsIGxlbjEgPSByZWYyLmxlbmd0aDsgaiA8IGxlbjE7IGorKykge1xuICAgICAgICAgIGUgPSByZWYyW2pdO1xuICAgICAgICAgIGlmICh2YXJpYWJsZSA9IHRoaXMubG9va3VwQW5kRXZhbHVhdGUoZSwga2V5KSkge1xuICAgICAgICAgICAgc2NvcGUgPSBlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBzY29wZSB8fCAoc2NvcGUgPSB0aGlzLmVudmlyb25tZW50c1t0aGlzLmVudmlyb25tZW50cy5sZW5ndGggLSAxXSB8fCB0aGlzLnNjb3Blc1t0aGlzLnNjb3Blcy5sZW5ndGggLSAxXSk7XG4gICAgICB2YXJpYWJsZSB8fCAodmFyaWFibGUgPSB0aGlzLmxvb2t1cEFuZEV2YWx1YXRlKHNjb3BlLCBrZXkpKTtcbiAgICAgIGlmICh2YXJpYWJsZSAhPSBudWxsKSB7XG4gICAgICAgIGlmICh0eXBlb2YgdmFyaWFibGUuc2V0Q29udGV4dCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgdmFyaWFibGUuc2V0Q29udGV4dCh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHZhcmlhYmxlO1xuICAgIH07XG5cbiAgICBDb250ZXh0LnByb3RvdHlwZS52YXJpYWJsZSA9IGZ1bmN0aW9uKG1hcmt1cCkge1xuICAgICAgdmFyICQsIGZpcnN0UGFydCwgaSwgbGVuLCBvYmplY3QsIHBhcnQsIHBhcnRzLCBzcXVhcmVCcmFja2V0ZWQ7XG4gICAgICBpZiAodHlwZW9mIG1hcmt1cCAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIHBhcnRzID0gbWFya3VwLm1hdGNoKC9cXFtbXlxcXV0rXFxdfCg/OltcXHdcXC1dXFw/PykrL2cpO1xuICAgICAgc3F1YXJlQnJhY2tldGVkID0gL15cXFsoLiopXFxdJC87XG4gICAgICBmaXJzdFBhcnQgPSBwYXJ0cy5zaGlmdCgpO1xuICAgICAgaWYgKCgkID0gc3F1YXJlQnJhY2tldGVkLmV4ZWMoZmlyc3RQYXJ0KSkpIHtcbiAgICAgICAgZmlyc3RQYXJ0ID0gdGhpcy5yZXNvbHZlKCRbMV0pO1xuICAgICAgfVxuICAgICAgaWYgKG9iamVjdCA9IHRoaXMuZmluZFZhcmlhYmxlKGZpcnN0UGFydCkpIHtcbiAgICAgICAgZm9yIChpID0gMCwgbGVuID0gcGFydHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICBwYXJ0ID0gcGFydHNbaV07XG4gICAgICAgICAgaWYgKCgkID0gc3F1YXJlQnJhY2tldGVkLmV4ZWMocGFydCkpKSB7XG4gICAgICAgICAgICBwYXJ0ID0gdGhpcy5yZXNvbHZlKCRbMV0pO1xuICAgICAgICAgICAgb2JqZWN0ID0gb2JqZWN0W3BhcnRdO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9iamVjdCA9PT0gJ29iamVjdCcgJiYgcGFydCBpbiBvYmplY3QpIHtcbiAgICAgICAgICAgICAgb2JqZWN0ID0gdGhpcy5sb29rdXBBbmRFdmFsdWF0ZShvYmplY3QsIHBhcnQpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICgvXlxcZCskLy50ZXN0KHBhcnQpKSB7XG4gICAgICAgICAgICAgIG9iamVjdCA9IG9iamVjdFtwYXJzZUludChwYXJ0LCAxMCldO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChvYmplY3QgIT0gbnVsbCkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmplY3Quc2V0Q29udGV4dCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgIG9iamVjdC5zZXRDb250ZXh0KHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIG9iamVjdDtcbiAgICB9O1xuXG4gICAgQ29udGV4dC5wcm90b3R5cGUubG9va3VwQW5kRXZhbHVhdGUgPSBmdW5jdGlvbihvYmosIGtleSkge1xuICAgICAgdmFyIHZhbHVlO1xuICAgICAgaWYgKHR5cGVvZiAodmFsdWUgPSBvYmpba2V5XSkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuIG9ialtrZXldID0gdmFsdWUodGhpcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiBDb250ZXh0O1xuXG4gIH0pKCk7XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuMTEuMVxuKGZ1bmN0aW9uKCkge1xuICB2YXIgTGlxdWlkLFxuICAgIGV4dGVuZCA9IGZ1bmN0aW9uKGNoaWxkLCBwYXJlbnQpIHsgZm9yICh2YXIga2V5IGluIHBhcmVudCkgeyBpZiAoaGFzUHJvcC5jYWxsKHBhcmVudCwga2V5KSkgY2hpbGRba2V5XSA9IHBhcmVudFtrZXldOyB9IGZ1bmN0aW9uIGN0b3IoKSB7IHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDsgfSBjdG9yLnByb3RvdHlwZSA9IHBhcmVudC5wcm90b3R5cGU7IGNoaWxkLnByb3RvdHlwZSA9IG5ldyBjdG9yKCk7IGNoaWxkLl9fc3VwZXJfXyA9IHBhcmVudC5wcm90b3R5cGU7IHJldHVybiBjaGlsZDsgfSxcbiAgICBoYXNQcm9wID0ge30uaGFzT3duUHJvcGVydHk7XG5cbiAgTGlxdWlkID0gcmVxdWlyZSgnLi4vbGlxdWlkJyk7XG5cbiAgTGlxdWlkLkRvY3VtZW50ID0gKGZ1bmN0aW9uKHN1cGVyQ2xhc3MpIHtcbiAgICBleHRlbmQoRG9jdW1lbnQsIHN1cGVyQ2xhc3MpO1xuXG4gICAgZnVuY3Rpb24gRG9jdW1lbnQodG9rZW5zKSB7XG4gICAgICB0aGlzLmJsb2NrRGVsaW1pdGVyID0gW107XG4gICAgICB0aGlzLnBhcnNlKHRva2Vucyk7XG4gICAgfVxuXG4gICAgRG9jdW1lbnQucHJvdG90eXBlLmFzc2VydE1pc3NpbmdEZWxpbWl0YXRpb24gPSBmdW5jdGlvbigpIHt9O1xuXG4gICAgcmV0dXJuIERvY3VtZW50O1xuXG4gIH0pKExpcXVpZC5CbG9jayk7XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuMTEuMVxuKGZ1bmN0aW9uKCkge1xuICB2YXIgTGlxdWlkO1xuXG4gIExpcXVpZCA9IHJlcXVpcmUoJy4uL2xpcXVpZCcpO1xuXG4gIExpcXVpZC5Ecm9wID0gKGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIERyb3AoKSB7fVxuXG4gICAgRHJvcC5wcm90b3R5cGUuc2V0Q29udGV4dCA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgICAgIHJldHVybiB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgIH07XG5cbiAgICBEcm9wLnByb3RvdHlwZS5iZWZvcmVNZXRob2QgPSBmdW5jdGlvbihtZXRob2QpIHt9O1xuXG4gICAgRHJvcC5wcm90b3R5cGUuaW52b2tlRHJvcCA9IGZ1bmN0aW9uKG1ldGhvZCkge1xuICAgICAgaWYgKCdmdW5jdGlvbicgPT09IHR5cGVvZiBEcm9wLnByb3RvdHlwZVttZXRob2RdKSB7XG4gICAgICAgIHJldHVybiB0aGlzW21ldGhvZF0uYXBwbHkodGhpcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5iZWZvcmVNZXRob2QobWV0aG9kKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgRHJvcC5wcm90b3R5cGUuaGFzS2V5ID0gZnVuY3Rpb24obmFtZSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcblxuICAgIHJldHVybiBEcm9wO1xuXG4gIH0pKCk7XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuMTEuMVxuKGZ1bmN0aW9uKCkge1xuICB2YXIgTGlxdWlkLFxuICAgIGV4dGVuZCA9IGZ1bmN0aW9uKGNoaWxkLCBwYXJlbnQpIHsgZm9yICh2YXIga2V5IGluIHBhcmVudCkgeyBpZiAoaGFzUHJvcC5jYWxsKHBhcmVudCwga2V5KSkgY2hpbGRba2V5XSA9IHBhcmVudFtrZXldOyB9IGZ1bmN0aW9uIGN0b3IoKSB7IHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDsgfSBjdG9yLnByb3RvdHlwZSA9IHBhcmVudC5wcm90b3R5cGU7IGNoaWxkLnByb3RvdHlwZSA9IG5ldyBjdG9yKCk7IGNoaWxkLl9fc3VwZXJfXyA9IHBhcmVudC5wcm90b3R5cGU7IHJldHVybiBjaGlsZDsgfSxcbiAgICBoYXNQcm9wID0ge30uaGFzT3duUHJvcGVydHk7XG5cbiAgTGlxdWlkID0gcmVxdWlyZSgnLi4vbGlxdWlkJyk7XG5cbiAgTGlxdWlkLkFyZ3VtZW50RXJyb3IgPSAoZnVuY3Rpb24oc3VwZXJDbGFzcykge1xuICAgIGV4dGVuZChBcmd1bWVudEVycm9yLCBzdXBlckNsYXNzKTtcblxuICAgIGZ1bmN0aW9uIEFyZ3VtZW50RXJyb3IoKSB7XG4gICAgICByZXR1cm4gQXJndW1lbnRFcnJvci5fX3N1cGVyX18uY29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gQXJndW1lbnRFcnJvcjtcblxuICB9KShFcnJvcik7XG5cbiAgTGlxdWlkLkNvbnRleHRFcnJvciA9IChmdW5jdGlvbihzdXBlckNsYXNzKSB7XG4gICAgZXh0ZW5kKENvbnRleHRFcnJvciwgc3VwZXJDbGFzcyk7XG5cbiAgICBmdW5jdGlvbiBDb250ZXh0RXJyb3IoKSB7XG4gICAgICByZXR1cm4gQ29udGV4dEVycm9yLl9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIHJldHVybiBDb250ZXh0RXJyb3I7XG5cbiAgfSkoRXJyb3IpO1xuXG4gIExpcXVpZC5GaWx0ZXJOb3RGb3VuZCA9IChmdW5jdGlvbihzdXBlckNsYXNzKSB7XG4gICAgZXh0ZW5kKEZpbHRlck5vdEZvdW5kLCBzdXBlckNsYXNzKTtcblxuICAgIGZ1bmN0aW9uIEZpbHRlck5vdEZvdW5kKCkge1xuICAgICAgcmV0dXJuIEZpbHRlck5vdEZvdW5kLl9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIHJldHVybiBGaWx0ZXJOb3RGb3VuZDtcblxuICB9KShFcnJvcik7XG5cbiAgTGlxdWlkLkZpbGVTeXN0ZW1FcnJvciA9IChmdW5jdGlvbihzdXBlckNsYXNzKSB7XG4gICAgZXh0ZW5kKEZpbGVTeXN0ZW1FcnJvciwgc3VwZXJDbGFzcyk7XG5cbiAgICBmdW5jdGlvbiBGaWxlU3lzdGVtRXJyb3IoKSB7XG4gICAgICByZXR1cm4gRmlsZVN5c3RlbUVycm9yLl9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIHJldHVybiBGaWxlU3lzdGVtRXJyb3I7XG5cbiAgfSkoRXJyb3IpO1xuXG4gIExpcXVpZC5TdGFuZGFyZEVycm9yID0gKGZ1bmN0aW9uKHN1cGVyQ2xhc3MpIHtcbiAgICBleHRlbmQoU3RhbmRhcmRFcnJvciwgc3VwZXJDbGFzcyk7XG5cbiAgICBmdW5jdGlvbiBTdGFuZGFyZEVycm9yKCkge1xuICAgICAgcmV0dXJuIFN0YW5kYXJkRXJyb3IuX19zdXBlcl9fLmNvbnN0cnVjdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFN0YW5kYXJkRXJyb3I7XG5cbiAgfSkoRXJyb3IpO1xuXG4gIExpcXVpZC5TeW50YXhFcnJvciA9IChmdW5jdGlvbihzdXBlckNsYXNzKSB7XG4gICAgZXh0ZW5kKFN5bnRheEVycm9yLCBzdXBlckNsYXNzKTtcblxuICAgIGZ1bmN0aW9uIFN5bnRheEVycm9yKCkge1xuICAgICAgcmV0dXJuIFN5bnRheEVycm9yLl9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIHJldHVybiBTeW50YXhFcnJvcjtcblxuICB9KShFcnJvcik7XG5cbiAgTGlxdWlkLlN0YWNrTGV2ZWxFcnJvciA9IChmdW5jdGlvbihzdXBlckNsYXNzKSB7XG4gICAgZXh0ZW5kKFN0YWNrTGV2ZWxFcnJvciwgc3VwZXJDbGFzcyk7XG5cbiAgICBmdW5jdGlvbiBTdGFja0xldmVsRXJyb3IoKSB7XG4gICAgICByZXR1cm4gU3RhY2tMZXZlbEVycm9yLl9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIHJldHVybiBTdGFja0xldmVsRXJyb3I7XG5cbiAgfSkoRXJyb3IpO1xuXG4gIExpcXVpZC5NZW1vcnlFcnJvciA9IChmdW5jdGlvbihzdXBlckNsYXNzKSB7XG4gICAgZXh0ZW5kKE1lbW9yeUVycm9yLCBzdXBlckNsYXNzKTtcblxuICAgIGZ1bmN0aW9uIE1lbW9yeUVycm9yKCkge1xuICAgICAgcmV0dXJuIE1lbW9yeUVycm9yLl9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIHJldHVybiBNZW1vcnlFcnJvcjtcblxuICB9KShFcnJvcik7XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuMTEuMVxuKGZ1bmN0aW9uKCkge1xuICB2YXIgTGlxdWlkLCBmcywgcGF0aCxcbiAgICBiaW5kID0gZnVuY3Rpb24oZm4sIG1lKXsgcmV0dXJuIGZ1bmN0aW9uKCl7IHJldHVybiBmbi5hcHBseShtZSwgYXJndW1lbnRzKTsgfTsgfTtcblxuICBmcyA9IHJlcXVpcmUoJ2ZzJyk7XG5cbiAgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcblxuICBMaXF1aWQgPSByZXF1aXJlKCcuLi9saXF1aWQnKTtcblxuICBMaXF1aWQuQmxhbmtGaWxlU3lzdGVtID0gKGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIEJsYW5rRmlsZVN5c3RlbSgpIHt9XG5cbiAgICBCbGFua0ZpbGVTeXN0ZW0ucHJvdG90eXBlLnJlYWRUZW1wbGF0ZUZpbGUgPSBmdW5jdGlvbihwYXRoKSB7XG4gICAgICB0aHJvdyBcIlRoaXMgbGlxdWlkIGNvbnRleHQgZG9lcyBub3QgYWxsb3cgaW5jbHVkZXMuXCI7XG4gICAgfTtcblxuICAgIHJldHVybiBCbGFua0ZpbGVTeXN0ZW07XG5cbiAgfSkoKTtcblxuICBMaXF1aWQuTG9jYWxGaWxlU3lzdGVtID0gKGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIExvY2FsRmlsZVN5c3RlbShyb290KSB7XG4gICAgICB0aGlzLnJvb3QgPSByb290O1xuICAgICAgdGhpcy5yZWFkVGVtcGxhdGVGaWxlID0gYmluZCh0aGlzLnJlYWRUZW1wbGF0ZUZpbGUsIHRoaXMpO1xuICAgIH1cblxuICAgIExvY2FsRmlsZVN5c3RlbS5wcm90b3R5cGUucmVhZFRlbXBsYXRlRmlsZSA9IGZ1bmN0aW9uKCR0ZW1wbGF0ZSkge1xuICAgICAgcmV0dXJuIFN0cmluZyhmcy5yZWFkRmlsZVN5bmMocGF0aC5yZXNvbHZlKHRoaXMucm9vdCwgJHRlbXBsYXRlKSkpO1xuICAgIH07XG5cbiAgICByZXR1cm4gTG9jYWxGaWxlU3lzdGVtO1xuXG4gIH0pKCk7XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuMTEuMVxuKGZ1bmN0aW9uKCkge1xuICB2YXIgTGlxdWlkLFxuICAgIGV4dGVuZCA9IGZ1bmN0aW9uKGNoaWxkLCBwYXJlbnQpIHsgZm9yICh2YXIga2V5IGluIHBhcmVudCkgeyBpZiAoaGFzUHJvcC5jYWxsKHBhcmVudCwga2V5KSkgY2hpbGRba2V5XSA9IHBhcmVudFtrZXldOyB9IGZ1bmN0aW9uIGN0b3IoKSB7IHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDsgfSBjdG9yLnByb3RvdHlwZSA9IHBhcmVudC5wcm90b3R5cGU7IGNoaWxkLnByb3RvdHlwZSA9IG5ldyBjdG9yKCk7IGNoaWxkLl9fc3VwZXJfXyA9IHBhcmVudC5wcm90b3R5cGU7IHJldHVybiBjaGlsZDsgfSxcbiAgICBoYXNQcm9wID0ge30uaGFzT3duUHJvcGVydHk7XG5cbiAgTGlxdWlkID0gcmVxdWlyZSgnLi4vbGlxdWlkJyk7XG5cbiAgTGlxdWlkLkludGVycnVwdCA9IChmdW5jdGlvbigpIHtcbiAgICBJbnRlcnJ1cHQucHJvdG90eXBlLm1lc3NhZ2UgPSAnJztcblxuICAgIGZ1bmN0aW9uIEludGVycnVwdChtZXNzYWdlKSB7XG4gICAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlICE9IG51bGwgPyBtZXNzYWdlIDogJ2ludGVycnVwdCc7XG4gICAgfVxuXG4gICAgcmV0dXJuIEludGVycnVwdDtcblxuICB9KSgpO1xuXG4gIExpcXVpZC5CcmVha0ludGVycnVwdCA9IChmdW5jdGlvbihzdXBlckNsYXNzKSB7XG4gICAgZXh0ZW5kKEJyZWFrSW50ZXJydXB0LCBzdXBlckNsYXNzKTtcblxuICAgIGZ1bmN0aW9uIEJyZWFrSW50ZXJydXB0KCkge1xuICAgICAgcmV0dXJuIEJyZWFrSW50ZXJydXB0Ll9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIHJldHVybiBCcmVha0ludGVycnVwdDtcblxuICB9KShMaXF1aWQuSW50ZXJydXB0KTtcblxuICBMaXF1aWQuQ29udGludWVJbnRlcnJ1cHQgPSAoZnVuY3Rpb24oc3VwZXJDbGFzcykge1xuICAgIGV4dGVuZChDb250aW51ZUludGVycnVwdCwgc3VwZXJDbGFzcyk7XG5cbiAgICBmdW5jdGlvbiBDb250aW51ZUludGVycnVwdCgpIHtcbiAgICAgIHJldHVybiBDb250aW51ZUludGVycnVwdC5fX3N1cGVyX18uY29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gQ29udGludWVJbnRlcnJ1cHQ7XG5cbiAgfSkoTGlxdWlkLkludGVycnVwdCk7XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuMTEuMVxuKGZ1bmN0aW9uKCkge1xuICB2YXIgTGlxdWlkLCBzdHJmdGltZTtcblxuICBzdHJmdGltZSA9IHJlcXVpcmUoJ3N0cmZ0aW1lJyk7XG5cbiAgTGlxdWlkID0gcmVxdWlyZSgnLi4vbGlxdWlkJyk7XG5cbiAgTGlxdWlkLlN0YW5kYXJkRmlsdGVycyA9IChmdW5jdGlvbigpIHtcbiAgICBmdW5jdGlvbiBTdGFuZGFyZEZpbHRlcnMoKSB7fVxuXG4gICAgU3RhbmRhcmRGaWx0ZXJzLnNpemUgPSBmdW5jdGlvbihpdGVyYWJsZSkge1xuICAgICAgaWYgKGl0ZXJhYmxlW1wibGVuZ3RoXCJdKSB7XG4gICAgICAgIHJldHVybiBpdGVyYWJsZS5sZW5ndGg7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gMDtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgU3RhbmRhcmRGaWx0ZXJzLmRvd25jYXNlID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgIHJldHVybiBpbnB1dC50b1N0cmluZygpLnRvTG93ZXJDYXNlKCk7XG4gICAgfTtcblxuICAgIFN0YW5kYXJkRmlsdGVycy51cGNhc2UgPSBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgcmV0dXJuIGlucHV0LnRvU3RyaW5nKCkudG9VcHBlckNhc2UoKTtcbiAgICB9O1xuXG4gICAgU3RhbmRhcmRGaWx0ZXJzLmNhcGl0YWxpemUgPSBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgdmFyIHN0cjtcbiAgICAgIHN0ciA9IGlucHV0LnRvU3RyaW5nKCk7XG4gICAgICByZXR1cm4gc3RyLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgc3RyLnN1YnN0cmluZygxKS50b0xvd2VyQ2FzZSgpO1xuICAgIH07XG5cbiAgICBTdGFuZGFyZEZpbHRlcnMuZXNjYXBlID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgIGlucHV0ID0gaW5wdXQudG9TdHJpbmcoKTtcbiAgICAgIGlucHV0ID0gaW5wdXQucmVwbGFjZSgvJi9nLCBcIiZhbXA7XCIpO1xuICAgICAgaW5wdXQgPSBpbnB1dC5yZXBsYWNlKC88L2csIFwiJmx0O1wiKTtcbiAgICAgIGlucHV0ID0gaW5wdXQucmVwbGFjZSgvPi9nLCBcIiZndDtcIik7XG4gICAgICBpbnB1dCA9IGlucHV0LnJlcGxhY2UoL1wiL2csIFwiJnF1b3Q7XCIpO1xuICAgICAgcmV0dXJuIGlucHV0O1xuICAgIH07XG5cbiAgICBTdGFuZGFyZEZpbHRlcnMuaCA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICBpbnB1dCA9IGlucHV0LnRvU3RyaW5nKCk7XG4gICAgICBpbnB1dCA9IGlucHV0LnJlcGxhY2UoLyYvZywgXCImYW1wO1wiKTtcbiAgICAgIGlucHV0ID0gaW5wdXQucmVwbGFjZSgvPC9nLCBcIiZsdDtcIik7XG4gICAgICBpbnB1dCA9IGlucHV0LnJlcGxhY2UoLz4vZywgXCImZ3Q7XCIpO1xuICAgICAgaW5wdXQgPSBpbnB1dC5yZXBsYWNlKC9cIi9nLCBcIiZxdW90O1wiKTtcbiAgICAgIHJldHVybiBpbnB1dDtcbiAgICB9O1xuXG4gICAgU3RhbmRhcmRGaWx0ZXJzLnRydW5jYXRlID0gZnVuY3Rpb24oaW5wdXQsIGxlbmd0aCwgc3RyaW5nKSB7XG4gICAgICB2YXIgc2VnO1xuICAgICAgaWYgKCFpbnB1dCB8fCBpbnB1dCA9PT0gXCJcIikge1xuICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgIH1cbiAgICAgIGxlbmd0aCA9IGxlbmd0aCB8fCA1MDtcbiAgICAgIHN0cmluZyA9IHN0cmluZyB8fCBcIi4uLlwiO1xuICAgICAgc2VnID0gaW5wdXQuc2xpY2UoMCwgbGVuZ3RoKTtcbiAgICAgIGlmIChpbnB1dC5sZW5ndGggPiBsZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIGlucHV0LnNsaWNlKDAsIGxlbmd0aCkgKyBzdHJpbmc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICB9XG4gICAgfTtcblxuICAgIFN0YW5kYXJkRmlsdGVycy50cnVuY2F0ZXdvcmRzID0gZnVuY3Rpb24oaW5wdXQsIHdvcmRzLCBzdHJpbmcpIHtcbiAgICAgIHZhciBsLCB3b3JkbGlzdDtcbiAgICAgIGlmICghaW5wdXQgfHwgaW5wdXQgPT09IFwiXCIpIHtcbiAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICB9XG4gICAgICB3b3JkcyA9IHBhcnNlSW50KHdvcmRzIHx8IDE1KTtcbiAgICAgIHN0cmluZyA9IHN0cmluZyB8fCBcIi4uLlwiO1xuICAgICAgd29yZGxpc3QgPSBpbnB1dC50b1N0cmluZygpLnNwbGl0KFwiIFwiKTtcbiAgICAgIGwgPSBNYXRoLm1heCh3b3JkcywgMCk7XG4gICAgICBpZiAod29yZGxpc3QubGVuZ3RoID4gbCkge1xuICAgICAgICByZXR1cm4gd29yZGxpc3Quc2xpY2UoMCwgbCkuam9pbihcIiBcIikgKyBzdHJpbmc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICB9XG4gICAgfTtcblxuICAgIFN0YW5kYXJkRmlsdGVycy50cnVuY2F0ZV93b3JkcyA9IGZ1bmN0aW9uKGlucHV0LCB3b3Jkcywgc3RyaW5nKSB7XG4gICAgICB2YXIgbCwgd29yZGxpc3Q7XG4gICAgICBpZiAoIWlucHV0IHx8IGlucHV0ID09PSBcIlwiKSB7XG4gICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgfVxuICAgICAgd29yZHMgPSBwYXJzZUludCh3b3JkcyB8fCAxNSk7XG4gICAgICBzdHJpbmcgPSBzdHJpbmcgfHwgXCIuLi5cIjtcbiAgICAgIHdvcmRsaXN0ID0gaW5wdXQudG9TdHJpbmcoKS5zcGxpdChcIiBcIik7XG4gICAgICBsID0gTWF0aC5tYXgod29yZHMsIDApO1xuICAgICAgaWYgKHdvcmRsaXN0Lmxlbmd0aCA+IGwpIHtcbiAgICAgICAgcmV0dXJuIHdvcmRsaXN0LnNsaWNlKDAsIGwpLmpvaW4oXCIgXCIpICsgc3RyaW5nO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGlucHV0O1xuICAgICAgfVxuICAgIH07XG5cbiAgICBTdGFuZGFyZEZpbHRlcnMuc3RyaXBfaHRtbCA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICByZXR1cm4gaW5wdXQudG9TdHJpbmcoKS5yZXBsYWNlKC88Lio/Pi9nLCBcIlwiKTtcbiAgICB9O1xuXG4gICAgU3RhbmRhcmRGaWx0ZXJzLnN0cmlwX25ld2xpbmVzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgIHJldHVybiBpbnB1dC50b1N0cmluZygpLnJlcGxhY2UoL1xcbi9nLCBcIlwiKTtcbiAgICB9O1xuXG4gICAgU3RhbmRhcmRGaWx0ZXJzLmpvaW4gPSBmdW5jdGlvbihpbnB1dCwgc2VwYXJhdG9yKSB7XG4gICAgICBzZXBhcmF0b3IgPSBzZXBhcmF0b3IgfHwgXCIgXCI7XG4gICAgICByZXR1cm4gaW5wdXQuam9pbihzZXBhcmF0b3IpO1xuICAgIH07XG5cbiAgICBTdGFuZGFyZEZpbHRlcnMuc3BsaXQgPSBmdW5jdGlvbihpbnB1dCwgc2VwYXJhdG9yKSB7XG4gICAgICBzZXBhcmF0b3IgPSBzZXBhcmF0b3IgfHwgXCIgXCI7XG4gICAgICByZXR1cm4gaW5wdXQuc3BsaXQoc2VwYXJhdG9yKTtcbiAgICB9O1xuXG4gICAgU3RhbmRhcmRGaWx0ZXJzLnNvcnQgPSBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgcmV0dXJuIGlucHV0LnNvcnQoKTtcbiAgICB9O1xuXG4gICAgU3RhbmRhcmRGaWx0ZXJzLnJldmVyc2UgPSBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgcmV0dXJuIGlucHV0LnJldmVyc2UoKTtcbiAgICB9O1xuXG4gICAgU3RhbmRhcmRGaWx0ZXJzLnJlcGxhY2UgPSBmdW5jdGlvbihpbnB1dCwgc3RyaW5nLCByZXBsYWNlbWVudCkge1xuICAgICAgcmVwbGFjZW1lbnQgPSByZXBsYWNlbWVudCB8fCBcIlwiO1xuICAgICAgcmV0dXJuIGlucHV0LnRvU3RyaW5nKCkucmVwbGFjZShuZXcgUmVnRXhwKHN0cmluZywgXCJnXCIpLCByZXBsYWNlbWVudCk7XG4gICAgfTtcblxuICAgIFN0YW5kYXJkRmlsdGVycy5yZXBsYWNlX2ZpcnN0ID0gZnVuY3Rpb24oaW5wdXQsIHN0cmluZywgcmVwbGFjZW1lbnQpIHtcbiAgICAgIHJlcGxhY2VtZW50ID0gcmVwbGFjZW1lbnQgfHwgXCJcIjtcbiAgICAgIHJldHVybiBpbnB1dC50b1N0cmluZygpLnJlcGxhY2UobmV3IFJlZ0V4cChzdHJpbmcsIFwiXCIpLCByZXBsYWNlbWVudCk7XG4gICAgfTtcblxuICAgIFN0YW5kYXJkRmlsdGVycy5uZXdsaW5lX3RvX2JyID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgIHJldHVybiBpbnB1dC50b1N0cmluZygpLnJlcGxhY2UoL1xcbi9nLCBcIjxici8+XFxuXCIpO1xuICAgIH07XG5cbiAgICBTdGFuZGFyZEZpbHRlcnMuZGF0ZSA9IGZ1bmN0aW9uKGlucHV0LCBmb3JtYXQpIHtcbiAgICAgIHZhciBkYXRlO1xuICAgICAgZGF0ZSA9IHZvaWQgMDtcbiAgICAgIGlmIChpbnB1dCBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICAgICAgZGF0ZSA9IGlucHV0O1xuICAgICAgfVxuICAgICAgaWYgKCghKGRhdGUgaW5zdGFuY2VvZiBEYXRlKSkgJiYgaW5wdXQgPT09IFwibm93XCIpIHtcbiAgICAgICAgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgICB9XG4gICAgICBpZiAoIShkYXRlIGluc3RhbmNlb2YgRGF0ZSkpIHtcbiAgICAgICAgZGF0ZSA9IG5ldyBEYXRlKGlucHV0KTtcbiAgICAgIH1cbiAgICAgIGlmICghKGRhdGUgaW5zdGFuY2VvZiBEYXRlKSkge1xuICAgICAgICBkYXRlID0gbmV3IERhdGUoRGF0ZS5wYXJzZShpbnB1dCkpO1xuICAgICAgfVxuICAgICAgaWYgKCEoZGF0ZSBpbnN0YW5jZW9mIERhdGUpKSB7XG4gICAgICAgIHJldHVybiBpbnB1dDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBzdHJmdGltZShmb3JtYXQsIGRhdGUpO1xuICAgIH07XG5cbiAgICBTdGFuZGFyZEZpbHRlcnMuZmlyc3QgPSBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgcmV0dXJuIGlucHV0WzBdO1xuICAgIH07XG5cbiAgICBTdGFuZGFyZEZpbHRlcnMubGFzdCA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICBpbnB1dCA9IGlucHV0O1xuICAgICAgcmV0dXJuIGlucHV0W2lucHV0Lmxlbmd0aCAtIDFdO1xuICAgIH07XG5cbiAgICByZXR1cm4gU3RhbmRhcmRGaWx0ZXJzO1xuXG4gIH0pKCk7XG5cbiAgTGlxdWlkLlRlbXBsYXRlLnJlZ2lzdGVyRmlsdGVyKExpcXVpZC5TdGFuZGFyZEZpbHRlcnMpO1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjExLjFcbihmdW5jdGlvbigpIHtcbiAgdmFyIExpcXVpZCxcbiAgICBpbmRleE9mID0gW10uaW5kZXhPZiB8fCBmdW5jdGlvbihpdGVtKSB7IGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy5sZW5ndGg7IGkgPCBsOyBpKyspIHsgaWYgKGkgaW4gdGhpcyAmJiB0aGlzW2ldID09PSBpdGVtKSByZXR1cm4gaTsgfSByZXR1cm4gLTE7IH07XG5cbiAgTGlxdWlkID0gcmVxdWlyZSgnLi4vbGlxdWlkJyk7XG5cbiAgTGlxdWlkLlN0cmFpbmVyID0gKGZ1bmN0aW9uKCkge1xuICAgIHZhciBJTlRFUk5BTF9NRVRIT0Q7XG5cbiAgICBJTlRFUk5BTF9NRVRIT0QgPSAvXl9fLztcblxuICAgIFN0cmFpbmVyLnJlcXVpcmVkTWV0aG9kcyA9IFsncmVzcG9uZFRvJywgJ2NvbnRleHQnLCAnZXh0ZW5kJ107XG5cbiAgICBTdHJhaW5lci5maWx0ZXJzID0ge307XG5cbiAgICBmdW5jdGlvbiBTdHJhaW5lcihjb250ZXh0KSB7XG4gICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgIH1cblxuICAgIFN0cmFpbmVyLmdsb2JhbEZpbHRlciA9IGZ1bmN0aW9uKGZpbHRlcikge1xuICAgICAgaWYgKHR5cGVvZiBmaWx0ZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IExpcXVpZC5Bcmd1bWVudEVycm9yKFwiUGFzc2VkIGZpbHRlciBpcyBub3QgYSBtb2R1bGVcIik7XG4gICAgICB9XG4gICAgICByZXR1cm4gU3RyYWluZXIuZmlsdGVyc1tmaWx0ZXIubmFtZV0gPSBmaWx0ZXI7XG4gICAgfTtcblxuICAgIFN0cmFpbmVyLmNyZWF0ZSA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgICAgIHZhciBrLCBtLCByZWYsIHN0cmFpbmVyO1xuICAgICAgc3RyYWluZXIgPSBuZXcgU3RyYWluZXIoY29udGV4dCk7XG4gICAgICByZWYgPSBTdHJhaW5lci5maWx0ZXJzO1xuICAgICAgZm9yIChrIGluIHJlZikge1xuICAgICAgICBtID0gcmVmW2tdO1xuICAgICAgICBzdHJhaW5lci5leHRlbmQobSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gc3RyYWluZXI7XG4gICAgfTtcblxuICAgIFN0cmFpbmVyLnByb3RvdHlwZS5yZXNwb25kVG8gPSBmdW5jdGlvbihtZXRob2ROYW1lKSB7XG4gICAgICBtZXRob2ROYW1lID0gbWV0aG9kTmFtZS50b1N0cmluZygpO1xuICAgICAgaWYgKElOVEVSTkFMX01FVEhPRC50ZXN0KG1ldGhvZE5hbWUpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmIChpbmRleE9mLmNhbGwoU3RyYWluZXIucmVxdWlyZWRNZXRob2RzLCBtZXRob2ROYW1lKSA+PSAwKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzW21ldGhvZE5hbWVdICE9IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfTtcblxuICAgIFN0cmFpbmVyLnByb3RvdHlwZS5leHRlbmQgPSBmdW5jdGlvbihtKSB7XG4gICAgICB2YXIgbmFtZSwgcmVzdWx0cywgdmFsO1xuICAgICAgcmVzdWx0cyA9IFtdO1xuICAgICAgZm9yIChuYW1lIGluIG0pIHtcbiAgICAgICAgdmFsID0gbVtuYW1lXTtcbiAgICAgICAgaWYgKHRoaXNbbmFtZV0gPT0gbnVsbCkge1xuICAgICAgICAgIHJlc3VsdHMucHVzaCh0aGlzW25hbWVdID0gdmFsKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXN1bHRzLnB1c2godm9pZCAwKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfTtcblxuICAgIHJldHVybiBTdHJhaW5lcjtcblxuICB9KSgpO1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjExLjFcbihmdW5jdGlvbigpIHtcbiAgdmFyIExpcXVpZDtcblxuICBMaXF1aWQgPSByZXF1aXJlKCcuLi9saXF1aWQnKTtcblxuICBMaXF1aWQuVGFnID0gKGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIFRhZyh0YWdOYW1lLCBtYXJrdXAsIHRva2Vucykge1xuICAgICAgdGhpcy50YWdOYW1lID0gdGFnTmFtZTtcbiAgICAgIHRoaXMubWFya3VwID0gbWFya3VwO1xuICAgICAgdGhpcy5ub2RlbGlzdCA9IHRoaXMubm9kZWxpc3QgfHwgW107XG4gICAgICB0aGlzLnBhcnNlKHRva2Vucyk7XG4gICAgfVxuXG4gICAgVGFnLnByb3RvdHlwZS5wYXJzZSA9IGZ1bmN0aW9uKHRva2Vucykge307XG5cbiAgICBUYWcucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgICAgIHJldHVybiBcIlwiO1xuICAgIH07XG5cbiAgICByZXR1cm4gVGFnO1xuXG4gIH0pKCk7XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuMTEuMVxuKGZ1bmN0aW9uKCkge1xuICB2YXIgTGlxdWlkLFxuICAgIGV4dGVuZCA9IGZ1bmN0aW9uKGNoaWxkLCBwYXJlbnQpIHsgZm9yICh2YXIga2V5IGluIHBhcmVudCkgeyBpZiAoaGFzUHJvcC5jYWxsKHBhcmVudCwga2V5KSkgY2hpbGRba2V5XSA9IHBhcmVudFtrZXldOyB9IGZ1bmN0aW9uIGN0b3IoKSB7IHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDsgfSBjdG9yLnByb3RvdHlwZSA9IHBhcmVudC5wcm90b3R5cGU7IGNoaWxkLnByb3RvdHlwZSA9IG5ldyBjdG9yKCk7IGNoaWxkLl9fc3VwZXJfXyA9IHBhcmVudC5wcm90b3R5cGU7IHJldHVybiBjaGlsZDsgfSxcbiAgICBoYXNQcm9wID0ge30uaGFzT3duUHJvcGVydHk7XG5cbiAgTGlxdWlkID0gcmVxdWlyZSgnLi4vLi4vbGlxdWlkJyk7XG5cbiAgTGlxdWlkLlRhZ3MuQXNzaWduID0gKGZ1bmN0aW9uKHN1cGVyQ2xhc3MpIHtcbiAgICB2YXIgU3ludGF4O1xuXG4gICAgZXh0ZW5kKEFzc2lnbiwgc3VwZXJDbGFzcyk7XG5cbiAgICBTeW50YXggPSBSZWdFeHAoXCIoKD86XCIgKyBMaXF1aWQuVmFyaWFibGVTaWduYXR1cmUuc291cmNlICsgXCIpKylcXFxccyo9XFxcXHMqKCg/OlwiICsgTGlxdWlkLlN0cmljdFF1b3RlZEZyYWdtZW50LnNvdXJjZSArIFwiKSspXCIpO1xuXG4gICAgZnVuY3Rpb24gQXNzaWduKHRhZ05hbWUsIG1hcmt1cCwgdG9rZW5zKSB7XG4gICAgICB2YXIgJDtcbiAgICAgIGlmICgkID0gbWFya3VwLm1hdGNoKFN5bnRheCkpIHtcbiAgICAgICAgdGhpcy50byA9ICRbMV07XG4gICAgICAgIHRoaXMuZnJvbSA9ICRbMl07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgTGlxdWlkLlN5bnRheEVycm9yKFwiU3ludGF4IGVycm9yIGluICdhc3NpZ24nIC0gVmFsaWQgc3ludGF4OiBhc3NpZ24gW3Zhcl0gPSBbc291cmNlXVwiKTtcbiAgICAgIH1cbiAgICAgIEFzc2lnbi5fX3N1cGVyX18uY29uc3RydWN0b3IuY2FsbCh0aGlzLCB0YWdOYW1lLCBtYXJrdXAsIHRva2Vucyk7XG4gICAgfVxuXG4gICAgQXNzaWduLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gICAgICB2YXIgbGFzdDtcbiAgICAgIGxhc3QgPSBjb250ZXh0LnNjb3Blcy5sZW5ndGggLSAxO1xuICAgICAgY29udGV4dC5zY29wZXNbbGFzdF1bdGhpcy50b10gPSBjb250ZXh0LmdldCh0aGlzLmZyb20pO1xuICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfTtcblxuICAgIHJldHVybiBBc3NpZ247XG5cbiAgfSkoTGlxdWlkLlRhZyk7XG5cbiAgTGlxdWlkLlRlbXBsYXRlLnJlZ2lzdGVyVGFnKFwiYXNzaWduXCIsIExpcXVpZC5UYWdzLkFzc2lnbik7XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuMTEuMVxuKGZ1bmN0aW9uKCkge1xuICB2YXIgTGlxdWlkLFxuICAgIGV4dGVuZCA9IGZ1bmN0aW9uKGNoaWxkLCBwYXJlbnQpIHsgZm9yICh2YXIga2V5IGluIHBhcmVudCkgeyBpZiAoaGFzUHJvcC5jYWxsKHBhcmVudCwga2V5KSkgY2hpbGRba2V5XSA9IHBhcmVudFtrZXldOyB9IGZ1bmN0aW9uIGN0b3IoKSB7IHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDsgfSBjdG9yLnByb3RvdHlwZSA9IHBhcmVudC5wcm90b3R5cGU7IGNoaWxkLnByb3RvdHlwZSA9IG5ldyBjdG9yKCk7IGNoaWxkLl9fc3VwZXJfXyA9IHBhcmVudC5wcm90b3R5cGU7IHJldHVybiBjaGlsZDsgfSxcbiAgICBoYXNQcm9wID0ge30uaGFzT3duUHJvcGVydHk7XG5cbiAgTGlxdWlkID0gcmVxdWlyZSgnLi4vLi4vbGlxdWlkJyk7XG5cbiAgTGlxdWlkLlRhZ3MuQmxvY2tEcm9wID0gKGZ1bmN0aW9uKHN1cGVyQ2xhc3MpIHtcbiAgICBleHRlbmQoQmxvY2tEcm9wLCBzdXBlckNsYXNzKTtcblxuICAgIGZ1bmN0aW9uIEJsb2NrRHJvcChibG9jaykge1xuICAgICAgdGhpcy5ibG9jayA9IGJsb2NrO1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICdzdXBlcicsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5ibG9jay5jYWxsU3VwZXIodGhpcy5jb250ZXh0KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIEJsb2NrRHJvcDtcblxuICB9KShMaXF1aWQuRHJvcCk7XG5cbiAgTGlxdWlkLlRhZ3MuQmxvY2sgPSAoZnVuY3Rpb24oc3VwZXJDbGFzcykge1xuICAgIHZhciBTeW50YXg7XG5cbiAgICBleHRlbmQoQmxvY2ssIHN1cGVyQ2xhc3MpO1xuXG4gICAgU3ludGF4ID0gUmVnRXhwKFwiKFwiICsgTGlxdWlkLlF1b3RlZEZyYWdtZW50LnNvdXJjZSArIFwiKVwiKTtcblxuICAgIEJsb2NrLnByb3RvdHlwZS5wYXJlbnQgPSBudWxsO1xuXG4gICAgQmxvY2sucHJvdG90eXBlLm5hbWUgPSAnJztcblxuICAgIGZ1bmN0aW9uIEJsb2NrKHRhZ05hbWUsIG1hcmt1cCwgdG9rZW5zKSB7XG4gICAgICB2YXIgJDtcbiAgICAgIGlmICgkID0gbWFya3VwLm1hdGNoKFN5bnRheCkpIHtcbiAgICAgICAgdGhpcy5uYW1lID0gJFsxXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBMaXF1aWQuU3ludGF4RXJyb3IoXCJTeW50YXggRXJyb3IgaW4gJ2Jsb2NrJyAtIFZhbGlkIHN5bnRheDogYmxvY2sgW25hbWVdXCIpO1xuICAgICAgfVxuICAgICAgaWYgKHRva2VucyAhPSBudWxsKSB7XG4gICAgICAgIEJsb2NrLl9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIHRhZ05hbWUsIG1hcmt1cCwgdG9rZW5zKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBCbG9jay5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oY29udGV4dCkge1xuICAgICAgcmV0dXJuIGNvbnRleHQuc3RhY2soKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBjb250ZXh0LnNldCgnYmxvY2snLCBuZXcgTGlxdWlkLlRhZ3MuQmxvY2tEcm9wKF90aGlzKSk7XG4gICAgICAgICAgcmV0dXJuIF90aGlzLnJlbmRlckFsbChfdGhpcy5ub2RlbGlzdCwgY29udGV4dCk7XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKSk7XG4gICAgfTtcblxuICAgIEJsb2NrLnByb3RvdHlwZS5hZGRQYXJlbnQgPSBmdW5jdGlvbihub2RlbGlzdCkge1xuICAgICAgaWYgKHRoaXMucGFyZW50ICE9IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyZW50LmFkZFBhcmVudChub2RlbGlzdCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnBhcmVudCA9IG5ldyBCbG9jayh0aGlzLnRhZ05hbWUsIHRoaXMubmFtZSk7XG4gICAgICAgIHJldHVybiB0aGlzLnBhcmVudC5ub2RlbGlzdCA9IG5vZGVsaXN0O1xuICAgICAgfVxuICAgIH07XG5cbiAgICBCbG9jay5wcm90b3R5cGUuY2FsbFN1cGVyID0gZnVuY3Rpb24oY29udGV4dCkge1xuICAgICAgaWYgKHRoaXMucGFyZW50ICE9IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyZW50LnJlbmRlcihjb250ZXh0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAnJztcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIEJsb2NrO1xuXG4gIH0pKExpcXVpZC5CbG9jayk7XG5cbiAgTGlxdWlkLlRlbXBsYXRlLnJlZ2lzdGVyVGFnKFwiYmxvY2tcIiwgTGlxdWlkLlRhZ3MuQmxvY2spO1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjExLjFcbihmdW5jdGlvbigpIHtcbiAgdmFyIExpcXVpZCxcbiAgICBleHRlbmQgPSBmdW5jdGlvbihjaGlsZCwgcGFyZW50KSB7IGZvciAodmFyIGtleSBpbiBwYXJlbnQpIHsgaWYgKGhhc1Byb3AuY2FsbChwYXJlbnQsIGtleSkpIGNoaWxkW2tleV0gPSBwYXJlbnRba2V5XTsgfSBmdW5jdGlvbiBjdG9yKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gY2hpbGQ7IH0gY3Rvci5wcm90b3R5cGUgPSBwYXJlbnQucHJvdG90eXBlOyBjaGlsZC5wcm90b3R5cGUgPSBuZXcgY3RvcigpOyBjaGlsZC5fX3N1cGVyX18gPSBwYXJlbnQucHJvdG90eXBlOyByZXR1cm4gY2hpbGQ7IH0sXG4gICAgaGFzUHJvcCA9IHt9Lmhhc093blByb3BlcnR5O1xuXG4gIExpcXVpZCA9IHJlcXVpcmUoJy4uLy4uL2xpcXVpZCcpO1xuXG4gIExpcXVpZC5UYWdzLkJyZWFrID0gKGZ1bmN0aW9uKHN1cGVyQ2xhc3MpIHtcbiAgICBleHRlbmQoQnJlYWssIHN1cGVyQ2xhc3MpO1xuXG4gICAgZnVuY3Rpb24gQnJlYWsoKSB7XG4gICAgICByZXR1cm4gQnJlYWsuX19zdXBlcl9fLmNvbnN0cnVjdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgQnJlYWsucHJvdG90eXBlLmludGVycnVwdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBMaXF1aWQuQnJlYWtJbnRlcnJ1cHQ7XG4gICAgfTtcblxuICAgIHJldHVybiBCcmVhaztcblxuICB9KShMaXF1aWQuVGFnKTtcblxuICBMaXF1aWQuVGVtcGxhdGUucmVnaXN0ZXJUYWcoXCJicmVha1wiLCBMaXF1aWQuVGFncy5CcmVhayk7XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuMTEuMVxuKGZ1bmN0aW9uKCkge1xuICB2YXIgTGlxdWlkLFxuICAgIGV4dGVuZCA9IGZ1bmN0aW9uKGNoaWxkLCBwYXJlbnQpIHsgZm9yICh2YXIga2V5IGluIHBhcmVudCkgeyBpZiAoaGFzUHJvcC5jYWxsKHBhcmVudCwga2V5KSkgY2hpbGRba2V5XSA9IHBhcmVudFtrZXldOyB9IGZ1bmN0aW9uIGN0b3IoKSB7IHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDsgfSBjdG9yLnByb3RvdHlwZSA9IHBhcmVudC5wcm90b3R5cGU7IGNoaWxkLnByb3RvdHlwZSA9IG5ldyBjdG9yKCk7IGNoaWxkLl9fc3VwZXJfXyA9IHBhcmVudC5wcm90b3R5cGU7IHJldHVybiBjaGlsZDsgfSxcbiAgICBoYXNQcm9wID0ge30uaGFzT3duUHJvcGVydHk7XG5cbiAgTGlxdWlkID0gcmVxdWlyZSgnLi4vLi4vbGlxdWlkJyk7XG5cbiAgTGlxdWlkLlRhZ3MuQ2FwdHVyZSA9IChmdW5jdGlvbihzdXBlckNsYXNzKSB7XG4gICAgdmFyIFN5bnRheDtcblxuICAgIGV4dGVuZChDYXB0dXJlLCBzdXBlckNsYXNzKTtcblxuICAgIFN5bnRheCA9IC8oXFx3KykvO1xuXG4gICAgZnVuY3Rpb24gQ2FwdHVyZSh0YWdOYW1lLCBtYXJrdXAsIHRva2Vucykge1xuICAgICAgdmFyICQ7XG4gICAgICBpZiAoJCA9IG1hcmt1cC5tYXRjaChTeW50YXgpKSB7XG4gICAgICAgIHRoaXMudG8gPSAkWzFdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IExpcXVpZC5TeW50YXhFcnJvcihcIlN5bnRheCBlcnJvciBpbiAnY2FwdHVyZScgLSBWYWxpZCBzeW50YXg6IGNhcHR1cmUgW3Zhcl1cIik7XG4gICAgICB9XG4gICAgICBDYXB0dXJlLl9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIHRhZ05hbWUsIG1hcmt1cCwgdG9rZW5zKTtcbiAgICB9XG5cbiAgICBDYXB0dXJlLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gICAgICB2YXIgbGFzdCwgb3V0cHV0O1xuICAgICAgb3V0cHV0ID0gQ2FwdHVyZS5fX3N1cGVyX18ucmVuZGVyLmNhbGwodGhpcywgY29udGV4dCk7XG4gICAgICBsYXN0ID0gY29udGV4dC5zY29wZXMubGVuZ3RoIC0gMTtcbiAgICAgIGNvbnRleHQuc2NvcGVzW2xhc3RdW3RoaXMudG9dID0gb3V0cHV0O1xuICAgICAgcmV0dXJuICcnO1xuICAgIH07XG5cbiAgICByZXR1cm4gQ2FwdHVyZTtcblxuICB9KShMaXF1aWQuQmxvY2spO1xuXG4gIExpcXVpZC5UZW1wbGF0ZS5yZWdpc3RlclRhZyhcImNhcHR1cmVcIiwgTGlxdWlkLlRhZ3MuQ2FwdHVyZSk7XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuMTEuMVxuKGZ1bmN0aW9uKCkge1xuICB2YXIgTGlxdWlkLFxuICAgIGV4dGVuZCA9IGZ1bmN0aW9uKGNoaWxkLCBwYXJlbnQpIHsgZm9yICh2YXIga2V5IGluIHBhcmVudCkgeyBpZiAoaGFzUHJvcC5jYWxsKHBhcmVudCwga2V5KSkgY2hpbGRba2V5XSA9IHBhcmVudFtrZXldOyB9IGZ1bmN0aW9uIGN0b3IoKSB7IHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDsgfSBjdG9yLnByb3RvdHlwZSA9IHBhcmVudC5wcm90b3R5cGU7IGNoaWxkLnByb3RvdHlwZSA9IG5ldyBjdG9yKCk7IGNoaWxkLl9fc3VwZXJfXyA9IHBhcmVudC5wcm90b3R5cGU7IHJldHVybiBjaGlsZDsgfSxcbiAgICBoYXNQcm9wID0ge30uaGFzT3duUHJvcGVydHk7XG5cbiAgTGlxdWlkID0gcmVxdWlyZSgnLi4vLi4vbGlxdWlkJyk7XG5cbiAgTGlxdWlkLlRhZ3MuQ2FzZSA9IChmdW5jdGlvbihzdXBlckNsYXNzKSB7XG4gICAgdmFyIFN5bnRheCwgV2hlblN5bnRheDtcblxuICAgIGV4dGVuZChDYXNlLCBzdXBlckNsYXNzKTtcblxuICAgIFN5bnRheCA9IFJlZ0V4cChcIihcIiArIExpcXVpZC5TdHJpY3RRdW90ZWRGcmFnbWVudC5zb3VyY2UgKyBcIilcIik7XG5cbiAgICBXaGVuU3ludGF4ID0gUmVnRXhwKFwiKFwiICsgTGlxdWlkLlN0cmljdFF1b3RlZEZyYWdtZW50LnNvdXJjZSArIFwiKSg/Oig/OlxcXFxzK29yXFxcXHMrfFxcXFxzKlxcXFwsXFxcXHMqKShcIiArIExpcXVpZC5TdHJpY3RRdW90ZWRGcmFnbWVudC5zb3VyY2UgKyBcIi4qKSk/XCIpO1xuXG4gICAgZnVuY3Rpb24gQ2FzZSh0YWdOYW1lLCBtYXJrdXAsIHRva2Vucykge1xuICAgICAgdmFyICQ7XG4gICAgICB0aGlzLmJsb2NrcyA9IFtdO1xuICAgICAgdGhpcy5ub2RlbGlzdCA9IFtdO1xuICAgICAgaWYgKCQgPSBtYXJrdXAubWF0Y2goU3ludGF4KSkge1xuICAgICAgICB0aGlzLmxlZnQgPSAkWzFdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IExpcXVpZC5TeW50YXhFcnJvcihcIlN5bnRheCBlcnJvciBpbiAnY2FzZScgLSBWYWxpZCBzeW50YXg6IGNhc2UgW2NvbmRpdGlvbl1cIik7XG4gICAgICB9XG4gICAgICBDYXNlLl9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIHRhZ05hbWUsIG1hcmt1cCwgdG9rZW5zKTtcbiAgICB9XG5cbiAgICBDYXNlLnByb3RvdHlwZS51bmtub3duVGFnID0gZnVuY3Rpb24odGFnLCBtYXJrdXAsIHRva2Vucykge1xuICAgICAgdGhpcy5ub2RlbGlzdCA9IFtdO1xuICAgICAgc3dpdGNoICh0YWcpIHtcbiAgICAgICAgY2FzZSBcIndoZW5cIjpcbiAgICAgICAgICByZXR1cm4gdGhpcy5yZWNvcmRXaGVuQ29uZGl0aW9uKG1hcmt1cCk7XG4gICAgICAgIGNhc2UgXCJlbHNlXCI6XG4gICAgICAgICAgcmV0dXJuIHRoaXMucmVjb3JkRWxzZUNvbmRpdGlvbihtYXJrdXApO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHJldHVybiBDYXNlLl9fc3VwZXJfXy51bmtub3duVGFnLmNhbGwodGhpcywgdGFnLCBtYXJrdXAsIHRva2Vucyk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIENhc2UucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgICAgIHZhciBvdXRwdXQ7XG4gICAgICBvdXRwdXQgPSAnJztcbiAgICAgIGNvbnRleHQuc3RhY2soKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgYmxvY2ssIGV4ZWNFbHNlQmxvY2ssIGksIGxlbiwgcmVmLCByZXN1bHRzO1xuICAgICAgICAgIGV4ZWNFbHNlQmxvY2sgPSB0cnVlO1xuICAgICAgICAgIHJlZiA9IF90aGlzLmJsb2NrcztcbiAgICAgICAgICByZXN1bHRzID0gW107XG4gICAgICAgICAgZm9yIChpID0gMCwgbGVuID0gcmVmLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBibG9jayA9IHJlZltpXTtcbiAgICAgICAgICAgIGlmIChibG9ja1tcImVsc2VcIl0oKSkge1xuICAgICAgICAgICAgICBpZiAoZXhlY0Vsc2VCbG9jayA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChvdXRwdXQgKz0gX3RoaXMucmVuZGVyQWxsKGJsb2NrLmF0dGFjaG1lbnQsIGNvbnRleHQpKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2godm9pZCAwKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChibG9jay5ldmFsdWF0ZShjb250ZXh0KSkge1xuICAgICAgICAgICAgICBleGVjRWxzZUJsb2NrID0gZmFsc2U7XG4gICAgICAgICAgICAgIHJlc3VsdHMucHVzaChvdXRwdXQgKz0gX3RoaXMucmVuZGVyQWxsKGJsb2NrLmF0dGFjaG1lbnQsIGNvbnRleHQpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh2b2lkIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgICAgfTtcbiAgICAgIH0pKHRoaXMpKTtcbiAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgfTtcblxuICAgIENhc2UucHJvdG90eXBlLnJlY29yZFdoZW5Db25kaXRpb24gPSBmdW5jdGlvbihtYXJrdXApIHtcbiAgICAgIHZhciAkLCBibG9jaywgcmVzdWx0cztcbiAgICAgIHJlc3VsdHMgPSBbXTtcbiAgICAgIHdoaWxlIChtYXJrdXApIHtcbiAgICAgICAgaWYgKCEoJCA9IG1hcmt1cC5tYXRjaChXaGVuU3ludGF4KSkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgTGlxdWlkLlN5bnRheEVycm9yKFwiU3ludGF4IGVycm9yIGluIHRhZyAnY2FzZScgLSBWYWxpZCB3aGVuIGNvbmRpdGlvbjogeyUgd2hlbiBbY29uZGl0aW9uXSBbb3IgY29uZGl0aW9uMi4uLl0gJX0gXCIpO1xuICAgICAgICB9XG4gICAgICAgIG1hcmt1cCA9ICRbMl07XG4gICAgICAgIGJsb2NrID0gbmV3IExpcXVpZC5Db25kaXRpb24odGhpcy5sZWZ0LCBcIj09XCIsICRbMV0pO1xuICAgICAgICBibG9jay5hdHRhY2godGhpcy5ub2RlbGlzdCk7XG4gICAgICAgIHJlc3VsdHMucHVzaCh0aGlzLmJsb2Nrcy5wdXNoKGJsb2NrKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0cztcbiAgICB9O1xuXG4gICAgQ2FzZS5wcm90b3R5cGUucmVjb3JkRWxzZUNvbmRpdGlvbiA9IGZ1bmN0aW9uKG1hcmt1cCkge1xuICAgICAgdmFyIGJsb2NrO1xuICAgICAgaWYgKChtYXJrdXAgfHwgXCJcIikudHJpbSgpICE9PSBcIlwiKSB7XG4gICAgICAgIGlmICgobWFya3VwIHx8IFwiXCIpLnRyaW0oKSAhPT0gXCJcIikge1xuICAgICAgICAgIHRocm93IG5ldyBMaXF1aWQuU3ludGF4RXJyb3IoXCJTeW50YXggZXJyb3IgaW4gdGFnICdjYXNlJyAtIFZhbGlkIGVsc2UgY29uZGl0aW9uOiB7JSBlbHNlICV9IChubyBwYXJhbWV0ZXJzKSBcIik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGJsb2NrID0gbmV3IExpcXVpZC5FbHNlQ29uZGl0aW9uKCk7XG4gICAgICBibG9jay5hdHRhY2godGhpcy5ub2RlbGlzdCk7XG4gICAgICByZXR1cm4gdGhpcy5ibG9ja3MucHVzaChibG9jayk7XG4gICAgfTtcblxuICAgIHJldHVybiBDYXNlO1xuXG4gIH0pKExpcXVpZC5CbG9jayk7XG5cbiAgTGlxdWlkLlRlbXBsYXRlLnJlZ2lzdGVyVGFnKFwiY2FzZVwiLCBMaXF1aWQuVGFncy5DYXNlKTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS4xMS4xXG4oZnVuY3Rpb24oKSB7XG4gIHZhciBMaXF1aWQsXG4gICAgZXh0ZW5kID0gZnVuY3Rpb24oY2hpbGQsIHBhcmVudCkgeyBmb3IgKHZhciBrZXkgaW4gcGFyZW50KSB7IGlmIChoYXNQcm9wLmNhbGwocGFyZW50LCBrZXkpKSBjaGlsZFtrZXldID0gcGFyZW50W2tleV07IH0gZnVuY3Rpb24gY3RvcigpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGNoaWxkOyB9IGN0b3IucHJvdG90eXBlID0gcGFyZW50LnByb3RvdHlwZTsgY2hpbGQucHJvdG90eXBlID0gbmV3IGN0b3IoKTsgY2hpbGQuX19zdXBlcl9fID0gcGFyZW50LnByb3RvdHlwZTsgcmV0dXJuIGNoaWxkOyB9LFxuICAgIGhhc1Byb3AgPSB7fS5oYXNPd25Qcm9wZXJ0eTtcblxuICBMaXF1aWQgPSByZXF1aXJlKCcuLi8uLi9saXF1aWQnKTtcblxuICBMaXF1aWQuVGFncy5Db21tZW50ID0gKGZ1bmN0aW9uKHN1cGVyQ2xhc3MpIHtcbiAgICBleHRlbmQoQ29tbWVudCwgc3VwZXJDbGFzcyk7XG5cbiAgICBmdW5jdGlvbiBDb21tZW50KCkge1xuICAgICAgcmV0dXJuIENvbW1lbnQuX19zdXBlcl9fLmNvbnN0cnVjdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgQ29tbWVudC5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oY29udGV4dCkge1xuICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfTtcblxuICAgIHJldHVybiBDb21tZW50O1xuXG4gIH0pKExpcXVpZC5CbG9jayk7XG5cbiAgTGlxdWlkLlRlbXBsYXRlLnJlZ2lzdGVyVGFnKFwiY29tbWVudFwiLCBMaXF1aWQuVGFncy5Db21tZW50KTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS4xMS4xXG4oZnVuY3Rpb24oKSB7XG4gIHZhciBMaXF1aWQsXG4gICAgZXh0ZW5kID0gZnVuY3Rpb24oY2hpbGQsIHBhcmVudCkgeyBmb3IgKHZhciBrZXkgaW4gcGFyZW50KSB7IGlmIChoYXNQcm9wLmNhbGwocGFyZW50LCBrZXkpKSBjaGlsZFtrZXldID0gcGFyZW50W2tleV07IH0gZnVuY3Rpb24gY3RvcigpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGNoaWxkOyB9IGN0b3IucHJvdG90eXBlID0gcGFyZW50LnByb3RvdHlwZTsgY2hpbGQucHJvdG90eXBlID0gbmV3IGN0b3IoKTsgY2hpbGQuX19zdXBlcl9fID0gcGFyZW50LnByb3RvdHlwZTsgcmV0dXJuIGNoaWxkOyB9LFxuICAgIGhhc1Byb3AgPSB7fS5oYXNPd25Qcm9wZXJ0eTtcblxuICBMaXF1aWQgPSByZXF1aXJlKCcuLi8uLi9saXF1aWQnKTtcblxuICBMaXF1aWQuVGFncy5Db250aW51ZSA9IChmdW5jdGlvbihzdXBlckNsYXNzKSB7XG4gICAgZXh0ZW5kKENvbnRpbnVlLCBzdXBlckNsYXNzKTtcblxuICAgIGZ1bmN0aW9uIENvbnRpbnVlKCkge1xuICAgICAgcmV0dXJuIENvbnRpbnVlLl9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIENvbnRpbnVlLnByb3RvdHlwZS5pbnRlcnJ1cHQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgTGlxdWlkLkNvbnRpbnVlSW50ZXJydXB0O1xuICAgIH07XG5cbiAgICByZXR1cm4gQ29udGludWU7XG5cbiAgfSkoTGlxdWlkLlRhZyk7XG5cbiAgTGlxdWlkLlRlbXBsYXRlLnJlZ2lzdGVyVGFnKFwiY29udGludWVcIiwgTGlxdWlkLlRhZ3MuQ29udGludWUpO1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjExLjFcbihmdW5jdGlvbigpIHtcbiAgdmFyIExpcXVpZCxcbiAgICBleHRlbmQgPSBmdW5jdGlvbihjaGlsZCwgcGFyZW50KSB7IGZvciAodmFyIGtleSBpbiBwYXJlbnQpIHsgaWYgKGhhc1Byb3AuY2FsbChwYXJlbnQsIGtleSkpIGNoaWxkW2tleV0gPSBwYXJlbnRba2V5XTsgfSBmdW5jdGlvbiBjdG9yKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gY2hpbGQ7IH0gY3Rvci5wcm90b3R5cGUgPSBwYXJlbnQucHJvdG90eXBlOyBjaGlsZC5wcm90b3R5cGUgPSBuZXcgY3RvcigpOyBjaGlsZC5fX3N1cGVyX18gPSBwYXJlbnQucHJvdG90eXBlOyByZXR1cm4gY2hpbGQ7IH0sXG4gICAgaGFzUHJvcCA9IHt9Lmhhc093blByb3BlcnR5O1xuXG4gIExpcXVpZCA9IHJlcXVpcmUoJy4uLy4uL2xpcXVpZCcpO1xuXG4gIExpcXVpZC5UYWdzLkN5Y2xlID0gKGZ1bmN0aW9uKHN1cGVyQ2xhc3MpIHtcbiAgICB2YXIgTmFtZWRTeW50YXgsIFNpbXBsZVN5bnRheDtcblxuICAgIGV4dGVuZChDeWNsZSwgc3VwZXJDbGFzcyk7XG5cbiAgICBTaW1wbGVTeW50YXggPSBSZWdFeHAoXCJeXCIgKyBMaXF1aWQuU3RyaWN0UXVvdGVkRnJhZ21lbnQuc291cmNlKTtcblxuICAgIE5hbWVkU3ludGF4ID0gUmVnRXhwKFwiXihcIiArIExpcXVpZC5TdHJpY3RRdW90ZWRGcmFnbWVudC5zb3VyY2UgKyBcIilcXFxccypcXFxcOlxcXFxzKiguKilcIik7XG5cbiAgICBmdW5jdGlvbiBDeWNsZSh0YWcsIG1hcmt1cCwgdG9rZW5zKSB7XG4gICAgICB2YXIgJDtcbiAgICAgIGlmICgkID0gbWFya3VwLm1hdGNoKE5hbWVkU3ludGF4KSkge1xuICAgICAgICB0aGlzLnZhcmlhYmxlcyA9IHRoaXMudmFyaWFibGVzRnJvbVN0cmluZygkWzJdKTtcbiAgICAgICAgdGhpcy5uYW1lID0gJFsxXTtcbiAgICAgIH0gZWxzZSBpZiAoJCA9IG1hcmt1cC5tYXRjaChTaW1wbGVTeW50YXgpKSB7XG4gICAgICAgIHRoaXMudmFyaWFibGVzID0gdGhpcy52YXJpYWJsZXNGcm9tU3RyaW5nKG1hcmt1cCk7XG4gICAgICAgIHRoaXMubmFtZSA9IFwiJ1wiICsgKHRoaXMudmFyaWFibGVzLnRvU3RyaW5nKCkpICsgXCInXCI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgTGlxdWlkLlN5bnRheEVycm9yKFwiU3ludGF4IGVycm9yIGluICdjeWNsZScgLSBWYWxpZCBzeW50YXg6IGN5Y2xlIFtuYW1lIDpdIHZhciBbLCB2YXIyLCB2YXIzIC4uLl1cIik7XG4gICAgICB9XG4gICAgICBDeWNsZS5fX3N1cGVyX18uY29uc3RydWN0b3IuY2FsbCh0aGlzLCB0YWcsIG1hcmt1cCwgdG9rZW5zKTtcbiAgICB9XG5cbiAgICBDeWNsZS5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oY29udGV4dCkge1xuICAgICAgdmFyIGJhc2UsIG91dHB1dDtcbiAgICAgIChiYXNlID0gY29udGV4dC5yZWdpc3RlcnMpLmN5Y2xlIHx8IChiYXNlLmN5Y2xlID0ge30pO1xuICAgICAgb3V0cHV0ID0gJyc7XG4gICAgICBjb250ZXh0LnN0YWNrKChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIGl0ZXJhdGlvbiwga2V5LCByZWYsIHJlc3VsdDtcbiAgICAgICAgICBrZXkgPSBjb250ZXh0LmdldChfdGhpcy5uYW1lKTtcbiAgICAgICAgICBpdGVyYXRpb24gPSAocmVmID0gY29udGV4dC5yZWdpc3RlcnMuY3ljbGVba2V5XSkgIT0gbnVsbCA/IHJlZiA6IDA7XG4gICAgICAgICAgcmVzdWx0ID0gY29udGV4dC5nZXQoX3RoaXMudmFyaWFibGVzW2l0ZXJhdGlvbl0pO1xuICAgICAgICAgIGl0ZXJhdGlvbiArPSAxO1xuICAgICAgICAgIGlmIChpdGVyYXRpb24gPj0gX3RoaXMudmFyaWFibGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgaXRlcmF0aW9uID0gMDtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29udGV4dC5yZWdpc3RlcnMuY3ljbGVba2V5XSA9IGl0ZXJhdGlvbjtcbiAgICAgICAgICByZXR1cm4gb3V0cHV0ID0gcmVzdWx0O1xuICAgICAgICB9O1xuICAgICAgfSkodGhpcykpO1xuICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9O1xuXG4gICAgQ3ljbGUucHJvdG90eXBlLnZhcmlhYmxlc0Zyb21TdHJpbmcgPSBmdW5jdGlvbihtYXJrdXApIHtcbiAgICAgIHZhciAkLCBpLCBsZW4sIHJlZiwgcmVzdWx0cywgdmFybmFtZTtcbiAgICAgIHJlZiA9IG1hcmt1cC5zcGxpdCgnLCcpO1xuICAgICAgcmVzdWx0cyA9IFtdO1xuICAgICAgZm9yIChpID0gMCwgbGVuID0gcmVmLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIHZhcm5hbWUgPSByZWZbaV07XG4gICAgICAgICQgPSB2YXJuYW1lLm1hdGNoKFJlZ0V4cChcIlxcXFxzKihcIiArIExpcXVpZC5TdHJpY3RRdW90ZWRGcmFnbWVudC5zb3VyY2UgKyBcIilcXFxccypcIikpO1xuICAgICAgICBpZiAoJFsxXSkge1xuICAgICAgICAgIHJlc3VsdHMucHVzaCgkWzFdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXN1bHRzLnB1c2gobnVsbCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH07XG5cbiAgICByZXR1cm4gQ3ljbGU7XG5cbiAgfSkoTGlxdWlkLlRhZyk7XG5cbiAgTGlxdWlkLlRlbXBsYXRlLnJlZ2lzdGVyVGFnKFwiY3ljbGVcIiwgTGlxdWlkLlRhZ3MuQ3ljbGUpO1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjExLjFcbihmdW5jdGlvbigpIHtcbiAgdmFyIExpcXVpZCxcbiAgICBleHRlbmQgPSBmdW5jdGlvbihjaGlsZCwgcGFyZW50KSB7IGZvciAodmFyIGtleSBpbiBwYXJlbnQpIHsgaWYgKGhhc1Byb3AuY2FsbChwYXJlbnQsIGtleSkpIGNoaWxkW2tleV0gPSBwYXJlbnRba2V5XTsgfSBmdW5jdGlvbiBjdG9yKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gY2hpbGQ7IH0gY3Rvci5wcm90b3R5cGUgPSBwYXJlbnQucHJvdG90eXBlOyBjaGlsZC5wcm90b3R5cGUgPSBuZXcgY3RvcigpOyBjaGlsZC5fX3N1cGVyX18gPSBwYXJlbnQucHJvdG90eXBlOyByZXR1cm4gY2hpbGQ7IH0sXG4gICAgaGFzUHJvcCA9IHt9Lmhhc093blByb3BlcnR5O1xuXG4gIExpcXVpZCA9IHJlcXVpcmUoJy4uLy4uL2xpcXVpZCcpO1xuXG4gIExpcXVpZC5UYWdzLkRlY3JlbWVudCA9IChmdW5jdGlvbihzdXBlckNsYXNzKSB7XG4gICAgZXh0ZW5kKERlY3JlbWVudCwgc3VwZXJDbGFzcyk7XG5cbiAgICBmdW5jdGlvbiBEZWNyZW1lbnQodGFnTmFtZSwgbWFya3VwLCB0b2tlbnMpIHtcbiAgICAgIHRoaXMudmFyaWFibGUgPSBtYXJrdXAudHJpbSgpO1xuICAgICAgRGVjcmVtZW50Ll9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIHRhZ05hbWUsIG1hcmt1cCwgdG9rZW5zKTtcbiAgICB9XG5cbiAgICBEZWNyZW1lbnQucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgICAgIHZhciBiYXNlLCBuYW1lLCB2YWx1ZTtcbiAgICAgIHZhbHVlID0gKGJhc2UgPSBjb250ZXh0LnNjb3Blc1swXSlbbmFtZSA9IHRoaXMudmFyaWFibGVdIHx8IChiYXNlW25hbWVdID0gMCk7XG4gICAgICB2YWx1ZSA9IHZhbHVlIC0gMTtcbiAgICAgIGNvbnRleHQuc2NvcGVzWzBdW3RoaXMudmFyaWFibGVdID0gdmFsdWU7XG4gICAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIERlY3JlbWVudDtcblxuICB9KShMaXF1aWQuVGFnKTtcblxuICBMaXF1aWQuVGVtcGxhdGUucmVnaXN0ZXJUYWcoXCJkZWNyZW1lbnRcIiwgTGlxdWlkLlRhZ3MuRGVjcmVtZW50KTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS4xMS4xXG4oZnVuY3Rpb24oKSB7XG4gIHZhciBMaXF1aWQsXG4gICAgZXh0ZW5kID0gZnVuY3Rpb24oY2hpbGQsIHBhcmVudCkgeyBmb3IgKHZhciBrZXkgaW4gcGFyZW50KSB7IGlmIChoYXNQcm9wLmNhbGwocGFyZW50LCBrZXkpKSBjaGlsZFtrZXldID0gcGFyZW50W2tleV07IH0gZnVuY3Rpb24gY3RvcigpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGNoaWxkOyB9IGN0b3IucHJvdG90eXBlID0gcGFyZW50LnByb3RvdHlwZTsgY2hpbGQucHJvdG90eXBlID0gbmV3IGN0b3IoKTsgY2hpbGQuX19zdXBlcl9fID0gcGFyZW50LnByb3RvdHlwZTsgcmV0dXJuIGNoaWxkOyB9LFxuICAgIGhhc1Byb3AgPSB7fS5oYXNPd25Qcm9wZXJ0eTtcblxuICBMaXF1aWQgPSByZXF1aXJlKCcuLi8uLi9saXF1aWQnKTtcblxuICBMaXF1aWQuVGFncy5FeHRlbmRzID0gKGZ1bmN0aW9uKHN1cGVyQ2xhc3MpIHtcbiAgICB2YXIgQ29udGVudE9mVmFyaWFibGUsIEZ1bGxUb2tlbiwgSXNUYWcsIElzVmFyaWFibGUsIFN5bnRheDtcblxuICAgIGV4dGVuZChFeHRlbmRzLCBzdXBlckNsYXNzKTtcblxuICAgIFN5bnRheCA9IFJlZ0V4cChcIihcIiArIExpcXVpZC5RdW90ZWRGcmFnbWVudC5zb3VyY2UgKyBcIilcIik7XG5cbiAgICBJc1RhZyA9IFJlZ0V4cChcIl5cIiArIExpcXVpZC5UYWdTdGFydC5zb3VyY2UpO1xuXG4gICAgSXNWYXJpYWJsZSA9IFJlZ0V4cChcIl5cIiArIExpcXVpZC5WYXJpYWJsZVN0YXJ0LnNvdXJjZSk7XG5cbiAgICBGdWxsVG9rZW4gPSBSZWdFeHAoXCJeXCIgKyBMaXF1aWQuVGFnU3RhcnQuc291cmNlICsgXCJcXFxccyooXFxcXHcrKVxcXFxzKiguKik/XCIgKyBMaXF1aWQuVGFnRW5kLnNvdXJjZSArIFwiJFwiKTtcblxuICAgIENvbnRlbnRPZlZhcmlhYmxlID0gUmVnRXhwKFwiXlwiICsgTGlxdWlkLlZhcmlhYmxlU3RhcnQuc291cmNlICsgXCIoLiopXCIgKyBMaXF1aWQuVmFyaWFibGVFbmQuc291cmNlICsgXCIkXCIpO1xuXG4gICAgZnVuY3Rpb24gRXh0ZW5kcyh0YWdOYW1lLCBtYXJrdXAsIHRva2Vucykge1xuICAgICAgdmFyICQsIGksIGxlbiwgbSwgbm9kZSwgcmVmO1xuICAgICAgaWYgKCgkID0gbWFya3VwLm1hdGNoKFN5bnRheCkpKSB7XG4gICAgICAgIHRoaXMudGVtcGxhdGVOYW1lID0gJFsxXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBMaXF1aWQuU3ludGF4RXJyb3IoXCJTeW50YXggRXJyb3IgaW4gJ2V4dGVuZHMnIC0gVmFsaWQgc3ludGF4OiBleHRlbmRzIFt0ZW1wbGF0ZV1cIik7XG4gICAgICB9XG4gICAgICBFeHRlbmRzLl9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgbSA9IHt9O1xuICAgICAgcmVmID0gdGhpcy5ub2RlbGlzdDtcbiAgICAgIGZvciAoaSA9IDAsIGxlbiA9IHJlZi5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBub2RlID0gcmVmW2ldO1xuICAgICAgICBpZiAobm9kZSBpbnN0YW5jZW9mIExpcXVpZC5UYWdzLkJsb2NrKSB7XG4gICAgICAgICAgbVtub2RlLm5hbWVdID0gbm9kZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5ibG9ja3MgPSBtO1xuICAgIH1cblxuICAgIEV4dGVuZHMucHJvdG90eXBlLnBhcnNlID0gZnVuY3Rpb24odG9rZW5zKSB7XG4gICAgICByZXR1cm4gdGhpcy5wYXJzZUFsbCh0b2tlbnMpO1xuICAgIH07XG5cbiAgICBFeHRlbmRzLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gICAgICB2YXIgYmxvY2ssIG5hbWUsIHBhcmVudEJsb2NrcywgcGIsIHJlZiwgdGVtcGxhdGU7XG4gICAgICB0ZW1wbGF0ZSA9IHRoaXMubG9hZFRlbXBsYXRlKGNvbnRleHQpO1xuICAgICAgcGFyZW50QmxvY2tzID0gdGhpcy5maW5kQmxvY2tzKHRlbXBsYXRlLnJvb3QpO1xuICAgICAgcmVmID0gdGhpcy5ibG9ja3M7XG4gICAgICBmb3IgKG5hbWUgaW4gcmVmKSB7XG4gICAgICAgIGJsb2NrID0gcmVmW25hbWVdO1xuICAgICAgICBpZiAoKHBiID0gcGFyZW50QmxvY2tzW25hbWVdKSAhPSBudWxsKSB7XG4gICAgICAgICAgcGIucGFyZW50ID0gYmxvY2sucGFyZW50O1xuICAgICAgICAgIHBiLmFkZFBhcmVudChwYi5ub2RlbGlzdCk7XG4gICAgICAgICAgcGIubm9kZWxpc3QgPSBibG9jay5ub2RlbGlzdDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAodGhpcy5pc0V4dGVuZGluZyh0ZW1wbGF0ZSkpIHtcbiAgICAgICAgICAgIHRlbXBsYXRlLnJvb3Qubm9kZWxpc3QucHVzaChibG9jayk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdGVtcGxhdGUucmVuZGVyKGNvbnRleHQpO1xuICAgIH07XG5cbiAgICBFeHRlbmRzLnByb3RvdHlwZS5wYXJzZUFsbCA9IGZ1bmN0aW9uKHRva2Vucykge1xuICAgICAgdmFyICQsIHJlc3VsdHMsIHRhZywgdG9rZW47XG4gICAgICB0aGlzLm5vZGVsaXN0IHx8ICh0aGlzLm5vZGVsaXN0ID0gW10pO1xuICAgICAgdGhpcy5ub2RlbGlzdC5sZW5ndGggPSAwO1xuICAgICAgcmVzdWx0cyA9IFtdO1xuICAgICAgd2hpbGUgKCh0b2tlbiA9IHRva2Vucy5zaGlmdCgpKSAhPSBudWxsKSB7XG4gICAgICAgIGlmIChJc1RhZy50ZXN0KHRva2VuKSkge1xuICAgICAgICAgIGlmICgoJCA9IHRva2VuLm1hdGNoKEZ1bGxUb2tlbikpKSB7XG4gICAgICAgICAgICBpZiAodGFnID0gTGlxdWlkLlRlbXBsYXRlLnRhZ3NbJFsxXV0pIHtcbiAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHRoaXMubm9kZWxpc3QucHVzaChuZXcgdGFnKCRbMV0sICRbMl0sIHRva2VucykpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh0aGlzLnVua25vd25UYWcoJFsxXSwgJFsyXSwgdG9rZW5zKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBMaXF1aWQuU3ludGF4RXJyb3IoXCJUYWcgJ1wiICsgdG9rZW4gKyBcIicgd2FzIG5vdCBwcm9wZXJseSB0ZXJtaW5hdGVkIHdpdGggcmVnZXhwOiBcIiArIFRhZ0VuZC5pbnNwZWN0ICsgXCIgXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChJc1ZhcmlhYmxlLnRlc3QodG9rZW4pKSB7XG4gICAgICAgICAgcmVzdWx0cy5wdXNoKHRoaXMubm9kZWxpc3QucHVzaCh0aGlzLmNyZWF0ZVZhcmlhYmxlKHRva2VuKSkpO1xuICAgICAgICB9IGVsc2UgaWYgKHRva2VuID09PSAnJykge1xuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzdWx0cy5wdXNoKHRoaXMubm9kZWxpc3QucHVzaCh0b2tlbikpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0cztcbiAgICB9O1xuXG4gICAgRXh0ZW5kcy5wcm90b3R5cGUubG9hZFRlbXBsYXRlID0gZnVuY3Rpb24oY29udGV4dCkge1xuICAgICAgdmFyIHNvdXJjZTtcbiAgICAgIHNvdXJjZSA9IExpcXVpZC5UZW1wbGF0ZS5maWxlU3lzdGVtLnJlYWRUZW1wbGF0ZUZpbGUoY29udGV4dC5nZXQodGhpcy50ZW1wbGF0ZU5hbWUpKTtcbiAgICAgIHJldHVybiBMaXF1aWQuVGVtcGxhdGUucGFyc2Uoc291cmNlKTtcbiAgICB9O1xuXG4gICAgRXh0ZW5kcy5wcm90b3R5cGUuZmluZEJsb2NrcyA9IGZ1bmN0aW9uKG5vZGUsIGJsb2Nrcykge1xuICAgICAgdmFyIGIsIGksIGxlbiwgcmVmO1xuICAgICAgaWYgKGJsb2NrcyA9PSBudWxsKSB7XG4gICAgICAgIGJsb2NrcyA9IHt9O1xuICAgICAgfVxuICAgICAgaWYgKG5vZGUubm9kZWxpc3QgIT0gbnVsbCkge1xuICAgICAgICBiID0gYmxvY2tzO1xuICAgICAgICByZWYgPSBub2RlLm5vZGVsaXN0O1xuICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSByZWYubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICBub2RlID0gcmVmW2ldO1xuICAgICAgICAgIGlmIChub2RlIGluc3RhbmNlb2YgTGlxdWlkLlRhZ3MuQmxvY2spIHtcbiAgICAgICAgICAgIGJbbm9kZS5uYW1lXSA9IG5vZGU7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZmluZEJsb2Nrcyhub2RlLCBiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGJsb2NrcztcbiAgICB9O1xuXG4gICAgRXh0ZW5kcy5wcm90b3R5cGUuaXNFeHRlbmRpbmcgPSBmdW5jdGlvbih0ZW1wbGF0ZSkge1xuICAgICAgdmFyIGksIGxlbiwgbm9kZSwgcmVmO1xuICAgICAgcmVmID0gdGVtcGxhdGUucm9vdC5ub2RlbGlzdDtcbiAgICAgIGZvciAoaSA9IDAsIGxlbiA9IHJlZi5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBub2RlID0gcmVmW2ldO1xuICAgICAgICBpZiAobm9kZSBpbnN0YW5jZW9mIEV4dGVuZHMpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG5cbiAgICByZXR1cm4gRXh0ZW5kcztcblxuICB9KShMaXF1aWQuQmxvY2spO1xuXG4gIExpcXVpZC5UZW1wbGF0ZS5yZWdpc3RlclRhZyhcImV4dGVuZHNcIiwgTGlxdWlkLlRhZ3MuRXh0ZW5kcyk7XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuMTEuMVxuKGZ1bmN0aW9uKCkge1xuICB2YXIgTGlxdWlkLFxuICAgIGV4dGVuZCA9IGZ1bmN0aW9uKGNoaWxkLCBwYXJlbnQpIHsgZm9yICh2YXIga2V5IGluIHBhcmVudCkgeyBpZiAoaGFzUHJvcC5jYWxsKHBhcmVudCwga2V5KSkgY2hpbGRba2V5XSA9IHBhcmVudFtrZXldOyB9IGZ1bmN0aW9uIGN0b3IoKSB7IHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDsgfSBjdG9yLnByb3RvdHlwZSA9IHBhcmVudC5wcm90b3R5cGU7IGNoaWxkLnByb3RvdHlwZSA9IG5ldyBjdG9yKCk7IGNoaWxkLl9fc3VwZXJfXyA9IHBhcmVudC5wcm90b3R5cGU7IHJldHVybiBjaGlsZDsgfSxcbiAgICBoYXNQcm9wID0ge30uaGFzT3duUHJvcGVydHk7XG5cbiAgTGlxdWlkID0gcmVxdWlyZSgnLi4vLi4vbGlxdWlkJyk7XG5cbiAgTGlxdWlkLlRhZ3MuRm9yID0gKGZ1bmN0aW9uKHN1cGVyQ2xhc3MpIHtcbiAgICB2YXIgU3ludGF4O1xuXG4gICAgZXh0ZW5kKEZvciwgc3VwZXJDbGFzcyk7XG5cbiAgICBTeW50YXggPSBSZWdFeHAoXCIoXFxcXHcrKVxcXFxzK2luXFxcXHMrKFwiICsgTGlxdWlkLlN0cmljdFF1b3RlZEZyYWdtZW50LnNvdXJjZSArIFwiKVxcXFxzKihyZXZlcnNlZCk/XCIpO1xuXG4gICAgZnVuY3Rpb24gRm9yKHRhZywgbWFya3VwLCB0b2tlbnMpIHtcbiAgICAgIHZhciAkO1xuICAgICAgaWYgKCQgPSBtYXJrdXAubWF0Y2goU3ludGF4KSkge1xuICAgICAgICB0aGlzLnZhcmlhYmxlTmFtZSA9ICRbMV07XG4gICAgICAgIHRoaXMuY29sbGVjdGlvbk5hbWUgPSAkWzJdO1xuICAgICAgICB0aGlzLm5hbWUgPSAkWzFdICsgXCItXCIgKyAkWzJdO1xuICAgICAgICB0aGlzLnJldmVyc2VkID0gJFszXTtcbiAgICAgICAgdGhpcy5hdHRyaWJ1dGVzID0ge307XG4gICAgICAgIG1hcmt1cC5yZXBsYWNlKExpcXVpZC5UYWdBdHRyaWJ1dGVzLCAoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oJDAsIGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy5hdHRyaWJ1dGVzW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICB9O1xuICAgICAgICB9KSh0aGlzKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgTGlxdWlkLlN5bnRheEVycm9yKFwiU3ludGF4IEVycm9yIGluICdmb3IgbG9vcCcgLSBWYWxpZCBzeW50YXg6IGZvciBbaXRlbV0gaW4gW2NvbGxlY3Rpb25dXCIpO1xuICAgICAgfVxuICAgICAgRm9yLl9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIHRhZywgbWFya3VwLCB0b2tlbnMpO1xuICAgIH1cblxuICAgIEZvci5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oY29udGV4dCkge1xuICAgICAgdmFyIGNvbGxlY3Rpb24sIGZyb20sIGssIGxlbmd0aCwgbGltaXQsIHJlc3VsdCwgc2VnbWVudCwgdG8sIHY7XG4gICAgICBpZiAoY29udGV4dC5yZWdpc3RlcnNbXCJmb3JcIl0gPT0gbnVsbCkge1xuICAgICAgICBjb250ZXh0LnJlZ2lzdGVyc1tcImZvclwiXSA9IHt9O1xuICAgICAgfVxuICAgICAgY29sbGVjdGlvbiA9IGNvbnRleHQuZ2V0KHRoaXMuY29sbGVjdGlvbk5hbWUpO1xuICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGNvbGxlY3Rpb24pKSB7XG4gICAgICAgIGNvbGxlY3Rpb24gPSAoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIHJlc3VsdHM7XG4gICAgICAgICAgcmVzdWx0cyA9IFtdO1xuICAgICAgICAgIGZvciAoayBpbiBjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICB2ID0gY29sbGVjdGlvbltrXTtcbiAgICAgICAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgICAgICAgIGtleTogayxcbiAgICAgICAgICAgICAgdmFsdWU6IHZcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgICAgfSkoKTtcbiAgICAgIH1cbiAgICAgIGZyb20gPSB0aGlzLmF0dHJpYnV0ZXNbJ29mZnNldCddID09PSAnY29udGludWUnID8gY29udGV4dC5yZWdpc3RlcnNbXCJmb3JcIl1bdGhpcy5uYW1lXSA6IGNvbnRleHQuZ2V0KHRoaXMuYXR0cmlidXRlc1snb2Zmc2V0J10pO1xuICAgICAgbGltaXQgPSBjb250ZXh0LmdldCh0aGlzLmF0dHJpYnV0ZXNbJ2xpbWl0J10pO1xuICAgICAgdG8gPSBsaW1pdCA/IGxpbWl0ICsgZnJvbSA6IGNvbGxlY3Rpb24ubGVuZ3RoO1xuICAgICAgc2VnbWVudCA9IGNvbGxlY3Rpb24uc2xpY2UoZnJvbSwgdG8pO1xuICAgICAgaWYgKHNlZ21lbnQubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiAnJztcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLnJldmVyc2VkKSB7XG4gICAgICAgIHNlZ21lbnQucmV2ZXJzZSgpO1xuICAgICAgfVxuICAgICAgcmVzdWx0ID0gJyc7XG4gICAgICBsZW5ndGggPSBzZWdtZW50Lmxlbmd0aDtcbiAgICAgIGNvbnRleHQucmVnaXN0ZXJzW1wiZm9yXCJdW3RoaXMubmFtZV0gPSBmcm9tICsgc2VnbWVudC5sZW5ndGg7XG4gICAgICBjb250ZXh0LnN0YWNrKChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIGksIGluZGV4LCBpbnRlcnJ1cHQsIGl0ZW0sIGxlbiwgcmVzdWx0cztcbiAgICAgICAgICByZXN1bHRzID0gW107XG4gICAgICAgICAgZm9yIChpbmRleCA9IGkgPSAwLCBsZW4gPSBzZWdtZW50Lmxlbmd0aDsgaSA8IGxlbjsgaW5kZXggPSArK2kpIHtcbiAgICAgICAgICAgIGl0ZW0gPSBzZWdtZW50W2luZGV4XTtcbiAgICAgICAgICAgIGNvbnRleHQuc2V0KF90aGlzLnZhcmlhYmxlTmFtZSwgaXRlbSk7XG4gICAgICAgICAgICBjb250ZXh0LnNldCgnZm9ybG9vcCcsIHtcbiAgICAgICAgICAgICAgbmFtZTogX3RoaXMubmFtZSxcbiAgICAgICAgICAgICAgbGVuZ3RoOiBsZW5ndGgsXG4gICAgICAgICAgICAgIGluZGV4OiBpbmRleCArIDEsXG4gICAgICAgICAgICAgIGluZGV4MDogaW5kZXgsXG4gICAgICAgICAgICAgIHJpbmRleDogbGVuZ3RoIC0gaW5kZXgsXG4gICAgICAgICAgICAgIHJpbmRleDA6IGxlbmd0aCAtIGluZGV4IC0gMSxcbiAgICAgICAgICAgICAgZmlyc3Q6IGluZGV4ID09PSAwLFxuICAgICAgICAgICAgICBsYXN0OiBpbmRleCA9PT0gbGVuZ3RoIC0gMVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXN1bHQgKz0gX3RoaXMucmVuZGVyQWxsKF90aGlzLm5vZGVsaXN0LCBjb250ZXh0KTtcbiAgICAgICAgICAgIGlmIChjb250ZXh0Lmhhc0ludGVycnVwdCgpKSB7XG4gICAgICAgICAgICAgIGludGVycnVwdCA9IGNvbnRleHQucG9wSW50ZXJydXB0KCk7XG4gICAgICAgICAgICAgIGlmIChpbnRlcnJ1cHQgaW5zdGFuY2VvZiBMaXF1aWQuQnJlYWtJbnRlcnJ1cHQpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoaW50ZXJydXB0IGluc3RhbmNlb2YgTGlxdWlkLkNvbnRpbnVlSW50ZXJydXB0KSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHZvaWQgMCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh2b2lkIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgICAgfTtcbiAgICAgIH0pKHRoaXMpKTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcblxuICAgIHJldHVybiBGb3I7XG5cbiAgfSkoTGlxdWlkLkJsb2NrKTtcblxuICBMaXF1aWQuVGVtcGxhdGUucmVnaXN0ZXJUYWcoXCJmb3JcIiwgTGlxdWlkLlRhZ3MuRm9yKTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS4xMS4xXG4oZnVuY3Rpb24oKSB7XG4gIHZhciBMaXF1aWQsXG4gICAgZXh0ZW5kID0gZnVuY3Rpb24oY2hpbGQsIHBhcmVudCkgeyBmb3IgKHZhciBrZXkgaW4gcGFyZW50KSB7IGlmIChoYXNQcm9wLmNhbGwocGFyZW50LCBrZXkpKSBjaGlsZFtrZXldID0gcGFyZW50W2tleV07IH0gZnVuY3Rpb24gY3RvcigpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGNoaWxkOyB9IGN0b3IucHJvdG90eXBlID0gcGFyZW50LnByb3RvdHlwZTsgY2hpbGQucHJvdG90eXBlID0gbmV3IGN0b3IoKTsgY2hpbGQuX19zdXBlcl9fID0gcGFyZW50LnByb3RvdHlwZTsgcmV0dXJuIGNoaWxkOyB9LFxuICAgIGhhc1Byb3AgPSB7fS5oYXNPd25Qcm9wZXJ0eTtcblxuICBMaXF1aWQgPSByZXF1aXJlKCcuLi8uLi9saXF1aWQnKTtcblxuICBMaXF1aWQuVGFncy5JZiA9IChmdW5jdGlvbihzdXBlckNsYXNzKSB7XG4gICAgdmFyIEV4cHJlc3Npb25zQW5kT3BlcmF0b3JzLCBTeW50YXgsIFN5bnRheEhlbHA7XG5cbiAgICBleHRlbmQoSWYsIHN1cGVyQ2xhc3MpO1xuXG4gICAgU3ludGF4SGVscCA9IFwiU3ludGF4IEVycm9yIGluIHRhZyAnaWYnIC0gVmFsaWQgc3ludGF4OiBpZiBbZXhwcmVzc2lvbl1cIjtcblxuICAgIFN5bnRheCA9IFJlZ0V4cChcIihcIiArIExpcXVpZC5TdHJpY3RRdW90ZWRGcmFnbWVudC5zb3VyY2UgKyBcIilcXFxccyooWz0hPD5hLXpfXSspP1xcXFxzKihcIiArIExpcXVpZC5TdHJpY3RRdW90ZWRGcmFnbWVudC5zb3VyY2UgKyBcIik/XCIpO1xuXG4gICAgRXhwcmVzc2lvbnNBbmRPcGVyYXRvcnMgPSBSZWdFeHAoXCIoPzpcXFxcYig/OlxcXFxzP2FuZFxcXFxzP3xcXFxccz9vclxcXFxzPylcXFxcYnwoPzpcXFxccyooPyFcXFxcYig/OlxcXFxzP2FuZFxcXFxzP3xcXFxccz9vclxcXFxzPylcXFxcYikoPzpcIiArIExpcXVpZC5TdHJpY3RRdW90ZWRGcmFnbWVudC5zb3VyY2UgKyBcInxcXFxcUyspXFxcXHMqKSspXCIsIFwiZ1wiKTtcblxuICAgIGZ1bmN0aW9uIElmKHRhZywgbWFya3VwLCB0b2tlbnMpIHtcbiAgICAgIHRoaXMubm9kZWxpc3QgPSBbXTtcbiAgICAgIHRoaXMuYmxvY2tzID0gW107XG4gICAgICB0aGlzLnB1c2hCbG9jayhcImlmXCIsIG1hcmt1cCk7XG4gICAgICBJZi5fX3N1cGVyX18uY29uc3RydWN0b3IuY2FsbCh0aGlzLCB0YWcsIG1hcmt1cCwgdG9rZW5zKTtcbiAgICB9XG5cbiAgICBJZi5wcm90b3R5cGUudW5rbm93blRhZyA9IGZ1bmN0aW9uKHRhZywgbWFya3VwLCB0b2tlbnMpIHtcbiAgICAgIGlmICh0YWcgPT09IFwiZWxzaWZcIiB8fCB0YWcgPT09IFwiZWxzZVwiKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnB1c2hCbG9jayh0YWcsIG1hcmt1cCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gSWYuX19zdXBlcl9fLnVua25vd25UYWcuY2FsbCh0aGlzLCB0YWcsIG1hcmt1cCwgdG9rZW5zKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgSWYucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgICAgIHZhciBvdXRwdXQ7XG4gICAgICBvdXRwdXQgPSAnJztcbiAgICAgIGNvbnRleHQuc3RhY2soKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgYmxvY2ssIGksIGxlbiwgcmVmO1xuICAgICAgICAgIHJlZiA9IF90aGlzLmJsb2NrcztcbiAgICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSByZWYubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGJsb2NrID0gcmVmW2ldO1xuICAgICAgICAgICAgaWYgKGJsb2NrLmV2YWx1YXRlKGNvbnRleHQpKSB7XG4gICAgICAgICAgICAgIG91dHB1dCA9IF90aGlzLnJlbmRlckFsbChibG9jay5hdHRhY2htZW50LCBjb250ZXh0KTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKSk7XG4gICAgICByZXR1cm4gb3V0cHV0O1xuICAgIH07XG5cbiAgICBJZi5wcm90b3R5cGUucHVzaEJsb2NrID0gZnVuY3Rpb24odGFnLCBtYXJrdXApIHtcbiAgICAgIHZhciAkLCBibG9jaywgY29uZGl0aW9uLCBleHByZXNzaW9ucywgbmV3Q29uZGl0aW9uLCBvcGVyYXRvcjtcbiAgICAgIGJsb2NrID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGFnID09PSAnZWxzZScpIHtcbiAgICAgICAgICByZXR1cm4gbmV3IExpcXVpZC5FbHNlQ29uZGl0aW9uO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGV4cHJlc3Npb25zID0gbWFya3VwLm1hdGNoKEV4cHJlc3Npb25zQW5kT3BlcmF0b3JzKS5yZXZlcnNlKCk7XG4gICAgICAgICAgaWYgKCEoJCA9IGV4cHJlc3Npb25zLnNoaWZ0KCkubWF0Y2goU3ludGF4KSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBMaXF1aWQuU3ludGF4RXJyb3IoU3ludGF4SGVscCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbmRpdGlvbiA9IG5ldyBMaXF1aWQuQ29uZGl0aW9uKCRbMV0sICRbMl0sICRbM10pO1xuICAgICAgICAgIHdoaWxlIChleHByZXNzaW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBvcGVyYXRvciA9IGV4cHJlc3Npb25zLnNoaWZ0KCk7XG4gICAgICAgICAgICBpZiAoIWV4cHJlc3Npb25zLnNoaWZ0KCkubWF0Y2goU3ludGF4KSkge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgTGlxdWlkLlN5bnRheEVycm9yKFN5bnRheEhlbHApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbmV3Q29uZGl0aW9uID0gbmV3IExpcXVpZC5Db25kaXRpb24oJFsxXSwgJFsyXSwgJFszXSk7XG4gICAgICAgICAgICBuZXdDb25kaXRpb25bb3BlcmF0b3JdKGNvbmRpdGlvbik7XG4gICAgICAgICAgICBjb25kaXRpb24gPSBuZXdDb25kaXRpb247XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBjb25kaXRpb247XG4gICAgICAgIH1cbiAgICAgIH0pKCk7XG4gICAgICB0aGlzLmJsb2Nrcy5wdXNoKGJsb2NrKTtcbiAgICAgIHJldHVybiB0aGlzLm5vZGVsaXN0ID0gYmxvY2suYXR0YWNoKFtdKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIElmO1xuXG4gIH0pKExpcXVpZC5CbG9jayk7XG5cbiAgTGlxdWlkLlRlbXBsYXRlLnJlZ2lzdGVyVGFnKFwiaWZcIiwgTGlxdWlkLlRhZ3MuSWYpO1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjExLjFcbihmdW5jdGlvbigpIHtcbiAgdmFyIExpcXVpZCxcbiAgICBleHRlbmQgPSBmdW5jdGlvbihjaGlsZCwgcGFyZW50KSB7IGZvciAodmFyIGtleSBpbiBwYXJlbnQpIHsgaWYgKGhhc1Byb3AuY2FsbChwYXJlbnQsIGtleSkpIGNoaWxkW2tleV0gPSBwYXJlbnRba2V5XTsgfSBmdW5jdGlvbiBjdG9yKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gY2hpbGQ7IH0gY3Rvci5wcm90b3R5cGUgPSBwYXJlbnQucHJvdG90eXBlOyBjaGlsZC5wcm90b3R5cGUgPSBuZXcgY3RvcigpOyBjaGlsZC5fX3N1cGVyX18gPSBwYXJlbnQucHJvdG90eXBlOyByZXR1cm4gY2hpbGQ7IH0sXG4gICAgaGFzUHJvcCA9IHt9Lmhhc093blByb3BlcnR5O1xuXG4gIExpcXVpZCA9IHJlcXVpcmUoJy4uLy4uL2xpcXVpZCcpO1xuXG4gIExpcXVpZC5UYWdzLklmQ2hhbmdlZCA9IChmdW5jdGlvbihzdXBlckNsYXNzKSB7XG4gICAgZXh0ZW5kKElmQ2hhbmdlZCwgc3VwZXJDbGFzcyk7XG5cbiAgICBmdW5jdGlvbiBJZkNoYW5nZWQoKSB7XG4gICAgICByZXR1cm4gSWZDaGFuZ2VkLl9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIElmQ2hhbmdlZC5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oY29udGV4dCkge1xuICAgICAgdmFyIG91dHB1dDtcbiAgICAgIG91dHB1dCA9IFwiXCI7XG4gICAgICBjb250ZXh0LnN0YWNrKChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgb3V0cHV0ID0gX3RoaXMucmVuZGVyQWxsKF90aGlzLm5vZGVsaXN0LCBjb250ZXh0KTtcbiAgICAgICAgICBpZiAob3V0cHV0ICE9PSBjb250ZXh0LnJlZ2lzdGVycy5pZmNoYW5nZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBjb250ZXh0LnJlZ2lzdGVycy5pZmNoYW5nZWQgPSBvdXRwdXQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBvdXRwdXQgPSAnJztcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKSk7XG4gICAgICByZXR1cm4gb3V0cHV0O1xuICAgIH07XG5cbiAgICByZXR1cm4gSWZDaGFuZ2VkO1xuXG4gIH0pKExpcXVpZC5CbG9jayk7XG5cbiAgTGlxdWlkLlRlbXBsYXRlLnJlZ2lzdGVyVGFnKFwiaWZjaGFuZ2VkXCIsIExpcXVpZC5UYWdzLklmQ2hhbmdlZCk7XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuMTEuMVxuKGZ1bmN0aW9uKCkge1xuICB2YXIgSW5jbHVkZSwgTGlxdWlkLFxuICAgIGV4dGVuZCA9IGZ1bmN0aW9uKGNoaWxkLCBwYXJlbnQpIHsgZm9yICh2YXIga2V5IGluIHBhcmVudCkgeyBpZiAoaGFzUHJvcC5jYWxsKHBhcmVudCwga2V5KSkgY2hpbGRba2V5XSA9IHBhcmVudFtrZXldOyB9IGZ1bmN0aW9uIGN0b3IoKSB7IHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDsgfSBjdG9yLnByb3RvdHlwZSA9IHBhcmVudC5wcm90b3R5cGU7IGNoaWxkLnByb3RvdHlwZSA9IG5ldyBjdG9yKCk7IGNoaWxkLl9fc3VwZXJfXyA9IHBhcmVudC5wcm90b3R5cGU7IHJldHVybiBjaGlsZDsgfSxcbiAgICBoYXNQcm9wID0ge30uaGFzT3duUHJvcGVydHk7XG5cbiAgTGlxdWlkID0gcmVxdWlyZSgnLi4vLi4vbGlxdWlkJyk7XG5cbiAgSW5jbHVkZSA9IChmdW5jdGlvbihzdXBlckNsYXNzKSB7XG4gICAgdmFyIFN5bnRheDtcblxuICAgIGV4dGVuZChJbmNsdWRlLCBzdXBlckNsYXNzKTtcblxuICAgIFN5bnRheCA9IFJlZ0V4cChcIihcIiArIExpcXVpZC5TdHJpY3RRdW90ZWRGcmFnbWVudC5zb3VyY2UgKyBcIikoXFxcXHMrKD86d2l0aHxmb3IpXFxcXHMrKFwiICsgTGlxdWlkLlN0cmljdFF1b3RlZEZyYWdtZW50LnNvdXJjZSArIFwiKSk/XCIpO1xuXG4gICAgZnVuY3Rpb24gSW5jbHVkZSh0YWcsIG1hcmt1cCwgdG9rZW5zKSB7XG4gICAgICB2YXIgJDtcbiAgICAgIGlmICgkID0gbWFya3VwLm1hdGNoKFN5bnRheCkpIHtcbiAgICAgICAgdGhpcy50ZW1wbGF0ZU5hbWUgPSAkWzFdO1xuICAgICAgICB0aGlzLnZhcmlhYmxlTmFtZSA9ICRbM107XG4gICAgICAgIHRoaXMuYXR0cmlidXRlcyA9IHt9O1xuICAgICAgICBtYXJrdXAucmVwbGFjZShMaXF1aWQuVGFnQXR0cmlidXRlcywgKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgIHZhciByZWY7XG4gICAgICAgICAgICByZWYgPSBrZXkuc3BsaXQoJzonKSwga2V5ID0gcmVmWzBdLCB2YWx1ZSA9IHJlZlsxXTtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy5hdHRyaWJ1dGVzW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICB9O1xuICAgICAgICB9KSh0aGlzKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgTGlxdWlkLlN5bnRheEVycm9yKFwiRXJyb3IgaW4gdGFnICdpbmNsdWRlJyAtIFZhbGlkIHN5bnRheDogaW5jbHVkZSAnW3RlbXBsYXRlXScgKHdpdGh8Zm9yKSBbb2JqZWN0fGNvbGxlY3Rpb25dXCIpO1xuICAgICAgfVxuICAgICAgSW5jbHVkZS5fX3N1cGVyX18uY29uc3RydWN0b3IuY2FsbCh0aGlzLCB0YWcsIG1hcmt1cCwgdG9rZW5zKTtcbiAgICB9XG5cbiAgICBJbmNsdWRlLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gICAgICB2YXIgb3V0cHV0LCBwYXJ0aWFsLCBzb3VyY2UsIHZhcmlhYmxlO1xuICAgICAgc291cmNlID0gSW5jbHVkZS5yZWFkVGVtcGxhdGVGcm9tRmlsZVN5c3RlbShjb250ZXh0LCB0aGlzLnRlbXBsYXRlTmFtZSk7XG4gICAgICBwYXJ0aWFsID0gTGlxdWlkLlRlbXBsYXRlLnBhcnNlKHNvdXJjZSk7XG4gICAgICB2YXJpYWJsZSA9IGNvbnRleHQuZ2V0KHRoaXMudmFyaWFibGVOYW1lIHx8IHRoaXMudGVtcGxhdGVOYW1lLnNsaWNlKDEsIC0xKSk7XG4gICAgICBvdXRwdXQgPSAnJztcbiAgICAgIGNvbnRleHQuc3RhY2soKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgaSwga2V5LCBsZW4sIHJlZiwgcmVzdWx0cywgdiwgdmFsdWU7XG4gICAgICAgICAgcmVmID0gX3RoaXMuYXR0cmlidXRlcztcbiAgICAgICAgICBmb3IgKGtleSBpbiByZWYpIHtcbiAgICAgICAgICAgIHZhbHVlID0gcmVmW2tleV07XG4gICAgICAgICAgICBjb250ZXh0LnNldChrZXksIGNvbnRleHQuZ2V0KHZhbHVlKSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh2YXJpYWJsZSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICBvdXRwdXQgPSAnJztcbiAgICAgICAgICAgIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IHZhcmlhYmxlLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgIHYgPSB2YXJpYWJsZVtpXTtcbiAgICAgICAgICAgICAgY29udGV4dC5zZXQoX3RoaXMudGVtcGxhdGVOYW1lLnNsaWNlKDEsIC0xKSwgdik7XG4gICAgICAgICAgICAgIHJlc3VsdHMucHVzaChvdXRwdXQgKz0gcGFydGlhbC5yZW5kZXIoY29udGV4dCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnRleHQuc2V0KF90aGlzLnRlbXBsYXRlTmFtZS5zbGljZSgxLCAtMSksIHZhcmlhYmxlKTtcbiAgICAgICAgICAgIHJldHVybiBvdXRwdXQgPSBwYXJ0aWFsLnJlbmRlcihjb250ZXh0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKSk7XG4gICAgICByZXR1cm4gb3V0cHV0O1xuICAgIH07XG5cbiAgICBJbmNsdWRlLnJlYWRUZW1wbGF0ZUZyb21GaWxlU3lzdGVtID0gZnVuY3Rpb24oY29udGV4dCwgdGVtcGxhdGVOYW1lKSB7XG4gICAgICB2YXIgZmlsZVN5c3RlbTtcbiAgICAgIGZpbGVTeXN0ZW0gPSBjb250ZXh0LnJlZ2lzdGVycy5maWxlU3lzdGVtIHx8IExpcXVpZC5UZW1wbGF0ZS5maWxlU3lzdGVtO1xuICAgICAgcmV0dXJuIGZpbGVTeXN0ZW0ucmVhZFRlbXBsYXRlRmlsZShjb250ZXh0LmdldCh0ZW1wbGF0ZU5hbWUpKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIEluY2x1ZGU7XG5cbiAgfSkoTGlxdWlkLlRhZyk7XG5cbiAgTGlxdWlkLlRlbXBsYXRlLnJlZ2lzdGVyVGFnKFwiaW5jbHVkZVwiLCBJbmNsdWRlKTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS4xMS4xXG4oZnVuY3Rpb24oKSB7XG4gIHZhciBMaXF1aWQsXG4gICAgZXh0ZW5kID0gZnVuY3Rpb24oY2hpbGQsIHBhcmVudCkgeyBmb3IgKHZhciBrZXkgaW4gcGFyZW50KSB7IGlmIChoYXNQcm9wLmNhbGwocGFyZW50LCBrZXkpKSBjaGlsZFtrZXldID0gcGFyZW50W2tleV07IH0gZnVuY3Rpb24gY3RvcigpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGNoaWxkOyB9IGN0b3IucHJvdG90eXBlID0gcGFyZW50LnByb3RvdHlwZTsgY2hpbGQucHJvdG90eXBlID0gbmV3IGN0b3IoKTsgY2hpbGQuX19zdXBlcl9fID0gcGFyZW50LnByb3RvdHlwZTsgcmV0dXJuIGNoaWxkOyB9LFxuICAgIGhhc1Byb3AgPSB7fS5oYXNPd25Qcm9wZXJ0eTtcblxuICBMaXF1aWQgPSByZXF1aXJlKCcuLi8uLi9saXF1aWQnKTtcblxuICBMaXF1aWQuVGFncy5JbmNyZW1lbnQgPSAoZnVuY3Rpb24oc3VwZXJDbGFzcykge1xuICAgIGV4dGVuZChJbmNyZW1lbnQsIHN1cGVyQ2xhc3MpO1xuXG4gICAgZnVuY3Rpb24gSW5jcmVtZW50KHRhZ05hbWUsIG1hcmt1cCwgdG9rZW5zKSB7XG4gICAgICB0aGlzLnZhcmlhYmxlID0gbWFya3VwLnRyaW0oKTtcbiAgICAgIEluY3JlbWVudC5fX3N1cGVyX18uY29uc3RydWN0b3IuY2FsbCh0aGlzLCB0YWdOYW1lLCBtYXJrdXAsIHRva2Vucyk7XG4gICAgfVxuXG4gICAgSW5jcmVtZW50LnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gICAgICB2YXIgdmFsdWU7XG4gICAgICBpZiAoY29udGV4dC5zY29wZXNbMF1bdGhpcy52YXJpYWJsZV0gIT0gbnVsbCkge1xuICAgICAgICB2YWx1ZSA9IGNvbnRleHQuc2NvcGVzWzBdW3RoaXMudmFyaWFibGVdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFsdWUgPSBjb250ZXh0LnNjb3Blc1swXVt0aGlzLnZhcmlhYmxlXSA9IC0xO1xuICAgICAgfVxuICAgICAgdmFsdWUgPSB2YWx1ZSArIDE7XG4gICAgICBjb250ZXh0LnNjb3Blc1swXVt0aGlzLnZhcmlhYmxlXSA9IHZhbHVlO1xuICAgICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gICAgfTtcblxuICAgIHJldHVybiBJbmNyZW1lbnQ7XG5cbiAgfSkoTGlxdWlkLlRhZyk7XG5cbiAgTGlxdWlkLlRlbXBsYXRlLnJlZ2lzdGVyVGFnKFwiaW5jcmVtZW50XCIsIExpcXVpZC5UYWdzLkluY3JlbWVudCk7XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuMTEuMVxuKGZ1bmN0aW9uKCkge1xuICB2YXIgTGlxdWlkLFxuICAgIGV4dGVuZCA9IGZ1bmN0aW9uKGNoaWxkLCBwYXJlbnQpIHsgZm9yICh2YXIga2V5IGluIHBhcmVudCkgeyBpZiAoaGFzUHJvcC5jYWxsKHBhcmVudCwga2V5KSkgY2hpbGRba2V5XSA9IHBhcmVudFtrZXldOyB9IGZ1bmN0aW9uIGN0b3IoKSB7IHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDsgfSBjdG9yLnByb3RvdHlwZSA9IHBhcmVudC5wcm90b3R5cGU7IGNoaWxkLnByb3RvdHlwZSA9IG5ldyBjdG9yKCk7IGNoaWxkLl9fc3VwZXJfXyA9IHBhcmVudC5wcm90b3R5cGU7IHJldHVybiBjaGlsZDsgfSxcbiAgICBoYXNQcm9wID0ge30uaGFzT3duUHJvcGVydHk7XG5cbiAgTGlxdWlkID0gcmVxdWlyZSgnLi4vLi4vbGlxdWlkJyk7XG5cbiAgTGlxdWlkLlRhZ3MuUmF3ID0gKGZ1bmN0aW9uKHN1cGVyQ2xhc3MpIHtcbiAgICB2YXIgRnVsbFRva2VuO1xuXG4gICAgZXh0ZW5kKFJhdywgc3VwZXJDbGFzcyk7XG5cbiAgICBGdWxsVG9rZW4gPSBSZWdFeHAoXCJeXCIgKyBMaXF1aWQuVGFnU3RhcnQuc291cmNlICsgXCJcXFxccyooXFxcXHcrKVxcXFxzKiguKik/XCIgKyBMaXF1aWQuVGFnRW5kLnNvdXJjZSArIFwiJFwiKTtcblxuICAgIGZ1bmN0aW9uIFJhdyh0YWcsIG1hcmt1cCwgdG9rZW5zKSB7XG4gICAgICBSYXcuX19zdXBlcl9fLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgdGFnLCBtYXJrdXAsIHRva2Vucyk7XG4gICAgfVxuXG4gICAgUmF3LnByb3RvdHlwZS5wYXJzZSA9IGZ1bmN0aW9uKHRva2Vucykge1xuICAgICAgdmFyICQsIHRva2VuO1xuICAgICAgdGhpcy5ub2RlbGlzdCB8fCAodGhpcy5ub2RlbGlzdCA9IFtdKTtcbiAgICAgIHRoaXMubm9kZWxpc3QubGVuZ3RoID0gMDtcbiAgICAgIHdoaWxlICgodG9rZW4gPSB0b2tlbnMuc2hpZnQoKSkgIT0gbnVsbCkge1xuICAgICAgICBpZiAoJCA9IHRva2VuLm1hdGNoKEZ1bGxUb2tlbikpIHtcbiAgICAgICAgICBpZiAodGhpcy5ibG9ja0RlbGltaXRlciA9PT0gJFsxXSkge1xuICAgICAgICAgICAgdGhpcy5lbmRUYWcoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiB0b2tlbiAhPT0gXCJ1bmRlZmluZWRcIiAmJiB0b2tlbiAhPT0gbnVsbCkge1xuICAgICAgICAgIHRoaXMubm9kZWxpc3QucHVzaCh0b2tlbik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIFJhdztcblxuICB9KShMaXF1aWQuQmxvY2spO1xuXG4gIExpcXVpZC5UZW1wbGF0ZS5yZWdpc3RlclRhZyhcInJhd1wiLCBMaXF1aWQuVGFncy5SYXcpO1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjExLjFcbihmdW5jdGlvbigpIHtcbiAgdmFyIExpcXVpZCxcbiAgICBleHRlbmQgPSBmdW5jdGlvbihjaGlsZCwgcGFyZW50KSB7IGZvciAodmFyIGtleSBpbiBwYXJlbnQpIHsgaWYgKGhhc1Byb3AuY2FsbChwYXJlbnQsIGtleSkpIGNoaWxkW2tleV0gPSBwYXJlbnRba2V5XTsgfSBmdW5jdGlvbiBjdG9yKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gY2hpbGQ7IH0gY3Rvci5wcm90b3R5cGUgPSBwYXJlbnQucHJvdG90eXBlOyBjaGlsZC5wcm90b3R5cGUgPSBuZXcgY3RvcigpOyBjaGlsZC5fX3N1cGVyX18gPSBwYXJlbnQucHJvdG90eXBlOyByZXR1cm4gY2hpbGQ7IH0sXG4gICAgaGFzUHJvcCA9IHt9Lmhhc093blByb3BlcnR5O1xuXG4gIExpcXVpZCA9IHJlcXVpcmUoJy4uLy4uL2xpcXVpZCcpO1xuXG4gIExpcXVpZC5UYWdzLlVubGVzcyA9IChmdW5jdGlvbihzdXBlckNsYXNzKSB7XG4gICAgZXh0ZW5kKFVubGVzcywgc3VwZXJDbGFzcyk7XG5cbiAgICBmdW5jdGlvbiBVbmxlc3MoKSB7XG4gICAgICByZXR1cm4gVW5sZXNzLl9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIFVubGVzcy5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oY29udGV4dCkge1xuICAgICAgdmFyIG91dHB1dDtcbiAgICAgIG91dHB1dCA9ICcnO1xuICAgICAgY29udGV4dC5zdGFjaygoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBibG9jaywgaSwgbGVuLCByZWY7XG4gICAgICAgICAgYmxvY2sgPSBfdGhpcy5ibG9ja3NbMF07XG4gICAgICAgICAgaWYgKCFibG9jay5ldmFsdWF0ZShjb250ZXh0KSkge1xuICAgICAgICAgICAgb3V0cHV0ID0gX3RoaXMucmVuZGVyQWxsKGJsb2NrLmF0dGFjaG1lbnQsIGNvbnRleHQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZWYgPSBfdGhpcy5ibG9ja3Muc2xpY2UoMSk7XG4gICAgICAgICAgZm9yIChpID0gMCwgbGVuID0gcmVmLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBibG9jayA9IHJlZltpXTtcbiAgICAgICAgICAgIGlmIChibG9jay5ldmFsdWF0ZShjb250ZXh0KSkge1xuICAgICAgICAgICAgICBvdXRwdXQgPSBfdGhpcy5yZW5kZXJBbGwoYmxvY2suYXR0YWNobWVudCwgY29udGV4dCk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9O1xuICAgICAgfSkodGhpcykpO1xuICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9O1xuXG4gICAgcmV0dXJuIFVubGVzcztcblxuICB9KShMaXF1aWQuVGFncy5JZik7XG5cbiAgTGlxdWlkLlRlbXBsYXRlLnJlZ2lzdGVyVGFnKFwidW5sZXNzXCIsIExpcXVpZC5UYWdzLlVubGVzcyk7XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuMTEuMVxuKGZ1bmN0aW9uKCkge1xuICB2YXIgTGlxdWlkLFxuICAgIHNsaWNlID0gW10uc2xpY2U7XG5cbiAgTGlxdWlkID0gcmVxdWlyZSgnLi4vbGlxdWlkJyk7XG5cbiAgTGlxdWlkLlRlbXBsYXRlID0gKGZ1bmN0aW9uKCkge1xuICAgIFRlbXBsYXRlLmZpbGVTeXN0ZW0gPSBuZXcgTGlxdWlkLkJsYW5rRmlsZVN5c3RlbSgpO1xuXG4gICAgVGVtcGxhdGUudGFncyA9IHt9O1xuXG4gICAgVGVtcGxhdGUucmVnaXN0ZXJUYWcgPSBmdW5jdGlvbihuYW1lLCBrbGFzcykge1xuICAgICAgcmV0dXJuIExpcXVpZC5UZW1wbGF0ZS50YWdzW25hbWVdID0ga2xhc3M7XG4gICAgfTtcblxuICAgIFRlbXBsYXRlLnJlZ2lzdGVyRmlsdGVyID0gZnVuY3Rpb24obW9kKSB7XG4gICAgICByZXR1cm4gTGlxdWlkLlN0cmFpbmVyLmdsb2JhbEZpbHRlcihtb2QpO1xuICAgIH07XG5cbiAgICBUZW1wbGF0ZS5wYXJzZSA9IGZ1bmN0aW9uKHNvdXJjZSkge1xuICAgICAgdmFyIHRlbXBsYXRlO1xuICAgICAgdGVtcGxhdGUgPSBuZXcgTGlxdWlkLlRlbXBsYXRlO1xuICAgICAgdGVtcGxhdGUucGFyc2Uoc291cmNlKTtcbiAgICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gVGVtcGxhdGUoKSB7XG4gICAgICB0aGlzLnJvb3QgPSBudWxsO1xuICAgICAgdGhpcy5yZWdpc3RlcnMgPSB7fTtcbiAgICAgIHRoaXMuYXNzaWducyA9IHt9O1xuICAgICAgdGhpcy5pbnN0YW5jZUFzc2lnbnMgPSB7fTtcbiAgICAgIHRoaXMuZXJyb3JzID0gW107XG4gICAgICB0aGlzLnJldGhyb3dFcnJvcnMgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBUZW1wbGF0ZS5wcm90b3R5cGUucGFyc2UgPSBmdW5jdGlvbihzcmMpIHtcbiAgICAgIHRoaXMucm9vdCA9IG5ldyBMaXF1aWQuRG9jdW1lbnQoTGlxdWlkLlRlbXBsYXRlLnRva2VuaXplKHNyYykpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIFRlbXBsYXRlLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBhcmdzLCBjb250ZXh0LCBrZXksIGxhc3QsIG9wdGlvbnMsIHJlZiwgcmVzdWx0LCB2YWw7XG4gICAgICBhcmdzID0gMSA8PSBhcmd1bWVudHMubGVuZ3RoID8gc2xpY2UuY2FsbChhcmd1bWVudHMsIDApIDogW107XG4gICAgICBpZiAodGhpcy5yb290ID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiAnJztcbiAgICAgIH1cbiAgICAgIGNvbnRleHQgPSAoZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChhcmdzWzBdIGluc3RhbmNlb2YgTGlxdWlkLkNvbnRleHQpIHtcbiAgICAgICAgICByZXR1cm4gYXJncy5zaGlmdCgpO1xuICAgICAgICB9IGVsc2UgaWYgKGFyZ3NbMF0gaW5zdGFuY2VvZiBPYmplY3QpIHtcbiAgICAgICAgICByZXR1cm4gbmV3IExpcXVpZC5Db250ZXh0KFthcmdzLnNoaWZ0KCksIHRoaXMuYXNzaWduc10sIHRoaXMuaW5zdGFuY2VBc3NpZ25zLCB0aGlzLnJlZ2lzdGVycywgdGhpcy5yZXRocm93RXJyb3JzKTtcbiAgICAgICAgfSBlbHNlIGlmIChhcmdzWzBdID09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gbmV3IExpcXVpZC5Db250ZXh0KHRoaXMuYXNzaWducywgdGhpcy5pbnN0YW5jZUFzc2lnbnMsIHRoaXMucmVnaXN0ZXJzLCB0aGlzLnJldGhyb3dFcnJvcnMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IG5ldyBMaXF1aWQuQXJndW1lbnRFcnJvKFwiRXhwZWN0IEhhc2ggb3IgTGlxdWlkOjpDb250ZXh0IGFzIHBhcmFtZXRlclwiKTtcbiAgICAgICAgfVxuICAgICAgfSkuY2FsbCh0aGlzKTtcbiAgICAgIGxhc3QgPSBhcmdzLmxlbmd0aCAtIDE7XG4gICAgICBpZiAoYXJnc1tsYXN0XSBpbnN0YW5jZW9mIE9iamVjdCkge1xuICAgICAgICBvcHRpb25zID0gYXJncy5wb3AoKTtcbiAgICAgICAgaWYgKCdyZWdpc3RlcnMnIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICByZWYgPSBvcHRpb25zLnJlZ2lzdGVycztcbiAgICAgICAgICBmb3IgKGtleSBpbiByZWYpIHtcbiAgICAgICAgICAgIHZhbCA9IHJlZltrZXldO1xuICAgICAgICAgICAgdGhpcy5yZWdpc3RlcnNba2V5XSA9IHZhbDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdmaWx0ZXJzJyBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgY29udGV4dC5hZGRGaWx0ZXJzKG9wdGlvbnMuZmlsdGVycyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoYXJnc1tsYXN0XSBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgICAgIGNvbnRleHQuYWRkRmlsdGVycyhhcmdzLnBvcCgpKTtcbiAgICAgIH0gZWxzZSBpZiAoYXJnc1tsYXN0XSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgIGNvbnRleHQuYWRkRmlsdGVycyhhcmdzLnBvcCgpKTtcbiAgICAgIH1cbiAgICAgIHRyeSB7XG4gICAgICAgIHJlc3VsdCA9IHRoaXMucm9vdC5yZW5kZXIoY29udGV4dCk7XG4gICAgICAgIGlmIChyZXN1bHQuam9pbiAhPSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdC5qb2luKCcnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICByZXR1cm4gdGhpcy5lcnJvcnMgPSBjb250ZXh0LmVycm9ycztcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgVGVtcGxhdGUucHJvdG90eXBlLnJlbmRlcldpdGhFcnJvcnMgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciByZXMsIHNhdmVkUmV0aHJvd0Vycm9ycztcbiAgICAgIHNhdmVkUmV0aHJvd0Vycm9ycyA9IHRoaXMucmV0aHJvd0Vycm9ycztcbiAgICAgIHRoaXMucmV0aHJvd0Vycm9ycyA9IHRydWU7XG4gICAgICByZXMgPSB0aGlzLnJlbmRlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgdGhpcy5yZXRocm93RXJyb3JzID0gc2F2ZWRSZXRocm93RXJyb3JzO1xuICAgICAgcmV0dXJuIHJlcztcbiAgICB9O1xuXG4gICAgVGVtcGxhdGUudG9rZW5pemUgPSBmdW5jdGlvbihzb3VyY2UpIHtcbiAgICAgIHZhciB0b2tlbnM7XG4gICAgICBpZiAoc291cmNlID09IG51bGwpIHtcbiAgICAgICAgc291cmNlID0gJyc7XG4gICAgICB9XG4gICAgICBpZiAoc291cmNlLnNvdXJjZSAhPSBudWxsKSB7XG4gICAgICAgIHNvdXJjZSA9IHNvdXJjZS5zb3VyY2U7XG4gICAgICB9XG4gICAgICBpZiAoc291cmNlID09PSAnJykge1xuICAgICAgICByZXR1cm4gW107XG4gICAgICB9XG4gICAgICB0b2tlbnMgPSBzb3VyY2Uuc3BsaXQoTGlxdWlkLlRlbXBsYXRlUGFyc2VyKTtcbiAgICAgIGlmICh0b2tlbnNbMF0gPT09ICcnKSB7XG4gICAgICAgIHRva2Vucy5zaGlmdCgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRva2VucztcbiAgICB9O1xuXG4gICAgcmV0dXJuIFRlbXBsYXRlO1xuXG4gIH0pKCk7XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuMTEuMVxuKGZ1bmN0aW9uKCkge1xuICB2YXIgY29tcGFjdCwgZmxhdHRlbjtcblxuICBjb21wYWN0ID0gZnVuY3Rpb24oJHRoaXMpIHtcbiAgICB2YXIgJHRoYXQsIGksIGxlbiwgcmVzdWx0cztcbiAgICByZXN1bHRzID0gW107XG4gICAgZm9yIChpID0gMCwgbGVuID0gJHRoaXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICR0aGF0ID0gJHRoaXNbaV07XG4gICAgICBpZiAoJHRoYXQpIHtcbiAgICAgICAgcmVzdWx0cy5wdXNoKCR0aGF0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgZmxhdHRlbiA9IGZ1bmN0aW9uKCRsaXN0KSB7XG4gICAgdmFyICRhLCAkaXRlbSwgaSwgbGVuO1xuICAgIGlmICgkbGlzdCA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICAgICRhID0gW107XG4gICAgZm9yIChpID0gMCwgbGVuID0gJGxpc3QubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICRpdGVtID0gJGxpc3RbaV07XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheSgkaXRlbSkpIHtcbiAgICAgICAgJGEgPSAkYS5jb25jYXQoZmxhdHRlbigkaXRlbSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgJGEucHVzaCgkaXRlbSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiAkYTtcbiAgfTtcblxuICBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjb21wYWN0OiBjb21wYWN0LFxuICAgIGZsYXR0ZW46IGZsYXR0ZW5cbiAgfTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS4xMS4xXG4oZnVuY3Rpb24oKSB7XG4gIHZhciBMaXF1aWQsXG4gICAgc2xpY2UgPSBbXS5zbGljZTtcblxuICBMaXF1aWQgPSByZXF1aXJlKCcuLi9saXF1aWQnKTtcblxuICBMaXF1aWQuVmFyaWFibGUgPSAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIEZpbHRlclBhcnNlciwgY29tcGFjdCwgZmxhdHRlbiwgcmVmO1xuXG4gICAgRmlsdGVyUGFyc2VyID0gUmVnRXhwKFwiKD86XCIgKyBMaXF1aWQuRmlsdGVyU2VwYXJhdG9yLnNvdXJjZSArIFwifCg/OlxcXFxzKig/ISg/OlwiICsgTGlxdWlkLkZpbHRlclNlcGFyYXRvci5zb3VyY2UgKyBcIikpKD86XCIgKyBMaXF1aWQuUXVvdGVkRnJhZ21lbnQuc291cmNlICsgXCJ8XFxcXFMrKVxcXFxzKikrKVwiKTtcblxuICAgIHJlZiA9IHJlcXVpcmUoJy4vdXRpbCcpLCBjb21wYWN0ID0gcmVmLmNvbXBhY3QsIGZsYXR0ZW4gPSByZWYuZmxhdHRlbjtcblxuICAgIGZ1bmN0aW9uIFZhcmlhYmxlKG1hcmt1cCkge1xuICAgICAgdmFyIGYsIGZpbHRlcmFyZ3MsIGZpbHRlcm5hbWUsIGZpbHRlcnMsIGksIGxlbiwgbWF0Y2gsIG1hdGNoZXM7XG4gICAgICB0aGlzLm1hcmt1cCA9IG1hcmt1cDtcbiAgICAgIHRoaXMubmFtZSA9IG51bGw7XG4gICAgICB0aGlzLmZpbHRlcnMgPSBbXTtcbiAgICAgIGlmIChtYXRjaCA9IG1hcmt1cC5tYXRjaChSZWdFeHAoXCJcXFxccyooXCIgKyBMaXF1aWQuUXVvdGVkRnJhZ21lbnQuc291cmNlICsgXCIpKC4qKVwiKSkpIHtcbiAgICAgICAgdGhpcy5uYW1lID0gbWF0Y2hbMV07XG4gICAgICAgIGlmIChtYXRjaFsyXS5tYXRjaChSZWdFeHAoTGlxdWlkLkZpbHRlclNlcGFyYXRvci5zb3VyY2UgKyBcIlxcXFxzKiguKilcIikpKSB7XG4gICAgICAgICAgZmlsdGVycyA9IG1hdGNoWzJdLm1hdGNoKFJlZ0V4cChcIlwiICsgRmlsdGVyUGFyc2VyLnNvdXJjZSwgXCJnXCIpKTtcbiAgICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSBmaWx0ZXJzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBmID0gZmlsdGVyc1tpXTtcbiAgICAgICAgICAgIGlmIChtYXRjaGVzID0gZi5tYXRjaCgvXFxzKihcXHcrKS8pKSB7XG4gICAgICAgICAgICAgIGZpbHRlcm5hbWUgPSBtYXRjaGVzWzFdO1xuICAgICAgICAgICAgICBmaWx0ZXJhcmdzID0gZi5zcGxpdChSZWdFeHAoXCIoPzpcIiArIExpcXVpZC5GaWx0ZXJBcmd1bWVudFNlcGFyYXRvciArIFwifFwiICsgTGlxdWlkLkFyZ3VtZW50U2VwYXJhdG9yICsgXCIpXFxcXHMqKFwiICsgTGlxdWlkLlF1b3RlZEZyYWdtZW50LnNvdXJjZSArIFwiKVwiKSk7XG4gICAgICAgICAgICAgIGZpbHRlcmFyZ3Muc2hpZnQoKTtcbiAgICAgICAgICAgICAgZmlsdGVyYXJncy5wb3AoKTtcbiAgICAgICAgICAgICAgdGhpcy5maWx0ZXJzLnB1c2goW2ZpbHRlcm5hbWUsIGNvbXBhY3QoZmxhdHRlbihmaWx0ZXJhcmdzKSldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBWYXJpYWJsZS5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oY29udGV4dCkge1xuICAgICAgdmFyIGEsIGUsIGZpbHRlciwgZmlsdGVyYXJncywgaSwgaiwgbGVuLCBsZW4xLCBvdXRwdXQsIHJlZjEsIHJlZjI7XG4gICAgICBpZiAodGhpcy5uYW1lID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgICAgfVxuICAgICAgb3V0cHV0ID0gY29udGV4dC5nZXQodGhpcy5uYW1lKTtcbiAgICAgIHJlZjEgPSB0aGlzLmZpbHRlcnM7XG4gICAgICBmb3IgKGkgPSAwLCBsZW4gPSByZWYxLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGZpbHRlciA9IHJlZjFbaV07XG4gICAgICAgIGZpbHRlcmFyZ3MgPSBbXTtcbiAgICAgICAgcmVmMiA9IGZpbHRlclsxXTtcbiAgICAgICAgZm9yIChqID0gMCwgbGVuMSA9IHJlZjIubGVuZ3RoOyBqIDwgbGVuMTsgaisrKSB7XG4gICAgICAgICAgYSA9IHJlZjJbal07XG4gICAgICAgICAgZmlsdGVyYXJncy5wdXNoKGNvbnRleHQuZ2V0KGEpKTtcbiAgICAgICAgfVxuICAgICAgICB0cnkge1xuICAgICAgICAgIG91dHB1dCA9IGNvbnRleHQuaW52b2tlLmFwcGx5KGNvbnRleHQsIFtmaWx0ZXJbMF0sIG91dHB1dF0uY29uY2F0KHNsaWNlLmNhbGwoZmlsdGVyYXJncykpKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBlID0gZXJyb3I7XG4gICAgICAgICAgdGhyb3cgbmV3IExpcXVpZC5GaWx0ZXJOb3RGb3VuZChcIkVycm9yIC0gZmlsdGVyICdcIiArIGZpbHRlclswXSArIFwiJyBpbiAnXCIgKyAodGhpcy5tYXJrdXAudHJpbSgpKSArIFwiJyBjb3VsZCBub3QgYmUgZm91bmQuXCIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gb3V0cHV0O1xuICAgIH07XG5cbiAgICByZXR1cm4gVmFyaWFibGU7XG5cbiAgfSkoKTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS4xMS4xXG4oZnVuY3Rpb24oKSB7XG4gIHZhciBMaXF1aWQ7XG5cbiAgTGlxdWlkID0gcmVxdWlyZSgnLi4vbGlxdWlkJyk7XG5cbiAgTGlxdWlkLlZFUlNJT04gPSByZXF1aXJlKCcuLi8uLi9wYWNrYWdlLmpzb24nKS52ZXJzaW9uO1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiLy9cbi8vIHN0cmZ0aW1lXG4vLyBnaXRodWIuY29tL3NhbXNvbmpzL3N0cmZ0aW1lXG4vLyBAX3Nqc1xuLy9cbi8vIENvcHlyaWdodCAyMDEwIC0gMjAxMyBTYW1pIFNhbWh1cmkgPHNhbWlAc2FtaHVyaS5uZXQ+XG4vL1xuLy8gTUlUIExpY2Vuc2Vcbi8vIGh0dHA6Ly9zanMubWl0LWxpY2Vuc2Uub3JnXG4vL1xuXG47KGZ1bmN0aW9uKCkge1xuXG4gIC8vLy8gV2hlcmUgdG8gZXhwb3J0IHRoZSBBUElcbiAgdmFyIG5hbWVzcGFjZTtcblxuICAvLyBDb21tb25KUyAvIE5vZGUgbW9kdWxlXG4gIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykge1xuICAgIG5hbWVzcGFjZSA9IG1vZHVsZS5leHBvcnRzID0gc3RyZnRpbWU7XG4gIH1cblxuICAvLyBCcm93c2VycyBhbmQgb3RoZXIgZW52aXJvbm1lbnRzXG4gIGVsc2Uge1xuICAgIC8vIEdldCB0aGUgZ2xvYmFsIG9iamVjdC4gV29ya3MgaW4gRVMzLCBFUzUsIGFuZCBFUzUgc3RyaWN0IG1vZGUuXG4gICAgbmFtZXNwYWNlID0gKGZ1bmN0aW9uKCl7IHJldHVybiB0aGlzIHx8ICgxLGV2YWwpKCd0aGlzJykgfSgpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHdvcmRzKHMpIHsgcmV0dXJuIChzIHx8ICcnKS5zcGxpdCgnICcpOyB9XG5cbiAgdmFyIERlZmF1bHRMb2NhbGUgPVxuICB7IGRheXM6IHdvcmRzKCdTdW5kYXkgTW9uZGF5IFR1ZXNkYXkgV2VkbmVzZGF5IFRodXJzZGF5IEZyaWRheSBTYXR1cmRheScpXG4gICwgc2hvcnREYXlzOiB3b3JkcygnU3VuIE1vbiBUdWUgV2VkIFRodSBGcmkgU2F0JylcbiAgLCBtb250aHM6IHdvcmRzKCdKYW51YXJ5IEZlYnJ1YXJ5IE1hcmNoIEFwcmlsIE1heSBKdW5lIEp1bHkgQXVndXN0IFNlcHRlbWJlciBPY3RvYmVyIE5vdmVtYmVyIERlY2VtYmVyJylcbiAgLCBzaG9ydE1vbnRoczogd29yZHMoJ0phbiBGZWIgTWFyIEFwciBNYXkgSnVuIEp1bCBBdWcgU2VwIE9jdCBOb3YgRGVjJylcbiAgLCBBTTogJ0FNJ1xuICAsIFBNOiAnUE0nXG4gICwgYW06ICdhbSdcbiAgLCBwbTogJ3BtJ1xuICB9O1xuXG4gIG5hbWVzcGFjZS5zdHJmdGltZSA9IHN0cmZ0aW1lO1xuICBmdW5jdGlvbiBzdHJmdGltZShmbXQsIGQsIGxvY2FsZSkge1xuICAgIHJldHVybiBfc3RyZnRpbWUoZm10LCBkLCBsb2NhbGUpO1xuICB9XG5cbiAgLy8gbG9jYWxlIGlzIG9wdGlvbmFsXG4gIG5hbWVzcGFjZS5zdHJmdGltZVRaID0gc3RyZnRpbWUuc3RyZnRpbWVUWiA9IHN0cmZ0aW1lVFo7XG4gIGZ1bmN0aW9uIHN0cmZ0aW1lVFooZm10LCBkLCBsb2NhbGUsIHRpbWV6b25lKSB7XG4gICAgaWYgKHR5cGVvZiBsb2NhbGUgPT0gJ251bWJlcicgJiYgdGltZXpvbmUgPT0gbnVsbCkge1xuICAgICAgdGltZXpvbmUgPSBsb2NhbGU7XG4gICAgICBsb2NhbGUgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiBfc3RyZnRpbWUoZm10LCBkLCBsb2NhbGUsIHsgdGltZXpvbmU6IHRpbWV6b25lIH0pO1xuICB9XG5cbiAgbmFtZXNwYWNlLnN0cmZ0aW1lVVRDID0gc3RyZnRpbWUuc3RyZnRpbWVVVEMgPSBzdHJmdGltZVVUQztcbiAgZnVuY3Rpb24gc3RyZnRpbWVVVEMoZm10LCBkLCBsb2NhbGUpIHtcbiAgICByZXR1cm4gX3N0cmZ0aW1lKGZtdCwgZCwgbG9jYWxlLCB7IHV0YzogdHJ1ZSB9KTtcbiAgfVxuXG4gIG5hbWVzcGFjZS5sb2NhbGl6ZWRTdHJmdGltZSA9IHN0cmZ0aW1lLmxvY2FsaXplZFN0cmZ0aW1lID0gbG9jYWxpemVkU3RyZnRpbWU7XG4gIGZ1bmN0aW9uIGxvY2FsaXplZFN0cmZ0aW1lKGxvY2FsZSkge1xuICAgIHJldHVybiBmdW5jdGlvbihmbXQsIGQsIG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiBzdHJmdGltZShmbXQsIGQsIGxvY2FsZSwgb3B0aW9ucyk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIGQsIGxvY2FsZSwgYW5kIG9wdGlvbnMgYXJlIG9wdGlvbmFsLCBidXQgeW91IGNhbid0IGxlYXZlXG4gIC8vIGhvbGVzIGluIHRoZSBhcmd1bWVudCBsaXN0LiBJZiB5b3UgcGFzcyBvcHRpb25zIHlvdSBoYXZlIHRvIHBhc3NcbiAgLy8gaW4gYWxsIHRoZSBwcmVjZWRpbmcgYXJncyBhcyB3ZWxsLlxuICAvL1xuICAvLyBvcHRpb25zOlxuICAvLyAgIC0gbG9jYWxlICAgW29iamVjdF0gYW4gb2JqZWN0IHdpdGggdGhlIHNhbWUgc3RydWN0dXJlIGFzIERlZmF1bHRMb2NhbGVcbiAgLy8gICAtIHRpbWV6b25lIFtudW1iZXJdIHRpbWV6b25lIG9mZnNldCBpbiBtaW51dGVzIGZyb20gR01UXG4gIGZ1bmN0aW9uIF9zdHJmdGltZShmbXQsIGQsIGxvY2FsZSwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgLy8gZCBhbmQgbG9jYWxlIGFyZSBvcHRpb25hbCBzbyBjaGVjayBpZiBkIGlzIHJlYWxseSB0aGUgbG9jYWxlXG4gICAgaWYgKGQgJiYgIXF1YWNrc0xpa2VEYXRlKGQpKSB7XG4gICAgICBsb2NhbGUgPSBkO1xuICAgICAgZCA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgZCA9IGQgfHwgbmV3IERhdGUoKTtcblxuICAgIGxvY2FsZSA9IGxvY2FsZSB8fCBEZWZhdWx0TG9jYWxlO1xuICAgIGxvY2FsZS5mb3JtYXRzID0gbG9jYWxlLmZvcm1hdHMgfHwge307XG5cbiAgICAvLyBIYW5nIG9uIHRvIHRoaXMgVW5peCB0aW1lc3RhbXAgYmVjYXVzZSB3ZSBtaWdodCBtZXNzIHdpdGggaXQgZGlyZWN0bHkgYmVsb3cuXG4gICAgdmFyIHRpbWVzdGFtcCA9IGQuZ2V0VGltZSgpO1xuXG4gICAgaWYgKG9wdGlvbnMudXRjIHx8IHR5cGVvZiBvcHRpb25zLnRpbWV6b25lID09ICdudW1iZXInKSB7XG4gICAgICBkID0gZGF0ZVRvVVRDKGQpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygb3B0aW9ucy50aW1lem9uZSA9PSAnbnVtYmVyJykge1xuICAgICAgZCA9IG5ldyBEYXRlKGQuZ2V0VGltZSgpICsgKG9wdGlvbnMudGltZXpvbmUgKiA2MDAwMCkpO1xuICAgIH1cblxuICAgIC8vIE1vc3Qgb2YgdGhlIHNwZWNpZmllcnMgc3VwcG9ydGVkIGJ5IEMncyBzdHJmdGltZSwgYW5kIHNvbWUgZnJvbSBSdWJ5LlxuICAgIC8vIFNvbWUgb3RoZXIgc3ludGF4IGV4dGVuc2lvbnMgZnJvbSBSdWJ5IGFyZSBzdXBwb3J0ZWQ6ICUtLCAlXywgYW5kICUwXG4gICAgLy8gdG8gcGFkIHdpdGggbm90aGluZywgc3BhY2UsIG9yIHplcm8gKHJlc3BlY3RpdmVseSkuXG4gICAgcmV0dXJuIGZtdC5yZXBsYWNlKC8lKFstXzBdPy4pL2csIGZ1bmN0aW9uKF8sIGMpIHtcbiAgICAgIHZhciBtb2QsIHBhZGRpbmc7XG4gICAgICBpZiAoYy5sZW5ndGggPT0gMikge1xuICAgICAgICBtb2QgPSBjWzBdO1xuICAgICAgICAvLyBvbWl0IHBhZGRpbmdcbiAgICAgICAgaWYgKG1vZCA9PSAnLScpIHtcbiAgICAgICAgICBwYWRkaW5nID0gJyc7XG4gICAgICAgIH1cbiAgICAgICAgLy8gcGFkIHdpdGggc3BhY2VcbiAgICAgICAgZWxzZSBpZiAobW9kID09ICdfJykge1xuICAgICAgICAgIHBhZGRpbmcgPSAnICc7XG4gICAgICAgIH1cbiAgICAgICAgLy8gcGFkIHdpdGggemVyb1xuICAgICAgICBlbHNlIGlmIChtb2QgPT0gJzAnKSB7XG4gICAgICAgICAgcGFkZGluZyA9ICcwJztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAvLyB1bnJlY29nbml6ZWQsIHJldHVybiB0aGUgZm9ybWF0XG4gICAgICAgICAgcmV0dXJuIF87XG4gICAgICAgIH1cbiAgICAgICAgYyA9IGNbMV07XG4gICAgICB9XG4gICAgICBzd2l0Y2ggKGMpIHtcbiAgICAgICAgY2FzZSAnQSc6IHJldHVybiBsb2NhbGUuZGF5c1tkLmdldERheSgpXTtcbiAgICAgICAgY2FzZSAnYSc6IHJldHVybiBsb2NhbGUuc2hvcnREYXlzW2QuZ2V0RGF5KCldO1xuICAgICAgICBjYXNlICdCJzogcmV0dXJuIGxvY2FsZS5tb250aHNbZC5nZXRNb250aCgpXTtcbiAgICAgICAgY2FzZSAnYic6IHJldHVybiBsb2NhbGUuc2hvcnRNb250aHNbZC5nZXRNb250aCgpXTtcbiAgICAgICAgY2FzZSAnQyc6IHJldHVybiBwYWQoTWF0aC5mbG9vcihkLmdldEZ1bGxZZWFyKCkgLyAxMDApLCBwYWRkaW5nKTtcbiAgICAgICAgY2FzZSAnRCc6IHJldHVybiBfc3RyZnRpbWUobG9jYWxlLmZvcm1hdHMuRCB8fCAnJW0vJWQvJXknLCBkLCBsb2NhbGUpO1xuICAgICAgICBjYXNlICdkJzogcmV0dXJuIHBhZChkLmdldERhdGUoKSwgcGFkZGluZyk7XG4gICAgICAgIGNhc2UgJ2UnOiByZXR1cm4gZC5nZXREYXRlKCk7XG4gICAgICAgIGNhc2UgJ0YnOiByZXR1cm4gX3N0cmZ0aW1lKGxvY2FsZS5mb3JtYXRzLkYgfHwgJyVZLSVtLSVkJywgZCwgbG9jYWxlKTtcbiAgICAgICAgY2FzZSAnSCc6IHJldHVybiBwYWQoZC5nZXRIb3VycygpLCBwYWRkaW5nKTtcbiAgICAgICAgY2FzZSAnaCc6IHJldHVybiBsb2NhbGUuc2hvcnRNb250aHNbZC5nZXRNb250aCgpXTtcbiAgICAgICAgY2FzZSAnSSc6IHJldHVybiBwYWQoaG91cnMxMihkKSwgcGFkZGluZyk7XG4gICAgICAgIGNhc2UgJ2onOlxuICAgICAgICAgIHZhciB5ID0gbmV3IERhdGUoZC5nZXRGdWxsWWVhcigpLCAwLCAxKTtcbiAgICAgICAgICB2YXIgZGF5ID0gTWF0aC5jZWlsKChkLmdldFRpbWUoKSAtIHkuZ2V0VGltZSgpKSAvICgxMDAwICogNjAgKiA2MCAqIDI0KSk7XG4gICAgICAgICAgcmV0dXJuIHBhZChkYXksIDMpO1xuICAgICAgICBjYXNlICdrJzogcmV0dXJuIHBhZChkLmdldEhvdXJzKCksIHBhZGRpbmcgPT0gbnVsbCA/ICcgJyA6IHBhZGRpbmcpO1xuICAgICAgICBjYXNlICdMJzogcmV0dXJuIHBhZChNYXRoLmZsb29yKHRpbWVzdGFtcCAlIDEwMDApLCAzKTtcbiAgICAgICAgY2FzZSAnbCc6IHJldHVybiBwYWQoaG91cnMxMihkKSwgcGFkZGluZyA9PSBudWxsID8gJyAnIDogcGFkZGluZyk7XG4gICAgICAgIGNhc2UgJ00nOiByZXR1cm4gcGFkKGQuZ2V0TWludXRlcygpLCBwYWRkaW5nKTtcbiAgICAgICAgY2FzZSAnbSc6IHJldHVybiBwYWQoZC5nZXRNb250aCgpICsgMSwgcGFkZGluZyk7XG4gICAgICAgIGNhc2UgJ24nOiByZXR1cm4gJ1xcbic7XG4gICAgICAgIGNhc2UgJ28nOiByZXR1cm4gU3RyaW5nKGQuZ2V0RGF0ZSgpKSArIG9yZGluYWwoZC5nZXREYXRlKCkpO1xuICAgICAgICBjYXNlICdQJzogcmV0dXJuIGQuZ2V0SG91cnMoKSA8IDEyID8gbG9jYWxlLmFtIDogbG9jYWxlLnBtO1xuICAgICAgICBjYXNlICdwJzogcmV0dXJuIGQuZ2V0SG91cnMoKSA8IDEyID8gbG9jYWxlLkFNIDogbG9jYWxlLlBNO1xuICAgICAgICBjYXNlICdSJzogcmV0dXJuIF9zdHJmdGltZShsb2NhbGUuZm9ybWF0cy5SIHx8ICclSDolTScsIGQsIGxvY2FsZSk7XG4gICAgICAgIGNhc2UgJ3InOiByZXR1cm4gX3N0cmZ0aW1lKGxvY2FsZS5mb3JtYXRzLnIgfHwgJyVJOiVNOiVTICVwJywgZCwgbG9jYWxlKTtcbiAgICAgICAgY2FzZSAnUyc6IHJldHVybiBwYWQoZC5nZXRTZWNvbmRzKCksIHBhZGRpbmcpO1xuICAgICAgICBjYXNlICdzJzogcmV0dXJuIE1hdGguZmxvb3IodGltZXN0YW1wIC8gMTAwMCk7XG4gICAgICAgIGNhc2UgJ1QnOiByZXR1cm4gX3N0cmZ0aW1lKGxvY2FsZS5mb3JtYXRzLlQgfHwgJyVIOiVNOiVTJywgZCwgbG9jYWxlKTtcbiAgICAgICAgY2FzZSAndCc6IHJldHVybiAnXFx0JztcbiAgICAgICAgY2FzZSAnVSc6IHJldHVybiBwYWQod2Vla051bWJlcihkLCAnc3VuZGF5JyksIHBhZGRpbmcpO1xuICAgICAgICBjYXNlICd1JzpcbiAgICAgICAgICB2YXIgZGF5ID0gZC5nZXREYXkoKTtcbiAgICAgICAgICByZXR1cm4gZGF5ID09IDAgPyA3IDogZGF5OyAvLyAxIC0gNywgTW9uZGF5IGlzIGZpcnN0IGRheSBvZiB0aGUgd2Vla1xuICAgICAgICBjYXNlICd2JzogcmV0dXJuIF9zdHJmdGltZShsb2NhbGUuZm9ybWF0cy52IHx8ICclZS0lYi0lWScsIGQsIGxvY2FsZSk7XG4gICAgICAgIGNhc2UgJ1cnOiByZXR1cm4gcGFkKHdlZWtOdW1iZXIoZCwgJ21vbmRheScpLCBwYWRkaW5nKTtcbiAgICAgICAgY2FzZSAndyc6IHJldHVybiBkLmdldERheSgpOyAvLyAwIC0gNiwgU3VuZGF5IGlzIGZpcnN0IGRheSBvZiB0aGUgd2Vla1xuICAgICAgICBjYXNlICdZJzogcmV0dXJuIGQuZ2V0RnVsbFllYXIoKTtcbiAgICAgICAgY2FzZSAneSc6XG4gICAgICAgICAgdmFyIHkgPSBTdHJpbmcoZC5nZXRGdWxsWWVhcigpKTtcbiAgICAgICAgICByZXR1cm4geS5zbGljZSh5Lmxlbmd0aCAtIDIpO1xuICAgICAgICBjYXNlICdaJzpcbiAgICAgICAgICBpZiAob3B0aW9ucy51dGMpIHtcbiAgICAgICAgICAgIHJldHVybiBcIkdNVFwiO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciB0eiA9IGQudG9TdHJpbmcoKS5tYXRjaCgvXFwoKFxcdyspXFwpLyk7XG4gICAgICAgICAgICByZXR1cm4gdHogJiYgdHpbMV0gfHwgJyc7XG4gICAgICAgICAgfVxuICAgICAgICBjYXNlICd6JzpcbiAgICAgICAgICBpZiAob3B0aW9ucy51dGMpIHtcbiAgICAgICAgICAgIHJldHVybiBcIiswMDAwXCI7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIG9mZiA9IHR5cGVvZiBvcHRpb25zLnRpbWV6b25lID09ICdudW1iZXInID8gb3B0aW9ucy50aW1lem9uZSA6IC1kLmdldFRpbWV6b25lT2Zmc2V0KCk7XG4gICAgICAgICAgICByZXR1cm4gKG9mZiA8IDAgPyAnLScgOiAnKycpICsgcGFkKE1hdGguYWJzKG9mZiAvIDYwKSkgKyBwYWQob2ZmICUgNjApO1xuICAgICAgICAgIH1cbiAgICAgICAgZGVmYXVsdDogcmV0dXJuIGM7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBkYXRlVG9VVEMoZCkge1xuICAgIHZhciBtc0RlbHRhID0gKGQuZ2V0VGltZXpvbmVPZmZzZXQoKSB8fCAwKSAqIDYwMDAwO1xuICAgIHJldHVybiBuZXcgRGF0ZShkLmdldFRpbWUoKSArIG1zRGVsdGEpO1xuICB9XG5cbiAgdmFyIFJlcXVpcmVkRGF0ZU1ldGhvZHMgPSBbJ2dldFRpbWUnLCAnZ2V0VGltZXpvbmVPZmZzZXQnLCAnZ2V0RGF5JywgJ2dldERhdGUnLCAnZ2V0TW9udGgnLCAnZ2V0RnVsbFllYXInLCAnZ2V0WWVhcicsICdnZXRIb3VycycsICdnZXRNaW51dGVzJywgJ2dldFNlY29uZHMnXTtcbiAgZnVuY3Rpb24gcXVhY2tzTGlrZURhdGUoeCkge1xuICAgIHZhciBpID0gMFxuICAgICAgLCBuID0gUmVxdWlyZWREYXRlTWV0aG9kcy5sZW5ndGhcbiAgICAgIDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICBpZiAodHlwZW9mIHhbUmVxdWlyZWREYXRlTWV0aG9kc1tpXV0gIT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLy8gRGVmYXVsdCBwYWRkaW5nIGlzICcwJyBhbmQgZGVmYXVsdCBsZW5ndGggaXMgMiwgYm90aCBhcmUgb3B0aW9uYWwuXG4gIGZ1bmN0aW9uIHBhZChuLCBwYWRkaW5nLCBsZW5ndGgpIHtcbiAgICAvLyBwYWQobiwgPGxlbmd0aD4pXG4gICAgaWYgKHR5cGVvZiBwYWRkaW5nID09PSAnbnVtYmVyJykge1xuICAgICAgbGVuZ3RoID0gcGFkZGluZztcbiAgICAgIHBhZGRpbmcgPSAnMCc7XG4gICAgfVxuXG4gICAgLy8gRGVmYXVsdHMgaGFuZGxlIHBhZChuKSBhbmQgcGFkKG4sIDxwYWRkaW5nPilcbiAgICBpZiAocGFkZGluZyA9PSBudWxsKSB7XG4gICAgICBwYWRkaW5nID0gJzAnO1xuICAgIH1cbiAgICBsZW5ndGggPSBsZW5ndGggfHwgMjtcblxuICAgIHZhciBzID0gU3RyaW5nKG4pO1xuICAgIC8vIHBhZGRpbmcgbWF5IGJlIGFuIGVtcHR5IHN0cmluZywgZG9uJ3QgbG9vcCBmb3JldmVyIGlmIGl0IGlzXG4gICAgaWYgKHBhZGRpbmcpIHtcbiAgICAgIHdoaWxlIChzLmxlbmd0aCA8IGxlbmd0aCkgcyA9IHBhZGRpbmcgKyBzO1xuICAgIH1cbiAgICByZXR1cm4gcztcbiAgfVxuXG4gIGZ1bmN0aW9uIGhvdXJzMTIoZCkge1xuICAgIHZhciBob3VyID0gZC5nZXRIb3VycygpO1xuICAgIGlmIChob3VyID09IDApIGhvdXIgPSAxMjtcbiAgICBlbHNlIGlmIChob3VyID4gMTIpIGhvdXIgLT0gMTI7XG4gICAgcmV0dXJuIGhvdXI7XG4gIH1cblxuICAvLyBHZXQgdGhlIG9yZGluYWwgc3VmZml4IGZvciBhIG51bWJlcjogc3QsIG5kLCByZCwgb3IgdGhcbiAgZnVuY3Rpb24gb3JkaW5hbChuKSB7XG4gICAgdmFyIGkgPSBuICUgMTBcbiAgICAgICwgaWkgPSBuICUgMTAwXG4gICAgICA7XG4gICAgaWYgKChpaSA+PSAxMSAmJiBpaSA8PSAxMykgfHwgaSA9PT0gMCB8fCBpID49IDQpIHtcbiAgICAgIHJldHVybiAndGgnO1xuICAgIH1cbiAgICBzd2l0Y2ggKGkpIHtcbiAgICAgIGNhc2UgMTogcmV0dXJuICdzdCc7XG4gICAgICBjYXNlIDI6IHJldHVybiAnbmQnO1xuICAgICAgY2FzZSAzOiByZXR1cm4gJ3JkJztcbiAgICB9XG4gIH1cblxuICAvLyBmaXJzdFdlZWtkYXk6ICdzdW5kYXknIG9yICdtb25kYXknLCBkZWZhdWx0IGlzICdzdW5kYXknXG4gIC8vXG4gIC8vIFBpbGZlcmVkICYgcG9ydGVkIGZyb20gUnVieSdzIHN0cmZ0aW1lIGltcGxlbWVudGF0aW9uLlxuICBmdW5jdGlvbiB3ZWVrTnVtYmVyKGQsIGZpcnN0V2Vla2RheSkge1xuICAgIGZpcnN0V2Vla2RheSA9IGZpcnN0V2Vla2RheSB8fCAnc3VuZGF5JztcblxuICAgIC8vIFRoaXMgd29ya3MgYnkgc2hpZnRpbmcgdGhlIHdlZWtkYXkgYmFjayBieSBvbmUgZGF5IGlmIHdlXG4gICAgLy8gYXJlIHRyZWF0aW5nIE1vbmRheSBhcyB0aGUgZmlyc3QgZGF5IG9mIHRoZSB3ZWVrLlxuICAgIHZhciB3ZGF5ID0gZC5nZXREYXkoKTtcbiAgICBpZiAoZmlyc3RXZWVrZGF5ID09ICdtb25kYXknKSB7XG4gICAgICBpZiAod2RheSA9PSAwKSAvLyBTdW5kYXlcbiAgICAgICAgd2RheSA9IDY7XG4gICAgICBlbHNlXG4gICAgICAgIHdkYXktLTtcbiAgICB9XG4gICAgdmFyIGZpcnN0RGF5T2ZZZWFyID0gbmV3IERhdGUoZC5nZXRGdWxsWWVhcigpLCAwLCAxKVxuICAgICAgLCB5ZGF5ID0gKGQgLSBmaXJzdERheU9mWWVhcikgLyA4NjQwMDAwMFxuICAgICAgLCB3ZWVrTnVtID0gKHlkYXkgKyA3IC0gd2RheSkgLyA3XG4gICAgICA7XG4gICAgcmV0dXJuIE1hdGguZmxvb3Iod2Vla051bSk7XG4gIH1cblxufSgpKTtcbiIsIm1vZHVsZS5leHBvcnRzPXtcbiAgXCJuYW1lXCI6IFwibGlxdWlkLmNvZmZlZVwiLFxuICBcInZlcnNpb25cIjogXCIwLjEuN1wiLFxuICBcImRlc2NyaXB0aW9uXCI6IFwiUG9ydCBvZiBMaXF1aWQgdG8gQ29mZmVlU2NyaXB0XCIsXG4gIFwia2V5d29yZHNcIjogW1xuICAgIFwiTGlxdWlkXCIsXG4gICAgXCJ0ZW1wbGF0ZXNcIixcbiAgICBcImNvZmZlZS1zY3JpcHRcIlxuICBdLFxuICBcImF1dGhvclwiOiBcImJydWNlIGRhdmlkc29uIDxicnVjZWRhdmlkc29uQGRhcmtvdmVybG9yZG9mZGF0YS5jb20+XCIsXG4gIFwiY29udHJpYnV0b3JzXCI6IFtcbiAgICB7XG4gICAgICBcIm5hbWVcIjogXCJicnVjZSBkYXZpZHNvblwiLFxuICAgICAgXCJlbWFpbFwiOiBcImJydWNlZGF2aWRzb25AZGFya292ZXJsb3Jkb2ZkYXRhLmNvbVwiXG4gICAgfVxuICBdLFxuICBcImRlcGVuZGVuY2llc1wiOiB7XG4gICAgXCJzdHJmdGltZVwiOiBcIn4wLjcuMFwiXG4gIH0sXG4gIFwic2NyaXB0c1wiOiB7XG4gICAgXCJjbGVhblwiOiBcInJpbXJhZiBkaXN0LypcIixcbiAgICBcImJ1aWxkXCI6IFwiY2FrZSBidWlsZFwiLFxuICAgIFwicHJlYnVpbGRcIjogXCJucG0gcnVuIGNsZWFuXCIsXG4gICAgXCJ0ZXN0XCI6IFwiTk9ERV9FTlY9dGVzdCBtb2NoYSAtLWNvbXBpbGVycyBjb2ZmZWU6Y29mZmVlLXNjcmlwdCAtLXJlcXVpcmUgdGVzdC90ZXN0X2hlbHBlci5qcyAtLXJlY3Vyc2l2ZVwiXG4gIH0sXG4gIFwiYmluXCI6IHt9LFxuICBcImRldkRlcGVuZGVuY2llc1wiOiB7XG4gICAgXCJhc3luY1wiOiBcIipcIixcbiAgICBcImNoYWlcIjogXCIqXCIsXG4gICAgXCJjb2ZmZWUtc2NyaXB0XCI6IFwiKlwiLFxuICAgIFwiZ3VscFwiOiBcIl4zLjkuMFwiLFxuICAgIFwiZ3VscC1zaGVsbFwiOiBcIl4wLjQuMlwiLFxuICAgIFwibW9jaGFcIjogXCIqXCIsXG4gICAgXCJxXCI6IFwifjEuMS4xXCIsXG4gICAgXCJyaW1yYWZcIjogXCJeMi40LjJcIlxuICB9LFxuICBcImRpcmVjdG9yaWVzXCI6IHtcbiAgICBcImxpYlwiOiBcIi4vbGliXCIsXG4gICAgXCJleGFtcGxlXCI6IFwiLi9leGFtcGxlXCJcbiAgfSxcbiAgXCJyZXBvc2l0b3J5XCI6IFwiZ2l0Oi8vZ2l0aHViLmNvbS9kYXJrb3ZlcmxvcmRvZmRhdGEvbGlxdWlkLmNvZmZlZVwiLFxuICBcIm1haW5cIjogXCJpbmRleFwiLFxuICBcImVuZ2luZXNcIjoge1xuICAgIFwibm9kZVwiOiBcIj49MC4xMC54XCIsXG4gICAgXCJucG1cIjogXCI+PTEueC54XCJcbiAgfSxcbiAgXCJsaWNlbnNlXCI6IFwiTUlUXCJcbn1cbiJdfQ==
