#+--------------------------------------------------------------------+
#| strainer.coffee
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
#0

Liquid = require('../liquid')

# Strainer is the parent class for the filters system.
# New filters are mixed into the strainer class which is then instantiated for each liquid template render run.
#
# The Strainer only allows method calls defined in filters given to it via Strainer.global_filter,
# Context#add_filters or Template.register_filter
class Liquid.Strainer

  INTERNAL_METHOD = /^__/
  @requiredMethods = ['respondTo', 'context', 'extend']
  @filters = {}

  constructor: (context) ->
    @context = context

  @globalFilter = (filter) ->
    throw new Liquid.ArgumentError("Passed filter is not a module") unless typeof filter is 'function'
    Strainer.filters[filter.name] = filter


  # Array of methods to keep...
  @create = (context) ->
    strainer = new Strainer(context)
    for k, m of Strainer.filters
      strainer.extend m
    strainer

  respondTo: (methodName) ->
    methodName = methodName.toString()
    return false  if INTERNAL_METHOD.test methodName
    return false  if methodName in Strainer.requiredMethods

    if @[methodName]? then true else false


  extend: (m) ->
    for name, val of m
      @[name] = val unless @[name]?