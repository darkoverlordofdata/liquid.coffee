#+--------------------------------------------------------------------+
#| condition.coffee
#+--------------------------------------------------------------------+
#| Copyright DarkOverlordOfData (c) 2012
#+--------------------------------------------------------------------+
#|
#| This file is a part of liquid.coffee
#|
#| liquid.coffee is free software; you can copy, modify, and distribute
#| it under the terms of the GNU General Public License Version 3
#|
#+--------------------------------------------------------------------+
#
# Liquid.Condition
#
module.exports = (Liquid) ->

  class Condition

    @operators =
      "==": (l, r) ->
        l is r

      "=": (l, r) ->
        l is r

      "!=": (l, r) ->
        l isnt r

      "<>": (l, r) ->
        l isnt r

      "<": (l, r) ->
        l < r

      ">": (l, r) ->
        l > r

      "<=": (l, r) ->
        l <= r

      ">=": (l, r) ->
        l >= r

      contains: (l, r) ->
        l.match r


    # HACK Apply from Liquid.extensions.object; extending Object sad.
    #'hasKey': function(l,r) { return l.hasKey(r); }
      hasKey: (l, r) ->
        Liquid.extensions.object.hasKey.call l, r


    #'hasValue': function(l,r) { return l.hasValue(r); }
      hasValue: (l, r) ->
        Liquid.extensions.object.hasValue.call l, r

    constructor: (left, operator, right) ->
      @left = left
      @operator = operator
      @right = right
      @childRelation = null
      @childCondition = null
      @attachment = null

    evaluate: (context) ->
      context = context or new Liquid.Context()
      result = @interpretCondition(@left, @right, @operator, context)
      switch @childRelation
        when "or"
          result or @childCondition.evaluate(context)
        when "and"
          result and @childCondition.evaluate(context)
        else
          result

    or: (condition) ->
      @childRelation = "or"
      @childCondition = condition

    and: (condition) ->
      @childRelation = "and"
      @childCondition = condition

    attach: (attachment) ->
      @attachment = attachment
      @attachment

    isElse: false
    interpretCondition: (left, right, op, context) ->

      # If the operator is empty this means that the decision statement is just
      # a single variable. We can just pull this variable from the context and
      # return this as the result.
      return context.get(left)  unless op
      left = context.get(left)
      right = context.get(right)
      op = Condition.operators[op]
      throw ("Unknown operator " + op)  unless op
      results = op(left, right)
      results

    toString: ->
      "<Condition " + @left + " " + @operator + " " + @right + ">"


  class ElseCondition extends Condition
    isElse: true
    evaluate: (context) ->
      true

    toString: ->
      "<ElseCondition>"

  Liquid.ElseCondition = ElseCondition