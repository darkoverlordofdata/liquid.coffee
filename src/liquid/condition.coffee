#+--------------------------------------------------------------------+
#| condition.coffee
#+--------------------------------------------------------------------+
#| Copyright DarkOverlordOfData (c) 2013
#+--------------------------------------------------------------------+
#|
#| This file is a part of liquid.coffee
#|
#| liquid.coffee is free software; you can copy, modify, and distribute
#| it under the terms of the MIT License
#|
#+--------------------------------------------------------------------+
#
# Liquid Templates
#
Liquid = require('../liquid')

# Container for liquid nodes which conveniently wraps decision making logic
#
# Example:
#
#   c = Condition.new('1', '==', '1')
#   c.evaluate #=> true
#
class Liquid.Condition

  {compact} = require('./util')

  @operators =
    "==":     (l, r) -> l is r
    "=":      (l, r) -> l is r
    "!=":     (l, r) -> l isnt r
    "<>":     (l, r) -> l isnt r
    "<":      (l, r) -> l < r
    ">":      (l, r) -> l > r
    "<=":     (l, r) -> l <= r
    ">=":     (l, r) -> l >= r
    contains: (l, r) -> l.match r
    hasKey:   (l, r) -> l[r]?
    hasValue: (l, r) ->
      for p of l
        return true if l[p] is r
      false


  constructor: (@left, @operator, @right) ->
    @childRelation = null
    @childCondition = null
    @attachment = null

  evaluate: (context = new Liquid.Context) ->
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

  else: ->
    false

  toString: ->
    "#<Condition #{compact([@left, @operator, @right]).join(' ')}>"

  interpretCondition: (left, right, op, context) ->
    # If the operator is empty this means that the decision statement is just
    # a single variable. We can just pull this variable from the context and
    # return this as the result.
    return context.get(left) unless op?
    left = context.get(left)
    right = context.get(right)

    operation = Condition.operators[op] or new Liquid.ArgumentError("Unknown operator #{op}")

    if operation.call?
      operation.call(@, left, right)
    else
      null

class Liquid.ElseCondition extends Liquid.Condition
  else: ->
    true

  evaluate: (context) ->
    true

