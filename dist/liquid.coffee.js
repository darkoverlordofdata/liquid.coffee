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