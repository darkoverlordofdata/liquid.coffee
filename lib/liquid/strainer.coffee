#+--------------------------------------------------------------------+
#| strainer.coffee
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
# Liquid.Strainer
#
module.exports = (Liquid) ->

  class Strainer

    @filters = {}
    @globalFilter = (filters) ->
      for f of filters
        Strainer.filters[f] = filters[f]


    # Array of methods to keep...
    @requiredMethods = ["respondTo", "context"]
    @create = (context) ->
      strainer = new Strainer(context)
      for f of Strainer.filters

        #console.log('f', f);
        #console.log('Strainer.filters[f]', Strainer.filters[f]);
        strainer[f] = Strainer.filters[f]
      strainer

    constructor: (context) ->
      @context = context

    respondTo: (methodName) ->
      methodName = methodName.toString()
      return false  if methodName.match(/^__/)
      return false  if Strainer.requiredMethods.include(methodName)

      if @[methodName]? then true else false
      #methodName in @

