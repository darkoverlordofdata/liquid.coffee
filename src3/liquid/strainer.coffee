#+--------------------------------------------------------------------+
#| strainer.coffee
#+--------------------------------------------------------------------+
#| Copyright DarkOverlordOfData (c) 2013 - 2014
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
#0

Liquid = require('../liquid')

# Strainer is the parent class for the filters system.
# New filters are mixed into the strainer class which is then instantiated for each liquid template render run.
#
# The Strainer only allows method calls defined in filters given to it via Strainer.global_filter,
# Context#add_filters or Template.register_filter
class Liquid.Strainer

  filters = []
  knownFilters = []
  knownMethods = []

  strainerClassCache = (filters) ->

    class extends Strainer
      for f in filters
        for name, body of f
          @::[name] = body


  constructor: (context) ->
    @context = context

  @globalFilter = (filter) ->
    throw new Liquid.ArgumentError("Passed filter is not a module") unless typeof filter is 'function'
    Strainer.addKnownFilter filter
    Strainer.filters.push filter unless filter in Strainer.filters

  @addKnownFilter = (filter) ->
    unless filter in knownFilters
      methodBlacklist = (name for name of Strainer::)
      newMethods = (name for name of filter when name not in methodBlacklist)
      for name in newMethods
        knownMethods.push name unless name in knownMethods
      knownFilters.push filter

      # Array of methods to keep...
  @create = (context, filters = []) ->
    filters = Strainer.filters.concat(filters)
    new (strainerClassCache(filters))(context)


  invoke: (method, args...) ->
    if @invokable(method)
      @method(args...)
    else
      args[0]

  invokable: (method) ->
    method in knownMethods and typeif @[method] is 'function'