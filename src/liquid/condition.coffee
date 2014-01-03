#+--------------------------------------------------------------------+
#| condition.coffee
#+--------------------------------------------------------------------+
#| Copyright DarkOverlordOfData (c) 2013
#+--------------------------------------------------------------------+
#|
#| This file is a part of liquid.coffee
#|
#| liquid.coffee is free software; you can copy, modify, and distribute
#| it under the terms of the GNU General Public License Version 3
#|
#+--------------------------------------------------------------------+
#
# Liquid Templates
#
Liquid = require('../liquid')

class Liquid.Condition

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


    hasKey: (l, r) ->
      l[r]?


  #'hasValue': function(l,r) { return l.hasValue(r); }
    hasValue: (l, r) ->
      for p of l
        return true  if l[p] is r
      false


  constructor: (left, operator, right) ->
    @left = left
    @operator = operator
    @right = right
    @childRelation = null
    @childCondition = null
    @attachment = null

  evaluate: (context) ->
    context = context or new Context()
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
