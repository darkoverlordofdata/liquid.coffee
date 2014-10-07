// Generated by CoffeeScript 1.7.1
(function() {
  var Liquid,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Liquid = require('../liquid');

  Liquid.Interrupt = (function() {
    Interrupt.prototype.message = '';

    function Interrupt(message) {
      this.message = message != null ? message : 'interrupt';
    }

    return Interrupt;

  })();

  Liquid.BreakInterrupt = (function(_super) {
    __extends(BreakInterrupt, _super);

    function BreakInterrupt() {
      return BreakInterrupt.__super__.constructor.apply(this, arguments);
    }

    return BreakInterrupt;

  })(Liquid.Interrupt);

  Liquid.ContinueInterrupt = (function(_super) {
    __extends(ContinueInterrupt, _super);

    function ContinueInterrupt() {
      return ContinueInterrupt.__super__.constructor.apply(this, arguments);
    }

    return ContinueInterrupt;

  })(Liquid.Interrupt);

}).call(this);